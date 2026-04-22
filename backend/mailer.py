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

    email_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <div style="max-width: 600px; margin: 0 auto;">
                <h1 style="color: #111827; text-align: center;">🔥 Resumen Semanal de Empleo IT</h1>
                <p style="text-align: center; color: #666;">Aquí tienes las mejores ofertas de los últimos 7 días:</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                
                {jobs_html}
                
                <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
                    Enviado automáticamente cada lunes por Portal Trabajo IT.<br>
                    <a href="{base_url}" style="color: #999;">Visitar la web</a>
                </p>
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
