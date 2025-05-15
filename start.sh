#!/bin/bash
# LINE 機器人啟動腳本

# 安裝依賴套件
echo "正在安裝必要套件..."
npm install

# 檢查是否已安裝 ngrok
if ! command -v ngrok &> /dev/null; then
    echo "找不到 ngrok，請先安裝 ngrok"
    echo "安裝方法：https://ngrok.com/download"
    exit 1
fi

# 啟動 LINE 機器人
echo "正在啟動 LINE 機器人服務..."
npm start &
BOT_PID=$!

# 等待服務啟動
sleep 2

# 啟動 ngrok
echo "正在啟動 ngrok..."
ngrok http 3000 &
NGROK_PID=$!

# 顯示使用說明
echo ""
echo "===================================="
echo "LINE 機器人服務已啟動"
echo "請將 ngrok 提供的網址 + /webhook 設為 LINE 的 Webhook URL"
echo "例如：https://xxxx-xxx-xxx-xx-x.ngrok.io/webhook"
echo "===================================="
echo ""
echo "按 Ctrl+C 結束服務"

# 等待使用者中斷
trap "kill $BOT_PID $NGROK_PID; exit" INT TERM
wait 