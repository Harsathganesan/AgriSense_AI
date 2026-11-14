import sys
import os

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
            headers = dict(scope.get("headers", []))
            matched_path = headers.get(b"x-matched-path", b"").decode("utf-8")
            if matched_path:
                scope["path"] = matched_path.split("?")[0]

            path = scope.get("path", "")
            if path in ("/api/index.py", "/api/index", "/index.py", "/api/index.py/"):
                scope["path"] = "/"
            elif path.startswith("/api/index.py/"):
                scope["path"] = path[len("/api/index.py"):]

        await self.asgi_app(scope, receive, send)

app = VercelPathMiddleware(fastapi_app)
__all__ = ["app"]
