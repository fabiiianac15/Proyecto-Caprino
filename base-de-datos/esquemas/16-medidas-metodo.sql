-- ==================================================================
-- PARCHE 16: método de cada medida de la clasificación lineal (2026-11)
--   INSTRUMENTO: tomada sobre la cabra con bastón, cinta, compás o calibrador.
--   FOTO: estimada en la app marcando puntos sobre una foto con una vara de
--         referencia de largo conocido (error esperado de 3 a 5 %).
-- Así un informe nunca mezcla sin aviso un dato estimado con uno medido.
-- Ejecutar como caprino_user. Es idempotente.
-- ==================================================================
BEGIN
    EXECUTE IMMEDIATE q'[ALTER TABLE EVAL_LINEAL_MEDIDA ADD (metodo VARCHAR2(12) DEFAULT 'INSTRUMENTO' NOT NULL
        CONSTRAINT ck_evallineal_med_metodo CHECK (metodo IN ('INSTRUMENTO','FOTO')))]';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/
COMMENT ON COLUMN EVAL_LINEAL_MEDIDA.metodo IS 'INSTRUMENTO = medida sobre el animal; FOTO = estimada sobre foto con vara de referencia';
COMMIT;
