import sys
import os
import urllib.parse as urlparse
import pymysql
import re

# Exponer excepciones estándar de psycopg2 para evitar errores de importación
class Error(Exception): pass
class Warning(Exception): pass
class InterfaceError(Error): pass
class DatabaseError(Error): pass
class InternalError(DatabaseError): pass
class OperationalError(DatabaseError): pass
class ProgrammingError(DatabaseError): pass
class IntegrityError(DatabaseError): pass
class DataError(DatabaseError): pass
class NotSupportedError(DatabaseError): pass

def parse_db_url(db_url):
    # Regex para extraer credenciales, soportando contraseñas con caracteres especiales
    match = re.match(r'^(?:postgres|postgresql|mysql)://([^:]+):(.*)@([^:/]+)(?::(\d+))?/(.+)$', db_url)
    if match:
        user = match.group(1)
        password = match.group(2)
        host = match.group(3)
        port = int(match.group(4)) if match.group(4) else 3306
        database = match.group(5)
        return host, user, password, database, port
    
    # Fallback al parser estándar de urllib
    url = urlparse.urlparse(db_url)
    host = url.hostname or 'localhost'
    user = url.username
    password = url.password
    database = url.path.lstrip('/') if url.path else None
    port = url.port or 3306
    return host, user, password, database, port

def connect(dsn=None, **kwargs):
    """
    Función mock de psycopg2.connect que desvía la conexión a MySQL
    usando pymysql de forma transparente.
    """
    db_url = dsn or kwargs.get('dsn') or kwargs.get('database_url') or os.getenv("DATABASE_URL")
    
    if db_url and (db_url.startswith("postgresql://") or db_url.startswith("postgres://") or db_url.startswith("mysql://")):
        host, user, password, database, port = parse_db_url(db_url)
    else:
        host = kwargs.get('host') or os.getenv("MYSQL_HOST") or 'localhost'
        user = kwargs.get('user') or os.getenv("MYSQL_USER")
        password = kwargs.get('password') or os.getenv("MYSQL_PASSWORD")
        database = kwargs.get('database') or kwargs.get('dbname') or os.getenv("MYSQL_DATABASE")
        port = kwargs.get('port') or os.getenv("MYSQL_PORT") or 3306
        if isinstance(port, str):
            port = int(port)

    # Si estamos en localhost y las variables individuales de cPanel están definidas, las priorizamos
    cpanel_user = os.getenv("MYSQL_USER")
    cpanel_db = os.getenv("MYSQL_DATABASE")
    if host == 'localhost' or host == '127.0.0.1':
        if cpanel_user: user = cpanel_user
        if cpanel_db: database = cpanel_db
        if os.getenv("MYSQL_PASSWORD"): password = os.getenv("MYSQL_PASSWORD")

    try:
        conn = pymysql.connect(
            host=host,
            user=user,
            password=password,
            database=database,
            port=port,
            charset='utf8mb4',
            autocommit=False  # Mantener control de transacciones con commit/rollback
        )
        return ConnectionWrapper(conn)
    except Exception as e:
        raise OperationalError(f"❌ Error de conexión a MySQL vía psycopg2-shim: {e}")

class ConnectionWrapper:
    def __init__(self, conn):
        self.conn = conn

    def cursor(self, name=None, cursor_factory=None):
        return CursorWrapper(self.conn.cursor(), self)

    def commit(self):
        try:
            self.conn.commit()
        except Exception as e:
            raise DatabaseError(str(e))

    def rollback(self):
        try:
            self.conn.rollback()
        except Exception as e:
            raise DatabaseError(str(e))

    def close(self):
        self.conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.rollback()
        else:
            self.commit()
        self.close()

class CursorWrapper:
    def __init__(self, cursor, connection):
        self.cursor = cursor
        self.connection = connection

    def execute(self, query, vars=None):
        if not query:
            return
        
        mysql_query = query
        
        # 0. Traducir consulta de schema de tablas de Postgres a MySQL SHOW TABLES
        if "INFORMATION_SCHEMA.TABLES" in mysql_query.upper() and "TABLE_SCHEMA = 'PUBLIC'" in mysql_query.upper():
            mysql_query = "SHOW TABLES"
            
        # 1. Traducir ILIKE a LIKE (MySQL es case-insensitive por defecto)
        mysql_query = re.sub(r'\bILIKE\b', 'LIKE', mysql_query, flags=re.IGNORECASE)
        
        # 2. Traducir ON CONFLICT (col) DO NOTHING a INSERT IGNORE
        if "ON CONFLICT" in mysql_query.upper():
            if "DO NOTHING" in mysql_query.upper():
                mysql_query = re.sub(r'^\s*INSERT\s+INTO\b', 'INSERT IGNORE INTO', mysql_query, flags=re.IGNORECASE)
                mysql_query = re.sub(r'ON CONFLICT\s*\([^\)]+\)\s*DO\s*NOTHING\b;?', '', mysql_query, flags=re.IGNORECASE)

        # 3. Traducir = ANY(%s) a IN (%s, %s...)
        if "ANY(%s)" in mysql_query or "= ANY (%s)" in mysql_query:
            match = re.search(r'(\w+)\s*=\s*ANY\s*\(\s*%s\s*\)', mysql_query, flags=re.IGNORECASE)
            if match and vars:
                col_name = match.group(1)
                new_vars = list(vars)
                for i, v in enumerate(new_vars):
                    if isinstance(v, (list, tuple)):
                        placeholders = ', '.join(['%s'] * len(v))
                        mysql_query = re.sub(
                            r'\w+\s*=\s*ANY\s*\(\s*%s\s*\)', 
                            f"{col_name} IN ({placeholders})", 
                            mysql_query, 
                            count=1, 
                            flags=re.IGNORECASE
                        )
                        new_vars_expanded = new_vars[:i] + list(v) + new_vars[i+1:]
                        vars = tuple(new_vars_expanded)
                        break

        # 4. Traducir INTERVAL 'N hours' / 'N days' a formato de MySQL
        mysql_query = re.sub(r"INTERVAL\s+'(\d+)\s+hours?'", r"INTERVAL \1 HOUR", mysql_query, flags=re.IGNORECASE)
        mysql_query = re.sub(r"INTERVAL\s+'(\d+)\s+days?'", r"INTERVAL \1 DAY", mysql_query, flags=re.IGNORECASE)

        # 5. Adaptar SELECTs con alias o límites específicos si aplica
        # (ej: MySQL requiere usar alias de forma obligatoria en subconsultas FROM)
        try:
            self.cursor.execute(mysql_query, vars)
        except Exception as e:
            # Lanzamos error de programación compatible con psycopg2
            raise ProgrammingError(f"❌ Error ejecutando consulta en MySQL: {e}\nConsulta original: {query}\nConsulta traducida: {mysql_query}")

    def fetchone(self):
        return self.cursor.fetchone()

    def fetchall(self):
        return self.cursor.fetchall()

    def close(self):
        self.cursor.close()

    @property
    def rowcount(self):
        return self.cursor.rowcount

    @property
    def description(self):
        return self.cursor.description

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
