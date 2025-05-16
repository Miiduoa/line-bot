from flask import Flask, request, abort
from linebot import LineBotApi, WebhookHandler
from linebot.exceptions import InvalidSignatureError
from linebot.models import MessageEvent, TextMessage, TextSendMessage
import config
import handlers.weather as weather_mod
import handlers.movie as movie_mod
import handlers.news as news_mod
import handlers.chatgpt as chatgpt_mod

app = Flask(__name__)
line_api = LineBotApi(config.Config.LINE_CHANNEL_ACCESS_TOKEN)
handler  = WebhookHandler(config.Config.LINE_CHANNEL_SECRET)

# 簡易上下文儲存（正式建議 Redis/DB）
sessions = {}

@app.route("/callback", methods=['POST'])
def callback():
    signature = request.headers.get('X-Line-Signature')
    body      = request.get_data(as_text=True)

    try:
        handler.handle(body, signature)
    except InvalidSignatureError:
        abort(400)
    return 'OK'

@handler.add(MessageEvent, message=TextMessage)
def handle_message(event):
    user_id  = event.source.user_id
    group_id = event.source.group_id or user_id
    text     = event.message.text.strip()

    # 初始化 session
    if group_id not in sessions:
        sessions[group_id] = []

    # 指令判斷
    if text.lower().startswith(('天氣','weather')):
        reply = weather_mod.get_weather(text, config.Config)
    elif text.lower().startswith(('電影','movie')):
        reply = movie_mod.get_movie(text, config.Config)
    elif text.lower().startswith(('新聞','news')):
        reply = news_mod.get_news(text, config.Config)
    else:
        # 搭訕對話：把訊息加到 history，呼叫 Gemini
        sessions[group_id].append({'role':'user','content': text})
        reply = chatgpt_mod.chat_with_gemini(sessions[group_id], config.Config)
        sessions[group_id].append({'role':'assistant','content': reply})
        # 限制歷史長度
        if len(sessions[group_id]) > 20:
            sessions[group_id].pop(0)

    line_api.reply_message(
        event.reply_token,
        TextSendMessage(text=reply)
    )

if __name__ == "__main__":
    app.run(port=3000) 