-- ==================================================================
-- ESQUEMA 09: Módulo de Bienestar Animal (MEBA - ICA v3.0, 2026)
-- Ejecutar como caprino_user en la BD Oracle Autonomous.
-- Es idempotente: puede ejecutarse varias veces sin error.
--
-- Metodología ICA "Evaluar el Bienestar Animal en Ovinos y Caprinos".
-- Cada indicador puntúa 0, 20, 55 o 100. Se agrupan en 3 tipos de
-- medida con peso fijo: Recursos 35%, Animal 55%, Gestión 10%.
-- Puntaje grupo = promedio de indicadores aplicables * peso.
-- Total = suma de los 3 grupos (0-100). Clasificación:
--   EXCELENTE >=90% + RSPP + ASI | ALTO >=75% | MEDIO >=50% | BAJO <50%
--
-- Tablas:
--   1. BIENESTAR_INDICADOR_CAT  (catálogo de indicadores + flags)
--   2. EVALUACION_BIENESTAR     (cabecera por hato/visita)
--   3. EVAL_BIENESTAR_DETALLE   (un renglón por indicador evaluado)
-- ==================================================================

SET DEFINE OFF;

-- ------------------------------------------------------------------
-- 1. CATÁLOGO DE INDICADORES
-- ------------------------------------------------------------------
-- Contiene los indicadores de la metodología con sus banderas de
-- aplicabilidad. La evaluación CAPRINO usa los que tienen
-- aplica_caprino = 1 (excluye Descole y Suciedad del tren posterior,
-- propios de ovinos de lana). El campo fuente_modulo permite
-- autollenar el indicador desde otro módulo del sistema.
BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE BIENESTAR_INDICADOR_CAT (
            id_indicador       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            codigo             VARCHAR2(40) NOT NULL,
            nombre             VARCHAR2(200) NOT NULL,
            tipo_medida        VARCHAR2(10) NOT NULL
                               CHECK (tipo_medida IN (''RECURSOS'', ''ANIMAL'', ''GESTION'')),
            aplica_caprino     NUMBER(1) DEFAULT 1 CHECK (aplica_caprino IN (0,1)),
            aplica_ovino       NUMBER(1) DEFAULT 1 CHECK (aplica_ovino IN (0,1)),
            solo_confinamiento NUMBER(1) DEFAULT 0 CHECK (solo_confinamiento IN (0,1)),
            es_documental      NUMBER(1) DEFAULT 0 CHECK (es_documental IN (0,1)),
            es_binario         NUMBER(1) DEFAULT 0 CHECK (es_binario IN (0,1)),
            fuente_modulo      VARCHAR2(20),
            orden              NUMBER,
            CONSTRAINT uk_bienestar_ind_codigo UNIQUE (codigo)
        )';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -955 THEN NULL; ELSE RAISE; END IF; -- tabla ya existe
END;
/

COMMENT ON TABLE  BIENESTAR_INDICADOR_CAT IS 'Catálogo de indicadores de bienestar (MEBA ICA v3.0)';
COMMENT ON COLUMN BIENESTAR_INDICADOR_CAT.tipo_medida        IS 'RECURSOS(35%), ANIMAL(55%) o GESTION(10%)';
COMMENT ON COLUMN BIENESTAR_INDICADOR_CAT.solo_confinamiento IS 'Solo aplica en sistemas semi-intensivo/intensivo';
COMMENT ON COLUMN BIENESTAR_INDICADOR_CAT.es_documental      IS 'Requiere soporte documental (registros, certificados, análisis)';
COMMENT ON COLUMN BIENESTAR_INDICADOR_CAT.es_binario         IS 'Solo puntúa 0 o 100 (cumple/no cumple)';
COMMENT ON COLUMN BIENESTAR_INDICADOR_CAT.fuente_modulo      IS 'Módulo del que se puede autollenar: FAMACHA, SALUD, PESO, CORRAL';

