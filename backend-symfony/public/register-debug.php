<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');
header('Content-Type: application/json');

try {
    $pdo = new PDO('oci:dbname=//192.168.101.20:1521/XEPDB1', 'caprino_user', 'CaprinoPass2025', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_STRINGIFY_FETCHES => true
    ]);
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        echo json_encode(['error' => 'No JSON input']);
        exit;
    }
    
    if (!isset($input['email'])) {
        echo json_encode(['error' => 'Missing email']);
        exit;
    }
    
    // Verificar email único
    $stmt = $pdo->prepare('SELECT COUNT(*) as total FROM USUARIO WHERE email = :email');
    $stmt->execute([':email' => $input['email']]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result['TOTAL'] > 0) {
        echo json_encode(['error' => 'Email exists', 'total' => $result['TOTAL']]);
        exit;
    }
    
    // Hash password
    $hash = password_hash($input['password'], PASSWORD_BCRYPT);
    
    // Insert
    $stmt = $pdo->prepare('
        INSERT INTO USUARIO (nombre_completo, email, password_hash, rol, estado) 
        VALUES (:nombre, :email, :password, :rol, :estado)
    ');
    
    $result = $stmt->execute([
        ':nombre' => $input['nombre_completo'],
        ':email' => $input['email'],
        ':password' => $hash,
        ':rol' => 'usuario',
        ':estado' => 'activo'
    ]);
    
    echo json_encode(['success' => true, 'result' => $result]);
    
} catch (Exception $e) {
    echo json_encode([
        'error' => $e->getMessage(),
        'code' => $e->getCode(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
