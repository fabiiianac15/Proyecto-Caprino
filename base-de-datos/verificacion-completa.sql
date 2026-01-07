-- ============================================================================
-- SCRIPT DE VERIFICACIÓN COMPLETA
-- Sistema de Gestión Zootécnica Caprina
-- Oracle Database
-- ============================================================================
-- Ejecutar este script en SQL Developer con la conexión CAPRINO_LOCAL
-- para verificar que todo esté configurado correctamente.
-- ============================================================================

SET SERVEROUTPUT ON;
SET LINESIZE 200;
SET PAGESIZE 1000;

PROMPT
PROMPT ============================================================================
PROMPT   VERIFICACIÓN DEL SISTEMA DE GESTIÓN CAPRINA
PROMPT ============================================================================
PROMPT

-- ============================================================================
-- 1. INFORMACIÓN DE LA BASE DE DATOS
-- ============================================================================

PROMPT --- 1. Información de la Base de Datos ---
PROMPT

SELECT 
    'Usuario actual: ' || USER as info
FROM DUAL
UNION ALL
SELECT 
    'Fecha y hora servidor: ' || TO_CHAR(SYSDATE, 'DD/MM/YYYY HH24:MI:SS')
FROM DUAL
UNION ALL
SELECT 
    'Versión Oracle: ' || BANNER
FROM v$version
WHERE ROWNUM = 1;

PROMPT

-- ============================================================================
-- 2. VERIFICACIÓN DE TABLAS
-- ============================================================================

PROMPT --- 2. Verificación de Tablas ---
PROMPT

SELECT 
    'Total de tablas: ' || COUNT(*) as resultado
FROM user_tables;

PROMPT
PROMPT Listado de tablas:
PROMPT

SELECT 
    table_name as "TABLA",
    num_rows as "FILAS",
    TO_CHAR(last_analyzed, 'DD/MM/YYYY') as "ÚLTIMA ANÁLISIS"
FROM user_tables
ORDER BY table_name;

PROMPT
PROMPT Verificación de tablas esperadas:
PROMPT

SELECT 
    CASE 
        WHEN COUNT(*) = 1 THEN '✓ RAZA'
        ELSE '✗ RAZA (NO EXISTE)'
    END as estado
FROM user_tables WHERE table_name = 'RAZA'
UNION ALL
SELECT 
    CASE 
        WHEN COUNT(*) = 1 THEN '✓ ANIMAL'
        ELSE '✗ ANIMAL (NO EXISTE)'
    END
FROM user_tables WHERE table_name = 'ANIMAL'
UNION ALL
SELECT 
    CASE 
        WHEN COUNT(*) = 1 THEN '✓ GENEALOGIA'
        ELSE '✗ GENEALOGIA (NO EXISTE)'
    END
FROM user_tables WHERE table_name = 'GENEALOGIA'
UNION ALL
SELECT 
    CASE 
        WHEN COUNT(*) = 1 THEN '✓ PESAJE'
        ELSE '✗ PESAJE (NO EXISTE)'
    END
FROM user_tables WHERE table_name = 'PESAJE'
UNION ALL
SELECT 
    CASE 
        WHEN COUNT(*) = 1 THEN '✓ PRODUCCION_LECHE'
        ELSE '✗ PRODUCCION_LECHE (NO EXISTE)'
    END
FROM user_tables WHERE table_name = 'PRODUCCION_LECHE'
UNION ALL
SELECT 
    CASE 
        WHEN COUNT(*) = 1 THEN '✓ REPRODUCCION'
        ELSE '✗ REPRODUCCION (NO EXISTE)'
    END
FROM user_tables WHERE table_name = 'REPRODUCCION'
UNION ALL
SELECT 
    CASE 
        WHEN COUNT(*) = 1 THEN '✓ SALUD'
        ELSE '✗ SALUD (NO EXISTE)'
    END
