import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    LINE_CHANNEL_SECRET    = os.getenv('LINE_CHANNEL_SECRET')
    LINE_CHANNEL_ACCESS_TOKEN = os.getenv('LINE_CHANNEL_ACCESS_TOKEN')
    LINE_CHANNEL_ID        = os.getenv('LINE_CHANNEL_ID')
    OPENWEATHER_API_KEY    = os.getenv('OPENWEATHER_API_KEY')
    TMDB_API_KEY           = os.getenv('TMDB_API_KEY')
    NEWSAPI_KEY            = os.getenv('NEWSAPI_KEY')
    GEMINI_API_KEY         = os.getenv('GEMINI_API_KEY') 