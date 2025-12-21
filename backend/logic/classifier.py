# scraper/logic/classifier.py

import os
import psycopg2
from dotenv import load_dotenv

class SectorClassifier:
    """
    Clasificador de ofertas de trabajo basado en palabras clave de la base de datos.
    Carga los sectores y sus palabras clave en memoria para una clasificación rápida.
    """
    def __init__(self, db_url=None):
        load_dotenv()
        self.db_url = db_url or os.getenv("DATABASE_URL")
        if not self.db_url:
            raise ValueError("DATABASE_URL no está configurada en el entorno o en el constructor.")
        self.sectors_data = self._load_sectors()

    def _load_sectors(self):
        """
        Conecta a la base de datos y carga los IDs y las palabras clave de los sectores.
        """
        sectors = []
        conn = None
        try:
            conn = psycopg2.connect(self.db_url)
            cur = conn.cursor()
            # NOTA: En PostgreSQL, los arrays se devuelven como listas de Python.
            cur.execute("SELECT id, keywords FROM sectors;")
            for sector_id, keywords in cur.fetchall():
                # Convertir todas las palabras clave a minúsculas para una coincidencia sin distinción de mayúsculas
                lower_keywords = [kw.lower() for kw in keywords]
                sectors.append({
                    'id': sector_id,
                    'keywords': lower_keywords
                })
            cur.close()
        except psycopg2.Error as e:
            print(f"Error al cargar sectores de la DB: {e}")
            # En un entorno de producción, se debería manejar este error de forma más robusta
            # Por ahora, devolvemos una lista vacía para evitar fallos catastróficos
            return []
        finally:
            if conn:
                conn.close()
        
        return sectors

    def classify(self, text: str) -> int | None:
        """
        Clasifica el texto (título o descripción) y devuelve el sector_id con más coincidencias.
        
        :param text: El texto a clasificar (título o descripción de la oferta).
        :return: El sector_id con más coincidencias o None si no hay coincidencias.
        """
        if not self.sectors_data:
            # Si no se pudieron cargar los sectores, no podemos clasificar
            return None

        text_lower = text.lower()
        best_match_id = None
        max_matches = 0

        for sector in self.sectors_data:
            match_count = 0
            for keyword in sector['keywords']:
                # Contar cuántas veces aparece la palabra clave en el texto
                if keyword in text_lower:
                    match_count += 1
            
            if match_count > max_matches:
                max_matches = match_count
                best_match_id = sector['id']
        
        # Opcional: Podrías establecer un umbral mínimo de coincidencias (ej: > 0)
        # para evitar clasificar ofertas con 0 coincidencias.
        return best_match_id if max_matches > 0 else None

# Ejemplo de uso (solo para pruebas, no se ejecuta en el spider)
if __name__ == '__main__':
    # Asegúrate de que DATABASE_URL esté configurada en tu .env para probar
    try:
        classifier = SectorClassifier()
        
        # Ejemplo de texto de oferta
        job_title_1 = "Ingeniero de Software Python/Django para Cloud AWS"
        job_title_2 = "Enfermera para UCI en Hospital de Madrid"
        job_title_3 = "Comercial de ventas con experiencia en SEO"
        job_title_4 = "Pintor de brocha gorda" # No debería clasificar

        print(f"'{job_title_1}' -> Sector ID: {classifier.classify(job_title_1)}")
        print(f"'{job_title_2}' -> Sector ID: {classifier.classify(job_title_2)}")
        print(f"'{job_title_3}' -> Sector ID: {classifier.classify(job_title_3)}")
        print(f"'{job_title_4}' -> Sector ID: {classifier.classify(job_title_4)}")

    except ValueError as e:
        print(f"Error: {e}")
        print("Por favor, configura DATABASE_URL en el archivo .env para probar el clasificador.")
