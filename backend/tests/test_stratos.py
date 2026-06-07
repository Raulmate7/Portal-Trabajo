import unittest
from unittest.mock import patch, MagicMock
from scraper_infoempleo import scrape_stratos

class TestStratosScraper(unittest.TestCase):

    @patch('requests.get')
    @patch('psycopg2.connect')
    def test_scrape_stratos(self, mock_db_connect, mock_get):
        # Mock HTML response from Stratos
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = """
        <table>
            <tr>
                <td>Logo</td>
                <td><a href="/trabajo?job=123">Software Architect</a></td>
                <td>Barcelona, España</td>
                <td>Google</td>
            </tr>
            <tr>
                <td>Logo</td>
                <td><a href="/trabajo?job=456">React Dev</a></td>
                <td>Remote</td>
                <td>Facebook</td>
            </tr>
        </table>
        """
        mock_get.return_value = mock_response

        # Mock database connection and cursor
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        
        # Simular que las ofertas no están duplicadas (cur.fetchone devuelve None)
        mock_cursor.fetchone.return_value = None
        mock_conn.cursor.return_value = mock_cursor
        mock_db_connect.return_value = mock_conn

        with patch('scraper_infoempleo.print') as mock_print:
            scrape_stratos()
            
            # Verificar que se encontraron 2 ofertas
            mock_print.assert_any_call("🔍 Stratos: Encontradas 2 ofertas.")
            # Verificar que se insertaron 2 nuevas
            mock_print.assert_any_call("✅ Stratos: Guardadas 2 nuevas.")

        # Verificar llamadas a execute del cursor
        self.assertEqual(mock_cursor.execute.call_count, 4) # 2 verificaciones de duplicado + 2 inserciones

if __name__ == '__main__':
    unittest.main()
