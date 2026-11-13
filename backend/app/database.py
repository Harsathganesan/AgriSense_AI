import os
import json
import uuid
import copy
from pathlib import Path
from datetime import datetime
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.config import settings

DATA_STORE_DIR = Path(__file__).resolve().parent.parent / "data_store"
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
        self._init_connection()

    def _init_connection(self):
        try:
            # Set short timeout to test MongoDB availability
            self.client = MongoClient(
                settings.MONGODB_URI, 
                serverSelectionTimeoutMS=500,
                connectTimeoutMS=500,
                socketTimeoutMS=500
            )
            self.client.admin.command('ping')
            self.db = self.client[settings.DATABASE_NAME]
            self.is_connected_to_mongo = True
            print(f"[AgriSense AI] Successfully connected to MongoDB: {settings.DATABASE_NAME}")
        except Exception as e:
            self.is_connected_to_mongo = False
            print(f"[AgriSense AI] MongoDB not reachable ({e}). Using embedded persistent JSON data store.")

    def get_collection(self, name: str):
        if self.is_connected_to_mongo and self.db is not None:
            return self.db[name]
        if name not in self._fallback_collections:
            self._fallback_collections[name] = FallbackCollection(name)
        return self._fallback_collections[name]

db_manager = DatabaseManager()

def get_collection(name: str):
    return db_manager.get_collection(name)
