import requests

def get_weather(text, cfg):
    city = text.replace('天氣','').replace('weather','').strip() or 'Taipei'
    r = requests.get(
        f'https://api.openweathermap.org/data/2.5/weather',
        params={'q':city, 'appid':cfg.OPENWEATHER_API_KEY, 'units':'metric'}
    ).json()
    return f"{r['name']} 天氣：{r['weather'][0]['description']}，溫度 {r['main']['temp']}°C，濕度 {r['main']['humidity']}%" 