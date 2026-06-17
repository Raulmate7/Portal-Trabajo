import os
import smtplib
import psycopg2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from dotenv import load_dotenv
from logic.slug import get_job_slug

load_dotenv()

BASE_URL = os.getenv("FRONTEND_URL", "https://portalempleoit.com")
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")


def get_jobs_for_subscriber(cur, tech_keywords: str, location_pref: str, hours: int = 24):
    """Busca ofertas en la BD que coincidan con los filtros del suscriptor."""
    params = []
    sql = """
        SELECT id, title, company, location, url_source, salary
        FROM jobs
        WHERE created_at > %s
    """
    params.append(datetime.now() - timedelta(hours=hours))

    # Filtro de tecnología (busca en el título)
    if tech_keywords and tech_keywords.strip():
        keywords = [k.strip() for k in tech_keywords.split(',') if k.strip()]
        if keywords:
            keyword_conditions = " OR ".join([f"title ILIKE %s" for _ in keywords])
            sql += f" AND ({keyword_conditions})"
            params.extend([f"%{kw}%" for kw in keywords])

    # Filtro de ubicación
    if location_pref and location_pref.strip():
        sql += " AND location ILIKE %s"
        params.append(f"%{location_pref.strip()}%")

    sql += " ORDER BY created_at DESC LIMIT 8"
    cur.execute(sql, params)
    return cur.fetchall()


def build_job_html(jobs, subscriber_email):
    """Genera el bloque HTML con la lista de ofertas de empleo."""
    if not jobs:
        return "<p style='color: #6b7280; text-align: center;'>No hay nuevas ofertas con tus filtros en las últimas 24 horas. ¡Vuelve mañana!</p>"

    import urllib.parse
    html = ""
    for job in jobs:
        job_id, title, company, location, url_source, salary = job
        original_job_link = f"{BASE_URL}/job/{get_job_slug(job_id, title, location, company)}?utm_source=alert&utm_medium=email&utm_campaign=custom_alert"
        job_link = f"{BASE_URL}/api/track-click?email={subscriber_email}&campaign=custom_alert&redirect={urllib.parse.quote(original_job_link)}"
        salary_text = f"💰 {salary}" if salary and salary not in ("Consultar", None) else ""

        html += f"""
        <div style="margin-bottom: 16px; padding: 16px; background: #f8faff; border-left: 4px solid #4f46e5; border-radius: 0 8px 8px 0;">
            <h3 style="color: #312e81; margin: 0 0 4px; font-size: 15px; font-weight: bold;">{title}</h3>
            <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">🏢 {company} &nbsp;|&nbsp; 📍 {location} {salary_text}</p>
            <a href="{job_link}" style="display: inline-block; background: #4f46e5; color: white; padding: 6px 14px; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: bold;">
                Ver Oferta →
            </a>
        </div>
        """
    return html


def build_email_html(jobs, subscriber_email: str, tech_keywords: str, frequency: str):
    """Construye el cuerpo HTML completo del email de alerta."""
    import urllib.parse
    BOOTCAMP_LINK = "https://trk.udemy.com/9VMAEj"
    bootcamp_track = f"{BASE_URL}/api/track-click?email={subscriber_email}&campaign=custom_alert&redirect={urllib.parse.quote(BOOTCAMP_LINK)}"
    cta_btn_orig = f"{BASE_URL}?utm_source=alert&utm_medium=email&utm_campaign=cta_btn"
    cta_btn_track = f"{BASE_URL}/api/track-click?email={subscriber_email}&campaign=custom_alert&redirect={urllib.parse.quote(cta_btn_orig)}"
    visit_web_track = f"{BASE_URL}/api/track-click?email={subscriber_email}&campaign=custom_alert&redirect={urllib.parse.quote(BASE_URL)}"
    
    unsubscribe_link = f"{BASE_URL}/api/unsubscribe?email={subscriber_email}"
    freq_text = "diario" if frequency == "daily" else "semanal"
    tech_text = tech_keywords.replace(',', ', ').title() if tech_keywords else "Todas las tecnologías"
    jobs_html = build_job_html(jobs, subscriber_email)
    hours_window = 24 if frequency == "daily" else 168
    hours_label = "24 horas" if frequency == "daily" else "7 días"
    job_count = len(jobs)

    return f"""
<html>
<body style="font-family: 'Segoe UI', Arial, sans-serif; padding: 0; margin: 0; background: #f3f4f6;">
  <div style="max-width: 600px; margin: 24px auto; background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">

    <!-- Cabecera -->
    <div style="background: linear-gradient(135deg, #312e81 0%, #4f46e5 100%); color: white; padding: 28px 24px; text-align: center;">
      <p style="color: #a5b4fc; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 8px;">Tu alerta {freq_text}</p>
      <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 800;">⚡ {job_count} Nueva{"s" if job_count != 1 else ""} Oferta{"s" if job_count != 1 else ""} de Empleo IT</h1>
      <p style="color: #c7d2fe; margin: 0; font-size: 13px;">Filtros activos: <strong style="color: white;">{tech_text}</strong></p>
    </div>

    <!-- Cuerpo -->
    <div style="padding: 24px;">
      <p style="color: #374151; font-size: 14px; margin: 0 0 20px;">Hola 👋, aquí tienes las ofertas que coinciden con tu perfil de las últimas <strong>{hours_label}</strong>:</p>

      {jobs_html}

      <!-- CTA -->
      <div style="text-align: center; margin: 24px 0;">
        <a href="{cta_btn_track}" style="display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px;">
          Ver Todas las Ofertas →
        </a>
      </div>

      <!-- Banner afiliado -->
      <div style="padding: 18px; background: linear-gradient(135deg, #fef3c7, #fffbeb); border: 1px solid #fcd34d; border-radius: 10px; text-align: center; margin-top: 16px;">
        <p style="color: #78350f; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; margin: 0 0 6px;">💡 Mejora tu Perfil</p>
        <h3 style="margin: 0 0 6px; color: #92400e; font-size: 15px;">Cursos IT para ser más competitivo</h3>
        <p style="margin: 0 0 12px; color: #b45309; font-size: 12px;">Aprende React, Python, AWS o Data Science con certificado.</p>
        <a href="{bootcamp_track}" style="background: #f59e0b; color: #1f2937; padding: 8px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px;">Ver Cursos →</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 11px; margin: 0;">
        Enviado por <a href="{visit_web_track}" style="color: #6366f1; text-decoration: none;">Portal Trabajo IT</a> · 
        <a href="{unsubscribe_link}" style="color: #9ca3af;">Cancelar suscripción</a>
      </p>
    </div>
  </div>
</body>
</html>
"""


