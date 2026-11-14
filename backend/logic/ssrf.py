import contextlib
import ipaddress
import socket
import threading
import urllib.parse
from typing import Dict, List, Optional, Tuple

import requests

_thread_local = threading.local()
_orig_getaddrinfo = socket.getaddrinfo

_BLOCKED_HOSTNAMES = frozenset({"localhost", "metadata.google.internal", "instance-data"})
_BLOCKED_SUFFIXES = (".localhost", ".local", ".internal", ".lan", ".arpa", ".corp", ".home")
_CGNAT_NET = ipaddress.ip_network("100.64.0.0/10")


def _is_public_ip(ip_str: str) -> bool:
    try:
        ip_obj = ipaddress.ip_address(ip_str)
    except ValueError:
        return False

    if (
        ip_obj.is_private
        or ip_obj.is_loopback
        or ip_obj.is_link_local
        or ip_obj.is_multicast
        or ip_obj.is_reserved
        or ip_obj.is_unspecified
    ):
        return False
    if isinstance(ip_obj, ipaddress.IPv4Address) and ip_obj in _CGNAT_NET:
        return False
    return True


def _pinned_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    pinned: Optional[Dict[str, str]] = getattr(_thread_local, "pinned_hosts", None)
    if pinned and isinstance(host, str):
        key = host.lower().strip("[]")
        if key in pinned:
            ip_str = pinned[key]
            return _orig_getaddrinfo(ip_str, port, family, type, proto, flags)
    return _orig_getaddrinfo(host, port, family, type, proto, flags)


socket.getaddrinfo = _pinned_getaddrinfo


@contextlib.contextmanager
def _pin_host_ip(hostname: str, ip_str: str):
    prev = getattr(_thread_local, "pinned_hosts", None)
    new_map = dict(prev) if prev else {}
    new_map[hostname.lower().strip("[]")] = ip_str
    _thread_local.pinned_hosts = new_map
    try:
        yield
    finally:
        _thread_local.pinned_hosts = prev


def resolve_and_validate_public_ips(hostname: str) -> List[str]:
    clean_host = (hostname or "").strip().strip("[]").lower()
    if not clean_host or clean_host in _BLOCKED_HOSTNAMES or clean_host.endswith(_BLOCKED_SUFFIXES):
        raise ValueError(f"Hostname bloqueado por política SSRF: {clean_host}")

    infos = _orig_getaddrinfo(clean_host, None, proto=socket.IPPROTO_TCP)
    ips: List[str] = []
    for info in infos:
        sockaddr = info[4]
        if not sockaddr:
            continue
        ip_str = sockaddr[0].split("%")[0]
        if not _is_public_ip(ip_str):
            raise ValueError(f"IP no pública resuelta para {clean_host}: {ip_str}")
        if ip_str not in ips:
            ips.append(ip_str)

    if not ips:
        raise ValueError(f"No se pudo resolver ninguna IP pública para {clean_host}")
    return ips


def is_safe_public_url(url: str, resolve_dns: bool = False) -> bool:
    if not url or not isinstance(url, str):
        return False
    cleaned = url.strip()
    if not cleaned or len(cleaned) > 2048 or any(ord(c) < 32 for c in cleaned):
        return False
    if cleaned.startswith("//") or cleaned.startswith("/\\") or cleaned.startswith("\\"):
        return False

    try:
        parsed = urllib.parse.urlparse(cleaned)
    except Exception:
        return False

    if parsed.scheme not in ("http", "https"):
        return False
    if parsed.username or parsed.password:
        return False

    host = (parsed.hostname or "").lower()
    if not host or "." not in host:
        return False
    if host in _BLOCKED_HOSTNAMES or host.endswith(_BLOCKED_SUFFIXES):
        return False

    try:
        ip_obj = ipaddress.ip_address(host.strip("[]"))
        if not _is_public_ip(str(ip_obj)):
            return False
    except ValueError:
        pass

    if resolve_dns:
        try:
            resolve_and_validate_public_ips(host)
        except Exception:
            return False

    return True


def safe_http_get(
    url: str,
    headers: Optional[Dict[str, str]] = None,
    timeout: Tuple[int, int] = (5, 15),
    max_bytes: int = 10 * 1024 * 1024,
    max_redirects: int = 3,
) -> requests.Response:
    """Ejecuta GET HTTP seguro contra SSRF, DNS Rebinding (IP pinning) y descargas ilimitadas."""
    current_url = url
    for _ in range(max_redirects + 1):
        if not is_safe_public_url(current_url, resolve_dns=False):
            raise ValueError(f"URL bloqueada por política SSRF: {current_url}")

        parsed = urllib.parse.urlparse(current_url)
        host = parsed.hostname or ""
        public_ips = resolve_and_validate_public_ips(host)
        pinned_ip = public_ips[0]

        with _pin_host_ip(host, pinned_ip):
            resp = requests.get(
                current_url,
                headers=headers,
                timeout=timeout,
                allow_redirects=False,
                stream=True,
                verify=True,
            )

        if resp.is_redirect or resp.status_code in (301, 302, 303, 307, 308):
            location = resp.headers.get("Location")
            resp.close()
            if not location:
                raise ValueError("Redirección HTTP sin cabecera Location")
            current_url = urllib.parse.urljoin(current_url, location)
            continue

        content_len = resp.headers.get("Content-Length")
        if content_len and content_len.isdigit() and int(content_len) > max_bytes:
            resp.close()
            raise ValueError(f"Respuesta HTTP excede tamaño máximo permitido ({max_bytes} bytes)")

        chunks = []
        total = 0
        try:
            for chunk in resp.iter_content(chunk_size=65536):
                if not chunk:
                    continue
                total += len(chunk)
                if total > max_bytes:
                    raise ValueError(f"Cuerpo de respuesta HTTP excede {max_bytes} bytes")
                chunks.append(chunk)
            resp._content = b"".join(chunks)
        finally:
            resp.close()
        return resp

    raise ValueError(f"Demasiadas redirecciones HTTP (máximo {max_redirects})")
