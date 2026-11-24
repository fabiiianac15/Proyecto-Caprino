-- ==================================================================
-- PARCHE 18: Clasificación lineal — machos, medidas de referencia por
--            raza y reglas morfométricas (2026-11)
-- Ejecutar como caprino_user. Es idempotente (generado por gen18.py).
--
-- 1. CLASIF_RASGO_CAT.sexo: los rasgos de hembra (método ADGA para
--    cabras lecheras, 100 pts con sistema mamario) y los de macho
--    (escala de reproductores: apariencia 55, fortaleza lechera 30,
--    capacidad 15, sin sistema mamario y con testículos).
-- 2. CLASIF_MEDIDA_CAT.sexo: las medidas de ubre son solo de hembras y
--    la circunferencia escrotal solo de machos. Medida nueva: altura a
--    la punta de la nalga (para calcular el ángulo de la grupa).
-- 3. RAZA_MEDIDA_REF: medida promedio (media) y desviación (de) de un
--    adulto de cada raza y sexo. Son la base para comparar.
--    VALORES INICIALES APROXIMADOS: deben validarse con el docente y
--    ajustarse desde la pantalla "Medidas de referencia por raza".
--    Fila con id_raza NULL = referencia general (ubre y pezones).
-- 4. CLASIF_REGLA_MORFO: cómo una medida califica un rasgo:
--      RAZA: bajo (1) si valor < media - k*de; alto (3) si valor >
--            media + k*de; medio (2) en el resto. sentido MENOR invierte.
--      FIJO: cortes fijos (p. ej. ángulo de grupa en grados).
-- 5. EVAL_LINEAL_DETALLE.origen: MEDIDA (lo llenó la regla) o VISUAL.
-- ==================================================================

SET DEFINE OFF;
ALTER SESSION DISABLE PARALLEL DML;

DECLARE
    PROCEDURE ddl(p VARCHAR2) IS
    BEGIN
        EXECUTE IMMEDIATE p;
    EXCEPTION WHEN OTHERS THEN
        IF SQLCODE IN (-955, -1430, -2264, -2275, -1442) THEN NULL; ELSE RAISE; END IF;
    END;
    PROCEDURE quitar_check(p_tabla VARCHAR2, p_texto VARCHAR2) IS
    BEGIN
        FOR c IN (SELECT constraint_name FROM user_constraints
                   WHERE table_name = p_tabla AND constraint_type = 'C'
                     AND search_condition_vc LIKE '%' || p_texto || '%') LOOP
            EXECUTE IMMEDIATE 'ALTER TABLE ' || p_tabla || ' DROP CONSTRAINT ' || c.constraint_name;
        END LOOP;
    END;
BEGIN
    -- 1. Rasgos por sexo y regiones nuevas
    ddl(q'[ALTER TABLE CLASIF_RASGO_CAT ADD (sexo VARCHAR2(6) DEFAULT 'HEMBRA' NOT NULL)]');
    quitar_check('CLASIF_RASGO_CAT', 'APARIENCIA');
    ddl(q'[ALTER TABLE CLASIF_RASGO_CAT ADD CONSTRAINT ck_rasgo_region
        CHECK (region IN ('APARIENCIA','ESTRUCTURA','MAMARIO','PATAS','CAPACIDAD'))]');
    ddl(q'[ALTER TABLE CLASIF_RASGO_CAT ADD CONSTRAINT ck_rasgo_sexo CHECK (sexo IN ('HEMBRA','MACHO'))]');

    -- 2. Medidas por sexo y grupo nuevo
    ddl(q'[ALTER TABLE CLASIF_MEDIDA_CAT ADD (sexo VARCHAR2(6) DEFAULT 'AMBOS' NOT NULL)]');
    quitar_check('CLASIF_MEDIDA_CAT', 'CUERPO');
    ddl(q'[ALTER TABLE CLASIF_MEDIDA_CAT ADD CONSTRAINT ck_medida_grupo
        CHECK (grupo IN ('CUERPO','UBRE','PESO','TESTICULO'))]');

    -- 3. Referencias por raza
    ddl(q'[CREATE TABLE RAZA_MEDIDA_REF (
            id_ref      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            id_raza     NUMBER,
            sexo        VARCHAR2(6) NOT NULL CHECK (sexo IN ('HEMBRA','MACHO')),
            codigo_medida VARCHAR2(20) NOT NULL,
            media       NUMBER(7,2) NOT NULL,
            de          NUMBER(7,2) NOT NULL,
            fuente      VARCHAR2(200),
            fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_razaref_raza FOREIGN KEY (id_raza) REFERENCES RAZA(id_raza) ON DELETE CASCADE
        )]');
    ddl('CREATE UNIQUE INDEX uk_razaref ON RAZA_MEDIDA_REF (NVL(id_raza, 0), sexo, codigo_medida)');

    -- 4. Reglas morfométricas
    ddl(q'[CREATE TABLE CLASIF_REGLA_MORFO (
            id_regla      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            codigo_rasgo  VARCHAR2(20) NOT NULL,
            calculo       VARCHAR2(20) NOT NULL,
            tipo          VARCHAR2(5) NOT NULL CHECK (tipo IN ('RAZA','FIJO')),
            sentido       VARCHAR2(5) DEFAULT 'MAYOR' NOT NULL CHECK (sentido IN ('MAYOR','MENOR')),
            k             NUMBER(4,2) DEFAULT 1,
            corte_bajo    NUMBER(7,2),
            corte_alto    NUMBER(7,2),
            explicacion   VARCHAR2(400),
            CONSTRAINT uk_regla_rasgo UNIQUE (codigo_rasgo)
        )]');

    -- 5. Origen de cada calificación
    ddl(q'[ALTER TABLE EVAL_LINEAL_DETALLE ADD (origen VARCHAR2(6) DEFAULT 'VISUAL' NOT NULL
        CONSTRAINT ck_evallineal_det_origen CHECK (origen IN ('VISUAL','MEDIDA')))]');
    ddl(q'[ALTER TABLE EVALUACION_LINEAL ADD (sexo VARCHAR2(6) DEFAULT 'HEMBRA' NOT NULL)]');
END;
/

COMMENT ON TABLE RAZA_MEDIDA_REF IS 'Medida promedio y desviación de un adulto por raza y sexo (base para la clasificación por medidas)';
COMMENT ON TABLE CLASIF_REGLA_MORFO IS 'Regla que convierte una medida (o un cálculo con medidas) en la calificación 1/2/3 de un rasgo';
COMMENT ON COLUMN CLASIF_REGLA_MORFO.calculo IS 'Código de medida, o ANGULO_GRUPA (grados a partir de alzada a la grupa, altura a la nalga y largo de grupa)';

