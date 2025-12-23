import os
import psycopg2
from dotenv import load_dotenv

# Cargar variables de entorno (contraseñas)
load_dotenv()

def check_list():
    try:
        # 1. Conectar a la base de datos
        print("🔌 Conectando a la base de datos...")
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cursor = conn.cursor()

        # 2. Pedir la lista de emails
        cursor.execute("SELECT id, email, created_at FROM subscribers ORDER BY created_at DESC;")
        rows = cursor.fetchall()

        print(f"\n📋 LISTA DE SUSCRIPTORES ({len(rows)} en total):")
        print("-" * 50)
        
        if not rows:
            print("⚠️  La lista está vacía.")
        else:
            for row in rows:
                # row[0] es ID, row[1] es Email, row[2] es Fecha
                print(f"🆔 {row[0]} | 📧 {row[1]} | 📅 {row[2]}")
        
        print("-" * 50)
        cursor.close()
        conn.close()

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_list()
