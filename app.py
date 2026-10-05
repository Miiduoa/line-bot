import json
import os

from flask import Flask, jsonify, request

from src.linebot_core import LineReplyClient, WebhookProcessor, verify_signature


def create_app(
    channel_secret: str | None = None,
    access_token: str | None = None,
    processor: WebhookProcessor | None = None,
    reply_client=None,
):
    app = Flask(__name__)

    secret = channel_secret or os.getenv("LINE_CHANNEL_SECRET", "")
    token = access_token or os.getenv("LINE_CHANNEL_ACCESS_TOKEN", "")
    webhook_processor = processor or WebhookProcessor()
    client = reply_client or (LineReplyClient(token) if token else None)

    @app.get("/health")
    def health():
        return jsonify({
            "ok": True,
            "configured": bool(secret and client),
        })

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
        for action in actions:
            client.reply(action)

        return jsonify({
            "ok": True,
            "actions": len(actions),
        })

    return app


app = create_app()
