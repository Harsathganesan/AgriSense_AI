import sys
import os
from urllib.parse import parse_qs

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

# Import the FastAPI application
from app.main import app as fastapi_app

# Vercel ASGI path normalizer wrapper
class VercelPathMiddleware:
    def __init__(self, asgi_app):
        self.asgi_app = asgi_app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            query_string = scope.get("query_string", b"").decode("utf-8", errors="ignore")
            path_override = None

            # 1. Check query parameter ?path=...
            if "path=" in query_string:
                params = parse_qs(query_string)
                if "path" in params and params["path"]:
                    path_override = params["path"][0]

            # 2. Check x-forwarded-uri header
            if not path_override:
                headers = dict(scope.get("headers", []))
                fwd_uri = headers.get(b"x-forwarded-uri", b"").decode("utf-8", errors="ignore")
                if fwd_uri:
                    path_override = fwd_uri.split("?")[0]

            # Apply path override if extracted
            if path_override:
                scope["path"] = path_override
            else:
                path = scope.get("path", "")
                if path in ("/api/index.py", "/api/index", "/index.py", "/api/index.py/"):
                    scope["path"] = "/"
                elif path.startswith("/api/index.py/"):
                    scope["path"] = path[len("/api/index.py"):]

        await self.asgi_app(scope, receive, send)

app = VercelPathMiddleware(fastapi_app)
__all__ = ["app"]
