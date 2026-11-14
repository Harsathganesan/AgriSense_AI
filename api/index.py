import sys
import os
from urllib.parse import parse_qs, urlencode

# Determine directory paths
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(root_dir, "backend")

# Ensure backend modules can be imported
for directory in (root_dir, backend_dir):
    if directory not in sys.path:
        sys.path.insert(0, directory)

# Signal serverless execution environment
os.environ.setdefault("VERCEL", "1")

# Import the FastAPI application directly
try:
    from backend.app.main import app as fastapi_app
except ImportError:
    # pyrefly: ignore[missing-import]
    from app.main import app as fastapi_app

# Vercel ASGI path normalizer
class VercelPathMiddleware:
    def __init__(self, asgi_app):
        self.asgi_app = asgi_app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            query_string = scope.get("query_string", b"").decode("latin1", errors="ignore")
            target_path = None
            if "path=" in query_string:
                params = parse_qs(query_string)
                if "path" in params and params["path"]:
                    target_path = params["path"][0]
                    rem = {k: v for k, v in params.items() if k != "path"}
                    scope["query_string"] = urlencode(rem, doseq=True).encode("latin1")

            if not target_path:
                current_p = scope.get("path", "")
                if current_p in ("/api/index.py", "/api/index", "/index.py"):
                    target_path = "/"
                elif current_p.startswith("/api/index.py/"):
                    target_path = current_p[len("/api/index.py"):]

            if target_path:
                clean = "/" + target_path.strip("/") if target_path.strip("/") else "/"
                scope["path"] = clean
                scope["raw_path"] = clean.encode("latin1")

        await self.asgi_app(scope, receive, send)

app = VercelPathMiddleware(fastapi_app)
__all__ = ["app"]
