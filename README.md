# LINE Gemini Bot

基於 Google Gemini AI 的 LINE 聊天機器人，具備上下文理解能力，適合部署在 Vercel 平台。

## 功能特點

- 使用 Google Gemini 1.5 Flash 模型進行自然語言處理
- 記住對話歷史，保持上下文連貫性
- 適配 Vercel 平台部署，確保穩定運行

## 設置步驟

### 1. LINE Developer 設置

1. 前往 [LINE Developers Console](https://developers.line.biz/console/)
2. 創建一個新的提供者和頻道（Messaging API）
3. 獲取頻道密鑰（Channel Secret）和頻道訪問令牌（Channel Access Token）
4. 設置 Webhook URL 為你的 Vercel 部署 URL + `/webhook`
   例如：`https://your-vercel-app.vercel.app/webhook`

### 2. Google AI Studio 設置

1. 前往 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 創建一個 API 密鑰
3. 保存 API 密鑰用於下一步

### 3. 本地開發設置

1. 克隆本倉庫
2. 安裝依賴：
   ```
   npm install
   ```
3. 複製 `.env.example` 到 `.env` 並填入你的憑證：
   ```
   LINE_CHANNEL_SECRET=你的LINE頻道密鑰
   LINE_CHANNEL_ACCESS_TOKEN=你的LINE頻道訪問令牌
   GEMINI_API_KEY=你的Google Gemini API密鑰
   PORT=3000
   ```
4. 啟動開發服務器：
   ```
   npm run dev
   ```
5. 使用 ngrok 等工具創建臨時 HTTPS URL 用於開發測試

### 4. Vercel 部署

1. 安裝 Vercel CLI：
   ```
   npm i -g vercel
   ```
2. 登錄 Vercel：
   ```
   vercel login
   ```
3. 部署項目：
   ```
   vercel --prod
   ```
4. 在 Vercel 項目設置中添加環境變量：
   - `LINE_CHANNEL_SECRET`
   - `LINE_CHANNEL_ACCESS_TOKEN`
   - `GEMINI_API_KEY`

5. 在 LINE Developers Console 中更新 Webhook URL 為你的 Vercel 部署 URL + `/webhook`

## 故障排除

- **Webhook 驗證失敗**: 確保 Webhook URL 正確並以 `https://` 開頭
- **機器人無回應**: 檢查環境變量是否正確設置
- **部署問題**: 檢查 Vercel 日誌以獲取更多信息

## 主要文件結構

- `index.js`: 主程序入口
- `.env`: 環境變量配置
- `vercel.json`: Vercel 部署配置

## 注意事項

- 在生產環境中，建議使用數據庫來存儲對話歷史而非內存存儲
- Gemini API 可能有使用限制和收費標準，請參考 Google AI 文檔
- LINE Messaging API 也有使用限制，請查閱 LINE 開發者文檔 