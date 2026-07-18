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

def build_referral_progress_email(email, count):
    """Construye un email de notificación para progreso de referidos (1 o 2 de 3)."""
    return f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px; color: #333; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #4f46e5, #6366f1); color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 22px;">⚡ ¡Has conseguido un nuevo referido!</h1>
                <p style="color: #c7d2fe; margin: 8px 0 0;">Tu red de contactos se está registrando en Portal Trabajo IT</p>
            </div>
            <div style="padding: 24px; line-height: 1.6;">
                <p style="font-size: 15px; color: #374151;">¡Hola!</p>
                <p style="font-size: 14px; color: #374151;">
                    Te escribimos para avisarte de que alguien se ha suscrito a nuestras alertas de empleo usando tu enlace personal de referido.
                </p>
                
                <div style="margin: 30px 0; padding: 20px; background: #f3f4f6; border-radius: 8px; text-align: center;">
                    <span style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #6b7280; display: block; margin-bottom: 5px;">Tu progreso actual</span>
                    <span style="font-size: 40px; font-weight: 900; color: #4f46e5; display: block;">{count} / 3</span>
                    <span style="font-size: 14px; color: #374151; font-weight: bold; display: block; margin-top: 5px;">amigos registrados</span>
                </div>
                
                <p style="font-size: 14px; color: #374151;">
                    ¡Ya estás más cerca! Recuerda que al llegar a <strong>3 referidos</strong> se os activará el estatus destacado y ventajas premium a todos vosotros de forma totalmente gratuita.
                </p>
                
                <div style="margin: 24px 0; text-align: center;">
                    <a href="{BASE_URL}/referidos" style="display: inline-block; background: #4f46e5; color: white; padding: 10px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
                        Ver mi panel de referidos →
                    </a>
                </div>
            </div>
            <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                    Portal Trabajo IT · <a href="{BASE_URL}/api/unsubscribe?email={email}" style="color: #6366f1;">Cancelar suscripción</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    """

def build_referral_success_email(email):
    """Construye un email de felicitación cuando el usuario alcanza el hito de 3 referidos."""
    return f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px; color: #333; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 22px;">🎉 ¡ENHORABUENA! ¡RECOMPENSA DESBLOQUEADA!</h1>
                <p style="color: #a7f3d0; margin: 8px 0 0;">Has alcanzado el objetivo de 3 referidos</p>
            </div>
            <div style="padding: 24px; line-height: 1.6;">
                <p style="font-size: 15px; color: #374151;">¡Hola!</p>
                <p style="font-size: 14px; color: #374151;">
                    ¡Lo has conseguido! Tres amigos se han registrado en nuestro portal utilizando tu enlace de invitación.
                </p>
                
                <div style="margin: 30px 0; padding: 20px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; text-align: center;">
                    <span style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #059669; display: block; margin-bottom: 5px;">Estatus desbloqueado</span>
                    <span style="font-size: 24px; font-weight: 900; color: #065f46; display: block;">🏆 ACCESO PREMIUM ACTIVADO</span>
                </div>
                
                <p style="font-size: 14px; color: #374151;">
                    A partir de ahora tendrás acceso prioritario a todas las vacantes publicadas en el portal (las verás 24 horas antes) y tu perfil se destacará automáticamente en nuestros procesos.
                </p>
                
                <div style="margin: 24px 0; text-align: center;">
                    <a href="{BASE_URL}" style="display: inline-block; background: #10b981; color: white; padding: 10px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
                        Comenzar a explorar →
                    </a>
                </div>
            </div>
            <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                    Portal Trabajo IT · <a href="{BASE_URL}/api/unsubscribe?email={email}" style="color: #6366f1;">Cancelar suscripción</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    """

def run_referral_notifications():
    print("===============================================")
    print("📧 INICIANDO PROCESADO DE NOTIFICACIONES DE REFERIDOS")

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

    # 2. Buscar todas las personas que han referido a alguien
    try:
        cur.execute("""
            SELECT referred_by, COUNT(*) as count 
            FROM subscribers 
            WHERE referred_by IS NOT NULL AND referred_by != ''
            GROUP BY referred_by
        """)
        referrals = cur.fetchall()
    except Exception as e:
        print(f"❌ Error al consultar referidos: {e}")
        conn.close()
        return

    if not referrals:
        print("💤 No hay referidos registrados en el sistema.")
        print("===============================================")
        conn.close()
        return

    # 3. Iniciar servidor SMTP
    smtp_active = False
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        smtp_active = True
        print("✅ Login en Gmail SMTP correcto.")
    except Exception as e:
        print(f"❌ Error al iniciar sesión en SMTP (se procesará el script pero se omitirán envíos): {e}")

    emails_sent = 0

    for (referrer_email, actual_count) in referrals:
        # Obtener los datos del referrer
        cur.execute("""
            SELECT referrals_notified_count 
            FROM subscribers 
            WHERE email = %s
        """, (referrer_email,))
        row = cur.fetchone()
        
        if not row:
            # Si el referrer no está en la tabla (por ejemplo, email inválido), lo omitimos
            continue
            
        notified_count = row[0] if row[0] is not None else 0
        
        if actual_count > notified_count:
            print(f"⚡ Referente: {referrer_email} tiene {actual_count} referidos (antes notificado: {notified_count})")
            
            # Enviar email de notificación si el SMTP está disponible
            if smtp_active:
                try:
                    msg = MIMEMultipart()
                    msg['From'] = f"Portal Trabajo IT <{EMAIL_USER}>"
                    msg['To'] = referrer_email
                    
                    if actual_count >= 3 and notified_count < 3:
                        msg['Subject'] = "🎉 ¡Objetivo de referidos conseguido! Acceso Premium Activado"
                        html_body = build_referral_success_email(referrer_email)
                    else:
                        msg['Subject'] = f"⚡ ¡Nuevo referido conseguido! ({actual_count}/3)"
                        html_body = build_referral_progress_email(referrer_email, actual_count)
                        
                    msg.attach(MIMEText(html_body, 'html'))
                    server.send_message(msg)
                    emails_sent += 1
                    print(f"  ✉️ Email de referido enviado a {referrer_email}")
                except Exception as send_err:
                    print(f"  ❌ Error al enviar email: {send_err}")
            
            # Actualizar la cuenta de notificaciones en la BD independientemente del envío SMTP para evitar bucles de reintento
            try:
                cur.execute("""
                    UPDATE subscribers 
                    SET referrals_notified_count = %s 
                    WHERE email = %s
                """, (actual_count, referrer_email))
                conn.commit()
            except Exception as upd_err:
                print(f"  ❌ Error actualizando cuenta en BD: {upd_err}")

    if smtp_active:
        server.quit()
        
    cur.close()
    conn.close()
    print(f"🎉 Notificaciones procesadas. {emails_sent} correos enviados.")
    print("===============================================")

if __name__ == "__main__":
    run_referral_notifications()
