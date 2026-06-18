import unittest
from unittest.mock import patch, MagicMock
import os
import sys

# Añadir el directorio raíz al path para encontrar los módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from linkedin_bot import run_linkedin_bot, upload_image_to_linkedin
from mastodon_bot import run_mastodon_bot, post_to_mastodon
import twitter_bot

from ping_sitemap import ping_google_sitemap

class TestSocialBots(unittest.TestCase):

    # 1. TEST LINKEDIN BOT
    @patch('linkedin_bot.requests.post')
    @patch('linkedin_bot.requests.put')
    @patch('linkedin_bot.psycopg2.connect')
    @patch('linkedin_bot.generate_job_card')
    @patch.dict('os.environ', {
        'LINKEDIN_ACCESS_TOKEN': 'access-token-123',
        'LINKEDIN_URN': 'urn:li:person:123',
        'DATABASE_URL': 'postgresql://test:test@localhost/test'
    })
    def test_run_linkedin_bot_success(self, mock_gen_card, mock_db_connect, mock_put, mock_post):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        
        # Ofertas no publicadas
        mock_cursor.fetchall.return_value = [
            ('job-li-1', 'Lead Engineer', 'Globex', 'Madrid', '70K', 'Backend')
        ]
        mock_cursor.fetchone.return_value = (5,)
        mock_conn.cursor.return_value = mock_cursor
        mock_db_connect.return_value = mock_conn

        # Mock de respuestas de registro y publicación en LinkedIn
        mock_res_register = MagicMock()
        mock_res_register.status_code = 201
        mock_res_register.json.return_value = {
            "value": {
                "uploadMechanism": {
                    "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest": {
                        "uploadUrl": "https://upload.linkedin.com/media"
                    }
                },
                "asset": "urn:li:digitalmediaAsset:12345"
            }
        }
        
        mock_res_post = MagicMock()
        mock_res_post.status_code = 201
        mock_res_post.json.return_value = {"id": "urn:li:share:12345"}
        
        mock_post.side_effect = [mock_res_register, mock_res_post]

        mock_put_res = MagicMock()
        mock_put_res.status_code = 201
        mock_put.return_value = mock_put_res

        # Crear un archivo temporal simulando la tarjeta de imagen
        image_path = "linkedin_card_job-li-1.jpg"
        with open(image_path, "wb") as f:
            f.write(b"JPEG mock data")

        try:
            with patch('linkedin_bot.print'):
                run_linkedin_bot()
            
            # Debe haber registrado la subida y luego compartido el post
            self.assertEqual(mock_post.call_count, 2)
            # Debe haber subido los bytes de la imagen
            mock_put.assert_called_once()
        finally:
            if os.path.exists(image_path):
                os.remove(image_path)

    # 2. TEST MASTODON BOT
    @patch('mastodon_bot.requests.post')
    @patch('mastodon_bot.psycopg2.connect')
    @patch.dict('os.environ', {
        'MASTODON_ACCESS_TOKEN': 'access-token-123',
        'DATABASE_URL': 'postgresql://test:test@localhost/test'
    })
    def test_run_mastodon_bot_success(self, mock_db_connect, mock_post):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        
        # Ofertas no publicadas
        mock_cursor.fetchall.return_value = [
            ('job-mast-1', 'Scala Dev', 'Lightbend', 'Remoto', '80.000€', 'Backend')
        ]
        mock_conn.cursor.return_value = mock_cursor
        mock_db_connect.return_value = mock_conn

        mock_res = MagicMock()
        mock_res.status_code = 200
        mock_res.json.return_value = {"id": "status-id-123", "url": "https://mastodon.social/status-url"}
        mock_post.return_value = mock_res

        with patch('mastodon_bot.print'):
            run_mastodon_bot()

        mock_post.assert_called_once()

    # 3. TEST TWITTER BOT (RETORNO TEMPRANO)
    @patch('twitter_bot.print')
    @patch.dict('os.environ', {
        'TWITTER_API_KEY': '',
        'TWITTER_API_SECRET': '',
        'TWITTER_ACCESS_TOKEN': '',
        'TWITTER_ACCESS_SECRET': ''
    }, clear=True)
    def test_twitter_bot_no_credentials(self, mock_print):
        # Si faltan las credenciales, run_twitter_bot() debe retornar temprano de manera segura
        from twitter_bot import run_twitter_bot
        run_twitter_bot()
        mock_print.assert_any_call("⚠️  Faltan credenciales de Twitter en las variables de entorno. Omitiendo publicación.")

    # 4. TEST SITEMAP PING
    @patch('ping_sitemap.urllib.request.urlopen')
    @patch('ping_sitemap.urllib.request.Request')
    @patch.dict('os.environ', {'FRONTEND_URL': 'https://test.com'})
    def test_ping_google_sitemap(self, mock_request_class, mock_urlopen):
        mock_response = MagicMock()
        mock_response.getcode.return_value = 200
        mock_urlopen.return_value = mock_response

        with patch('ping_sitemap.print') as mock_print:
            ping_google_sitemap()
            mock_print.assert_any_call("✅ Google Search Console notificado con éxito.")

        mock_urlopen.assert_called_once()

if __name__ == '__main__':
    unittest.main()
