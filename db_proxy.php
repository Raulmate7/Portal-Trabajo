<?php
// db_proxy.php
// ADVERTENCIA DE SEGURIDAD: Este script está deshabilitado por defecto.
// Para habilitarlo explícitamente en entornos seguros, configure ENABLE_DB_PROXY=true y defina PROXY_SECRET en el entorno.

header('Content-Type: application/json');

/**
 * Obtiene una variable de entorno consultando getenv(), $_ENV y $_SERVER de forma segura.
 */
function get_proxy_env($key) {
    $val = getenv($key);
    if ($val !== false && $val !== '') return $val;
    if (isset($_ENV[$key]) && $_ENV[$key] !== '') return $_ENV[$key];
    if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') return $_SERVER[$key];
    return null;
}

// Cargar variables de entorno si no están definidas a nivel de servidor web (ej. tras despliegues FTP en cPanel)
if (get_proxy_env('ENABLE_DB_PROXY') !== 'true') {
    $env_candidates = [
        __DIR__ . '/.env.proxy',
        __DIR__ . '/backend/.env',
        dirname(__DIR__) . '/.env',
        __DIR__ . '/.env'
    ];
    foreach ($env_candidates as $env_file) {
        if (file_exists($env_file) && is_readable($env_file)) {
            $lines = file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line) || strpos($line, '#') === 0 || strpos($line, '=') === false) continue;
                list($k, $v) = explode('=', $line, 2);
                $k = trim($k);
                $v = trim($v, " \t\n\r\0\x0B\"'");
                if (get_proxy_env($k) === null) {
                    putenv("$k=$v");
                    $_ENV[$k] = $v;
                    $_SERVER[$k] = $v;
                }
            }
            if (get_proxy_env('ENABLE_DB_PROXY') === 'true') {
                break;
            }
        }
    }
}

// 1. Bloqueo por defecto si no está explícitamente habilitado (Fail-Closed, Vector 23)
if (get_proxy_env('ENABLE_DB_PROXY') !== 'true') {
    http_response_code(403);
    echo json_encode(['error' => 'Endpoint deshabilitado por directiva de seguridad.']);
    exit;
}

// 2. Método HTTP estrictamente limitado a POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método HTTP no permitido. Solo se acepta POST.']);
    exit;
}

// 3. Control perimetral de IP si está configurado ALLOWED_PROXY_IPS en el entorno (Vector 23)
$allowed_ips_env = get_proxy_env('ALLOWED_PROXY_IPS');
if (!empty($allowed_ips_env)) {
    $allowed_ips = array_map('trim', explode(',', $allowed_ips_env));
    // VULN-27: Soporte para detección de IP en topologías con Cloudflare / Reverse Proxy confiable
    $client_ip = $_SERVER['REMOTE_ADDR'] ?? '';
    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        $client_ip = $_SERVER['HTTP_CF_CONNECTING_IP'];
    }
    if (!in_array($client_ip, $allowed_ips, true)) {
        http_response_code(403);
        echo json_encode(['error' => 'IP de origen no autorizada para el proxy de base de datos.']);
        exit;
    }
}

// 4. Token de seguridad leído exclusivamente de variables de entorno (mínimo 32 caracteres)
$secret = $_SERVER['HTTP_X_PROXY_TOKEN'] ?? '';
$expected_secret = get_proxy_env('PROXY_SECRET') ?: get_proxy_env('DB_PROXY_TOKEN') ?: '';

if (empty($expected_secret) || strlen($expected_secret) < 32 || empty($secret) || !hash_equals($expected_secret, $secret)) {
    // VULN-02: Se elimina usleep() para prevenir amplificación DoS / agotamiento de workers de Apache (Slowloris)
    http_response_code(403);
    echo json_encode(['error' => 'Acceso denegado: Token no válido, ausente o insuficiente.']);
    exit;
}

