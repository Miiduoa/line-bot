import argparse
import json
import os
import time

from src.linebot_core import (
    DeliveryWorker,
    LineReplyClient,
    SQLiteDeliveryQueue,
)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Drain persisted LINE reply jobs from SQLite"
    )
    parser.add_argument(
        "--db",
        default=os.getenv("LINE_QUEUE_DB", "data/linebot.sqlite3"),
    )
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--loop", action="store_true")
    parser.add_argument("--interval", type=float, default=2.0)
    args = parser.parse_args()

    token = os.getenv("LINE_CHANNEL_ACCESS_TOKEN", "")
    if not token:
        raise SystemExit("LINE_CHANNEL_ACCESS_TOKEN is required")

    queue = SQLiteDeliveryQueue(args.db)
    worker = DeliveryWorker(
        queue=queue,
        client=LineReplyClient(token),
    )

    while True:
        result = worker.run_once(limit=args.limit)
        print(json.dumps(result, ensure_ascii=False))

        if not args.loop:
            return 0

        time.sleep(max(args.interval, 0.2))


if __name__ == "__main__":
    raise SystemExit(main())
