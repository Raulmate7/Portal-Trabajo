import os
import sys

# Truco de importación para cargar el verdadero psycopg2 instalado en el sistema
# y evitar cargar el archivo psycopg2.py local que está en este mismo directorio.
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path = [p for p in sys.path if p != script_dir and p != '']

import psycopg2
import json
from datetime import datetime, date

# Cargar variables de entorno
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL or not DATABASE_URL.startswith("postgres"):
    # Si la variable se ha cambiado, forzar la de Supabase
    DATABASE_URL = "postgresql://postgres.ggwrsvzlaxeephkhwmtn:Tolili07@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"

print("🔌 Conectando a Supabase para volcado de datos...")
try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    print("✅ Conexión establecida.")
except Exception as e:
    print(f"❌ Error conectando a Supabase: {e}")
    sys.exit(1)

TABLES = ['sectors', 'jobs', 'subscribers', 'alerts', 'sponsored_jobs', 'email_tracking', 'premium_leads']

# Carpeta de destino
output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "migration_data")
os.makedirs(output_dir, exist_ok=True)

from decimal import Decimal

# Helper para serializar fechas y decimales a formato string/float para JSON
def datetime_serializer(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Type {type(obj)} not serializable")

for table in TABLES:
    print(f"📦 Descargando tabla '{table}'...")
    try:
        # Obtener columnas
        cur.execute(f"SELECT * FROM {table} LIMIT 0")
        colnames = [desc[0] for desc in cur.description]
        
        # Obtener todos los registros
        cur.execute(f"SELECT * FROM {table}")
        rows = cur.fetchall()
        
        # Estructurar datos como lista de diccionarios
        data = []
        for row in rows:
            data.append(dict(zip(colnames, row)))
            
        # Guardar en archivo JSON
        filepath = os.path.join(output_dir, f"{table}.json")
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, default=datetime_serializer, indent=2, ensure_ascii=False)
            
        print(f"  - ✅ Guardados {len(rows)} registros en '{filepath}'")
    except Exception as e:
        print(f"  - ❌ Error volcando tabla '{table}': {e}")

cur.close()
conn.close()
print("\n🎉 Proceso de volcado a JSON finalizado con éxito.")
