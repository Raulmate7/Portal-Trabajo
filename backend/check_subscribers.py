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
                # VULN-22: Enmascaramiento de correos electrónicos para mitigar fuga de PII en logs y terminales
                raw_email = str(row[1]) if row[1] else ""
                if "@" in raw_email:
                    user_part, domain = raw_email.split("@", 1)
                    masked = (user_part[:2] + "***") if len(user_part) > 2 else "***"
                    masked_email = f"{masked}@{domain}"
                else:
                    masked_email = "***"
                print(f"🆔 {row[0]} | 📧 {masked_email} | 📅 {row[2]}")
        
        print("-" * 50)
        cursor.close()
        conn.close()

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_list()
