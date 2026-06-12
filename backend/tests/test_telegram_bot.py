import unittest
from unittest.mock import patch, MagicMock
from telegram_bot import send_to_telegram

class TestTelegramBot(unittest.TestCase):

    @patch('telegram_bot.requests.post')
    @patch('telegram_bot.psycopg2.connect')
    @patch.dict('os.environ', {
        'TELEGRAM_TOKEN': '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ',
        'TELEGRAM_CHANNEL': '@TestChannel',
        'DATABASE_URL': 'postgresql://test_user:test_pass@localhost:5432/test_db'
    })
    def test_send_to_telegram_with_new_jobs(self, mock_db_connect, mock_post):
        # Mock de ofertas en la base de datos (últimas 7 horas)
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            ('id-1', 'Senior Backend Developer', 'Google', 'Remoto (Mundial)', '60,000 - 80,000 EUR', 'Backend'),
            ('id-2', 'Frontend Developer React', 'Meta', 'Madrid, España', 'Consultar', 'Frontend')
        ]
        mock_conn.cursor.return_value = mock_cursor
        mock_db_connect.return_value = mock_conn

        # Mock de la respuesta HTTP de Telegram
        mock_response = MagicMock()
        mock_response.json.return_value = {"ok": True}
        mock_post.return_value = mock_response

        with patch('telegram_bot.print') as mock_print:
            send_to_telegram()

            # Verificar que se imprimió la búsqueda y envío
            mock_print.assert_any_call("📢 Iniciando difusión GENERAL (Sin filtros de usuario)...")
            mock_print.assert_any_call("🚀 Encontradas 2 ofertas. Enviando al canal público...")
            mock_print.assert_any_call("✅ Mensaje agrupado enviado con éxito a Telegram.")

        # Debe haber hecho 1 llamada a requests.post para el mensaje unificado
        self.assertEqual(mock_post.call_count, 1)

    @patch('telegram_bot.psycopg2.connect')
    @patch.dict('os.environ', {
        'TELEGRAM_TOKEN': '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ',
        'TELEGRAM_CHANNEL': '@TestChannel',
        'DATABASE_URL': 'postgresql://test_user:test_pass@localhost:5432/test_db'
    })
    def test_send_to_telegram_no_new_jobs(self, mock_db_connect):
        # Simular que no hay ofertas nuevas
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = []
        mock_conn.cursor.return_value = mock_cursor
        mock_db_connect.return_value = mock_conn

        with patch('telegram_bot.print') as mock_print:
            send_to_telegram()
            mock_print.assert_any_call("💤 No hay ofertas nuevas en las últimas 7 horas.")

if __name__ == '__main__':
    unittest.main()
