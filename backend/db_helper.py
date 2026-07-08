import os
import urllib.parse as urlparse
import pymysql

def get_db_connection():
    """
    Establece una conexión a la base de datos MySQL analizando la variable
    de entorno DATABASE_URL (formato mysql://user:pass@host:port/dbname)
    o utilizando variables de entorno individuales.
    """
    db_url = os.getenv("DATABASE_URL")
    
    if db_url:
        # Parsear cadena de conexión mysql:// o postgresql:// (para compatibilidad de transición)
        url = urlparse.urlparse(db_url)
        host = url.hostname or 'localhost'
        user = url.username
        password = url.password
        database = url.path.lstrip('/') if url.path else None
        port = url.port or 3306
    else:
        # Fallback a variables individuales (típico en cPanel)
        host = os.getenv("MYSQL_HOST", "localhost")
        user = os.getenv("MYSQL_USER")
        password = os.getenv("MYSQL_PASSWORD")
        database = os.getenv("MYSQL_DATABASE")
        port = int(os.getenv("MYSQL_PORT", 3306))

    if not user or not database:
        raise ValueError("❌ Error: Faltan credenciales de base de datos en las variables de entorno.")

    return pymysql.connect(
        host=host,
        user=user,
        password=password,
        database=database,
        port=port,
        charset='utf8mb4',
        autocommit=True,  # Confirmaciones automáticas para simplificar escrituras
        connect_timeout=5
    )
