from flask import Flask, request, abort
from linebot import LineBotApi, WebhookHandler
from linebot.exceptions import InvalidSignatureError
from linebot.models import MessageEvent, TextMessage, TextSendMessage
import os
import config
import google.generativeai as genai
from pyowm import OWM
from tmdbv3api import TMDb, Movie
from newsapi import NewsApiClient

# Initialize Flask app
app = Flask(__name__)

# Initialize LINE API clients
line_bot_api = LineBotApi(config.CHANNEL_ACCESS_TOKEN)
handler = WebhookHandler(config.CHANNEL_SECRET)

# Initialize weather API client
owm = OWM(config.OWM_API_KEY)
mgr = owm.weather_manager()

# Initialize movie API client
tmdb = TMDb()
tmdb.api_key = config.TMDB_API_KEY
movie = Movie()

# Initialize news API client
newsapi = NewsApiClient(api_key=config.NEWSAPI_KEY)

# Initialize Gemini API
genai.configure(api_key=config.GOOGLE_GEMINI_KEY)

# Simple in-memory storage for chat histories
# Format: {user_id: [message_dicts]}
chat_histories = {}

# Weather function
def get_weather(city: str) -> str:
    try:
        obs = mgr.weather_at_place(city)
        w = obs.weather
        return f"{city} 現在 {w.detailed_status}，溫度 {w.temperature('celsius')['temp']}°C"
    except Exception as e:
        return f"無法獲取 {city} 的天氣資訊：{str(e)}"

# Movie search function
def search_movie(query: str) -> str:
    try:
        res = movie.search(query)
        if not res: 
            return "找不到相關電影。"
        m = res[0]
        return f"{m.title} ({m.release_date[:4]})\n評分: {m.vote_average}/10"
    except Exception as e:
        return f"搜尋電影時發生錯誤：{str(e)}"

# News function
def get_news() -> str:
    try:
        top = newsapi.get_top_headlines(country='tw', page_size=3)
        articles = top['articles']
        if not articles:
            return "無法獲取最新新聞。"
        return "\n\n".join([f"{a['title']}\n{a['url']}" for a in articles])
    except Exception as e:
        return f"獲取新聞時發生錯誤：{str(e)}"

# Gemini AI chat function
def flirt_with_context(text: str, user_id: str) -> str:
    if user_id not in chat_histories:
        chat_histories[user_id] = []
    
    history = chat_histories[user_id]
    
    try:
        # Add the current message to history
        history.append({'role': 'user', 'content': text})
        
        # Limit history to last 10 messages to avoid token limits
        if len(history) > 10:
            history = history[-10:]
            
        # Call Gemini API
        response = genai.chat(
            model='gemini-1.0', 
            messages=history,
            temperature=0.7
        )
        
        # Get the response text
        reply = response.last
        
        # Add AI response to history
        history.append({'role': 'model', 'content': reply})
        
        # Update the history
        chat_histories[user_id] = history
        
        return reply
    except Exception as e:
        return f"AI 對話發生錯誤：{str(e)}"

# Process user input and determine which function to call
def process_user_input(text: str, event) -> str:
    # Get user or group ID
    try:
        user_id = event.source.group_id
    except AttributeError:
        user_id = event.source.user_id
    
    # Check command prefixes
    if text.startswith("天氣 "):
        city = text[3:].strip()
        return get_weather(city)
    
    elif text.startswith("電影 "):
        query = text[3:].strip()
        return search_movie(query)
    
    elif text == "新聞":
        return get_news()
    
    # If no command is detected, use Gemini AI for conversation
    else:
        return flirt_with_context(text, user_id)

# LINE Webhook route
@app.route("/callback", methods=['POST'])
def callback():
    signature = request.headers['X-Line-Signature']
    body = request.get_data(as_text=True)
    
    try:
        handler.handle(body, signature)
    except InvalidSignatureError:
        abort(400)
    
    return 'OK'

# Message event handler
@handler.add(MessageEvent, message=TextMessage)
def handle_message(event):
    user_text = event.message.text
    reply_text = process_user_input(user_text, event)
    line_bot_api.reply_message(event.reply_token, TextSendMessage(text=reply_text))

# Main entry point
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True) 