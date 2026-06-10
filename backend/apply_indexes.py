import os
import psycopg2
from dotenv import load_dotenv

def apply_indexes():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    
    if not db_url:
        print("❌ Error: DATABASE_URL no definida en .env")
        return
        
    sql_path = "database_optimization.sql"
    if not os.path.exists(sql_path):
        print(f"❌ Error: No se encontró el archivo {sql_path}")
        return
        
    print("🔌 Conectando a PostgreSQL...")
    try:
        conn = psycopg2.connect(db_url)
        # Necesitamos activar autocommit para permitir la creación de extensiones e índices si fuera necesario
        conn.autocommit = True
        cur = conn.cursor()
        
        print("📖 Leyendo archivo SQL...")
        with open(sql_path, "r", encoding="utf-8") as f:
            sql_queries = f.read()
            
        print("⚡ Aplicando optimizaciones de base de datos...")
        cur.execute(sql_queries)
        print("✅ ¡Optimizaciones aplicadas correctamente!")
        
        # Verificar índices creados
        cur.execute("SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'jobs'")
        indexes = cur.fetchall()
        print("\n📋 Índices activos en la tabla 'jobs':")
        for name, definition in indexes:
            print(f" - {name}")
            
        conn.close()
    except Exception as e:
        print(f"❌ Error aplicando optimizaciones: {e}")

if __name__ == "__main__":
    apply_indexes()
