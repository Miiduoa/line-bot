HELP_TEXT = "指令：help、ping、echo <文字>"


def route_text(text: str) -> str:
    normalized = text.strip()

    if normalized.lower() == "help":
        return HELP_TEXT

    if normalized.lower() == "ping":
        return "pong"

    if normalized.lower().startswith("echo "):
        payload = normalized[5:].strip()
        return payload[:500] if payload else "echo 後面需要文字"

    return "我只處理明確指令。輸入 help 查看可用功能。"
