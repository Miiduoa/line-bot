import json
import os

from flask import Flask, jsonify, request

from src.linebot_core import (
    DeliveryWorker,
    LineReplyClient,
    SQLiteDeliveryQueue,
    WebhookProcessor,
    verify_signature,
)


def create_app(
    channel_secret: str | None = None,
    access_token: str | None = None,
    processor: WebhookProcessor | None = None,
    reply_client=None,
    delivery_queue: SQLiteDeliveryQueue | None = None,
):
    app = Flask(__name__)

    secret = channel_secret or os.getenv("LINE_CHANNEL_SECRET", "")
    token = access_token or os.getenv("LINE_CHANNEL_ACCESS_TOKEN", "")
    webhook_processor = processor or WebhookProcessor()
    client = reply_client or (LineReplyClient(token) if token else None)

    queue = delivery_queue
    queue_path = os.getenv("LINE_QUEUE_DB", "").strip()
    if queue is None and queue_path:
        queue = SQLiteDeliveryQueue(queue_path)

    @app.get("/health")
    def health():
        payload = {
            "ok": True,
            "configured": bool(secret and client),
            "durable_delivery": queue is not None,
        }
        if queue is not None:
            payload["queue"] = queue.stats()
        return jsonify(payload)

    @app.post("/webhook")
    def webhook():
        if not secret or client is None:
            return jsonify({"error": "service not configured"}), 503

        body = request.get_data(cache=False)
        signature = request.headers.get("X-Line-Signature", "")

        if not verify_signature(body, signature, secret):
            return jsonify({"error": "invalid signature"}), 401

        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            return jsonify({"error": "invalid json"}), 400

        actions = webhook_processor.process(payload)

        if queue is None:
            for action in actions:
                client.reply(action)

            return jsonify({
                "ok": True,
                "actions": len(actions),
                "delivery": "direct",
            })

        queued = 0
        duplicates = 0
        for action in actions:
            if queue.enqueue(action):
                queued += 1
            else:
                duplicates += 1

        delivery = DeliveryWorker(queue, client).run_once(
            limit=max(20, queued)
        )

        return jsonify({
            "ok": True,
            "actions": len(actions),
            "queued": queued,
            "duplicates": duplicates,
            "delivery": delivery,
        })

    return app


app = create_app()
