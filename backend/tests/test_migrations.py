import unittest
from unittest.mock import patch, MagicMock
import os
import sys

# Añadir el directorio raíz al path para encontrar los módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from add_referred_by_column import migrate as migrate_referred_by
from add_reactions_table import migrate as migrate_reactions
from add_google_indexed_at import migrate as migrate_google_indexed_at

class TestMigrations(unittest.TestCase):

    @patch('add_referred_by_column.psycopg2.connect')
    @patch.dict('os.environ', {'DATABASE_URL': 'postgresql://test_user:test_pass@localhost:5432/test_db'})
    def test_add_referred_by_column_success(self, mock_connect):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_connect.return_value = mock_conn

        with patch('add_referred_by_column.print') as mock_print:
            migrate_referred_by()
            
            # Verificar llamadas esperadas
            mock_print.assert_any_call("🔗 Conectando a la base de datos...")
            mock_print.assert_any_call("✅ Columna 'referred_by' agregada con éxito.")
            mock_print.assert_any_call("🎉 Migración de subscribers completada.")

        # Verificar ejecución de DDL
        mock_cursor.execute.assert_called_once_with("ALTER TABLE subscribers ADD COLUMN referred_by VARCHAR(255) NULL;")
        mock_conn.commit.assert_called_once()
        mock_cursor.close.assert_called_once()
        mock_conn.close.assert_called_once()

    @patch('add_referred_by_column.psycopg2.connect')
    @patch.dict('os.environ', {'DATABASE_URL': 'postgresql://test_user:test_pass@localhost:5432/test_db'})
    def test_add_referred_by_column_duplicate(self, mock_connect):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        
        # Simular que falla porque la columna ya existe
        mock_cursor.execute.side_effect = Exception("Duplicate column name 'referred_by'")
        mock_conn.cursor.return_value = mock_cursor
        mock_connect.return_value = mock_conn

        with patch('add_referred_by_column.print') as mock_print:
            migrate_referred_by()
            
            # Debe capturar la excepción e imprimir que ya existe
            mock_print.assert_any_call("ℹ️ La columna 'referred_by' ya existe.")
            mock_print.assert_any_call("🎉 Migración de subscribers completada.")

        mock_conn.rollback.assert_called_once()

    @patch('add_reactions_table.psycopg2.connect')
    @patch.dict('os.environ', {'DATABASE_URL': 'postgresql://test_user:test_pass@localhost:5432/test_db'})
    def test_add_reactions_table_postgres(self, mock_connect):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        
        # Mock de detección de versión (PostgreSQL)
        mock_cursor.fetchone.return_value = ("PostgreSQL 14.2 on x86_64",)
        mock_conn.cursor.return_value = mock_cursor
        mock_connect.return_value = mock_conn

        with patch('add_reactions_table.print') as mock_print:
            migrate_reactions()
            
            mock_print.assert_any_call("✅ Tabla 'job_reactions' creada/verificada con éxito.")
            mock_print.assert_any_call("🎉 Migración de job_reactions completada.")

        # Debe crear la tabla con la sintaxis de Postgres (SERIAL)
        called_queries = [call[0][0] for call in mock_cursor.execute.call_args_list]
        self.assertTrue(any("SERIAL PRIMARY KEY" in q for q in called_queries))
        mock_conn.commit.assert_called_once()

    @patch('add_reactions_table.psycopg2.connect')
    @patch.dict('os.environ', {'DATABASE_URL': 'postgresql://test_user:test_pass@localhost:5432/test_db'})
    def test_add_reactions_table_mysql(self, mock_connect):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        
        # Mock de detección de versión (MySQL)
        mock_cursor.fetchone.return_value = ("8.0.28-0ubuntu0.20.04.3 - MySQL Community Server - GPL",)
        mock_conn.cursor.return_value = mock_cursor
        mock_connect.return_value = mock_conn

        with patch('add_reactions_table.print') as mock_print:
            migrate_reactions()
            
            mock_print.assert_any_call("✅ Tabla 'job_reactions' creada/verificada con éxito.")
            mock_print.assert_any_call("🎉 Migración de job_reactions completada.")

        # Debe crear la tabla con la sintaxis de MySQL (AUTO_INCREMENT, ENGINE=InnoDB)
        called_queries = [call[0][0] for call in mock_cursor.execute.call_args_list]
        self.assertTrue(any("AUTO_INCREMENT PRIMARY KEY" in q for q in called_queries))
        self.assertTrue(any("ENGINE=InnoDB" in q for q in called_queries))
        mock_conn.commit.assert_called_once()

    @patch('add_google_indexed_at.psycopg2.connect')
    @patch.dict('os.environ', {'DATABASE_URL': 'postgresql://test_user:test_pass@localhost:5432/test_db'})
    def test_add_google_indexed_at_success(self, mock_connect):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_connect.return_value = mock_conn

        with patch('add_google_indexed_at.print') as mock_print:
            migrate_google_indexed_at()
            
            mock_print.assert_any_call("🔗 Conectando a la base de datos...")
            mock_print.assert_any_call("✅ Columna 'google_indexed_at' agregada con éxito.")
            mock_print.assert_any_call("🎉 Migración de jobs completada.")

        # Verificar ejecución de DDL
        mock_cursor.execute.assert_called_once_with("ALTER TABLE jobs ADD COLUMN google_indexed_at TIMESTAMP NULL DEFAULT NULL;")
        mock_conn.commit.assert_called_once()
        mock_cursor.close.assert_called_once()
        mock_conn.close.assert_called_once()

    @patch('add_google_indexed_at.psycopg2.connect')
    @patch.dict('os.environ', {'DATABASE_URL': 'postgresql://test_user:test_pass@localhost:5432/test_db'})
    def test_add_google_indexed_at_duplicate(self, mock_connect):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        
        # Simular que falla porque la columna ya existe
        mock_cursor.execute.side_effect = Exception("Duplicate column name 'google_indexed_at'")
        mock_conn.cursor.return_value = mock_cursor
        mock_connect.return_value = mock_conn

        with patch('add_google_indexed_at.print') as mock_print:
            migrate_google_indexed_at()
            
            mock_print.assert_any_call("ℹ️ La columna 'google_indexed_at' ya existe.")
            mock_print.assert_any_call("🎉 Migración de jobs completada.")

        mock_conn.rollback.assert_called_once()

if __name__ == '__main__':
    unittest.main()
