"""
send_push_notifications.py — Envía notificaciones push via OneSignal REST API
cuando hay nuevas ofertas de empleo en las últimas 7 horas.

Mejoras (Cat. 5.1):
  - Segmentación por categoría tecnológica si OneSignal lo soporta
  - Envía hasta 3 notificaciones segmentadas (react/python/etc.) + 1 general
  - Umbral configurable: solo si hay 20+ nuevas ofertas
"""

import os
import requests
import psycopg2
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

BASE_URL = os.getenv("FRONTEND_URL", "https://portalempleoit.com")

# Categorías tech para segmentación
TECH_SEGMENTS = [
    {"keywords": ["react", "vue", "angular", "frontend"], "label": "Frontend",  "emoji": "🎨", "path": "/trabajos/frontend"},
    {"keywords": ["python", "django", "flask", "fastapi"],  "label": "Python",   "emoji": "🐍", "path": "/trabajos/python"},
    {"keywords": ["java", "spring", "kotlin"],              "label": "Java",     "emoji": "☕", "path": "/trabajos/java"},
    {"keywords": ["aws", "cloud", "devops", "docker"],      "label": "DevOps",   "emoji": "☁️", "path": "/trabajos/cloud"},
    {"keywords": ["data", "ml", "machine learning", "ai"],  "label": "Data & AI","emoji": "📊", "path": "/trabajos/data"},
]


def send_push_notification():
    print("===============================================")
    print("🔔 INICIANDO BOT DE NOTIFICACIONES PUSH ONESIGNAL")

    app_id = os.getenv("ONESIGNAL_APP_ID")
    api_key = os.getenv("ONESIGNAL_REST_API_KEY")

    if not app_id or not api_key:
        print("ℹ️ Info: Falta ONESIGNAL_APP_ID o ONESIGNAL_REST_API_KEY. Modo SIMULACIÓN.")

    # Conectar a BD
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
    except Exception as e:
        print(f"❌ Error conectando a la base de datos: {e}")
        return

    time_window = datetime.now() - timedelta(hours=7)

    # Contar nuevas ofertas totales
    try:
        cur.execute(
            "SELECT COUNT(*) FROM jobs WHERE is_active = TRUE AND created_at > %s",
            (time_window,)
        )
        total_jobs = cur.fetchone()[0]
    except Exception as e:
        print(f"❌ Error al contar nuevas ofertas: {e}")
        total_jobs = 0

    if total_jobs == 0:
        print("💤 No hay ofertas nuevas en las últimas 7 horas. No se envía notificación push.")
        cur.close(); conn.close()
        print("===============================================")
        return

    if total_jobs < 20:
        print(f"ℹ️ Solo {total_jobs} ofertas nuevas (umbral mínimo: 20). No se envía notificación.")
        cur.close(); conn.close()
        print("===============================================")
        return

    print(f"🚀 Detectadas {total_jobs} nuevas ofertas. Preparando notificaciones segmentadas...")

    # Obtener categorías más frecuentes en las últimas 7 horas
    try:
        cur.execute("""
            SELECT category, COUNT(*) as cnt
            FROM jobs
            WHERE is_active = TRUE AND created_at > %s AND category IS NOT NULL
            GROUP BY category
            ORDER BY cnt DESC
            LIMIT 10
        """, (time_window,))
        category_counts = {row[0].lower(): row[1] for row in cur.fetchall()}
    except Exception as e:
        print(f"⚠️ No se pudo obtener categorías: {e}")
        category_counts = {}

    cur.close()
    conn.close()

    notifications_to_send = []

    # 1. Notificaciones segmentadas por tech (si hay suficientes)
    for segment in TECH_SEGMENTS:
        count = sum(category_counts.get(kw, 0) for kw in segment["keywords"])
        if count >= 5:
            notifications_to_send.append({
                "heading": f"{segment['emoji']} Nuevas ofertas de {segment['label']}",
                "contents": f"Se publicaron {count} nuevas vacantes de {segment['label']} en las últimas horas. ¡Entra y postúlate!",
                "url": f"{BASE_URL}{segment['path']}",
                "segment": segment["label"]
            })

    # 2. Notificación general siempre al final
    notifications_to_send.append({
        "heading": "💼 Nuevas ofertas de Empleo IT 🔥",
        "contents": f"Se han publicado {total_jobs} nuevas vacantes de programación y tecnología. ¡Entra y postúlate ahora!",
        "url": BASE_URL,
        "segment": "General"
    })

    # Enviar todas
    onesignal_url = "https://onesignal.com/api/v1/notifications"
    headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": f"Basic {api_key}" if api_key else ""
    }

    for notif in notifications_to_send:
        payload = {
            "app_id": app_id if app_id else "mock-app-id",
            "included_segments": ["Subscribed Users"],
            "headings": {"es": notif["heading"], "en": notif["heading"]},
            "contents": {"es": notif["contents"], "en": notif["contents"]},
            "url": notif["url"],
        }

        if not app_id or not api_key:
            print(f"  🤖 [SIMULACIÓN] [{notif['segment']}] → {notif['heading']}")
            continue

        try:
            response = requests.post(onesignal_url, json=payload, headers=headers, timeout=15)
            result = response.json()
            if response.status_code == 200 and not result.get("errors"):
                print(f"  ✅ [{notif['segment']}] Notificación push enviada. ID: {result.get('id')}")
            else:
                print(f"  ⚠️ [{notif['segment']}] Error OneSignal ({response.status_code}): {result}")
        except Exception as e:
            print(f"  ❌ [{notif['segment']}] Error de red: {e}")

    print("===============================================")


if __name__ == "__main__":
    send_push_notification()