FROM user_tables WHERE table_name = 'SALUD';

PROMPT

-- ============================================================================
-- 3. VERIFICACIÓN DE SECUENCIAS
-- ============================================================================

PROMPT --- 3. Verificación de Secuencias ---
PROMPT

SELECT 
    'Total de secuencias: ' || COUNT(*) as resultado
FROM user_sequences;

PROMPT
PROMPT Listado de secuencias:
PROMPT

SELECT 
    sequence_name as "SECUENCIA",
    last_number as "ÚLTIMO NÚMERO",
    cache_size as "CACHE"
FROM user_sequences
ORDER BY sequence_name;

PROMPT

-- ============================================================================
-- 4. VERIFICACIÓN DE CONSTRAINTS
-- ============================================================================

PROMPT --- 4. Verificación de Constraints (Restricciones) ---
PROMPT

SELECT 
    constraint_type as "TIPO",
    COUNT(*) as "CANTIDAD"
FROM user_constraints
WHERE table_name IN (
    'RAZA', 'ANIMAL', 'GENEALOGIA', 'PESAJE', 
    'PRODUCCION_LECHE', 'REPRODUCCION', 'SALUD'
)
GROUP BY constraint_type
ORDER BY constraint_type;

PROMPT
PROMPT Leyenda:
PROMPT   P = Primary Key
PROMPT   R = Foreign Key
PROMPT   C = Check Constraint
PROMPT   U = Unique Constraint
PROMPT

-- ============================================================================
-- 5. VERIFICACIÓN DE ÍNDICES
-- ============================================================================

PROMPT --- 5. Verificación de Índices ---
PROMPT

SELECT 
    'Total de índices: ' || COUNT(*) as resultado
FROM user_indexes
WHERE table_name IN (
    'RAZA', 'ANIMAL', 'GENEALOGIA', 'PESAJE', 
    'PRODUCCION_LECHE', 'REPRODUCCION', 'SALUD'
);

PROMPT
PROMPT Índices por tabla:
PROMPT

SELECT 
    table_name as "TABLA",
    COUNT(*) as "ÍNDICES"
FROM user_indexes
WHERE table_name IN (
    'RAZA', 'ANIMAL', 'GENEALOGIA', 'PESAJE', 
    'PRODUCCION_LECHE', 'REPRODUCCION', 'SALUD'
)
GROUP BY table_name
ORDER BY table_name;

PROMPT

-- ============================================================================
-- 6. VERIFICACIÓN DE TRIGGERS
-- ============================================================================

PROMPT --- 6. Verificación de Triggers ---
PROMPT

SELECT 
    'Total de triggers: ' || COUNT(*) as resultado
FROM user_triggers;

PROMPT
PROMPT Listado de triggers:
PROMPT

SELECT 
    trigger_name as "TRIGGER",
    table_name as "TABLA",
    triggering_event as "EVENTO",
    status as "ESTADO"
FROM user_triggers
ORDER BY table_name, trigger_name;

PROMPT

-- ============================================================================
-- 7. VERIFICACIÓN DE VISTAS
-- ============================================================================

PROMPT --- 7. Verificación de Vistas ---
PROMPT

SELECT 
    'Total de vistas: ' || COUNT(*) as resultado
FROM user_views;

PROMPT
PROMPT Listado de vistas:
PROMPT

SELECT 
    view_name as "VISTA"
FROM user_views
ORDER BY view_name;

PROMPT

-- ============================================================================
-- 8. VERIFICACIÓN DE DATOS
-- ============================================================================

PROMPT --- 8. Verificación de Datos ---
PROMPT

PROMPT Conteo de registros por tabla:
PROMPT

DECLARE
    v_count NUMBER;
