import os
from dotenv import load_dotenv
from logic.classifier import classify_job
from db_helper import get_db_connection
from logic.dedup import compute_dedup_hash
from logic.job_identity import new_job_id, infer_work_mode
from scrapy.exceptions import DropItem


class PostgresPipeline:
    """
    Pipeline que guarda los trabajos scrapeados en MySQL.
    Se mantiene el nombre de clase PostgresPipeline para no alterar settings.py.
    """
    def open_spider(self, spider):
        load_dotenv()
        try:
            self.connection = get_db_connection()
            # BUG-005: transacciones reales (db_helper abre con autocommit=True)
            self.connection.autocommit(False)
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
            company = item.get('company', 'Desconocida')
            title = item.get('title', 'Sin título')
            work_mode = infer_work_mode(title, item.get('location', ''), item.get('description_snippet', ''))
            dedup_hash = compute_dedup_hash(company, title, work_mode or '')

            # BUG-005: la oferta ya existe por URL -> no se toca (no se reactivan ofertas
            # moderadas o expiradas); solo se enriquece salario/descripcion/categoria.
            self.cur.execute("SELECT id FROM jobs WHERE url_source = %s LIMIT 1", (item['url_source'],))
            existing = self.cur.fetchone()

            category = classify_job(item['title'], item['description_snippet'])

            if existing:
                self.cur.execute("""
                    UPDATE jobs SET
                        salary = COALESCE(NULLIF(%s, 'Consultar'), salary),
                        description_snippet = COALESCE(NULLIF(%s, 'Oferta de TecnoEmpleo'), description_snippet),
                        category = COALESCE(NULLIF(%s, 'Otros'), category)
                    WHERE id = %s
                """, (item['salary'], item['description_snippet'], category, existing[0]))
                self.connection.commit()
                return item

            # Evitar duplicidad semantica (mismo hash o mismo titulo+empresa en 48h)
            if company != 'Desconocida':
                self.cur.execute("""
                    SELECT id FROM jobs
                    WHERE (dedup_hash = %s OR (title = %s AND company = %s))
                      AND created_at > NOW() - INTERVAL 48 HOUR
                    LIMIT 1
                """, (dedup_hash, title, company))
                if self.cur.fetchone():
                    spider.logger.info(f"🚫 Oferta duplicada omitida (48h): {title} - {company}")
                    return item

            # BUG-005: id (PK sin DEFAULT), dedup_hash y work_mode explicitos; is_active usa el DEFAULT TRUE
            self.cur.execute("""
                INSERT INTO jobs (
                    id, title, company, location, salary, description_snippet,
                    url_source, created_at, sector_id, category, dedup_hash, work_mode
                )
                VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s,
                    (SELECT id FROM sectors WHERE slug = %s LIMIT 1),
                    %s, %s, %s
                )
            """, (
                new_job_id(),
                item['title'],
                item['company'],
                item['location'],
                item['salary'],
                item['description_snippet'],
                item['url_source'],
                item['created_at'],
                item['sector_slug'],
                category,
                dedup_hash,
                work_mode,
            ))

            self.connection.commit()
            spider.logger.info(f"💾 Oferta procesada/guardada: {item['title']}")

        except Exception as e:
            spider.logger.error(f"❌ Error guardando oferta en MySQL: {e}")
            try:
                self.connection.rollback()
            except Exception:
                pass
            raise DropItem(f"Fallo al guardar oferta: {e}")

        return item
