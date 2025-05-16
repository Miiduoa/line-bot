import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

CHANNEL_ACCESS_TOKEN = os.getenv('CHANNEL_ACCESS_TOKEN')
CHANNEL_SECRET       = os.getenv('CHANNEL_SECRET')
GOOGLE_GEMINI_KEY    = os.getenv('GOOGLE_GEMINI_KEY')
NEWSAPI_KEY          = os.getenv('NEWSAPI_KEY')
TMDB_API_KEY         = os.getenv('TMDB_API_KEY')
OWM_API_KEY          = os.getenv('OWM_API_KEY') 