import time
from collections.abc import Callable


class MemoryIdempotencyStore:
    def __init__(
        self,
        ttl_seconds: float = 3600,
        clock: Callable[[], float] = time.monotonic,
    ):
        self.ttl_seconds = ttl_seconds
        self.clock = clock
        self._expires: dict[str, float] = {}

    def claim(self, event_id: str) -> bool:
        if not event_id:
            return False

        now = self.clock()
        expired = [
            key for key, expires_at in self._expires.items()
            if expires_at <= now
        ]
        for key in expired:
            self._expires.pop(key, None)

        if event_id in self._expires:
            return False

        self._expires[event_id] = now + self.ttl_seconds
        return True
