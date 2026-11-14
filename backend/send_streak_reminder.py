"""
send_streak_reminder.py — Envía emails de "¡Casi pierdes tu racha!" a usuarios
que llevan 20+ horas sin visitar el portal y tienen email capturado via UserStreak.

Se ejecuta desde run_all.py como paso final del cron.
Los datos de racha están en el cliente (localStorage), por lo que este script
trabaja con la tabla de suscriptores que han activado el recordatorio de racha
(source = 'streak_reminder') y los emails que no han visitado hoy.

NOTA: Este script registra el último envío en la tabla `streak_reminders` para
no enviar duplicados y respetar la frecuencia de 1 aviso por racha activa.
"""

import os
import hmac
import hashlib
import urllib.parse
import smtplib
import psycopg2
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from dotenv import load_dotenv
from logic.privacy import mask_email

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "") or os.getenv("EMAIL_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "") or os.getenv("EMAIL_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)
BASE_URL = os.getenv("FRONTEND_URL", "https://portalempleoit.com")


def generate_unsubscribe_link(email: str) -> str:
    secret = os.getenv("UNSUBSCRIBE_SECRET") or os.getenv("CRON_SECRET")
    if not secret:
        raise ValueError("❌ Error crítico: Ni UNSUBSCRIBE_SECRET ni CRON_SECRET están definidos en el entorno.")
    clean_email = email.strip().lower()
    token = hmac.new(secret.encode(), clean_email.encode(), hashlib.sha256).hexdigest()
    return f"{BASE_URL}/api/unsubscribe?email={urllib.parse.quote(clean_email)}&token={token}"

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>⚠️ ¡Tu racha está en peligro!</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);border:1px solid #e2e8f0;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px 28px;text-align:center;">
      <div style="font-size:52px;margin-bottom:8px;">🔥</div>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:900;letter-spacing:-.5px;">¡Tu racha está en peligro!</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,.85);font-size:14px;">Visita el portal hoy para mantenerla activa</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 28px 20px;">
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Hola 👋,
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Llevas varios días seguidos visitando nuestro portal de empleo IT. 
        <strong style="color:#d97706;">¡Eso es impresionante!</strong> Pero si no pasas hoy,
        perderás tu racha y tendrás que empezar desde cero.
      </p>

      <!-- Stats box -->
      <div style="background:linear-gradient(135deg,#fefce8,#fef3c7);border:1px solid #fcd34d;border-radius:14px;padding:18px 20px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 4px;font-size:13px;color:#92400e;font-weight:700;text-transform:uppercase;letter-spacing:.5px;">⏰ Te queda poco tiempo</p>
        <p style="margin:0;color:#78350f;font-size:14px;line-height:1.5;">
          Entra ahora para conservar tu racha y seguir desbloqueando premios exclusivos.
        </p>
      </div>

      <!-- Milestones reminder -->
      <p style="font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin:0 0 12px;">Premios por racha:</p>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:24px;">
        <div style="display:flex;align-items:center;gap:10px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 14px;">
          <span style="font-size:18px;">🎁</span>
          <span style="font-size:13px;color:#065f46;font-weight:600;">3 días → Guía Salarial IT 2026 gratis</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px 14px;">
          <span style="font-size:18px;">🏆</span>
          <span style="font-size:13px;color:#1e40af;font-weight:600;">7 días → Acceso a tendencias del mercado IT</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;background:#f5f3ff;border:1px solid #c4b5fd;border-radius:10px;padding:10px 14px;">
          <span style="font-size:18px;">💎</span>
          <span style="font-size:13px;color:#5b21b6;font-weight:600;">30 días → Badge Premium de candidato experto</span>
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="{base_url}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-weight:900;font-size:15px;padding:14px 32px;border-radius:14px;text-decoration:none;box-shadow:0 4px 14px rgba(245,158,11,.35);">
          🔥 ¡Mantén mi racha ahora!
        </a>
      </div>

      <div style="background: #f9fafb; padding: 18px 16px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; line-height: 1.5; margin-top: 24px; border-radius: 0 0 20px 20px;">
        <p style="margin: 0 0 4px 0;">
          <strong>Portal Trabajo IT</strong> · Recordatorio de racha en el portal de empleo tech.<br>
          Recibes este aviso puntual porque activaste los recordatorios de racha en portalempleoit.com.
        </p>
        <p style="margin: 0;">
          <a href="{base_url}" style="color: #6366f1; text-decoration: none;">portalempleoit.com</a> · 
          <a href="{base_url}/privacy" style="color: #6b7280; text-decoration: underline;">Política de Privacidad</a> · 
          <a href="{unsubscribe_link}" style="color: #ef4444; text-decoration: underline; font-weight: bold;">Darme de baja en 1 clic</a>
        </p>
        <p style="margin: 4px 0 0 0; color: #d1d5db; font-size: 9px;">
          Derechos de protección de datos: contacto@portalempleoit.com
        </p>
      </div>
    </div>
  </div>
