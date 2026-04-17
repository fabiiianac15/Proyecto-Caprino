<?php
// API Sistema Caprino v2.0 - OCI8 (Oracle 21c)
// Archivo limpio sin duplicados
// Última actualización: 2026-04-09

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

ini_set('display_errors', '0');  // No mostrar errores como HTML
error_reporting(E_ALL);

// Configurar NLS_LANG ANTES de cualquier operación con BD
putenv('NLS_LANG=AMERICAN_AMERICA.AL32UTF8');
if (getenv('NLS_LANG') !== 'AMERICAN_AMERICA.AL32UTF8') {
    $_ENV['NLS_LANG'] = 'AMERICAN_AMERICA.AL32UTF8';
    putenv('NLS_LANG=AMERICAN_AMERICA.AL32UTF8');
}

// Manejo de REQUEST OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Cargar configuración del .env
$envFile = __DIR__ . '/../.env';
$env = [];
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $env[trim($parts[0])] = trim($parts[1]);
        }
    }
}

// Configuración de conexión Oracle
$dbHost = $env['DATABASE_HOST'] ?? '127.0.0.1';
$dbPort = $env['DATABASE_PORT'] ?? '1521';
$dbName = $env['DATABASE_NAME'] ?? 'XEPDB1';
$dbUser = $env['DATABASE_USER'] ?? 'caprino';
$dbPass = $env['DATABASE_PASSWORD'] ?? 'CaprinoPass2025';

// Variables globales
$conn = null;
$mensaje_error = null;

