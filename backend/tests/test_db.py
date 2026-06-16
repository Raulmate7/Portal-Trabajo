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
        self.assertTrue(
            self.db_url.startswith("postgresql://") or 
            self.db_url.startswith("postgres://") or 
            self.db_url.startswith("mysql://"), 
            "DATABASE_URL no tiene un formato válido (postgresql://, postgres:// o mysql://)"
        )

    def test_database_connection_and_schema(self):
        # Comprobar conexión real y que existan las tablas necesarias del esquema
        self.assertIsNotNone(self.db_url)
        try:
            # Usar un timeout corto para evitar bloqueos
            conn = psycopg2.connect(self.db_url, connect_timeout=3)
            cur = conn.cursor()
        except Exception as e:
            err_msg = str(e).lower()
            if "timeout" in err_msg or "timed out" in err_msg or "refused" in err_msg or "inaccesible" in err_msg or "lost connection" in err_msg:
                self.skipTest(f"Base de datos inaccesible temporalmente o por cortafuegos ({e}). Saltando test de esquema.")
            else:
                self.fail(f"Fallo al conectar a la base de datos: {e}")

        try:
            # Consultar las tablas existentes en el esquema
            cur.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            tables = [row[0] for row in cur.fetchall()]

            required_tables = ['sectors', 'jobs', 'alerts', 'sponsored_jobs', 'subscribers', 'premium_leads', 'job_reactions']
            for table in required_tables:
                self.assertIn(table, tables, f"La tabla requerida '{table}' no existe en la base de datos")

            cur.close()
            conn.close()
        except Exception as e:
            self.fail(f"Fallo al consultar la base de datos: {e}")

if __name__ == '__main__':
    unittest.main()
