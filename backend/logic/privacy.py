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
