<?php
// Script para insertar razas de cabra por defecto

// Incluir configuración de Oracle
require_once 'C:\\php\\oracle-env.php';

// Conectar a la base de datos
$conn = oci_connect('C##caprino', 'CaprinoPass2025', '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=localhost)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=XEPDB1)))');
if (!$conn) {
    $e = oci_error();
    http_response_code(500);
    echo json_encode(['error' => 'Cannot connect to database', 'message' => $e['message']]);
    exit;
}

// Razas de cabra comunes
$razas = [
    ['nombre' => 'Boer', 'descripcion' => 'Raza Boer - Excelente para carne, reconocida mundialmente'],
    ['nombre' => 'Saanen', 'descripcion' => 'Raza Saanen - Alta producción lechera, origen suizo'],
    ['nombre' => 'Alpine', 'descripcion' => 'Raza Alpine - Buena producción lechera, rústica'],
    ['nombre' => 'Criolla', 'descripcion' => 'Raza Criolla - Adaptada a climas cálidos, resistente'],
    ['nombre' => 'Nubia', 'descripcion' => 'Raza Nubia - Buena producción lechera, carne y cuero'],
    ['nombre' => 'Toggenburg', 'descripcion' => 'Raza Toggenburg - Buena lechera, origen suizo']
];

$insertados = 0;
$errores = [];

foreach ($razas as $raza) {
    // Verificar si la raza ya existe
    $sql_check = "SELECT COUNT(*) as cnt FROM RAZA WHERE NOMBRE_RAZA = :nombre";
    $stmt_check = oci_parse($conn, $sql_check);
    oci_bind_by_name($stmt_check, ':nombre', $raza['nombre']);
    oci_execute($stmt_check);
    $row = oci_fetch_assoc($stmt_check);
    oci_free_statement($stmt_check);
    
    if ($row['CNT'] > 0) {
        continue; // La raza ya existe, saltar
    }
    
    // Insertar nueva raza
    $sql = "INSERT INTO RAZA (NOMBRE_RAZA, DESCRIPCION) VALUES (:nombre, :descripcion)";
    $stmt = oci_parse($conn, $sql);
    
    if (!$stmt) {
        $errores[] = "Parse error para raza: " . $raza['nombre'];
        continue;
    }
    
    oci_bind_by_name($stmt, ':nombre', $raza['nombre']);
    oci_bind_by_name($stmt, ':descripcion', $raza['descripcion']);
    
    if (oci_execute($stmt, OCI_COMMIT_ON_SUCCESS)) {
        $insertados++;
    } else {
        $e = oci_error($stmt);
        $errores[] = "Error inserting {$raza['nombre']}: " . $e['message'];
    }
    
    oci_free_statement($stmt);
}

// Obtener todas las razas insertadas
$sql_all = "SELECT ID_RAZA, NOMBRE_RAZA, DESCRIPCION FROM RAZA ORDER BY ID_RAZA";
$stmt_all = oci_parse($conn, $sql_all);
oci_execute($stmt_all);

$razas_list = [];
while ($row = oci_fetch_assoc($stmt_all)) {
    $razas_list[] = $row;
}
oci_free_statement($stmt_all);

oci_close($conn);

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => "Se insertaron $insertados razas de cabra",
    'errores' => $errores,
    'razas_totales' => $razas_list
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
?>
