from main import app
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


# Use a2wsgi to convert ASGI app to WSGI for cPanel
try:
    from a2wsgi import ASGIMiddleware
    application = ASGIMiddleware(app)
except ImportError:
    # Fallback to app if a2wsgi is unavailable (will not work for WSGI, so a2wsgi is recommended)
    application = app
