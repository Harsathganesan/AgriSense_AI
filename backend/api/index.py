import sys
import os

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
    from app.main import app
except ImportError:
    from backend.app.main import app  # type: ignore

__all__ = ["app"]
