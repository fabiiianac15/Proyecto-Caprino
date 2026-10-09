-- ==================================================================
-- PARCHE 11: Estado productivo de la hembra + raza Alpina (2026-10)
-- Ejecutar como caprino_user en la BD Oracle Autonomous.
-- Es idempotente: puede ejecutarse varias veces sin error.
--
-- Incluye:
--   1. ANIMAL.estado_productivo (producción, seca, preñada, cabretona, cabrita)
--      Complementa al estado general (activo, vendido, muerto, ...).
--   2. Renombrar raza 'Alpina Francesa' -> 'Alpina'
--      (hay varias alpinas; la del hato es la Alpina sin apellido).
--
-- Nota: el tipo de parto (sencillo / gemelar / trillizo) NO requiere
-- cambios en BD: se guarda en REPRODUCCION.tipo_parto como
-- 'simple' / 'doble' / 'triple' y solo cambia la etiqueta en pantalla.
-- ==================================================================

SET DEFINE OFF;

-- ------------------------------------------------------------------
-- 1. ESTADO PRODUCTIVO DE LA HEMBRA
-- ------------------------------------------------------------------
--   produccion : en lactancia / ordeño
--   seca       : sin producir leche, entre lactancias
--   prenada    : gestante
--   cabretona  : hembra joven de reemplazo, aún sin parir
--   cabrita    : cría hembra
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE ANIMAL ADD (estado_productivo VARCHAR2(20))';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE ANIMAL ADD CONSTRAINT check_animal_estado_productivo
        CHECK (estado_productivo IS NULL OR estado_productivo IN
               (''produccion'', ''seca'', ''prenada'', ''cabretona'', ''cabrita''))';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -2264 THEN NULL; ELSE RAISE; END IF; -- constraint ya existe
END;
/

COMMENT ON COLUMN ANIMAL.estado_productivo IS 'Estado productivo de la hembra: produccion, seca, prenada, cabretona, cabrita';

-- ------------------------------------------------------------------
-- 2. RENOMBRAR RAZA ALPINA
-- ------------------------------------------------------------------
UPDATE RAZA SET nombre_raza = 'Alpina',
                origen      = 'Alpes (Francia/Suiza)'
 WHERE nombre_raza = 'Alpina Francesa'
   AND NOT EXISTS (SELECT 1 FROM RAZA WHERE nombre_raza = 'Alpina');

COMMIT;

-- ==================================================================
-- Verificación rápida
-- ==================================================================
-- SELECT id_raza, nombre_raza, origen FROM RAZA WHERE nombre_raza LIKE 'Alpina%';
-- SELECT column_name, data_type FROM user_tab_columns WHERE table_name = 'ANIMAL' AND column_name = 'ESTADO_PRODUCTIVO';
