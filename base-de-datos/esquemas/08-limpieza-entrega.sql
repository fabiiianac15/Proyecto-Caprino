-- ==================================================================
-- LIMPIEZA PARA ENTREGA AL COORDINADOR (2026-06-02)
-- Deja la BD sin cabras ni registros operativos, con auditoría limpia
-- y SOLO dos usuarios. CONSERVA el catálogo de RAZAS y los CORRALES.
--
-- Ejecutar como caprino_user contra dbcaprino_high.
-- ATENCIÓN: borra datos de forma permanente.
-- ==================================================================

SET DEFINE OFF;
SET SERVEROUTPUT ON;

-- ------------------------------------------------------------------
-- 1. Romper el ciclo de FKs ANIMAL <-> REPRODUCCION
--    (ANIMAL.id_reproduccion_origen apunta a REPRODUCCION)
-- ------------------------------------------------------------------
UPDATE ANIMAL SET id_reproduccion_origen = NULL;

-- ------------------------------------------------------------------
-- 2. Borrar todos los registros operativos de las cabras
--    (de dependientes a principal)
-- ------------------------------------------------------------------
DELETE FROM GENEALOGIA;
DELETE FROM PESAJE;
DELETE FROM PRODUCCION_LECHE;
DELETE FROM FAMACHA;
-- SALUD incluye vacunas, tratamientos, diagnosticos, etc.
DELETE FROM SALUD;
DELETE FROM REPRODUCCION;
DELETE FROM ANIMAL;

-- ------------------------------------------------------------------
-- 3. Dejar SOLO los dos usuarios del coordinador
--    (USUARIO_PERFIL se borra en cascada por ON DELETE CASCADE)
-- ------------------------------------------------------------------
DELETE FROM USUARIO
 WHERE email NOT IN ('fjacostaa@ufpso.edu.co', 'syrinconb@ufpso.edu.co');

-- ------------------------------------------------------------------
-- 4. Auditoría limpia (AL FINAL: el trigger trg_auditoria_animal
--    genera filas en AUDITORIA al borrar/actualizar ANIMAL)
-- ------------------------------------------------------------------
DELETE FROM AUDITORIA;

COMMIT;

-- ==================================================================
-- Verificación
-- ==================================================================
SET PAGESIZE 100
SET LINESIZE 120
SELECT 'ANIMAL' tabla, COUNT(*) n FROM ANIMAL
UNION ALL SELECT 'GENEALOGIA', COUNT(*) FROM GENEALOGIA
UNION ALL SELECT 'PESAJE', COUNT(*) FROM PESAJE
UNION ALL SELECT 'PRODUCCION_LECHE', COUNT(*) FROM PRODUCCION_LECHE
UNION ALL SELECT 'REPRODUCCION', COUNT(*) FROM REPRODUCCION
UNION ALL SELECT 'SALUD', COUNT(*) FROM SALUD
UNION ALL SELECT 'FAMACHA', COUNT(*) FROM FAMACHA
UNION ALL SELECT 'AUDITORIA', COUNT(*) FROM AUDITORIA
UNION ALL SELECT 'CORRAL (se conserva)', COUNT(*) FROM CORRAL
UNION ALL SELECT 'RAZA (se conserva)', COUNT(*) FROM RAZA
UNION ALL SELECT 'USUARIO', COUNT(*) FROM USUARIO
UNION ALL SELECT 'USUARIO_PERFIL', COUNT(*) FROM USUARIO_PERFIL;

SELECT id_usuario, email, rol, estado FROM USUARIO ORDER BY id_usuario;
