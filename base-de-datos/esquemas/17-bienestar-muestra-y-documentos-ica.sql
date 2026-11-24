-- ==================================================================
-- PARCHE 17: Bienestar animal — tamaño de muestra por grupo de edad
--            y verificación detallada del RSPP y la ASI (2026-11)
-- Fuente: MEBA ICA v3.0 (2026), numeral 4.4 (Tabla 1) y 4.5 (Tabla 3).
-- Ejecutar como caprino_user. Es idempotente.
--
-- 1. Muestra (Tabla 1 + reparto proporcional por grupo etario):
--    inv_crias / inv_jovenes / inv_adultos : inventario por grupo
--    mue_crias / mue_jovenes / mue_adultos : cabras a revisar por grupo
--    animales_muestra                      : ids de las cabras sorteadas
--    Grupos: crías lactantes (< 3 meses), jóvenes (3 a 12 meses),
--    adultos (> 12 meses).
-- 2. RSPP y ASI: estado, número, fechas y lista de verificación. La
--    clasificación EXCELENTE exige que ambos estén VIGENTES.
-- 3. EVAL_BIENESTAR_FOTO.documento: foto del certificado RSPP o ASI.
-- ==================================================================

SET DEFINE OFF;
ALTER SESSION DISABLE PARALLEL DML;

DECLARE
    PROCEDURE agregar(p_ddl VARCHAR2) IS
    BEGIN
        EXECUTE IMMEDIATE p_ddl;
    EXCEPTION WHEN OTHERS THEN
        IF SQLCODE IN (-1430, -2264, -2275) THEN NULL; ELSE RAISE; END IF; -- ya existe
    END;
BEGIN
    -- 1. Muestra por grupo etario
    agregar('ALTER TABLE EVALUACION_BIENESTAR ADD (inv_crias NUMBER)');
    agregar('ALTER TABLE EVALUACION_BIENESTAR ADD (inv_jovenes NUMBER)');
    agregar('ALTER TABLE EVALUACION_BIENESTAR ADD (inv_adultos NUMBER)');
    agregar('ALTER TABLE EVALUACION_BIENESTAR ADD (mue_crias NUMBER)');
    agregar('ALTER TABLE EVALUACION_BIENESTAR ADD (mue_jovenes NUMBER)');
    agregar('ALTER TABLE EVALUACION_BIENESTAR ADD (mue_adultos NUMBER)');
    agregar('ALTER TABLE EVALUACION_BIENESTAR ADD (animales_muestra VARCHAR2(4000))');

    -- 2. RSPP
    agregar(q'[ALTER TABLE EVALUACION_BIENESTAR ADD (rspp_estado VARCHAR2(12)
        CONSTRAINT ck_evalbien_rspp_est CHECK (rspp_estado IN ('VIGENTE','EN_TRAMITE','VENCIDO','NO_TIENE','NO_SABE')))]');
    agregar('ALTER TABLE EVALUACION_BIENESTAR ADD (rspp_numero VARCHAR2(60))');
    agregar('ALTER TABLE EVALUACION_BIENESTAR ADD (rspp_fecha DATE)');
    agregar('ALTER TABLE EVALUACION_BIENESTAR ADD (rspp_vence DATE)');
    agregar('ALTER TABLE EVALUACION_BIENESTAR ADD (rspp_checks VARCHAR2(400))');
    agregar('ALTER TABLE EVALUACION_BIENESTAR ADD (rspp_obs VARCHAR2(500))');
    --    ASI
    agregar(q'[ALTER TABLE EVALUACION_BIENESTAR ADD (asi_estado VARCHAR2(12)
        CONSTRAINT ck_evalbien_asi_est CHECK (asi_estado IN ('VIGENTE','EN_TRAMITE','VENCIDO','NO_TIENE','NO_SABE')))]');
    agregar('ALTER TABLE EVALUACION_BIENESTAR ADD (asi_numero VARCHAR2(60))');
    agregar('ALTER TABLE EVALUACION_BIENESTAR ADD (asi_fecha DATE)');
    agregar('ALTER TABLE EVALUACION_BIENESTAR ADD (asi_vence DATE)');
    agregar('ALTER TABLE EVALUACION_BIENESTAR ADD (asi_checks VARCHAR2(400))');
    agregar('ALTER TABLE EVALUACION_BIENESTAR ADD (asi_obs VARCHAR2(500))');

    -- 3. Foto del certificado
    agregar(q'[ALTER TABLE EVAL_BIENESTAR_FOTO ADD (documento VARCHAR2(5)
        CONSTRAINT ck_evalbien_foto_doc CHECK (documento IN ('RSPP','ASI')))]');
END;
/

COMMENT ON COLUMN EVALUACION_BIENESTAR.animales_muestra IS 'Ids de ANIMAL sorteados para la muestra, separados por coma';
COMMENT ON COLUMN EVALUACION_BIENESTAR.rspp_estado IS 'VIGENTE cuenta para EXCELENTE; EN_TRAMITE, VENCIDO, NO_TIENE y NO_SABE no';
COMMENT ON COLUMN EVALUACION_BIENESTAR.rspp_checks IS 'Claves de la lista de verificación marcadas, separadas por coma';
COMMENT ON COLUMN EVALUACION_BIENESTAR.asi_estado IS 'VIGENTE cuenta para EXCELENTE; EN_TRAMITE, VENCIDO, NO_TIENE y NO_SABE no';
COMMENT ON COLUMN EVAL_BIENESTAR_FOTO.documento IS 'RSPP o ASI cuando la foto es del certificado';

-- Evaluaciones anteriores: los checks "tiene" pasan a estado VIGENTE / NO_TIENE
UPDATE EVALUACION_BIENESTAR SET rspp_estado = CASE WHEN tiene_rspp = 1 THEN 'VIGENTE' ELSE 'NO_TIENE' END WHERE rspp_estado IS NULL;
UPDATE EVALUACION_BIENESTAR SET asi_estado  = CASE WHEN tiene_asi  = 1 THEN 'VIGENTE' ELSE 'NO_TIENE' END WHERE asi_estado IS NULL;

COMMIT;
