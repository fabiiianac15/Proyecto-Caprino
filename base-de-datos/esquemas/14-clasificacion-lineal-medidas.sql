-- ==================================================================
-- PARCHE 14: Clasificación lineal — medidas corporales (zoometría)
--            y fotos de la medición (2026-11)
--
-- La calificación 1-2-3 es visual. Las medidas en centímetros no se
-- pueden sacar de una foto con precisión (cambian con la distancia, el
-- ángulo y la postura), así que se toman sobre el animal con bastón
-- zoométrico, cinta métrica, compás y calibrador, y la foto queda como
-- evidencia de la lectura.
--
-- 1. CLASIF_MEDIDA_CAT : catálogo de medidas (cómo y con qué medir,
--                        rango normal en cabras lecheras adultas y el
--                        rasgo lineal con el que se relaciona).
-- 2. EVAL_LINEAL_MEDIDA: valor de cada medida en una evaluación.
-- 3. EVAL_LINEAL_FOTO  : nueva vista MEDICION (foto de la cinta o del
--                        bastón marcando la medida).
-- 4. EVALUACION_LINEAL : fecha_modificacion (ahora se puede editar).
--
-- Ejecutar como caprino_user. Es idempotente.
-- ==================================================================

SET DEFINE OFF;

-- ------------------------------------------------------------------
-- 1. CATÁLOGO DE MEDIDAS
-- ------------------------------------------------------------------
BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE CLASIF_MEDIDA_CAT (
            id_medida    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            codigo       VARCHAR2(20) NOT NULL,
            nombre       VARCHAR2(120) NOT NULL,
            grupo        VARCHAR2(10) NOT NULL
                         CHECK (grupo IN (''CUERPO'', ''UBRE'', ''PESO'')),
            unidad       VARCHAR2(5) NOT NULL,
            instrumento  VARCHAR2(80),
            como_medir   VARCHAR2(500),
            min_normal   NUMBER(6,2),
            max_normal   NUMBER(6,2),
            rasgo_rel    VARCHAR2(20),
            orden        NUMBER,
            CONSTRAINT uk_clasif_medida_cod UNIQUE (codigo)
        )';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -955 THEN NULL; ELSE RAISE; END IF;
END;
/

COMMENT ON TABLE  CLASIF_MEDIDA_CAT IS 'Medidas zoométricas que se toman con instrumento durante la clasificación lineal';
COMMENT ON COLUMN CLASIF_MEDIDA_CAT.rasgo_rel IS 'Código del rasgo lineal (CLASIF_RASGO_CAT) que la medida ayuda a calificar';
COMMENT ON COLUMN CLASIF_MEDIDA_CAT.min_normal IS 'Rango habitual en cabras lecheras adultas; fuera de él la pantalla pide revisar la lectura';