BEGIN
    -- RAZA
    SELECT COUNT(*) INTO v_count FROM RAZA;
    DBMS_OUTPUT.PUT_LINE('RAZA:             ' || LPAD(v_count, 6) || ' registros');
    
    -- ANIMAL
    SELECT COUNT(*) INTO v_count FROM ANIMAL;
    DBMS_OUTPUT.PUT_LINE('ANIMAL:           ' || LPAD(v_count, 6) || ' registros');
    
    -- GENEALOGIA
    SELECT COUNT(*) INTO v_count FROM GENEALOGIA;
    DBMS_OUTPUT.PUT_LINE('GENEALOGIA:       ' || LPAD(v_count, 6) || ' registros');
    
    -- PESAJE
    SELECT COUNT(*) INTO v_count FROM PESAJE;
    DBMS_OUTPUT.PUT_LINE('PESAJE:           ' || LPAD(v_count, 6) || ' registros');
    
    -- PRODUCCION_LECHE
    SELECT COUNT(*) INTO v_count FROM PRODUCCION_LECHE;
    DBMS_OUTPUT.PUT_LINE('PRODUCCION_LECHE: ' || LPAD(v_count, 6) || ' registros');
    
    -- REPRODUCCION
    SELECT COUNT(*) INTO v_count FROM REPRODUCCION;
    DBMS_OUTPUT.PUT_LINE('REPRODUCCION:     ' || LPAD(v_count, 6) || ' registros');
    
    -- SALUD
    SELECT COUNT(*) INTO v_count FROM SALUD;
    DBMS_OUTPUT.PUT_LINE('SALUD:            ' || LPAD(v_count, 6) || ' registros');
END;
/

PROMPT

-- ============================================================================
-- 9. DATOS DE EJEMPLO - RAZAS
-- ============================================================================

PROMPT --- 9. Datos de Ejemplo - Razas ---
PROMPT

SELECT 
    id_raza as "ID",
    nombre_raza as "RAZA",
    origen as "ORIGEN",
    aptitud as "APTITUD",
    peso_adulto_promedio_kg as "PESO (KG)",
    produccion_leche_dia_promedio as "LECHE (L/DÍA)"
FROM RAZA
WHERE ROWNUM <= 10
ORDER BY nombre_raza;

PROMPT

-- ============================================================================
-- 10. VERIFICACIÓN DE INTEGRIDAD REFERENCIAL
-- ============================================================================

PROMPT --- 10. Verificación de Integridad Referencial ---
PROMPT

PROMPT Foreign Keys (Claves Foráneas):
PROMPT

SELECT 
    c.constraint_name as "CONSTRAINT",
    c.table_name as "TABLA",
    cc.column_name as "COLUMNA",
    r.table_name as "REFERENCIA"
FROM user_constraints c
JOIN user_cons_columns cc ON c.constraint_name = cc.constraint_name
JOIN user_constraints r ON c.r_constraint_name = r.constraint_name
WHERE c.constraint_type = 'R'
    AND c.table_name IN (
        'ANIMAL', 'GENEALOGIA', 'PESAJE', 
        'PRODUCCION_LECHE', 'REPRODUCCION', 'SALUD'
    )
ORDER BY c.table_name, c.constraint_name;

PROMPT

-- ============================================================================
-- 11. VERIFICACIÓN DE PERMISOS
-- ============================================================================

PROMPT --- 11. Verificación de Permisos del Usuario ---
PROMPT

SELECT 
    privilege as "PRIVILEGIO"
FROM user_sys_privs
ORDER BY privilege;

PROMPT

-- ============================================================================
-- 12. ESPACIO UTILIZADO
-- ============================================================================

PROMPT --- 12. Espacio Utilizado por Tablas ---
PROMPT

SELECT 
    segment_name as "TABLA",
    ROUND(bytes/1024/1024, 2) as "MB",
    tablespace_name as "TABLESPACE"
FROM user_segments
WHERE segment_type = 'TABLE'
    AND segment_name IN (
        'RAZA', 'ANIMAL', 'GENEALOGIA', 'PESAJE', 
        'PRODUCCION_LECHE', 'REPRODUCCION', 'SALUD'
    )
