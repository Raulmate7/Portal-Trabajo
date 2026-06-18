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

def run_reactivation():
    print("===============================================")
    print("🔄 INICIANDO PROCESO DE REACTIVACIÓN DE SUSCRIPTORES")

    if not EMAIL_USER or not EMAIL_PASSWORD:
        print("❌ Error: EMAIL_USER o EMAIL_PASSWORD no configurados en .env")
        return

    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
    except Exception as e:
        print(f"❌ Error conectando a BD: {e}")
        return

    # 1. ELIMINAR/LIMPIAR SUSCRIPTORES INACTIVOS (Sin aperturas > 45 días)
    try:
        limit_date_45 = datetime.now() - timedelta(days=45)
        cur.execute("""
            DELETE FROM subscribers 
            WHERE created_at < %s 
              AND last_sent_at < %s
              AND email NOT IN (
                  SELECT DISTINCT email FROM email_tracking WHERE opened_at > %s
              )
        """, (limit_date_45, limit_date_45, limit_date_45))
        deleted_count = cur.rowcount
        conn.commit()
        print(f"🧹 Se han eliminado {deleted_count} suscriptores inactivos (sin actividad > 45 días).")
    except Exception as e:
        print(f"⚠️ Error limpiando inactivos: {e}")
        conn.rollback()

    # 2. SELECCIONAR SUSCRIPTORES PARA REACTIVACIÓN (last_sent_at > 30 días y sin aperturas en 30 días)
    limit_date_30 = datetime.now() - timedelta(days=30)
    limit_reactivation_spam = datetime.now() - timedelta(days=15)
    
    cur.execute("""
        SELECT email, tech_keywords FROM subscribers 
        WHERE last_sent_at < %s
          AND (onboarding_stage IS NULL OR onboarding_stage >= 2)
          AND email NOT IN (
              SELECT DISTINCT email FROM email_tracking WHERE opened_at > %s
          )
          AND (last_sent_at < %s OR last_sent_at IS NULL)
    """, (limit_date_30, limit_date_30, limit_reactivation_spam))
    
    pending_reactivation = cur.fetchall()
    
    if not pending_reactivation:
        print("💤 No hay suscriptores pendientes de reactivación.")
        cur.close()
        conn.close()
        return

    print(f"👥 Se encontraron {len(pending_reactivation)} suscriptores inactivos para reactivar.")

    # 3. Conectar a SMTP
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        print("✅ Conectado a SMTP.")
    except Exception as e:
        print(f"❌ Error SMTP: {e}")
        cur.close()
        conn.close()
        return

    sent_count = 0
    for (email, tech_keywords) in pending_reactivation:
        try:
            # Obtener 3 ofertas recomendadas recientes para la reactivación
            tech_keywords_str = tech_keywords or "programacion"
            keywords = [k.strip() for k in tech_keywords_str.split(',') if k.strip()]
            
            sql = "SELECT id, title, company, location, salary, category FROM jobs WHERE is_active = TRUE"
            params = []
            if keywords:
                keyword_conditions = " OR ".join([f"title ILIKE %s" for _ in keywords])
                sql += f" AND ({keyword_conditions})"
                params.extend([f"%{kw}%" for kw in keywords])
            sql += " ORDER BY created_at DESC LIMIT 3"
            
            cur.execute(sql, params)
            jobs = cur.fetchall()
            
            # Construir email
            import urllib.parse
            tech_label = tech_keywords_str.replace(',', ', ').title()
            
            jobs_html = ""
            if jobs:
                for job in jobs:
                    job_id, title, company, location, salary, category = job
                    category = category or 'Otros'
                    original_link = f"{BASE_URL}/job/{get_job_slug(job_id, title, location, company)}?utm_source=reactivation&utm_medium=email&utm_campaign=reactivation_1&utm_term={urllib.parse.quote(category)}&utm_content={job_id}"
                    job_link = f"{BASE_URL}/api/track-click?email={email}&campaign=reactivation_email&redirect={urllib.parse.quote(original_link)}"
                    sal_text = f" | 💰 {salary}" if salary and salary not in ("Consultar", "") else ""
                    jobs_html += f"""
                    <div style="margin-bottom: 12px; padding: 12px; background: #fffbeb; border-left: 4px solid #d97706; border-radius: 4px;">
                        <h4 style="margin: 0 0 4px; color: #78350f; font-size: 14px;">{title}</h4>
                        <p style="margin: 0 0 8px; color: #b45309; font-size: 12px;">🏢 {company} &nbsp;|&nbsp; 📍 {location}{sal_text}</p>
                        <a href="{job_link}" style="color: #d97706; font-size: 12px; font-weight: bold; text-decoration: none;">Ver Oferta →</a>
                    </div>
                    """
            else:
                jobs_html = f"<p style='color: #6b7280; font-size: 13px; text-align: center;'>Visita nuestra web para ver las últimas ofertas del día.</p>"

            explore_link_orig = f"{BASE_URL}?utm_source=reactivation&utm_medium=email&utm_campaign=reactivation_1"
            explore_link = f"{BASE_URL}/api/track-click?email={email}&campaign=reactivation_email&redirect={urllib.parse.quote(explore_link_orig)}"
            
            email_body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; color: #333; background-color: #f9fafb;">
                <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #b45309, #d97706); color: white; padding: 30px; text-align: center;">
                        <h1 style="margin: 0; font-size: 22px;">👋 ¿Sigues buscando trabajo en tecnología?</h1>
                        <p style="color: #fef3c7; margin: 8px 0 0;">Tenemos nuevas oportunidades esperándote</p>
                    </div>
                    <div style="padding: 24px; line-height: 1.6;">
                        <p style="font-size: 15px; color: #374151;">Hola,</p>
                        <p style="font-size: 14px; color: #374151;">
                            Hace un tiempo que no visitas **Portal Trabajo IT**. Queremos asegurarnos de que sigues recibiendo valor. Si tu perfil ha cambiado o ya has encontrado empleo, puedes darte de baja en el link del pie.
                        </p>
                        <p style="font-size: 14px; color: #374151;">
                            Si sigues en búsqueda activa, te interesará saber que han entrado nuevas vacantes interesantes para tu perfil (<strong>{tech_label}</strong>):
                        </p>
                        
                        <h3 style="color: #78350f; border-bottom: 1px solid #fef3c7; padding-bottom: 6px; margin-top: 24px;">💼 Ofertas recientes destacadas:</h3>
                        {jobs_html}
                        
                        <div style="margin: 24px 0; text-align: center;">
                            <a href="{explore_link}" style="display: inline-block; background: #d97706; color: white; padding: 10px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
                                Explorar Todas las Ofertas Activas →
                            </a>
                        </div>
                    </div>
                    <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                            Portal Trabajo IT · <a href="{BASE_URL}/api/unsubscribe?email={email}" style="color: #b45309;">Cancelar suscripción</a>
                        </p>
                    </div>
                </div>
                <img src="{BASE_URL}/api/track-open?email={email}&campaign=reactivation_email" width="1" height="1" style="display:none;" />
            </body>
            </html>
            """
            
            msg = MIMEMultipart()
            msg['From'] = f"Portal Trabajo IT <{EMAIL_USER}>"
            msg['To'] = email
            msg['Subject'] = "👋 ¿Sigues buscando trabajo IT? Nuevas ofertas disponibles"
            msg.attach(MIMEText(email_body, 'html'))
            
            server.send_message(msg)
            
            # Actualizar last_sent_at
            cur.execute("""
                UPDATE subscribers 
                SET last_sent_at = %s 
                WHERE email = %s
            """, (datetime.now(), email))
            conn.commit()
            
            sent_count += 1
            print(f"  ✅ Reactivación enviada a: {email}")
            
        except Exception as e:
            print(f"  ❌ Error enviando a {email}: {e}")
            conn.rollback()

    server.quit()
    cur.close()
    conn.close()
    print(f"🎉 Proceso de reactivación terminado. {sent_count} emails enviados.")

if __name__ == "__main__":
    run_reactivation()
