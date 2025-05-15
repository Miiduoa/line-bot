const NewsAPI = require('newsapi');
const newsapi = new NewsAPI(process.env.NEWS_API_KEY);

// 獲取頭條新聞
async function getTopHeadlines(country = 'tw', category = null, pageSize = 5) {
  try {
    const options = {
      country: country,
      pageSize: pageSize,
      page: 1
    };

    if (category) {
      options.category = category;
    }

    const response = await newsapi.v2.topHeadlines(options);
    return response.articles;
  } catch (error) {
    console.error('獲取頭條新聞時出錯:', error);
    throw error;
  }
}

// 搜尋新聞
async function searchNews(query, pageSize = 5) {
  try {
    const response = await newsapi.v2.everything({
      q: query,
      language: 'zh',
      sortBy: 'publishedAt',
      pageSize: pageSize,
      page: 1
    });
    return response.articles;
  } catch (error) {
    console.error('搜尋新聞時出錯:', error);
    throw error;
  }
}

// 獲取特定類別的新聞
async function getCategoryNews(category, country = 'tw', pageSize = 5) {
  try {
    return await getTopHeadlines(country, category, pageSize);
  } catch (error) {
    console.error(`獲取${category}類別新聞時出錯:`, error);
    throw error;
  }
}

// 新聞類別對應
const newsCategories = {
  '商業': 'business',
  '娛樂': 'entertainment',
  '健康': 'health',
  '科學': 'science',
  '體育': 'sports',
  '科技': 'technology',
  '一般': 'general'
};

// 從中文類別轉換為API需要的英文類別
function getCategoryCode(chineseCategory) {
  return newsCategories[chineseCategory] || 'general';
}

module.exports = {
  getTopHeadlines,
  searchNews,
  getCategoryNews,
  getCategoryCode,
  newsCategories
}; 