def send_custom_alerts():
    print("📧 Iniciando envío de Alertas Personalizadas...")

    # 1. Conectar a la BD
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
    except Exception as e:
        print(f"❌ Error conectando a BD: {e}")
        return

    # 2. Obtener suscriptores con sus preferencias (filtrando por frecuencia y último envío)
    cur.execute("""
        SELECT email, tech_keywords, location_pref, frequency
        FROM subscribers
        WHERE email IS NOT NULL
          AND (
            (frequency = 'daily' AND (last_sent_at IS NULL OR last_sent_at < NOW() - INTERVAL '23 hours'))
            OR
            (frequency = 'weekly' AND (last_sent_at IS NULL OR last_sent_at < NOW() - INTERVAL '6 days'))
            OR
            (frequency IS NULL OR frequency = '' OR (frequency != 'daily' AND frequency != 'weekly' AND (last_sent_at IS NULL OR last_sent_at < NOW() - INTERVAL '6 days')))
          )
    """)
    subscribers = cur.fetchall()

    if not subscribers:
        print("💤 No hay suscriptores registrados.")
        conn.close()
        return

    print(f"👥 Procesando {len(subscribers)} suscriptores...")

    # 3. Iniciar sesión SMTP
    if not EMAIL_USER or not EMAIL_PASSWORD:
        print("❌ Error: EMAIL_USER o EMAIL_PASSWORD no configurados en .env")
        conn.close()
        return

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        print("✅ Login en Gmail correcto.")
    except Exception as e:
        print(f"❌ Error de login SMTP: {e}")
        conn.close()
        return

    success_count = 0
    skip_count = 0
    error_count = 0

    for (email, tech_keywords, location_pref, frequency) in subscribers:
        try:
            # Calcular ventana de tiempo según frecuencia
            hours = 24 if frequency == "daily" else 168

            # Buscar ofertas para este suscriptor
            jobs = get_jobs_for_subscriber(cur, tech_keywords or "", location_pref or "", hours)

            if not jobs:
                skip_count += 1
                print(f"  ⏭️  Sin nuevas ofertas para {email} — omitiendo.")
                continue

            # Construir y enviar email
            html_body = build_email_html(jobs, email, tech_keywords or "", frequency or "weekly")
            job_count = len(jobs)
            subject = f"⚡ {job_count} nueva{'s' if job_count != 1 else ''} oferta{'s' if job_count != 1 else ''} de empleo IT para ti"

            msg = MIMEMultipart()
            msg['From'] = f"Portal Trabajo IT <{EMAIL_USER}>"
            msg['To'] = email
            msg['Subject'] = subject
            msg.attach(MIMEText(html_body, 'html'))

            server.send_message(msg)
            
            # Actualizar last_sent_at
            cur.execute("""
                UPDATE subscribers
                SET last_sent_at = %s
                WHERE email = %s
            """, (datetime.now(), email))
            conn.commit()
            
            success_count += 1
            print(f"  ✅ Enviado a: {email} ({job_count} ofertas)")

        except Exception as e:
            error_count += 1
            print(f"  ⚠️ Error enviando a {email}: {e}")

    server.quit()
    conn.close()
    print(f"\n🎉 Alertas completadas: {success_count} enviados, {skip_count} sin novedades, {error_count} errores.")


if __name__ == "__main__":
    send_custom_alerts()
