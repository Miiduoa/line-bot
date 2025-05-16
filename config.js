// config.js
require('dotenv').config();

module.exports = {
  LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET,
  LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  LINE_CHANNEL_ID: process.env.LINE_CHANNEL_ID,
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
  TMDB_API_KEY: process.env.TMDB_API_KEY,
  NEWSAPI_KEY: process.env.NEWSAPI_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY
}; 