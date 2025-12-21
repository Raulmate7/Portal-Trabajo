import os
import smtplib
import psycopg2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta

def send_newsletter():
    # 1. CONEXIÓN A LA BASE DE DATOS
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
    except Exception as e:
        print(f"Error conectando a BD: {e}")
        return

    # 2. BUSCAR OFERTAS DE LAS ÚLTIMAS 24 HORAS
    yesterday = datetime.now() - timedelta(hours=24)
    cur.execute("""
        SELECT title, company, location, url_source 
        FROM jobs 
        WHERE created_at > %s 
        ORDER BY created_at DESC 
        LIMIT 5
    """, (yesterday,))
    
    new_jobs = cur.fetchall()

    if not new_jobs:
        print("No hay ofertas nuevas hoy. No enviamos email.")
        return

    # 3. PREPARAR EL CONTENIDO DEL EMAIL (HTML)
    jobs_html = ""
    for job in new_jobs:
        title, company, location, url = job
        jobs_html += f"""
            <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
                <h3 style="margin: 0; color: #4F46E5;">{title}</h3>
                <p style="margin: 5px 0; color: #666;">🏢 {company} | 📍 {location}</p>
                <a href="{url}" style="display: inline-block; padding: 8px 15px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; font-size: 14px;">Ver Oferta</a>
            </div>
        """

    email_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #111827;">🚀 Novedades IT de hoy</h1>
                <p>Aquí tienes las últimas ofertas encontradas por el robot:</p>
                {jobs_html}
                <p style="font-size: 12px; color: #999; margin-top: 30px;">
                    Estás recibiendo esto porque te suscribiste al Portal Trabajo IT.
                </p>
            </div>
        </body>
    </html>
    """

    # 4. OBTENER LISTA DE SUSCRIPTORES
    cur.execute("SELECT email FROM alerts")
    subscribers = [row[0] for row in cur.fetchall()]
    
    conn.close()

    print(f"Encontradas {len(new_jobs)} ofertas nuevas. Enviando a {len(subscribers)} usuarios...")

    # 5. ENVIAR CORREOS (GMAIL SMTP)
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    sender_email = os.getenv("EMAIL_USER")
    password = os.getenv("EMAIL_PASSWORD")

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls() # Seguridad
        server.login(sender_email, password)

        for email in subscribers:
            msg = MIMEMultipart()
            msg['From'] = f"Portal Trabajo IT <{sender_email}>"
            msg['To'] = email
            msg['Subject'] = f"🔥 {len(new_jobs)} Ofertas Nuevas de Programación"
            
            msg.attach(MIMEText(email_body, 'html'))
            
            server.send_message(msg)
            print(f"✅ Enviado a {email}")

        server.quit()
        print("🎉 Envío masivo completado.")

    except Exception as e:
        print(f"❌ Error enviando correos: {e}")

if __name__ == "__main__":
    send_newsletter()
