<?php
// API Sistema Caprino v3.0 - OCI8 (Oracle)
// Correcciones: JWT desde env, INSERT con IDENTITY, endpoints completos

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

ini_set('display_errors', '0');
error_reporting(E_ALL);

putenv('NLS_LANG=AMERICAN_AMERICA.AL32UTF8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ── Cargar .env ──────────────────────────────────────────────────────────────
$envFile = __DIR__ . '/../.env';
$env = [];
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) $env[trim($parts[0])] = trim($parts[1]);
    }
}

$dbHost     = $env['DATABASE_HOST']         ?? '127.0.0.1';
$dbPort     = $env['DATABASE_PORT']         ?? '1521';
$dbName     = $env['DATABASE_NAME']         ?? 'XEPDB1';
$dbUser     = $env['DATABASE_USER']         ?? 'caprino_user';
$dbPass     = $env['DATABASE_PASSWORD']     ?? 'CaprinoPass2025';
$walletPath = $env['DATABASE_WALLET_PATH']  ?? null;
$tnsName    = $env['DATABASE_TNS_NAME']     ?? null;
$jwtSecret  = $env['JWT_SECRET']            ?? 'caprino_jwt_secret_2025';

// ── Helpers JWT ──────────────────────────────────────────────────────────────
function b64url($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}
function b64urlDecode($data) {
    return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
}
function generarJWT(array $payload, string $secret): string {
    $h = b64url(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $p = b64url(json_encode($payload));
    $s = b64url(hash_hmac('sha256', "$h.$p", $secret, true));
    return "$h.$p.$s";
}
function verificarJWT(string $token, string $secret): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$h, $p, $s] = $parts;
    $expected = b64url(hash_hmac('sha256', "$h.$p", $secret, true));
    if (!hash_equals($expected, $s)) return null;
    $data = json_decode(b64urlDecode($p), true);
    if (!$data || (isset($data['exp']) && $data['exp'] < time())) return null;
    return $data;
}
function extraerUserId(string $jwtSecret): int {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(.+)/i', $auth, $m)) {
        $payload = verificarJWT(trim($m[1]), $jwtSecret);
        return $payload ? (int)($payload['id'] ?? 0) : 0;
    }
    return 0;
}

$conn = null;

