import os
import smtplib
import psycopg2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

def send_newsletter():
    print("🚀 Preparando envío de Newsletter...")

    # 1. CONEXIÓN A BASE DE DATOS
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
    except Exception as e:
        print(f"❌ Error crítico conectando a BD: {e}")
        return

    # 2. BUSCAR OFERTAS (Últimas 24h)
    yesterday = datetime.now() - timedelta(hours=24)
    cur.execute("""
        SELECT title, company, location, url_source 
        FROM jobs 
        WHERE created_at > %s 
        ORDER BY created_at DESC 
        LIMIT 10
    """, (yesterday,))
    
    new_jobs = cur.fetchall()

    if not new_jobs:
        print("💤 No hay ofertas nuevas. Fin del proceso.")
        conn.close()
        return

    # 3. PREPARAR HTML
    jobs_html = ""
    for job in new_jobs:
        title, company, location, url = job
        jobs_html += f"""
            <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #ddd;">
                <h3 style="color: #4F46E5; margin: 0;">{title}</h3>
                <p style="margin: 5px 0;">🏢 {company} | 📍 {location}</p>
                <a href="{url}" style="background-color: #4F46E5; color: white; padding: 8px 12px; text-decoration: none; border-radius: 5px; font-size: 14px;">Ver Oferta</a>
            </div>
        """

    email_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="color: #111827;">🔥 Novedades IT del día</h1>
            <p>Hemos encontrado estas ofertas para ti:</p>
            {jobs_html}
            <p style="color: #666; font-size: 12px; margin-top: 30px;">Portal Trabajo IT</p>
        </body>
    </html>
    """

    # 4. OBTENER SUSCRIPTORES
    cur.execute("SELECT DISTINCT email FROM subscribers")
    subscribers = [row[0] for row in cur.fetchall()]
    conn.close() # Cerramos conexión a BD, ya tenemos los datos

    if not subscribers:
        print("⚠️ No hay suscriptores.")
        return

    print(f"📦 Intentando enviar a {len(subscribers)} personas...")

    # 5. INICIAR SESIÓN EN GMAIL (Esto se hace una sola vez)
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASSWORD"))
        print("✅ Login correcto en Gmail.")
    except Exception as e:
        print(f"❌ ERROR DE LOGIN (Revisa tu .env): {e}")
        return # Si falla el login, no podemos seguir

    # 6. BUCLE DE ENVÍO BLINDADO
    success_count = 0
    error_count = 0

    for email in subscribers:
        try:
            # Intentamos enviar a ESTE usuario concreto
            msg = MIMEMultipart()
            msg['From'] = f"Portal Trabajo IT <{os.getenv('EMAIL_USER')}>"
            msg['To'] = email
            msg['Subject'] = f"🚀 {len(new_jobs)} Ofertas Nuevas de Programación"
            msg.attach(MIMEText(email_body, 'html'))
            
            server.send_message(msg)
            print(f"✅ Enviado a: {email}")
            success_count += 1
            
        except Exception as e:
            # Si falla uno, NO rompemos el programa. Solo lo apuntamos.
            print(f"⚠️ Error enviando a {email}: {e}")
            error_count += 1

    server.quit()
    print(f"\n🎉 Resumen: {success_count} enviados, {error_count} fallidos.")

if __name__ == "__main__":
    send_newsletter()
