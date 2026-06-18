-- ==================================================================
-- ESQUEMA 10: Módulo de Clasificación Lineal Fenotípica (método ADGA)
-- Ejecutar como caprino_user en la BD Oracle Autonomous.
-- Es idempotente: puede ejecutarse varias veces sin error.
--
-- Basado en Cedeño et al. (2024) / American Dairy Goat Association.
-- Evaluación de 4 regiones morfológicas (total 100 puntos):
--   APARIENCIA general y capacidad ... 25
--   ESTRUCTURA y fortaleza lechera ... 15
--   MAMARIO  (sistema mamario) ....... 40
--   PATAS    y pezuñas ............... 20
-- Cada rasgo se califica 1 (bajo) / 2 (intermedio) / 3 (alto).
-- La calificación final (CFINAL) clasifica en 6 categorías:
--   <59 POBRE | 60-69 REGULAR | 70-79 ACEPTABLE | 80-84 BUENO |
--   85-89 MUY_BUENO | 90-100 EXCELENTE
--
-- Tablas:
--   1. CLASIF_RASGO_CAT     (catálogo de rasgos por región)
--   2. EVALUACION_LINEAL    (cabecera por animal)
--   3. EVAL_LINEAL_DETALLE  (calificación 1/2/3 por rasgo)
--   4. EVAL_LINEAL_FOTO     (fotos de evidencia por vista)
-- ==================================================================

SET DEFINE OFF;

-- ------------------------------------------------------------------
-- 1. CATÁLOGO DE RASGOS LINEALES
-- ------------------------------------------------------------------
BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE CLASIF_RASGO_CAT (
            id_rasgo   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            codigo     VARCHAR2(20) NOT NULL,
            nombre     VARCHAR2(120) NOT NULL,
            region     VARCHAR2(15) NOT NULL
                       CHECK (region IN (''APARIENCIA'',''ESTRUCTURA'',''MAMARIO'',''PATAS'')),
            pts_region NUMBER NOT NULL,
            orden      NUMBER,
            CONSTRAINT uk_clasif_rasgo_codigo UNIQUE (codigo)
        )';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -955 THEN NULL; ELSE RAISE; END IF;
END;
/

COMMENT ON TABLE  CLASIF_RASGO_CAT IS 'Catálogo de rasgos de clasificación lineal (método ADGA)';
COMMENT ON COLUMN CLASIF_RASGO_CAT.pts_region IS 'Puntos máximos de la región a la que pertenece (25/15/40/20)';

-- ------------------------------------------------------------------
-- 2. CABECERA DE EVALUACIÓN (por animal)
-- ------------------------------------------------------------------
BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE EVALUACION_LINEAL (
            id_evaluacion    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            id_animal        NUMBER NOT NULL,
            fecha_evaluacion DATE NOT NULL,
            edad_meses       NUMBER,
            num_lactancia    NUMBER,
            punt_apariencia  NUMBER(5,2),
            punt_estructura  NUMBER(5,2),
            punt_mamario     NUMBER(5,2),
            punt_patas       NUMBER(5,2),
            punt_final       NUMBER(5,2),
            categoria        VARCHAR2(15)
                             CHECK (categoria IN (''POBRE'',''REGULAR'',''ACEPTABLE'',''BUENO'',''MUY_BUENO'',''EXCELENTE'')),
            observaciones    CLOB,
            usuario_registro NUMBER NOT NULL,
            fecha_registro   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_evallineal_animal FOREIGN KEY (id_animal)
                REFERENCES ANIMAL(id_animal)
        )';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -955 THEN NULL; ELSE RAISE; END IF;
END;
/

COMMENT ON TABLE  EVALUACION_LINEAL IS 'Evaluación lineal fenotípica de un animal (CFINAL 0-100)';
COMMENT ON COLUMN EVALUACION_LINEAL.punt_final IS 'Calificación final 0-100 (suma ponderada de las 4 regiones)';

