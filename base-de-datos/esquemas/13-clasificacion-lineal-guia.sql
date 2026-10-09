-- ==================================================================
-- PARCHE 13: Clasificación lineal — guía en lenguaje sencillo y
--            puntos por rasgo (2026-10)
-- Fuente: documentacion/Vista de EVALUACIÓN LINEAL EN CABRAS LECHERAS...pdf
--         (Cedeño et al., 2024 — método ADGA 2019, Figura 1 y Tabla 1)
-- Ejecutar como caprino_user. Es idempotente.
--
-- 1. pts_rasgo: puntos máximos del rasgo dentro de su región. NULL = la
--    región se reparte por igual entre sus rasgos. En "Estructura y
--    fortaleza lechera" (15 pts) la Tabla 1 del artículo muestra medias de
--    angulosidad de 9,22 pts, imposibles con un reparto 7,5 / 7,5; por eso
--    angulosidad = 10 y calidad de hueso = 5.
-- 2. vista, que_mirar, desc_1/2/3: qué mirar y qué significa cada
--    calificación, para evaluadores sin formación técnica.
-- ==================================================================

SET DEFINE OFF;

BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE CLASIF_RASGO_CAT ADD (pts_rasgo NUMBER(5,2))';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE CLASIF_RASGO_CAT ADD (vista VARCHAR2(40))';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE CLASIF_RASGO_CAT ADD (que_mirar VARCHAR2(400))';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE CLASIF_RASGO_CAT ADD (desc_1 VARCHAR2(300))';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE CLASIF_RASGO_CAT ADD (desc_2 VARCHAR2(300))';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE CLASIF_RASGO_CAT ADD (desc_3 VARCHAR2(300))';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/

UPDATE CLASIF_RASGO_CAT SET pts_rasgo = NULL, vista = 'De lado', que_mirar = 'Qué tan alta es la cabra: del piso hasta la cruz (la parte más alta de la espalda, encima de las patas delanteras).',
    desc_1 = 'Baja: más pequeña que las de su misma edad.', desc_2 = 'Mediana.', desc_3 = 'Alta: de las más grandes de su edad.'
 WHERE codigo = 'ESTAT';
UPDATE CLASIF_RASGO_CAT SET pts_rasgo = NULL, vista = 'De frente', que_mirar = 'El espacio entre las dos patas delanteras (qué tan ancho y fuerte es el pecho).',
    desc_1 = 'Pecho angosto: patas delanteras muy juntas.', desc_2 = 'Ancho normal.', desc_3 = 'Pecho ancho y fuerte: patas bien separadas.'
 WHERE codigo = 'ANCPEC';
UPDATE CLASIF_RASGO_CAT SET pts_rasgo = NULL, vista = 'De lado', que_mirar = 'Qué tan honda es la barriga: distancia del lomo a la panza, justo detrás de la última costilla.',
    desc_1 = 'Poco profunda: de lado se ve delgada, "plana".', desc_2 = 'Normal.', desc_3 = 'Profunda: barriga amplia, mucha capacidad.'
 WHERE codigo = 'PROFUN';
UPDATE CLASIF_RASGO_CAT SET pts_rasgo = NULL, vista = 'Desde atrás', que_mirar = 'La grupa es la cadera (arriba de la cola). Mire qué tan separados están los huesos a cada lado de la cola.',
    desc_1 = 'Grupa angosta.', desc_2 = 'Grupa mediana.', desc_3 = 'Grupa ancha (le ayuda a parir con más facilidad).'
 WHERE codigo = 'ANCHGRU';
UPDATE CLASIF_RASGO_CAT SET pts_rasgo = NULL, vista = 'De lado', que_mirar = 'La inclinación de la línea que va de la cadera a la base de la cola. Compare con el dibujo.',
    desc_1 = 'Muy caída: bastante inclinada hacia la cola (como 45°).', desc_2 = 'Un poco inclinada (como 25°).', desc_3 = 'Casi plana (0°).'
 WHERE codigo = 'ANGRU';
UPDATE CLASIF_RASGO_CAT SET pts_rasgo = 10, vista = 'De lado', que_mirar = 'Si tiene "aspecto de cabra lechera": cuello largo y delgado, costillas separadas y que se notan, sin exceso de grasa.',
    desc_1 = 'Tosca y gruesa: costillas juntas, cuello corto.', desc_2 = 'Intermedia.', desc_3 = 'Muy fina y angulosa: costillas bien separadas, cuello largo.'
 WHERE codigo = 'ANGUL';
