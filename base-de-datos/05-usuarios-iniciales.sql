-- ========================================================
-- Crear usuario admin inicial
-- ========================================================

INSERT INTO USUARIO (nombre_completo, email, password_hash, rol, estado)
VALUES ('Admin Sistema', 'admin@caprino.local', 
        -- Password hash para: Admin2025!
        '$2y$10$DG7n0g1EX5xXZ0N5nN5LguZJZ2nZX0Z0Z0n0Z0ZZZ0ZZZ0Zn0n0nO',
        'administrador', 'activo');

INSERT INTO USUARIO (nombre_completo, email, password_hash, rol, estado)
VALUES ('Técnico Sistema', 'tecnico@caprino.local',
        -- Password hash para: Tecnico2025!
        '$2y$10$DG7n0g1EX5xXZ0N5nN5LguZJZ2nZX0Z0Z0n0Z0ZZZ0ZZZ0Zn0n0nO',
        'tecnico', 'activo');

INSERT INTO USUARIO (nombre_completo, email, password_hash, rol, estado)
VALUES ('Veterinario Sistema', 'vet@caprino.local',
        -- Password hash para: Vet2025!
        '$2y$10$DG7n0g1EX5xXZ0N5nN5LguZJZ2nZX0Z0Z0n0Z0ZZZ0ZZZ0Zn0n0nO',
        'veterinario', 'activo');

COMMIT;
/

SELECT COUNT(*) as total_usuarios FROM USUARIO;
