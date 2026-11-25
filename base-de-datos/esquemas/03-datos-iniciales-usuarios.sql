-- ==================================================================
-- Usuarios iniciales del sistema
-- Hashes generados con PHP: password_hash(<password>, PASSWORD_BCRYPT)
-- ==================================================================

-- Administrador
INSERT INTO USUARIO (nombre_completo, email, password_hash, rol, telefono, estado)
VALUES ('Administrador del Sistema', 'admin@caprino.com',
        '$2y$10$mGyIvY98GC2jFD7EZcftKOqirQjUBsxPCgQ9oGgNDtC.mtHd5wxLq',
        'administrador', NULL, 'activo');

-- Zootecnista
INSERT INTO USUARIO (nombre_completo, email, password_hash, rol, telefono, estado)
VALUES ('María González Pérez', 'zootecnista@caprino.com',
        '$2y$10$nkGYlv.8f.eb1yEBUBda/OAMJAzI5gv6b/idw32hmvslicCoIjyCO',
        'zootecnista', NULL, 'activo');

-- Técnico
INSERT INTO USUARIO (nombre_completo, email, password_hash, rol, telefono, estado)
VALUES ('Juan Martínez Sánchez', 'tecnico@caprino.com',
        '$2y$10$VHnnRqNuJmxJ94LQGipis./GOhIOjOy8kQ7rrFUlyllvs4NtxGCCG',
        'tecnico', NULL, 'activo');

-- Veterinario
INSERT INTO USUARIO (nombre_completo, email, password_hash, rol, telefono, estado)
VALUES ('Dra. Ana Patricia Torres', 'veterinario@caprino.com',
        '$2y$10$3pa4dKKst5v1zBcdDEigoOTofLAY1bW34jGzDOj5lL2zAG1pkR.vu',
        'veterinario', NULL, 'activo');

COMMIT;

-- Verificar
SELECT id_usuario, email, rol, estado FROM USUARIO ORDER BY id_usuario;

/*
Las contraseñas iniciales se entregan aparte al administrador del sistema
y deben cambiarse en el primer ingreso (Perfil > Cambiar contraseña).
*/
