"""
send_saved_jobs_reminder.py — Envía emails de recordatorio a usuarios que guardaron
ofertas hace 48 horas pero no han regresado a revisarlas.

Los suscriptores que activaron el recordatorio tienen source = 'saved_jobs_reminder'
en la tabla `subscribers`. Este script les envía un email a las 48h de haberse suscrito
si no han recibido ya este recordatorio (tabla saved_jobs_reminders).
"""

import os
import smtplib
import psycopg2
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)
BASE_URL = os.getenv("FRONTEND_URL", "https://portalempleoit.com")

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>⭐ Tienes ofertas guardadas por revisar</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);border:1px solid #e2e8f0;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 28px;text-align:center;">
      <div style="font-size:52px;margin-bottom:8px;">⭐</div>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:900;letter-spacing:-.5px;">Tienes ofertas guardadas</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,.85);font-size:14px;">Revísalas antes de que caduquen</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 28px 20px;">
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Hola 👋,
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Hace 48 horas guardaste algunas ofertas de empleo IT que te interesaban.
        <strong style="color:#4f46e5;">¡No dejes pasar la oportunidad!</strong>
        Las ofertas de empleo tech suelen cubrirse rápido.
      </p>

      <!-- Warning box -->
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:18px 20px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 4px;font-size:13px;color:#1e40af;font-weight:700;text-transform:uppercase;letter-spacing:.5px;">⏰ No esperes más</p>
        <p style="margin:0;color:#1e3a8a;font-size:14px;line-height:1.5;">
          Muchas ofertas expiran en los primeros 25-30 días. Revísalas y postúlate antes de que sea tarde.
        </p>
      </div>

      <!-- Tips -->
      <p style="font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin:0 0 12px;">Tips para postularte:</p>
      <ul style="margin:0 0 24px;padding-left:20px;color:#374151;font-size:14px;line-height:1.8;">
        <li>Personaliza tu CV para cada oferta específica</li>
        <li>Añade una carta de presentación breve (3 párrafos)</li>
        <li>Postúlate en las primeras 24-48h de publicación</li>
      </ul>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="{base_url}/ofertas-guardadas" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;font-weight:900;font-size:15px;padding:14px 32px;border-radius:14px;text-decoration:none;box-shadow:0 4px 14px rgba(79,70,229,.35);">
          ⭐ Ver mis ofertas guardadas
        </a>
      </div>

      <!-- Secondary CTA -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="{base_url}/recursos" style="display:inline-block;color:#4f46e5;font-weight:700;font-size:13px;text-decoration:none;">
          📚 Ver recursos para mejorar tu candidatura →
        </a>
      </div>

      <p style="font-size:12px;color:#9ca3af;text-align:center;line-height:1.5;margin:0;">
        Recibes este email porque activaste los recordatorios de ofertas guardadas en Portal Trabajo IT.<br>
        <a href="{base_url}/darse-de-baja?email={email}" style="color:#9ca3af;">Cancelar recordatorios</a>
      </p>
    </div>
  </div>
</body>
</html>
"""


def setup_table(conn):
    """Crea la tabla de control si no existe."""
    try:
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS saved_jobs_reminders (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                sent_at TIMESTAMP DEFAULT NOW()
            )
        """)
        conn.commit()
        cur.close()
    except Exception as e:
        print(f"ℹ️ No se pudo crear tabla saved_jobs_reminders: {e}")
        conn.rollback()


def get_pending_subscribers(conn):
    """
    Suscriptores con source='saved_jobs_reminder' que se registraron hace entre 47 y 72 horas
    y no han recibido este recordatorio aún.
    """
    try:
        cutoff_from = datetime.now() - timedelta(hours=72)
        cutoff_to = datetime.now() - timedelta(hours=47)
        cur = conn.cursor()
        cur.execute("""
            SELECT s.email
            FROM subscribers s
            WHERE s.source = 'saved_jobs_reminder'
              AND s.is_active = TRUE
              AND s.created_at BETWEEN %s AND %s
              AND s.email NOT IN (
                SELECT sr.email FROM saved_jobs_reminders sr
              )
            LIMIT 300
        """, (cutoff_from, cutoff_to))
        rows = cur.fetchall()
        cur.close()
        return [r[0] for r in rows]
    except Exception as e:
        print(f"⚠️ Error consultando suscriptores pendientes: {e}")
        return []


def send_reminder_email(smtp, to_email: str):
    """Envía el email de recordatorio de ofertas guardadas."""
    msg = MIMEMultipart('alternative')
    msg['Subject'] = "⭐ Tienes ofertas de empleo guardadas — ¡Revísalas antes de que caduquen!"
    msg['From'] = f"Portal Trabajo IT <{FROM_EMAIL}>"
    msg['To'] = to_email
    msg['List-Unsubscribe'] = f"<{BASE_URL}/darse-de-baja?email={to_email}>"

    html_content = HTML_TEMPLATE.replace('{base_url}', BASE_URL).replace('{email}', to_email)
    msg.attach(MIMEText(html_content, 'html', 'utf-8'))
    smtp.sendmail(FROM_EMAIL, to_email, msg.as_string())


def mark_sent(conn, email: str):
    """Registra el envío."""
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO saved_jobs_reminders (email, sent_at) VALUES (%s, NOW())",
            (email,)
        )
        conn.commit()
        cur.close()
    except Exception:
        conn.rollback()


def send_saved_jobs_reminders():
    print("===============================================")
    print("⭐ INICIANDO RECORDATORIOS DE OFERTAS GUARDADAS")

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
    subscribers = get_pending_subscribers(conn)

    if not subscribers:
        print("ℹ️ No hay suscriptores pendientes de recordatorio de ofertas guardadas.")
        conn.close()
        print("===============================================")
        return

    print(f"📧 Enviando recordatorios de ofertas guardadas a {len(subscribers)} usuarios...")
    sent = 0
    errors = 0

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.login(SMTP_USER, SMTP_PASS)
            for email in subscribers:
                try:
                    send_reminder_email(smtp, email)
                    mark_sent(conn, email)
                    sent += 1
                    print(f"  ✅ Enviado a {email}")
                except Exception as e:
                    errors += 1
                    print(f"  ❌ Error enviando a {email}: {e}")
    except Exception as e:
        print(f"❌ Error de conexión SMTP: {e}")

    conn.close()
    print(f"\n✅ Recordatorios enviados: {sent} | Errores: {errors}")
    print("===============================================")


if __name__ == "__main__":
    send_saved_jobs_reminders()