UPDATE CLASIF_RASGO_CAT SET sexo = 'HEMBRA' WHERE codigo NOT LIKE 'M\_%' ESCAPE '\';


-- ------------------------------------------------------------------
-- Medidas: sexo y medidas nuevas
-- ------------------------------------------------------------------
UPDATE CLASIF_MEDIDA_CAT SET sexo = 'HEMBRA' WHERE grupo = 'UBRE';
MERGE INTO CLASIF_MEDIDA_CAT t
USING (
    SELECT 'ALT_ISQUION' codigo, 'Altura a la punta de la nalga' nombre, 'CUERPO' grupo, 'cm' unidad,
           'Bastón zoométrico' instrumento,
           'Del piso a la punta de la nalga (isquion), el hueso que sobresale a cada lado de la cola. Con la alzada a la grupa y el largo de la grupa se calcula la inclinación (ángulo) de la grupa.' como_medir,
           45 min_normal, 85 max_normal, 'ANGRU' rasgo_rel, 2.5 orden, 'AMBOS' sexo FROM dual
    UNION ALL SELECT 'CIRC_ESCROTAL', 'Circunferencia escrotal', 'TESTICULO', 'cm', 'Cinta métrica',
           'Bajar los dos testículos al fondo de la bolsa y rodearla por la parte más ancha, sin apretar.',
           18, 36, 'M_TESTIC', 16, 'MACHO' FROM dual
) s ON (t.codigo = s.codigo)
WHEN MATCHED THEN UPDATE SET t.nombre = s.nombre, t.grupo = s.grupo, t.unidad = s.unidad, t.instrumento = s.instrumento,
    t.como_medir = s.como_medir, t.min_normal = s.min_normal, t.max_normal = s.max_normal, t.rasgo_rel = s.rasgo_rel,
    t.orden = s.orden, t.sexo = s.sexo
WHEN NOT MATCHED THEN INSERT (codigo, nombre, grupo, unidad, instrumento, como_medir, min_normal, max_normal, rasgo_rel, orden, sexo)
    VALUES (s.codigo, s.nombre, s.grupo, s.unidad, s.instrumento, s.como_medir, s.min_normal, s.max_normal, s.rasgo_rel, s.orden, s.sexo);
-- El ángulo de grupa se calcula con la nueva medida; la alzada a la grupa ya no se relaciona sola
UPDATE CLASIF_MEDIDA_CAT SET rasgo_rel = NULL WHERE codigo IN ('ALZ_GRUPA', 'LONG_GRUPA');


-- ------------------------------------------------------------------
-- Rasgos de machos (sexo = MACHO)
-- ------------------------------------------------------------------
MERGE INTO CLASIF_RASGO_CAT t
USING (
    SELECT 'M_ESTAT' codigo, 'Estatura (altura a la cruz)' nombre, 'APARIENCIA' region, 55 pts_region, 7 pts_rasgo, 101 orden, 'De lado' vista, 'Qué tan alto es el macho: del piso a la cruz (la parte más alta de la espalda, encima de las patas delanteras).' que_mirar, 'Bajo: más pequeño que los machos adultos de su raza.' desc_1, 'Mediano: como un macho típico de su raza.' desc_2, 'Alto: más grande que un macho típico de su raza.' desc_3 FROM dual
    UNION ALL
    SELECT 'M_ANCHGRU' codigo, 'Ancho de grupa' nombre, 'APARIENCIA' region, 55 pts_region, 6 pts_rasgo, 102 orden, 'Desde atrás' vista, 'Qué tan separados están los dos huesos de la cadera, a cada lado de la cola.' que_mirar, 'Grupa angosta.' desc_1, 'Grupa mediana.' desc_2, 'Grupa ancha y fuerte.' desc_3 FROM dual
    UNION ALL
    SELECT 'M_ANGRU' codigo, 'Ángulo de grupa' nombre, 'APARIENCIA' region, 55 pts_region, 6 pts_rasgo, 103 orden, 'De lado' vista, 'La inclinación de la línea que va de la cadera a la base de la cola.' que_mirar, 'Muy caída: bastante inclinada hacia la cola.' desc_1, 'Un poco inclinada.' desc_2, 'Casi plana.' desc_3 FROM dual
    UNION ALL
    SELECT 'M_TESTIC' codigo, 'Testículos (tamaño y forma)' nombre, 'APARIENCIA' region, 55 pts_region, 12 pts_rasgo, 104 orden, 'Desde atrás' vista, 'Palpe la bolsa: deben ser dos testículos del mismo tamaño, firmes, que bajen bien y sin bultos.' que_mirar, 'Pequeños, desiguales, blandos o con bultos.' desc_1, 'Normales para su edad y raza.' desc_2, 'Grandes, parejos, firmes y bien descolgados.' desc_3 FROM dual
    UNION ALL
    SELECT 'M_PTVP' codigo, 'Patas traseras vista posterior' nombre, 'APARIENCIA' region, 55 pts_region, 8 pts_rasgo, 105 orden, 'Desde atrás' vista, 'Con el macho parado, cómo se ven las patas de atrás.' que_mirar, 'Corvejones juntos y pezuñas hacia afuera ("patas de vaca").' desc_1, 'Corvejones un poco juntos.' desc_2, 'Patas rectas y paralelas.' desc_3 FROM dual
    UNION ALL
    SELECT 'M_PTVL' codigo, 'Patas traseras vista lateral' nombre, 'APARIENCIA' region, 55 pts_region, 7 pts_rasgo, 106 orden, 'De lado' vista, 'Qué tan doblada está la pata de atrás en el corvejón.' que_mirar, 'Pata muy recta.' desc_1, 'Algo doblada.' desc_2, 'Muy doblada / curvada.' desc_3 FROM dual
    UNION ALL
    SELECT 'M_MOVI' codigo, 'Movilidad / aplomos' nombre, 'APARIENCIA' region, 55 pts_region, 9 pts_rasgo, 107 orden, 'Mirándolo caminar' vista, 'Hágalo caminar unos pasos en piso plano. En los machos las patas pesan mucho: debe montar sin dolor.' que_mirar, 'Camina con dificultad: rígido o cojeando.' desc_1, 'Camina normal.' desc_2, 'Camina suelto, con pasos largos y firmes.' desc_3 FROM dual
    UNION ALL
    SELECT 'M_ANGUL' codigo, 'Angulosidad (carácter lechero)' nombre, 'ESTRUCTURA' region, 30 pts_region, 18 pts_rasgo, 108 orden, 'De lado' vista, 'Si tiene aspecto de reproductor lechero: cuello largo, costillas separadas, sin exceso de grasa ni aspecto de "carnudo".' que_mirar, 'Tosco y grueso: costillas juntas, cuello corto.' desc_1, 'Intermedio.' desc_2, 'Fino y anguloso: costillas bien separadas, cuello largo.' desc_3 FROM dual
    UNION ALL
    SELECT 'M_CALHU' codigo, 'Calidad de hueso' nombre, 'ESTRUCTURA' region, 30 pts_region, 12 pts_rasgo, 109 orden, 'De lado' vista, 'Cómo son los huesos de las patas: fuertes, planos y limpios, con articulaciones sin hinchazón.' que_mirar, 'Huesos redondos y finos, o articulaciones hinchadas.' desc_1, 'Normales.' desc_2, 'Huesos fuertes, planos y limpios.' desc_3 FROM dual
    UNION ALL
    SELECT 'M_PROFUN' codigo, 'Profundidad corporal' nombre, 'CAPACIDAD' region, 15 pts_region, 8 pts_rasgo, 110 orden, 'De lado' vista, 'Qué tan hondo es el cuerpo: distancia del lomo a la panza, detrás de las patas delanteras.' que_mirar, 'Poco profundo: se ve "plano".' desc_1, 'Normal.' desc_2, 'Profundo: mucha capacidad.' desc_3 FROM dual
    UNION ALL
    SELECT 'M_ANCPEC' codigo, 'Ancho de pecho' nombre, 'CAPACIDAD' region, 15 pts_region, 7 pts_rasgo, 111 orden, 'De frente' vista, 'El espacio entre las dos patas delanteras (qué tan ancho y fuerte es el pecho).' que_mirar, 'Pecho angosto: patas delanteras muy juntas.' desc_1, 'Ancho normal.' desc_2, 'Pecho ancho y fuerte.' desc_3 FROM dual
) s ON (t.codigo = s.codigo)
WHEN MATCHED THEN UPDATE SET t.nombre = s.nombre, t.region = s.region, t.pts_region = s.pts_region, t.pts_rasgo = s.pts_rasgo,
    t.orden = s.orden, t.vista = s.vista, t.que_mirar = s.que_mirar, t.desc_1 = s.desc_1, t.desc_2 = s.desc_2, t.desc_3 = s.desc_3,
    t.sexo = 'MACHO'
