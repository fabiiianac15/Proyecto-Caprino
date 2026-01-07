-- ==================================================================
-- Script de Verificación de Base de Datos
-- Verifica que todas las tablas, índices y datos estén creados
-- ==================================================================

-- 1. VERIFICAR TABLAS CREADAS
SELECT 'TABLAS CREADAS' AS verificacion FROM DUAL;
SELECT table_name, num_rows 
FROM user_tables 
WHERE table_name IN ('RAZA', 'ANIMAL', 'GENEALOGIA', 'PESAJE', 
                     'PRODUCCION_LECHE', 'REPRODUCCION', 'SALUD', 
                     'USUARIO', 'AUDITORIA', 'USUARIOS')
ORDER BY table_name;

-- 2. VERIFICAR DATOS EN RAZA
SELECT 'DATOS EN RAZA' AS verificacion FROM DUAL;
SELECT COUNT(*) AS total_razas, 
       SUM(CASE WHEN aptitud = 'lechera' THEN 1 ELSE 0 END) AS razas_lecheras,
       SUM(CASE WHEN aptitud = 'carnica' THEN 1 ELSE 0 END) AS razas_carnicas,
       SUM(CASE WHEN aptitud = 'doble_proposito' THEN 1 ELSE 0 END) AS razas_doble_proposito
FROM RAZA;

-- 3. VERIFICAR USUARIOS CREADOS
SELECT 'USUARIOS CREADOS' AS verificacion FROM DUAL;
SELECT COUNT(*) AS total_usuarios,
       SUM(CASE WHEN rol = 'administrador' THEN 1 ELSE 0 END) AS administradores,
       SUM(CASE WHEN rol = 'zootecnista' THEN 1 ELSE 0 END) AS zootecnistas,
       SUM(CASE WHEN rol = 'tecnico' THEN 1 ELSE 0 END) AS tecnicos,
       SUM(CASE WHEN rol = 'veterinario' THEN 1 ELSE 0 END) AS veterinarios
FROM USUARIO;

-- 4. VERIFICAR ÍNDICES
SELECT 'INDICES CREADOS' AS verificacion FROM DUAL;
SELECT index_name, table_name, uniqueness
FROM user_indexes
WHERE table_name IN ('RAZA', 'ANIMAL', 'GENEALOGIA', 'PESAJE', 
                     'PRODUCCION_LECHE', 'REPRODUCCION', 'SALUD', 
                     'USUARIO', 'AUDITORIA')
ORDER BY table_name, index_name;

-- 5. VERIFICAR CONSTRAINTS
SELECT 'CONSTRAINTS CREADOS' AS verificacion FROM DUAL;
SELECT constraint_name, constraint_type, table_name
FROM user_constraints
WHERE table_name IN ('RAZA', 'ANIMAL', 'GENEALOGIA', 'PESAJE', 
                     'PRODUCCION_LECHE', 'REPRODUCCION', 'SALUD', 
                     'USUARIO', 'AUDITORIA')
ORDER BY table_name, constraint_type;

-- 6. VERIFICAR TRIGGERS
SELECT 'TRIGGERS CREADOS' AS verificacion FROM DUAL;
SELECT trigger_name, table_name, status
FROM user_triggers
WHERE table_name IN ('REPRODUCCION', 'PESAJE', 'PRODUCCION_LECHE')
ORDER BY table_name;

-- 7. VERIFICAR VISTAS
SELECT 'VISTAS CREADAS' AS verificacion FROM DUAL;
SELECT view_name 
FROM user_views
WHERE view_name LIKE 'VISTA_%'
ORDER BY view_name;

-- 8. RESUMEN FINAL
SELECT 'RESUMEN FINAL' AS verificacion FROM DUAL;
SELECT 
    (SELECT COUNT(*) FROM user_tables WHERE table_name IN ('RAZA', 'ANIMAL', 'GENEALOGIA', 'PESAJE', 'PRODUCCION_LECHE', 'REPRODUCCION', 'SALUD', 'USUARIO', 'AUDITORIA')) AS tablas_principales,
    (SELECT COUNT(*) FROM RAZA) AS razas_cargadas,
    (SELECT COUNT(*) FROM USUARIO) AS usuarios_creados,
    (SELECT COUNT(*) FROM user_triggers) AS triggers_activos,
    (SELECT COUNT(*) FROM user_views WHERE view_name LIKE 'VISTA_%') AS vistas_creadas
FROM DUAL;
