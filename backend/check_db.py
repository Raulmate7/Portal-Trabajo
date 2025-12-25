import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

try:
    print("🔌 Conectando a la Base de Datos...")
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()

    # Pedimos una fila vacía solo para ver los encabezados
    cur.execute("SELECT * FROM jobs LIMIT 0")

    # Sacamos los nombres de las columnas
    nombres_columnas = [desc[0] for desc in cur.description]

    print("\n📋 ¡HEMOS ENCONTRADO LOS NOMBRES REALES!")
    print("========================================")
    print(nombres_columnas)
    print("========================================\n")

    # Verificamos cuál es la de los enlaces
    posibles = ['url', 'link', 'href', 'external_url', 'source_url']
    encontrada = next((x for x in nombres_columnas if x in posibles), "NINGUNA (¡Qué raro!)")
    print(f"👉 La columna para los enlaces parece ser: '{encontrada}'")

    conn.close()

except Exception as e:
    print(f"❌ Error: {e}")