WHEN NOT MATCHED THEN INSERT (codigo, nombre, region, pts_region, pts_rasgo, orden, vista, que_mirar, desc_1, desc_2, desc_3, sexo)
    VALUES (s.codigo, s.nombre, s.region, s.pts_region, s.pts_rasgo, s.orden, s.vista, s.que_mirar, s.desc_1, s.desc_2, s.desc_3, 'MACHO');


-- ------------------------------------------------------------------
-- Reglas morfométricas
-- ------------------------------------------------------------------
MERGE INTO CLASIF_REGLA_MORFO t
USING (
    SELECT 'ESTAT' codigo_rasgo, 'ALZ_CRUZ' calculo, 'RAZA' tipo, 'MAYOR' sentido, 1 k, NULL corte_bajo, NULL corte_alto, 'Se compara la alzada a la cruz con la de una cabra adulta típica de su raza.' explicacion FROM dual
    UNION ALL
    SELECT 'ANCPEC' codigo_rasgo, 'ANCH_PECHO' calculo, 'RAZA' tipo, 'MAYOR' sentido, 1 k, NULL corte_bajo, NULL corte_alto, 'Se compara el ancho del pecho con el típico de su raza.' explicacion FROM dual
    UNION ALL
    SELECT 'PROFUN' codigo_rasgo, 'PROF_PECHO' calculo, 'RAZA' tipo, 'MAYOR' sentido, 1 k, NULL corte_bajo, NULL corte_alto, 'Se compara la profundidad del pecho con la típica de su raza.' explicacion FROM dual
    UNION ALL
    SELECT 'ANCHGRU' codigo_rasgo, 'ANCH_GRUPA' calculo, 'RAZA' tipo, 'MAYOR' sentido, 1 k, NULL corte_bajo, NULL corte_alto, 'Se compara el ancho de la grupa con el típico de su raza.' explicacion FROM dual
    UNION ALL
    SELECT 'ANGRU' codigo_rasgo, 'ANGULO_GRUPA' calculo, 'FIJO' tipo, 'MENOR' sentido, 1 k, 10 corte_bajo, 30 corte_alto, 'Se calcula la inclinación de la grupa en grados con la alzada a la grupa, la altura a la nalga y el largo de la grupa. Menos de 10° = casi plana (alto); de 10° a 30° = un poco inclinada (medio); más de 30° = muy caída (bajo).' explicacion FROM dual
    UNION ALL
    SELECT 'PROFUB' codigo_rasgo, 'UBRE_PISO' calculo, 'RAZA' tipo, 'MAYOR' sentido, 1 k, NULL corte_bajo, NULL corte_alto, 'Entre más alto queda el fondo de la ubre respecto al piso, mejor (alto).' explicacion FROM dual
    UNION ALL
    SELECT 'DIAPE' codigo_rasgo, 'DIAM_PEZON' calculo, 'RAZA' tipo, 'MAYOR' sentido, 1 k, NULL corte_bajo, NULL corte_alto, 'Se compara el grosor del pezón con el habitual en cabras lecheras.' explicacion FROM dual
    UNION ALL
    SELECT 'M_ESTAT' codigo_rasgo, 'ALZ_CRUZ' calculo, 'RAZA' tipo, 'MAYOR' sentido, 1 k, NULL corte_bajo, NULL corte_alto, 'Se compara la alzada a la cruz con la de un macho adulto típico de su raza.' explicacion FROM dual
    UNION ALL
    SELECT 'M_ANCHGRU' codigo_rasgo, 'ANCH_GRUPA' calculo, 'RAZA' tipo, 'MAYOR' sentido, 1 k, NULL corte_bajo, NULL corte_alto, 'Se compara el ancho de la grupa con el típico de los machos de su raza.' explicacion FROM dual
    UNION ALL
    SELECT 'M_ANGRU' codigo_rasgo, 'ANGULO_GRUPA' calculo, 'FIJO' tipo, 'MENOR' sentido, 1 k, 10 corte_bajo, 30 corte_alto, 'Inclinación de la grupa en grados. Menos de 10° = casi plana (alto); de 10° a 30° = un poco inclinada (medio); más de 30° = muy caída (bajo).' explicacion FROM dual
    UNION ALL
    SELECT 'M_TESTIC' codigo_rasgo, 'CIRC_ESCROTAL' calculo, 'RAZA' tipo, 'MAYOR' sentido, 1 k, NULL corte_bajo, NULL corte_alto, 'Se compara la circunferencia escrotal con la típica de un macho adulto de su raza.' explicacion FROM dual
    UNION ALL
    SELECT 'M_PROFUN' codigo_rasgo, 'PROF_PECHO' calculo, 'RAZA' tipo, 'MAYOR' sentido, 1 k, NULL corte_bajo, NULL corte_alto, 'Se compara la profundidad del pecho con la típica de los machos de su raza.' explicacion FROM dual
    UNION ALL
    SELECT 'M_ANCPEC' codigo_rasgo, 'ANCH_PECHO' calculo, 'RAZA' tipo, 'MAYOR' sentido, 1 k, NULL corte_bajo, NULL corte_alto, 'Se compara el ancho del pecho con el típico de los machos de su raza.' explicacion FROM dual
) s ON (t.codigo_rasgo = s.codigo_rasgo)
WHEN MATCHED THEN UPDATE SET t.calculo = s.calculo, t.tipo = s.tipo, t.sentido = s.sentido, t.k = s.k,
    t.corte_bajo = s.corte_bajo, t.corte_alto = s.corte_alto, t.explicacion = s.explicacion
