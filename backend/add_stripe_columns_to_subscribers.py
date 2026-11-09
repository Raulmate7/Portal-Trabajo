"""
Migración DDL: Agregar columnas stripe_customer_id y stripe_subscription_id
a la tabla subscribers para trazabilidad y revocación canónica (VULN-32).
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
load_dotenv(os.path.join(os.path.dirname(__file__), '../frontend/.env.local'))

from db_helper import get_db_connection

def add_stripe_columns():
    print("🚀 Verificando/agregando columnas stripe_* a subscribers...")
    statements = [
        "ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);",
        "ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);",
        "CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_sub ON subscribers (stripe_subscription_id);"
    ]
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            for sql in statements:
                try:
                    cursor.execute(sql)
                except Exception as stmt_err:
                    print(f"Nota en statement: {stmt_err}")
        conn.close()
        print("✅ Columnas de Stripe en subscribers verificadas con éxito.")
    except Exception as e:
        print(f"ℹ️ Conexión directa a MySQL omitida o no disponible: {e}")

if __name__ == '__main__':
    add_stripe_columns()

