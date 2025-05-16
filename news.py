import requests

def get_news(text, cfg):
    kw  = text.replace('新聞','').replace('news','').strip() or 'Taiwan'
    url = f'https://newsapi.org/v2/top-headlines?q={kw}&apiKey={cfg.NEWSAPI_KEY}&pageSize=3'
    res = requests.get(url).json()
    if res.get('articles') is None or not res['articles']:
        return '目前查無新聞。'
    return '\n\n'.join(
        [f"🔹{a['title']}\n{a['url']}" for a in res['articles']]
    ) 