"""
TDM Compliance Gate & Robots.txt Enforcement (LEG-029, LEG-030).
Cumple con Directiva (UE) 2019/790 Art. 4 (W3C TDMRep) y RFC 9309 (robots.txt).
"""

import re
import time
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser
from logic.ssrf import safe_http_get

_ROBOTS_CACHE: dict[str, tuple[RobotFileParser | None, float]] = {}
_ROBOTS_TTL_SECONDS = 3600
_ROBOTS_ERROR_TTL_SECONDS = 300
DEFAULT_USER_AGENT = "PortalTrabajoITBot/1.0 (+https://portalempleoit.com/bot)"


def _get_robot_parser(base_origin: str) -> RobotFileParser | None:
    now = time.time()
    cached = _ROBOTS_CACHE.get(base_origin)
    if cached is not None:
        rp_cached, expires_at = cached
        if now < expires_at:
            return rp_cached

    rp = RobotFileParser()
    robots_url = f"{base_origin}/robots.txt"
    try:
        res = safe_http_get(
            robots_url,
            headers={"User-Agent": DEFAULT_USER_AGENT},
            timeout=(3, 6),
        )
        if res.status_code == 200:
            rp.parse(res.text.splitlines())
            _ROBOTS_CACHE[base_origin] = (rp, now + _ROBOTS_TTL_SECONDS)
            return rp
        # Si 404/410 -> sin restricciones explícitas en robots.txt
        if res.status_code in (404, 410):
            _ROBOTS_CACHE[base_origin] = (None, now + _ROBOTS_TTL_SECONDS)
            return None
        # En 403/429/5xx aplicamos fail-closed conservador
        rp.parse(["User-agent: *", "Disallow: /"])
        _ROBOTS_CACHE[base_origin] = (rp, now + _ROBOTS_ERROR_TTL_SECONDS)
        return rp
    except Exception:
        # Fail-closed ante timeouts/errores de red en robots.txt (BUG-048)
        rp.parse(["User-agent: *", "Disallow: /"])
        _ROBOTS_CACHE[base_origin] = (rp, now + _ROBOTS_ERROR_TTL_SECONDS)
        return rp


def is_scraping_allowed(url: str, response_headers: dict | None = None, user_agent: str = "PortalTrabajoITBot") -> bool:
    """Verifica robots.txt (RFC 9309) y cabeceras TDM-Reservation / X-Robots-Tag."""
    parsed = urlparse(url)
    if not parsed.scheme or not parsed.netloc:
        return False

    origin = f"{parsed.scheme}://{parsed.netloc}"
    rp = _get_robot_parser(origin)
    if rp is not None:
        if not rp.can_fetch(user_agent, url):
            return False

    if response_headers:
        lower_headers = {str(k).lower(): str(v).lower() for k, v in response_headers.items()}
        if lower_headers.get("tdm-reservation") == "1":
            return False
        x_robots = lower_headers.get("x-robots-tag", "")
        if any(flag in x_robots for flag in ("noindex", "noai", "noimageai")):
            return False

    return True


def truncate_snippet(text: str, max_chars: int = 200) -> str:
    """Normaliza espacios y trunca el extracto a <= max_chars caracteres (extracto no sustancial)."""
    if not text:
        return ""
    clean = re.sub(r"<[^>]+>", " ", str(text))
    clean = re.sub(r"\s+", " ", clean).strip()
    if len(clean) <= max_chars:
        return clean
    return clean[: max(0, max_chars - 3)].rstrip() + "..."