WHEN NOT MATCHED THEN INSERT (codigo_rasgo, calculo, tipo, sentido, k, corte_bajo, corte_alto, explicacion)
    VALUES (s.codigo_rasgo, s.calculo, s.tipo, s.sentido, s.k, s.corte_bajo, s.corte_alto, s.explicacion);


-- ------------------------------------------------------------------
-- Referencias por raza (solo se insertan si no existen: no pisan los
-- valores que el docente ya haya ajustado desde la aplicación)
-- ------------------------------------------------------------------

-- Saanen
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'), 'HEMBRA', 'ALZ_CRUZ', 76, 3.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALZ_CRUZ')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'), 'HEMBRA', 'ALZ_GRUPA', 77.5, 3.9, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALZ_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'), 'HEMBRA', 'ALT_ISQUION', 66.9, 4.0, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALT_ISQUION')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'), 'HEMBRA', 'LONG_CORP', 79.0, 4.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_CORP')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'), 'HEMBRA', 'PER_TOR', 88.9, 5.3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_TOR')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'), 'HEMBRA', 'PROF_PECHO', 33.4, 2.3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PROF_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'), 'HEMBRA', 'ANCH_PECHO', 17.5, 1.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ANCH_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'), 'HEMBRA', 'ANCH_GRUPA', 16.7, 1.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ANCH_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'), 'HEMBRA', 'LONG_GRUPA', 19.8, 1.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'), 'HEMBRA', 'PER_CANA', 8.7, 0.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_CANA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'), 'HEMBRA', 'PESO_VIVO', 60, 8.4, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PESO_VIVO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'), 'MACHO', 'ALZ_CRUZ', 88, 4.4, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALZ_CRUZ')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'), 'MACHO', 'ALZ_GRUPA', 89.8, 4.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALZ_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'), 'MACHO', 'ALT_ISQUION', 77.4, 4.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALT_ISQUION')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'), 'MACHO', 'LONG_CORP', 91.5, 5.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'LONG_CORP')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'), 'MACHO', 'PER_TOR', 103.0, 6.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PER_TOR')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'), 'MACHO', 'PROF_PECHO', 38.7, 2.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PROF_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'), 'MACHO', 'ANCH_PECHO', 20.2, 2.0, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ANCH_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'), 'MACHO', 'ANCH_GRUPA', 19.4, 1.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ANCH_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'), 'MACHO', 'LONG_GRUPA', 22.9, 1.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'LONG_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'), 'MACHO', 'PER_CANA', 11.0, 0.9, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PER_CANA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'), 'MACHO', 'PESO_VIVO', 85, 11.9, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PESO_VIVO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'), 'MACHO', 'CIRC_ESCROTAL', 28, 2.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'CIRC_ESCROTAL')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Saanen') IS NOT NULL OR 1=0);
-- Alpina
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'), 'HEMBRA', 'ALZ_CRUZ', 74, 3.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALZ_CRUZ')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'), 'HEMBRA', 'ALZ_GRUPA', 75.5, 3.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALZ_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'), 'HEMBRA', 'ALT_ISQUION', 65.1, 3.9, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALT_ISQUION')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'), 'HEMBRA', 'LONG_CORP', 77.0, 4.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_CORP')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'), 'HEMBRA', 'PER_TOR', 86.6, 5.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_TOR')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'), 'HEMBRA', 'PROF_PECHO', 32.6, 2.3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PROF_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'), 'HEMBRA', 'ANCH_PECHO', 17.0, 1.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ANCH_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'), 'HEMBRA', 'ANCH_GRUPA', 16.3, 1.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ANCH_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'), 'HEMBRA', 'LONG_GRUPA', 19.2, 1.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'), 'HEMBRA', 'PER_CANA', 8.5, 0.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_CANA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'), 'HEMBRA', 'PESO_VIVO', 55, 7.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PESO_VIVO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'), 'MACHO', 'ALZ_CRUZ', 85, 4.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALZ_CRUZ')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'), 'MACHO', 'ALZ_GRUPA', 86.7, 4.3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALZ_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'), 'MACHO', 'ALT_ISQUION', 74.8, 4.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALT_ISQUION')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'), 'MACHO', 'LONG_CORP', 88.4, 5.3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'LONG_CORP')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'), 'MACHO', 'PER_TOR', 99.4, 6.0, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PER_TOR')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'), 'MACHO', 'PROF_PECHO', 37.4, 2.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PROF_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'), 'MACHO', 'ANCH_PECHO', 19.6, 2.0, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ANCH_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'), 'MACHO', 'ANCH_GRUPA', 18.7, 1.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ANCH_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'), 'MACHO', 'LONG_GRUPA', 22.1, 1.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'LONG_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'), 'MACHO', 'PER_CANA', 10.6, 0.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PER_CANA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'), 'MACHO', 'PESO_VIVO', 75, 10.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PESO_VIVO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'), 'MACHO', 'CIRC_ESCROTAL', 27, 2.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'CIRC_ESCROTAL')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Alpina') IS NOT NULL OR 1=0);
-- Toggenburg
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'), 'HEMBRA', 'ALZ_CRUZ', 70, 3.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALZ_CRUZ')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'), 'HEMBRA', 'ALZ_GRUPA', 71.4, 3.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALZ_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'), 'HEMBRA', 'ALT_ISQUION', 61.6, 3.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALT_ISQUION')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'), 'HEMBRA', 'LONG_CORP', 72.8, 4.4, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_CORP')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'), 'HEMBRA', 'PER_TOR', 81.9, 4.9, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_TOR')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'), 'HEMBRA', 'PROF_PECHO', 30.8, 2.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PROF_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'), 'HEMBRA', 'ANCH_PECHO', 16.1, 1.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ANCH_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'), 'HEMBRA', 'ANCH_GRUPA', 15.4, 1.4, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ANCH_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'), 'HEMBRA', 'LONG_GRUPA', 18.2, 1.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'), 'HEMBRA', 'PER_CANA', 8.1, 0.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_CANA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'), 'HEMBRA', 'PESO_VIVO', 50, 7.0, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PESO_VIVO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'), 'MACHO', 'ALZ_CRUZ', 82, 4.1, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALZ_CRUZ')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'), 'MACHO', 'ALZ_GRUPA', 83.6, 4.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALZ_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'), 'MACHO', 'ALT_ISQUION', 72.2, 4.3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALT_ISQUION')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'), 'MACHO', 'LONG_CORP', 85.3, 5.1, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'LONG_CORP')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'), 'MACHO', 'PER_TOR', 95.9, 5.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PER_TOR')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'), 'MACHO', 'PROF_PECHO', 36.1, 2.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PROF_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'), 'MACHO', 'ANCH_PECHO', 18.9, 1.9, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ANCH_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'), 'MACHO', 'ANCH_GRUPA', 18.0, 1.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ANCH_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'), 'MACHO', 'LONG_GRUPA', 21.3, 1.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'LONG_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'), 'MACHO', 'PER_CANA', 10.2, 0.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PER_CANA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'), 'MACHO', 'PESO_VIVO', 70, 9.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PESO_VIVO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'), 'MACHO', 'CIRC_ESCROTAL', 26, 2.1, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'CIRC_ESCROTAL')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Toggenburg') IS NOT NULL OR 1=0);
-- Murciano-Granadina
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'), 'HEMBRA', 'ALZ_CRUZ', 70, 3.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALZ_CRUZ')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'), 'HEMBRA', 'ALZ_GRUPA', 71.4, 3.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALZ_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'), 'HEMBRA', 'ALT_ISQUION', 61.6, 3.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALT_ISQUION')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'), 'HEMBRA', 'LONG_CORP', 72.8, 4.4, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_CORP')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'), 'HEMBRA', 'PER_TOR', 79.4, 4.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_TOR')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'), 'HEMBRA', 'PROF_PECHO', 30.8, 2.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PROF_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'), 'HEMBRA', 'ANCH_PECHO', 15.6, 1.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ANCH_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'), 'HEMBRA', 'ANCH_GRUPA', 14.9, 1.3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ANCH_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'), 'HEMBRA', 'LONG_GRUPA', 18.2, 1.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'), 'HEMBRA', 'PER_CANA', 8.1, 0.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_CANA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'), 'HEMBRA', 'PESO_VIVO', 45, 6.3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PESO_VIVO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'), 'MACHO', 'ALZ_CRUZ', 80, 4.0, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALZ_CRUZ')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'), 'MACHO', 'ALZ_GRUPA', 81.6, 4.1, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALZ_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'), 'MACHO', 'ALT_ISQUION', 70.4, 4.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALT_ISQUION')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'), 'MACHO', 'LONG_CORP', 83.2, 5.0, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'LONG_CORP')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'), 'MACHO', 'PER_TOR', 91.7, 5.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PER_TOR')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'), 'MACHO', 'PROF_PECHO', 35.2, 2.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PROF_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'), 'MACHO', 'ANCH_PECHO', 18.0, 1.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ANCH_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'), 'MACHO', 'ANCH_GRUPA', 17.2, 1.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ANCH_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'), 'MACHO', 'LONG_GRUPA', 20.8, 1.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'LONG_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'), 'MACHO', 'PER_CANA', 10.0, 0.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PER_CANA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'), 'MACHO', 'PESO_VIVO', 65, 9.1, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PESO_VIVO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'), 'MACHO', 'CIRC_ESCROTAL', 26, 2.1, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'CIRC_ESCROTAL')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Murciano-Granadina') IS NOT NULL OR 1=0);
-- Lamancha
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'), 'HEMBRA', 'ALZ_CRUZ', 72, 3.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALZ_CRUZ')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'), 'HEMBRA', 'ALZ_GRUPA', 73.4, 3.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALZ_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'), 'HEMBRA', 'ALT_ISQUION', 63.4, 3.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALT_ISQUION')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'), 'HEMBRA', 'LONG_CORP', 74.9, 4.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_CORP')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'), 'HEMBRA', 'PER_TOR', 84.2, 5.1, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_TOR')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'), 'HEMBRA', 'PROF_PECHO', 31.7, 2.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PROF_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'), 'HEMBRA', 'ANCH_PECHO', 16.6, 1.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ANCH_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'), 'HEMBRA', 'ANCH_GRUPA', 15.8, 1.4, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ANCH_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'), 'HEMBRA', 'LONG_GRUPA', 18.7, 1.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'), 'HEMBRA', 'PER_CANA', 8.3, 0.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_CANA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'), 'HEMBRA', 'PESO_VIVO', 52, 7.3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PESO_VIVO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'), 'MACHO', 'ALZ_CRUZ', 83, 4.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALZ_CRUZ')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'), 'MACHO', 'ALZ_GRUPA', 84.7, 4.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALZ_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'), 'MACHO', 'ALT_ISQUION', 73.0, 4.4, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALT_ISQUION')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'), 'MACHO', 'LONG_CORP', 86.3, 5.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'LONG_CORP')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'), 'MACHO', 'PER_TOR', 97.1, 5.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PER_TOR')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'), 'MACHO', 'PROF_PECHO', 36.5, 2.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PROF_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'), 'MACHO', 'ANCH_PECHO', 19.1, 1.9, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ANCH_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'), 'MACHO', 'ANCH_GRUPA', 18.3, 1.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ANCH_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'), 'MACHO', 'LONG_GRUPA', 21.6, 1.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'LONG_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'), 'MACHO', 'PER_CANA', 10.4, 0.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PER_CANA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'), 'MACHO', 'PESO_VIVO', 72, 10.1, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PESO_VIVO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'), 'MACHO', 'CIRC_ESCROTAL', 27, 2.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'CIRC_ESCROTAL')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Lamancha') IS NOT NULL OR 1=0);
-- Oberhasli
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'), 'HEMBRA', 'ALZ_CRUZ', 70, 3.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALZ_CRUZ')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'), 'HEMBRA', 'ALZ_GRUPA', 71.4, 3.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALZ_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'), 'HEMBRA', 'ALT_ISQUION', 61.6, 3.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALT_ISQUION')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'), 'HEMBRA', 'LONG_CORP', 72.8, 4.4, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_CORP')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'), 'HEMBRA', 'PER_TOR', 81.9, 4.9, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_TOR')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'), 'HEMBRA', 'PROF_PECHO', 30.8, 2.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PROF_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'), 'HEMBRA', 'ANCH_PECHO', 16.1, 1.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ANCH_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'), 'HEMBRA', 'ANCH_GRUPA', 15.4, 1.4, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ANCH_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'), 'HEMBRA', 'LONG_GRUPA', 18.2, 1.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'), 'HEMBRA', 'PER_CANA', 8.1, 0.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_CANA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'), 'HEMBRA', 'PESO_VIVO', 50, 7.0, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PESO_VIVO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'), 'MACHO', 'ALZ_CRUZ', 80, 4.0, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALZ_CRUZ')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'), 'MACHO', 'ALZ_GRUPA', 81.6, 4.1, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALZ_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'), 'MACHO', 'ALT_ISQUION', 70.4, 4.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALT_ISQUION')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'), 'MACHO', 'LONG_CORP', 83.2, 5.0, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'LONG_CORP')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'), 'MACHO', 'PER_TOR', 93.6, 5.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PER_TOR')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'), 'MACHO', 'PROF_PECHO', 35.2, 2.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PROF_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'), 'MACHO', 'ANCH_PECHO', 18.4, 1.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ANCH_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'), 'MACHO', 'ANCH_GRUPA', 17.6, 1.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ANCH_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'), 'MACHO', 'LONG_GRUPA', 20.8, 1.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'LONG_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'), 'MACHO', 'PER_CANA', 10.0, 0.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PER_CANA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'), 'MACHO', 'PESO_VIVO', 68, 9.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PESO_VIVO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'), 'MACHO', 'CIRC_ESCROTAL', 26, 2.1, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'CIRC_ESCROTAL')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Oberhasli') IS NOT NULL OR 1=0);
-- Anglonubiana
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'), 'HEMBRA', 'ALZ_CRUZ', 76, 3.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALZ_CRUZ')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'), 'HEMBRA', 'ALZ_GRUPA', 77.5, 3.9, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALZ_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'), 'HEMBRA', 'ALT_ISQUION', 66.9, 4.0, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALT_ISQUION')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'), 'HEMBRA', 'LONG_CORP', 79.0, 4.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_CORP')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'), 'HEMBRA', 'PER_TOR', 88.9, 5.3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_TOR')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'), 'HEMBRA', 'PROF_PECHO', 33.4, 2.3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PROF_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'), 'HEMBRA', 'ANCH_PECHO', 17.5, 1.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ANCH_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'), 'HEMBRA', 'ANCH_GRUPA', 16.7, 1.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ANCH_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'), 'HEMBRA', 'LONG_GRUPA', 19.8, 1.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'), 'HEMBRA', 'PER_CANA', 8.7, 0.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_CANA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'), 'HEMBRA', 'PESO_VIVO', 60, 8.4, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PESO_VIVO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'), 'MACHO', 'ALZ_CRUZ', 88, 4.4, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALZ_CRUZ')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'), 'MACHO', 'ALZ_GRUPA', 89.8, 4.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALZ_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'), 'MACHO', 'ALT_ISQUION', 77.4, 4.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALT_ISQUION')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'), 'MACHO', 'LONG_CORP', 91.5, 5.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'LONG_CORP')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'), 'MACHO', 'PER_TOR', 103.0, 6.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PER_TOR')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'), 'MACHO', 'PROF_PECHO', 38.7, 2.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PROF_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'), 'MACHO', 'ANCH_PECHO', 20.2, 2.0, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ANCH_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'), 'MACHO', 'ANCH_GRUPA', 19.4, 1.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ANCH_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'), 'MACHO', 'LONG_GRUPA', 22.9, 1.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'LONG_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'), 'MACHO', 'PER_CANA', 11.0, 0.9, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PER_CANA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'), 'MACHO', 'PESO_VIVO', 80, 11.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PESO_VIVO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'), 'MACHO', 'CIRC_ESCROTAL', 28, 2.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'CIRC_ESCROTAL')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Anglonubiana') IS NOT NULL OR 1=0);
-- Boer
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'), 'HEMBRA', 'ALZ_CRUZ', 70, 3.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALZ_CRUZ')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'), 'HEMBRA', 'ALZ_GRUPA', 71.4, 3.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALZ_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'), 'HEMBRA', 'ALT_ISQUION', 61.6, 3.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALT_ISQUION')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'), 'HEMBRA', 'LONG_CORP', 72.8, 4.4, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_CORP')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'), 'HEMBRA', 'PER_TOR', 91.7, 5.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_TOR')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'), 'HEMBRA', 'PROF_PECHO', 30.8, 2.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PROF_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'), 'HEMBRA', 'ANCH_PECHO', 18.0, 1.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ANCH_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'), 'HEMBRA', 'ANCH_GRUPA', 17.2, 1.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ANCH_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'), 'HEMBRA', 'LONG_GRUPA', 18.2, 1.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'), 'HEMBRA', 'PER_CANA', 8.1, 0.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_CANA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'), 'HEMBRA', 'PESO_VIVO', 65, 9.1, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PESO_VIVO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'), 'MACHO', 'ALZ_CRUZ', 80, 4.0, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALZ_CRUZ')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'), 'MACHO', 'ALZ_GRUPA', 81.6, 4.1, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALZ_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'), 'MACHO', 'ALT_ISQUION', 70.4, 4.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALT_ISQUION')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'), 'MACHO', 'LONG_CORP', 83.2, 5.0, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'LONG_CORP')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'), 'MACHO', 'PER_TOR', 107.6, 6.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PER_TOR')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'), 'MACHO', 'PROF_PECHO', 35.2, 2.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PROF_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'), 'MACHO', 'ANCH_PECHO', 21.2, 2.1, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ANCH_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'), 'MACHO', 'ANCH_GRUPA', 20.2, 1.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ANCH_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'), 'MACHO', 'LONG_GRUPA', 20.8, 1.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'LONG_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'), 'MACHO', 'PER_CANA', 10.0, 0.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PER_CANA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'), 'MACHO', 'PESO_VIVO', 100, 14.0, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PESO_VIVO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'), 'MACHO', 'CIRC_ESCROTAL', 30, 2.4, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'CIRC_ESCROTAL')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Boer') IS NOT NULL OR 1=0);
-- Kiko
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'), 'HEMBRA', 'ALZ_CRUZ', 68, 3.4, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALZ_CRUZ')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'), 'HEMBRA', 'ALZ_GRUPA', 69.4, 3.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALZ_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'), 'HEMBRA', 'ALT_ISQUION', 59.8, 3.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALT_ISQUION')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'), 'HEMBRA', 'LONG_CORP', 70.7, 4.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_CORP')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'), 'HEMBRA', 'PER_TOR', 85.1, 5.1, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_TOR')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'), 'HEMBRA', 'PROF_PECHO', 29.9, 2.1, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PROF_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'), 'HEMBRA', 'ANCH_PECHO', 16.7, 1.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ANCH_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'), 'HEMBRA', 'ANCH_GRUPA', 16.0, 1.4, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ANCH_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'), 'HEMBRA', 'LONG_GRUPA', 17.7, 1.4, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'), 'HEMBRA', 'PER_CANA', 7.8, 0.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_CANA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'), 'HEMBRA', 'PESO_VIVO', 55, 7.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PESO_VIVO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'), 'MACHO', 'ALZ_CRUZ', 78, 3.9, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALZ_CRUZ')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'), 'MACHO', 'ALZ_GRUPA', 79.6, 4.0, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALZ_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'), 'MACHO', 'ALT_ISQUION', 68.6, 4.1, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALT_ISQUION')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'), 'MACHO', 'LONG_CORP', 81.1, 4.9, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'LONG_CORP')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'), 'MACHO', 'PER_TOR', 100.4, 6.0, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PER_TOR')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'), 'MACHO', 'PROF_PECHO', 34.3, 2.4, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PROF_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'), 'MACHO', 'ANCH_PECHO', 19.7, 2.0, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ANCH_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'), 'MACHO', 'ANCH_GRUPA', 18.9, 1.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ANCH_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'), 'MACHO', 'LONG_GRUPA', 20.3, 1.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'LONG_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'), 'MACHO', 'PER_CANA', 9.8, 0.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PER_CANA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'), 'MACHO', 'PESO_VIVO', 85, 11.9, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PESO_VIVO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'), 'MACHO', 'CIRC_ESCROTAL', 29, 2.3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'CIRC_ESCROTAL')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Kiko') IS NOT NULL OR 1=0);
-- Spanish
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'), 'HEMBRA', 'ALZ_CRUZ', 63, 3.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALZ_CRUZ')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'), 'HEMBRA', 'ALZ_GRUPA', 64.3, 3.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALZ_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'), 'HEMBRA', 'ALT_ISQUION', 55.4, 3.3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALT_ISQUION')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'), 'HEMBRA', 'LONG_CORP', 65.5, 3.9, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_CORP')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'), 'HEMBRA', 'PER_TOR', 75.9, 4.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_TOR')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'), 'HEMBRA', 'PROF_PECHO', 27.7, 1.9, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PROF_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'), 'HEMBRA', 'ANCH_PECHO', 14.9, 1.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ANCH_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'), 'HEMBRA', 'ANCH_GRUPA', 14.3, 1.3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ANCH_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'), 'HEMBRA', 'LONG_GRUPA', 16.4, 1.3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'), 'HEMBRA', 'PER_CANA', 7.2, 0.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_CANA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'), 'HEMBRA', 'PESO_VIVO', 40, 5.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PESO_VIVO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'), 'MACHO', 'ALZ_CRUZ', 72, 3.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALZ_CRUZ')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'), 'MACHO', 'ALZ_GRUPA', 73.4, 3.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALZ_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'), 'MACHO', 'ALT_ISQUION', 63.4, 3.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALT_ISQUION')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'), 'MACHO', 'LONG_CORP', 74.9, 4.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'LONG_CORP')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'), 'MACHO', 'PER_TOR', 88.5, 5.3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PER_TOR')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'), 'MACHO', 'PROF_PECHO', 31.7, 2.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PROF_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'), 'MACHO', 'ANCH_PECHO', 17.4, 1.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ANCH_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'), 'MACHO', 'ANCH_GRUPA', 16.6, 1.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ANCH_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'), 'MACHO', 'LONG_GRUPA', 18.7, 1.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'LONG_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'), 'MACHO', 'PER_CANA', 9.0, 0.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PER_CANA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'), 'MACHO', 'PESO_VIVO', 60, 8.4, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PESO_VIVO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'), 'MACHO', 'CIRC_ESCROTAL', 26, 2.1, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'CIRC_ESCROTAL')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Spanish') IS NOT NULL OR 1=0);
-- Damascus
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'), 'HEMBRA', 'ALZ_CRUZ', 76, 3.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALZ_CRUZ')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'), 'HEMBRA', 'ALZ_GRUPA', 77.5, 3.9, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALZ_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'), 'HEMBRA', 'ALT_ISQUION', 66.9, 4.0, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALT_ISQUION')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'), 'HEMBRA', 'LONG_CORP', 79.0, 4.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_CORP')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'), 'HEMBRA', 'PER_TOR', 88.9, 5.3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_TOR')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'), 'HEMBRA', 'PROF_PECHO', 33.4, 2.3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PROF_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'), 'HEMBRA', 'ANCH_PECHO', 17.5, 1.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ANCH_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'), 'HEMBRA', 'ANCH_GRUPA', 16.7, 1.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ANCH_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'), 'HEMBRA', 'LONG_GRUPA', 19.8, 1.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'), 'HEMBRA', 'PER_CANA', 8.7, 0.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_CANA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'), 'HEMBRA', 'PESO_VIVO', 60, 8.4, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PESO_VIVO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'), 'MACHO', 'ALZ_CRUZ', 88, 4.4, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALZ_CRUZ')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'), 'MACHO', 'ALZ_GRUPA', 89.8, 4.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALZ_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'), 'MACHO', 'ALT_ISQUION', 77.4, 4.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALT_ISQUION')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'), 'MACHO', 'LONG_CORP', 91.5, 5.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'LONG_CORP')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'), 'MACHO', 'PER_TOR', 103.0, 6.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PER_TOR')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'), 'MACHO', 'PROF_PECHO', 38.7, 2.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PROF_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'), 'MACHO', 'ANCH_PECHO', 20.2, 2.0, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ANCH_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'), 'MACHO', 'ANCH_GRUPA', 19.4, 1.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ANCH_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'), 'MACHO', 'LONG_GRUPA', 22.9, 1.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'LONG_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'), 'MACHO', 'PER_CANA', 11.0, 0.9, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PER_CANA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'), 'MACHO', 'PESO_VIVO', 80, 11.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PESO_VIVO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'), 'MACHO', 'CIRC_ESCROTAL', 28, 2.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'CIRC_ESCROTAL')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Damascus') IS NOT NULL OR 1=0);
-- Criolla Santandereana
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'), 'HEMBRA', 'ALZ_CRUZ', 62, 3.1, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALZ_CRUZ')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'), 'HEMBRA', 'ALZ_GRUPA', 63.2, 3.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALZ_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'), 'HEMBRA', 'ALT_ISQUION', 54.6, 3.3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALT_ISQUION')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'), 'HEMBRA', 'LONG_CORP', 64.5, 3.9, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_CORP')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'), 'HEMBRA', 'PER_TOR', 72.5, 4.3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_TOR')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'), 'HEMBRA', 'PROF_PECHO', 27.3, 1.9, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PROF_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'), 'HEMBRA', 'ANCH_PECHO', 14.3, 1.4, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ANCH_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'), 'HEMBRA', 'ANCH_GRUPA', 13.6, 1.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ANCH_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'), 'HEMBRA', 'LONG_GRUPA', 16.1, 1.3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'), 'HEMBRA', 'PER_CANA', 7.1, 0.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_CANA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'), 'HEMBRA', 'PESO_VIVO', 35, 4.9, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PESO_VIVO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'), 'MACHO', 'ALZ_CRUZ', 70, 3.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALZ_CRUZ')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'), 'MACHO', 'ALZ_GRUPA', 71.4, 3.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALZ_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'), 'MACHO', 'ALT_ISQUION', 61.6, 3.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALT_ISQUION')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'), 'MACHO', 'LONG_CORP', 72.8, 4.4, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'LONG_CORP')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'), 'MACHO', 'PER_TOR', 83.5, 5.0, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PER_TOR')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'), 'MACHO', 'PROF_PECHO', 30.8, 2.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PROF_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'), 'MACHO', 'ANCH_PECHO', 16.4, 1.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ANCH_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'), 'MACHO', 'ANCH_GRUPA', 15.7, 1.4, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ANCH_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'), 'MACHO', 'LONG_GRUPA', 18.2, 1.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'LONG_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'), 'MACHO', 'PER_CANA', 8.8, 0.7, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PER_CANA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'), 'MACHO', 'PESO_VIVO', 50, 7.0, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PESO_VIVO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'), 'MACHO', 'CIRC_ESCROTAL', 24, 1.9, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'CIRC_ESCROTAL')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Criolla Santandereana') IS NOT NULL OR 1=0);
-- Nigora
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'), 'HEMBRA', 'ALZ_CRUZ', 58, 2.9, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALZ_CRUZ')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'), 'HEMBRA', 'ALZ_GRUPA', 59.2, 3.0, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALZ_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'), 'HEMBRA', 'ALT_ISQUION', 51.0, 3.1, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ALT_ISQUION')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'), 'HEMBRA', 'LONG_CORP', 60.3, 3.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_CORP')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'), 'HEMBRA', 'PER_TOR', 67.9, 4.1, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_TOR')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'), 'HEMBRA', 'PROF_PECHO', 25.5, 1.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PROF_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'), 'HEMBRA', 'ANCH_PECHO', 13.3, 1.3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ANCH_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'), 'HEMBRA', 'ANCH_GRUPA', 12.8, 1.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'ANCH_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'), 'HEMBRA', 'LONG_GRUPA', 15.1, 1.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'), 'HEMBRA', 'PER_CANA', 6.7, 0.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_CANA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'), 'HEMBRA', 'PESO_VIVO', 32, 4.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'),0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PESO_VIVO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'), 'MACHO', 'ALZ_CRUZ', 64, 3.2, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALZ_CRUZ')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'), 'MACHO', 'ALZ_GRUPA', 65.3, 3.3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALZ_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'), 'MACHO', 'ALT_ISQUION', 56.3, 3.4, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ALT_ISQUION')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'), 'MACHO', 'LONG_CORP', 66.6, 4.0, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'LONG_CORP')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'), 'MACHO', 'PER_TOR', 74.9, 4.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PER_TOR')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'), 'MACHO', 'PROF_PECHO', 28.2, 2.0, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PROF_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'), 'MACHO', 'ANCH_PECHO', 14.7, 1.5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ANCH_PECHO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'), 'MACHO', 'ANCH_GRUPA', 14.1, 1.3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'ANCH_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'), 'MACHO', 'LONG_GRUPA', 16.6, 1.3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'LONG_GRUPA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'), 'MACHO', 'PER_CANA', 8.0, 0.6, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PER_CANA')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'), 'MACHO', 'PESO_VIVO', 45, 6.3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'PESO_VIVO')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora') IS NOT NULL OR 1=0);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT (SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'), 'MACHO', 'CIRC_ESCROTAL', 22, 1.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora'),0) AND x.sexo = 'MACHO' AND x.codigo_medida = 'CIRC_ESCROTAL')
     AND ((SELECT id_raza FROM RAZA WHERE nombre_raza = 'Nigora') IS NOT NULL OR 1=0);
