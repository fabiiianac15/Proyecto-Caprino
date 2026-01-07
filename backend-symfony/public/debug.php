<?php
header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = new PDO('oci:dbname=//192.168.101.20:1521/XEPDB1', 'caprino_user', 'CaprinoPass2025', [
        PDO::ATTR_STRINGIFY_FETCHES => true
    ]);
    $stmt = $pdo->query('SELECT * FROM RAZA ORDER BY NOMBRE_RAZA');
    $razas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Convertir a UTF-8 (ISO-8859-1 a UTF-8)
    $razas = array_map(function($raza) {
        return array_map(function($valor) {
            return is_string($valor) ? utf8_encode($valor) : $valor;
        }, $raza);
    }, $razas);
    
    echo json_encode(['data' => $razas], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

