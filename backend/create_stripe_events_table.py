"""
Migración DDL: Creación de la tabla stripe_processed_events para garantizar
la idempotencia y mitigar ataques de repetición (Replay) y carreras concurrentes en webhooks.
"""
import os
import sys
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
load_dotenv(os.path.join(os.path.dirname(__file__), '../frontend/.env.local'))

from db_helper import get_db_connection

def create_stripe_processed_events_table():
    print("🚀 Creando tabla stripe_processed_events para idempotencia de Stripe...")
    sql = """
    CREATE TABLE IF NOT EXISTS stripe_processed_events (
        event_id VARCHAR(255) PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(sql)
        conn.close()
        print("✅ Tabla stripe_processed_events creada / verificada con éxito.")
    except Exception as e:
        print(f"ℹ️ Conexión directa a MySQL omitida o no disponible: {e}")
        print("ℹ️ La tabla será inicializada dinámicamente vía runtime/proxy por el webhook.")

if __name__ == '__main__':
    create_stripe_processed_events_table()

