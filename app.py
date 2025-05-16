from flask import Flask, request, abort
from linebot import LineBotApi, WebhookHandler
from linebot.exceptions import InvalidSignatureError
from linebot.models import MessageEvent, TextMessage, TextSendMessage
from handlers.weather import get_weather
from handlers.movie import get_movie
from handlers.news import get_news
from handlers.chatgpt import chat_with_gemini
import config

app = Flask(__name__)
line_api = LineBotApi(config.Config.LINE_CHANNEL_ACCESS_TOKEN)
parser = WebhookHandler(config.Config.LINE_CHANNEL_SECRET)

# 簡易上下文存放
sessions = {}

@app.route("/", methods=['POST'])
def webhook():   # 注意：VercelWsgi 會把 /api/webhook 對到這裡
    signature = request.headers.get('X-Line-Signature', '')
    body = request.get_data(as_text=True)
    try:
        events = parser.parse(body, signature)
    except InvalidSignatureError:
        abort(400)

    for ev in events:
        if ev.type == 'message' and ev.message.type == 'text':
            text = ev.message.text.strip()
            group = ev.source.group_id or ev.source.user_id
            # 初始化 session
            sessions.setdefault(group, [])

            if text.lower().startswith(('天氣','weather')):
                reply = get_weather(text, config.Config)
            elif text.lower().startswith(('電影','movie')):
                reply = get_movie(text, config.Config)
            elif text.lower().startswith(('新聞','news')):
                reply = get_news(text, config.Config)
            else:
                sessions[group].append({'role':'user','content': text})
                reply = chat_with_gemini(sessions[group], config.Config)
                sessions[group].append({'role':'assistant','content': reply})
                if len(sessions[group]) > 20:
                    sessions[group].pop(0)

            line_api.reply_message(ev.reply_token, TextSendMessage(text=reply))

    return 'OK', 200

if __name__ == "__main__":
    app.run(port=3000) 