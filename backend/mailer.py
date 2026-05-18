import os
import smtplib
import psycopg2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

def send_newsletter():
    print("🚀 Preparando envío de Newsletter Semanal...")

    # 1. CONEXIÓN A BASE DE DATOS
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
    except Exception as e:
        print(f"❌ Error crítico conectando a BD: {e}")
        return

    # 2. BUSCAR OFERTAS (Últimos 7 días para el resumen semanal)
    # MODIFICADO: Antes era hours=24, ahora days=7
    search_window = datetime.now() - timedelta(days=7)
    
    cur.execute("""
        SELECT id, title, company, location, url_source 
        FROM jobs 
        WHERE created_at > %s 
        ORDER BY created_at DESC 
        LIMIT 10
    """, (search_window,))
    
    new_jobs = cur.fetchall()

    if not new_jobs:
        print("💤 No hay ofertas nuevas esta semana. Fin del proceso.")
        conn.close()
        return

    # 3. PREPARAR HTML
    jobs_html = ""
    for job in new_jobs:
        job_id, title, company, location, url_source = job
        
        # URL base (asegúrate de que coincida con tu despliegue)
        base_url = "https://portal-trabajo.vercel.app"
        job_link = f"{base_url}/job/{job_id}"

        jobs_html += f"""
            <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #ddd;">
                <h3 style="color: #4F46E5; margin: 0;">{title}</h3>
                <p style="margin: 5px 0;">🏢 {company} | 📍 {location}</p>
                <div style="margin-top: 10px;">
                    <a href="{job_link}" style="background-color: #4F46E5; color: white; padding: 8px 12px; text-decoration: none; border-radius: 5px; font-size: 14px; font-weight: bold;">
                        Ver Oferta en la Web
                    </a>
                </div>
            </div>
        """

    # Enlace de afiliado (reemplaza por tu link real)
    BOOTCAMP_LINK = "https://ejemplo.com/afiliado-bootcamp"
    CV_LINK = "https://ejemplo.com/afiliado-cv"

    email_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; color: #333; background-color: #f9fafb;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
                
                <!-- Cabecera -->
                <div style="background: linear-gradient(135deg, #312e81, #4338ca); color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">🔥 Resumen Semanal de Empleo IT</h1>
                    <p style="color: #c7d2fe; margin: 8px 0 0;">Las mejores ofertas de los últimos 7 días</p>
                </div>

                <div style="padding: 24px;">
                    {jobs_html}

                    <!-- Banner Bootcamp (Afiliado) -->
                    <div style="margin: 24px 0; padding: 20px; background: linear-gradient(135deg, #312e81, #581c87); border-radius: 12px; text-align: center;">
                        <p style="color: #c7d2fe; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">Recomendación Premium</p>
                        <h3 style="color: white; margin: 0 0 8px; font-size: 18px;">🚀 Bootcamp Fullstack Developer</h3>
                        <p style="color: #c7d2fe; font-size: 13px; margin: 0 0 16px;">Acelera tu carrera tech. Aprende haciendo proyectos reales.</p>
                        <a href="{BOOTCAMP_LINK}" style="display: inline-block; background: linear-gradient(90deg, #fbbf24, #f59e0b); color: #1f2937; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                            Ver Bootcamp Completo →
                        </a>
                    </div>

                    <!-- Banner CV (Afiliado) -->
                    <div style="margin: 16px 0; padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; display: flex; align-items: center;">
                        <div>
                            <h4 style="margin: 0 0 4px; color: #166534; font-size: 14px;">📄 ¿Tu CV no pasa los filtros ATS?</h4>
                            <p style="margin: 0; color: #15803d; font-size: 12px;">Usa plantillas profesionales optimizadas para recruiters.</p>
                            <a href="{CV_LINK}" style="color: #4f46e5; font-size: 13px; font-weight: bold; text-decoration: none;">Mejorar mi CV →</a>
                        </div>
                    </div>

                    <!-- CTA Talento Premium -->
                    <div style="margin: 24px 0; padding: 20px; background: #fffbeb; border: 2px solid #fbbf24; border-radius: 12px; text-align: center;">
                        <h3 style="margin: 0 0 8px; color: #92400e;">⭐ ¿Eres Senior (+3 años)?</h3>
                        <p style="color: #78350f; font-size: 13px; margin: 0 0 12px;">Accede a ofertas exclusivas con salarios +45K de forma confidencial.</p>
                        <a href="{base_url}/talento-premium" style="display: inline-block; background: linear-gradient(90deg, #fbbf24, #f59e0b); color: #1f2937; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                            Registrarme en Talento Premium
                        </a>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                        Enviado automáticamente cada lunes por Portal Trabajo IT.<br>
                        <a href="{base_url}" style="color: #6366f1;">Visitar la web</a>
                    </p>
                </div>
            </div>
        </body>
    </html>
    """

    # 4. OBTENER SUSCRIPTORES
    cur.execute("SELECT DISTINCT email FROM subscribers")
    subscribers = [row[0] for row in cur.fetchall()]
    conn.close()

    if not subscribers:
        print("⚠️ No hay suscriptores.")
        return

    print(f"📦 Intentando enviar a {len(subscribers)} personas...")

    # 5. INICIAR SESIÓN EN GMAIL
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASSWORD"))
        print("✅ Login correcto en Gmail.")
    except Exception as e:
        print(f"❌ ERROR DE LOGIN (Revisa tu .env): {e}")
        return

    # 6. BUCLE DE ENVÍO
    success_count = 0
    error_count = 0

    for email in subscribers:
        try:
            msg = MIMEMultipart()
            msg['From'] = f"Portal Trabajo IT <{os.getenv('EMAIL_USER')}>"
            msg['To'] = email
            # MODIFICADO: Asunto actualizado para reflejar que es semanal
            msg['Subject'] = f"📅 Resumen Semanal: {len(new_jobs)} Ofertas de Programación"
            msg.attach(MIMEText(email_body, 'html'))
            
            server.send_message(msg)
            print(f"✅ Enviado a: {email}")
            success_count += 1
            
        except Exception as e:
            print(f"⚠️ Error enviando a {email}: {e}")
            error_count += 1

    server.quit()
    print(f"\n🎉 Resumen: {success_count} enviados, {error_count} fallidos.")

if __name__ == "__main__":
    send_newsletter()
