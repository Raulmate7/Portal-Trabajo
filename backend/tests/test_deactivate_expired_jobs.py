import unittest
from unittest.mock import patch, MagicMock
from deactivate_expired_jobs import deactivate_expired_jobs

class TestDeactivateExpiredJobs(unittest.TestCase):

    @patch('deactivate_expired_jobs.requests.post')
    @patch('deactivate_expired_jobs.get_db_connection')
    @patch.dict('os.environ', {
        'CRON_SECRET': 'test-cron-secret-123',
        'DATABASE_URL': 'postgresql://test_user:test_pass@localhost:5432/test_db',
        'FRONTEND_URL': 'https://test-frontend.vercel.app'
    })
    def test_deactivate_expired_jobs_success(self, mock_db_connect, mock_post):
        # Mock de ofertas expiradas en la base de datos
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            ('id-old-1', 'Old PHP Dev Job'),
            ('id-old-2', 'Expired React Job')
        ]
        mock_conn.cursor.return_value = mock_cursor
        mock_db_connect.return_value = mock_conn

        # Mock de respuesta del API de indexación
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        with patch('deactivate_expired_jobs.print') as mock_print:
            deactivate_expired_jobs()

            mock_print.assert_any_call("🧹 Iniciando LIMPIEZA, DESINDEXACIÓN y PURGA de ofertas antiguas...")
            mock_print.assert_any_call("📦 Encontradas 2 ofertas expiradas para desactivar y desindexar.")
            mock_print.assert_any_call("✅ Google De-indexada con éxito: Old PHP Dev Job (https://test-frontend.vercel.app/job/id-old-1)")
            mock_print.assert_any_call("✅ Google De-indexada con éxito: Expired React Job (https://test-frontend.vercel.app/job/id-old-2)")
            mock_print.assert_any_call("💾 Base de Datos: 2 ofertas marcadas como is_active = 0 (inactivas).")
            mock_print.assert_any_call("✅ URLs enviadas con éxito a IndexNow para de-indexación!")

        # Debe hacer 3 peticiones POST a la API (2 para Google De-indexing, 1 para IndexNow)
        self.assertEqual(mock_post.call_count, 3)

        # Verificar que se llamó al execute del cursor para actualizar el estado en BD
        # Debe haber llamado a update jobs is_active = 0
        mock_cursor.execute.assert_any_call("""
                UPDATE jobs
                SET is_active = 0
                WHERE id IN (%s, %s)
            """, ('id-old-1', 'id-old-2'))

    @patch('deactivate_expired_jobs.get_db_connection')
    @patch.dict('os.environ', {
        'CRON_SECRET': 'test-cron-secret-123',
        'DATABASE_URL': 'postgresql://test_user:test_pass@localhost:5432/test_db'
    })
    def test_deactivate_expired_jobs_none(self, mock_db_connect):
        # Mock sin ofertas expiradas
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = []
        mock_conn.cursor.return_value = mock_cursor
        mock_db_connect.return_value = mock_conn

        with patch('deactivate_expired_jobs.print') as mock_print:
            deactivate_expired_jobs()
            mock_print.assert_any_call("💤 No hay ofertas expiradas para procesar.")

if __name__ == '__main__':
    unittest.main()
