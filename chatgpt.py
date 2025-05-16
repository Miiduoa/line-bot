import requests

def chat_with_gemini(history, cfg):
    url = 'https://gemini.googleapis.com/v1/chat:complete'
    headers = {'Authorization': f"Bearer {cfg.GEMINI_API_KEY}"}
    payload = {
        'model': 'gemini-1.5-turbo',
        'messages': history
    }
    r = requests.post(url, json=payload, headers=headers).json()
    return r['choices'][0]['message']['content'].strip() 