-- Datos del catálogo (MERGE: se puede volver a correr para actualizar textos)
MERGE INTO CLASIF_MEDIDA_CAT t
USING (
    SELECT 'ALZ_CRUZ' codigo, 'Alzada a la cruz' nombre, 'CUERPO' grupo, 'cm' unidad,
           'Bastón zoométrico' instrumento,
           'Del piso al punto más alto de la cruz. La cabra parada en piso plano, con las cuatro patas derechas y la cabeza en posición normal. El bastón vertical, pegado a la pata delantera.' como_medir,
           55 min_normal, 95 max_normal, 'ESTAT' rasgo_rel, 1 orden FROM dual
    UNION ALL SELECT 'ALZ_GRUPA', 'Alzada a la grupa', 'CUERPO', 'cm', 'Bastón zoométrico',
           'Del piso a la parte más alta de la grupa, entre los dos huesos de la cadera. Mismo cuidado que la alzada a la cruz.',
           55, 95, 'ANGRU', 2 FROM dual
    UNION ALL SELECT 'LONG_CORP', 'Longitud corporal', 'CUERPO', 'cm', 'Bastón zoométrico o compás grande',
           'Desde la punta del hombro (el encuentro, adelante) hasta la punta de la nalga (el hueso de atrás, a los lados de la cola).',
           55, 100, NULL, 3 FROM dual
    UNION ALL SELECT 'PER_TOR', 'Perímetro torácico', 'CUERPO', 'cm', 'Cinta métrica',
           'Rodear el pecho justo detrás de las patas delanteras, pasando por detrás de la cruz. La cinta ajustada sin apretar; leer cuando la cabra suelta el aire.',
           65, 115, 'PROFUN', 4 FROM dual
    UNION ALL SELECT 'PROF_PECHO', 'Profundidad del pecho', 'CUERPO', 'cm', 'Bastón zoométrico',
           'De la cruz hasta el piso del pecho (esternón), justo detrás del codo. Es la "altura" del cuerpo, no de las patas.',
           24, 42, 'PROFUN', 5 FROM dual
    UNION ALL SELECT 'ANCH_PECHO', 'Ancho del pecho', 'CUERPO', 'cm', 'Compás de brazos o calibrador grande',
           'Vista de frente: distancia entre las dos puntas de los hombros (encuentros).',
           12, 25, 'ANCPEC', 6 FROM dual
    UNION ALL SELECT 'ANCH_GRUPA', 'Ancho de la grupa', 'CUERPO', 'cm', 'Compás de brazos',
           'Vista desde atrás: distancia entre los dos huesos salientes de la cadera (ilíacos).',
           12, 22, 'ANCHGRU', 7 FROM dual
    UNION ALL SELECT 'LONG_GRUPA', 'Largo de la grupa', 'CUERPO', 'cm', 'Compás de brazos',
           'Del mismo lado: desde el hueso de la cadera (ilíaco) hasta la punta de la nalga (isquion).',
           14, 26, 'ANGRU', 8 FROM dual
    UNION ALL SELECT 'PER_CANA', 'Perímetro de la caña', 'CUERPO', 'cm', 'Cinta métrica',
           'Alrededor de la parte más delgada de la pata delantera, entre la rodilla y el menudillo.',
           7, 12, 'CALHU', 9 FROM dual
    UNION ALL SELECT 'PER_UBRE', 'Perímetro de la ubre', 'UBRE', 'cm', 'Cinta métrica',
           'Rodear la ubre por su parte más ancha, en horizontal. Medir siempre a la misma hora respecto al ordeño (mejor antes de ordeñar).',
           30, 80, NULL, 10 FROM dual
    UNION ALL SELECT 'UBRE_PISO', 'Altura del fondo de la ubre al piso', 'UBRE', 'cm', 'Regla o bastón zoométrico',
           'Del piso al punto más bajo de la ubre, sin contar los pezones. Sirve para la profundidad de la ubre: entre más alta, mejor.',
           15, 55, 'PROFUB', 11 FROM dual
    UNION ALL SELECT 'LONG_PEZON', 'Largo del pezón', 'UBRE', 'cm', 'Calibrador (pie de rey) o regla',
           'Desde donde el pezón se une a la ubre hasta la punta. Medir los dos y anotar el promedio.',
           2, 7, NULL, 12 FROM dual
    UNION ALL SELECT 'DIAM_PEZON', 'Grosor del pezón', 'UBRE', 'cm', 'Calibrador (pie de rey)',
           'Diámetro del pezón a la mitad de su largo, sin apretarlo. Medir los dos y anotar el promedio.',
           1, 3.5, 'DIAPE', 13 FROM dual
    UNION ALL SELECT 'DIST_PEZONES', 'Distancia entre pezones', 'UBRE', 'cm', 'Regla o calibrador',
           'Vista desde atrás: entre las puntas de los dos pezones.',
           4, 20, 'COLPE', 14 FROM dual
    UNION ALL SELECT 'PESO_VIVO', 'Peso vivo', 'PESO', 'kg', 'Báscula',
           'Pesar a la cabra sola, mejor en la mañana antes de comer. Si no hay báscula, deje este dato vacío.',
           20, 90, NULL, 15 FROM dual
) s ON (t.codigo = s.codigo)
WHEN MATCHED THEN UPDATE SET
    t.nombre = s.nombre, t.grupo = s.grupo, t.unidad = s.unidad, t.instrumento = s.instrumento,
    t.como_medir = s.como_medir, t.min_normal = s.min_normal, t.max_normal = s.max_normal,
    t.rasgo_rel = s.rasgo_rel, t.orden = s.orden
