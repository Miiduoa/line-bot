import requests

def get_news(text, cfg):
    kw = text.replace('新聞','').replace('news','').strip() or 'Taiwan'
    url = 'https://newsapi.org/v2/top-headlines'
    params = {
        'q': kw,
        'apiKey': cfg.NEWSAPI_KEY,
        'pageSize': 3
    }
    res = requests.get(url, params=params).json()
    
    if not res.get('articles'):
        return '目前查無新聞。'
    
    return '\n\n'.join(
        [f"🔹{a['title']}\n{a['url']}" for a in res['articles']]
    ) 