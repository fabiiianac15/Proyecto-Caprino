<?php
// API de Prueba Temporal - Sistema Caprino v1.1
// Este archivo es temporal hasta que composer install funcione
// Última actualización: 2025-12-30 03:35

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar OPTIONS para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Cargar configuración Oracle desde .env
$envFile = __DIR__ . '/../.env';
$env = [];
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($key, $value) = explode('=', $line, 2);
        $env[trim($key)] = trim($value);
    }
}

// Conexión Oracle
$dbHost = $env['DATABASE_HOST'] ?? 'localhost';
$dbPort = $env['DATABASE_PORT'] ?? '1521';
$dbName = $env['DATABASE_NAME'] ?? 'XEPDB1';
$dbUser = $env['DATABASE_USER'] ?? 'caprino_user';
$dbPass = $env['DATABASE_PASSWORD'] ?? '';

try {
    $dsn = "oci:dbname=//{$dbHost}:{$dbPort}/{$dbName};charset=UTF8";
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_STRINGIFY_FETCHES => true  // Convertir todos los valores a string
    ]);
    
    // Configurar charset de la sesión Oracle
    $pdo->exec("ALTER SESSION SET NLS_LANGUAGE='AMERICAN'");
    $pdo->exec("ALTER SESSION SET NLS_TERRITORY='AMERICA'");
    $pdo->exec("ALTER SESSION SET NLS_DATE_FORMAT='YYYY-MM-DD'");
    
    // Separar path del query string
    $requestUri = $_SERVER['REQUEST_URI'];
    $path = parse_url($requestUri, PHP_URL_PATH);
    
    // Manejar métodos HTTP que algunos servidores no soportan directamente
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method === 'POST' && isset($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
        $method = $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'];
    }
    
    // Log para debug
    error_log("DEBUG REQUEST - Method: " . $method . " (Original: " . $_SERVER['REQUEST_METHOD'] . "), Path: " . $path);
    
    // Función para guardar imagen base64 como archivo
    function guardarImagenBase64($base64String, $uploadDir = __DIR__ . '/uploads/animales/') {
        if (empty($base64String)) {
            return null;
        }
        
        // Extraer el tipo de imagen y los datos
        if (preg_match('/^data:image\/(\w+);base64,(.+)$/', $base64String, $matches)) {
            $extension = $matches[1]; // jpg, png, gif, etc.
            $data = base64_decode($matches[2]);
        } else {
            // Si no tiene el prefijo data:image, asumir que es base64 puro
            $data = base64_decode($base64String);
            $extension = 'jpg';
        }
        
        if ($data === false) {
            return null;
        }
        
        // Crear nombre único para el archivo
        $filename = uniqid('animal_', true) . '.' . $extension;
        $filepath = $uploadDir . $filename;
        
        // Crear directorio si no existe
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Guardar archivo
        if (file_put_contents($filepath, $data) === false) {
            return null;
        }
        
        // Retornar ruta relativa para guardar en BD
        return '/uploads/animales/' . $filename;
    }
    
    // Función para eliminar archivo de foto
    function eliminarImagenArchivo($fotoUrl) {
        if (empty($fotoUrl)) {
            return;
        }
        
        $filepath = __DIR__ . $fotoUrl;
        if (file_exists($filepath)) {
            unlink($filepath);
        }
    }
    
    // Endpoint: GET /api/health
    if ($path === '/api/health' || $path === '/api/health/') {
        echo json_encode([
            'status' => 'ok',
            'message' => 'API funcionando (modo temporal)',
            'database' => 'connected',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit;
    }
    
    // Endpoint: GET /api/razas
    if (preg_match('#^/api/razas/?$#', $path) && $_SERVER['REQUEST_METHOD'] === 'GET') {
        error_log("DEBUG: Consultando razas...");
        $stmt = $pdo->query('SELECT * FROM RAZA ORDER BY NOMBRE_RAZA');
        $razas = $stmt->fetchAll();
        error_log("DEBUG: Razas obtenidas: " . count($razas));
        
        // Convertir ISO-8859-1 a UTF-8 y claves a minúsculas
        $razas = array_map(function($raza) {
            $raza = array_map(function($valor) {
                return is_string($valor) ? utf8_encode($valor) : $valor;
            }, $raza);
            return array_change_key_case($raza, CASE_LOWER);
        }, $razas);
        
        error_log("DEBUG: Enviando respuesta JSON...");
        echo json_encode(['data' => $razas], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Endpoint: GET /api/animales (con soporte para filtros)
    if (preg_match('#^/api/animales/?$#', $path) && $_SERVER['REQUEST_METHOD'] === 'GET') {
        // Construir query con filtros opcionales
        $where = ['1=1'];
        $params = [];
        
        // Filtro por sexo
        if (!empty($_GET['sexo'])) {
            $where[] = 'LOWER(a.sexo) = :sexo';
            $params[':sexo'] = strtolower($_GET['sexo']);
        }
        
        // Filtro por raza
        if (!empty($_GET['idRaza'])) {
            $where[] = 'a.id_raza = :id_raza';
            $params[':id_raza'] = $_GET['idRaza'];
        }
        
        // Filtro por estado
        if (!empty($_GET['estadoGeneral'])) {
            $where[] = 'LOWER(a.estado) = :estado';
            $params[':estado'] = strtolower($_GET['estadoGeneral']);
        }
        
        // Filtro por búsqueda (código o nombre)
        if (!empty($_GET['busqueda'])) {
            $where[] = '(LOWER(a.codigo_identificacion) LIKE :busqueda OR LOWER(a.nombre) LIKE :busqueda)';
            $params[':busqueda'] = '%' . strtolower($_GET['busqueda']) . '%';
        }
        
        $whereClause = implode(' AND ', $where);
        
        $stmt = $pdo->prepare("
            SELECT a.*, r.nombre_raza
            FROM ANIMAL a 
            JOIN RAZA r ON a.id_raza = r.id_raza 
            WHERE $whereClause
            ORDER BY a.codigo_identificacion
        ");
        
        $stmt->execute($params);
        $animales = $stmt->fetchAll();
        
        // Transformar datos a formato esperado por el frontend (camelCase)
        $animales = array_map(function($animal) {
            return [
                'id' => (int)$animal['ID_ANIMAL'],
                'codigo' => $animal['CODIGO_IDENTIFICACION'],
                'numeroIdentificacion' => $animal['CODIGO_IDENTIFICACION'],
                'identificacion' => $animal['CODIGO_IDENTIFICACION'],
                'nombre' => $animal['NOMBRE'] ?: 'Sin nombre',
                'fechaNacimiento' => $animal['FECHA_NACIMIENTO'],
                'sexo' => strtolower($animal['SEXO']),
                'idRaza' => (int)$animal['ID_RAZA'],
                'raza' => $animal['NOMBRE_RAZA'],
                'nombreRaza' => $animal['NOMBRE_RAZA'],
                'colorPelaje' => $animal['COLOR_PELAJE'],
                'pesoNacimiento' => $animal['PESO_NACIMIENTO_KG'],
                'estado' => strtolower($animal['ESTADO']),
                'estadoGeneral' => strtolower($animal['ESTADO']),
                'observaciones' => $animal['OBSERVACIONES'],
                'foto' => $animal['FOTO_URL'],
                'fotoUrl' => $animal['FOTO_URL']
            ];
        }, $animales);
        
        echo json_encode(['data' => $animales, 'total' => count($animales)]);
        exit;
    }
    
    // Endpoint: POST /api/animales - Crear nuevo animal
    if (preg_match('#^/api/animales/?$#', $path) && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        error_log("DEBUG CREATE ANIMAL - Datos recibidos: " . json_encode($input));
        
        // Validar campos requeridos
        if (!isset($input['codigoIdentificacion']) || !isset($input['fechaNacimiento']) || 
            !isset($input['sexo']) || !isset($input['idRaza'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Faltan campos requeridos: codigoIdentificacion, fechaNacimiento, sexo, idRaza']);
            exit;
        }
        
        // Obtener usuario autenticado del token (por ahora usar el primero)
        $stmtUser = $pdo->query('SELECT id_usuario FROM USUARIO WHERE ROWNUM = 1');
        $usuario = $stmtUser->fetch();
        $usuarioId = $usuario['ID_USUARIO'];
        
        try {
            // Guardar imagen como archivo si se envió
            $fotoUrl = null;
            if (!empty($input['fotoUrl'])) {
                $fotoUrl = guardarImagenBase64($input['fotoUrl']);
            }
            
            // Insertar el animal
            $stmt = $pdo->prepare("
                INSERT INTO ANIMAL (
                    codigo_identificacion,
                    nombre,
                    fecha_nacimiento,
                    sexo,
                    id_raza,
                    color_pelaje,
                    peso_nacimiento_kg,
                    estado,
                    observaciones,
                    foto_url,
                    usuario_registro
                ) VALUES (
                    :codigo,
                    :nombre,
                    TO_DATE(:fecha_nacimiento, 'YYYY-MM-DD'),
                    :sexo,
                    TO_NUMBER(:id_raza),
                    :color_pelaje,
                    :peso_nacimiento_kg,
                    'activo',
                    :observaciones,
                    :foto_url,
                    TO_NUMBER(:usuario_id)
                )
            ");
            
            $stmt->execute([
                ':codigo' => $input['codigoIdentificacion'],
                ':nombre' => $input['nombre'] ?? null,
                ':fecha_nacimiento' => $input['fechaNacimiento'],
                ':sexo' => strtolower($input['sexo']),
                ':id_raza' => $input['idRaza'],
                ':color_pelaje' => $input['colorPelaje'] ?? null,
                ':peso_nacimiento_kg' => $input['pesoNacimiento'] ?? null,
                ':observaciones' => $input['observaciones'] ?? null,
                ':foto_url' => $fotoUrl,
                ':usuario_id' => $usuarioId
            ]);
            
            // Obtener el ID del animal recién creado
            $stmt2 = $pdo->prepare('
                SELECT a.id_animal 
                FROM ANIMAL a 
                WHERE a.codigo_identificacion = :codigo
            ');
            $stmt2->execute([':codigo' => $input['codigoIdentificacion']]);
            $animalNuevo = $stmt2->fetch();
            $animalId = $animalNuevo['ID_ANIMAL'];
            
            // Obtener el animal completo con la ruta de la foto
            $stmt3 = $pdo->prepare('
                SELECT a.*, r.nombre_raza
                FROM ANIMAL a 
                JOIN RAZA r ON a.id_raza = r.id_raza 
                WHERE a.id_animal = :id
            ');
            $stmt3->execute([':id' => $animalId]);
            $animal = $stmt3->fetch();
            
            $animalFormateado = [
                'id' => (int)$animal['ID_ANIMAL'],
                'codigo' => $animal['CODIGO_IDENTIFICACION'],
                'numeroIdentificacion' => $animal['CODIGO_IDENTIFICACION'],
                'identificacion' => $animal['CODIGO_IDENTIFICACION'],
                'nombre' => $animal['NOMBRE'] ?: 'Sin nombre',
                'fechaNacimiento' => $animal['FECHA_NACIMIENTO'],
                'sexo' => strtolower($animal['SEXO']),
                'idRaza' => (int)$animal['ID_RAZA'],
                'raza' => $animal['NOMBRE_RAZA'],
                'nombreRaza' => $animal['NOMBRE_RAZA'],
                'colorPelaje' => $animal['COLOR_PELAJE'],
                'pesoNacimiento' => $animal['PESO_NACIMIENTO_KG'],
                'estado' => strtolower($animal['ESTADO']),
                'estadoGeneral' => strtolower($animal['ESTADO']),
                'observaciones' => $animal['OBSERVACIONES'],
                'foto' => $animal['FOTO_URL'],
                'fotoUrl' => $animal['FOTO_URL']
            ];
            
            http_response_code(201);
            echo json_encode(['success' => true, 'data' => $animalFormateado]);
            exit;
        } catch (PDOException $e) {
            error_log("ERROR CREATE ANIMAL: " . $e->getMessage());
            
            if (strpos($e->getMessage(), 'unique constraint') !== false) {
                http_response_code(409);
                echo json_encode(['error' => 'Ya existe un animal con ese código de identificación']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al crear el animal: ' . $e->getMessage()]);
            }
            exit;
        }
    }
    
    // Endpoint: PUT /api/animales/{id} - Actualizar animal
    if (preg_match('#^/api/animales/(\d+)/?$#', $path, $matches) && $method === 'PUT') {
        $id = $matches[1];
        $input = json_decode(file_get_contents('php://input'), true);
        
        error_log("DEBUG UPDATE ANIMAL - ID: $id, Datos recibidos: " . print_r($input, true));
        
        // Validar campos obligatorios
        if (empty($input['nombre'])) {
            http_response_code(400);
            echo json_encode(['error' => 'El nombre es obligatorio']);
            exit;
        }
        
        if (empty($input['fechaNacimiento'])) {
            http_response_code(400);
            echo json_encode(['error' => 'La fecha de nacimiento es obligatoria']);
            exit;
        }
        
        if (empty($input['sexo'])) {
            http_response_code(400);
            echo json_encode(['error' => 'El sexo es obligatorio']);
            exit;
        }
        
        if (empty($input['idRaza'])) {
            http_response_code(400);
            echo json_encode(['error' => 'La raza es obligatoria']);
            exit;
        }
        
        try {
            // Obtener foto actual del animal
            $stmtCheck = $pdo->prepare('SELECT foto_url FROM ANIMAL WHERE id_animal = :id');
            $stmtCheck->execute([':id' => $id]);
            $animalActual = $stmtCheck->fetch();
            
            if (!$animalActual) {
                http_response_code(404);
                echo json_encode(['error' => 'Animal no encontrado']);
                exit;
            }
            
            $fotoUrlAnterior = $animalActual['FOTO_URL'];
            
            // Procesar nueva foto si se envió
            $fotoUrl = $fotoUrlAnterior; // Mantener la foto actual por defecto
            
            if (isset($input['fotoUrl'])) {
                if (empty($input['fotoUrl'])) {
                    // Si envía fotoUrl vacío/null, eliminar foto
                    if ($fotoUrlAnterior) {
                        eliminarImagenArchivo($fotoUrlAnterior);
                    }
                    $fotoUrl = null;
                } elseif (strpos($input['fotoUrl'], 'data:image') === 0) {
                    // Si es una nueva imagen en base64, guardarla
                    if ($fotoUrlAnterior) {
                        eliminarImagenArchivo($fotoUrlAnterior);
                    }
                    $fotoUrl = guardarImagenBase64($input['fotoUrl']);
                }
                // Si es una ruta existente (ej: /uploads/animales/xxx.jpg), no hacer nada
            }
            
            $stmt = $pdo->prepare("
                UPDATE ANIMAL SET
                    nombre = :nombre,
                    fecha_nacimiento = TO_DATE(:fecha_nacimiento, 'YYYY-MM-DD'),
                    sexo = :sexo,
                    id_raza = TO_NUMBER(:id_raza),
                    color_pelaje = :color_pelaje,
                    peso_nacimiento_kg = :peso_nacimiento_kg,
                    observaciones = :observaciones,
                    foto_url = :foto_url
                WHERE id_animal = TO_NUMBER(:id)
            ");
            
            $stmt->execute([
                ':id' => $id,
                ':nombre' => $input['nombre'],
                ':fecha_nacimiento' => $input['fechaNacimiento'],
                ':sexo' => strtolower($input['sexo']),
                ':id_raza' => $input['idRaza'],
                ':color_pelaje' => $input['colorPelaje'] ?? null,
                ':peso_nacimiento_kg' => !empty($input['pesoNacimiento']) ? floatval($input['pesoNacimiento']) : null,
                ':observaciones' => !empty($input['observaciones']) ? $input['observaciones'] : null,
                ':foto_url' => $fotoUrl
            ]);
            
            error_log("DEBUG UPDATE ANIMAL - Filas afectadas: " . $stmt->rowCount());
            
            // Obtener el animal actualizado con foto
            $stmt2 = $pdo->prepare('
                SELECT a.*, r.nombre_raza
                FROM ANIMAL a 
                JOIN RAZA r ON a.id_raza = r.id_raza 
                WHERE a.id_animal = :id
            ');
            $stmt2->execute([':id' => $id]);
            $animal = $stmt2->fetch();
            
            $animalFormateado = [
                'id' => (int)$animal['ID_ANIMAL'],
                'codigo' => $animal['CODIGO_IDENTIFICACION'],
                'numeroIdentificacion' => $animal['CODIGO_IDENTIFICACION'],
                'identificacion' => $animal['CODIGO_IDENTIFICACION'],
                'nombre' => $animal['NOMBRE'] ?: 'Sin nombre',
                'fechaNacimiento' => $animal['FECHA_NACIMIENTO'],
                'sexo' => strtolower($animal['SEXO']),
                'idRaza' => (int)$animal['ID_RAZA'],
                'raza' => $animal['NOMBRE_RAZA'],
                'nombreRaza' => $animal['NOMBRE_RAZA'],
                'colorPelaje' => $animal['COLOR_PELAJE'],
                'pesoNacimiento' => $animal['PESO_NACIMIENTO_KG'],
                'estado' => strtolower($animal['ESTADO']),
                'estadoGeneral' => strtolower($animal['ESTADO']),
                'observaciones' => $animal['OBSERVACIONES'],
                'foto' => $animal['FOTO_URL'],
                'fotoUrl' => $animal['FOTO_URL']
            ];
            
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $animalFormateado]);
            exit;
        } catch (PDOException $e) {
            error_log("ERROR UPDATE ANIMAL PDO: " . $e->getMessage());
            error_log("ERROR UPDATE ANIMAL PDO Stack: " . $e->getTraceAsString());
            http_response_code(500);
            echo json_encode([
                'error' => 'Error al actualizar el animal',
                'message' => $e->getMessage(),
                'code' => $e->getCode()
            ]);
            exit;
        } catch (Exception $e) {
            error_log("ERROR UPDATE ANIMAL General: " . $e->getMessage());
            error_log("ERROR UPDATE ANIMAL General Stack: " . $e->getTraceAsString());
            http_response_code(500);
            echo json_encode([
                'error' => 'Error inesperado',
                'message' => $e->getMessage()
            ]);
            exit;
        }
    }
    
    // Endpoint: DELETE /api/animales/{id} - Eliminar animal
    if (preg_match('#^/api/animales/(\d+)/?$#', $path, $matches) && $method === 'DELETE') {
        $id = $matches[1];
        
        error_log("DEBUG DELETE ANIMAL - ID: $id");
        
        try {
            // Obtener ruta de la foto antes de eliminar
            $stmtFoto = $pdo->prepare('SELECT foto_url FROM ANIMAL WHERE id_animal = :id');
            $stmtFoto->execute([':id' => $id]);
            $animal = $stmtFoto->fetch();
            
            $stmt = $pdo->prepare('DELETE FROM ANIMAL WHERE id_animal = :id');
            $stmt->execute([':id' => $id]);
            
            if ($stmt->rowCount() > 0) {
                // Eliminar archivo de foto si existe
                if (!empty($animal['FOTO_URL'])) {
                    eliminarImagenArchivo($animal['FOTO_URL']);
                }
                
                http_response_code(200);
                echo json_encode(['success' => true, 'message' => 'Animal eliminado exitosamente']);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Animal no encontrado']);
            }
            exit;
        } catch (PDOException $e) {
            error_log("ERROR DELETE ANIMAL: " . $e->getMessage());
            
            // Si hay error de constraint (registros relacionados)
            if (strpos($e->getMessage(), 'integrity constraint') !== false) {
                http_response_code(409);
                echo json_encode(['error' => 'No se puede eliminar el animal porque tiene registros asociados (pesajes, salud, reproducción, etc.)']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al eliminar el animal: ' . $e->getMessage()]);
            }
            exit;
        }
    }
    
    // Endpoint: GET /api/usuarios
    if (preg_match('#^/api/usuarios/?$#', $path) && $_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->query('SELECT id_usuario, nombre_completo, email, rol, estado FROM USUARIO');
        $usuarios = $stmt->fetchAll();
        
        $usuarios = array_map(function($usuario) {
            $usuario = array_map(function($valor) {
                return is_string($valor) ? utf8_encode($valor) : $valor;
            }, $usuario);
            return array_change_key_case($usuario, CASE_LOWER);
        }, $usuarios);
        
        echo json_encode(['data' => $usuarios], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Endpoint: POST /api/auth/register - Registro de usuarios
    if (preg_match('#^/api/auth/register/?$#', $path) && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // DEBUG: Ver qué datos llegan
        error_log("DEBUG REGISTRO - Datos recibidos: " . json_encode($input));
        error_log("DEBUG REGISTRO - Rol recibido: " . ($input['rol'] ?? 'NO ENVIADO'));
        
        if (!$input || !isset($input['email']) || !isset($input['password']) || !isset($input['nombre_completo'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Datos incompletos. Se requiere: email, password, nombre_completo']);
            exit;
        }
        
        // Validar email único
        $stmt = $pdo->prepare('SELECT COUNT(*) as total FROM USUARIO WHERE email = :email');
        $stmt->execute([':email' => $input['email']]);
        $result = $stmt->fetch();
        
        if ($result['TOTAL'] > 0) {
            http_response_code(409);
            echo json_encode(['error' => 'El email ya está registrado']);
            exit;
        }
        
        // Insertar usuario
        $stmt = $pdo->prepare('
            INSERT INTO USUARIO (nombre_completo, email, password_hash, rol, estado) 
            VALUES (:nombre, :email, :password, :rol, :estado)
        ');
        
        $passwordHash = password_hash($input['password'], PASSWORD_BCRYPT);
        
        // Validar que el rol sea válido
        $rolValido = in_array($input['rol'] ?? '', ['administrador_granja', 'pasante']) 
            ? $input['rol'] 
            : 'pasante';
        
        $stmt->execute([
            ':nombre' => $input['nombre_completo'],
            ':email' => $input['email'],
            ':password' => $passwordHash,
            ':rol' => $rolValido,
            ':estado' => 'activo'
        ]);
        
        // Obtener ID del usuario recién creado
        $stmt2 = $pdo->prepare('SELECT id_usuario FROM USUARIO WHERE email = :email');
        $stmt2->execute([':email' => $input['email']]);
        $newUser = $stmt2->fetch();
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Usuario registrado exitosamente',
            'user' => [
                'id' => $newUser['ID_USUARIO'],
                'email' => $input['email'],
                'nombre_completo' => $input['nombre_completo'],
                'rol' => $rolValido
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Endpoint: POST /api/auth/login - Login de usuarios
    if (preg_match('#^/api/auth/login/?$#', $path) && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['email']) || !isset($input['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Datos incompletos. Se requiere: email, password']);
            exit;
        }
        
        $stmt = $pdo->prepare('SELECT * FROM USUARIO WHERE email = :email AND estado = :estado');
        $stmt->execute([':email' => $input['email'], ':estado' => 'activo']);
        $usuario = $stmt->fetch();
        
        if (!$usuario || !password_verify($input['password'], $usuario['PASSWORD_HASH'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Credenciales inválidas']);
            exit;
        }
        
        // Generar token simple (en producción usar JWT)
        $token = bin2hex(random_bytes(32));
        
        echo json_encode([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $usuario['ID_USUARIO'],
                'email' => utf8_encode($usuario['EMAIL']),
                'nombre_completo' => utf8_encode($usuario['NOMBRE_COMPLETO']),
                'rol' => utf8_encode($usuario['ROL'])
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Endpoint: GET /api/me - Obtener datos del usuario autenticado
    if ($path === '/api/me' || $path === '/api/me/') {
        // Por ahora, sin validación de token real
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        
        if (empty($authHeader)) {
            http_response_code(401);
            echo json_encode(['error' => 'Token no proporcionado']);
            exit;
        }
        
        // Extraer token
        $token = str_replace('Bearer ', '', $authHeader);
        
        // Por simplicidad, devolver datos de ejemplo (en producción validar token JWT)
        echo json_encode([
            'id' => 1,
            'email' => 'usuario@example.com',
            'nombre_completo' => 'Usuario Ejemplo',
            'rol' => 'pasante'
        ]);
        exit;
    }
    
    // Endpoint no encontrado
    http_response_code(404);
    echo json_encode([
        'error' => 'Endpoint no encontrado',
        'method' => $method,
        'original_method' => $_SERVER['REQUEST_METHOD'],
        'path' => $path,
        'available_endpoints' => [
            'GET /api/health',
            'GET /api/razas',
            'GET /api/animales',
            'POST /api/animales',
            'PUT /api/animales/{id}',
            'DELETE /api/animales/{id}',
            'POST /api/auth/register',
            'POST /api/auth/login',
            'GET /api/me'
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Error de base de datos',
        'message' => $e->getMessage()
    ]);
}
