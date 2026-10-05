import time
from collections import defaultdict, deque
from collections.abc import Callable


class SlidingWindowRateLimiter:
    def __init__(
        self,
        limit: int = 5,
        window_seconds: float = 10,
        clock: Callable[[], float] = time.monotonic,
    ):
        if limit <= 0 or window_seconds <= 0:
            raise ValueError("limit and window_seconds must be positive")

        self.limit = limit
        self.window_seconds = window_seconds
        self.clock = clock
        self._events: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, key: str) -> bool:
        now = self.clock()
        queue = self._events[key]
        cutoff = now - self.window_seconds

        while queue and queue[0] <= cutoff:
            queue.popleft()

        if len(queue) >= self.limit:
            return False

        queue.append(now)
        return True
