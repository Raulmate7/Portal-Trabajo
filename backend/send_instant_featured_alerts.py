import os
import smtplib
import psycopg2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.getenv("FRONTEND_URL", "https://portalempleoit.com")
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

def build_alert_email(email, job):
    """Construye el HTML para la alerta urgente de oferta destacada."""
    job_id, title, company, location, salary = job
    job_link = f"{BASE_URL}/job/{job_id}?utm_source=featured_alert&utm_medium=email&utm_campaign=instant_alert_{job_id}"
    salary_html = f"<p style='margin: 0 0 10px; color: #b45309; font-size: 14px;'>💰 <b>Salario:</b> {salary}</p>" if salary and salary not in ("Consultar", "") else ""
    
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
                    <h3 style="margin: 0 0 6px; color: #78350f; font-size: 16px; font-weight: bold;">{title}</h3>
                    <p style="margin: 0 0 6px; color: #4b5563; font-size: 14px;">🏢 <b>Empresa:</b> {company}</p>
                    <p style="margin: 0 0 6px; color: #4b5563; font-size: 14px;">📍 <b>Ubicación:</b> {location}</p>
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
            <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                    Enviado al instante por Portal Trabajo IT · <a href="{BASE_URL}/api/unsubscribe?email={email}" style="color: #6366f1;">Cancelar suscripción</a>
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
        SELECT id, title, company, location, salary 
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

    # 3. Obtener todos los suscriptores
    cur.execute("SELECT email, tech_keywords FROM subscribers WHERE email IS NOT NULL")
    subscribers = cur.fetchall()

    if not subscribers:
        print("⚠️ No hay suscriptores en la base de datos.")
        print("===============================================")
        cur.close()
        conn.close()
        return

    # 4. Iniciar sesión SMTP
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        print("✅ Login en Gmail SMTP correcto.")
    except Exception as e:
        print(f"❌ Error de inicio de sesión SMTP: {e}")
        cur.close()
        conn.close()
        return

    alerts_sent_total = 0

    for job in featured_jobs:
        job_id, title, company, location, salary = job
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
                
                msg = MIMEMultipart()
                msg['From'] = f"Portal Trabajo IT <{EMAIL_USER}>"
                msg['To'] = email
                msg['Subject'] = f"🚨 ALERTA URGENTE: Oferta destacada de {title} en {company}"
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