-- ------------------------------------------------------------------
-- 2. CABECERA DE EVALUACIÓN (nivel hato, por ahora solo caprino)
-- ------------------------------------------------------------------
BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE EVALUACION_BIENESTAR (
            id_evaluacion      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            especie            VARCHAR2(20) DEFAULT ''CAPRINO''
                               CHECK (especie IN (''CAPRINO'', ''OVINO'')),
            fecha_evaluacion   DATE NOT NULL,
            tipo_productor     VARCHAR2(15)
                               CHECK (tipo_productor IN (''FAMILIAR'',''EXTENSIVO'',''SEMI_INTENSIVO'',''INTENSIVO'')),
            sistema_productivo VARCHAR2(30),
            num_animales       NUMBER,
            tamano_muestra     NUMBER,
            tiene_rspp         NUMBER(1) DEFAULT 0 CHECK (tiene_rspp IN (0,1)),
            tiene_asi          NUMBER(1) DEFAULT 0 CHECK (tiene_asi IN (0,1)),
            punt_recursos      NUMBER(5,2),
            punt_animal        NUMBER(5,2),
            punt_gestion       NUMBER(5,2),
            punt_total         NUMBER(5,2),
            clasificacion      VARCHAR2(10)
                               CHECK (clasificacion IN (''EXCELENTE'',''ALTO'',''MEDIO'',''BAJO'')),
            observaciones      CLOB,
            usuario_registro   NUMBER NOT NULL,
            fecha_registro     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -955 THEN NULL; ELSE RAISE; END IF;
END;
/

COMMENT ON TABLE  EVALUACION_BIENESTAR IS 'Evaluación de bienestar a nivel de hato (MEBA ICA v3.0)';
COMMENT ON COLUMN EVALUACION_BIENESTAR.especie       IS 'Por ahora solo CAPRINO; extensible a OVINO a futuro';
COMMENT ON COLUMN EVALUACION_BIENESTAR.punt_total    IS 'Calificación final 0-100 ponderada (35/55/10)';
COMMENT ON COLUMN EVALUACION_BIENESTAR.clasificacion IS 'EXCELENTE requiere ademas tiene_rspp=1 y tiene_asi=1';

-- ------------------------------------------------------------------
-- 3. DETALLE: PUNTAJE POR INDICADOR
-- ------------------------------------------------------------------
BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE EVAL_BIENESTAR_DETALLE (
            id_detalle     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            id_evaluacion  NUMBER NOT NULL,
            id_indicador   NUMBER NOT NULL,
            puntaje        NUMBER(3) CHECK (puntaje IN (0,20,55,100)),
            aplica         NUMBER(1) DEFAULT 1 CHECK (aplica IN (0,1)),
            soporte_doc    VARCHAR2(300),
            observacion    VARCHAR2(500),
            CONSTRAINT fk_evalbien_cab FOREIGN KEY (id_evaluacion)
                REFERENCES EVALUACION_BIENESTAR(id_evaluacion) ON DELETE CASCADE,
            CONSTRAINT fk_evalbien_ind FOREIGN KEY (id_indicador)
                REFERENCES BIENESTAR_INDICADOR_CAT(id_indicador),
            CONSTRAINT uk_evalbien_det UNIQUE (id_evaluacion, id_indicador)
        )';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -955 THEN NULL; ELSE RAISE; END IF;
END;
/

COMMENT ON TABLE  EVAL_BIENESTAR_DETALLE IS 'Puntaje 0/20/55/100 por indicador en una evaluación de bienestar';
COMMENT ON COLUMN EVAL_BIENESTAR_DETALLE.aplica IS '0 = indicador no aplica al predio (no entra en el promedio)';

BEGIN
    EXECUTE IMMEDIATE 'CREATE INDEX idx_evalbien_cab ON EVAL_BIENESTAR_DETALLE(id_evaluacion)';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -955 THEN NULL; ELSE RAISE; END IF;
END;
/

-- ------------------------------------------------------------------
-- 4. SEMILLA DEL CATÁLOGO (solo si está vacío)
-- ------------------------------------------------------------------
DECLARE
    v_cnt NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_cnt FROM BIENESTAR_INDICADOR_CAT;
    IF v_cnt = 0 THEN
        -- ---------- MEDIDAS BASADAS EN LOS RECURSOS (35%) ----------
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('AGUA_ACCESO',          'Acceso y disponibilidad al agua de bebida',          'RECURSOS', 1, 1, 0, 0, 0, NULL, 1);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('AGUA_CALIDAD',         'Calidad y limpieza del agua de bebida',              'RECURSOS', 1, 1, 0, 1, 0, NULL, 2);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('BEBEDEROS_ESTADO',     'Estado y limpieza de bebederos',                     'RECURSOS', 1, 1, 0, 0, 0, NULL, 3);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('ALIMENTO_ACCESO',      'Acceso y disponibilidad del alimento',               'RECURSOS', 1, 1, 0, 0, 0, NULL, 4);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('ALIMENTO_CALIDAD',     'Cantidad y calidad del alimento',                    'RECURSOS', 1, 1, 0, 0, 0, NULL, 5);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('COMEDEROS_ESTADO',     'Estado y limpieza de comederos',                     'RECURSOS', 1, 1, 0, 0, 0, NULL, 6);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('SOMBRA',               'Acceso a sombra en corrales y potreros',             'RECURSOS', 1, 1, 0, 0, 0, NULL, 7);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('ENCHARCAMIENTO',       'Encharcamiento en corrales y potreros',              'RECURSOS', 1, 1, 0, 0, 0, NULL, 8);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('ESPACIO_CONFINAMIENTO','Espacio mínimo por animal en confinamiento',         'RECURSOS', 1, 1, 1, 0, 0, NULL, 9);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('PISO_CORRALES',        'Tipo, estado del piso y limpieza de los corrales',   'RECURSOS', 1, 1, 0, 0, 0, NULL, 10);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('CAMA',                 'Condición de la cama',                               'RECURSOS', 1, 1, 0, 0, 0, NULL, 11);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('ILUMINACION',          'Iluminación en los corrales',                        'RECURSOS', 1, 1, 1, 0, 0, NULL, 12);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('VENTILACION',          'Ventilación en los corrales',                        'RECURSOS', 1, 1, 1, 0, 0, NULL, 13);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('ENRIQUECIMIENTO',      'Enriquecimiento ambiental para animales confinados', 'RECURSOS', 1, 1, 1, 0, 0, NULL, 14);

        -- ---------- MEDIDAS BASADAS EN EL ANIMAL (55%) ----------
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('CONDICION_CORPORAL',      'Condición corporal',                                          'ANIMAL', 1, 1, 0, 0, 0, 'PESO',    15);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('ESTRES_TERMICO',          'Signos de estrés térmico (por calor o por frío)',             'ANIMAL', 1, 1, 0, 0, 0, NULL,      16);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('SECRECION',               'Secreción ocular, nasal y/o tos persistente',                 'ANIMAL', 1, 1, 0, 0, 0, 'SALUD',   17);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('FAMACHA',                 'FAMACHA',                                                     'ANIMAL', 1, 1, 0, 0, 0, 'FAMACHA', 18);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('TOPIZADO_DESCORNE',       'Topizado y descorne',                                         'ANIMAL', 1, 0, 0, 1, 0, NULL,      19);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('ECTOPARASITOS',           'Presencia de ectoparásitos (tábanos, garrapatas, nuches y miasis)', 'ANIMAL', 1, 1, 0, 0, 0, 'SALUD', 20);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('LESIONES',                'Lesiones, heridas en el cuerpo, pérdida de pelo o lana',      'ANIMAL', 1, 1, 0, 0, 0, 'SALUD',   21);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('MASTITIS',                'Mastitis clínica',                                            'ANIMAL', 1, 1, 0, 0, 0, 'SALUD',   22);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('CASTRACION',              'Castración',                                                  'ANIMAL', 1, 1, 0, 1, 0, NULL,      23);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('DESCOLE',                 'Descole en ovinos',                                           'ANIMAL', 0, 1, 0, 1, 1, NULL,      24);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('SUCIEDAD_TREN',           'Suciedad del tren posterior por diarrea en ovinos de lana',   'ANIMAL', 0, 1, 0, 0, 0, NULL,      25);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('COJERAS',                 'Cojeras',                                                     'ANIMAL', 1, 1, 0, 0, 0, NULL,      26);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('SOBRECRECIMIENTO_PEZUNAS','Sobrecrecimiento de pezuñas',                                 'ANIMAL', 1, 1, 0, 0, 0, NULL,      27);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('RESPUESTA_HUMANO',        'Respuesta a la interacción con el humano',                    'ANIMAL', 1, 1, 0, 0, 0, NULL,      28);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('RESTRINGEN_MOVIMIENTO',   'Elementos que restringen el movimiento',                      'ANIMAL', 1, 1, 0, 0, 0, NULL,      29);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('AISLAMIENTO_SOCIAL',      'Generación de aislamiento social',                            'ANIMAL', 1, 1, 0, 0, 0, NULL,      30);

        -- ---------- MEDIDAS BASADAS EN LA GESTIÓN (10%) ----------
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('MORTALIDAD',                'Mortalidad',                                          'GESTION', 1, 1, 0, 1, 0, NULL, 31);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('MEDICAMENTOS',              'Uso de medicamentos veterinarios',                    'GESTION', 1, 1, 0, 1, 0, NULL, 32);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('PLAN_SANITARIO',            'Plan sanitario',                                      'GESTION', 1, 1, 0, 1, 0, NULL, 33);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('CAPACITACION',              'Conocimiento y capacitación en bienestar animal',     'GESTION', 1, 1, 0, 1, 0, NULL, 34);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('PLAN_CONTINGENCIA',         'Plan de contingencia para falta de agua y alimento',  'GESTION', 1, 1, 0, 1, 0, NULL, 35);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('INTERVENCIONES_QUIRURGICAS','Intervenciones quirúrgicas',                          'GESTION', 1, 1, 0, 1, 1, NULL, 36);
        INSERT INTO BIENESTAR_INDICADOR_CAT (codigo, nombre, tipo_medida, aplica_caprino, aplica_ovino, solo_confinamiento, es_documental, es_binario, fuente_modulo, orden) VALUES ('SACRIFICIO_HUMANITARIO',    'Sacrificio humanitario',                              'GESTION', 1, 1, 0, 1, 1, NULL, 37);
    END IF;
END;
/

COMMIT;

-- ==================================================================
-- Verificación rápida (descomentar para revisar)
-- ==================================================================
-- SELECT tipo_medida, COUNT(*) FROM BIENESTAR_INDICADOR_CAT WHERE aplica_caprino = 1 GROUP BY tipo_medida;
-- SELECT codigo, nombre, fuente_modulo FROM BIENESTAR_INDICADOR_CAT WHERE fuente_modulo IS NOT NULL ORDER BY orden;
-- ==================================================================
-- FIN DEL SCRIPT
-- ==================================================================
