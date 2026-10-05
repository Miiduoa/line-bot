import json
import unittest

from app import create_app
from src.linebot_core import (
    MemoryIdempotencyStore,
    SlidingWindowRateLimiter,
    WebhookProcessor,
    make_signature,
    route_text,
    verify_signature,
)


class FakeClock:
    def __init__(self):
        self.value = 0.0

    def __call__(self):
        return self.value


class FakeReplyClient:
    def __init__(self):
        self.actions = []

    def reply(self, action):
        self.actions.append(action)


def payload(event_id="evt-1", text="ping", user_id="u-1", reply_token="r-1"):
    return {
        "events": [
            {
                "type": "message",
                "webhookEventId": event_id,
                "replyToken": reply_token,
                "source": {"type": "user", "userId": user_id},
                "message": {"type": "text", "text": text},
            }
        ]
    }


class CoreTests(unittest.TestCase):
    def test_signature_round_trip(self):
        body = b'{"events":[]}'
        signature = make_signature(body, "secret")

        self.assertTrue(verify_signature(body, signature, "secret"))
        self.assertFalse(verify_signature(body + b"x", signature, "secret"))

    def test_idempotency_expires(self):
        clock = FakeClock()
        store = MemoryIdempotencyStore(ttl_seconds=10, clock=clock)

        self.assertTrue(store.claim("e1"))
        self.assertFalse(store.claim("e1"))

        clock.value = 11
        self.assertTrue(store.claim("e1"))

    def test_rate_limit_slides(self):
        clock = FakeClock()
        limiter = SlidingWindowRateLimiter(
            limit=2,
            window_seconds=10,
            clock=clock,
        )

        self.assertTrue(limiter.allow("u"))
        self.assertTrue(limiter.allow("u"))
        self.assertFalse(limiter.allow("u"))

        clock.value = 11
        self.assertTrue(limiter.allow("u"))

    def test_router(self):
        self.assertEqual(route_text("ping"), "pong")
        self.assertEqual(route_text("echo hello"), "hello")
        self.assertIn("help", route_text("unknown"))

    def test_processor_deduplicates_redelivery(self):
        processor = WebhookProcessor()

        first = processor.process(payload())
        second = processor.process(payload())

        self.assertEqual(len(first), 1)
        self.assertEqual(len(second), 0)

    def test_processor_rate_limits_by_source(self):
        limiter = SlidingWindowRateLimiter(limit=1, window_seconds=10)
        processor = WebhookProcessor(rate_limiter=limiter)

        first = processor.process(payload(event_id="e1"))
        second = processor.process(payload(event_id="e2", reply_token="r2"))

        self.assertEqual(first[0].text, "pong")
        self.assertIn("太快", second[0].text)

    def test_flask_rejects_invalid_signature(self):
        fake = FakeReplyClient()
        app = create_app(
            channel_secret="secret",
            access_token="token",
            reply_client=fake,
        )

        response = app.test_client().post(
            "/webhook",
            data=b'{"events":[]}',
            headers={"X-Line-Signature": "bad"},
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(fake.actions, [])

    def test_flask_accepts_valid_webhook(self):
        fake = FakeReplyClient()
        app = create_app(
            channel_secret="secret",
            access_token="token",
            reply_client=fake,
        )
        raw = json.dumps(payload()).encode("utf-8")

        response = app.test_client().post(
            "/webhook",
            data=raw,
            headers={
                "Content-Type": "application/json",
                "X-Line-Signature": make_signature(raw, "secret"),
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(fake.actions), 1)
        self.assertEqual(fake.actions[0].text, "pong")


if __name__ == "__main__":
    unittest.main()
