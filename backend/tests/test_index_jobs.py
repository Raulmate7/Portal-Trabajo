import unittest
from unittest.mock import patch, MagicMock
from index_new_jobs import index_new_jobs

class TestIndexJobs(unittest.TestCase):

    @patch('index_new_jobs.requests.post')
    @patch('index_new_jobs.get_db_connection')
    @patch.dict('os.environ', {
        'CRON_SECRET': 'test-cron-secret-123',
        'DATABASE_URL': 'postgresql://test_user:test_pass@localhost:5432/test_db',
        'FRONTEND_URL': 'https://test-frontend.vercel.app'
    })
    def test_index_new_jobs_success(self, mock_db_connect, mock_post):
        # Mock de ofertas en la base de datos
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            ('id-1', 'Rust Developer'),
            ('id-2', 'Node.js Developer')
        ]
        mock_conn.cursor.return_value = mock_cursor
        mock_db_connect.return_value = mock_conn

        # Mock de respuesta del API de indexación
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        with patch('index_new_jobs.print') as mock_print:
            index_new_jobs()

            mock_print.assert_any_call("📣 Iniciando INDEXACIÓN INSTANTÁNEA en Google...")
            mock_print.assert_any_call("🚀 Encontradas 2 ofertas para indexar.")
            mock_print.assert_any_call("✅ Google Indexada con éxito: Rust Developer (https://test-frontend.vercel.app/job/id-1)")
            mock_print.assert_any_call("✅ Google Indexada con éxito: Node.js Developer (https://test-frontend.vercel.app/job/id-2)")
            mock_print.assert_any_call("✅ URLs enviadas con éxito a IndexNow!")

        # Debe hacer 3 peticiones POST a la API (2 para Google Indexing, 1 para IndexNow)
        self.assertEqual(mock_post.call_count, 3)
        
        # Debe haber actualizado la base de datos con google_indexed_at
        # Vamos a comprobar que se ejecutaron las sentencias UPDATE
        update_calls = [
            call for call in mock_cursor.execute.call_args_list 
            if "UPDATE jobs" in call[0][0]
        ]
        self.assertEqual(len(update_calls), 2)
        # Comprobar IDs actualizados
        self.assertEqual(update_calls[0][0][1], ('id-1',))
        self.assertEqual(update_calls[1][0][1], ('id-2',))

    @patch('index_new_jobs.get_db_connection')
    @patch.dict('os.environ', {
        'CRON_SECRET': 'test-cron-secret-123',
        'DATABASE_URL': 'postgresql://test_user:test_pass@localhost:5432/test_db'
    })
    def test_index_new_jobs_none(self, mock_db_connect):
        # Mock sin ofertas
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = []
        mock_conn.cursor.return_value = mock_cursor
        mock_db_connect.return_value = mock_conn

        with patch('index_new_jobs.print') as mock_print:
            index_new_jobs()
            mock_print.assert_any_call("💤 No hay ofertas nuevas en las últimas 9 horas o pendientes en 48 horas para indexar.")

if __name__ == '__main__':
    unittest.main()
