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
        user = urlparse.unquote(url.username) if url.username else None
        password = urlparse.unquote(url.password) if url.password else None
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

    # SEC-014: TLS verificado estricto para conexiones remotas a MySQL (sin ssl.CERT_NONE)
    ssl_config = None
    if host not in ('localhost', '127.0.0.1') or os.getenv("MYSQL_SSL") == "true":
        import ssl
        if os.getenv("DB_SSL_REJECT_UNAUTHORIZED") == "false":
            raise ValueError("❌ Error de seguridad (SEC-014): DB_SSL_REJECT_UNAUTHORIZED=false está prohibido para conexiones TLS a MySQL.")
        ca_file = os.getenv("MYSQL_SSL_CA")
        ssl_ctx = ssl.create_default_context(cafile=ca_file if ca_file else None)
        ssl_ctx.check_hostname = True
        ssl_ctx.verify_mode = ssl.CERT_REQUIRED
        ssl_config = ssl_ctx

    return pymysql.connect(
        host=host,
        user=user,
        password=password,
        database=database,
        port=port,
        charset='utf8mb4',
        autocommit=True,  # Confirmaciones automáticas para simplificar escrituras
        connect_timeout=5,
        ssl=ssl_config
    )
