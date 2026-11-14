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
    # SEC-054: Usar urlparse estándar para separar limpiamente database de parámetros ?query
    url = urlparse.urlparse(db_url)
    host = url.hostname or 'localhost'
    user = urlparse.unquote(url.username) if url.username else None
    password = urlparse.unquote(url.password) if url.password else None
    database = url.path.lstrip('/').split('?')[0] if url.path else None
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
        # SEC-014: Forzar TLS verificado en conexiones a hosts remotos o cuando MYSQL_SSL=true
        ssl_config = None
        if host not in ('localhost', '127.0.0.1') or os.getenv("MYSQL_SSL") == "true":
            import ssl
            if os.getenv("DB_SSL_REJECT_UNAUTHORIZED") == "false":
                raise OperationalError("❌ Error de seguridad (SEC-014): DB_SSL_REJECT_UNAUTHORIZED=false está prohibido en conexiones TLS.")
            ca_file = os.getenv("MYSQL_SSL_CA")
            ssl_ctx = ssl.create_default_context(cafile=ca_file if ca_file else None)
            ssl_ctx.check_hostname = True
            ssl_ctx.verify_mode = ssl.CERT_REQUIRED
            ssl_config = ssl_ctx

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
            write_timeout=connect_timeout,
            ssl=ssl_config
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
            
        # 1. Traducir ILIKE a LIKE (MySQL es case-insensitive por defecto), respetando cadenas literales (VULN-18)
        parts = re.split(r"('(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\")", mysql_query)
        for i in range(0, len(parts), 2):
            parts[i] = re.sub(r'\bILIKE\b', 'LIKE', parts[i], flags=re.IGNORECASE)
        mysql_query = "".join(parts)
        
        # 2. Traducir ON CONFLICT (col) DO NOTHING a INSERT IGNORE
        if "ON CONFLICT" in mysql_query.upper():
            if "DO NOTHING" in mysql_query.upper():
                mysql_query = re.sub(r'^\s*INSERT\s+INTO\b', 'INSERT IGNORE INTO', mysql_query, flags=re.IGNORECASE)
                mysql_query = re.sub(r'ON CONFLICT\s*\([^\)]+\)\s*DO\s*NOTHING\b;?', '', mysql_query, flags=re.IGNORECASE)

        # 3. SEC-054: Traducir TODAS las apariciones de = ANY(%s) a IN (%s, %s...) sin break prematuro
        if vars and ("ANY(%s)" in mysql_query or "ANY (%s)" in mysql_query):
            new_vars = list(vars)
            any_pattern = re.compile(r'(\w+)\s*=\s*ANY\s*\(\s*%s\s*\)', flags=re.IGNORECASE)
            while True:
                match = any_pattern.search(mysql_query)
                if not match:
                    break
                col_name = match.group(1)
                prefix = mysql_query[:match.start()]
                var_idx = prefix.count('%s')
                if var_idx >= len(new_vars) or not isinstance(new_vars[var_idx], (list, tuple)):
                    break
                seq = list(new_vars[var_idx])
                if len(seq) == 0:
                    mysql_query = mysql_query[:match.start()] + "1=0" + mysql_query[match.end():]
                    new_vars = new_vars[:var_idx] + new_vars[var_idx + 1:]
                else:
                    placeholders = ', '.join(['%s'] * len(seq))
                    replacement = f"{col_name} IN ({placeholders})"
                    mysql_query = mysql_query[:match.start()] + replacement + mysql_query[match.end():]
                    new_vars = new_vars[:var_idx] + seq + new_vars[var_idx + 1:]
            vars = tuple(new_vars) if new_vars else None

        # 4. Traducir INTERVAL 'N hours' / 'N days' a formato de MySQL
        mysql_query = re.sub(r"INTERVAL\s+'(\d+)\s+hours?'", r"INTERVAL \1 HOUR", mysql_query, flags=re.IGNORECASE)
        mysql_query = re.sub(r"INTERVAL\s+'(\d+)\s+days?'", r"INTERVAL \1 DAY", mysql_query, flags=re.IGNORECASE)

        # 5. Adaptar SELECTs con alias o límites específicos si aplica
        # (ej: MySQL requiere usar alias de forma obligatoria en subconsultas FROM)
        try:
            self.cursor.execute(mysql_query, vars)
        except pymysql.err.IntegrityError as e:
            raise IntegrityError(f"Error de integridad MySQL: {e}") from e
        except pymysql.err.OperationalError as e:
            raise OperationalError(f"Error operacional MySQL: {e}") from e
        except pymysql.err.DataError as e:
            raise DataError(f"Error de datos MySQL: {e}") from e
        except pymysql.err.InterfaceError as e:
            raise InterfaceError(f"Error de interfaz MySQL: {e}") from e
        except pymysql.err.InternalError as e:
            raise InternalError(f"Error interno MySQL: {e}") from e
        except pymysql.err.NotSupportedError as e:
            raise NotSupportedError(f"Operación no soportada en MySQL: {e}") from e
        except pymysql.err.ProgrammingError as e:
            raise ProgrammingError(f"Error de sintaxis/programación MySQL: {e}") from e
        except pymysql.err.MySQLError as e:
            raise DatabaseError(f"Error de base de datos MySQL: {e}") from e

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
