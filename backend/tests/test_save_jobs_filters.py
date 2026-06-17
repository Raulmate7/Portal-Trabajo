import unittest
from unittest.mock import patch, MagicMock
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import save_jobs

class TestSaveJobsFilters(unittest.TestCase):

    @patch('main.psycopg2.connect')
    def test_save_jobs_filters_lockout(self, mock_connect):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_connect.return_value = mock_conn

        # Mock query return:
        # 1. Sector check -> (1,)
        # 2. Job 1 URL dup check -> None
        # 3. Job 1 Semantic dup check -> None
        # 4. Job 2 URL dup check -> None
        # 5. Job 2 Semantic dup check -> None
        mock_cursor.fetchone.side_effect = [(1,), None, None, None, None]

        jobs = [
            # Job 1: normal job (should be saved)
            {
                "url_source": "https://example.com/job1",
                "title": "React Developer",
                "company": "Company A",
                "location": "Remoto",
                "salary": "Consultar",
                "description_snippet": "Buscamos un desarrollador React."
            },
            # Job 2: US lockout job (should be discarded)
            {
                "url_source": "https://example.com/job2",
                "title": "Python Developer (US Residents Only)",
                "company": "Company B",
                "location": "Worldwide",
                "salary": "50k",
                "description_snippet": "Must be authorized to work in the US."
            }
        ]

        with patch('main.print') as mock_print:
            save_jobs(jobs, "WeWorkRemotely")

            # Check that it printed that the second job was discarded
            mock_print.assert_any_call("🚫 Oferta descartada por exclusión geográfica internacional: 'Python Developer (US Residents Only)' de 'Company B' (WeWorkRemotely)")
            mock_print.assert_any_call("💾 Guardadas 1 nuevas ofertas de WeWorkRemotely")

    @patch('main.psycopg2.connect')
    def test_save_jobs_salary_inference(self, mock_connect):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_connect.return_value = mock_conn

        # Mock sector check and duplication checks
        mock_cursor.fetchone.side_effect = [(1,), None, None]

        jobs = [
            {
                "url_source": "https://example.com/job3",
                "title": "Java Architect",
                "company": "Company C",
                "location": "Remoto",
                "salary": "Consultar",
                "description_snippet": "Buscamos arquitecto con rango 45.000€ a 55.000€ al año."
            }
        ]

        save_jobs(jobs, "WeWorkRemotely")

        # Let's inspect the INSERT query arguments
        insert_args = None
        for call in mock_cursor.execute.call_args_list:
            query = call[0][0]
            if "INSERT INTO jobs" in query:
                insert_args = call[0][1]
                break

        self.assertIsNotNone(insert_args)
        # Check that inferred salary is stored
        self.assertEqual(insert_args[3], "45.000€ a 55.000€ (estimado)") # salary_raw
        self.assertEqual(insert_args[10], 45000) # salary_min
        self.assertEqual(insert_args[11], 55000) # salary_max
        self.assertEqual(insert_args[12], "EUR") # salary_currency

if __name__ == '__main__':
    unittest.main()
