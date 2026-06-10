import psycopg2
import os
from dotenv import load_dotenv
from logic.classifier import classify_job


class PostgresPipeline:
    def open_spider(self, spider):
        # Cargamos las credenciales
        load_dotenv()
        database_url = os.getenv("DATABASE_URL")
        
        # Nos conectamos a Supabase
        self.connection = psycopg2.connect(database_url)
        self.cur = self.connection.cursor()
        spider.logger.info("🔌 Conexión a PostgreSQL establecida.")

    def close_spider(self, spider):
        self.cur.close()
        self.connection.close()
        spider.logger.info("🔌 Conexión a PostgreSQL cerrada.")

    def process_item(self, item, spider):
        try:
            # Evitar duplicidad semántica (mismo título y empresa conocida en las últimas 48 horas)
            company = item.get('company', 'Desconocida')
            title = item.get('title', 'Sin título')
            if company != 'Desconocida':
                self.cur.execute("""
                    SELECT id FROM jobs 
                    WHERE title = %s AND company = %s AND created_at > NOW() - INTERVAL '48 hours'
                """, (title, company))
                if self.cur.fetchone():
                    spider.logger.info(f"🚫 Oferta duplicada omitida (48h): {title} - {company}")
                    return item

            # MAGIA: Insertamos la oferta buscando automáticamente el ID del sector y clasificando la categoría
            category = classify_job(item['title'], item['description_snippet'])
            self.cur.execute("""
                INSERT INTO jobs (
                    title, 
                    company, 
                    location, 
                    salary, 
                    description_snippet, 
                    url_source, 
                    created_at, 
                    sector_id,
                    category
                )
                VALUES (
                    %s, %s, %s, %s, %s, %s, %s,
                    (SELECT id FROM sectors WHERE slug = %s),
                    %s
                )
                ON CONFLICT (url_source) DO NOTHING;
            """, (
                item['title'],
                item['company'],
                item['location'],
                item['salary'],
                item['description_snippet'],
                item['url_source'],
                item['created_at'],
                item['sector_slug'], # Aquí pasamos la etiqueta
                category
            ))
            
            self.connection.commit()
            spider.logger.info(f"💾 Oferta guardada: {item['title']}")
            
        except Exception as e:
            spider.logger.error(f"❌ Error guardando oferta: {e}")
            self.connection.rollback()
            
        return item
