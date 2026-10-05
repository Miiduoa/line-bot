# line-bot｜Reliable webhook service

這個 repo 原本累積了 Python / JavaScript 兩套 bot、數個 zip 與不同 API 實驗。現在整理成單一 Python webhook service，重點不再是「接了幾個 API」，而是 webhook 本身是否可靠。

目前流程：

```text
LINE webhook
    ↓
HMAC-SHA256 signature verification
    ↓
JSON parsing
    ↓
event idempotency
    ↓
per-source rate limit
    ↓
command router
    ↓
LINE Reply API
```

## 為什麼先做這些

Webhook 最麻煩的問題通常不是回一句話，而是：

- 偽造 request 能不能進來？
- LINE redelivery 會不會讓同一事件執行兩次？
- 同一個使用者短時間大量觸發怎麼辦？
- domain logic 是否跟 Flask / LINE API 綁死，導致很難測？

所以這個版本把 security、idempotency、rate limiting、routing 與 HTTP adapter 分開。

## Commands

- `help`：列出指令
- `ping`：健康確認
- `echo <text>`：回傳指定文字

未知指令不會丟給外部 LLM，而是回到固定 help 提示。這讓核心 webhook 在沒有第三方 AI API 的情況下也能完整測試。

## 執行

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

export LINE_CHANNEL_SECRET="..."
export LINE_CHANNEL_ACCESS_TOKEN="..."

flask --app app run --port 8000
```

Health check：

```bash
curl http://127.0.0.1:8000/health
```

## 測試

```bash
python -m unittest discover -s tests -v
```

測試覆蓋：

- 正確／錯誤 LINE signature
- idempotency TTL
- rate limiter
- command routing
- redelivery 去重
- Flask webhook 在錯誤簽章時拒絕 request
- 合法 request 能產生 reply action

## 設計選擇

### 不使用 LINE SDK

這版直接實作 LINE 文件定義的 HMAC 驗證與 Reply API HTTP request。不是因為 SDK 不好，而是這個 repo 想把 protocol boundary 看清楚。

### 不把 message body 寫進 log

範例程式不記錄使用者訊息內容，降低不必要的資料留存。

### In-memory state

idempotency 與 rate limit 目前是單 process memory store。正式多 instance 部署應換 Redis 或其他 shared store。

## 限制

- 目前只處理 text message event
- memory idempotency 不適合多 instance
- 沒有 persistence / queue
- 沒有做 outbound retry queue
- rate limit 是簡單 sliding window
- 未宣稱這是 LINE 官方範例或正式 production service