BEGIN
    EXECUTE IMMEDIATE 'CREATE INDEX idx_evallineal_animal ON EVALUACION_LINEAL(id_animal)';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -955 THEN NULL; ELSE RAISE; END IF;
END;
/

-- ------------------------------------------------------------------
-- 3. DETALLE: CALIFICACIÓN POR RASGO
-- ------------------------------------------------------------------
BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE EVAL_LINEAL_DETALLE (
            id_detalle    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            id_evaluacion NUMBER NOT NULL,
            id_rasgo      NUMBER NOT NULL,
            calificacion  NUMBER(1) CHECK (calificacion IN (1,2,3)),
            puntaje       NUMBER(5,2),
            observacion   VARCHAR2(500),
            CONSTRAINT fk_evallineal_det_cab FOREIGN KEY (id_evaluacion)
                REFERENCES EVALUACION_LINEAL(id_evaluacion) ON DELETE CASCADE,
            CONSTRAINT fk_evallineal_det_rasgo FOREIGN KEY (id_rasgo)
                REFERENCES CLASIF_RASGO_CAT(id_rasgo),
            CONSTRAINT uk_evallineal_det UNIQUE (id_evaluacion, id_rasgo)
        )';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -955 THEN NULL; ELSE RAISE; END IF;
END;
/

COMMENT ON TABLE  EVAL_LINEAL_DETALLE IS 'Calificación 1/2/3 por rasgo y su aporte en puntos';
COMMENT ON COLUMN EVAL_LINEAL_DETALLE.calificacion IS '1=bajo, 2=intermedio, 3=alto (guía visual ADGA)';

BEGIN
    EXECUTE IMMEDIATE 'CREATE INDEX idx_evallineal_det_cab ON EVAL_LINEAL_DETALLE(id_evaluacion)';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -955 THEN NULL; ELSE RAISE; END IF;
END;
/

-- ------------------------------------------------------------------
-- 4. FOTOS DE EVIDENCIA
-- ------------------------------------------------------------------
-- Las imágenes se guardan en disco (carpeta APP_UPLOADS_DIR del
-- backend) y aquí se almacena solo la ruta relativa.
BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE EVAL_LINEAL_FOTO (
            id_foto       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            id_evaluacion NUMBER NOT NULL,
            tipo_vista    VARCHAR2(20) NOT NULL
                          CHECK (tipo_vista IN (''FRONTAL'',''LATERAL'',''POSTERIOR'',''UBRE_POST'',''UBRE_LAT'',''PATAS'')),
            ruta_archivo  VARCHAR2(300) NOT NULL,
            descripcion   VARCHAR2(200),
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_evallineal_foto_cab FOREIGN KEY (id_evaluacion)
                REFERENCES EVALUACION_LINEAL(id_evaluacion) ON DELETE CASCADE
        )';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -955 THEN NULL; ELSE RAISE; END IF;
END;
/

COMMENT ON TABLE  EVAL_LINEAL_FOTO IS 'Fotos de evidencia de la evaluación lineal por tipo de vista';
COMMENT ON COLUMN EVAL_LINEAL_FOTO.ruta_archivo IS 'Ruta relativa dentro de APP_UPLOADS_DIR';

BEGIN
    EXECUTE IMMEDIATE 'CREATE INDEX idx_evallineal_foto_cab ON EVAL_LINEAL_FOTO(id_evaluacion)';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -955 THEN NULL; ELSE RAISE; END IF;
END;
/

