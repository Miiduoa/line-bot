# LINE Bot 聊天機器人

一個多功能的 LINE 聊天機器人，具有以下功能：
- 使用 Google Gemini AI 進行對話
- 查詢天氣資訊
- 查詢電影資訊

## 安裝與設定

1. 克隆此專案：
   ```
   git clone <your-repo-url>
   cd <project-folder>
   ```

2. 安裝依賴：
   ```
   npm install
   ```

3. 設定環境變數。複製 `.env.example` 為 `.env` 並填入您的 API 金鑰：
   ```
   # LINE 機器人
   LINE_CHANNEL_SECRET=<你的 LINE_CHANNEL_SECRET>
   LINE_CHANNEL_ACCESS_TOKEN=<你的 LINE_CHANNEL_ACCESS_TOKEN>

   # 天氣查詢 (OpenWeatherMap)
   WEATHER_API_KEY=<你的 OpenWeatherMap API Key>

   # 電影查詢 (TheMovieDB)
   TMDB_API_KEY=<你的 TMDB API Key>

   # Google Gemini
   GEMINI_API_KEY=<你的 Gemini API Key>
   ```

4. 本地運行：
   ```
   npm run dev
   ```

## 部署到 Vercel

1. 安裝 Vercel CLI：
   ```
   npm install -g vercel
   ```

2. 登入 Vercel：
   ```
   vercel login
   ```

3. 部署專案：
   ```
   vercel --prod
   ```

4. 將 Vercel 提供的 URL 設定為 LINE Bot 的 Webhook URL。

## 使用方法

- 一般對話：機器人會使用 Gemini AI 回應
- 查詢天氣：輸入「天氣 城市名稱」，例如「天氣 台北」
- 查詢電影：輸入「電影 電影名稱」，例如「電影 复仇者聯盟」 