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
    """Genera un token opaco cifrado autenticado AES-256-GCM (`v2.<iv>.<ct>.<tag>`) sin exponer PII en claro (SEC-012)."""
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
    try:
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM

        key = hashlib.sha256(secret.encode("utf-8")).digest()
        iv = os.urandom(12)
        ct_and_tag = AESGCM(key).encrypt(iv, raw_json, b"tracking-v2")
        ct, tag = ct_and_tag[:-16], ct_and_tag[-16:]

        def _b64u(data: bytes) -> str:
            return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")

        return f"v2.{_b64u(iv)}.{_b64u(ct)}.{_b64u(tag)}"
    except ImportError:
        # Fallback solo si cryptography no está instalado en el entorno local
        b64 = base64.urlsafe_b64encode(raw_json).decode("ascii").rstrip("=")
        sig = hmac.new(secret.encode("utf-8"), b64.encode("ascii"), hashlib.sha256).hexdigest()
        return f"{b64}.{sig}"


def build_track_click_url(
    base_url: str, email: str, campaign: str, redirect_url: str, allow_individual_tracking: bool = True
) -> str:
    if not allow_individual_tracking or os.getenv("DISABLE_INDIVIDUAL_EMAIL_TRACKING", "false").lower() == "true":
        return redirect_url
    token = sign_opaque_tracking_token(email, campaign, redirect_url)
    if token:
        return f"{base_url}/api/track-click?t={urllib.parse.quote(token, safe='')}"
    # Fail-closed: nunca exponer PII (?email=...) en claro si falta TRACKING_HMAC_SECRET (BUG-056)
    return redirect_url


def build_track_open_url(
    base_url: str, email: str, campaign: str, allow_individual_tracking: bool = True
) -> str:
    if not allow_individual_tracking or os.getenv("DISABLE_INDIVIDUAL_EMAIL_TRACKING", "false").lower() == "true":
        return ""
    token = sign_opaque_tracking_token(email, campaign)
    if token:
        return f"{base_url}/api/track-open?t={urllib.parse.quote(token, safe='')}"
    return ""


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