try {
    // ── Conexión Oracle ──────────────────────────────────────────────────────
    if ($walletPath && $tnsName) {
        putenv("TNS_ADMIN={$walletPath}");
        $tns = $tnsName;
    } else {
        $tns = "{$dbHost}:{$dbPort}/{$dbName}";
    }

    if (!extension_loaded('oci8')) {
        http_response_code(500);
        echo json_encode(['error' => 'OCI8 no está instalado. Ver requisitos en README.']);
        exit;
    }

    $conn = @oci_connect($dbUser, $dbPass, $tns, 'AL32UTF8');
    if (!$conn) {
        $e = oci_error();
        throw new Exception('No se puede conectar a la BD: ' . ($e['message'] ?? 'Error desconocido'));
    }

    // ── Parsear request ──────────────────────────────────────────────────────
    $path   = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $method = $_SERVER['REQUEST_METHOD'];
    $raw    = file_get_contents('php://input');
    $data   = [];
    if (in_array($method, ['POST', 'PUT', 'PATCH']) && $raw) {
        $data = json_decode($raw, true) ?? [];
    }

    // ════════════════════════════════════════════════════════════════════════
    // HEALTH CHECK
    // ════════════════════════════════════════════════════════════════════════
    if (preg_match('#^/api/health/?$#', $path)) {
        echo json_encode(['status' => 'ok', 'database' => 'connected', 'timestamp' => date('Y-m-d H:i:s')]);
        exit;
    }

    // ════════════════════════════════════════════════════════════════════════
    // GET /api/me — Verificar token y devolver datos del usuario actual
    // ════════════════════════════════════════════════════════════════════════
    if (preg_match('#^/api/me/?$#', $path) && $method === 'GET') {
        $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!preg_match('/Bearer\s+(.+)/i', $auth, $m)) {
            http_response_code(401);
            echo json_encode(['error' => 'Token requerido']);
            exit;
        }
        $payload = verificarJWT(trim($m[1]), $jwtSecret);
        if (!$payload) {
            http_response_code(401);
            echo json_encode(['error' => 'Token inválido o expirado']);
            exit;
        }
        $stmt = oci_parse($conn, "SELECT id_usuario, nombre_completo, email, rol FROM USUARIO WHERE id_usuario = :id AND estado = 'activo'");
        oci_bind_by_name($stmt, ':id', $payload['id']);
        oci_execute($stmt);
        $u = oci_fetch_assoc($stmt);
        oci_free_statement($stmt);
        if (!$u) {
            http_response_code(401);
            echo json_encode(['error' => 'Usuario no encontrado o inactivo']);
            exit;
        }
        echo json_encode([
            'id'     => (int)$u['ID_USUARIO'],
            'nombre' => $u['NOMBRE_COMPLETO'],
            'email'  => $u['EMAIL'],
            'rol'    => $u['ROL'],
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ════════════════════════════════════════════════════════════════════════
    // AUTH — REGISTRO
    // ════════════════════════════════════════════════════════════════════════
    if (preg_match('#^/api/auth/register/?$#', $path) && $method === 'POST') {
        $nombre   = $data['nombre_completo'] ?? $data['nombre'] ?? null;
        $email    = $data['email']    ?? null;
        $password = $data['password'] ?? null;
        $rol      = $data['rol']      ?? 'tecnico';

        if (!$nombre || !$email || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'Campos requeridos: nombre_completo, email, password']);
            exit;
        }
        if (strlen($password) < 8) {
            http_response_code(400);
            echo json_encode(['error' => 'La contraseña debe tener al menos 8 caracteres']);
            exit;
        }
        $mapaRoles = ['administrador_granja' => 'administrador', 'pasante' => 'pasante'];
        $rol = $mapaRoles[$rol] ?? $rol;
        if (!in_array($rol, ['administrador', 'pasante', 'zootecnista', 'tecnico', 'veterinario'])) {
            $rol = 'tecnico';
        }

        // Verificar email duplicado
        $stmt = oci_parse($conn, "SELECT COUNT(*) as CNT FROM USUARIO WHERE EMAIL = :email");
        oci_bind_by_name($stmt, ':email', $email);
        oci_execute($stmt);
        $row = oci_fetch_assoc($stmt);
        oci_free_statement($stmt);
        if ((int)$row['CNT'] > 0) {
            http_response_code(409);
            echo json_encode(['error' => 'El email ya está registrado']);
            exit;
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);

        // IDENTITY genera id_usuario automáticamente — NO incluir en INSERT
        $stmt = oci_parse($conn,
            "INSERT INTO USUARIO (nombre_completo, email, password_hash, rol, estado)
             VALUES (:nombre, :email, :hash, :rol, 'activo')"
        );
        oci_bind_by_name($stmt, ':nombre', $nombre);
        oci_bind_by_name($stmt, ':email',  $email);
        oci_bind_by_name($stmt, ':hash',   $hash);
        oci_bind_by_name($stmt, ':rol',    $rol);

        if (!oci_execute($stmt, OCI_COMMIT_ON_SUCCESS)) {
            $e = oci_error($stmt);
            oci_free_statement($stmt);
            http_response_code(500);
            echo json_encode(['error' => 'Error al registrar: ' . $e['message']]);
            exit;
        }
        oci_free_statement($stmt);

        // Obtener ID del nuevo usuario
        $stmt = oci_parse($conn, "SELECT id_usuario FROM USUARIO WHERE email = :email");
        oci_bind_by_name($stmt, ':email', $email);
        oci_execute($stmt);
        $row = oci_fetch_assoc($stmt);
        oci_free_statement($stmt);
        $userId = (int)($row['ID_USUARIO'] ?? 0);

        $token = generarJWT([
            'id'    => $userId,
            'email' => $email,
            'rol'   => $rol,
            'iat'   => time(),
            'exp'   => time() + 86400,
        ], $jwtSecret);

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Usuario registrado correctamente',
            'token'   => $token,
            'user'    => ['id' => $userId, 'nombre' => $nombre, 'email' => $email, 'rol' => $rol],
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ════════════════════════════════════════════════════════════════════════
    // AUTH — LOGIN
    // ════════════════════════════════════════════════════════════════════════
    if (preg_match('#^/api/auth/login/?$#', $path) && $method === 'POST') {
        $email    = $data['email']    ?? null;
        $password = $data['password'] ?? null;

        if (!$email || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'Campos requeridos: email, password']);
            exit;
        }

        $stmt = oci_parse($conn, "SELECT * FROM USUARIO WHERE EMAIL = :email AND ESTADO = 'activo'");
        oci_bind_by_name($stmt, ':email', $email);
        oci_execute($stmt);
        $u = oci_fetch_assoc($stmt);
        oci_free_statement($stmt);

        if (!$u || !password_verify($password, $u['PASSWORD_HASH'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Credenciales inválidas']);
            exit;
        }

        // Actualizar último acceso
        $stmt = oci_parse($conn, "UPDATE USUARIO SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id_usuario = :id");
        $uid = (int)$u['ID_USUARIO'];
        oci_bind_by_name($stmt, ':id', $uid);
        oci_execute($stmt, OCI_COMMIT_ON_SUCCESS);
        oci_free_statement($stmt);

        $token = generarJWT([
            'id'    => $uid,
            'email' => $u['EMAIL'],
            'rol'   => $u['ROL'],
            'iat'   => time(),
            'exp'   => time() + 86400,
        ], $jwtSecret);

        echo json_encode([
            'success' => true,
            'message' => 'Login exitoso',
            'token'   => $token,
            'user'    => [
                'id'     => $uid,
                'nombre' => $u['NOMBRE_COMPLETO'],
                'email'  => $u['EMAIL'],
                'rol'    => $u['ROL'],
            ],
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ════════════════════════════════════════════════════════════════════════
    // RAZAS
    // ════════════════════════════════════════════════════════════════════════
    if (preg_match('#^/api/razas/?$#', $path) && $method === 'GET') {
        $stmt = oci_parse($conn, "SELECT id_raza, nombre_raza, origen, caracteristicas, aptitud, estado FROM RAZA WHERE estado = 'activo' ORDER BY nombre_raza");
        oci_execute($stmt);
        $rows = [];
        while ($row = oci_fetch_assoc($stmt)) {
            $rows[] = [
                'id_raza'       => (int)$row['ID_RAZA'],
                'nombre_raza'   => $row['NOMBRE_RAZA'],
                'origen'        => $row['ORIGEN'],
                'caracteristicas'=> $row['CARACTERISTICAS'],
                'aptitud'       => $row['APTITUD'],
            ];
        }
        oci_free_statement($stmt);
        echo json_encode(['data' => $rows], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ════════════════════════════════════════════════════════════════════════
    // ANIMALES
    // ════════════════════════════════════════════════════════════════════════
    // GET /api/animales
    if (preg_match('#^/api/animales/?$#', $path) && $method === 'GET') {
        $sexo   = $_GET['sexo']   ?? null;
        $estado = $_GET['estado'] ?? null;
        $sql    = "SELECT a.id_animal, a.codigo_identificacion, a.nombre, a.fecha_nacimiento,
                          a.sexo, a.id_raza, r.nombre_raza, a.color_pelaje,
                          a.peso_nacimiento_kg, a.estado, a.observaciones, a.foto_url
                   FROM ANIMAL a LEFT JOIN RAZA r ON a.id_raza = r.id_raza
                   WHERE 1=1";
        if ($sexo)   $sql .= " AND a.sexo = '" . str_replace("'", "", $sexo) . "'";
        if ($estado) $sql .= " AND a.estado = '" . str_replace("'", "", $estado) . "'";
        $sql .= " ORDER BY a.codigo_identificacion";
        $stmt = oci_parse($conn, $sql);
        oci_execute($stmt);
        $rows = [];
        while ($row = oci_fetch_assoc($stmt)) {
            $rows[] = [
                'id'             => (int)$row['ID_ANIMAL'],
                'codigo'         => $row['CODIGO_IDENTIFICACION'],
                'nombre'         => $row['NOMBRE'],
                'fechaNacimiento'=> $row['FECHA_NACIMIENTO'],
                'sexo'           => $row['SEXO'],
                'idRaza'         => (int)$row['ID_RAZA'],
                'nombreRaza'     => $row['NOMBRE_RAZA'],
                'colorPelaje'    => $row['COLOR_PELAJE'],
                'pesoNacimiento' => $row['PESO_NACIMIENTO_KG'] ? (float)$row['PESO_NACIMIENTO_KG'] : null,
                'estado'         => $row['ESTADO'],
                'observaciones'  => $row['OBSERVACIONES'],
                'fotoUrl'        => $row['FOTO_URL'],
            ];
        }
        oci_free_statement($stmt);
        echo json_encode(['data' => $rows], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // GET /api/animales/{id}
    if (preg_match('#^/api/animales/(\d+)/?$#', $path, $m) && $method === 'GET') {
        $id   = (int)$m[1];
        $stmt = oci_parse($conn, "SELECT a.*, r.nombre_raza FROM ANIMAL a LEFT JOIN RAZA r ON a.id_raza = r.id_raza WHERE a.id_animal = :id");
        oci_bind_by_name($stmt, ':id', $id);
        oci_execute($stmt);
        $row = oci_fetch_assoc($stmt);
        oci_free_statement($stmt);
        if (!$row) { http_response_code(404); echo json_encode(['error' => 'Animal no encontrado']); exit; }
        echo json_encode(['data' => [
            'id'             => (int)$row['ID_ANIMAL'],
            'codigo'         => $row['CODIGO_IDENTIFICACION'],
            'nombre'         => $row['NOMBRE'],
            'fechaNacimiento'=> $row['FECHA_NACIMIENTO'],
            'sexo'           => $row['SEXO'],
            'idRaza'         => (int)$row['ID_RAZA'],
            'nombreRaza'     => $row['NOMBRE_RAZA'],
            'colorPelaje'    => $row['COLOR_PELAJE'],
            'pesoNacimiento' => $row['PESO_NACIMIENTO_KG'] ? (float)$row['PESO_NACIMIENTO_KG'] : null,
            'estado'         => $row['ESTADO'],
            'observaciones'  => $row['OBSERVACIONES'],
            'fotoUrl'        => $row['FOTO_URL'],
        ]], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // POST /api/animales
    if (preg_match('#^/api/animales/?$#', $path) && $method === 'POST') {
        $codigo      = $data['codigo'] ?? $data['codigo_identificacion'] ?? null;
        $nombre      = $data['nombre'] ?? null;
        $sexo        = $data['sexo']   ?? null;
        $idRaza      = $data['idRaza'] ?? $data['id_raza'] ?? null;
        $fechaNac    = $data['fechaNacimiento'] ?? $data['fecha_nacimiento'] ?? date('Y-m-d');
        $color       = $data['colorPelaje'] ?? $data['color_pelaje'] ?? null;
        $pesoNac     = $data['pesoNacimiento'] ?? $data['peso_nacimiento_kg'] ?? null;
        $obs         = $data['observaciones'] ?? null;
        $usuarioReg  = extraerUserId($jwtSecret) ?: 1;

        if (!$codigo || !$sexo || !$idRaza) {
            http_response_code(400);
            echo json_encode(['error' => 'Campos requeridos: codigo, sexo, idRaza']);
            exit;
        }
        if (!in_array($sexo, ['macho', 'hembra'])) {
            http_response_code(400);
            echo json_encode(['error' => "sexo debe ser 'macho' o 'hembra'"]);
            exit;
        }

        $stmt = oci_parse($conn,
            "INSERT INTO ANIMAL (codigo_identificacion, nombre, fecha_nacimiento, sexo, id_raza, color_pelaje, peso_nacimiento_kg, estado, observaciones, usuario_registro)
             VALUES (:codigo, :nombre, TO_DATE(:fec,'YYYY-MM-DD'), :sexo, :raza, :color, :peso, 'activo', :obs, :ureg)"
        );
        oci_bind_by_name($stmt, ':codigo', $codigo);
        oci_bind_by_name($stmt, ':nombre', $nombre);
        oci_bind_by_name($stmt, ':fec',    $fechaNac);
        oci_bind_by_name($stmt, ':sexo',   $sexo);
        oci_bind_by_name($stmt, ':raza',   $idRaza);
        oci_bind_by_name($stmt, ':color',  $color);
        oci_bind_by_name($stmt, ':peso',   $pesoNac);
        oci_bind_by_name($stmt, ':obs',    $obs);
        oci_bind_by_name($stmt, ':ureg',   $usuarioReg);

        if (!oci_execute($stmt, OCI_COMMIT_ON_SUCCESS)) {
            $e = oci_error($stmt);
            oci_free_statement($stmt);
            http_response_code(500);
            echo json_encode(['error' => 'Error al crear animal: ' . $e['message']]);
            exit;
        }
        oci_free_statement($stmt);

        $stmt2 = oci_parse($conn, "SELECT id_animal FROM ANIMAL WHERE codigo_identificacion = :c");
        oci_bind_by_name($stmt2, ':c', $codigo);
        oci_execute($stmt2);
        $r = oci_fetch_assoc($stmt2);
        oci_free_statement($stmt2);

        http_response_code(201);
        echo json_encode(['success' => true, 'message' => 'Animal creado correctamente',
            'data' => ['id' => (int)($r['ID_ANIMAL'] ?? 0), 'codigo' => $codigo, 'nombre' => $nombre]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // PUT /api/animales/{id}
    if (preg_match('#^/api/animales/(\d+)/?$#', $path, $m) && $method === 'PUT') {
        $id     = (int)$m[1];
        $nombre = $data['nombre'] ?? null;
        $sexo   = $data['sexo']   ?? null;
        $idRaza = $data['idRaza'] ?? $data['id_raza'] ?? null;
        $color  = $data['colorPelaje'] ?? $data['color_pelaje'] ?? null;
        $estado = $data['estado'] ?? null;
        $obs    = $data['observaciones'] ?? null;

        $stmt = oci_parse($conn,
            "UPDATE ANIMAL SET
               nombre       = NVL(:nombre, nombre),
               sexo         = NVL(:sexo, sexo),
               id_raza      = NVL(:raza, id_raza),
               color_pelaje = NVL(:color, color_pelaje),
               estado       = NVL(:estado, estado),
               observaciones= NVL(:obs, observaciones)
             WHERE id_animal = :id"
        );
        oci_bind_by_name($stmt, ':nombre', $nombre);
        oci_bind_by_name($stmt, ':sexo',   $sexo);
        oci_bind_by_name($stmt, ':raza',   $idRaza);
        oci_bind_by_name($stmt, ':color',  $color);
        oci_bind_by_name($stmt, ':estado', $estado);
        oci_bind_by_name($stmt, ':obs',    $obs);
        oci_bind_by_name($stmt, ':id',     $id);
        oci_execute($stmt, OCI_COMMIT_ON_SUCCESS);
        oci_free_statement($stmt);
        echo json_encode(['success' => true, 'message' => 'Animal actualizado'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // DELETE /api/animales/{id} — marcado como inactivo, no borrado físico
    if (preg_match('#^/api/animales/(\d+)/?$#', $path, $m) && $method === 'DELETE') {
        $id   = (int)$m[1];
        $stmt = oci_parse($conn, "UPDATE ANIMAL SET estado = 'muerto', fecha_cambio_estado = CURRENT_TIMESTAMP WHERE id_animal = :id");
        oci_bind_by_name($stmt, ':id', $id);
        oci_execute($stmt, OCI_COMMIT_ON_SUCCESS);
        oci_free_statement($stmt);
        echo json_encode(['success' => true, 'message' => 'Animal dado de baja'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ════════════════════════════════════════════════════════════════════════
    // PRODUCCIÓN DE LECHE
    // ════════════════════════════════════════════════════════════════════════
    // GET /api/produccion
    if (preg_match('#^/api/produccion/?$#', $path) && $method === 'GET') {
        $animalId = $_GET['animal'] ?? null;
        $sql = "SELECT p.id_produccion, p.id_animal, a.nombre as nombre_animal,
                       a.codigo_identificacion, p.fecha_produccion, p.litros,
                       p.turno, p.numero_lactancia, p.dias_lactancia,
                       p.grasa_porcentaje, p.observaciones
                FROM PRODUCCION_LECHE p JOIN ANIMAL a ON p.id_animal = a.id_animal";
        if ($animalId) $sql .= " WHERE p.id_animal = " . (int)$animalId;
        $sql .= " ORDER BY p.fecha_produccion DESC";
        $stmt = oci_parse($conn, $sql);
        oci_execute($stmt);
        $rows = [];
        while ($row = oci_fetch_assoc($stmt)) {
            $rows[] = [
                'id'              => (int)$row['ID_PRODUCCION'],
                'idAnimal'        => (int)$row['ID_ANIMAL'],
                'nombreAnimal'    => $row['NOMBRE_ANIMAL'],
                'codigoAnimal'    => $row['CODIGO_IDENTIFICACION'],
                'fechaProduccion' => $row['FECHA_PRODUCCION'],
                'litros'          => (float)$row['LITROS'],
                'turno'           => $row['TURNO'],
                'numeroLactancia' => $row['NUMERO_LACTANCIA'] ? (int)$row['NUMERO_LACTANCIA'] : null,
                'diasLactancia'   => $row['DIAS_LACTANCIA'] ? (int)$row['DIAS_LACTANCIA'] : null,
                'grasaPorcentaje' => $row['GRASA_PORCENTAJE'] ? (float)$row['GRASA_PORCENTAJE'] : null,
                'observaciones'   => $row['OBSERVACIONES'],
            ];
        }
        oci_free_statement($stmt);
        echo json_encode(['data' => $rows], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // POST /api/produccion
    if (preg_match('#^/api/produccion/?$#', $path) && $method === 'POST') {
        $idAnimal  = $data['idAnimal'] ?? null;
        $fecha     = $data['fechaProduccion'] ?? date('Y-m-d');
        $litros    = $data['litros'] ?? null;
        $turno     = $data['turno'] ?? 'total_dia';
        $numLact   = $data['numeroLactancia'] ?? null;
        $diasLact  = $data['diasLactancia'] ?? null;
        $grasa     = $data['grasaPorcentaje'] ?? null;
        $obs       = $data['observaciones'] ?? null;
        $uReg      = extraerUserId($jwtSecret) ?: 1;

        if (!$idAnimal || $litros === null) {
            http_response_code(400);
            echo json_encode(['error' => 'Campos requeridos: idAnimal, litros']);
            exit;
        }
        // Normalizar turno al valor que acepta el CHECK constraint
        $turnosValidos = ['mañana', 'manana', 'tarde', 'noche', 'total_dia'];
        if (!in_array($turno, $turnosValidos)) $turno = 'total_dia';
        if ($turno === 'manana') $turno = 'mañana';

        $stmt = oci_parse($conn,
            "INSERT INTO PRODUCCION_LECHE (id_animal, fecha_produccion, litros, turno, numero_lactancia, dias_lactancia, grasa_porcentaje, observaciones, usuario_registro)
             VALUES (:id, TO_DATE(:f,'YYYY-MM-DD'), :l, :t, :nl, :dl, :gr, :obs, :ur)"
        );
        oci_bind_by_name($stmt, ':id',  $idAnimal);
        oci_bind_by_name($stmt, ':f',   $fecha);
        oci_bind_by_name($stmt, ':l',   $litros);
        oci_bind_by_name($stmt, ':t',   $turno);
        oci_bind_by_name($stmt, ':nl',  $numLact);
        oci_bind_by_name($stmt, ':dl',  $diasLact);
        oci_bind_by_name($stmt, ':gr',  $grasa);
        oci_bind_by_name($stmt, ':obs', $obs);
        oci_bind_by_name($stmt, ':ur',  $uReg);

        if (!oci_execute($stmt, OCI_COMMIT_ON_SUCCESS)) {
            $e = oci_error($stmt);
            oci_free_statement($stmt);
            http_response_code(500);
            echo json_encode(['error' => 'Error al registrar producción: ' . $e['message']]);
            exit;
        }
        oci_free_statement($stmt);
        http_response_code(201);
        echo json_encode(['success' => true, 'message' => 'Producción registrada'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // DELETE /api/produccion/{id}
    if (preg_match('#^/api/produccion/(\d+)/?$#', $path, $m) && $method === 'DELETE') {
        $id   = (int)$m[1];
        $stmt = oci_parse($conn, "DELETE FROM PRODUCCION_LECHE WHERE id_produccion = :id");
        oci_bind_by_name($stmt, ':id', $id);
        oci_execute($stmt, OCI_COMMIT_ON_SUCCESS);
        oci_free_statement($stmt);
        echo json_encode(['success' => true, 'message' => 'Registro de producción eliminado'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ════════════════════════════════════════════════════════════════════════
    // SALUD Y VACUNAS
    // ════════════════════════════════════════════════════════════════════════
    // GET /api/salud
    if (preg_match('#^/api/salud/?$#', $path) && $method === 'GET') {
        $animalId = $_GET['animal'] ?? null;
        $sql = "SELECT s.id_registro, s.id_animal, a.nombre as nombre_animal,
                       a.codigo_identificacion, s.tipo_registro, s.fecha_aplicacion,
                       s.enfermedad_diagnostico, s.medicamento_producto, s.dosis,
                       s.via_administracion, s.veterinario, s.fecha_proxima_aplicacion,
                       s.dias_retiro_leche, s.observaciones
                FROM SALUD s JOIN ANIMAL a ON s.id_animal = a.id_animal";
        if ($animalId) $sql .= " WHERE s.id_animal = " . (int)$animalId;
        $sql .= " ORDER BY s.fecha_aplicacion DESC";
        $stmt = oci_parse($conn, $sql);
        oci_execute($stmt);
        $rows = [];
        while ($row = oci_fetch_assoc($stmt)) {
            $rows[] = [
                'id'                   => (int)$row['ID_REGISTRO'],
                'idAnimal'             => (int)$row['ID_ANIMAL'],
                'nombreAnimal'         => $row['NOMBRE_ANIMAL'],
                'codigoAnimal'         => $row['CODIGO_IDENTIFICACION'],
                'tipoRegistro'         => $row['TIPO_REGISTRO'],
                'fechaAplicacion'      => $row['FECHA_APLICACION'],
                'enfermedadDiagnostico'=> $row['ENFERMEDAD_DIAGNOSTICO'],
                'medicamentoProducto'  => $row['MEDICAMENTO_PRODUCTO'],
                'dosis'                => $row['DOSIS'],
                'viaAdministracion'    => $row['VIA_ADMINISTRACION'],
                'veterinario'          => $row['VETERINARIO'],
                'fechaProximaAplicacion'=> $row['FECHA_PROXIMA_APLICACION'],
                'diasRetiroLeche'      => $row['DIAS_RETIRO_LECHE'] ? (int)$row['DIAS_RETIRO_LECHE'] : null,
                'observaciones'        => $row['OBSERVACIONES'],
            ];
        }
        oci_free_statement($stmt);
        echo json_encode(['data' => $rows], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // POST /api/salud
    if (preg_match('#^/api/salud/?$#', $path) && $method === 'POST') {
        $idAnimal   = $data['idAnimal']    ?? null;
        $tipo       = $data['tipoRegistro'] ?? $data['tipo_registro'] ?? null;
        $fecha      = $data['fechaAplicacion'] ?? $data['fecha_aplicacion'] ?? date('Y-m-d');
        $enfermedad = $data['enfermedadDiagnostico'] ?? null;
        $medicamento= $data['medicamentoProducto'] ?? null;
        $dosis      = $data['dosis']       ?? null;
        $via        = $data['viaAdministracion'] ?? null;
        $lote       = $data['loteProducto'] ?? null;
        $fechaProx  = $data['fechaProximaAplicacion'] ?? null;
        $diasLeche  = $data['diasRetiroLeche'] ?? null;
        $diasCarne  = $data['diasRetiroCarne'] ?? null;
        $vet        = $data['veterinario'] ?? null;
        $obs        = $data['observaciones'] ?? null;
        $uReg       = extraerUserId($jwtSecret) ?: 1;

        if (!$idAnimal || !$tipo) {
            http_response_code(400);
            echo json_encode(['error' => 'Campos requeridos: idAnimal, tipoRegistro']);
            exit;
        }
        $tiposValidos = ['vacuna', 'tratamiento', 'diagnostico', 'cirugia', 'desparasitacion'];
        if (!in_array($tipo, $tiposValidos)) {
            http_response_code(400);
            echo json_encode(['error' => 'tipoRegistro inválido. Valores: ' . implode(', ', $tiposValidos)]);
            exit;
        }

        $stmt = oci_parse($conn,
            "INSERT INTO SALUD (id_animal, tipo_registro, fecha_aplicacion, enfermedad_diagnostico,
               medicamento_producto, dosis, via_administracion, lote_producto,
               fecha_proxima_aplicacion, dias_retiro_leche, dias_retiro_carne,
               veterinario, observaciones, usuario_registro)
             VALUES (:id, :tipo, TO_DATE(:f,'YYYY-MM-DD'), :enf, :med, :dos, :via, :lote,
               CASE WHEN :fp IS NOT NULL THEN TO_DATE(:fp2,'YYYY-MM-DD') ELSE NULL END,
               :dl, :dc, :vet, :obs, :ur)"
        );
        oci_bind_by_name($stmt, ':id',   $idAnimal);
        oci_bind_by_name($stmt, ':tipo', $tipo);
        oci_bind_by_name($stmt, ':f',    $fecha);
        oci_bind_by_name($stmt, ':enf',  $enfermedad);
        oci_bind_by_name($stmt, ':med',  $medicamento);
        oci_bind_by_name($stmt, ':dos',  $dosis);
        oci_bind_by_name($stmt, ':via',  $via);
        oci_bind_by_name($stmt, ':lote', $lote);
        oci_bind_by_name($stmt, ':fp',   $fechaProx);
        oci_bind_by_name($stmt, ':fp2',  $fechaProx);
        oci_bind_by_name($stmt, ':dl',   $diasLeche);
        oci_bind_by_name($stmt, ':dc',   $diasCarne);
        oci_bind_by_name($stmt, ':vet',  $vet);
        oci_bind_by_name($stmt, ':obs',  $obs);
        oci_bind_by_name($stmt, ':ur',   $uReg);

        if (!oci_execute($stmt, OCI_COMMIT_ON_SUCCESS)) {
            $e = oci_error($stmt);
            oci_free_statement($stmt);
            http_response_code(500);
            echo json_encode(['error' => 'Error al registrar evento de salud: ' . $e['message']]);
            exit;
        }
        oci_free_statement($stmt);
        http_response_code(201);
        echo json_encode(['success' => true, 'message' => 'Evento de salud registrado'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // DELETE /api/salud/{id}
    if (preg_match('#^/api/salud/(\d+)/?$#', $path, $m) && $method === 'DELETE') {
        $id   = (int)$m[1];
        $stmt = oci_parse($conn, "DELETE FROM SALUD WHERE id_registro = :id");
        oci_bind_by_name($stmt, ':id', $id);
        oci_execute($stmt, OCI_COMMIT_ON_SUCCESS);
        oci_free_statement($stmt);
        echo json_encode(['success' => true, 'message' => 'Registro de salud eliminado'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ════════════════════════════════════════════════════════════════════════
    // REPRODUCCIÓN
    // ════════════════════════════════════════════════════════════════════════
    // GET /api/reproduccion
    if (preg_match('#^/api/reproduccion/?$#', $path) && $method === 'GET') {
        $sql = "SELECT r.id_reproduccion, r.id_hembra, r.id_macho,
                       h.nombre as nombre_hembra, h.codigo_identificacion as codigo_hembra,
                       m.nombre as nombre_macho,  m.codigo_identificacion as codigo_macho,
                       r.tipo_servicio, r.fecha_servicio, r.fecha_parto_estimada,
                       r.fecha_parto_real, r.tipo_parto, r.numero_crias,
                       r.resultado, r.dificultad_parto, r.observaciones
                FROM REPRODUCCION r
                JOIN ANIMAL h ON r.id_hembra = h.id_animal
                LEFT JOIN ANIMAL m ON r.id_macho = m.id_animal
                ORDER BY r.fecha_servicio DESC";
        $stmt = oci_parse($conn, $sql);
        oci_execute($stmt);
        $rows = [];
        while ($row = oci_fetch_assoc($stmt)) {
            $rows[] = [
                'id'                => (int)$row['ID_REPRODUCCION'],
                'idHembra'          => (int)$row['ID_HEMBRA'],
                'nombreHembra'      => $row['NOMBRE_HEMBRA'],
                'codigoHembra'      => $row['CODIGO_HEMBRA'],
                'idMacho'           => $row['ID_MACHO'] ? (int)$row['ID_MACHO'] : null,
                'nombreMacho'       => $row['NOMBRE_MACHO'],
                'tipoServicio'      => $row['TIPO_SERVICIO'],
                'fechaServicio'     => $row['FECHA_SERVICIO'],
                'fechaPartoEstimada'=> $row['FECHA_PARTO_ESTIMADA'],
                'fechaPartoReal'    => $row['FECHA_PARTO_REAL'],
                'tipoParto'         => $row['TIPO_PARTO'],
                'numeroCrias'       => $row['NUMERO_CRIAS'] ? (int)$row['NUMERO_CRIAS'] : null,
                'resultado'         => $row['RESULTADO'],
                'dificultadParto'   => $row['DIFICULTAD_PARTO'],
                'observaciones'     => $row['OBSERVACIONES'],
            ];
        }
        oci_free_statement($stmt);
        echo json_encode(['data' => $rows], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // POST /api/reproduccion
    if (preg_match('#^/api/reproduccion/?$#', $path) && $method === 'POST') {
        $idHembra     = $data['idHembra']    ?? null;
        $idMacho      = $data['idMacho']     ?? null;
        $tipoServicio = $data['tipoServicio'] ?? 'monta_natural';
        $fechaServicio= $data['fechaServicio'] ?? date('Y-m-d');
        $obs          = $data['observaciones'] ?? null;
        $uReg         = extraerUserId($jwtSecret) ?: 1;

        if (!$idHembra) {
            http_response_code(400);
            echo json_encode(['error' => 'Campo requerido: idHembra']);
            exit;
        }
        $tiposValidos = ['monta_natural', 'inseminacion_artificial', 'transferencia_embrion'];
        if (!in_array($tipoServicio, $tiposValidos)) $tipoServicio = 'monta_natural';

        // El trigger trg_calcular_fecha_parto calculará fecha_parto_estimada
        $stmt = oci_parse($conn,
            "INSERT INTO REPRODUCCION (id_hembra, id_macho, tipo_servicio, fecha_servicio, resultado, observaciones, usuario_registro)
             VALUES (:h, :m, :ts, TO_DATE(:f,'YYYY-MM-DD'), 'pendiente', :obs, :ur)"
        );
        oci_bind_by_name($stmt, ':h',   $idHembra);
        oci_bind_by_name($stmt, ':m',   $idMacho);
        oci_bind_by_name($stmt, ':ts',  $tipoServicio);
        oci_bind_by_name($stmt, ':f',   $fechaServicio);
        oci_bind_by_name($stmt, ':obs', $obs);
        oci_bind_by_name($stmt, ':ur',  $uReg);

        if (!oci_execute($stmt, OCI_COMMIT_ON_SUCCESS)) {
            $e = oci_error($stmt);
            oci_free_statement($stmt);
            http_response_code(500);
            echo json_encode(['error' => 'Error al registrar reproducción: ' . $e['message']]);
            exit;
        }
        oci_free_statement($stmt);
        http_response_code(201);
        echo json_encode(['success' => true, 'message' => 'Reproducción registrada'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // PUT /api/reproduccion/{id} — Registrar resultado del parto
    if (preg_match('#^/api/reproduccion/(\d+)/?$#', $path, $m) && $method === 'PUT') {
        $id          = (int)$m[1];
        $resultado   = $data['resultado']     ?? null;
        $numeroCrias = $data['numeroCrias']   ?? null;
        $tipoParto   = $data['tipoParto']     ?? null;
        $fechaReal   = $data['fechaPartoReal'] ?? null;
        $dificultad  = $data['dificultadParto'] ?? null;
        $obs         = $data['observaciones'] ?? null;

        $stmt = oci_parse($conn,
            "UPDATE REPRODUCCION SET
               resultado      = NVL(:res, resultado),
               numero_crias   = NVL(:nc, numero_crias),
               tipo_parto     = NVL(:tp, tipo_parto),
               fecha_parto_real = CASE WHEN :fr IS NOT NULL THEN TO_DATE(:fr2,'YYYY-MM-DD') ELSE fecha_parto_real END,
               dificultad_parto = NVL(:dif, dificultad_parto),
               observaciones  = NVL(:obs, observaciones)
             WHERE id_reproduccion = :id"
        );
        oci_bind_by_name($stmt, ':res', $resultado);
        oci_bind_by_name($stmt, ':nc',  $numeroCrias);
        oci_bind_by_name($stmt, ':tp',  $tipoParto);
        oci_bind_by_name($stmt, ':fr',  $fechaReal);
        oci_bind_by_name($stmt, ':fr2', $fechaReal);
        oci_bind_by_name($stmt, ':dif', $dificultad);
        oci_bind_by_name($stmt, ':obs', $obs);
        oci_bind_by_name($stmt, ':id',  $id);
        oci_execute($stmt, OCI_COMMIT_ON_SUCCESS);
        oci_free_statement($stmt);
        echo json_encode(['success' => true, 'message' => 'Reproducción actualizada'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ════════════════════════════════════════════════════════════════════════
    // PESAJE
    // ════════════════════════════════════════════════════════════════════════
    // GET /api/pesaje
    if (preg_match('#^/api/pesaje/?$#', $path) && $method === 'GET') {
        $animalId = $_GET['animal'] ?? null;
        $sql = "SELECT p.id_pesaje, p.id_animal, a.nombre as nombre_animal,
                       a.codigo_identificacion, p.fecha_pesaje, p.peso_kg,
                       p.edad_dias, p.ganancia_diaria_kg, p.condicion_corporal,
                       p.metodo_pesaje, p.observaciones
                FROM PESAJE p JOIN ANIMAL a ON p.id_animal = a.id_animal";
        if ($animalId) $sql .= " WHERE p.id_animal = " . (int)$animalId;
        $sql .= " ORDER BY p.fecha_pesaje DESC";
        $stmt = oci_parse($conn, $sql);
        oci_execute($stmt);
        $rows = [];
        while ($row = oci_fetch_assoc($stmt)) {
            $rows[] = [
                'id'              => (int)$row['ID_PESAJE'],
                'idAnimal'        => (int)$row['ID_ANIMAL'],
                'nombreAnimal'    => $row['NOMBRE_ANIMAL'],
                'codigoAnimal'    => $row['CODIGO_IDENTIFICACION'],
                'fechaPesaje'     => $row['FECHA_PESAJE'],
                'pesoKg'          => (float)$row['PESO_KG'],
                'edadDias'        => $row['EDAD_DIAS'] ? (int)$row['EDAD_DIAS'] : null,
                'gananciaDiariaKg'=> $row['GANANCIA_DIARIA_KG'] ? (float)$row['GANANCIA_DIARIA_KG'] : null,
                'condicionCorporal'=> $row['CONDICION_CORPORAL'] ? (int)$row['CONDICION_CORPORAL'] : null,
                'metodoPesaje'    => $row['METODO_PESAJE'],
                'observaciones'   => $row['OBSERVACIONES'],
            ];
        }
        oci_free_statement($stmt);
        echo json_encode(['data' => $rows], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // POST /api/pesaje
    if (preg_match('#^/api/pesaje/?$#', $path) && $method === 'POST') {
        $idAnimal   = $data['idAnimal']    ?? null;
        $fecha      = $data['fechaPesaje'] ?? date('Y-m-d');
        $pesoKg     = $data['pesoKg']      ?? null;
        $condicion  = $data['condicionCorporal'] ?? null;
        $metodo     = $data['metodoPesaje'] ?? null;
        $obs        = $data['observaciones'] ?? null;
        $uReg       = extraerUserId($jwtSecret) ?: 1;

        if (!$idAnimal || $pesoKg === null) {
            http_response_code(400);
            echo json_encode(['error' => 'Campos requeridos: idAnimal, pesoKg']);
            exit;
        }

        // Los triggers calculan edad_dias y ganancia_diaria_kg automáticamente
        $stmt = oci_parse($conn,
            "INSERT INTO PESAJE (id_animal, fecha_pesaje, peso_kg, condicion_corporal, metodo_pesaje, observaciones, usuario_registro)
             VALUES (:id, TO_DATE(:f,'YYYY-MM-DD'), :p, :cc, :met, :obs, :ur)"
        );
        oci_bind_by_name($stmt, ':id',  $idAnimal);
        oci_bind_by_name($stmt, ':f',   $fecha);
        oci_bind_by_name($stmt, ':p',   $pesoKg);
        oci_bind_by_name($stmt, ':cc',  $condicion);
        oci_bind_by_name($stmt, ':met', $metodo);
        oci_bind_by_name($stmt, ':obs', $obs);
        oci_bind_by_name($stmt, ':ur',  $uReg);

        if (!oci_execute($stmt, OCI_COMMIT_ON_SUCCESS)) {
            $e = oci_error($stmt);
            oci_free_statement($stmt);
            http_response_code(500);
            echo json_encode(['error' => 'Error al registrar pesaje: ' . $e['message']]);
            exit;
        }
        oci_free_statement($stmt);
        http_response_code(201);
        echo json_encode(['success' => true, 'message' => 'Pesaje registrado'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // DELETE /api/pesaje/{id}
    if (preg_match('#^/api/pesaje/(\d+)/?$#', $path, $m) && $method === 'DELETE') {
        $id   = (int)$m[1];
        $stmt = oci_parse($conn, "DELETE FROM PESAJE WHERE id_pesaje = :id");
        oci_bind_by_name($stmt, ':id', $id);
        oci_execute($stmt, OCI_COMMIT_ON_SUCCESS);
        oci_free_statement($stmt);
        echo json_encode(['success' => true, 'message' => 'Pesaje eliminado'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ════════════════════════════════════════════════════════════════════════
    // GENEALOGÍA
    // ════════════════════════════════════════════════════════════════════════
    // GET /api/genealogia/{id}
    if (preg_match('#^/api/genealogia/(\d+)/?$#', $path, $m) && $method === 'GET') {
        $id   = (int)$m[1];
        $stmt = oci_parse($conn,
            "SELECT g.id_genealogia, g.id_animal, g.id_padre, g.id_madre,
                    g.generacion, g.coeficiente_consanguinidad, g.observaciones,
                    a.nombre as nombre_animal, a.codigo_identificacion,
                    p.nombre as nombre_padre, p.codigo_identificacion as codigo_padre,
                    m.nombre as nombre_madre, m.codigo_identificacion as codigo_madre
             FROM GENEALOGIA g
             JOIN ANIMAL a ON g.id_animal = a.id_animal
             LEFT JOIN ANIMAL p ON g.id_padre = p.id_animal
             LEFT JOIN ANIMAL m ON g.id_madre = m.id_animal
             WHERE g.id_animal = :id"
        );
        oci_bind_by_name($stmt, ':id', $id);
        oci_execute($stmt);
        $row = oci_fetch_assoc($stmt);
        oci_free_statement($stmt);

        if (!$row) {
            // Devolver estructura vacía si no tiene genealogía registrada
            $stmtA = oci_parse($conn, "SELECT nombre, codigo_identificacion FROM ANIMAL WHERE id_animal = :id");
            oci_bind_by_name($stmtA, ':id', $id);
            oci_execute($stmtA);
            $a = oci_fetch_assoc($stmtA);
            oci_free_statement($stmtA);
            echo json_encode(['data' => [
                'animal' => $a ? ['id' => $id, 'nombre' => $a['NOMBRE'], 'codigo' => $a['CODIGO_IDENTIFICACION']] : null,
                'padre' => null,
                'madre' => null,
            ]], JSON_UNESCAPED_UNICODE);
            exit;
        }

        echo json_encode(['data' => [
            'animal' => ['id' => $id, 'nombre' => $row['NOMBRE_ANIMAL'], 'codigo' => $row['CODIGO_IDENTIFICACION']],
            'padre'  => $row['ID_PADRE'] ? ['id' => (int)$row['ID_PADRE'], 'nombre' => $row['NOMBRE_PADRE'], 'codigo' => $row['CODIGO_PADRE']] : null,
            'madre'  => $row['ID_MADRE'] ? ['id' => (int)$row['ID_MADRE'], 'nombre' => $row['NOMBRE_MADRE'], 'codigo' => $row['CODIGO_MADRE']] : null,
            'generacion'                => $row['GENERACION'] ? (int)$row['GENERACION'] : null,
            'coeficienteConsanguinidad' => $row['COEFICIENTE_CONSANGUINIDAD'] ? (float)$row['COEFICIENTE_CONSANGUINIDAD'] : null,
        ]], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // POST /api/genealogia — Asignar padres a un animal
    if (preg_match('#^/api/genealogia/?$#', $path) && $method === 'POST') {
        $idAnimal = $data['idAnimal'] ?? null;
        $idPadre  = $data['idPadre'] ?? null;
        $idMadre  = $data['idMadre'] ?? null;
        $obs      = $data['observaciones'] ?? null;

        if (!$idAnimal) {
            http_response_code(400);
            echo json_encode(['error' => 'Campo requerido: idAnimal']);
            exit;
        }

        // Upsert: actualizar si existe, insertar si no
        $stmtCheck = oci_parse($conn, "SELECT COUNT(*) as CNT FROM GENEALOGIA WHERE id_animal = :id");
        oci_bind_by_name($stmtCheck, ':id', $idAnimal);
        oci_execute($stmtCheck);
        $check = oci_fetch_assoc($stmtCheck);
        oci_free_statement($stmtCheck);

        if ((int)$check['CNT'] > 0) {
            $stmt = oci_parse($conn,
                "UPDATE GENEALOGIA SET id_padre = :p, id_madre = :m, observaciones = NVL(:obs, observaciones) WHERE id_animal = :id"
            );
        } else {
            $stmt = oci_parse($conn,
                "INSERT INTO GENEALOGIA (id_animal, id_padre, id_madre, observaciones) VALUES (:id, :p, :m, :obs)"
            );
        }
        oci_bind_by_name($stmt, ':id',  $idAnimal);
        oci_bind_by_name($stmt, ':p',   $idPadre);
        oci_bind_by_name($stmt, ':m',   $idMadre);
        oci_bind_by_name($stmt, ':obs', $obs);
        oci_execute($stmt, OCI_COMMIT_ON_SUCCESS);
        oci_free_statement($stmt);
        echo json_encode(['success' => true, 'message' => 'Genealogía actualizada'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ════════════════════════════════════════════════════════════════════════
    // NOTIFICACIONES — generadas dinámicamente desde las tablas
    // ════════════════════════════════════════════════════════════════════════
    if (preg_match('#^/api/notificaciones/?$#', $path) && $method === 'GET') {
        $alertas = [];

        // Vacunas próximas (15 días)
        $sql = "SELECT 'vacuna' as tipo,
                       'Vacuna próxima' as titulo,
                       'El animal ' || a.nombre || ' (' || a.codigo_identificacion || ') tiene aplicación programada para el ' ||
                       TO_CHAR(s.fecha_proxima_aplicacion,'DD/MM/YYYY') as mensaje,
                       TO_CHAR(s.fecha_proxima_aplicacion,'YYYY-MM-DD') as fecha_alerta,
                       a.id_animal, 'media' as urgencia
                FROM SALUD s JOIN ANIMAL a ON s.id_animal = a.id_animal
                WHERE s.fecha_proxima_aplicacion BETWEEN SYSDATE AND SYSDATE + 15
                ORDER BY s.fecha_proxima_aplicacion";
        $stmt = oci_parse($conn, $sql);
        oci_execute($stmt);
        while ($row = oci_fetch_assoc($stmt)) $alertas[] = [
            'tipo'        => $row['TIPO'],
            'titulo'      => $row['TITULO'],
            'mensaje'     => $row['MENSAJE'],
            'fechaAlerta' => $row['FECHA_ALERTA'],
            'idAnimal'    => (int)$row['ID_ANIMAL'],
            'urgencia'    => $row['URGENCIA'],
        ];
        oci_free_statement($stmt);

        // Partos estimados próximos (15 días)
        $sql = "SELECT 'parto' as tipo,
                       'Parto próximo' as titulo,
                       'La cabra ' || a.nombre || ' (' || a.codigo_identificacion || ') tiene parto estimado para el ' ||
                       TO_CHAR(r.fecha_parto_estimada,'DD/MM/YYYY') as mensaje,
                       TO_CHAR(r.fecha_parto_estimada,'YYYY-MM-DD') as fecha_alerta,
                       a.id_animal, 'alta' as urgencia
                FROM REPRODUCCION r JOIN ANIMAL a ON r.id_hembra = a.id_animal
                WHERE r.fecha_parto_estimada BETWEEN SYSDATE AND SYSDATE + 15
                  AND r.resultado = 'pendiente'
                ORDER BY r.fecha_parto_estimada";
        $stmt = oci_parse($conn, $sql);
        oci_execute($stmt);
        while ($row = oci_fetch_assoc($stmt)) $alertas[] = [
            'tipo'        => $row['TIPO'],
            'titulo'      => $row['TITULO'],
            'mensaje'     => $row['MENSAJE'],
            'fechaAlerta' => $row['FECHA_ALERTA'],
            'idAnimal'    => (int)$row['ID_ANIMAL'],
            'urgencia'    => $row['URGENCIA'],
        ];
        oci_free_statement($stmt);

        // Aplicaciones vencidas sin seguimiento
        $sql = "SELECT 'vencido' as tipo,
                       'Aplicación vencida' as titulo,
                       'El animal ' || a.nombre || ' tenía aplicación el ' ||
                       TO_CHAR(s.fecha_proxima_aplicacion,'DD/MM/YYYY') || ' sin registrar' as mensaje,
                       TO_CHAR(s.fecha_proxima_aplicacion,'YYYY-MM-DD') as fecha_alerta,
                       a.id_animal, 'alta' as urgencia
                FROM SALUD s JOIN ANIMAL a ON s.id_animal = a.id_animal
                WHERE s.fecha_proxima_aplicacion < SYSDATE
                  AND NOT EXISTS (
                      SELECT 1 FROM SALUD s2
                      WHERE s2.id_animal = s.id_animal
                        AND s2.fecha_aplicacion >= s.fecha_proxima_aplicacion
                  )
                ORDER BY s.fecha_proxima_aplicacion DESC
                FETCH FIRST 20 ROWS ONLY";
        $stmt = oci_parse($conn, $sql);
        oci_execute($stmt);
        while ($row = oci_fetch_assoc($stmt)) $alertas[] = [
            'tipo'        => $row['TIPO'],
            'titulo'      => $row['TITULO'],
            'mensaje'     => $row['MENSAJE'],
            'fechaAlerta' => $row['FECHA_ALERTA'],
            'idAnimal'    => (int)$row['ID_ANIMAL'],
            'urgencia'    => $row['URGENCIA'],
        ];
        oci_free_statement($stmt);

        echo json_encode(['data' => $alertas, 'total' => count($alertas)], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ════════════════════════════════════════════════════════════════════════
    // REPORTES Y ESTADÍSTICAS
    // ════════════════════════════════════════════════════════════════════════
    if (preg_match('#^/api/reportes/resumen/?$#', $path) && $method === 'GET') {
        $stats = [];

        $stmt = oci_parse($conn, "SELECT COUNT(*) as T FROM ANIMAL WHERE estado = 'activo'");
        oci_execute($stmt); $r = oci_fetch_assoc($stmt); oci_free_statement($stmt);
        $stats['totalAnimales'] = (int)$r['T'];

        $stmt = oci_parse($conn, "SELECT COUNT(*) as T FROM ANIMAL WHERE sexo = 'hembra' AND estado = 'activo'");
        oci_execute($stmt); $r = oci_fetch_assoc($stmt); oci_free_statement($stmt);
        $stats['totalHembras'] = (int)$r['T'];

        $stmt = oci_parse($conn, "SELECT COUNT(*) as T FROM ANIMAL WHERE sexo = 'macho' AND estado = 'activo'");
        oci_execute($stmt); $r = oci_fetch_assoc($stmt); oci_free_statement($stmt);
        $stats['totalMachos'] = (int)$r['T'];

        $stmt = oci_parse($conn,
            "SELECT NVL(SUM(litros),0) as T FROM PRODUCCION_LECHE
             WHERE EXTRACT(MONTH FROM fecha_produccion) = EXTRACT(MONTH FROM SYSDATE)
               AND EXTRACT(YEAR FROM fecha_produccion) = EXTRACT(YEAR FROM SYSDATE)"
        );
        oci_execute($stmt); $r = oci_fetch_assoc($stmt); oci_free_statement($stmt);
        $stats['produccionLitrosMes'] = (float)$r['T'];

        $stmt = oci_parse($conn, "SELECT COUNT(*) as T FROM REPRODUCCION WHERE resultado = 'pendiente'");
        oci_execute($stmt); $r = oci_fetch_assoc($stmt); oci_free_statement($stmt);
        $stats['gestacionesPendientes'] = (int)$r['T'];

        $stmt = oci_parse($conn,
            "SELECT COUNT(*) as T FROM SALUD
             WHERE tipo_registro = 'vacuna'
               AND EXTRACT(MONTH FROM fecha_aplicacion) = EXTRACT(MONTH FROM SYSDATE)"
        );
        oci_execute($stmt); $r = oci_fetch_assoc($stmt); oci_free_statement($stmt);
        $stats['vacunasMes'] = (int)$r['T'];

        $stmt = oci_parse($conn,
            "SELECT COUNT(*) as T FROM SALUD WHERE fecha_proxima_aplicacion BETWEEN SYSDATE AND SYSDATE + 15"
        );
        oci_execute($stmt); $r = oci_fetch_assoc($stmt); oci_free_statement($stmt);
        $stats['alertasPendientes'] = (int)$r['T'];

        echo json_encode(['data' => $stats], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // GET /api/reportes/produccion — Producción por mes (últimos 12 meses)
    if (preg_match('#^/api/reportes/produccion/?$#', $path) && $method === 'GET') {
        $stmt = oci_parse($conn,
            "SELECT TO_CHAR(fecha_produccion,'YYYY-MM') as mes,
                    SUM(litros) as total_litros,
                    COUNT(*) as registros,
                    COUNT(DISTINCT id_animal) as animales
             FROM PRODUCCION_LECHE
             WHERE fecha_produccion >= ADD_MONTHS(SYSDATE, -12)
             GROUP BY TO_CHAR(fecha_produccion,'YYYY-MM')
             ORDER BY mes"
        );
        oci_execute($stmt);
        $rows = [];
        while ($row = oci_fetch_assoc($stmt)) $rows[] = [
            'mes'          => $row['MES'],
            'totalLitros'  => (float)$row['TOTAL_LITROS'],
            'registros'    => (int)$row['REGISTROS'],
            'animales'     => (int)$row['ANIMALES'],
        ];
        oci_free_statement($stmt);
        echo json_encode(['data' => $rows], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ════════════════════════════════════════════════════════════════════════
    // PERFIL DE USUARIO
    // ════════════════════════════════════════════════════════════════════════

    // GET /api/perfil
    if (preg_match('#^/api/perfil/?$#', $path) && $method === 'GET') {
        $userId = extraerUserId($jwtSecret);
        if (!$userId) { http_response_code(401); echo json_encode(['error' => 'No autenticado']); exit; }

        $stmt = oci_parse($conn, "SELECT COUNT(*) AS CNT FROM USUARIO_PERFIL WHERE id_usuario = :id");
        oci_bind_by_name($stmt, ':id', $userId);
        oci_execute($stmt);
        $row = oci_fetch_assoc($stmt);
        oci_free_statement($stmt);
        if ((int)$row['CNT'] === 0) {
            $stmt = oci_parse($conn, "INSERT INTO USUARIO_PERFIL (id_usuario) VALUES (:id)");
            oci_bind_by_name($stmt, ':id', $userId);
            oci_execute($stmt, OCI_COMMIT_ON_SUCCESS);
            oci_free_statement($stmt);
        }

        $stmt = oci_parse($conn,
            "SELECT p.*, u.nombre_completo FROM USUARIO_PERFIL p
             JOIN USUARIO u ON u.id_usuario = p.id_usuario
             WHERE p.id_usuario = :id"
        );
        oci_bind_by_name($stmt, ':id', $userId);
        oci_execute($stmt);
        $p = oci_fetch_assoc($stmt);
        oci_free_statement($stmt);

        echo json_encode([
            'nombre'             => $p['NOMBRE_COMPLETO']    ?? '',
            'telefono'           => $p['TELEFONO']           ?? '',
            'cedula'             => $p['CEDULA']             ?? '',
            'fechaNacimiento'    => $p['FECHA_NACIMIENTO']   ?? '',
            'direccion'          => $p['DIRECCION']          ?? '',
            'ciudad'             => $p['CIUDAD']             ?? '',
            'departamento'       => $p['DEPARTAMENTO']       ?? '',
            'nombreGranja'       => $p['NOMBRE_GRANJA']      ?? 'Granja Experimental UFPSO',
            'tipoProduccion'     => $p['TIPO_PRODUCCION']    ?? 'Leche y Carne',
            'areaTotal'          => $p['AREA_TOTAL']         ?? '',
            'sistemaManejo'      => $p['SISTEMA_MANEJO']     ?? '',
            'capacidadInstalada' => $p['CAPACIDAD_INSTALADA'] !== null ? (string)$p['CAPACIDAD_INSTALADA'] : '',
            'coordenadasGPS'     => $p['COORDENADAS_GPS']    ?? "8\u{00B0}14'20\"N, 73\u{00B0}21'21\"W",
            'altitud'            => $p['ALTITUD']            ?? '1.200 msnm',
            'temperaturaPromedio'=> $p['TEMPERATURA_PROM']   ?? '21°C',
            'precipitacion'      => $p['PRECIPITACION']      ?? '1.400 mm/año',
            'nit'                => $p['NIT']                ?? '',
            'ica'                => $p['REGISTRO_ICA']       ?? '',
            'registroGanadero'   => $p['REGISTRO_GANADERO']  ?? '',
            'licenciaAmbiental'  => $p['LICENCIA_AMBIENTAL'] ?? '',
            'notifReproduccion'  => (bool)(int)($p['NOTIF_REPRODUCCION'] ?? 1),
            'notifSalud'         => (bool)(int)($p['NOTIF_SALUD']        ?? 1),
            'notifProduccion'    => (bool)(int)($p['NOTIF_PRODUCCION']   ?? 1),
            'notifReportes'      => (bool)(int)($p['NOTIF_REPORTES']     ?? 0),
            'notifPush'          => (bool)(int)($p['NOTIF_PUSH']         ?? 1),
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // PUT /api/perfil
    if (preg_match('#^/api/perfil/?$#', $path) && $method === 'PUT') {
        $userId = extraerUserId($jwtSecret);
        if (!$userId) { http_response_code(401); echo json_encode(['error' => 'No autenticado']); exit; }

        if (!empty($data['nombre'])) {
            $nombre = trim($data['nombre']);
            $stmt = oci_parse($conn, "UPDATE USUARIO SET nombre_completo = :nombre WHERE id_usuario = :id");
            oci_bind_by_name($stmt, ':nombre', $nombre);
            oci_bind_by_name($stmt, ':id', $userId);
            oci_execute($stmt, OCI_COMMIT_ON_SUCCESS);
            oci_free_statement($stmt);
        }

        $stmt = oci_parse($conn, "SELECT COUNT(*) AS CNT FROM USUARIO_PERFIL WHERE id_usuario = :id");
        oci_bind_by_name($stmt, ':id', $userId);
        oci_execute($stmt);
        $row = oci_fetch_assoc($stmt);
        oci_free_statement($stmt);
        if ((int)$row['CNT'] === 0) {
            $stmt = oci_parse($conn, "INSERT INTO USUARIO_PERFIL (id_usuario) VALUES (:id)");
            oci_bind_by_name($stmt, ':id', $userId);
            oci_execute($stmt, OCI_COMMIT_ON_SUCCESS);
            oci_free_statement($stmt);
        }

        $mapaCampos = [
            'telefono'            => 'telefono',
            'cedula'              => 'cedula',
            'direccion'           => 'direccion',
            'ciudad'              => 'ciudad',
            'departamento'        => 'departamento',
            'nombre_granja'       => 'nombreGranja',
            'tipo_produccion'     => 'tipoProduccion',
            'area_total'          => 'areaTotal',
            'sistema_manejo'      => 'sistemaManejo',
            'capacidad_instalada' => 'capacidadInstalada',
            'coordenadas_gps'     => 'coordenadasGPS',
            'altitud'             => 'altitud',
            'temperatura_prom'    => 'temperaturaPromedio',
            'precipitacion'       => 'precipitacion',
            'nit'                 => 'nit',
            'registro_ica'        => 'ica',
            'registro_ganadero'   => 'registroGanadero',
            'licencia_ambiental'  => 'licenciaAmbiental',
            'notif_reproduccion'  => 'notifReproduccion',
            'notif_salud'         => 'notifSalud',
            'notif_produccion'    => 'notifProduccion',
            'notif_reportes'      => 'notifReportes',
            'notif_push'          => 'notifPush',
        ];

        $sets   = ["fecha_actualizacion = CURRENT_TIMESTAMP"];
        $params = [];
        foreach ($mapaCampos as $dbField => $frontField) {
            if (array_key_exists($frontField, $data)) {
                $val = $data[$frontField];
                if (is_bool($val)) $val = $val ? 1 : 0;
                $sets[]            = "$dbField = :$dbField";
                $params[$dbField]  = $val;
            }
        }
        if (!empty($data['fechaNacimiento'])) {
            $sets[] = "fecha_nacimiento = TO_DATE(:fecha_nacimiento, 'YYYY-MM-DD')";
            $params['fecha_nacimiento'] = date('Y-m-d', strtotime($data['fechaNacimiento']));
        }

        if (count($sets) > 1) {
            $sql  = "UPDATE USUARIO_PERFIL SET " . implode(', ', $sets) . " WHERE id_usuario = :id";
            $stmt = oci_parse($conn, $sql);
            foreach ($params as $k => $v) {
                oci_bind_by_name($stmt, ":$k", $params[$k]);
            }
            oci_bind_by_name($stmt, ':id', $userId);
            oci_execute($stmt, OCI_COMMIT_ON_SUCCESS);
            oci_free_statement($stmt);
        }

        echo json_encode(['success' => true, 'message' => 'Perfil actualizado correctamente'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // PUT /api/perfil/password
    if (preg_match('#^/api/perfil/password/?$#', $path) && $method === 'PUT') {
        $userId = extraerUserId($jwtSecret);
        if (!$userId) { http_response_code(401); echo json_encode(['error' => 'No autenticado']); exit; }

        $pwActual = $data['password_actual'] ?? '';
        $pwNueva  = $data['password_nueva']  ?? '';
        if (!$pwActual || !$pwNueva) {
            http_response_code(400);
            echo json_encode(['error' => 'Se requieren ambas contraseñas']);
            exit;
        }
        if (strlen($pwNueva) < 8) {
            http_response_code(400);
            echo json_encode(['error' => 'La nueva contraseña debe tener al menos 8 caracteres']);
            exit;
        }

        $stmt = oci_parse($conn, "SELECT password_hash FROM USUARIO WHERE id_usuario = :id");
        oci_bind_by_name($stmt, ':id', $userId);
        oci_execute($stmt);
        $row = oci_fetch_assoc($stmt);
        oci_free_statement($stmt);

        if (!$row || !password_verify($pwActual, $row['PASSWORD_HASH'])) {
            http_response_code(400);
            echo json_encode(['error' => 'La contraseña actual es incorrecta']);
            exit;
        }

        $nuevoHash = password_hash($pwNueva, PASSWORD_BCRYPT);
        $stmt = oci_parse($conn, "UPDATE USUARIO SET password_hash = :hash WHERE id_usuario = :id");
        oci_bind_by_name($stmt, ':hash', $nuevoHash);
        oci_bind_by_name($stmt, ':id', $userId);
        oci_execute($stmt, OCI_COMMIT_ON_SUCCESS);
        oci_free_statement($stmt);

        echo json_encode(['success' => true, 'message' => 'Contraseña actualizada correctamente'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ════════════════════════════════════════════════════════════════════════
    // 404 — Endpoint no encontrado
    // ════════════════════════════════════════════════════════════════════════
    http_response_code(404);
    echo json_encode([
        'error'  => 'Endpoint no encontrado',
        'path'   => $path,
        'method' => $method,
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error interno del servidor', 'message' => $e->getMessage()]);
} finally {
    if ($conn) oci_close($conn);
}
