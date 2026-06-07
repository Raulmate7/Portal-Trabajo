import unittest
from unittest.mock import patch, MagicMock

# Importamos los scrapers
from scrapers.wwr import get_wwr_jobs
from scrapers.remotive import get_remotive_jobs
from scrapers.jobfluent import get_jobfluent_jobs
from scrapers.remoteok import get_remoteok_jobs
from scrapers.workingnomads import get_workingnomads_jobs
from scrapers.himalayas import get_himalayas_jobs
from scrapers.pythonorg import get_pythonorg_jobs

class TestScrapers(unittest.TestCase):

    @patch('requests.get')
    def test_get_wwr_jobs(self, mock_get):
        mock_response = MagicMock()
        mock_response.content = b"""
        <rss>
            <channel>
                <item>
                    <title>Google: Software Engineer</title>
                    <link>https://weworkremotely.com/jobs/1</link>
                    <description>&lt;p&gt;Looking for a React developer&lt;/p&gt;</description>
                </item>
            </channel>
        </rss>
        """
        mock_get.return_value = mock_response

        jobs = get_wwr_jobs()
        self.assertEqual(len(jobs), 1)
        self.assertEqual(jobs[0]['title'], 'Software Engineer')
        self.assertEqual(jobs[0]['company'], 'Google')
        self.assertEqual(jobs[0]['url_source'], 'https://weworkremotely.com/jobs/1')

    @patch('requests.get')
    def test_get_remotive_jobs(self, mock_get):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "jobs": [
                {
                    "title": "Backend Engineer",
                    "company_name": "Stripe",
                    "candidate_required_location": "Spain",
                    "url": "https://remotive.com/jobs/2",
                    "description": "<p>Python backend role</p>",
                    "salary": "50k"
                }
            ]
        }
        mock_get.return_value = mock_response

        jobs = get_remotive_jobs()
        self.assertEqual(len(jobs), 1)
        self.assertEqual(jobs[0]['title'], 'Backend Engineer')
        self.assertEqual(jobs[0]['company'], 'Stripe')
        self.assertEqual(jobs[0]['location'], 'Spain')
        self.assertEqual(jobs[0]['url_source'], 'https://remotive.com/jobs/2')

    @patch('requests.get')
    def test_get_jobfluent_jobs(self, mock_get):
        mock_response = MagicMock()
        mock_response.text = """
        <div class="offer-body">
            <h3><a href="/es/empleo/1">Frontend Developer</a></h3>
            <h4>Acme Corp</h4>
            <span class="location">Madrid</span>
        </div>
        """
        mock_get.return_value = mock_response

        jobs = get_jobfluent_jobs()
        self.assertEqual(len(jobs), 1)
        self.assertEqual(jobs[0]['title'], 'Frontend Developer')
        self.assertEqual(jobs[0]['company'], 'Acme Corp')
        self.assertEqual(jobs[0]['location'], 'Madrid')
        self.assertEqual(jobs[0]['url_source'], 'https://www.jobfluent.com/es/empleo/1')

    @patch('requests.get')
    def test_get_remoteok_jobs(self, mock_get):
        mock_response = MagicMock()
        mock_response.json.return_value = [
            {"legal": "info"},
            {
                "position": "DevOps Engineer",
                "company": "GitLab",
                "location": "Spain, Madrid",
                "url": "https://remoteok.com/jobs/3",
                "description": "Devops role",
                "salary_min": 60000
            }
        ]
        mock_get.return_value = mock_response

        jobs = get_remoteok_jobs()
        self.assertEqual(len(jobs), 1)
        self.assertEqual(jobs[0]['title'], 'DevOps Engineer')
        self.assertEqual(jobs[0]['company'], 'GitLab')
        self.assertEqual(jobs[0]['location'], 'Madrid')
        self.assertEqual(jobs[0]['url_source'], 'https://remoteok.com/jobs/3')

    @patch('requests.get')
    def test_get_himalayas_jobs(self, mock_get):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "jobs": [
                {
                    "title": "Machine Learning Engineer",
                    "companyName": "OpenAI",
                    "locationRestrictions": ["US", "Europe"],
                    "applicationLink": "https://himalayas.app/jobs/4",
                    "description": "<p>ML engineer role</p>",
                    "minSalary": 120000,
                    "maxSalary": 180000,
                    "currency": "USD"
                }
            ]
        }
        mock_get.return_value = mock_response

        jobs = get_himalayas_jobs()
        self.assertEqual(len(jobs), 1)
        self.assertEqual(jobs[0]['title'], 'Machine Learning Engineer')
        self.assertEqual(jobs[0]['company'], 'OpenAI')
        self.assertEqual(jobs[0]['location'], 'Remoto (US, Europe)')
        self.assertEqual(jobs[0]['url_source'], 'https://himalayas.app/jobs/4')

    @patch('requests.get')
    def test_get_pythonorg_jobs(self, mock_get):
        mock_response = MagicMock()
        mock_response.content = b"""
        <rss>
            <channel>
                <item>
                    <title>Python Developer, Django LLC</title>
                    <link>https://python.org/jobs/5</link>
                    <description>Madrid, Spain\n&lt;p&gt;Django role&lt;/p&gt;</description>
                </item>
            </channel>
        </rss>
        """
        mock_get.return_value = mock_response

        jobs = get_pythonorg_jobs()
        self.assertEqual(len(jobs), 1)
        self.assertEqual(jobs[0]['title'], 'Python Developer')
        self.assertEqual(jobs[0]['company'], 'Django LLC')
        self.assertEqual(jobs[0]['location'], 'Madrid, Spain')
        self.assertEqual(jobs[0]['url_source'], 'https://python.org/jobs/5')

    @patch('requests.get')
    def test_get_workingnomads_jobs(self, mock_get):
        mock_response = MagicMock()
        mock_response.json.return_value = [
            {
                "category_name": "Development",
                "location": "Spain, Madrid",
                "title": "React Engineer",
                "company_name": "Vercel",
                "url": "https://workingnomads.com/jobs/6",
                "description": "React role"
            },
            {
                "category_name": "Design", # Se salta por categoría
                "location": "Spain",
                "title": "UI Designer",
                "company_name": "Vercel",
                "url": "https://workingnomads.com/jobs/7",
                "description": "Design role"
            }
        ]
        mock_get.return_value = mock_response

        jobs = get_workingnomads_jobs()
        self.assertEqual(len(jobs), 1)
        self.assertEqual(jobs[0]['title'], 'React Engineer')
        self.assertEqual(jobs[0]['company'], 'Vercel')
        self.assertEqual(jobs[0]['location'], 'España')
        self.assertEqual(jobs[0]['url_source'], 'https://workingnomads.com/jobs/6')

if __name__ == '__main__':
    unittest.main()
