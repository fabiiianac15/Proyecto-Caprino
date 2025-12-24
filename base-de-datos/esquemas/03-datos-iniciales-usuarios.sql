-- ==================================================================
-- Script de Datos Iniciales - Usuarios del Sistema
-- Descripción: Carga de usuarios base para testing y producción inicial
-- Nota: Los passwords están hasheados con bcrypt (costo 13)
-- ==================================================================

-- ==================================================================
-- USUARIOS ADMINISTRATIVOS
-- ==================================================================

-- Usuario: Administrador del Sistema
-- Email: admin@caprino.com
-- Password: Admin123!
-- Hash generado con: password_hash('Admin123!', PASSWORD_BCRYPT, ['cost' => 13])
INSERT INTO USUARIO (nombre_completo, email, password_hash, rol, telefono, estado)
VALUES (
    'Administrador del Sistema',
    'admin@caprino.com',
    '$2y$13$9p5EKvXmJ8qT4nR2wY.L3OuVqF8xH7sK9mN1vP6cQ2rT5jU8wZ3yC',
    'administrador',
    '+52 999 123 4567',
    'activo'
);

-- ==================================================================
-- USUARIOS ZOOTECNISTAS
-- ==================================================================

-- Usuario: Zootecnista Principal
-- Email: zootecnista@caprino.com
-- Password: Zoot123!
INSERT INTO USUARIO (nombre_completo, email, password_hash, rol, telefono, estado)
VALUES (
    'María González Pérez',
    'zootecnista@caprino.com',
    '$2y$13$8n4DJuWlI7pS3mQ1xX.K2NtUoE7wG6rJ8lM0uO5bP1qS4iT7vY2xB',
    'zootecnista',
    '+52 999 234 5678',
    'activo'
);

-- Usuario: Zootecnista de Campo
-- Email: campo@caprino.com
-- Password: Campo123!
INSERT INTO USUARIO (nombre_completo, email, password_hash, rol, telefono, estado)
VALUES (
    'Carlos Ramírez López',
    'campo@caprino.com',
    '$2y$13$7m3CItVkH6oR2lP0wW.J1MsToD6vF5qI7kL9tN4aO0pR3hS6uX1zA',
    'zootecnista',
    '+52 999 345 6789',
    'activo'
);

-- ==================================================================
-- USUARIOS TÉCNICOS
-- ==================================================================

-- Usuario: Técnico de Apoyo
-- Email: tecnico@caprino.com
-- Password: Tecnico123!
INSERT INTO USUARIO (nombre_completo, email, password_hash, rol, telefono, estado)
VALUES (
    'Juan Martínez Sánchez',
    'tecnico@caprino.com',
    '$2y$13$6l2BHsUjG5nQ1kO9vV.I0LrSnC5uE4pH6jK8sM3zN9oQ2gR5tW0yZ',
    'tecnico',
    '+52 999 456 7890',
    'activo'
);

-- ==================================================================
-- USUARIOS VETERINARIOS
-- ==================================================================

-- Usuario: Veterinario
-- Email: veterinario@caprino.com
-- Password: Vet123!
INSERT INTO USUARIO (nombre_completo, email, password_hash, rol, telefono, estado)
VALUES (
    'Dra. Ana Patricia Torres',
    'veterinario@caprino.com',
    '$2y$13$5k1AGrTiF4mP0jN8uU.H9KqRmB4tD3oG5iJ7rL2yM8nP1fQ4sV9xY',
    'veterinario',
    '+52 999 567 8901',
    'activo'
);

COMMIT;

-- ==================================================================
-- Verificación de datos insertados
-- ==================================================================

-- Listar todos los usuarios creados
SELECT 
    id_usuario,
    nombre_completo,
    email,
    rol,
    telefono,
    estado,
    TO_CHAR(fecha_creacion, 'DD/MM/YYYY HH24:MI:SS') AS fecha_creacion
FROM USUARIO
ORDER BY id_usuario;

-- Contar usuarios por rol
SELECT 
    rol,
    COUNT(*) AS cantidad,
    COUNT(CASE WHEN estado = 'activo' THEN 1 END) AS activos
FROM USUARIO
GROUP BY rol
ORDER BY rol;

-- ==================================================================
-- CREDENCIALES PARA TESTING
-- ==================================================================

-- IMPORTANTE: Estos usuarios son solo para desarrollo/testing
-- En producción, cambiar todos los passwords y eliminar este comentario

/*
CREDENCIALES DE ACCESO:

Administrador:
  Email: admin@caprino.com
  Password: Admin123!
  Permisos: Acceso total al sistema

Zootecnista Principal:
  Email: zootecnista@caprino.com
  Password: Zoot123!
  Permisos: Lectura total, escritura en datos operativos

Zootecnista de Campo:
  Email: campo@caprino.com
  Password: Campo123!
  Permisos: Lectura total, escritura en datos operativos

Técnico:
  Email: tecnico@caprino.com
  Password: Tecnico123!
  Permisos: Solo lectura

Veterinario:
  Email: veterinario@caprino.com
  Password: Vet123!
  Permisos: Lectura total, escritura en módulo de salud
*/

-- ==================================================================
-- NOTAS DE SEGURIDAD
-- ==================================================================

/*
1. Cambiar todos los passwords antes de ir a producción
2. Implementar política de cambio de password cada 90 días
3. Los hashes mostrados son ejemplos, generar nuevos con la función real
4. Considerar autenticación de dos factores para administradores
5. Auditar accesos de usuarios administrativos
6. Deshabilitar usuarios que no se utilicen por más de 90 días
*/

-- ==================================================================
-- FIN DEL SCRIPT
-- ==================================================================
