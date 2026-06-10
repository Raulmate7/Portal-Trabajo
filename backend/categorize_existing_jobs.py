import os
import psycopg2
from dotenv import load_dotenv
from logic.classifier import classify_job

def migrate_categories():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    
    if not db_url:
        print("❌ Error: DATABASE_URL no definida en .env")
        return
        
    print("🔌 Conectando a PostgreSQL...")
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # 1. Obtener todas las ofertas que están como 'Otros'
        print("🔍 Buscando ofertas con categoría 'Otros'...")
        cur.execute("""
            SELECT id, title, description_snippet 
            FROM jobs 
            WHERE category = 'Otros'
        """)
        jobs = cur.fetchall()
        
        total_jobs = len(jobs)
        print(f"📦 Encontradas {total_jobs} ofertas en 'Otros'. Iniciando clasificación...")
        
        updated_counts = {}
        batch_size = 500
        updates = []
        
        for idx, (job_id, title, desc) in enumerate(jobs):
            category = classify_job(title, desc)
            
            if category != 'Otros':
                updates.append((category, job_id))
                updated_counts[category] = updated_counts.get(category, 0) + 1
            
            # Ejecutar actualizaciones en bloques para rendimiento
            if len(updates) >= batch_size:
                cur.executemany("UPDATE jobs SET category = %s WHERE id = %s", updates)
                conn.commit()
                updates = []
                print(f" ⚙️ Procesados {idx + 1}/{total_jobs}...")
                
        # Procesar lote final restante
        if updates:
            cur.executemany("UPDATE jobs SET category = %s WHERE id = %s", updates)
            conn.commit()
            
        print("\n🎉 ¡Clasificación masiva completada con éxito!")
        print("📊 Estadísticas de reclasificación:")
        total_migrated = sum(updated_counts.values())
        for cat, count in sorted(updated_counts.items(), key=lambda x: x[1], reverse=True):
            pct = (count / total_jobs) * 100
            print(f" - {cat}: {count} ofertas ({pct:.2f}%)")
            
        print(f" - Sin cambios (quedan en 'Otros'): {total_jobs - total_migrated} ofertas")
        
        conn.close()
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")

if __name__ == "__main__":
    migrate_categories()