// 5. Leer consulta e inputs JSON (con límite de tamaño para prevenir DoS por memoria)
$raw_input = file_get_contents('php://input');
if (strlen($raw_input) > 524288) { // 512KB máximo por payload
    http_response_code(413);
    echo json_encode(['error' => 'Carga de datos excesiva no permitida.']);
    exit;
}

$input = json_decode($raw_input, true);
$sql = $input['sql'] ?? '';
$params = $input['params'] ?? [];

if (!is_array($params)) {
    $params = [];
}

// Vector 26: Prevención de DoS por memoria en PDO por exceso de parámetros
if (count($params) > 200) {
    http_response_code(400);
    echo json_encode(['error' => 'Exceso de parámetros en la consulta (máximo 200 permitidos).']);
    exit;
}

foreach ($params as $param) {
    // VULN-24: Validar tipos escalares para prevenir fatal TypeErrors en PDOStatement::execute()
    if (!is_scalar($param) && !is_null($param)) {
        http_response_code(400);
        echo json_encode(['error' => 'Los parámetros de la consulta deben ser valores escalares o nulos.']);
        exit;
    }
    if (is_string($param) && strlen($param) > 65536) {
        http_response_code(400);
        echo json_encode(['error' => 'Parámetro individual excede la longitud máxima permitida (64KB).']);
        exit;
    }
}

if (empty($sql) || !is_string($sql)) {
    http_response_code(400);
    echo json_encode(['error' => 'Consulta SQL no proporcionada.']);
    exit;
}

// === VALIDACIÓN DE SEGURIDAD SQL (Vector 24 y 25) ===

// VULN-26: Rechazar consultas apiladas (stacked queries) verificando que el punto y coma no esté dentro de comillas literales
$sql_no_quotes = preg_replace('/(\'(?:[^\'\\\\]|\\\\.)*\'|"(?:[^"\\\\]|\\\\.)*")/s', '', rtrim($sql, "; \t\n\r\0\x0B"));
if (strpos($sql_no_quotes, ';') !== false) {
    http_response_code(403);
    echo json_encode(['error' => 'Consultas múltiples no permitidas por políticas de seguridad.']);
    exit;
}

// Vector 24: Rechazar sintaxis de comentarios condicionales de MySQL (ej. /*!50000DELETE... */)
if (strpos($sql, '/*!') !== false) {
    http_response_code(403);
    echo json_encode(['error' => 'Sintaxis de comentarios condicionales de MySQL no permitida.']);
    exit;
}

// Normalizar y limpiar comentarios en bloque e inline para análisis semántico estricto
$sql_clean = preg_replace('/\/\*.*?\*\//s', ' ', $sql);
$sql_clean = preg_replace('/--[^\r\n]*/', ' ', $sql_clean);
$sql_clean = preg_replace('/#[^\r\n]*/', ' ', $sql_clean);
$sql_clean_upper = strtoupper(trim($sql_clean));

// Soporte seguro para comandos de control transaccional como no-op en proxy HTTP sin estado
if (preg_match('/^(START\s+TRANSACTION|COMMIT|ROLLBACK|BEGIN)\b/i', $sql_clean_upper)) {
    echo json_encode([
        'success' => true,
        'rows' => [],
        'affected_rows' => 0,
        'insert_id' => 0
    ]);
    exit;
}

// Rechazar acceso a esquemas y tablas internas de MySQL
if (preg_match('/\b(INFORMATION_SCHEMA|PERFORMANCE_SCHEMA|MYSQL|SYS)\b/i', $sql_clean_upper)) {
    http_response_code(403);
    echo json_encode(['error' => 'Acceso a esquemas de sistema no permitido.']);
    exit;
}

// Rechazar funciones de archivos o temporización
if (preg_match('/\b(OUTFILE|DUMPFILE|LOAD_FILE|BENCHMARK|SLEEP)\b/i', $sql_clean_upper)) {
    http_response_code(403);
    echo json_encode(['error' => 'Operación de archivo o temporización bloqueada.']);
    exit;
}

