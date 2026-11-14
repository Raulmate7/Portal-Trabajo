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

/**
 * Verifica si una IP IPv4 o IPv6 pertenece a un bloque CIDR usando aritmética binaria exacta.
 */
function ip_in_cidr(string $ip, string $cidr): bool {
    if (strpos($cidr, '/') === false) {
        return $ip === $cidr;
    }
    list($subnet, $prefix_str) = explode('/', $cidr, 2);
    $ip_bin = @inet_pton($ip);
    $subnet_bin = @inet_pton($subnet);
    if ($ip_bin === false || $subnet_bin === false || strlen($ip_bin) !== strlen($subnet_bin)) {
        return false;
    }
    $prefix = (int) $prefix_str;
    $max_bits = strlen($ip_bin) * 8;
    if ($prefix < 0 || $prefix > $max_bits) {
        return false;
    }
    $bytes = intdiv($prefix, 8);
    $bits = $prefix % 8;
    if ($bytes > 0 && substr($ip_bin, 0, $bytes) !== substr($subnet_bin, 0, $bytes)) {
        return false;
    }
    if ($bits > 0) {
        $mask = (0xFF << (8 - $bits)) & 0xFF;
        if ((ord($ip_bin[$bytes]) & $mask) !== (ord($subnet_bin[$bytes]) & $mask)) {
            return false;
        }
    }
    return true;
}

/**
 * Rangos oficiales de Cloudflare (IPv4 e IPv6) + TRUSTED_PROXY_IPS opcionales.
 * Solo si REMOTE_ADDR pertenece a un proxy de confianza se lee CF-Connecting-IP.
 */
function is_trusted_proxy_ip(string $remote_addr): bool {
    $cf_ranges = [
        '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22',
        '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20',
        '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
        '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
        '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32',
        '2405:8100::/32', '2a06:98c0::/29', '2c0f:f248::/32'
    ];
    $extra_proxies = get_proxy_env('TRUSTED_PROXY_IPS');
    if (!empty($extra_proxies)) {
        foreach (array_map('trim', explode(',', $extra_proxies)) as $cidr) {
            if ($cidr !== '') $cf_ranges[] = $cidr;
        }
    }
    foreach ($cf_ranges as $cidr) {
        if (ip_in_cidr($remote_addr, $cidr)) {
            return true;
        }
    }
    return false;
}

// 3. Control perimetral de IP si está configurado ALLOWED_PROXY_IPS en el entorno (SEC-008)
$allowed_ips_env = get_proxy_env('ALLOWED_PROXY_IPS');
if (!empty($allowed_ips_env)) {
    $allowed_ips = array_map('trim', explode(',', $allowed_ips_env));
    $remote_addr = $_SERVER['REMOTE_ADDR'] ?? '';
    $client_ip = $remote_addr;

    if (is_trusted_proxy_ip($remote_addr) && !empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        $cf_ip = trim($_SERVER['HTTP_CF_CONNECTING_IP']);
        if (filter_var($cf_ip, FILTER_VALIDATE_IP) !== false) {
            $client_ip = $cf_ip;
        }
    }

    $ip_authorized = false;
    foreach ($allowed_ips as $allowed) {
        if ($allowed !== '' && ip_in_cidr($client_ip, $allowed)) {
            $ip_authorized = true;
            break;
        }
    }
    if (!$ip_authorized) {
        http_response_code(403);
        echo json_encode(['error' => 'IP de origen no autorizada para el proxy de base de datos.']);
        exit;
    }
}

// 4. Token de seguridad leído exclusivamente de variables de entorno (mínimo 32 caracteres).
// Soporta rotación sin caída aceptando opcionalmente PROXY_SECRET_PREVIOUS / DB_PROXY_TOKEN_PREVIOUS.
$secret = $_SERVER['HTTP_X_PROXY_TOKEN'] ?? '';
$expected_secret = get_proxy_env('PROXY_SECRET') ?: get_proxy_env('DB_PROXY_TOKEN') ?: '';
$previous_secret = get_proxy_env('PROXY_SECRET_PREVIOUS') ?: get_proxy_env('DB_PROXY_TOKEN_PREVIOUS') ?: '';

$valid_primary = !empty($expected_secret) && strlen($expected_secret) >= 32 && !empty($secret) && hash_equals($expected_secret, $secret);
$valid_previous = !empty($previous_secret) && strlen($previous_secret) >= 32 && !empty($secret) && hash_equals($previous_secret, $secret);

if (!$valid_primary && !$valid_previous) {
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
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'Payload JSON inválido.']);
    exit;
}

/**
 * Elimina el contenido de cadenas literales ('...' y "...") para analizar únicamente la sintaxis SQL.
 */
