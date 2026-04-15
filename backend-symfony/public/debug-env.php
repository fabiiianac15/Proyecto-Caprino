<?php
// Diagnosticador de entorno - accesible en /debug-env

header('Content-Type: text/plain; charset=UTF-8');

echo "=== DIAGNOSTICO DE ENTORNO PHP ===\n\n";

echo "PHP Version: " . phpversion() . "\n";
echo "PHP SAPI: " . php_sapi_name() . "\n";
echo "php.ini: " . php_ini_loaded_file() . "\n\n";

echo "=== EXTENSIONES CARGADAS ===\n";
$extensions = get_loaded_extensions();
foreach ($extensions as $ext) {
    if (stripos($ext, 'pdo') !== false || stripos($ext, 'oci') !== false) {
        echo "✓ $ext\n";
    }
}
echo "\n";

echo "=== DRIVERS PDO ===\n";
$pdoDrivers = PDO::getAvailableDrivers();
foreach ($pdoDrivers as $driver) {
    echo "✓ $driver\n";
}
echo "\n";

echo "=== VARIABLES DE ENTORNO IMPORTANTE ===\n";
$importantVars = ['ORACLE_HOME', 'TNS_ADMIN', 'NLS_LANG', 'LD_LIBRARY_PATH', 'LIBPATH'];
foreach ($importantVars as $var) {
    $value = getenv($var);
    echo "$var: " . ($value ?: "(no establecida)") . "\n";
}
echo "\n";

echo "=== PATH (primeros 500 caracteres) ===\n";
$path = getenv('PATH');
echo substr($path, 0, 500) . "\n\n";

echo "=== PRUEBA DE CONEXIÓN ===\n";
try {
    $dsn = "oci:dbname=//127.0.0.1:1521/XEPDB1;charset=UTF8";
    echo "DSN: $dsn\n";
    
    $pdo = new PDO($dsn, "C##caprino", "CaprinoPass2025", [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    
    echo "✓ Conexión exitosa!\n";
    
    $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM tab");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Tablas en la BD: " . $result['cnt'] . "\n";
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    echo "  Código: " . $e->getCode() . "\n";
}
