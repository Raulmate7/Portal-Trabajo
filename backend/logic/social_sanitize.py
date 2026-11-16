"""Sanitización y moderación básica para bots sociales (SEC-032)."""

import os
import re
import requests

_URL_RE = re.compile(r"https?://\S+|www\.\S+", re.IGNORECASE)
_CTRL_RE = re.compile(r"[\r\n\x00-\x1f\x7f]")
_SPAM_RE = re.compile(
    r"\b(crypto\s*airdrop|telegram\.me/|t\.me/|whatsapp\.com|casino|betting|onlyfans|forex\s*signal)\b",
    re.IGNORECASE,
)


def sanitize_social_text(value: str | None, max_len: int = 120) -> str:
    if not value:
        return ""
    cleaned = _URL_RE.sub("", str(value))
    cleaned = _CTRL_RE.sub(" ", cleaned)
    cleaned = re.sub(r"\s{2,}", " ", cleaned).strip()
    return cleaned[:max_len]


def is_safe_social_job(title: str | None, company: str | None) -> bool:
    combined = f"{title or ''} {company or ''}"
    if _SPAM_RE.search(combined):
        return False
    if _URL_RE.search(title or ""):
        return False
    return True


def notify_admin_auth_error(service: str, status_code: int, detail: str = "") -> None:
    """Envía alerta inmediata por Telegram cuando un token OAuth/API devuelve 401/403 (SEC-055/SEC-061)."""
    if status_code not in (401, 403):
        return
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    admin_id = os.getenv("TELEGRAM_ADMIN_ID", "").strip()
    if not bot_token or not admin_id:
        return
    msg = (
        f"🔐 Alerta de credencial/token en {service} (HTTP {status_code}). "
        f"Requiere renovación o revisión.\nDetalle: {str(detail)[:200]}"
    )
    try:
        requests.post(
            f"https://api.telegram.org/bot{bot_token}/sendMessage",
            json={"chat_id": admin_id, "text": msg},
            timeout=5,
        )
    except Exception:
        pass
