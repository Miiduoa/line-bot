const axios = require('axios');

async function getMovie(text, cfg) {
  const query = text.replace('電影', '').replace('movie', '').trim() || 'Inception';
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${cfg.TMDB_API_KEY}&query=${query}`;
  
  try {
    const response = await axios.get(url);
    const data = response.data;
    
    if (!data.results || data.results.length === 0) {
      return '找不到相關電影。';
    }
    
    const movie = data.results[0];
    return `🎬 ${movie.title} (${movie.release_date})\n評分：${movie.vote_average}\n簡介：${movie.overview}`;
  } catch (error) {
    console.error('Movie API error:', error);
    return '無法取得電影資訊，請稍後再試。';
  }
}

module.exports = {
  getMovie
}; 