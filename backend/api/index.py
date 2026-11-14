import sys
import os
from urllib.parse import parse_qs

# Determine directory paths
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
root_dir = os.path.dirname(backend_dir)

# Ensure backend modules can be imported
for directory in (backend_dir, root_dir):
    if directory not in sys.path:
        sys.path.insert(0, directory)

# Signal serverless execution environment
os.environ.setdefault("VERCEL", "1")

# Import the FastAPI application directly
try:
    from app.main import app as fastapi_app
except ImportError:
    from backend.app.main import app as fastapi_app

# Vercel ASGI path normalizer
class VercelPathMiddleware:
    def __init__(self, asgi_app):
        self.asgi_app = asgi_app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            query_string = scope.get("query_string", b"").decode("latin1", errors="ignore")
            if "path=" in query_string:
                params = parse_qs(query_string)
                if "path" in params and params["path"]:
                    target_path = params["path"][0]
                    clean = "/" + target_path.strip("/") if target_path.strip("/") else "/"
                    scope["path"] = clean
            elif scope.get("path") in ("/api/index.py", "/api/index", "/index.py"):
                scope["path"] = "/"

        await self.asgi_app(scope, receive, send)

app = VercelPathMiddleware(fastapi_app)
__all__ = ["app"]
