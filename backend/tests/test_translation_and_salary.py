import unittest
import sys
import os

# Añadir el directorio raíz del backend al path para que encuentre los módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from logic.translator import translate_text
from logic.salary_parser import parse_salary, extract_salary_from_text

class TestTranslationAndSalary(unittest.TestCase):

    def test_translation_basic(self):
        # Probar traducción de términos comunes de inglés a español
        # Usamos términos que tienen traducción estable e inmediata
        self.assertEqual(translate_text("React Developer").lower(), "desarrollador react")
        self.assertEqual(translate_text("Data Scientist").lower(), "científico de datos")
        
    def test_translation_empty(self):
        # Probar textos vacíos
        self.assertEqual(translate_text(""), "")
        self.assertEqual(translate_text(None), None)
        
    def test_salary_parsing_eur_range(self):
        # Rango de euros estándar con puntos
        s_min, s_max, curr = parse_salary("30.000€ - 40.000€")
        self.assertEqual(s_min, 30000)
        self.assertEqual(s_max, 40000)
        self.assertEqual(curr, "EUR")

    def test_salary_parsing_usd_k_range(self):
        # Rango de dólares con k
        s_min, s_max, curr = parse_salary("$60k - $80k")
        self.assertEqual(s_min, 60000)
        self.assertEqual(s_max, 80000)
        self.assertEqual(curr, "USD")

    def test_salary_parsing_monthly(self):
        # Salario mensual a anual
        s_min, s_max, curr = parse_salary("2.500 € al mes")
        self.assertEqual(s_min, 30000)
        self.assertEqual(s_max, 30000)
        self.assertEqual(curr, "EUR")

    def test_salary_parsing_invalid(self):
        # Casos no numéricos
        s_min, s_max, curr = parse_salary("Consultar")
        self.assertIsNone(s_min)
        self.assertIsNone(s_max)
        
        s_min, s_max, curr = parse_salary("A convenir")
        self.assertIsNone(s_min)
        self.assertIsNone(s_max)

    def test_extract_salary_from_text(self):
        # Test 1: Rango de miles
        s_min, s_max, curr, raw = extract_salary_from_text("El rango salarial es de 30.000€ - 45.000€ anuales.")
        self.assertEqual(s_min, 30000)
        self.assertEqual(s_max, 45000)
        self.assertEqual(curr, "EUR")
        self.assertEqual(raw, "30.000€ - 45.000€")

        # Test 2: Rango con k
        s_min, s_max, curr, raw = extract_salary_from_text("We pay between 40k to 55k dollars depending on experience.")
        self.assertEqual(s_min, 40000)
        self.assertEqual(s_max, 55000)
        self.assertEqual(curr, "USD")
        self.assertEqual(raw, "40k to 55k dollars")

        # Test 3: Salario mensual
        s_min, s_max, curr, raw = extract_salary_from_text("El salario mensual aproximado es de 2.000 €/mes neto.")
        self.assertEqual(s_min, 24000)
        self.assertEqual(s_max, 24000)
        self.assertEqual(curr, "EUR")
        self.assertEqual(raw, "2.000 €/mes")

        # Test 4: Ninguno encontrado
        s_min, s_max, curr, raw = extract_salary_from_text("Trabajo remoto flexible en una gran empresa.")
        self.assertIsNone(s_min)
        self.assertIsNone(s_max)
        self.assertIsNone(raw)

if __name__ == "__main__":
    unittest.main()
