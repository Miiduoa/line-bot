from __future__ import annotations

import hashlib
import sqlite3
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from .processor import ReplyAction


@dataclass(frozen=True)
class DeliveryJob:
    id: int
    event_id: str
    reply_token: str
    text: str
    attempts: int


class SQLiteDeliveryQueue:
    def __init__(
        self,
        path: str | Path,
        clock: Callable[[], float] = time.time,
    ):
        self.path = str(path)
        self.clock = clock

        if self.path != ":memory:":
            Path(self.path).parent.mkdir(parents=True, exist_ok=True)

        self._init_schema()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=5)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    def _init_schema(self) -> None:
        with self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS inbox_events (
                    event_id TEXT PRIMARY KEY,
                    received_at REAL NOT NULL
                );

                CREATE TABLE IF NOT EXISTS outbox (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_id TEXT NOT NULL UNIQUE,
                    reply_token TEXT NOT NULL,
                    text TEXT NOT NULL,
                    attempts INTEGER NOT NULL DEFAULT 0,
                    available_at REAL NOT NULL,
                    lease_until REAL,
                    last_error TEXT,
                    created_at REAL NOT NULL,
                    FOREIGN KEY(event_id) REFERENCES inbox_events(event_id)
                );

                CREATE TABLE IF NOT EXISTS dead_letters (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_id TEXT NOT NULL,
                    attempts INTEGER NOT NULL,
                    failed_at REAL NOT NULL,
                    last_error TEXT NOT NULL,
                    text_sha256 TEXT NOT NULL
                );
                """
            )

    def enqueue(self, action: ReplyAction) -> bool:
        if not action.event_id:
            raise ValueError("action.event_id is required for durable delivery")

        now = self.clock()

        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            cursor = connection.execute(
                """
                INSERT OR IGNORE INTO inbox_events(event_id, received_at)
                VALUES (?, ?)
                """,
                (action.event_id, now),
            )

            if cursor.rowcount == 0:
                connection.rollback()
                return False

            connection.execute(
                """
                INSERT INTO outbox(
                    event_id,
                    reply_token,
                    text,
                    available_at,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    action.event_id,
                    action.reply_token,
                    action.text,
                    now,
                    now,
                ),
            )
            connection.commit()

        return True

    def claim(
        self,
        limit: int = 20,
        lease_seconds: float = 30,
    ) -> list[DeliveryJob]:
        if limit <= 0 or lease_seconds <= 0:
            raise ValueError("limit and lease_seconds must be positive")

        now = self.clock()

        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            rows = connection.execute(
                """
                SELECT id, event_id, reply_token, text, attempts
                FROM outbox
                WHERE available_at <= ?
                  AND (lease_until IS NULL OR lease_until <= ?)
                ORDER BY id
                LIMIT ?
                """,
                (now, now, limit),
            ).fetchall()

            jobs = []
            for row in rows:
                attempts = row["attempts"] + 1
                connection.execute(
                    """
                    UPDATE outbox
                    SET attempts = ?, lease_until = ?
                    WHERE id = ?
                    """,
                    (attempts, now + lease_seconds, row["id"]),
                )
                jobs.append(
                    DeliveryJob(
                        id=row["id"],
                        event_id=row["event_id"],
                        reply_token=row["reply_token"],
                        text=row["text"],
                        attempts=attempts,
                    )
                )

            connection.commit()

        return jobs

    def ack(self, job_id: int) -> None:
        with self._connect() as connection:
            connection.execute("DELETE FROM outbox WHERE id = ?", (job_id,))

    def fail(
        self,
        job_id: int,
        error: str,
        max_attempts: int = 5,
        base_delay_seconds: float = 1,
    ) -> str:
        if max_attempts <= 0 or base_delay_seconds <= 0:
            raise ValueError("retry settings must be positive")

        now = self.clock()
        safe_error = str(error).replace("\n", " ")[:300]

        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                """
                SELECT event_id, text, attempts
                FROM outbox
                WHERE id = ?
                """,
                (job_id,),
            ).fetchone()

            if row is None:
                connection.rollback()
                return "missing"

            if row["attempts"] >= max_attempts:
                text_hash = hashlib.sha256(
                    row["text"].encode("utf-8")
                ).hexdigest()
                connection.execute(
                    """
                    INSERT INTO dead_letters(
                        event_id,
                        attempts,
                        failed_at,
                        last_error,
                        text_sha256
                    )
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        row["event_id"],
                        row["attempts"],
                        now,
                        safe_error,
                        text_hash,
                    ),
                )
                connection.execute(
                    "DELETE FROM outbox WHERE id = ?",
                    (job_id,),
                )
                connection.commit()
                return "dead_letter"

            delay = base_delay_seconds * (2 ** max(row["attempts"] - 1, 0))
            connection.execute(
                """
                UPDATE outbox
                SET available_at = ?,
                    lease_until = NULL,
                    last_error = ?
                WHERE id = ?
                """,
                (now + delay, safe_error, job_id),
            )
            connection.commit()
            return "retry"

    def stats(self) -> dict[str, int]:
        now = self.clock()
        with self._connect() as connection:
            pending = connection.execute(
                "SELECT COUNT(*) FROM outbox"
            ).fetchone()[0]
            ready = connection.execute(
                """
                SELECT COUNT(*)
                FROM outbox
                WHERE available_at <= ?
                  AND (lease_until IS NULL OR lease_until <= ?)
                """,
                (now, now),
            ).fetchone()[0]
            dead = connection.execute(
                "SELECT COUNT(*) FROM dead_letters"
            ).fetchone()[0]
            seen = connection.execute(
                "SELECT COUNT(*) FROM inbox_events"
            ).fetchone()[0]

        return {
            "seen_events": seen,
            "pending": pending,
            "ready": ready,
            "dead_letters": dead,
        }


class DeliveryWorker:
    def __init__(
        self,
        queue: SQLiteDeliveryQueue,
        client,
        max_attempts: int = 5,
        base_delay_seconds: float = 1,
    ):
        self.queue = queue
        self.client = client
        self.max_attempts = max_attempts
        self.base_delay_seconds = base_delay_seconds

    def run_once(self, limit: int = 20) -> dict[str, int]:
        result = {
            "claimed": 0,
            "sent": 0,
            "retried": 0,
            "dead_letters": 0,
        }

        jobs = self.queue.claim(limit=limit)
        result["claimed"] = len(jobs)

        for job in jobs:
            action = ReplyAction(
                reply_token=job.reply_token,
                text=job.text,
                event_id=job.event_id,
            )
            try:
                self.client.reply(action)
            except Exception as exc:
                outcome = self.queue.fail(
                    job.id,
                    error=exc.__class__.__name__,
                    max_attempts=self.max_attempts,
                    base_delay_seconds=self.base_delay_seconds,
                )
                if outcome == "dead_letter":
                    result["dead_letters"] += 1
                elif outcome == "retry":
                    result["retried"] += 1
            else:
                self.queue.ack(job.id)
                result["sent"] += 1

        return result
