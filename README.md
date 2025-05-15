# LINE 機器人

這是一個具有天氣查詢、電影資訊和 AI 聊天功能的 LINE 機器人，使用精美的 Flex Message 介面。

## 功能

- **幫助**: 傳送「幫助」或「help」獲取功能使用說明
- **天氣查詢**: 傳送「天氣 城市名稱」獲取當前天氣，以美觀的卡片呈現
- **電影資訊**: 傳送「電影 電影名稱」獲取電影信息，包含海報和詳細資料
- **AI 對話**: 其他訊息將透過 Google Gemini AI 回應

## 設置步驟

1. 創建 LINE 頻道（在 [LINE Developers](https://developers.line.biz/) 平台）
2. 在 `.env` 檔案中填入你的密鑰：
   ```
   LINE_CHANNEL_SECRET=你的頻道密鑰
   LINE_CHANNEL_ACCESS_TOKEN=你的頻道存取令牌
   WEATHER_API_KEY=你的中央氣象署API授權碼
   TMDB_API_KEY=你的TMDB API密鑰
   GEMINI_API_KEY=你的Google Gemini API密鑰
   ```
3. 安裝相依套件：
   ```
   npm install
   ```
4. 啟動服務：
   ```
   npm start
   ```
5. 使用 ngrok 或其他工具將服務暴露到網際網路，並將 webhook 設定為 `https://你的網域/webhook`

## LINE 頻道設定

1. 在 [LINE Developers](https://developers.line.biz/) 創建一個 Provider
2. 創建一個 Messaging API 頻道
3. 取得 Channel Secret 和 Channel Access Token 填入 `.env` 檔案
4. 設定 Webhook URL 為 `https://你的網域/webhook`
5. 開啟 "Use webhook" 設定
6. 選擇加入好友

## API 申請

- [中央氣象署開放資料平台](https://opendata.cwa.gov.tw/) - 提供台灣天氣資訊
- [TMDB API](https://www.themoviedb.org/documentation/api) - 提供電影資訊
- [Google Gemini API](https://ai.google.dev/gemini) - 提供 AI 聊天功能

## Flex Message

本機器人使用 LINE 的 Flex Message 功能提供豐富的互動體驗：

- 天氣回應：顯示溫度、降雨機率、舒適度和天氣圖示
- 電影回應：顯示電影海報、評分、上映日期和劇情簡介
- 幫助選單：提供快速使用範例和按鈕 