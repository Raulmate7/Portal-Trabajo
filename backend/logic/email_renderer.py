import os
from html import escape
from jinja2 import Environment, FileSystemLoader, select_autoescape

TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates", "emails")

_env = Environment(
    loader=FileSystemLoader(TEMPLATES_DIR),
    autoescape=select_autoescape(["html", "xml"]),
)


def render_email_html(subject: str, body_html: str, unsubscribe_url: str = "", preheader: str = "") -> str:
    """Renderiza un correo HTML sobre la plantilla maestra _base.html con autoescape activo (FUNC-059)."""
    template = _env.get_template("_base.html")
    return template.render(
        subject=subject,
        body_html=body_html,
        unsubscribe_url=unsubscribe_url,
        preheader=preheader,
    )


def safe_text(value: str) -> str:
    return escape(value or "", quote=True)