WHEN NOT MATCHED THEN INSERT
    (codigo, nombre, grupo, unidad, instrumento, como_medir, min_normal, max_normal, rasgo_rel, orden)
    VALUES (s.codigo, s.nombre, s.grupo, s.unidad, s.instrumento, s.como_medir, s.min_normal, s.max_normal, s.rasgo_rel, s.orden);

-- ------------------------------------------------------------------
-- 2. VALOR DE CADA MEDIDA EN UNA EVALUACIÓN
-- ------------------------------------------------------------------
BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE EVAL_LINEAL_MEDIDA (
            id_eval_medida NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            id_evaluacion  NUMBER NOT NULL,
            id_medida      NUMBER NOT NULL,
            valor          NUMBER(6,2) NOT NULL CHECK (valor > 0 AND valor < 300),
            CONSTRAINT fk_evallineal_med_cab FOREIGN KEY (id_evaluacion)
                REFERENCES EVALUACION_LINEAL(id_evaluacion) ON DELETE CASCADE,
            CONSTRAINT fk_evallineal_med_cat FOREIGN KEY (id_medida)
                REFERENCES CLASIF_MEDIDA_CAT(id_medida),
            CONSTRAINT uk_evallineal_med UNIQUE (id_evaluacion, id_medida)
        )';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -955 THEN NULL; ELSE RAISE; END IF;
END;
/

COMMENT ON TABLE EVAL_LINEAL_MEDIDA IS 'Medidas tomadas con instrumento en cada clasificación lineal';

-- ------------------------------------------------------------------
-- 3. NUEVA VISTA DE FOTO: MEDICION
-- ------------------------------------------------------------------
DECLARE
    v_nombre VARCHAR2(128);
BEGIN
    FOR c IN (SELECT constraint_name, search_condition_vc
                FROM user_constraints
               WHERE table_name = 'EVAL_LINEAL_FOTO' AND constraint_type = 'C') LOOP
        IF INSTR(c.search_condition_vc, 'UBRE_POST') > 0 AND INSTR(c.search_condition_vc, 'MEDICION') = 0 THEN
            EXECUTE IMMEDIATE 'ALTER TABLE EVAL_LINEAL_FOTO DROP CONSTRAINT ' || c.constraint_name;
        END IF;
    END LOOP;
    SELECT MAX(constraint_name) INTO v_nombre FROM user_constraints
     WHERE table_name = 'EVAL_LINEAL_FOTO' AND constraint_name = 'CK_EVALLINEAL_FOTO_VISTA';
    IF v_nombre IS NULL THEN
        EXECUTE IMMEDIATE q'[ALTER TABLE EVAL_LINEAL_FOTO ADD CONSTRAINT ck_evallineal_foto_vista
            CHECK (tipo_vista IN ('FRONTAL','LATERAL','POSTERIOR','UBRE_POST','UBRE_LAT','PATAS','MEDICION'))]';
    END IF;
END;
/

-- ------------------------------------------------------------------
-- 4. FECHA DE MODIFICACIÓN (las evaluaciones ahora se pueden editar)
-- ------------------------------------------------------------------
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE EVALUACION_LINEAL ADD (fecha_modificacion TIMESTAMP)';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/

COMMIT;
