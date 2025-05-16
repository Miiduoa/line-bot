# LINE Bot 多功能助手

一個結合多種功能的 LINE 聊天機器人，包括：

1. 天氣查詢 - 發送「天氣 城市名」可獲取當前天氣狀況
2. 電影資訊 - 發送「電影 電影名」可獲取電影資訊
3. AI 聊天 - 任何其他訊息都會透過 Google Gemini AI 回應

## 安裝與設置

1. 安裝依賴：
   ```
   npm install
   ```

2. 設置環境變數：
   在 `.env` 文件中填入以下資訊
   ```
   LINE_CHANNEL_SECRET=<你的 LINE_CHANNEL_SECRET>
   LINE_CHANNEL_ACCESS_TOKEN=<你的 LINE_CHANNEL_ACCESS_TOKEN>
   WEATHER_API_KEY=<你的 OpenWeatherMap API Key>
   TMDB_API_KEY=<你的 TMDB API Key>
   GEMINI_API_KEY=<你的 Gemini API Key>
   ```

3. 本地開發：
   ```
   npm run dev
   ```

4. 部署到 Vercel：
   ```
   npm run deploy
   ```

## 使用方法

在 LINE 上加入機器人為好友後，可以發送以下訊息：

- `天氣 台北` - 查詢台北市的天氣
- `電影 復仇者聯盟` - 查詢電影《復仇者聯盟》的資訊
- 任何其他訊息 - 會透過 AI 進行回覆 