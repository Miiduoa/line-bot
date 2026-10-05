from dataclasses import dataclass

from .idempotency import MemoryIdempotencyStore
from .rate_limit import SlidingWindowRateLimiter
from .router import route_text


@dataclass(frozen=True)
class ReplyAction:
    reply_token: str
    text: str


class WebhookProcessor:
    def __init__(
        self,
        idempotency: MemoryIdempotencyStore | None = None,
        rate_limiter: SlidingWindowRateLimiter | None = None,
    ):
        self.idempotency = idempotency or MemoryIdempotencyStore()
        self.rate_limiter = rate_limiter or SlidingWindowRateLimiter()

    def process(self, payload: dict) -> list[ReplyAction]:
        actions = []

        for event in payload.get("events", []):
            if event.get("type") != "message":
                continue

            message = event.get("message", {})
            if message.get("type") != "text":
                continue

            event_id = event.get("webhookEventId", "")
            if not self.idempotency.claim(event_id):
                continue

            source = event.get("source", {})
            source_id = (
                source.get("userId")
                or source.get("groupId")
                or source.get("roomId")
                or "anonymous"
            )

            reply_token = event.get("replyToken", "")
            if not reply_token:
                continue

            if not self.rate_limiter.allow(source_id):
                actions.append(
                    ReplyAction(
                        reply_token=reply_token,
                        text="操作太快，請稍後再試。",
                    )
                )
                continue

            actions.append(
                ReplyAction(
                    reply_token=reply_token,
                    text=route_text(message.get("text", "")),
                )
            )

        return actions
