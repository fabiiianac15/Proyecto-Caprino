<?php
// Endpoint de debugging para test de registro
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

// NLS_LANG CRITICAL
putenv('NLS_LANG=AMERICAN_AMERICA.AL32UTF8');

error_log("[DEBUG-REGISTER] Request Method: " . $_SERVER['REQUEST_METHOD']);

$body = file_get_contents('php://input');
error_log("[DEBUG-REGISTER] Raw Body: " . $body);

$data = json_decode($body, true);
error_log("[DEBUG-REGISTER] Parsed Data: " . json_encode($data));

if (empty($body)) {
    echo json_encode(['error' => 'Empty body', 'success' => false]);
    exit;
}

$nombre = $data['nombre_completo'] ?? $data['nombre'] ?? null;
$email = $data['email'] ?? null;
$password = $data['password'] ?? null;
$rol = $data['rol'] ?? 'tecnico';

error_log("[DEBUG-REGISTER] Extracted - nombre: $nombre, email: $email, password_provided: " . (!empty($password) ? 'yes' : 'no') . ", rol: $rol");

if (!$nombre || !$email || !$password) {
    error_log("[DEBUG-REGISTER] Validation failed");
    echo json_encode([
        'error' => 'Nombre, email y password requeridos',
        'success' => false,
        'provided' => [
            'nombre' => !empty($nombre),
            'email' => !empty($email),
            'password' => !empty($password)
        ]
    ]);
    exit;
}

// Try connecting to DB
try {
    putenv('NLS_LANG=AMERICAN_AMERICA.AL32UTF8');
    $tns = "127.0.0.1:1521/XEPDB1";
    $conn = @oci_connect('C##caprino', 'CaprinoPass2025', $tns);
    
    if (!$conn) {
        $e = oci_error();
        error_log("[DEBUG-REGISTER] DB Connection Error: " . json_encode($e));
        echo json_encode(['error' => 'DB Connection Error', 'details' => $e['message'], 'success' => false]);
        exit;
    }
    
    error_log("[DEBUG-REGISTER] DB Connected");
    
    // Check if email exists
    $sql_check = "SELECT ID_USUARIO FROM USUARIO WHERE EMAIL = :email";
    $stmt_check = oci_parse($conn, $sql_check);
    oci_bind_by_name($stmt_check, ':email', $email);
    
    if (!oci_execute($stmt_check)) {
        $e = oci_error($stmt_check);
        error_log("[DEBUG-REGISTER] Check Error: " . json_encode($e));
        echo json_encode(['error' => 'Check Error', 'details' => $e['message'], 'success' => false]);
        oci_close($conn);
        exit;
    }
    
    $existente = oci_fetch_assoc($stmt_check);
    oci_free_statement($stmt_check);
    
    error_log("[DEBUG-REGISTER] Email exists: " . ($existente ? 'yes' : 'no'));
    
    if ($existente) {
        echo json_encode(['error' => 'El email ya está registrado', 'success' => false]);
        oci_close($conn);
        exit;
    }
    
    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    
    // Insert user
    $sql = "INSERT INTO USUARIO (nombre_completo, email, password_hash, rol, estado, fecha_creacion)
            VALUES (:nombre, :email, :password, :rol, 'activo', SYSDATE)";
    
    $stmt = oci_parse($conn, $sql);
    oci_bind_by_name($stmt, ':nombre', $nombre);
    oci_bind_by_name($stmt, ':email', $email);
    oci_bind_by_name($stmt, ':password', $hashedPassword);
    oci_bind_by_name($stmt, ':rol', $rol);
    
    if (!oci_execute($stmt, OCI_COMMIT_ON_SUCCESS)) {
        $e = oci_error($stmt);
        error_log("[DEBUG-REGISTER] Insert Error: " . json_encode($e));
        echo json_encode(['error' => 'Insert Error', 'details' => $e['message'], 'success' => false]);
        oci_free_statement($stmt);
        oci_close($conn);
        exit;
    }
    
    oci_free_statement($stmt);
    
    error_log("[DEBUG-REGISTER] User inserted successfully");
    
    echo json_encode([
        'success' => true,
        'message' => 'Usuario registrado correctamente',
        'user' => [
            'id' => 1,
            'nombre' => $nombre,
            'email' => $email,
            'rol' => $rol
        ]
    ], JSON_UNESCAPED_UNICODE);
    
    oci_close($conn);
    
} catch (Exception $e) {
    error_log("[DEBUG-REGISTER] Exception: " . $e->getMessage());
    echo json_encode(['error' => 'Exception: ' . $e->getMessage(), 'success' => false]);
}
?>
