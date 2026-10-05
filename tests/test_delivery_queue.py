import json
import tempfile
import unittest
from pathlib import Path

from app import create_app
from src.linebot_core import (
    DeliveryWorker,
    ReplyAction,
    SQLiteDeliveryQueue,
    make_signature,
)


class FakeClock:
    def __init__(self):
        self.value = 0.0

    def __call__(self):
        return self.value


class FakeClient:
    def __init__(self, fail=False):
        self.fail = fail
        self.actions = []

    def reply(self, action):
        if self.fail:
            raise RuntimeError("upstream unavailable")
        self.actions.append(action)


def webhook_payload():
    return {
        "events": [
            {
                "type": "message",
                "webhookEventId": "evt-durable-1",
                "replyToken": "reply-1",
                "source": {"type": "user", "userId": "u-1"},
                "message": {"type": "text", "text": "ping"},
            }
        ]
    }


class DeliveryQueueTests(unittest.TestCase):
    def make_queue(self, root, clock):
        return SQLiteDeliveryQueue(
            Path(root) / "queue.sqlite3",
            clock=clock,
        )

    def test_duplicate_event_is_not_enqueued_twice(self):
        with tempfile.TemporaryDirectory() as td:
            clock = FakeClock()
            queue = self.make_queue(td, clock)
            action = ReplyAction(
                reply_token="r1",
                text="pong",
                event_id="evt-1",
            )

            self.assertTrue(queue.enqueue(action))
            self.assertFalse(queue.enqueue(action))
            self.assertEqual(
                queue.stats(),
                {
                    "seen_events": 1,
                    "pending": 1,
                    "ready": 1,
                    "dead_letters": 0,
                },
            )

    def test_lease_prevents_double_claim_and_recovers(self):
        with tempfile.TemporaryDirectory() as td:
            clock = FakeClock()
            queue = self.make_queue(td, clock)
            queue.enqueue(
                ReplyAction(
                    reply_token="r1",
                    text="pong",
                    event_id="evt-1",
                )
            )

            first = queue.claim(lease_seconds=10)
            second = queue.claim(lease_seconds=10)

            self.assertEqual(len(first), 1)
            self.assertEqual(second, [])

            clock.value = 11
            recovered = queue.claim(lease_seconds=10)
            self.assertEqual(len(recovered), 1)
            self.assertEqual(recovered[0].attempts, 2)

    def test_worker_retries_then_moves_to_dead_letter(self):
        with tempfile.TemporaryDirectory() as td:
            clock = FakeClock()
            queue = self.make_queue(td, clock)
            queue.enqueue(
                ReplyAction(
                    reply_token="r1",
                    text="pong",
                    event_id="evt-1",
                )
            )

            worker = DeliveryWorker(
                queue,
                FakeClient(fail=True),
                max_attempts=2,
                base_delay_seconds=1,
            )

            first = worker.run_once()
            self.assertEqual(first["retried"], 1)
            self.assertEqual(queue.stats()["pending"], 1)

            clock.value = 1
            second = worker.run_once()
            self.assertEqual(second["dead_letters"], 1)
            self.assertEqual(queue.stats()["pending"], 0)
            self.assertEqual(queue.stats()["dead_letters"], 1)

    def test_worker_acknowledges_successful_delivery(self):
        with tempfile.TemporaryDirectory() as td:
            clock = FakeClock()
            queue = self.make_queue(td, clock)
            client = FakeClient()
            queue.enqueue(
                ReplyAction(
                    reply_token="r1",
                    text="pong",
                    event_id="evt-1",
                )
            )

            result = DeliveryWorker(queue, client).run_once()

            self.assertEqual(result["sent"], 1)
            self.assertEqual(len(client.actions), 1)
            self.assertEqual(queue.stats()["pending"], 0)

    def test_persistent_inbox_deduplicates_after_app_restart(self):
        with tempfile.TemporaryDirectory() as td:
            db_path = Path(td) / "queue.sqlite3"
            raw = json.dumps(webhook_payload()).encode("utf-8")
            signature = make_signature(raw, "secret")

            first_client = FakeClient()
            first_queue = SQLiteDeliveryQueue(db_path)
            first_app = create_app(
                channel_secret="secret",
                access_token="token",
                reply_client=first_client,
                delivery_queue=first_queue,
            )
            first_response = first_app.test_client().post(
                "/webhook",
                data=raw,
                headers={
                    "Content-Type": "application/json",
                    "X-Line-Signature": signature,
                },
            )

            self.assertEqual(first_response.status_code, 200)
            self.assertEqual(len(first_client.actions), 1)

            second_client = FakeClient()
            second_queue = SQLiteDeliveryQueue(db_path)
            second_app = create_app(
                channel_secret="secret",
                access_token="token",
                reply_client=second_client,
                delivery_queue=second_queue,
            )
            second_response = second_app.test_client().post(
                "/webhook",
                data=raw,
                headers={
                    "Content-Type": "application/json",
                    "X-Line-Signature": signature,
                },
            )

            self.assertEqual(second_response.status_code, 200)
            self.assertEqual(second_response.get_json()["duplicates"], 1)
            self.assertEqual(second_client.actions, [])


if __name__ == "__main__":
    unittest.main()
