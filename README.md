# LINE 機器人

這是一個多功能的 LINE 機器人，可以：
- 查詢天氣（例如：「天氣 台北」）
- 查詢電影資訊（例如：「電影 復仇者聯盟」）
- 與 Google Gemini AI 進行對話

## 本地開發

1. 安裝依賴：
   ```
   npm install
   ```

2. 在 `.env` 文件中填入你的 API 密鑰：
   ```
   LINE_CHANNEL_SECRET=你的LINE頻道密鑰
   LINE_CHANNEL_ACCESS_TOKEN=你的LINE存取令牌
   WEATHER_API_KEY=你的OpenWeatherMap API金鑰
   TMDB_API_KEY=你的TheMovieDB API金鑰
   GEMINI_API_KEY=你的Google Gemini API金鑰
   ```

3. 啟動本地開發服務器：
   ```
   npm run dev
   ```

## 部署到 Vercel

1. 安裝 Vercel CLI：
   ```
   npm i -g vercel
   ```

2. 登入 Vercel：
   ```
   vercel login
   ```

3. 部署：
   ```
   vercel --prod
   ```

4. 在 LINE Developers 控制台中，將 Webhook URL 設定為：
   ```
   https://你的-vercel-域名.vercel.app/api/webhook
   ```

## 注意事項

- 對話歷史記錄儲存在記憶體中，服務器重啟後將丟失
- 確保所有 API 密鑰都有效並且有足夠的配額 