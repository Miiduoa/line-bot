# LINE Bot

一個功能豐富的 LINE 聊天機器人，整合了天氣查詢、電影資訊和 AI 聊天功能。

## 功能特色

- 天氣查詢：使用中央氣象署開放資料平台 API，提供即時天氣資訊
- 電影資訊：透過 TMDB API 查詢電影詳細資料
- AI 聊天：使用 Google Gemini AI 進行智能對話
- 美觀的 Flex Message 介面

## 部署說明

### 1. 前置需求

- [Vercel](https://vercel.com/) 帳號
- [LINE Developers](https://developers.line.biz/) 帳號
- Node.js 18.0.0 或更高版本

### 2. 設定環境變數

在 Vercel 專案設定中，添加以下環境變數：

```
# LINE Bot 設定
LINE_CHANNEL_SECRET=你的LINE Channel Secret
LINE_CHANNEL_ACCESS_TOKEN=你的LINE Channel Access Token

# 天氣查詢 (中央氣象署)
WEATHER_API_KEY=你的中央氣象署API授權碼

# 電影查詢 (TheMovieDB)
TMDB_API_KEY=你的TMDB API Key

# AI 對話 (Google Gemini)
GEMINI_API_KEY=你的Google Gemini API Key
```

### 3. API 申請

- [LINE Messaging API](https://developers.line.biz/) - LINE Bot 功能
- [中央氣象署開放資料平台](https://opendata.cwa.gov.tw/) - 提供台灣天氣資訊
- [The Movie Database (TMDB)](https://www.themoviedb.org/documentation/api) - 電影資料庫
- [Google AI Studio](https://makersuite.google.com/app/apikey) - Gemini AI API

### 4. 部署步驟

1. Fork 此專案到你的 GitHub
2. 在 Vercel 中導入該 GitHub 專案
3. 設定環境變數
4. 部署完成後，複製生成的網址
5. 在 LINE Developers 設定 Webhook URL：
   - 網址格式：`https://你的專案網址/webhook`
   - 開啟 Webhook 功能

### 5. 開始使用

1. 掃描 LINE Bot 的 QR Code 加為好友
2. 試試以下指令：
   - `天氣 臺北` - 查詢台北市天氣
   - `電影 復仇者聯盟` - 查詢電影資訊
   - `help` 或 `幫助` - 顯示功能說明
   - 直接輸入文字與 AI 對話

## 開發相關

### 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

### 專案結構

```
.
├── api/
│   └── webhook.js    # 主要程式碼
├── .env             # 環境變數
├── package.json     # 專案配置
├── vercel.json      # Vercel 配置
└── README.md        # 說明文件
```

## 授權

MIT License 