-- ------------------------------------------------------------------
-- 5. SEMILLA DEL CATÁLOGO DE RASGOS (solo si está vacío)
-- ------------------------------------------------------------------
DECLARE
    v_cnt NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_cnt FROM CLASIF_RASGO_CAT;
    IF v_cnt = 0 THEN
        -- APARIENCIA GENERAL Y CAPACIDAD (25 pts)
        INSERT INTO CLASIF_RASGO_CAT (codigo, nombre, region, pts_region, orden) VALUES ('ESTAT',   'Estatura (altura a la cruz)',        'APARIENCIA', 25, 1);
        INSERT INTO CLASIF_RASGO_CAT (codigo, nombre, region, pts_region, orden) VALUES ('ANCPEC',  'Ancho de pecho',                     'APARIENCIA', 25, 2);
        INSERT INTO CLASIF_RASGO_CAT (codigo, nombre, region, pts_region, orden) VALUES ('PROFUN',  'Profundidad corporal',               'APARIENCIA', 25, 3);
        INSERT INTO CLASIF_RASGO_CAT (codigo, nombre, region, pts_region, orden) VALUES ('ANCHGRU', 'Ancho de grupa',                     'APARIENCIA', 25, 4);
        INSERT INTO CLASIF_RASGO_CAT (codigo, nombre, region, pts_region, orden) VALUES ('ANGRU',   'Ángulo de grupa',                    'APARIENCIA', 25, 5);

        -- ESTRUCTURA Y FORTALEZA LECHERA (15 pts)
        INSERT INTO CLASIF_RASGO_CAT (codigo, nombre, region, pts_region, orden) VALUES ('ANGUL',   'Angulosidad (carácter lechero)',     'ESTRUCTURA', 15, 6);
        INSERT INTO CLASIF_RASGO_CAT (codigo, nombre, region, pts_region, orden) VALUES ('CALHU',   'Calidad de hueso',                   'ESTRUCTURA', 15, 7);

        -- SISTEMA MAMARIO (40 pts)
        INSERT INTO CLASIF_RASGO_CAT (codigo, nombre, region, pts_region, orden) VALUES ('INAU',    'Inserción anterior de la ubre',      'MAMARIO', 40, 8);
        INSERT INTO CLASIF_RASGO_CAT (codigo, nombre, region, pts_region, orden) VALUES ('AILPU',   'Altura de inserción posterior de la ubre', 'MAMARIO', 40, 9);
        INSERT INTO CLASIF_RASGO_CAT (codigo, nombre, region, pts_region, orden) VALUES ('ANIPU',   'Anchura de inserción posterior de la ubre','MAMARIO', 40, 10);
        INSERT INTO CLASIF_RASGO_CAT (codigo, nombre, region, pts_region, orden) VALUES ('LSM',     'Ligamento suspensor medio',          'MAMARIO', 40, 11);
        INSERT INTO CLASIF_RASGO_CAT (codigo, nombre, region, pts_region, orden) VALUES ('PROFUB',  'Profundidad de la ubre',             'MAMARIO', 40, 12);
        INSERT INTO CLASIF_RASGO_CAT (codigo, nombre, region, pts_region, orden) VALUES ('COLPE',   'Colocación de los pezones',          'MAMARIO', 40, 13);
        INSERT INTO CLASIF_RASGO_CAT (codigo, nombre, region, pts_region, orden) VALUES ('DIAPE',   'Diámetro de los pezones',            'MAMARIO', 40, 14);

        -- PATAS Y PEZUÑAS (20 pts)
        INSERT INTO CLASIF_RASGO_CAT (codigo, nombre, region, pts_region, orden) VALUES ('PTVP',    'Patas traseras vista posterior',     'PATAS', 20, 15);
        INSERT INTO CLASIF_RASGO_CAT (codigo, nombre, region, pts_region, orden) VALUES ('PTVL',    'Patas traseras vista lateral',       'PATAS', 20, 16);
        INSERT INTO CLASIF_RASGO_CAT (codigo, nombre, region, pts_region, orden) VALUES ('MOVI',    'Movilidad / aplomos',                'PATAS', 20, 17);
    END IF;
END;
/

COMMIT;

-- ==================================================================
-- Verificación rápida (descomentar para revisar)
-- ==================================================================
-- SELECT region, COUNT(*), MAX(pts_region) FROM CLASIF_RASGO_CAT GROUP BY region;
-- SELECT codigo, nombre, region FROM CLASIF_RASGO_CAT ORDER BY orden;
-- ==================================================================
-- FIN DEL SCRIPT
-- ==================================================================
