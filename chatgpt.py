import requests

def chat_with_gemini(history, cfg):
    url = 'https://gemini.googleapis.com/v1/chat:complete'
    headers = {
        'Authorization': f"Bearer {cfg.GEMINI_API_KEY}",
        'Content-Type': 'application/json'
    }
    
    payload = {
        'model': 'gemini-1.5-turbo',
        'messages': history
    }
    
    try:
        r = requests.post(url, json=payload, headers=headers).json()
        return r['choices'][0]['message']['content'].strip()
    except Exception as e:
        print(f"Gemini API error: {e}")
        return '抱歉，我現在無法回應，請稍後再試。' 