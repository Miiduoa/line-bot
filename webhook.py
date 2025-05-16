# api/webhook.py
from vercel_wsgi import VercelWsgi
from app import app

# Vercel 看到 handler 就執行 Flask app
handler = VercelWsgi(app) 