try {
    // Conexión a Oracle
    $tns = "{$dbHost}:{$dbPort}/{$dbName}";
    
    // Check if OCI8 is loaded
    if (!extension_loaded('oci8')) {
        throw new Exception('OCI8 extension no está cargado');
    }
    
    error_log("Intentando conectar a: $tns con usuario: $dbUser");
    $conn = @oci_connect($dbUser, $dbPass, $tns);
    
    if (!$conn) {
        $error = oci_error();
        throw new Exception('No se puede conectar a la BD: ' . ($error['message'] ?? 'Error desconocido'));
    }
    
    error_log("Conexión a Oracle exitosa");
    
    // Parsear ruta y método
    $requestUri = $_SERVER['REQUEST_URI'];
    $path = parse_url($requestUri, PHP_URL_PATH);
    $method = $_SERVER['REQUEST_METHOD'];
    
    // DEBUG: Log DETALLADO de cada request
    $logMsg = "=== API REQUEST ===\n";
    $logMsg .= "TIME: " . date('Y-m-d H:i:s') . "\n";
    $logMsg .= "METHOD: $method\n";
    $logMsg .= "PATH: $path\n";
    $logMsg .= "URI: $requestUri\n";
    $logMsg .= "CONTENT_TYPE: " . ($_SERVER['CONTENT_TYPE'] ?? 'NOT_SET') . "\n";
    $logMsg .= "HTTP_ORIGIN: " . ($_SERVER['HTTP_ORIGIN'] ?? 'NOT_SET') . "\n";
    $logMsg .= "HTTP_REFERER: " . ($_SERVER['HTTP_REFERER'] ?? 'NOT_SET') . "\n";
    $logMsg .= "REMOTE_ADDR: " . ($_SERVER['REMOTE_ADDR'] ?? 'NOT_SET') . "\n";
    
    // Leer body raw
    $body_raw = file_get_contents('php://input');
    $logMsg .= "BODY_LENGTH: " . strlen($body_raw) . " bytes\n";
    $logMsg .= "BODY_PREVIEW: " . substr($body_raw, 0, 200) . "\n";
    $logMsg .= "=====================\n";
    error_log($logMsg);
    
    // Leer datos JSON del body (solo una vez!)
    $data = [];
    if (in_array($method, ['POST', 'PUT'])) {
        if ($body_raw) {
            // Intentar decodificar JSON
            $data = json_decode($body_raw, true);
            
            // Si falla, intentar con UTF-8
            if ($data === null) {
                $body_raw = iconv("UTF-8", "UTF-8//IGNORE", $body_raw);
                $data = json_decode($body_raw, true) ?? [];
            }
            
            error_log(">>> Body received: " . json_encode($data));
        }
    }
    
    // ============================================================================
    // ENDPOINTS DISPONIBLES
    // ============================================================================
    
    // GET /api/health - Verificar que el API está vivo
    if ($path === '/api/health' || $path === '/api/health/') {
        http_response_code(200);
        echo json_encode([
            'status' => 'ok',
            'message' => 'API funcionando correctamente',
            'database' => 'connected',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit;
    }
    
    // DEBUG: GET /api/debug/method - Muestra el método HTTP recibido
    if ($path === '/api/debug/method' || $path === '/api/debug/method/') {
        http_response_code(200);
        echo json_encode([
            'method' => $method,
            'path' => $path,
            'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'none',
            'data_received' => $data,
            'request_method_raw' => $_SERVER['REQUEST_METHOD'],
            'headers' => [
                'content_type' => $_SERVER['CONTENT_TYPE'] ?? null,
                'content_length' => $_SERVER['CONTENT_LENGTH'] ?? null
            ]
        ]);
        exit;
    }
    
    // DIAGNOSTICO COMPLETO: GET /api/diag/solicitud
    if ($path === '/api/diag/solicitud' || $path === '/api/diag/solicitud/') {
        $bodyRaw = file_get_contents('php://input');
        $allHeaders = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_' || in_array($name, ['CONTENT_TYPE', 'CONTENT_LENGTH', 'REQUEST_METHOD'])) {
                $allHeaders[$name] = $value;
            }
        }
        
        http_response_code(200);
        echo json_encode([
            'diagnostico' => 'INFORMACIÓN COMPLETA DE SOLICITUD',
            'timestamp' => date('Y-m-d H:i:s.u'),
            'method_recibido' => $_SERVER['REQUEST_METHOD'],
            'path' => $path,
            'uri' => $requestUri,
            'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'NOT_SET',
            'content_length' => $_SERVER['CONTENT_LENGTH'] ?? '0',
            'body_raw_length' => strlen($bodyRaw),
            'body_preview' => substr($bodyRaw, 0, 300),
            'headers_http' => $allHeaders,
            'php_version' => phpversion(),
            'servidor' => [
                'addr' => $_SERVER['SERVER_ADDR'] ?? 'NOT_SET',
                'puerto' => $_SERVER['SERVER_PORT'] ?? 'NOT_SET',
                'nombre' => $_SERVER['SERVER_NAME'] ?? 'NOT_SET'
            ],
            'cliente' => [
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'NOT_SET',
                'puerto' => $_SERVER['REMOTE_PORT'] ?? 'NOT_SET',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'NOT_SET'
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }
    
    // DEBUG: Captura TODAS las solicitudes a /api/auth/register sin importar el método
    if (preg_match('#^/api/auth/register/?$#', $path)) {
        error_log("=== CAPTURED /api/auth/register ===");
        error_log("REQUEST_METHOD: " . $_SERVER['REQUEST_METHOD']);
        error_log("METHOD Variable: " . $method);
        error_log("Content-Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'NONE'));
        error_log("Data: " . json_encode($data));
        error_log("== END ==");
        
        if ($method === 'OPTIONS') {
            http_response_code(200);
            exit;
        }
        
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode([
                'error' => 'Método no permitido. Se requiere POST',
                'received_method' => $method,
                'request_method' => $_SERVER['REQUEST_METHOD'],
                'path' => $path
            ]);
            exit;
        }
    }
    
    // GET /api/razas - Obtener todas las razas
    if ($path === '/api/razas' || $path === '/api/razas/' && $method === 'GET') {
        $stmt = oci_parse($conn, "SELECT ID_RAZA, NOMBRE_RAZA, DESCRIPCION FROM RAZA ORDER BY NOMBRE_RAZA");
        oci_execute($stmt);
        
        $razas = [];
        while ($row = oci_fetch_assoc($stmt)) {
            $razas[] = [
                'id_raza' => (int)$row['ID_RAZA'],
                'nombre_raza' => $row['NOMBRE_RAZA'],
                'descripcion' => $row['DESCRIPCION']
            ];
        }
        oci_free_statement($stmt);
        
        http_response_code(200);
        echo json_encode(['data' => $razas], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // GET /api/animales - Obtener todos los animales
    if (preg_match('#^/api/animales/?$#', $path) && $method === 'GET') {
        $stmt = oci_parse($conn, "SELECT * FROM ANIMAL ORDER BY CODIGO_IDENTIFICACION");
        oci_execute($stmt);
        
        $animales = [];
        while ($row = oci_fetch_assoc($stmt)) {
            $animales[] = [
                'id' => (int)$row['ID_ANIMAL'],
                'codigo' => $row['CODIGO_IDENTIFICACION'],
                'nombre' => $row['NOMBRE'],
                'sexo' => $row['SEXO'],
                'idRaza' => (int)$row['ID_RAZA'],
                'estado' => $row['ESTADO']
            ];
        }
        oci_free_statement($stmt);
        
        http_response_code(200);
        echo json_encode(['data' => $animales], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // POST /api/animales - Crear animal
    if (preg_match('#^/api/animales/?$#', $path) && $method === 'POST') {
        $codigo = $data['codigo'] ?? $data['codigo_identificacion'] ?? null;
        $nombre = $data['nombre'] ?? null;
        $sexo = $data['sexo'] ?? null;
        $idRaza = $data['idRaza'] ?? $data['id_raza'] ?? null;
        
        if (!$codigo || !$sexo || !$idRaza) {
            http_response_code(400);
            echo json_encode(['error' => 'Campos requeridos: codigo, sexo, idRaza']);
            exit;
        }
        
        $sql = "INSERT INTO ANIMAL (codigo_identificacion, nombre, sexo, id_raza, estado, fecha_creacion)
                VALUES (:codigo, :nombre, :sexo, :id_raza, 'activo', SYSDATE)";
        
        $stmt = oci_parse($conn, $sql);
        oci_bind_by_name($stmt, ':codigo', $codigo);
        oci_bind_by_name($stmt, ':nombre', $nombre);
        oci_bind_by_name($stmt, ':sexo', $sexo);
        oci_bind_by_name($stmt, ':id_raza', $idRaza);
        
        if (!oci_execute($stmt, OCI_COMMIT_ON_SUCCESS)) {
            oci_free_statement($stmt);
            http_response_code(500);
            echo json_encode(['error' => 'Error al crear animal: ' . oci_error()['message']]);
            exit;
        }
        oci_free_statement($stmt);
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Animal creado correctamente',
            'data' => ['id' => $codigo, 'nombre' => $nombre]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // POST /api/auth/register - Registro de usuario
    if (preg_match('#^/api/auth/register/?$#', $path) && $method === 'POST') {
        $nombre = $data['nombre_completo'] ?? $data['nombre'] ?? null;
        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;
        $rol = $data['rol'] ?? 'tecnico';
        
        if (!$nombre || !$email || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'Campos requeridos: nombre_completo, email, password']);
            exit;
        }
        
        // Verificar si el email ya existe
        $sql = "SELECT COUNT(*) as cnt FROM USUARIO WHERE EMAIL = :email";
        $stmt = oci_parse($conn, $sql);
        oci_bind_by_name($stmt, ':email', $email);
        oci_execute($stmt);
        $row = oci_fetch_assoc($stmt);
        oci_free_statement($stmt);
        
        if ($row['CNT'] > 0) {
            http_response_code(409);
            echo json_encode(['error' => 'El email ya está registrado']);
            exit;
        }
        
        // Hash de contraseña
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        
        // Insertar usuario con ID generado desde la secuencia
        $sql = "INSERT INTO USUARIO (id_usuario, nombre_completo, email, password_hash, rol, estado, fecha_creacion)
                VALUES (SEQ_USUARIO.NEXTVAL, :nombre, :email, :password, :rol, 'activo', SYSDATE)";
        
        $stmt = oci_parse($conn, $sql);
        oci_bind_by_name($stmt, ':nombre', $nombre);
        oci_bind_by_name($stmt, ':email', $email);
        oci_bind_by_name($stmt, ':password', $passwordHash);
        oci_bind_by_name($stmt, ':rol', $rol);
        
        if (!oci_execute($stmt, OCI_COMMIT_ON_SUCCESS)) {
            oci_free_statement($stmt);
            http_response_code(500);
            echo json_encode(['error' => 'Error al registrar: ' . oci_error()['message']]);
            exit;
        }
        oci_free_statement($stmt);
        
        // Obtener ID del nuevo usuario
        $sql = "SELECT MAX(ID_USUARIO) as max_id FROM USUARIO WHERE EMAIL = :email_search";
        $stmt = oci_parse($conn, $sql);
        oci_bind_by_name($stmt, ':email_search', $email);
        oci_execute($stmt);
        $row = oci_fetch_assoc($stmt);
        oci_free_statement($stmt);
        $userId = (int)($row['MAX_ID'] ?? 0);
        
        // Generar JWT token
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'id' => $userId,
            'email' => $email,
            'rol' => $rol,
            'iat' => time(),
            'exp' => time() + (24 * 60 * 60)
        ]);
        
        $base64Header = rtrim(strtr(base64_encode($header), '+/', '-_'), '=');
        $base64Payload = rtrim(strtr(base64_encode($payload), '+/', '-_'), '=');
        $signature = hash_hmac('sha256', $base64Header . '.' . $base64Payload, 'tu_clave_secreta_super_segura', true);
        $base64Sig = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');
        $token = $base64Header . '.' . $base64Payload . '.' . $base64Sig;
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Usuario registrado correctamente',
            'token' => $token,
            'user' => [
                'id' => $userId,
                'nombre' => $nombre,
                'email' => $email,
                'rol' => $rol
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // POST /api/auth/login - Login de usuario
    if (preg_match('#^/api/auth/login/?$#', $path) && $method === 'POST') {
        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;
        
        if (!$email || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'Campos requeridos: email, password']);
            exit;
        }
        
        // Buscar usuario
        $sql = "SELECT * FROM USUARIO WHERE EMAIL = :email AND ESTADO = 'activo'";
        $stmt = oci_parse($conn, $sql);
        oci_bind_by_name($stmt, ':email', $email);
        oci_execute($stmt);
        $usuario = oci_fetch_assoc($stmt);
        oci_free_statement($stmt);
        
        if (!$usuario || password_verify($password, $usuario['PASSWORD_HASH']) === false) {
            http_response_code(401);
            echo json_encode(['error' => 'Credenciales inválidas']);
            exit;
        }
        
        // Generar JWT token
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'id' => (int)$usuario['ID_USUARIO'],
            'email' => $usuario['EMAIL'],
            'rol' => $usuario['ROL'],
            'iat' => time(),
            'exp' => time() + (24 * 60 * 60)
        ]);
        
        $base64Header = rtrim(strtr(base64_encode($header), '+/', '-_'), '=');
        $base64Payload = rtrim(strtr(base64_encode($payload), '+/', '-_'), '=');
        $signature = hash_hmac('sha256', $base64Header . '.' . $base64Payload, 'tu_clave_secreta_super_segura', true);
        $base64Sig = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');
        $token = $base64Header . '.' . $base64Payload . '.' . $base64Sig;
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Login exitoso',
            'token' => $token,
            'user' => [
                'id' => (int)$usuario['ID_USUARIO'],
                'nombre' => $usuario['NOMBRE_COMPLETO'],
                'email' => $usuario['EMAIL'],
                'rol' => $usuario['ROL']
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Endpoint no encontrado
    http_response_code(404);
    echo json_encode([
        'error' => 'Endpoint no encontrado',
        'path' => $path,
        'method' => $method,
        'available_endpoints' => [
            'GET /api/health',
            'GET /api/razas',
            'GET /api/animales',
            'POST /api/animales',
            'POST /api/auth/register',
            'POST /api/auth/login'
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Error interno del servidor',
        'message' => $e->getMessage()
    ]);
} finally {
    if ($conn) {
        oci_close($conn);
    }
}
?>
