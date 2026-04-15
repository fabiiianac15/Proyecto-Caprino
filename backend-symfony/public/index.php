<?php
// Redirigir a api.php para pruebas temporales - v1.2
// Una vez que composer install funcione, restaurar el código Symfony original

error_log("INDEX.PHP: REQUEST_URI = " . ($_SERVER['REQUEST_URI'] ?? 'undefined'));

// Si es una ruta API, usar api.php temporal
if (strpos($_SERVER['REQUEST_URI'], '/api') === 0) {
    error_log("INDEX.PHP: Redirigiendo a api.php");
    require __DIR__ . '/api.php';
    exit;
}

// Para otras rutas, mostrar mensaje
?>
<!DOCTYPE html>
<html>
<head>
    <title>Sistema Caprino - Backend Temporal</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .status { padding: 10px; background: #e3f2fd; border-left: 4px solid #2196f3; margin: 20px 0; }
        .warning { padding: 10px; background: #fff3e0; border-left: 4px solid #ff9800; margin: 20px 0; }
        code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>🐐 Sistema de Gestión Zootécnica Caprina</h1>
    
    <div class="status">
        <strong>✅ Backend PHP funcionando</strong><br>
        Servidor: <?= $_SERVER['SERVER_SOFTWARE'] ?? 'PHP' ?><br>
        PHP Version: <?= phpversion() ?>
    </div>
    
    <div class="warning">
        <strong>⚠️ Modo Temporal</strong><br>
        Las dependencias de Symfony no están completamente instaladas.<br>
        Ejecuta: <code>composer install</code> para el sistema completo.
    </div>
    
    <h2>API Endpoints Disponibles:</h2>
    <ul>
        <li><a href="/api/health">/api/health</a> - Estado del sistema</li>
        <li><a href="/api/razas">/api/razas</a> - Lista de razas</li>
        <li><a href="/api/animales">/api/animales</a> - Lista de animales</li>
        <li><a href="/api/usuarios">/api/usuarios</a> - Lista de usuarios</li>
    </ul>
    
    <h2>Base de Datos:</h2>
    <p>
        <?php
        // Establecer variables de entorno Oracle explícitamente
        putenv('NLS_LANG=AMERICAN_AMERICA.AL32UTF8');
        if (!getenv('ORACLE_HOME')) {
            putenv('ORACLE_HOME=C:\\app\\jesus\\product\\21c\\dbhomexe');
        }
        if (!getenv('TNS_ADMIN')) {
            putenv('TNS_ADMIN=C:\\app\\jesus\\product\\21c\\dbhomexe\\network\\admin');
        }
        
        try {
            $conn = @oci_connect('C##caprino', 'CaprinoPass2025', '127.0.0.1:1521/XEPDB1');
            if ($conn) {
                $stid = oci_parse($conn, "SELECT COUNT(*) as cnt FROM tab");
                oci_execute($stid);
                $row = oci_fetch_assoc($stid);
                oci_close($conn);
                echo '✅ <strong>Conectado a Oracle</strong> (' . $row['CNT'] . ' tablas)';
            } else {
                $e = oci_error();
                echo '❌ <strong>Error: ' . htmlspecialchars($e['message'] ?? 'Unknown error') . '</strong>';
            }
        } catch (Exception $e) {
            echo '❌ <strong>Error: ' . htmlspecialchars($e->getMessage()) . '</strong>';
        }
        ?>
    </p>
</body>
</html>
