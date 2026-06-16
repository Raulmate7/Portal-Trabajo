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

def get_onboarding_jobs(cur, tech_keywords):
    """Obtiene hasta 3 ofertas recientes que coincidan con las tecnologías del suscriptor."""
    params = []
    sql = "SELECT id, title, company, location, salary FROM jobs WHERE is_active = TRUE"
    
    if tech_keywords and tech_keywords.strip():
        keywords = [k.strip() for k in tech_keywords.split(',') if k.strip()]
        if keywords:
            keyword_conditions = " OR ".join([f"title ILIKE %s" for _ in keywords])
            sql += f" AND ({keyword_conditions})"
            params.extend([f"%{kw}%" for kw in keywords])
            
    sql += " ORDER BY created_at DESC LIMIT 3"
    
    cur.execute(sql, params)
    return cur.fetchall()

def build_welcome_email(email, tech_keywords, jobs):
    """Construye el primer email de bienvenida con ofertas recomendadas."""
    tech_label = tech_keywords.replace(',', ', ').title() if tech_keywords else "Tecnología general"
    jobs_html = ""
    import urllib.parse
    
    if jobs:
        for job in jobs:
            job_id, title, company, location, salary = job
            original_link = f"{BASE_URL}/job/{get_job_slug(job_id, title, location, company)}?utm_source=onboarding&utm_medium=email&utm_campaign=welcome_1"
            job_link = f"{BASE_URL}/api/track-click?email={email}&campaign=welcome_email_1&redirect={urllib.parse.quote(original_link)}"
            sal_text = f" | 💰 {salary}" if salary and salary not in ("Consultar", "") else ""
            jobs_html += f"""
            <div style="margin-bottom: 12px; padding: 12px; background: #f8faff; border-left: 4px solid #4f46e5; border-radius: 4px;">
                <h4 style="margin: 0 0 4px; color: #312e81; font-size: 14px;">{title}</h4>
                <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px;">🏢 {company} &nbsp;|&nbsp; 📍 {location}{sal_text}</p>
                <a href="{job_link}" style="color: #4f46e5; font-size: 12px; font-weight: bold; text-decoration: none;">Ver Oferta →</a>
            </div>
            """
    else:
        jobs_html = f"<p style='color: #6b7280; font-size: 13px; text-align: center;'>Visita nuestra web para ver las últimas ofertas del día.</p>"

    original_explore_link = f"{BASE_URL}?utm_source=onboarding&utm_medium=email&utm_campaign=welcome_1"
    explore_link = f"{BASE_URL}/api/track-click?email={email}&campaign=welcome_email_1&redirect={urllib.parse.quote(original_explore_link)}"

    return f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px; color: #333; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #312e81, #4f46e5); color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 22px;">👋 ¡Te damos la bienvenida a Portal Trabajo IT!</h1>
                <p style="color: #c7d2fe; margin: 8px 0 0;">Tu carrera profesional en tecnología empieza aquí</p>
            </div>
            <div style="padding: 24px; line-height: 1.6;">
                <p style="font-size: 15px; color: #374151;">Hola,</p>
                <p style="font-size: 14px; color: #374151;">
                    Gracias por suscribirte a nuestras alertas de empleo tecnológico. Hemos configurado tu perfil con interés en: <strong>{tech_label}</strong>.
                </p>
                
                <h3 style="color: #1e1b4b; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-top: 24px;">💼 Ofertas iniciales recomendadas para ti:</h3>
                {jobs_html}
                
                <div style="margin: 24px 0; text-align: center;">
                    <a href="{explore_link}" style="display: inline-block; background: #4f46e5; color: white; padding: 10px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
                        Explorar Todas las Ofertas →
                    </a>
                </div>
                
                <p style="font-size: 13px; color: #6b7280; margin-top: 30px;">
                    En los próximos días te enviaremos una guía para comprobar salarios IT reales en España. Si tienes dudas, puedes responder directamente a este correo.
                </p>
            </div>
            <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                    Portal Trabajo IT · <a href="{BASE_URL}/api/unsubscribe?email={email}" style="color: #6366f1;">Cancelar suscripción</a>
                </p>
            </div>
        </div>
        <img src="{BASE_URL}/api/track-open?email={email}&campaign=welcome_email_1" width="1" height="1" style="display:none;" />
    </body>
    </html>
    """

def build_resources_email(email):
    """Construye el segundo email de onboarding con recursos de calculadora salarial y CV."""
    BOOTCAMP_LINK = "https://trk.udemy.com/9VMAEj"
    CV_LINK = "https://ejemplo.com/afiliado-cv"
    import urllib.parse
    
    bootcamp_track = f"{BASE_URL}/api/track-click?email={email}&campaign=welcome_email_2&redirect={urllib.parse.quote(BOOTCAMP_LINK)}"
    cv_track = f"{BASE_URL}/api/track-click?email={email}&campaign=welcome_email_2&redirect={urllib.parse.quote(CV_LINK)}"
    
    original_salarios_link = f"{BASE_URL}/salarios?utm_source=onboarding&utm_medium=email&utm_campaign=welcome_2"
    salarios_track = f"{BASE_URL}/api/track-click?email={email}&campaign=welcome_email_2&redirect={urllib.parse.quote(original_salarios_link)}"
    
    return f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px; color: #333; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #312e81, #7c3aed); color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 22px;">💰 ¿Cuánto se cobra en el sector IT?</h1>
                <p style="color: #ddd6fe; margin: 8px 0 0;">Descubre salarios reales de programadores en España</p>
            </div>
            <div style="padding: 24px; line-height: 1.6;">
                <p style="font-size: 15px; color: #374151;">Hola de nuevo 👋,</p>
                <p style="font-size: 14px; color: #374151;">
                    Queremos ayudarte a tomar mejores decisiones en tu carrera. Uno de los mayores problemas es saber si un salario está acorde al mercado o si estás pidiendo lo adecuado en las entrevistas.
                </p>
                
                <h3 style="color: #1e1b4b; margin-top: 24px; font-size: 16px;">📊 Calculadora de Salarios</h3>
                <p style="font-size: 13.5px; color: #4b5563; margin-top: 0;">
                    Hemos procesado los datos de miles de ofertas publicadas para crear nuestra calculadora de salarios. Puedes consultar el sueldo medio por tecnología y ciudad (Madrid, Barcelona, Valencia, Remoto...).
                </p>
                <div style="text-align: center; margin: 16px 0;">
                    <a href="{salarios_track}" style="display: inline-block; background: #7c3aed; color: white; padding: 8px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">
                        Calcular mi salario →
                    </a>
                </div>
                
                <h3 style="color: #1e1b4b; margin-top: 24px; font-size: 16px;">📄 Optimiza tu CV contra filtros ATS</h3>
                <p style="font-size: 13.5px; color: #4b5563; margin-top: 0;">
                    La mayoría de empresas tecnológicas filtran los currículums automáticamente con softwares ATS antes de que los lea un humano. Usa plantillas profesionales que pasen estos filtros para no quedar descartado al inicio.
                </p>
                <div style="text-align: center; margin: 16px 0;">
                    <a href="{cv_track}" style="display: inline-block; background: #10b981; color: white; padding: 8px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">
                        Ver Plantillas ATS →
                    </a>
                </div>
            </div>
            <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                    Portal Trabajo IT · <a href="{BASE_URL}/api/unsubscribe?email={email}" style="color: #6366f1;">Cancelar suscripción</a>
                </p>
            </div>
        </div>
        <img src="{BASE_URL}/api/track-open?email={email}&campaign=welcome_email_2" width="1" height="1" style="display:none;" />
    </body>
    </html>
    """

