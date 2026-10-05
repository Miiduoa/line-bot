import json
import urllib.request

from .processor import ReplyAction


LINE_REPLY_URL = "https://api.line.me/v2/bot/message/reply"


class LineReplyClient:
    def __init__(self, access_token: str):
        self.access_token = access_token

    def reply(self, action: ReplyAction) -> None:
        body = json.dumps({
            "replyToken": action.reply_token,
            "messages": [
                {
                    "type": "text",
                    "text": action.text,
                }
            ],
        }).encode("utf-8")

        request = urllib.request.Request(
            LINE_REPLY_URL,
            data=body,
            method="POST",
            headers={
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json",
            },
        )

        with urllib.request.urlopen(request, timeout=5) as response:
            if response.status >= 300:
                raise RuntimeError(
                    f"LINE reply failed with status {response.status}"
                )
