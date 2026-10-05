# line-bot｜Reliable webhook + durable delivery

[![test](https://github.com/Miiduoa/line-bot/actions/workflows/test.yml/badge.svg)](https://github.com/Miiduoa/line-bot/actions/workflows/test.yml)

這個 repo 不把重點放在「機器人會回什麼」，而是 webhook 在重送、外部 API 失敗與 process restart 時，資料會不會重複或直接消失。

## Flow

直接模式：

```text
LINE webhook
  → HMAC verification
  → event idempotency
  → rate limit
  → command router
  → LINE Reply API
```

設定 `LINE_QUEUE_DB` 後會改成：

```text
LINE webhook
  → verify / parse / route
  → SQLite inbox + outbox
  → immediate delivery attempt
               ↓ fail
        exponential backoff
               ↓ repeated failure
          dead-letter metadata
```

另外可用 `worker.py` 持續 drain 尚未送出的工作。

## Durable delivery

SQLite 裡分成三個概念：

- `inbox_events`：記錄已接受的 `webhookEventId`，process restart 後仍能去重。
- `outbox`：暫存待送出的 reply；claim 時會加 lease，避免同一工作被同時取走。
- `dead_letters`：超過最大重試次數後留下事件 id、attempts、error type 與文字 SHA-256。

dead-letter 不保存回覆全文。因為排查失敗需要證據，但不代表應該永久多留一份使用者相關文字。

## Retry policy

目前 worker：

- claim 時使用 lease
- 失敗採 exponential backoff
- 預設最多 5 次 attempt
- worker crash 後，lease 到期可以重新 claim
- 成功送出後刪除 outbox row
- dead-letter 後刪除原始 outbox payload

這裡是 at-least-once delivery 的小型示範，不宣稱 exactly-once。外部 HTTP API 本身沒有 transaction，所以真正的 exactly-once 不能只靠本地 SQLite 保證。

## Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

export LINE_CHANNEL_SECRET="..."
export LINE_CHANNEL_ACCESS_TOKEN="..."
export LINE_QUEUE_DB="data/linebot.sqlite3"

flask --app app run --port 8000
```

另開 worker：

```bash
python worker.py --loop --interval 2
```

如果不設定 `LINE_QUEUE_DB`，webhook 仍會使用原本的 direct reply 模式，方便本機最小測試。

## Health

```bash
curl http://127.0.0.1:8000/health
```

啟用 durable delivery 時會多回傳：

```json
{
  "durable_delivery": true,
  "queue": {
    "seen_events": 12,
    "pending": 1,
    "ready": 1,
    "dead_letters": 0
  }
}
```

health endpoint 只回數量，不回 message body、reply token 或使用者 ID。

## Tests

```bash
python -m unittest discover -s tests -v
```

目前覆蓋：

- LINE HMAC signature
- memory idempotency TTL
- rate limit
- command routing
- webhook redelivery
- SQLite persistent inbox 去重
- outbox lease 與 crash recovery
- delivery success ack
- retry + exponential backoff
- dead-letter
- Flask durable webhook restart scenario

## Design choices

### SQLite instead of Redis / Kafka

這個作品想驗證的是 durable inbox / outbox、lease、retry 與 dead-letter 語意。單機作品用 SQLite 就能把交易邊界看清楚，也比較容易重現。

如果服務真的需要多 instance、高吞吐量或跨服務事件流，才應該換 PostgreSQL / Redis Streams / message broker，而不是為了作品集硬塞 Kafka。

### Reply token limitation

LINE reply token 有時效，因此 persisted retry 並不能保證「隔很久還能成功」。這個 queue 解決的是短暫 upstream failure 與 process crash，不是假裝能突破外部 API 的時效限制。

## Commands

- `help`
- `ping`
- `echo <text>`

未知指令回固定提示，不把使用者輸入轉送到 LLM。

## License

MIT