def run_onboarding():
    print("===============================================")
    print("📧 INICIANDO PROCESADO DE ONBOARDING AUTOMÁTICO")

    if not EMAIL_USER or not EMAIL_PASSWORD:
        print("❌ Error: EMAIL_USER o EMAIL_PASSWORD no configurados en el archivo .env")
        return

    # 1. Conectar a Base de Datos
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
    except Exception as e:
        print(f"❌ Error conectando a BD: {e}")
        return

    # 2. Obtener usuarios en onboarding_stage < 2
    cur.execute("""
        SELECT email, tech_keywords, onboarding_stage, onboarding_last_sent_at
        FROM subscribers
        WHERE onboarding_stage < 2 OR onboarding_stage IS NULL
    """)
    subscribers = cur.fetchall()

    if not subscribers:
        print("💤 No hay suscriptores pendientes de onboarding.")
        print("===============================================")
        conn.close()
        return

    # 3. Iniciar servidor SMTP
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        print("✅ Login en Gmail SMTP correcto.")
    except Exception as e:
        print(f"❌ Error al iniciar sesión en SMTP: {e}")
        conn.close()
        return

    welcome_sent = 0
    resources_sent = 0

    for (email, tech_keywords, stage, last_sent) in subscribers:
        # Inicializar stage si es None
        current_stage = stage if stage is not None else 0
        
        try:
            # EMAIL 1: Inmediato (stage = 0)
            if current_stage == 0:
                print(f"💌 Enviando Email 1 (Bienvenida) a: {email}...")
                jobs = get_onboarding_jobs(cur, tech_keywords)
                html_body = build_welcome_email(email, tech_keywords, jobs)
                
                msg = MIMEMultipart()
                msg['From'] = f"Portal Trabajo IT <{EMAIL_USER}>"
                msg['To'] = email
                msg['Subject'] = "¡Te damos la bienvenida a Portal Trabajo IT! 🚀"
                msg.attach(MIMEText(html_body, 'html'))
                
                server.send_message(msg)
                
                # Actualizar base de datos
                cur.execute("""
                    UPDATE subscribers
                    SET onboarding_stage = 1, onboarding_last_sent_at = %s
                    WHERE email = %s
                """, (datetime.now(), email))
                conn.commit()
                welcome_sent += 1
                print(f"  ✅ Completado Email 1 para {email}")

            # EMAIL 2: A los 4 días (stage = 1)
            elif current_stage == 1:
                # Comprobar si han pasado al menos 4 días (96 horas)
                time_diff = datetime.now() - last_sent if last_sent else timedelta(days=5)
                if time_diff >= timedelta(days=4):
                    print(f"💌 Enviando Email 2 (Recursos y Salarios) a: {email}...")
                    html_body = build_resources_email(email)
                    
                    msg = MIMEMultipart()
                    msg['From'] = f"Portal Trabajo IT <{EMAIL_USER}>"
                    msg['To'] = email
                    msg['Subject'] = "💰 Recursos recomendados y calculadora de salarios en Portal Trabajo IT"
                    msg.attach(MIMEText(html_body, 'html'))
                    
                    server.send_message(msg)
                    
                    # Actualizar base de datos
                    cur.execute("""
                        UPDATE subscribers
                        SET onboarding_stage = 2, onboarding_last_sent_at = %s
                        WHERE email = %s
                    """, (datetime.now(), email))
                    conn.commit()
                    resources_sent += 1
                    print(f"  ✅ Completado Email 2 (Fin Onboarding) para {email}")
                else:
                    print(f"  ⏭️ {email} en etapa 1, pero aún no han pasado 4 días (pasaron {time_diff.days} días).")

        except Exception as e:
            print(f"❌ Error procesando onboarding de {email}: {e}")

    server.quit()
    cur.close()
    conn.close()
    print(f"🎉 Onboarding terminado: {welcome_sent} bienvenidos, {resources_sent} recursos de salarios.")
    print("===============================================")

if __name__ == "__main__":
    run_onboarding()