// VULN-01: Rechazar operaciones destructivas masivas con límites de palabra (\b) para evitar falsos positivos con "skills", "Grant Thornton", etc.
if (preg_match('/\b(DROP|ALTER|TRUNCATE|GRANT|REVOKE|RENAME|FLUSH|KILL|SHUTDOWN)\b/i', $sql_clean_upper)) {
    http_response_code(403);
    echo json_encode(['error' => 'Operación SQL destructiva no permitida por políticas de seguridad.']);
    exit;
}

// Vector 25: Control de operaciones DELETE para posibilitar el derecho de supresión RGPD y purgas defensivas
// Solo se autoriza DELETE si tiene cláusula WHERE parametrizada sobre tablas permitidas (con modificador multilínea s)
if (preg_match('/^DELETE\b/i', $sql_clean_upper)) {
    if (!preg_match('/^DELETE\s+FROM\s+`?(subscribers|jobs|job_reactions|newsletter_sponsors|stripe_processed_events|report_downloads|email_tracking|company_reviews)`?\s+WHERE\s+/is', $sql_clean_upper) || count($params) === 0) {
        http_response_code(403);
        echo json_encode(['error' => 'Operación DELETE no autorizada sin cláusula WHERE parametrizada.']);
        exit;
    }
}

// VULN-07: Control estricto de operaciones UPDATE para prevenir sobreescrituras masivas sin cláusula WHERE (con modificador multilínea s)
if (preg_match('/^UPDATE\b/i', $sql_clean_upper)) {
    if (!preg_match('/^UPDATE\s+`?[a-zA-Z0-9_]+`?\s+SET\s+.+\s+WHERE\s+/is', $sql_clean_upper) || count($params) === 0) {
        http_response_code(403);
        echo json_encode(['error' => 'Operación UPDATE no autorizada sin cláusula WHERE parametrizada.']);
        exit;
    }
}

// Whitelist general: La consulta debe comenzar estrictamente por SELECT, INSERT, UPDATE, SHOW, CREATE TABLE IF NOT EXISTS o DELETE controlado
if (!preg_match('/^(SELECT|INSERT|UPDATE|SHOW|DELETE)\b/i', $sql_clean_upper) && !preg_match('/^CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\b/i', $sql_clean_upper)) {
    http_response_code(403);
    echo json_encode(['error' => 'Tipo de consulta SQL no soportada.']);
    exit;
}
// ====================================

// 6. Credenciales leídas EXCLUSIVAMENTE de variables de entorno del servidor
$host = get_proxy_env('DB_HOST') ?: get_proxy_env('MYSQL_HOST') ?: 'localhost';
$db = get_proxy_env('DB_NAME') ?: get_proxy_env('MYSQL_DATABASE') ?: '';
$user = get_proxy_env('DB_USER') ?: get_proxy_env('MYSQL_USER') ?: '';
$pass = get_proxy_env('DB_PASS') ?: get_proxy_env('MYSQL_PASSWORD') ?: '';
$charset = 'utf8mb4';

if (empty($db) || empty($user) || empty($pass)) {
    http_response_code(500);
    echo json_encode(['error' => 'Configuración de base de datos no inicializada en el entorno.']);
    exit;
}

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
    PDO::MYSQL_ATTR_MULTI_STATEMENTS => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    $stmt = $pdo->prepare($sql);
    
    // Ejecutar con parámetros
    $stmt->execute($params);
    
    // VULN-11: Límite defensivo de filas por consulta para prevenir DoS por agotamiento de memoria (OOM)
    $max_rows = 1000;
    $rows = [];
    if (strpos($sql_clean_upper, 'SELECT') === 0 || strpos($sql_clean_upper, 'SHOW') === 0) {
        $count = 0;
        while ($count < $max_rows && ($row = $stmt->fetch())) {
            $rows[] = $row;
            $count++;
        }
    }
    
    echo json_encode([
        'success' => true,
        'rows' => $rows,
        'affected_rows' => $stmt->rowCount(),
        'insert_id' => $pdo->lastInsertId()
    ]);
} catch (\PDOException $e) {
    error_log("DB_PROXY_ERROR: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno de base de datos'
    ]);
}

