import os
import requests
import psycopg2
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

BASE_URL = os.getenv("FRONTEND_URL", "https://portalempleoit.com")

def send_push_notification():
    print("===============================================")
    print("🔔 INICIANDO BOT DE NOTIFICACIONES PUSH ONESIGNAL")

    # 1. Recuperar credenciales de OneSignal
    app_id = os.getenv("ONESIGNAL_APP_ID")
    api_key = os.getenv("ONESIGNAL_REST_API_KEY")

    if not app_id or not api_key:
        print("ℹ️ Info: Falta ONESIGNAL_APP_ID o ONESIGNAL_REST_API_KEY en .env. El envío se ejecutará en modo SIMULACIÓN.")

    # 2. Conectar a Base de Datos
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
    except Exception as e:
        print(f"❌ Error conectando a la base de datos: {e}")
        return

    # 3. Buscar ofertas nuevas en las últimas 7 horas
    time_window = datetime.now() - timedelta(hours=7)
    
    try:
        cur.execute("""
            SELECT id, title, company, location
            FROM jobs
            WHERE is_active = TRUE AND created_at > %s
            ORDER BY created_at DESC
            LIMIT 50
        """, (time_window,))
        jobs = cur.fetchall()
    except Exception as e:
        print(f"❌ Error al consultar nuevas ofertas: {e}")
        jobs = []
    finally:
        cur.close()
        conn.close()

    if not jobs:
        print("💤 No hay ofertas nuevas en las últimas 7 horas. No se envía notificación push.")
        print("===============================================")
        return

    total_jobs = len(jobs)
    print(f"🚀 Detectadas {total_jobs} nuevas ofertas. Preparando notificación...")

    # 4. Construir contenido de la notificación
    if total_jobs == 1:
        # Una sola oferta, enviar detalles específicos
        job_id, title, company, location = jobs[0]
        # Generar slug básico
        clean_title = title.lower().replace(" ", "-").replace("/", "-")
        target_url = f"{BASE_URL}/job/{job_id}" # Redirección directa por ID (la página hace 301 a la canónica)
        heading = "Nueva Oferta de Empleo IT 💼"
        contents = f"{title} en {company} ({location})"
    else:
        # Múltiples ofertas
        target_url = BASE_URL
        heading = "Nuevas Ofertas de Empleo IT 🔥"
        contents = f"Se han publicado {total_jobs} nuevas vacantes de programación y tecnología. ¡Entra y postúlate!"

    # 5. Enviar petición HTTP a OneSignal API
    url = "https://onesignal.com/api/v1/notifications"
    headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": f"Basic {api_key}" if api_key else ""
    }
    
    payload = {
        "app_id": app_id if app_id else "mock-app-id",
        "included_segments": ["Subscribed Users"],
        "headings": {"es": heading, "en": heading},
        "contents": {"es": contents, "en": contents},
        "url": target_url
    }

    if not app_id or not api_key:
        print("🤖 [SIMULACIÓN PUSH] - Payload que se habría enviado:")
        print(f"   - Cabeceras: {headers}")
        print(f"   - Payload: {payload}")
        print("✅ Simulación completada con éxito.")
        print("===============================================")
        return

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        result = response.json()
        if response.status_code == 200 and not result.get("errors"):
            print(f"✅ Notificación push enviada con éxito. ID: {result.get('id')}")
        else:
            print(f"⚠️ Error en respuesta de OneSignal (Status {response.status_code}): {result}")
    except Exception as e:
        print(f"❌ Error de red al conectar con la API de OneSignal: {e}")

    print("===============================================")

if __name__ == "__main__":
    send_push_notification()
