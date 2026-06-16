<?php
// db_proxy.php
header('Content-Type: application/json');

// Token de seguridad para validar la petición desde Vercel
$secret = $_SERVER['HTTP_X_PROXY_TOKEN'] ?? '';
$expected_secret = 'a6f021f1d19d675b8e998a44d187764d'; // Token seguro generado

if (empty($secret) || $secret !== $expected_secret) {
    http_response_code(403);
    echo json_encode(['error' => 'Acceso denegado: Token no válido o ausente.']);
    exit;
}

// Leer consulta e inputs JSON
$input = json_decode(file_get_contents('php://input'), true);
$sql = $input['sql'] ?? '';
$params = $input['params'] ?? [];

if (empty($sql)) {
    http_response_code(400);
    echo json_encode(['error' => 'Consulta SQL no proporcionada.']);
    exit;
}

// Credenciales locales de MySQL en Raiola
$host = 'localhost';
$db = 'ecosier2_PortalEmpleo';
$user = 'ecosier2_UserPortal';
$pass = '&+{Tv*GbZw4~Ye2;';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    $stmt = $pdo->prepare($sql);
    
    // Ejecutar con parámetros si los hay
    $stmt->execute($params);
    
    // Si la consulta es un SELECT o SHOW, devolvemos filas
    $rows = [];
    if (stripos($sql, 'SELECT') === 0 || stripos($sql, 'SHOW') === 0) {
        $rows = $stmt->fetchAll();
    }
    
    echo json_encode([
        'success' => true,
        'rows' => $rows,
        'affected_rows' => $stmt->rowCount()
    ]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