ORDER BY bytes DESC;

PROMPT

-- ============================================================================
-- 13. RESUMEN DE VERIFICACIÓN
-- ============================================================================

PROMPT
PROMPT ============================================================================
PROMPT   RESUMEN DE VERIFICACIÓN
PROMPT ============================================================================
PROMPT

DECLARE
    v_tables NUMBER;
    v_sequences NUMBER;
    v_triggers NUMBER;
    v_views NUMBER;
    v_constraints NUMBER;
    v_indexes NUMBER;
    v_data NUMBER;
    v_issues NUMBER := 0;
BEGIN
    -- Contar objetos
    SELECT COUNT(*) INTO v_tables FROM user_tables;
    SELECT COUNT(*) INTO v_sequences FROM user_sequences;
    SELECT COUNT(*) INTO v_triggers FROM user_triggers;
    SELECT COUNT(*) INTO v_views FROM user_views;
    SELECT COUNT(*) INTO v_constraints FROM user_constraints;
    SELECT COUNT(*) INTO v_indexes FROM user_indexes;
    SELECT COUNT(*) INTO v_data FROM RAZA;
    
    DBMS_OUTPUT.PUT_LINE('Objetos en la base de datos:');
    DBMS_OUTPUT.PUT_LINE('----------------------------');
    DBMS_OUTPUT.PUT_LINE('Tablas:       ' || v_tables);
    DBMS_OUTPUT.PUT_LINE('Secuencias:   ' || v_sequences);
    DBMS_OUTPUT.PUT_LINE('Triggers:     ' || v_triggers);
    DBMS_OUTPUT.PUT_LINE('Vistas:       ' || v_views);
    DBMS_OUTPUT.PUT_LINE('Constraints:  ' || v_constraints);
    DBMS_OUTPUT.PUT_LINE('Índices:      ' || v_indexes);
    DBMS_OUTPUT.PUT_LINE('');
    
    -- Verificar problemas
    DBMS_OUTPUT.PUT_LINE('Verificación de problemas:');
    DBMS_OUTPUT.PUT_LINE('-------------------------');
    
    IF v_tables < 7 THEN
        DBMS_OUTPUT.PUT_LINE('✗ Faltan tablas (esperadas: 7, encontradas: ' || v_tables || ')');
        v_issues := v_issues + 1;
    ELSE
        DBMS_OUTPUT.PUT_LINE('✓ Todas las tablas principales creadas');
    END IF;
    
    IF v_sequences = 0 THEN
        DBMS_OUTPUT.PUT_LINE('✗ No hay secuencias configuradas');
        v_issues := v_issues + 1;
    ELSE
        DBMS_OUTPUT.PUT_LINE('✓ Secuencias configuradas');
    END IF;
    
    IF v_data = 0 THEN
        DBMS_OUTPUT.PUT_LINE('! ADVERTENCIA: La tabla RAZA está vacía (ejecutar 02-datos-iniciales-razas.sql)');
        v_issues := v_issues + 1;
    ELSE
        DBMS_OUTPUT.PUT_LINE('✓ Datos iniciales de razas insertados (' || v_data || ' razas)');
    END IF;
    
    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('============================================================================');
    
    IF v_issues = 0 THEN
        DBMS_OUTPUT.PUT_LINE('  ✓ VERIFICACIÓN EXITOSA - Todo está correctamente configurado');
    ELSE
        DBMS_OUTPUT.PUT_LINE('  ! Se encontraron ' || v_issues || ' problema(s) - Revisa los detalles arriba');
    END IF;
    
    DBMS_OUTPUT.PUT_LINE('============================================================================');
END;
/

PROMPT
PROMPT Script de verificación completado.
PROMPT Si todo está correcto, puedes proceder a probar la conexión desde el backend.
PROMPT

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
