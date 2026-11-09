import os
import smtplib
import psycopg2
import html as html_escape
import hashlib
import hmac
import urllib.parse
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from dotenv import load_dotenv
from logic.slug import get_job_slug

load_dotenv()

BASE_URL = os.getenv("FRONTEND_URL", "https://portalempleoit.com")
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
UNSUBSCRIBE_SECRET = os.getenv("UNSUBSCRIBE_SECRET") or os.getenv("CRON_SECRET") or ""


def generate_unsubscribe_link(email: str) -> str:
    """Genera enlace de cancelación firmado con HMAC."""
    secret = UNSUBSCRIBE_SECRET or os.getenv("UNSUBSCRIBE_SECRET") or os.getenv("CRON_SECRET")
    if not secret:
        raise ValueError("❌ Error crítico: Ni UNSUBSCRIBE_SECRET ni CRON_SECRET están definidos en el entorno.")
    clean_email = email.strip().lower()
    token = hmac.new(secret.encode(), clean_email.encode(), hashlib.sha256).hexdigest()
    return f"{BASE_URL}/api/unsubscribe?email={urllib.parse.quote(clean_email)}&token={token}"


def build_alert_email(email, job):
    """Construye el HTML para la alerta urgente de oferta destacada sanitizando variables."""
    job_id, title, company, location, salary, category = job
    safe_title = html_escape.escape(str(title or ''))
    safe_company = html_escape.escape(str(company or ''))
    safe_location = html_escape.escape(str(location or ''))
    category = category or 'Otros'
    original_job_link = f"{BASE_URL}/job/{get_job_slug(job_id, title, location, company)}?utm_source=featured_alert&utm_medium=email&utm_campaign=instant_alert_{job_id}&utm_term={urllib.parse.quote(category)}&utm_content={job_id}"
    job_link = f"{BASE_URL}/api/track-click?email={email}&campaign=instant_alert_{job_id}&redirect={urllib.parse.quote(original_job_link)}"
    
    safe_salary = html_escape.escape(str(salary)) if salary and salary not in ("Consultar", "") else ""
    salary_html = f"<p style='margin: 0 0 10px; color: #b45309; font-size: 14px;'>💰 <b>Salario:</b> {safe_salary}</p>" if safe_salary else ""
    unsubscribe_link = generate_unsubscribe_link(email)
    
    return f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px; color: #333; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; border: 2px solid #fbbf24; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #78350f, #92400e); color: white; padding: 24px; text-align: center;">
                <span style="font-size: 24px;">🚨</span>
                <h1 style="margin: 6px 0 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">Alerta de Oferta Destacada</h1>
                <p style="color: #fef3c7; margin: 4px 0 0; font-size: 12px;">Esta oferta se ajusta a tus preferencias y tiene prioridad de inscripción</p>
            </div>
            <div style="padding: 24px; line-height: 1.6;">
                <p style="font-size: 15px; color: #374151; margin-top: 0;">Hola 👋,</p>
                <p style="font-size: 14px; color: #374151;">
                    Una de nuestras empresas colaboradoras acaba de publicar una vacante de alta relevancia que coincide con tu perfil tecnológico:
                </p>
                
                <div style="margin: 20px 0; padding: 20px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; border-left: 5px solid #f59e0b;">
                    <h3 style="margin: 0 0 6px; color: #78350f; font-size: 16px; font-weight: bold;">{safe_title}</h3>
                    <p style="margin: 0 0 6px; color: #4b5563; font-size: 14px;">🏢 <b>Empresa:</b> {safe_company}</p>
                    <p style="margin: 0 0 6px; color: #4b5563; font-size: 14px;">📍 <b>Ubicación:</b> {safe_location}</p>
                    {salary_html}
                    
                    <div style="margin-top: 16px;">
                        <a href="{job_link}" style="display: inline-block; background: #d97706; color: white; padding: 8px 18px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">
                            Ver Detalles y Postularme →
                        </a>
                    </div>
                </div>
                
                <p style="font-size: 13.5px; color: #4b5563;">
                    Te recomendamos revisar los requisitos e inscribirte lo antes posible, ya que estas posiciones suelen recibir un gran volumen de candidatos rápidamente.
                </p>
            </div>
            <div style="background: #f9fafb; padding: 18px 16px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; line-height: 1.5;">
                <p style="margin: 0 0 4px 0;">
                    <strong>Portal Trabajo IT</strong> · Alertas de empleo tech en España.<br>
                    Recibes este aviso porque solicitaste alertas de empleo destacadas en portalempleoit.com.
                </p>
                <p style="margin: 0;">
                    <a href="{BASE_URL}" style="color: #6366f1; text-decoration: none;">portalempleoit.com</a> · 
                    <a href="{BASE_URL}/privacy" style="color: #6b7280; text-decoration: underline;">Política de Privacidad</a> · 
                    <a href="{unsubscribe_link}" style="color: #ef4444; text-decoration: underline; font-weight: bold;">Darme de baja en 1 clic</a>
                </p>
                <p style="margin: 4px 0 0 0; color: #d1d5db; font-size: 9px;">
                    Derechos de protección de datos: contacto@portalempleoit.com
                </p>
            </div>
        </div>
        <img src="{BASE_URL}/api/track-open?email={email}&campaign=instant_alert_{job_id}" width="1" height="1" style="display:none;" />
    </body>
    </html>
    """

def send_instant_featured_alerts():
    print("===============================================")
    print("🚨 INICIANDO ENVÍO DE ALERTAS DESTACADAS INSTANTÁNEAS")

    if not EMAIL_USER or not EMAIL_PASSWORD:
        print("❌ Error: EMAIL_USER o EMAIL_PASSWORD no configurados en .env")
        return

    # 1. Conectar a la base de datos
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
    except Exception as e:
        print(f"❌ Error conectando a BD: {e}")
        return

    # 2. Buscar ofertas destacadas no alertadas
    cur.execute("""
        SELECT id, title, company, location, salary, category 
        FROM jobs 
        WHERE is_active = TRUE AND is_featured = TRUE AND last_instant_alert_sent_at IS NULL
        ORDER BY created_at DESC
    """)
    featured_jobs = cur.fetchall()

    if not featured_jobs:
        print("💤 No hay ofertas destacadas pendientes de alerta.")
        print("===============================================")
        cur.close()
        conn.close()
        return

    print(f"⭐ Encontradas {len(featured_jobs)} ofertas destacadas nuevas.")

    # 3. Obtener todos los suscriptores activos (excluyendo bajas y avisos únicos)
    cur.execute("""
        SELECT email, tech_keywords 
        FROM subscribers 
        WHERE email IS NOT NULL 
          AND email NOT LIKE '%@deleted.local'
          AND (is_active IS NULL OR is_active = TRUE)
          AND (frequency IS NULL OR frequency != 'once')
    """)
    subscribers = cur.fetchall()

    if not subscribers:
        print("⚠️ No hay suscriptores en la base de datos.")
        print("===============================================")
        cur.close()
        conn.close()
        return

    # 4. Iniciar sesión SMTP
    try:
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port)
            server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        print(f"✅ Login en servidor SMTP ({smtp_host}:{smtp_port}) correcto.")
    except Exception as e:
        print(f"❌ Error de inicio de sesión SMTP: {e}")
        cur.close()
        conn.close()
        return

    alerts_sent_total = 0

    for job in featured_jobs:
        job_id, title, company, location, salary, category = job
        title_lower = title.lower()
        
        # Encontrar suscriptores con keywords coincidentes
        matching_emails = []
        for email, tech_keywords in subscribers:
            if tech_keywords and tech_keywords.strip():
                keywords = [k.strip().lower() for k in tech_keywords.split(',') if k.strip()]
                if any(kw in title_lower for kw in keywords):
                    matching_emails.append(email)
            else:
                # Si el suscriptor no tiene preferencias, lo incluimos en ofertas de alta relevancia
                matching_emails.append(email)

        if not matching_emails:
            print(f"ℹ️ Ningún suscriptor coincide con la oferta: '{title}' — Marcando como enviada igualmente.")
            cur.execute("UPDATE jobs SET last_instant_alert_sent_at = %s WHERE id = %s", (datetime.now(), job_id))
            conn.commit()
            continue

        print(f"📣 Enviando alerta de '{title}' en '{company}' a {len(matching_emails)} suscriptores coincidentes...")

        for email in matching_emails:
            try:
                html_body = build_alert_email(email, job)
                unsubscribe_link = generate_unsubscribe_link(email)
                
                msg = MIMEMultipart()
                msg['From'] = f"Portal Trabajo IT <{EMAIL_USER}>"
                msg['To'] = email
                msg['Subject'] = f"🚨 ALERTA URGENTE: Oferta destacada de {title} en {company}"
                msg['List-Unsubscribe'] = f"<{unsubscribe_link}>"
                msg['List-Unsubscribe-Post'] = "List-Unsubscribe=One-Click"
                msg.attach(MIMEText(html_body, 'html'))
                
                server.send_message(msg)
                alerts_sent_total += 1
                
            except Exception as e:
                print(f"  ⚠️ Error enviando alerta a {email} para la oferta {job_id}: {e}")

        # Actualizar timestamp en la oferta destacada
        cur.execute("UPDATE jobs SET last_instant_alert_sent_at = %s WHERE id = %s", (datetime.now(), job_id))
        conn.commit()
        print(f"💾 BD actualizada. Oferta {job_id} marcada como alertada.")

    server.quit()
    cur.close()
    conn.close()
    print(f"🎉 Envío de alertas finalizado. Total enviadas: {alerts_sent_total}")
    print("===============================================")

if __name__ == "__main__":
    send_instant_featured_alerts()
