# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html

import os
import psycopg2
from psycopg2 import errors
from dotenv import load_dotenv

class PostgresPipeline:
    """
    Pipeline para guardar los items de Scrapy en una base de datos PostgreSQL.
    Maneja la excepción de duplicados (IntegrityError) para ignorar ofertas existentes.
    """
    def __init__(self):
        load_dotenv()
        self.db_url = os.getenv("DATABASE_URL")
        if not self.db_url:
            raise ValueError("DATABASE_URL no está configurada. Por favor, revisa tu archivo .env.")
        self.connection = None
        self.cursor = None

    def open_spider(self, spider):
        """
        Se llama cuando el spider se abre. Establece la conexión a la DB.
        """
        try:
            self.connection = psycopg2.connect(self.db_url)
            self.cursor = self.connection.cursor()
            spider.logger.info("Conexión a PostgreSQL establecida con éxito.")
        except psycopg2.Error as e:
            spider.logger.error(f"Error al conectar a PostgreSQL: {e}")
            # Si la conexión falla, es un error crítico
            raise

    def close_spider(self, spider):
        """
        Se llama cuando el spider se cierra. Cierra la conexión a la DB.
        """
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
            spider.logger.info("Conexión a PostgreSQL cerrada.")

    def process_item(self, item, spider):
        """
        Procesa cada item y lo inserta en la tabla 'jobs'.
        """
        try:
            self.cursor.execute(
                """
                INSERT INTO jobs (title, company, location, salary, description_snippet, url_source, sector_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    item.get('title'),
                    item.get('company'),
                    item.get('location', 'España'), # Usar el default si no se encuentra
                    item.get('salary'),
                    item.get('description_snippet'),
                    item.get('url_source'),
                    item.get('sector_id')
                )
            )
            self.connection.commit()
            spider.logger.info(f"Oferta insertada: {item.get('title')}")

        except errors.UniqueViolation:
            # Manejar la excepción de duplicados (url_source UNIQUE)
            self.connection.rollback() # Deshacer la transacción fallida
            spider.logger.debug(f"Oferta duplicada ignorada: {item.get('url_source')}")
        
        except psycopg2.Error as e:
            self.connection.rollback()
            spider.logger.error(f"Error al insertar oferta en DB: {e}")
            # Podrías re-lanzar la excepción si el error es grave
            # raise
            
        return item
