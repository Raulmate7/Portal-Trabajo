import unittest
import os
import psycopg2
from dotenv import load_dotenv

class TestDatabase(unittest.TestCase):

    def setUp(self):
        load_dotenv()
        self.db_url = os.getenv("DATABASE_URL")

    def test_database_url_configured(self):
        # Comprobar que DATABASE_URL está configurado en el entorno
        self.assertIsNotNone(self.db_url, "DATABASE_URL no está configurada en las variables de entorno / .env")
        self.assertTrue(self.db_url.startswith("postgresql://") or self.db_url.startswith("postgres://"), "DATABASE_URL no tiene un formato válido de PostgreSQL")

    def test_database_connection_and_schema(self):
        # Comprobar conexión real y que existan las tablas necesarias del esquema
        self.assertIsNotNone(self.db_url)
        try:
            conn = psycopg2.connect(self.db_url)
            cur = conn.cursor()

            # Consultar las tablas existentes en el esquema public
            cur.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            tables = [row[0] for row in cur.fetchall()]

            required_tables = ['sectors', 'jobs', 'alerts', 'sponsored_jobs', 'subscribers', 'premium_leads']
            for table in required_tables:
                self.assertIn(table, tables, f"La tabla requerida '{table}' no existe en la base de datos")

            cur.close()
            conn.close()
        except Exception as e:
            self.fail(f"Fallo al conectar o consultar la base de datos: {e}")

if __name__ == '__main__':
    unittest.main()
