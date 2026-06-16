import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
import os
import sys

# Añadir el directorio raíz al path para encontrar los módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from send_welcome_onboarding import run_onboarding
from send_custom_alerts import send_custom_alerts
from send_instant_featured_alerts import send_instant_featured_alerts
from send_push_notifications import send_push_notification
from send_reactivation import run_reactivation

class TestOnboardingAndAlerts(unittest.TestCase):

    def setUp(self):
        import send_welcome_onboarding
        import send_custom_alerts
        import send_instant_featured_alerts
        import send_reactivation
        
        send_welcome_onboarding.EMAIL_USER = 'test@gmail.com'
        send_welcome_onboarding.EMAIL_PASSWORD = 'password'
        
        send_custom_alerts.EMAIL_USER = 'test@gmail.com'
        send_custom_alerts.EMAIL_PASSWORD = 'password'
        
        send_instant_featured_alerts.EMAIL_USER = 'test@gmail.com'
        send_instant_featured_alerts.EMAIL_PASSWORD = 'password'
        
        send_reactivation.EMAIL_USER = 'test@gmail.com'
        send_reactivation.EMAIL_PASSWORD = 'password'

    # 1. TEST ONBOARDING (STAGE 0 y STAGE 1)
    @patch('send_welcome_onboarding.smtplib.SMTP')
    @patch('send_welcome_onboarding.psycopg2.connect')
    @patch.dict('os.environ', {
        'DATABASE_URL': 'postgresql://test:test@localhost/test'
    })
    def test_run_onboarding(self, mock_db_connect, mock_smtp_class):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        
        # 1. Retornar suscriptores: uno en stage 0 (bienvenida), otro en stage 1 (recursos)
        mock_cursor.fetchall.side_effect = [
            [('sub-stage0@gmail.com', 'python', 0, None), ('sub-stage1@gmail.com', 'react', 1, datetime.now() - timedelta(days=5))], # Sub bucle principal
            [('job-1', 'Python dev', 'Acme', 'Madrid', 'Consultar')] # Ofertas para bienvenida
        ]
        mock_conn.cursor.return_value = mock_cursor
        mock_db_connect.return_value = mock_conn

        mock_smtp_instance = MagicMock()
        mock_smtp_class.return_value = mock_smtp_instance

        with patch('send_welcome_onboarding.print'):
            run_onboarding()

        # Debe mandar 2 correos (uno para el stage 0, otro para el stage 1)
        self.assertEqual(mock_smtp_instance.send_message.call_count, 2)
        mock_smtp_instance.login.assert_called_once_with('test@gmail.com', 'password')

    # 2. TEST ALERTAS PERSONALIZADAS
    @patch('send_custom_alerts.smtplib.SMTP')
    @patch('send_custom_alerts.psycopg2.connect')
    @patch.dict('os.environ', {
        'DATABASE_URL': 'postgresql://test:test@localhost/test'
    })
    def test_send_custom_alerts(self, mock_db_connect, mock_smtp_class):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        
        # 1. Retornar suscriptores y ofertas
        mock_cursor.fetchall.side_effect = [
            [('sub-alert@gmail.com', 'node', 'Madrid', 'daily')], # Suscriptores
            [('job-2', 'Node Developer', 'Globex', 'Madrid', 'https://globex.com', '50.000€')] # Ofertas
        ]
        mock_conn.cursor.return_value = mock_cursor
        mock_db_connect.return_value = mock_conn

        mock_smtp_instance = MagicMock()
        mock_smtp_class.return_value = mock_smtp_instance

        with patch('send_custom_alerts.print'):
            send_custom_alerts()

        # Debe enviar 1 alerta
        self.assertEqual(mock_smtp_instance.send_message.call_count, 1)

    # 3. TEST ALERTAS DESTACADAS AL INSTANTE
    @patch('send_instant_featured_alerts.smtplib.SMTP')
    @patch('send_instant_featured_alerts.psycopg2.connect')
    @patch.dict('os.environ', {
        'DATABASE_URL': 'postgresql://test:test@localhost/test'
    })
    def test_send_instant_featured_alerts(self, mock_db_connect, mock_smtp_class):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        
        # 1. Retornar ofertas destacadas y suscriptores
        mock_cursor.fetchall.side_effect = [
            [('job-feat', 'Senior Java Developer', 'Java Corp', 'Barcelona', 'A convenir')], # Ofertas destacadas
            [('sub-feat@gmail.com', 'java')] # Suscriptores
        ]
        mock_conn.cursor.return_value = mock_cursor
        mock_db_connect.return_value = mock_conn

        mock_smtp_instance = MagicMock()
        mock_smtp_class.return_value = mock_smtp_instance

        with patch('send_instant_featured_alerts.print'):
            send_instant_featured_alerts()

        # Debe enviar 1 correo urgente
        self.assertEqual(mock_smtp_instance.send_message.call_count, 1)

    # 4. TEST NOTIFICACIONES PUSH ONESIGNAL
    @patch('send_push_notifications.requests.post')
    @patch('send_push_notifications.psycopg2.connect')
    @patch.dict('os.environ', {
        'ONESIGNAL_APP_ID': 'app-id-123',
        'ONESIGNAL_REST_API_KEY': 'api-key-123',
        'DATABASE_URL': 'postgresql://test:test@localhost/test'
    })
    def test_send_push_notification(self, mock_db_connect, mock_post):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        
        # Retornar una oferta nueva
        mock_cursor.fetchall.return_value = [
            ('job-3', 'React Dev', 'Facebook', 'Remoto')
        ]
        mock_conn.cursor.return_value = mock_cursor
        mock_db_connect.return_value = mock_conn

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"id": "notification-id-abc"}
        mock_post.return_value = mock_response

        with patch('send_push_notifications.print'):
            send_push_notification()

        # Debe hacer la llamada post a OneSignal
        mock_post.assert_called_once()
        headers = mock_post.call_args[1]['headers']
        self.assertIn("Authorization", headers)
        self.assertEqual(headers["Authorization"], "Basic api-key-123")

    # 5. TEST REACTIVACIÓN DE SUSCRIPTORES
    @patch('send_reactivation.smtplib.SMTP')
    @patch('send_reactivation.psycopg2.connect')
    @patch.dict('os.environ', {
        'DATABASE_URL': 'postgresql://test:test@localhost/test'
    })
    def test_run_reactivation(self, mock_db_connect, mock_smtp_class):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        
        # Suscriptores pendientes de reactivación y ofertas
        mock_cursor.fetchall.side_effect = [
            [('sub-inactive@gmail.com', 'python')], # Suscriptores
            [('job-rec', 'Python Lead', 'Google', 'Remoto', '90.000€')] # Ofertas
        ]
        mock_cursor.rowcount = 1 # 1 fila borrada en limpieza
        mock_conn.cursor.return_value = mock_cursor
        mock_db_connect.return_value = mock_conn

        mock_smtp_instance = MagicMock()
        mock_smtp_class.return_value = mock_smtp_instance

        with patch('send_reactivation.print'):
            run_reactivation()

        # Debe enviar 1 email de reactivación
        self.assertEqual(mock_smtp_instance.send_message.call_count, 1)

if __name__ == '__main__':
    unittest.main()
