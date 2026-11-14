import sys
import os

# Determine directory paths
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)

# Ensure backend modules can be imported
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Signal serverless execution environment
os.environ.setdefault("VERCEL", "1")

# Import the FastAPI application
from app.main import app

# Export app for Vercel Python runtime
__all__ = ["app"]
