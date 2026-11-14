import os
import urllib.parse
from typing import List

import requests


def get_indexnow_key() -> str:
    return (os.getenv("INDEXNOW_KEY") or "").strip()


def submit_urls_to_indexnow(urls: List[str], frontend_url: str, timeout: int = 15) -> bool:
    """Envía URLs a IndexNow usando exclusivamente INDEXNOW_KEY de entorno (SEC-047)."""
    if not urls:
        return True

    key = get_indexnow_key()
    if not key:
        print("⚠️ INDEXNOW_KEY no configurado en el entorno; omitiendo envío a IndexNow.")
        return False

    clean_frontend = frontend_url.rstrip("/")
    host = urllib.parse.urlparse(clean_frontend).netloc
    payload = {
        "host": host,
        "key": key,
        "keyLocation": f"{clean_frontend}/{key}.txt",
        "urlList": urls,
    }

    try:
        res = requests.post(
            "https://api.indexnow.org/indexnow",
            json=payload,
            headers={"Content-Type": "application/json; charset=utf-8"},
            timeout=timeout,
        )
        if res.status_code in (200, 202):
            print(f"✅ IndexNow envío exitoso (HTTP {res.status_code}) para {len(urls)} URLs.")
            return True
        print(f"⚠️ IndexNow respuesta HTTP {res.status_code}: {res.text[:200]}")
        return False
    except Exception as exc:
        print(f"❌ Error de red enviando a IndexNow: {exc}")
        return False
