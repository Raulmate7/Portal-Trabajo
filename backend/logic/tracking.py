import base64
import hashlib
import hmac
import json
import os
import re
import time
import urllib.parse


def _get_tracking_secret() -> str:
    return (
        os.getenv("TRACKING_HMAC_SECRET")
        or os.getenv("UNSUBSCRIBE_SECRET")
        or os.getenv("CRON_SECRET")
        or os.getenv("ADMIN_SESSION_SECRET")
        or ""
    ).strip()


def sign_opaque_tracking_token(email: str, campaign: str, redirect_url: str = "", ttl_seconds: int = 30 * 86400) -> str:
    """Genera un token opaco firmado HMAC-SHA256 (`<b64url>.<hexSig>`) sin exponer PII en la URL."""
    secret = _get_tracking_secret()
    if not secret:
        return ""

    payload = {
        "e": email.strip().lower(),
        "c": campaign.strip(),
        "exp": int(time.time()) + ttl_seconds,
    }
    if redirect_url:
        payload["r"] = redirect_url

    raw_json = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    b64 = base64.urlsafe_b64encode(raw_json).decode("ascii").rstrip("=")
    sig = hmac.new(secret.encode("utf-8"), b64.encode("ascii"), hashlib.sha256).hexdigest()
    return f"{b64}.{sig}"


def build_track_click_url(base_url: str, email: str, campaign: str, redirect_url: str) -> str:
    token = sign_opaque_tracking_token(email, campaign, redirect_url)
    if token:
        return f"{base_url}/api/track-click?t={urllib.parse.quote(token, safe='')}"
    return (
        f"{base_url}/api/track-click?email={urllib.parse.quote(email.strip().lower(), safe='')}"
        f"&campaign={urllib.parse.quote(campaign.strip(), safe='')}"
        f"&redirect={urllib.parse.quote(redirect_url, safe='')}"
    )


def build_track_open_url(base_url: str, email: str, campaign: str) -> str:
    token = sign_opaque_tracking_token(email, campaign)
    if token:
        return f"{base_url}/api/track-open?t={urllib.parse.quote(token, safe='')}"
    return (
        f"{base_url}/api/track-open?email={urllib.parse.quote(email.strip().lower(), safe='')}"
        f"&campaign={urllib.parse.quote(campaign.strip(), safe='')}"
    )


def replace_placeholder_tracking_links(html_str: str, base_url: str, email: str, campaign: str) -> str:
    """Convierte placeholders ##EMAIL##/##CAMPAIGN## en enlaces opacos firmados con HMAC."""
    pattern = re.compile(
        re.escape(base_url) + r"/api/track-click\?email=##EMAIL##&campaign=##CAMPAIGN##&redirect=([^\"'\s<>]+)"
    )

    def _repl(match: re.Match) -> str:
        redirect_url = urllib.parse.unquote(match.group(1))
        return build_track_click_url(base_url, email, campaign, redirect_url)

    updated = pattern.sub(_repl, html_str)
    return updated.replace("##EMAIL##", urllib.parse.quote(email.strip().lower(), safe="")).replace(
        "##CAMPAIGN##", urllib.parse.quote(campaign.strip(), safe="")
    )