function strip_sql_string_literals(string $sql): string {
    $out = '';
    $len = strlen($sql);
    $in_quote = false;
    $quote_char = '';

    for ($i = 0; $i < $len; $i++) {
        $ch = $sql[$i];
        if ($in_quote) {
            if ($ch === '\\' && $i + 1 < $len) {
                $i++; // Saltar carácter escapado dentro del literal
                continue;
            }
            if ($ch === $quote_char) {
                if ($i + 1 < $len && $sql[$i + 1] === $quote_char) {
                    $i++; // Comilla doblada SQL ('')
                    continue;
                }
                $in_quote = false;
                $out .= "''";
            }
        } else {
            if ($ch === "'" || $ch === '"') {
                $in_quote = true;
                $quote_char = $ch;
            } else {
                $out .= $ch;
            }
        }
    }
    return $out;
}

/**
 * Valida parámetros y reglas de seguridad SQL para una sentencia preparada (SEC-009, SEC-010, SEC-011).
 * Devuelve el SQL en mayúsculas sin literales o termina con respuesta HTTP de error.
 */
function validate_sql_and_params($sql, $params): string {
    if (!is_array($params)) {
        http_response_code(400);
        echo json_encode(['error' => 'Los parámetros deben enviarse como lista JSON.']);
        exit;
    }

    if (count($params) > 200) {
        http_response_code(400);
        echo json_encode(['error' => 'Exceso de parámetros en la consulta (máximo 200 permitidos).']);
        exit;
    }

    foreach ($params as $param) {
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

    $sql_trimmed = rtrim($sql, "; \t\n\r\0\x0B");
    $sql_structural = strip_sql_string_literals($sql_trimmed);

    // Rechazar consultas apiladas (stacked queries) fuera de literales
    if (strpos($sql_structural, ';') !== false) {
        http_response_code(403);
        echo json_encode(['error' => 'Consultas múltiples no permitidas por políticas de seguridad.']);
        exit;
    }

    // SEC-010: Rechazar estrictamente cualquier sintaxis de comentario SQL fuera de parámetros (?)
    if (
        strpos($sql_structural, '/*') !== false ||
        strpos($sql_structural, '*/') !== false ||
        strpos($sql_structural, '--') !== false ||
        strpos($sql_structural, '#') !== false
    ) {
        http_response_code(403);
        echo json_encode(['error' => 'Comentarios SQL no permitidos fuera de parámetros enlazados.']);
        exit;
    }

    // Verificar correspondencia exacta entre placeholders (?) y parámetros enviados
    $placeholder_count = substr_count($sql_structural, '?');
    if ($placeholder_count !== count($params)) {
        http_response_code(400);
        echo json_encode(['error' => 'Desajuste entre placeholders SQL (?) y número de parámetros.']);
        exit;
    }

    $sql_upper = strtoupper(trim($sql_structural));

    // SEC-009: Prohibir comandos transaccionales sueltos sin estado (usar modo batch atómico)
    if (preg_match('/^(START\s+TRANSACTION|COMMIT|ROLLBACK|BEGIN)\b/i', $sql_upper)) {
        http_response_code(403);
        echo json_encode(['error' => 'Transacciones stateless deshabilitadas; use el modo batch transaccional.']);
        exit;
    }

    // Rechazar acceso a esquemas y tablas internas de MySQL
    if (preg_match('/\b(INFORMATION_SCHEMA|PERFORMANCE_SCHEMA|MYSQL|SYS)\b/i', $sql_upper)) {
        http_response_code(403);
        echo json_encode(['error' => 'Acceso a esquemas de sistema no permitido.']);
        exit;
    }

    // Rechazar funciones de archivos o temporización
    if (preg_match('/\b(OUTFILE|DUMPFILE|LOAD_FILE|BENCHMARK|SLEEP)\b/i', $sql_upper)) {
        http_response_code(403);
        echo json_encode(['error' => 'Operación de archivo o temporización bloqueada.']);
        exit;
    }

    // Rechazar operaciones DDL/administrativas destructivas
    if (preg_match('/\b(DROP|ALTER|TRUNCATE|GRANT|REVOKE|RENAME|FLUSH|KILL|SHUTDOWN)\b/i', $sql_upper)) {
        http_response_code(403);
        echo json_encode(['error' => 'Operación SQL destructiva no permitida por políticas de seguridad.']);
        exit;
    }

    // SEC-011: Bloquear tautologías triviales en WHERE de DELETE/UPDATE y prohibir DELETE sobre stripe_processed_events
    if (preg_match('/^(DELETE|UPDATE)\b/i', $sql_upper)) {
        if (preg_match('/\bWHERE\b.*\b(1\s*=\s*1|0\s*=\s*0|\?\s*=\s*\?|TRUE|1\s+OR)\b/is', $sql_upper)) {
            http_response_code(403);
            echo json_encode(['error' => 'Condición WHERE potencialmente tautológica bloqueada por seguridad.']);
            exit;
        }
    }

    if (preg_match('/^DELETE\b/i', $sql_upper)) {
        if (
            !preg_match('/^DELETE\s+FROM\s+`?(subscribers|jobs|job_reactions|newsletter_sponsors|report_downloads|email_tracking|company_reviews|review_reports)`?\s+WHERE\s+/is', $sql_upper) ||
            preg_match('/\bOR\b/i', $sql_upper) ||
            !preg_match('/\bWHERE\s+.*`?[a-zA-Z_][a-zA-Z0-9_]*`?\s*=\s*\?/is', $sql_upper) ||
            count($params) === 0
        ) {
            http_response_code(403);
            echo json_encode(['error' => 'Operación DELETE no autorizada sin cláusula WHERE estrictamente parametrizada.']);
            exit;
        }
    }

    if (preg_match('/^UPDATE\b/i', $sql_upper)) {
        if (
            !preg_match('/^UPDATE\s+`?[a-zA-Z0-9_]+`?\s+SET\s+.+\s+WHERE\s+.*`?[a-zA-Z_][a-zA-Z0-9_]*`?\s*(?:=|IN)\s*/is', $sql_upper) ||
            count($params) === 0
        ) {
            http_response_code(403);
            echo json_encode(['error' => 'Operación UPDATE no autorizada sin cláusula WHERE parametrizada.']);
            exit;
        }
    }

    // Whitelist general
    if (!preg_match('/^(SELECT|INSERT|UPDATE|SHOW|DELETE)\b/i', $sql_upper) && !preg_match('/^CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\b/i', $sql_upper)) {
        http_response_code(403);
        echo json_encode(['error' => 'Tipo de consulta SQL no soportada.']);
        exit;
    }

    return $sql_upper;
}

$is_batch = isset($input['batch']) && is_array($input['batch']);
$queries_to_run = [];

if ($is_batch) {
    if (count($input['batch']) === 0 || count($input['batch']) > 25) {
        http_response_code(400);
        echo json_encode(['error' => 'El lote transaccional debe contener entre 1 y 25 sentencias.']);
        exit;
    }
    foreach ($input['batch'] as $item) {
        if (!is_array($item)) {
            http_response_code(400);
            echo json_encode(['error' => 'Elemento de lote inválido.']);
            exit;
        }
        $q_sql = $item['sql'] ?? '';
        $q_params = $item['params'] ?? [];
        $q_upper = validate_sql_and_params($q_sql, $q_params);
        $queries_to_run[] = ['sql' => $q_sql, 'params' => $q_params, 'upper' => $q_upper];
    }
} else {
    $sql = $input['sql'] ?? '';
    $params = $input['params'] ?? [];
    $sql_upper = validate_sql_and_params($sql, $params);
    $queries_to_run[] = ['sql' => $sql, 'params' => $params, 'upper' => $sql_upper];
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
    PDO::ATTR_ERRMODE                 => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE      => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES        => false,
    PDO::ATTR_TIMEOUT                 => 5,
    PDO::MYSQL_ATTR_MULTI_STATEMENTS  => false,
];

$pdo = null;
try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    // SEC-012: Límite máximo de tiempo de ejecución SQL en sesión (MySQL max_execution_time / MariaDB max_statement_time)
    try {
        $pdo->exec('SET SESSION max_execution_time = 5000');
    } catch (\Throwable $timeoutErr) {
        try {
            $pdo->exec('SET SESSION max_statement_time = 5');
        } catch (\Throwable $timeoutErr2) {}
    }

    if ($is_batch) {
        $pdo->beginTransaction();
        $batch_results = [];
        $max_rows = 1000;
        foreach ($queries_to_run as $q) {
            $stmt = $pdo->prepare($q['sql']);
            $stmt->execute($q['params']);
            $rows = [];
            if (strpos($q['upper'], 'SELECT') === 0 || strpos($q['upper'], 'SHOW') === 0) {
                $count = 0;
                while ($count < $max_rows && ($row = $stmt->fetch())) {
                    $rows[] = $row;
                    $count++;
                }
            }
            $batch_results[] = [
                'rows' => $rows,
                'affected_rows' => $stmt->rowCount(),
                'insert_id' => $pdo->lastInsertId()
            ];
        }
        $pdo->commit();
        echo json_encode([
            'success' => true,
            'results' => $batch_results
        ]);
    } else {
        $q = $queries_to_run[0];
        $stmt = $pdo->prepare($q['sql']);
        $stmt->execute($q['params']);

        // VULN-11: Límite defensivo de filas por consulta para prevenir DoS por agotamiento de memoria (OOM)
        $max_rows = 1000;
        $rows = [];
        if (strpos($q['upper'], 'SELECT') === 0 || strpos($q['upper'], 'SHOW') === 0) {
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
    }
} catch (\Throwable $e) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("DB_PROXY_ERROR: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno de base de datos'
    ]);
}


