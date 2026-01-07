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
        try {
            $pdo = new PDO('oci:dbname=//192.168.101.20:1521/XEPDB1', 'caprino_user', 'CaprinoPass2025');
            echo '✅ <strong>Conectado a Oracle</strong>';
        } catch (Exception $e) {
            echo '❌ <strong>Error: ' . htmlspecialchars($e->getMessage()) . '</strong>';
        }
        ?>
    </p>
</body>
</html>
