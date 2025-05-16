const axios = require('axios');

async function getWeather(text, cfg) {
  const city = text.replace('天氣', '').replace('weather', '').trim() || 'Taipei';
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${cfg.OPENWEATHER_API_KEY}&units=metric`;
  
  try {
    const response = await axios.get(url);
    const data = response.data;
    return `${data.name} 天氣：${data.weather[0].description}，溫度 ${data.main.temp}°C，濕度 ${data.main.humidity}%`;
  } catch (error) {
    console.error('Weather API error:', error);
    return '無法取得天氣資訊，請稍後再試。';
  }
}

module.exports = {
  getWeather
}; 