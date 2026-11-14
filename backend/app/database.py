import os
import json
import uuid
import copy
import time
import tempfile
from pathlib import Path
from datetime import datetime
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.config import settings

# Serverless environment (e.g. Vercel) has a read-only root; use system tempdir for fallback storage
is_serverless = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))
if is_serverless:
    DATA_STORE_DIR = Path(tempfile.gettempdir()) / "agrisense_data_store"
else:
    DATA_STORE_DIR = Path(__file__).resolve().parent.parent / "data_store"

try:
    DATA_STORE_DIR.mkdir(parents=True, exist_ok=True)
except OSError:
    DATA_STORE_DIR = Path(tempfile.gettempdir()) / "agrisense_data_store"
    DATA_STORE_DIR.mkdir(parents=True, exist_ok=True)

class FallbackCursor:
    def __init__(self, items):
        self.items = items

    def sort(self, key_or_list, direction=1):
        if isinstance(key_or_list, list):
            for key, d in reversed(key_or_list):
                rev = (d == -1)
                self.items.sort(key=lambda x: (x.get(key) is None, x.get(key)), reverse=rev)
        else:
            rev = (direction == -1)
            self.items.sort(key=lambda x: (x.get(key_or_list) is None, x.get(key_or_list)), reverse=rev)
        return self

    def limit(self, count):
        self.items = self.items[:count]
        return self

    def __iter__(self):
        return iter(self.items)

    def to_list(self):
        return list(self.items)

class FallbackCollection:
    def __init__(self, name: str):
        self.name = name
        self.file_path = DATA_STORE_DIR / f"{name}.json"
        self._ensure_file()

    def _ensure_file(self):
        if not self.file_path.exists():
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump([], f)

    def _read_data(self):
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _write_data(self, data):
        with open(self.file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)

    def _match(self, item, query):
        if not query:
            return True
        for k, v in query.items():
            if k == "$or" and isinstance(v, list):
                if not any(self._match(item, subq) for subq in v):
                    return False
                continue
            if isinstance(v, dict):
                # Simple operator checks
                val = item.get(k)
                if "$in" in v and val not in v["$in"]:
                    return False
                if "$gte" in v and (val is None or val < v["$gte"]):
                    return False
                if "$lte" in v and (val is None or val > v["$lte"]):
                    return False
                if "$ne" in v and val == v["$ne"]:
                    return False
            else:
                if item.get(k) != v:
                    return False
        return True

    def find_one(self, query=None):
        data = self._read_data()
        for item in data:
            if self._match(item, query or {}):
                return copy.deepcopy(item)
        return None

    def find(self, query=None):
        data = self._read_data()
        results = [copy.deepcopy(x) for x in data if self._match(x, query or {})]
        return FallbackCursor(results)

    def insert_one(self, doc):
        data = self._read_data()
        new_doc = copy.deepcopy(doc)
        if "_id" not in new_doc:
            new_doc["_id"] = str(uuid.uuid4())
        data.append(new_doc)
        self._write_data(data)
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(new_doc["_id"])

    def insert_many(self, docs):
        data = self._read_data()
        inserted_ids = []
        for d in docs:
            new_doc = copy.deepcopy(d)
            if "_id" not in new_doc:
                new_doc["_id"] = str(uuid.uuid4())
            data.append(new_doc)
            inserted_ids.append(new_doc["_id"])
        self._write_data(data)
        class InsertManyResult:
            def __init__(self, ids):
                self.inserted_ids = ids
        return InsertManyResult(inserted_ids)

    def update_one(self, query, update, upsert=False):
        data = self._read_data()
        matched = False
        class UpdateResult:
            def __init__(self, matched_count, modified_count):
                self.matched_count = matched_count
                self.modified_count = modified_count

        for i, item in enumerate(data):
            if self._match(item, query):
                matched = True
                if "$set" in update:
                    for k, v in update["$set"].items():
                        data[i][k] = v
                else:
                    data[i].update(update)
                self._write_data(data)
                return UpdateResult(1, 1)

        if not matched and upsert:
            new_doc = copy.deepcopy(query)
            if "$set" in update:
                new_doc.update(update["$set"])
            if "_id" not in new_doc:
                new_doc["_id"] = str(uuid.uuid4())
            data.append(new_doc)
            self._write_data(data)
            return UpdateResult(0, 1)

        return UpdateResult(0, 0)

    def delete_one(self, query):
        data = self._read_data()
        for i, item in enumerate(data):
            if self._match(item, query):
                data.pop(i)
                self._write_data(data)
                class DeleteResult:
                    deleted_count = 1
                return DeleteResult()
        class DeleteResult:
            deleted_count = 0
        return DeleteResult()

    def count_documents(self, query=None):
        data = self._read_data()
        return sum(1 for item in data if self._match(item, query or {}))

class DatabaseManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.is_connected_to_mongo = False
        self._fallback_collections = {}
        self._last_error = None
        self._last_attempt_time = 0
        self._init_connection()

    def _init_connection(self):
        self._last_attempt_time = time.time()
        try:
            import certifi
            uri = settings.MONGODB_URI
            if not uri or uri.strip() == "mongodb://localhost:27017":
                uri = "mongodb+srv://harsath137_db_user:9jsMz0qF10EJLDwJ@cluster0.eqwgeh8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

            client_kwargs = {
                "serverSelectionTimeoutMS": 4000,
                "connectTimeoutMS": 4000,
                "socketTimeoutMS": 8000,
                "retryWrites": True,
            }
            try:
                client_kwargs["tlsCAFile"] = certifi.where()
            except Exception:
                pass

            client = MongoClient(uri, **client_kwargs)
            client.admin.command('ping')
            self.client = client
            self.db = client[settings.DATABASE_NAME]
            self.is_connected_to_mongo = True
            self._last_error = None
            print(f"[AgriSense AI] Successfully connected to MongoDB Atlas: {settings.DATABASE_NAME}")

            # Migrate any local fallback records to MongoDB Atlas
            self._sync_fallback_to_mongo()
        except Exception as e:
            self.is_connected_to_mongo = False
            self._last_error = str(e)
            print(f"[AgriSense AI] MongoDB Atlas connection note: ({e}). Using embedded persistent JSON data store.")

    def _sync_fallback_to_mongo(self):
        if not self.is_connected_to_mongo or self.db is None:
            return
        try:
            fallback_users = FallbackCollection("users")._read_data()
            if fallback_users:
                atlas_users = self.db["users"]
                for u in fallback_users:
                    if not atlas_users.find_one({"email": u.get("email")}):
                        atlas_users.insert_one(u)
                        print(f"[AgriSense AI] Synced user to MongoDB Atlas: {u.get('email')}")
            
            fallback_farms = FallbackCollection("farms")._read_data()
            if fallback_farms:
                atlas_farms = self.db["farms"]
                for f in fallback_farms:
                    if not atlas_farms.find_one({"_id": f.get("_id")}):
                        atlas_farms.insert_one(f)
                        print(f"[AgriSense AI] Synced farm to MongoDB Atlas: {f.get('name')}")
        except Exception as e:
            print(f"[AgriSense AI] Data sync note: {e}")

    def get_collection(self, name: str):
        # Re-attempt MongoDB Atlas connection if disconnected (debounce by 10s)
        if not self.is_connected_to_mongo and (time.time() - self._last_attempt_time > 10):
            self._init_connection()

        if self.is_connected_to_mongo and self.db is not None:
            return self.db[name]
        if name not in self._fallback_collections:
            self._fallback_collections[name] = FallbackCollection(name)
        return self._fallback_collections[name]

    def check_connection(self):
        if not self.is_connected_to_mongo:
            self._init_connection()
        else:
            try:
                self.client.admin.command('ping')
            except Exception as e:
                self.is_connected_to_mongo = False
                self._last_error = str(e)

        if self.is_connected_to_mongo and self.db is not None:
            try:
                users_count = self.db["users"].count_documents({})
                farms_count = self.db["farms"].count_documents({})
                return {
                    "connected": True,
                    "database_type": "MongoDB Atlas",
                    "database_name": settings.DATABASE_NAME,
                    "total_users": users_count,
                    "total_farms": farms_count,
                    "status": "healthy"
                }
            except Exception as e:
                return {
                    "connected": False,
                    "database_type": "MongoDB Atlas",
                    "error": str(e),
                    "status": "query_error"
                }
        else:
            return {
                "connected": False,
                "database_type": "Fallback Local Store",
                "last_error": self._last_error,
                "status": "atlas_disconnected",
                "action_required": "Please add 0.0.0.0/0 (Allow Access from Anywhere) in MongoDB Atlas Network Access."
            }

db_manager = DatabaseManager()

def get_collection(name: str):
    return db_manager.get_collection(name)
