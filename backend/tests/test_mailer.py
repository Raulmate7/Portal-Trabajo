import unittest
from unittest.mock import patch, MagicMock
from mailer import send_newsletter

class TestMailer(unittest.TestCase):

    @patch('mailer.smtplib.SMTP')
    @patch('mailer.psycopg2.connect')
    @patch.dict('os.environ', {
        'DATABASE_URL': 'postgresql://test_user:test_pass@localhost:5432/test_db',
        'EMAIL_USER': 'test@gmail.com',
        'EMAIL_PASSWORD': 'testpassword'
    })
    def test_send_newsletter_success(self, mock_db_connect, mock_smtp_class):
        # Mock de base de datos
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        
        # 1. Retornar ofertas recientes para el boletín
        # Columns: id, title, company, location, url_source
        mock_cursor.fetchall.side_effect = [
            [('job-1', 'Python Dev', 'Acme', 'Madrid', 'https://job-1.com', 'Backend')], # Primer fetchall (ofertas)
            [('sub-1@gmail.com',), ('sub-2@gmail.com',)]                       # Segundo fetchall (suscriptores)
        ]
        mock_conn.cursor.return_value = mock_cursor
        mock_db_connect.return_value = mock_conn

        # Mock de SMTP
        mock_smtp_instance = MagicMock()
        mock_smtp_class.return_value = mock_smtp_instance

        with patch('mailer.print') as mock_print:
            send_newsletter()

            mock_print.assert_any_call("🚀 Preparando envío de Newsletter Semanal...")
            mock_print.assert_any_call("✅ Login correcto en Gmail.")
            mock_print.assert_any_call("✅ Enviado a: sub-1@gmail.com")
            mock_print.assert_any_call("✅ Enviado a: sub-2@gmail.com")
            mock_print.assert_any_call("\n🎉 Resumen: 2 enviados, 0 fallidos.")

        # Verificar login e interacciones SMTP
        mock_smtp_instance.login.assert_called_once_with('test@gmail.com', 'testpassword')
        self.assertEqual(mock_smtp_instance.send_message.call_count, 2)
        mock_smtp_instance.quit.assert_called_once()

    @patch('mailer.psycopg2.connect')
    @patch.dict('os.environ', {
        'DATABASE_URL': 'postgresql://test_user:test_pass@localhost:5432/test_db'
    })
    def test_send_newsletter_no_jobs(self, mock_db_connect):
        # Simular que no hay ofertas esta semana
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = []
        mock_conn.cursor.return_value = mock_cursor
        mock_db_connect.return_value = mock_conn

        with patch('mailer.print') as mock_print:
            send_newsletter()
            mock_print.assert_any_call("💤 No hay ofertas nuevas esta semana. Fin del proceso.")

if __name__ == '__main__':
    unittest.main()
