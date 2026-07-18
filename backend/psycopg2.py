import sys
import os
import urllib.parse as urlparse
import pymysql
import re

# Intentar importar psycopg2 real para exponer sus atributos y excepciones si está disponible
try:
    import sys
    import os
    orig_path = list(sys.path)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path = [p for p in sys.path if os.path.abspath(p) != current_dir]
    
    # Resolver conflicto de importacion circular usando el cache sys.modules
    this_module = sys.modules.pop('psycopg2', None)
    try:
        import psycopg2 as _real_psycopg2
        # Exponer excepciones reales
        Error = _real_psycopg2.Error
        Warning = _real_psycopg2.Warning
        InterfaceError = _real_psycopg2.InterfaceError
        DatabaseError = _real_psycopg2.DatabaseError
        InternalError = _real_psycopg2.InternalError
        OperationalError = _real_psycopg2.OperationalError
        ProgrammingError = _real_psycopg2.ProgrammingError
        IntegrityError = _real_psycopg2.IntegrityError
        DataError = _real_psycopg2.DataError
        NotSupportedError = _real_psycopg2.NotSupportedError
        HAS_REAL_PSYCOPG2 = True
    except ImportError as e:
        _real_psycopg2 = None
        HAS_REAL_PSYCOPG2 = False
    finally:
        # Restaurar sys.modules y sys.path
        if this_module:
            sys.modules['psycopg2'] = this_module
        sys.path = orig_path
except Exception:
    _real_psycopg2 = None
    HAS_REAL_PSYCOPG2 = False

if not HAS_REAL_PSYCOPG2:
    # Exponer excepciones de fallback
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
    Función de conexión inteligente: desvía a PostgreSQL real si se
    detecta una URL postgresql/postgres, o a MySQL si es localhost o mysql URL.
    """
    db_url = dsn or kwargs.get('dsn') or kwargs.get('database_url') or os.getenv("DATABASE_URL")
    
    if db_url and (db_url.startswith("postgresql://") or db_url.startswith("postgres://")):
        if HAS_REAL_PSYCOPG2:
            print("🔌 Conectando a PostgreSQL usando psycopg2 real...")
            return _real_psycopg2.connect(dsn=db_url, **kwargs)
        else:
            print("⚠️ Detectada URL de PostgreSQL pero psycopg2 real no está instalado. Usando shim de MySQL.")

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
        connect_timeout = kwargs.get('connect_timeout') or kwargs.get('timeout') or 5
        conn = pymysql.connect(
            host=host,
            user=user,
            password=password,
            database=database,
            port=port,
            charset='utf8mb4',
            autocommit=False,  # Mantener control de transacciones con commit/rollback
            connect_timeout=connect_timeout,
            read_timeout=connect_timeout,
            write_timeout=connect_timeout
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
