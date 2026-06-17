import unittest
from unittest.mock import patch, MagicMock
from telegram_bot import send_to_telegram

class TestTelegramBot(unittest.TestCase):

    @patch('telegram_bot.requests.post')
    @patch('telegram_bot.psycopg2.connect')
    @patch.dict('os.environ', {
        'TELEGRAM_TOKEN': '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ',
        'TELEGRAM_CHANNEL': '@TestChannel',
        'DATABASE_URL': 'postgresql://test_user:test_pass@localhost:5432/test_db',
        'TELEGRAM_CHANNEL_FRONTEND': '',
        'TELEGRAM_CHANNEL_BACKEND': '',
        'TELEGRAM_CHANNEL_DATA_AI': '',
        'TELEGRAM_CHANNEL_CLOUD_DEVOPS': '',
        'TELEGRAM_CHANNEL_MOBILE': '',
        'TELEGRAM_CHANNEL_REMOTO': ''
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
            mock_print.assert_any_call("🤖 INICIANDO BOT DE TELEGRAM")
            mock_print.assert_any_call("🚀 Encontradas 2 ofertas nuevas. Iniciando difusión...")
            mock_print.assert_any_call("✅ Mensaje enviado con éxito al canal @TestChannel.")

        # Debe haber hecho 1 llamada a requests.post para el mensaje unificado
        self.assertEqual(mock_post.call_count, 1)
        
        # Verificar que se enviaron las reacciones 👍 y 👎 en el reply_markup
        call_args = mock_post.call_args[1]
        json_payload = call_args['json']
        self.assertIn('reply_markup', json_payload)
        inline_keyboard = json_payload['reply_markup']['inline_keyboard']
        self.assertEqual(len(inline_keyboard), 2)  # Fila 1: Ver web, Fila 2: Reactions
        self.assertEqual(inline_keyboard[1][0]['callback_data'], 'like_general')
        self.assertEqual(inline_keyboard[1][1]['callback_data'], 'dislike_general')

    @patch('telegram_bot.requests.post')
    @patch('telegram_bot.psycopg2.connect')
    @patch.dict('os.environ', {
        'TELEGRAM_TOKEN': '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ',
        'TELEGRAM_CHANNEL': '',
        'DATABASE_URL': 'postgresql://test_user:test_pass@localhost:5432/test_db',
        'TELEGRAM_CHANNEL_FRONTEND': '@FrontendChannel',
        'TELEGRAM_CHANNEL_BACKEND': '',
        'TELEGRAM_CHANNEL_DATA_AI': '',
        'TELEGRAM_CHANNEL_CLOUD_DEVOPS': '',
        'TELEGRAM_CHANNEL_MOBILE': '',
        'TELEGRAM_CHANNEL_REMOTO': '@RemotoChannel'
    })
    def test_send_to_telegram_segmented_channels(self, mock_db_connect, mock_post):
        # Mock de ofertas
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            ('id-1', 'React Developer', 'Google', 'Remoto (Mundial)', 'Consultar', 'Frontend'),
            ('id-2', 'Python Developer', 'Meta', 'Remoto', 'Consultar', 'Backend') # Remoto pero no frontend
        ]
        mock_conn.cursor.return_value = mock_cursor
        mock_db_connect.return_value = mock_conn

        mock_response = MagicMock()
        mock_response.json.return_value = {"ok": True}
        mock_post.return_value = mock_response

        send_to_telegram()

        # Debe hacer 2 posts (Frontend y Remoto)
        self.assertEqual(mock_post.call_count, 2)

        # Recoger los payloads de los posts
        payloads = [call[1]['json'] for call in mock_post.call_args_list]
        
        # Verificar reacciones en Frontend
        frontend_payload = next(p for p in payloads if p['chat_id'] == '@FrontendChannel')
        self.assertIn('reply_markup', frontend_payload)
        inline_kb = frontend_payload['reply_markup']['inline_keyboard']
        self.assertEqual(inline_kb[0][0]['callback_data'], 'like_frontend')
        self.assertEqual(inline_kb[0][1]['callback_data'], 'dislike_frontend')

        # Verificar reacciones en Remoto
        remoto_payload = next(p for p in payloads if p['chat_id'] == '@RemotoChannel')
        self.assertIn('reply_markup', remoto_payload)
        inline_kb_rem = remoto_payload['reply_markup']['inline_keyboard']
        self.assertEqual(inline_kb_rem[0][0]['callback_data'], 'like_remoto')
        self.assertEqual(inline_kb_rem[0][1]['callback_data'], 'dislike_remoto')

    @patch('telegram_bot.psycopg2.connect')
    @patch.dict('os.environ', {
        'TELEGRAM_TOKEN': '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ',
        'TELEGRAM_CHANNEL': '@TestChannel',
        'DATABASE_URL': 'postgresql://test_user:test_pass@localhost:5432/test_db',
        'TELEGRAM_CHANNEL_FRONTEND': '',
        'TELEGRAM_CHANNEL_BACKEND': '',
        'TELEGRAM_CHANNEL_DATA_AI': '',
        'TELEGRAM_CHANNEL_CLOUD_DEVOPS': '',
        'TELEGRAM_CHANNEL_MOBILE': '',
        'TELEGRAM_CHANNEL_REMOTO': ''
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
