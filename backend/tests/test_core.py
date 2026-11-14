import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from logic.salary_parser import parse_salary, parse_salary_eur
from logic.classifier import classify_job
from logic.dedup import compute_dedup_hash, token_jaccard_similarity
from logic.tdm import is_scraping_allowed, truncate_snippet


class TestCoreBackendLogic(unittest.TestCase):
    def test_salary_parser_european_formats(self):
        self.assertEqual(parse_salary("45k - 55k €"), (45000, 55000, "EUR"))
        self.assertEqual(parse_salary("3.200,50€/mes"), (38400, 38400, "EUR"))
        self.assertEqual(parse_salary("45,5k€"), (45500, 45500, "EUR"))
        min_eur, max_eur, curr = parse_salary_eur("$100k")
        self.assertEqual(curr, "USD")
        self.assertEqual(min_eur, 92000)
        self.assertEqual(max_eur, 92000)

    def test_classifier_weighting_and_disambiguation(self):
        cat = classify_job(
            "Senior Backend Python Engineer",
            "Trabajarás en microservicios FastAPI y colaborarás con el equipo de Frontend React.",
        )
        self.assertEqual(cat, "Backend")
        self.assertEqual(classify_job("Platform Engineer / SRE", "Kubernetes AWS"), "Cloud & DevOps")

    def test_dedup_hash_consistency(self):
        h1 = compute_dedup_hash("Acme Tech S.L.", "Senior Python Developer (Remote)")
        h2 = compute_dedup_hash("Acme Inc.", "Senior Python Developer")
        self.assertEqual(h1, h2)
        self.assertGreater(token_jaccard_similarity("Senior Python Dev", "Senior Python Developer"), 0.4)

    def test_tdm_optout_headers(self):
        self.assertFalse(is_scraping_allowed("https://example.com", {"TDM-Reservation": "1"}))
        self.assertFalse(is_scraping_allowed("https://example.com", {"X-Robots-Tag": "noai"}))
        self.assertEqual(len(truncate_snippet("a " * 300, 100)), 100)

    def test_seo_regression_artifacts(self):
        repo_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        with open(os.path.join(repo_root, "frontend", "public", "llms.txt"), "r", encoding="utf-8") as f:
            llms_txt = f.read()
        self.assertIn("https://portalempleoit.com", llms_txt)
        self.assertNotIn("portalempleo-it.vercel.app", llms_txt)

        with open(os.path.join(repo_root, "frontend", "components", "CourseAffiliate.tsx"), "r", encoding="utf-8") as f:
            course_aff = f.read()
        self.assertNotIn("'@type': ['Course'", course_aff)

        with open(os.path.join(repo_root, "frontend", "app", "job", "[id]", "page.tsx"), "r", encoding="utf-8") as f:
            job_page = f.read()
        self.assertIn("applicantLocationRequirements", job_page)
        self.assertIn("directApply", job_page)


if __name__ == "__main__":
    unittest.main()
