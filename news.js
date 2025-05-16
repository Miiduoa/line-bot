const axios = require('axios');

async function getNews(text, cfg) {
  const keyword = text.replace('新聞', '').replace('news', '').trim() || 'Taiwan';
  const url = `https://newsapi.org/v2/top-headlines?q=${keyword}&apiKey=${cfg.NEWSAPI_KEY}&pageSize=3`;
  
  try {
    const response = await axios.get(url);
    const data = response.data;
    
    if (!data.articles || data.articles.length === 0) {
      return '目前查無新聞。';
    }
    
    return data.articles
      .map(article => `🔹${article.title}\n${article.url}`)
      .join('\n\n');
  } catch (error) {
    console.error('News API error:', error);
    return '無法取得新聞資訊，請稍後再試。';
  }
}

module.exports = {
  getNews
}; 