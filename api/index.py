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

# Import the FastAPI application directly
try:
    from backend.app.main import app
except ImportError:
    from app.main import app  # type: ignore

__all__ = ["app"]
