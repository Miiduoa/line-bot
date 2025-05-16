# LINE Bot on Vercel

這是一個使用 Node.js 開發，並部署在 Vercel 上的 LINE Bot 專案。

## 功能

- 天氣查詢：傳送「天氣 [城市名]」或「weather [city]」可查詢天氣
- 電影查詢：傳送「電影 [電影名]」或「movie [title]」可查詢電影資訊
- 新聞查詢：傳送「新聞 [關鍵字]」或「news [keyword]」可查詢相關新聞
- 智能對話：傳送任何其他訊息，會使用 Google Gemini AI 回應

## 專案結構

```
project-root/
├── .env                  # 環境變數
├── package.json          # 專案配置
├── config.js             # 配置文件
├── api/
│   └── webhook.js        # LINE Webhook 處理 (Vercel Serverless Function)
└── handlers/
    ├── weather.js        # 天氣處理模組
    ├── movie.js          # 電影處理模組
    ├── news.js           # 新聞處理模組
    └── chatgpt.js        # Gemini AI 處理模組
```

## 本地開發

1. 安裝依賴：
```
npm install
```

2. 啟動開發環境：
```
npm run dev
```

## 部署到 Vercel

```
npm run deploy
```

## 環境變數設定

在 Vercel 的專案設定中，添加以下環境變數：

- `LINE_CHANNEL_SECRET`
- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_ID`
- `OPENWEATHER_API_KEY`
- `TMDB_API_KEY`
- `NEWSAPI_KEY`
- `GEMINI_API_KEY` 