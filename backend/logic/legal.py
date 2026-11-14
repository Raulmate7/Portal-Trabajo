"""Configuración legal centralizada para pies de correo (LSSI-CE Art. 10 y RGPD)."""

import os


def get_legal_footer_identity() -> str:
    owner = os.getenv("LEGAL_OWNER") or os.getenv("NEXT_PUBLIC_LEGAL_OWNER") or "Raúl Mateo (Portal Trabajo IT)"
    nif = os.getenv("LEGAL_NIF") or os.getenv("NEXT_PUBLIC_LEGAL_NIF") or "Pendiente de configuración (LEGAL_NIF)"
    address = os.getenv("LEGAL_ADDRESS") or os.getenv("NEXT_PUBLIC_LEGAL_ADDRESS") or "Madrid, España"
    email = os.getenv("LEGAL_EMAIL") or os.getenv("NEXT_PUBLIC_LEGAL_EMAIL") or "contacto@portalempleoit.com"
    return f"<strong>Portal Trabajo IT</strong> · Titular: {owner} · NIF: {nif} · {address} · {email}"


def build_unsubscribe_headers(unsubscribe_url: str) -> dict[str, str]:
    """Genera cabeceras RFC 8058 (One-Click + mailto) para todos los correos automatizados."""
    mailto = os.getenv("UNSUBSCRIBE_MAILTO") or os.getenv("LEGAL_EMAIL") or "contacto@portalempleoit.com"
    return {
        "List-Unsubscribe": f"<mailto:{mailto}?subject=unsubscribe>, <{unsubscribe_url}>",
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    }