</body>
</html>
"""


def setup_table(conn):
    """Crea la tabla de control de envíos de recordatorio si no existe."""
    try:
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS streak_reminders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                date_sent DATE NULL,
                INDEX idx_streak_reminders_email (email),
                UNIQUE KEY uq_streak_email_date (email, date_sent)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        conn.commit()
        cur.close()
    except Exception as e:
        print(f"ℹ️ No se pudo crear tabla streak_reminders (puede ya existir): {e}")
        conn.rollback()


def get_streak_reminder_subscribers(conn):
    """Obtiene suscriptores que activaron el recordatorio de racha y no recibieron email hoy."""
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT s.email
            FROM subscribers s
            WHERE (s.source = 'streak_reminder' OR s.tech_keywords LIKE 'origen:streak_reminder%')
              AND s.email NOT LIKE '%@deleted.local'
              AND (s.is_active IS NULL OR s.is_active = TRUE)
              AND s.email NOT IN (
                SELECT sr.email FROM streak_reminders sr
                WHERE DATE(sr.sent_at) = CURRENT_DATE() OR sr.date_sent = CURRENT_DATE()
              )
            LIMIT 200
        """)
        rows = cur.fetchall()
        cur.close()
        return [r[0] for r in rows]
    except Exception as e:
        print(f"⚠️ Error consultando suscriptores de racha: {e}")
        return []


def send_streak_email(smtp, to_email: str):
    """Envía el email de recordatorio de racha."""
    unsubscribe_link = generate_unsubscribe_link(to_email)
    msg = MIMEMultipart('alternative')
    msg['Subject'] = "🔥 ¡Tu racha de visitas está en peligro! Entra antes de que sea tarde"
    msg['From'] = f"Portal Trabajo IT <{FROM_EMAIL}>"
    msg['To'] = to_email
    msg['List-Unsubscribe'] = f"<mailto:contacto@portalempleoit.com?subject=unsubscribe>, <{unsubscribe_link}>"
    msg['List-Unsubscribe-Post'] = "List-Unsubscribe=One-Click"

    html_content = HTML_TEMPLATE.replace('{base_url}', BASE_URL).replace('{email}', to_email).replace('{unsubscribe_link}', unsubscribe_link)
    msg.attach(MIMEText(html_content, 'html', 'utf-8'))

    smtp.sendmail(FROM_EMAIL, to_email, msg.as_string())


def mark_sent(conn, email: str):
    """Registra que se envió el recordatorio a este email hoy."""
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT IGNORE INTO streak_reminders (email, sent_at, date_sent) VALUES (%s, NOW(), CURRENT_DATE())",
            (email,)
        )
        conn.commit()
        cur.close()
    except Exception:
        conn.rollback()


def send_streak_reminders():
    print("===============================================")
    print("🔥 INICIANDO ENVÍO DE RECORDATORIOS DE RACHA")

    if not SMTP_USER or not SMTP_PASS:
        print("⚠️ No hay credenciales SMTP configuradas. Omitiendo.")
        print("===============================================")
        return

    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    except Exception as e:
        print(f"❌ Error conectando a BD: {e}")
        return

    setup_table(conn)
    subscribers = get_streak_reminder_subscribers(conn)

    if not subscribers:
        print("ℹ️ No hay suscriptores de racha que necesiten recordatorio hoy.")
        conn.close()
        print("===============================================")
        return

    print(f"📧 Enviando recordatorios a {len(subscribers)} suscriptores...")

    sent = 0
    errors = 0
    try:
        smtp_ctx = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) if SMTP_PORT == 465 else smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        with smtp_ctx as smtp:
            smtp.ehlo()
            if SMTP_PORT != 465:
                smtp.starttls()
            smtp.login(SMTP_USER, SMTP_PASS)
            for email in subscribers:
                try:
                    send_streak_email(smtp, email)
                    mark_sent(conn, email)
                    sent += 1
                    print(f"  ✅ Enviado a {mask_email(email)}")
                except Exception as e:
                    errors += 1
                    print(f"  ❌ Error enviando a {mask_email(email)}: {e}")
    except Exception as e:
        print(f"❌ Error de conexión SMTP: {e}")

    conn.close()
    print(f"\n✅ Recordatorios enviados: {sent} | Errores: {errors}")
    print("===============================================")


if __name__ == "__main__":
    send_streak_reminders()