-- Referencia general de ubre y pezones (cabras lecheras adultas)
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT NULL, 'HEMBRA', 'PER_UBRE', 50, 8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL(NULL,0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'PER_UBRE')
     AND (NULL IS NOT NULL OR 1=1);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT NULL, 'HEMBRA', 'UBRE_PISO', 30, 5, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL(NULL,0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'UBRE_PISO')
     AND (NULL IS NOT NULL OR 1=1);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT NULL, 'HEMBRA', 'LONG_PEZON', 4, 0.8, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL(NULL,0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'LONG_PEZON')
     AND (NULL IS NOT NULL OR 1=1);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT NULL, 'HEMBRA', 'DIAM_PEZON', 2.2, 0.4, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL(NULL,0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'DIAM_PEZON')
     AND (NULL IS NOT NULL OR 1=1);
INSERT INTO RAZA_MEDIDA_REF (id_raza, sexo, codigo_medida, media, de, fuente)
  SELECT NULL, 'HEMBRA', 'DIST_PEZONES', 11, 3, 'Valor inicial aproximado (literatura zoométrica general). Validar con el docente.' FROM dual
   WHERE NOT EXISTS (SELECT 1 FROM RAZA_MEDIDA_REF x WHERE NVL(x.id_raza,0) = NVL(NULL,0) AND x.sexo = 'HEMBRA' AND x.codigo_medida = 'DIST_PEZONES')
     AND (NULL IS NOT NULL OR 1=1);

COMMIT;
