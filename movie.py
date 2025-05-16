import requests

def get_movie(text, cfg):
    query = text.replace('電影','').replace('movie','').strip() or 'Inception'
    url = f'https://api.themoviedb.org/3/search/movie'
    params = {
        'api_key': cfg.TMDB_API_KEY,
        'query': query
    }
    res = requests.get(url, params=params).json()
    
    if not res['results']:
        return '找不到相關電影。'
    
    m = res['results'][0]
    return f"🎬 {m['title']} ({m['release_date']})\n評分：{m['vote_average']}\n簡介：{m['overview']}" 