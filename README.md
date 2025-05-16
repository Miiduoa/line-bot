# LINE 聊天機器人

這是一個具有多功能的 LINE 聊天機器人，包括：

- 天氣查詢功能 (使用 OpenWeatherMap API)
- 電影資訊查詢 (使用 TheMovieDB API)
- 聊天對話 (使用 Google Gemini API)

## 使用方法

- 天氣查詢: 發送 `天氣 城市名稱` (例如: `天氣 台北`)
- 電影查詢: 發送 `電影 電影名稱` (例如: `電影 鐵達尼號`)
- 一般對話: 直接發送任何其他訊息

## 部署說明

1. 安裝相依套件:
```
npm install
```

2. 設定環境變數:
- LINE_CHANNEL_SECRET
- LINE_CHANNEL_ACCESS_TOKEN
- WEATHER_API_KEY (OpenWeatherMap)
- TMDB_API_KEY (TheMovieDB)
- GEMINI_API_KEY (Google Gemini)

3. 部署到 Vercel:
```
npm run deploy
```

4. 在 LINE Developers 控制台設定 Webhook URL: `https://你的vercel網址/api/webhook` 