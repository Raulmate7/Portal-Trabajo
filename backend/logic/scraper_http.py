import random
import time
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from logic.ssrf import safe_http_get

USER_AGENTS = [
    "PortalTrabajoITBot/1.0 (+https://portalempleoit.com/bot; bot@portalempleoit.com)",
    "Mozilla/5.0 (compatible; PortalTrabajoITBot/1.1; +https://portalempleoit.com/bot)",
]


class ScraperHttpClient:
    """
    Cliente HTTP compartido para scrapers con reintentos, backoff exponencial + jitter,
    rotación de cabeceras y circuit breaker por fuente (FUNC-042).
    """

    def __init__(self, source_name: str, max_failures: int = 3, timeout: tuple = (5, 15)):
        self.source_name = source_name
        self.max_failures = max_failures
        self.timeout = timeout
        self.consecutive_failures = 0
        self.circuit_open = False
        self.session = requests.Session()
        retry = Retry(
            total=3,
            backoff_factor=0.8,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "HEAD"],
        )
        adapter = HTTPAdapter(max_retries=retry)
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)

    def get(self, url: str, extra_headers: dict | None = None):
        if self.circuit_open:
            raise RuntimeError(f"Circuit breaker abierto para {self.source_name}")
        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/json,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        }
        if extra_headers:
            headers.update(extra_headers)
        try:
            time.sleep(random.uniform(0.15, 0.45))
            resp = safe_http_get(url, headers=headers, timeout=self.timeout)
            if resp.status_code >= 500 or resp.status_code == 429:
                self.consecutive_failures += 1
                if self.consecutive_failures >= self.max_failures:
                    self.circuit_open = True
            else:
                self.consecutive_failures = 0
            return resp
        except Exception:
            self.consecutive_failures += 1
            if self.consecutive_failures >= self.max_failures:
                self.circuit_open = True
            raise