UPDATE CLASIF_RASGO_CAT SET pts_rasgo = 5, vista = 'De lado', que_mirar = 'Cómo son los huesos de las patas: deben ser planos y limpios, con articulaciones sin hinchazón.',
    desc_1 = 'Huesos redondos y gruesos, o articulaciones hinchadas.', desc_2 = 'Normales.', desc_3 = 'Huesos planos, finos y limpios.'
 WHERE codigo = 'CALHU';
UPDATE CLASIF_RASGO_CAT SET pts_rasgo = NULL, vista = 'De lado', que_mirar = 'Cómo se une la parte de adelante de la ubre con la barriga.',
    desc_1 = 'Suelta: la ubre cuelga y forma una "bolsa" o escalón adelante.', desc_2 = 'Intermedia.', desc_3 = 'Firme: la ubre se une suavemente a la barriga, sin escalón.'
 WHERE codigo = 'INAU';
UPDATE CLASIF_RASGO_CAT SET pts_rasgo = NULL, vista = 'Desde atrás', que_mirar = 'Qué tan arriba empieza la ubre, debajo de la vulva.',
    desc_1 = 'Empieza bajo, lejos de la vulva.', desc_2 = 'Altura media.', desc_3 = 'Empieza alto, cerca de la vulva.'
 WHERE codigo = 'AILPU';
UPDATE CLASIF_RASGO_CAT SET pts_rasgo = NULL, vista = 'Desde atrás', que_mirar = 'Qué tan ancha es la ubre en la parte de arriba, donde se pega al cuerpo.',
    desc_1 = 'Angosta.', desc_2 = 'Mediana.', desc_3 = 'Ancha.'
 WHERE codigo = 'ANIPU';
UPDATE CLASIF_RASGO_CAT SET pts_rasgo = NULL, vista = 'Desde atrás', que_mirar = 'El surco o "rayita" en el centro de la ubre que la divide en dos mitades y la sostiene.',
    desc_1 = 'No se nota el surco: la ubre se ve como una sola bola.', desc_2 = 'Surco suave.', desc_3 = 'Surco bien marcado: dos mitades claras.'
 WHERE codigo = 'LSM';
UPDATE CLASIF_RASGO_CAT SET pts_rasgo = NULL, vista = 'De lado', que_mirar = 'Dónde queda el fondo de la ubre comparado con el corvejón (la "rodilla" de la pata de atrás).',
    desc_1 = 'La ubre cuelga por debajo del corvejón.', desc_2 = 'A la altura del corvejón.', desc_3 = 'Por encima del corvejón.'
 WHERE codigo = 'PROFUB';
UPDATE CLASIF_RASGO_CAT SET pts_rasgo = NULL, vista = 'Desde atrás', que_mirar = 'Hacia dónde apuntan los pezones.',
    desc_1 = 'Hacia afuera, a los lados.', desc_2 = 'Un poco hacia afuera.', desc_3 = 'Centrados, apuntando hacia abajo (fáciles de ordeñar).'
 WHERE codigo = 'COLPE';
UPDATE CLASIF_RASGO_CAT SET pts_rasgo = NULL, vista = 'Desde atrás', que_mirar = 'Qué tan gruesos son los pezones.',
    desc_1 = 'Muy delgados.', desc_2 = 'Medianos.', desc_3 = 'Gruesos, fáciles de agarrar al ordeñar.'
 WHERE codigo = 'DIAPE';
UPDATE CLASIF_RASGO_CAT SET pts_rasgo = NULL, vista = 'Desde atrás', que_mirar = 'Con la cabra parada, cómo se ven las patas de atrás.',
    desc_1 = 'Corvejones juntos y pezuñas hacia afuera ("patas de vaca").', desc_2 = 'Corvejones un poco juntos.', desc_3 = 'Patas rectas y paralelas.'
 WHERE codigo = 'PTVP';
UPDATE CLASIF_RASGO_CAT SET pts_rasgo = NULL, vista = 'De lado', que_mirar = 'Qué tan doblada está la pata de atrás en el corvejón. Compare con el dibujo.',
    desc_1 = 'Pata muy recta.', desc_2 = 'Algo doblada.', desc_3 = 'Muy doblada / curvada.'
 WHERE codigo = 'PTVL';
UPDATE CLASIF_RASGO_CAT SET pts_rasgo = NULL, vista = 'Mirándola caminar', que_mirar = 'Cómo camina la cabra (hágala caminar unos pasos en piso plano).',
    desc_1 = 'Camina con dificultad: rígida o cojeando.', desc_2 = 'Camina normal.', desc_3 = 'Camina suelta, con pasos largos y firmes.'
 WHERE codigo = 'MOVI';

COMMIT;

-- SELECT codigo, region, pts_region, pts_rasgo, vista FROM CLASIF_RASGO_CAT ORDER BY orden;
