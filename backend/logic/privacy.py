"""Utilidades de privacidad y minimización de PII en logs (RGPD Art. 5.1.c y Art. 32)."""


def mask_email(email_str: str) -> str:
    """Enmascara una dirección de correo electrónico antes de escribirla en logs de consola o CI."""
    if not email_str or "@" not in str(email_str):
        return "***"
    parts = str(email_str).strip().split("@", 1)
    user_part, domain = parts[0], parts[1]
    if not user_part:
        return f"***@{domain}"
    visible = user_part[:2] if len(user_part) > 2 else user_part[:1]
    return f"{visible}***@{domain}"


def redact_secrets(text: str) -> str:
    """Redacta URIs con credenciales, tokens Bearer y claves API en mensajes de error (SEC-059)."""
    if not text:
        return ""
    import re
    cleaned = re.sub(r"([a-zA-Z0-9+.-]+://[^:\s/@]+:)([^@\s]+)(@)", r"\1***\3", str(text))
    cleaned = re.sub(r"(Bearer\s+)[A-Za-z0-9._\-]+", r"\1***", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"([?&](?:key|token|secret|password)=)[^&\s]+", r"\1***", cleaned, flags=re.IGNORECASE)
    return cleaned
