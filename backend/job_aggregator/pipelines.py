import os
from dotenv import load_dotenv
from logic.classifier import classify_job
from db_helper import get_db_connection


class PostgresPipeline:
    """
    Pipeline que guarda los trabajos scrapeados en MySQL.
    Se mantiene el nombre de clase PostgresPipeline para no alterar settings.py.
    """
    def open_spider(self, spider):
        load_dotenv()
        try:
            self.connection = get_db_connection()
            self.cur = self.connection.cursor()
            spider.logger.info("🔌 Conexión a MySQL establecida en Scrapy Pipeline.")
        except Exception as e:
            spider.logger.error(f"❌ Error de conexión inicial a MySQL: {e}")
            raise e

    def close_spider(self, spider):
        if hasattr(self, 'cur') and self.cur:
            self.cur.close()
        if hasattr(self, 'connection') and self.connection:
            self.connection.close()
        spider.logger.info("🔌 Conexión a MySQL cerrada en Scrapy Pipeline.")

    def process_item(self, item, spider):
        try:
            # Evitar duplicidad semántica (mismo título y empresa conocida en las últimas 48 horas)
            company = item.get('company', 'Desconocida')
            title = item.get('title', 'Sin título')
            if company != 'Desconocida':
                # MySQL usa INTERVAL 48 HOUR en vez de INTERVAL '48 hours'
                self.cur.execute("""
                    SELECT id FROM jobs 
                    WHERE title = %s AND company = %s AND created_at > NOW() - INTERVAL 48 HOUR
                """, (title, company))
                if self.cur.fetchone():
                    spider.logger.info(f"🚫 Oferta duplicada omitida (48h): {title} - {company}")
                    return item

            # Insertamos la oferta buscando automáticamente el ID del sector y clasificando la categoría
            category = classify_job(item['title'], item['description_snippet'])
            
            # En MySQL usamos INSERT IGNORE en lugar de ON CONFLICT DO NOTHING
            self.cur.execute("""
                INSERT IGNORE INTO jobs (
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
            """, (
                item['title'],
                item['company'],
                item['location'],
                item['salary'],
                item['description_snippet'],
                item['url_source'],
                item['created_at'],
                item['sector_slug'],
                category
            ))
            
            self.connection.commit()
            spider.logger.info(f"💾 Oferta procesada/guardada: {item['title']}")
            
        except Exception as e:
            spider.logger.error(f"❌ Error guardando oferta en MySQL: {e}")
            self.connection.rollback()
            
        return item
