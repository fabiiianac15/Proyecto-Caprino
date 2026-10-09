-- ==================================================================
-- PARCHE 12: Bienestar animal — criterios MEBA, conteos de muestreo,
--            evidencias fotográficas y borradores (2026-10)
-- Fuente: documentacion/MEBA-ovinos-y-caprinos.pdf (ICA v3.0, 2026)
-- Ejecutar como caprino_user. Es idempotente.
--
-- Incluye:
--   1. Catálogo: pregunta, método, referencia (tabla del PDF) y texto
--      de los criterios 100 / 55 / 20 / 0 de cada indicador.
--   2. Catálogo: regla de muestreo para calcular el puntaje a partir
--      de un conteo (n evaluados / n que cumplen o con hallazgo):
--        medicion = 'CUMPLE'   -> % que cumple;   100 si % > corte_100
--                                 (corte 100 = todos), 55 si % > corte_55,
--                                 20 si % > corte_20, si no 0.
--        medicion = 'HALLAZGO' -> % con problema; 100 si % < corte_100
--                                 (corte 0 = ninguno), 55 si % < corte_55,
--                                 20 si % < corte_20, si no 0.
--      Un criterio NULL significa que ese nivel no existe en el PDF
--      (p. ej. Enriquecimiento no tiene 20; Intervenciones es 0/100).
--   3. Evaluación: evaluadores (estudiantes), estado BORRADOR/FINALIZADA.
--   4. Detalle: n_evaluados, n_hallazgo.
--   5. EVAL_BIENESTAR_FOTO: fotos de evidencia por indicador.
-- ==================================================================

SET DEFINE OFF;

-- ------------------------------------------------------------------
-- 1-2. COLUMNAS NUEVAS DEL CATÁLOGO
-- ------------------------------------------------------------------
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE BIENESTAR_INDICADOR_CAT ADD (referencia VARCHAR2(20))';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE BIENESTAR_INDICADOR_CAT ADD (pregunta VARCHAR2(600))';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE BIENESTAR_INDICADOR_CAT ADD (metodo VARCHAR2(150))';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE BIENESTAR_INDICADOR_CAT ADD (crit_100 VARCHAR2(600))';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE BIENESTAR_INDICADOR_CAT ADD (crit_55 VARCHAR2(600))';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE BIENESTAR_INDICADOR_CAT ADD (crit_20 VARCHAR2(600))';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE BIENESTAR_INDICADOR_CAT ADD (crit_0 VARCHAR2(600))';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE BIENESTAR_INDICADOR_CAT ADD (medicion VARCHAR2(10))';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE BIENESTAR_INDICADOR_CAT ADD (corte_100 NUMBER(6,2))';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE BIENESTAR_INDICADOR_CAT ADD (corte_55 NUMBER(6,2))';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE BIENESTAR_INDICADOR_CAT ADD (corte_20 NUMBER(6,2))';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE BIENESTAR_INDICADOR_CAT ADD (unidad VARCHAR2(60))';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/

BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE BIENESTAR_INDICADOR_CAT ADD CONSTRAINT check_bien_medicion
        CHECK (medicion IS NULL OR medicion IN (''CUMPLE'', ''HALLAZGO''))';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -2264 THEN NULL; ELSE RAISE; END IF;
END;
/

UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 5', pregunta = '¿Los animales tienen acceso al agua y está disponible en bebederos, chupos, zanjas o jagüeyes?', metodo = 'Inspección visual sujeta a muestreo',
    crit_100 = 'El agua está disponible todo el tiempo y todos los animales tienen acceso al recurso.', crit_55 = 'El agua está disponible todo el tiempo y más del 90% de los animales tienen acceso.', crit_20 = 'El agua está disponible todo el tiempo y más del 70% de los animales tienen acceso.', crit_0 = 'Igual o menos del 70% de los animales tienen acceso, o el agua no está disponible.',
    medicion = 'CUMPLE', corte_100 = 100, corte_55 = 90, corte_20 = 70, unidad = 'animales'
 WHERE codigo = 'AGUA_ACCESO';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 6', pregunta = '¿La calidad del agua es aceptable para los animales?', metodo = 'Inspección documental y visual sujeta a muestreo',
    crit_100 = 'Certificado de análisis fisicoquímico y microbiológico satisfactorio de menos de un año y el agua se observa limpia.', crit_55 = 'Soporte de que el agua proviene del acueducto y el agua se observa limpia.', crit_20 = 'El agua a la inspección visual se observa limpia.', crit_0 = 'El agua a la inspección visual no se observa limpia.',
    medicion = NULL, corte_100 = NULL, corte_55 = NULL, corte_20 = NULL, unidad = NULL
 WHERE codigo = 'AGUA_CALIDAD';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 7', pregunta = '¿Los bebederos se encuentran limpios y en buenas condiciones de mantenimiento?', metodo = 'Inspección visual sujeta a muestreo',
    crit_100 = 'Todos los bebederos evaluados están en buen estado, limpios, libres de moho y heces en su interior.', crit_55 = 'Más del 75% de los bebederos evaluados están en buen estado y limpios.', crit_20 = 'Más del 50% de los bebederos evaluados están en buen estado y limpios.', crit_0 = 'Igual o menos del 50% de los bebederos están en buen estado, o se evidencia suciedad, moho o heces.',
    medicion = 'CUMPLE', corte_100 = 100, corte_55 = 75, corte_20 = 50, unidad = 'bebederos'
 WHERE codigo = 'BEBEDEROS_ESTADO';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 8', pregunta = '¿Todos los animales tienen acceso y hay alimento disponible en corrales y praderas?', metodo = 'Inspección visual sujeta a muestreo',
    crit_100 = 'Todos los animales tienen acceso al alimento y está disponible en todos los corrales y praderas.', crit_55 = 'Más del 90% de los animales tienen acceso al alimento.', crit_20 = 'Más del 70% de los animales tienen acceso al alimento.', crit_0 = 'Igual o menos del 70% tienen acceso, o el alimento no está disponible en todos los corrales y praderas.',
    medicion = 'CUMPLE', corte_100 = 100, corte_55 = 90, corte_20 = 70, unidad = 'animales'
 WHERE codigo = 'ALIMENTO_ACCESO';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 9', pregunta = '¿La cantidad y calidad del alimento suministrado es adecuada? (comederos: 30 cm lineales por adulto, 20 cm por cabrito)', metodo = 'Inspección visual sujeta a muestreo',
    crit_100 = 'Todos los animales tienen suficiente alimento, de buena calidad, y se cumplen las medidas de comederos.', crit_55 = 'Más del 75% de los animales tienen suficiente alimento, de buena calidad, y se cumplen las medidas de comederos.', crit_20 = 'Más del 50% de los animales tienen suficiente alimento, de buena calidad, y se cumplen las medidas de comederos.', crit_0 = 'Igual o menos del 50% tienen suficiente alimento, o el alimento no es de buena calidad, o no se cumplen las medidas de comederos.',
    medicion = 'CUMPLE', corte_100 = 100, corte_55 = 75, corte_20 = 50, unidad = 'animales'
 WHERE codigo = 'ALIMENTO_CALIDAD';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 10', pregunta = '¿Los comederos se encuentran limpios y en buenas condiciones de mantenimiento?', metodo = 'Inspección visual sujeta a muestreo',
    crit_100 = 'Todos los comederos evaluados están en buen estado y limpios, o todos los animales se alimentan solo en pastoreo.', crit_55 = 'Más del 75% de los comederos evaluados están en buen estado y limpios.', crit_20 = 'Más del 50% de los comederos evaluados están en buen estado y limpios.', crit_0 = 'Igual o menos del 50% de los comederos están en buen estado, o se evidencia suciedad, moho o heces.',
    medicion = 'CUMPLE', corte_100 = 100, corte_55 = 75, corte_20 = 50, unidad = 'comederos'
 WHERE codigo = 'COMEDEROS_ESTADO';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 11', pregunta = '¿Los animales cuentan con suficiente sombra en potreros, corrales y demás zonas de acceso?', metodo = 'Inspección visual sujeta a muestreo',
    crit_100 = 'Todos los animales tienen acceso a sombra en corrales y potreros.', crit_55 = 'Más del 75% de los animales tienen acceso a sombra.', crit_20 = 'Más del 50% de los animales tienen acceso a sombra.', crit_0 = 'Igual o menos del 50% de los animales tienen acceso a sombra.',
    medicion = 'CUMPLE', corte_100 = 100, corte_55 = 75, corte_20 = 50, unidad = 'animales'
 WHERE codigo = 'SOMBRA';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 12', pregunta = '¿Se presenta encharcamiento en los corrales y/o potreros?', metodo = 'Inspección visual sujeta a muestreo',
    crit_100 = 'No se observan encharcamientos y existen suficientes zonas de descanso secas.', crit_55 = 'Encharcamientos hasta en el 20% de los corrales o potreros y suficientes zonas de descanso secas.', crit_20 = 'Encharcamientos hasta en el 30% de los corrales o potreros y existen zonas de descanso secas.', crit_0 = 'Encharcamientos en igual o más del 30% de los corrales o potreros, o no existen zonas de descanso secas.',
    medicion = 'HALLAZGO', corte_100 = 0, corte_55 = 20.01, corte_20 = 30, unidad = 'corrales/potreros'
 WHERE codigo = 'ENCHARCAMIENTO';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 14', pregunta = '¿Los animales disponen de suficiente espacio? (caprinos: grupal <8 an. 1,0 m²; 8-15 an. 0,9 m²; 16 o más 0,8 m²; individual cría 0,6 / joven 2,0 / adulto o con cría 2,5 m²)', metodo = 'Inspección visual sujeta a muestreo',
    crit_100 = 'Todos los animales cuentan con espacio igual o superior al establecido.', crit_55 = 'Más del 75% de los animales cuentan con el espacio establecido.', crit_20 = 'Más del 50% de los animales cuentan con el espacio establecido.', crit_0 = 'Igual o menos del 50% de los animales cuentan con el espacio establecido.',
    medicion = 'CUMPLE', corte_100 = 100, corte_55 = 75, corte_20 = 50, unidad = 'animales'
 WHERE codigo = 'ESPACIO_CONFINAMIENTO';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 15', pregunta = '¿El piso de los corrales se encuentra en buenas condiciones?', metodo = 'Inspección visual sujeta a muestreo',
    crit_100 = 'Todos los corrales evaluados tienen superficies seguras, libres de objetos extraños, estructura estable y sin elementos punzantes.', crit_55 = 'Más del 75% de los corrales evaluados cumplen.', crit_20 = 'Más del 50% de los corrales evaluados cumplen.', crit_0 = 'Igual o menos del 50% cumplen, o la estructura no es estable, o hay elementos punzantes o peligrosos.',
    medicion = 'CUMPLE', corte_100 = 100, corte_55 = 75, corte_20 = 50, unidad = 'corrales'
 WHERE codigo = 'PISO_CORRALES';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 16', pregunta = '¿La cama ofrece buena superficie de descanso? (solo predios que usan cama)', metodo = 'Inspección visual sujeta a muestreo',
    crit_100 = 'Todas las camas inspeccionadas son suaves, con suficiente material y no dejan ver el suelo.', crit_55 = 'Más del 75% de las camas inspeccionadas cumplen.', crit_20 = 'Más del 50% de las camas inspeccionadas cumplen.', crit_0 = 'Igual o menos del 50% de las camas inspeccionadas cumplen.',
    medicion = 'CUMPLE', corte_100 = 100, corte_55 = 75, corte_20 = 50, unidad = 'camas'
 WHERE codigo = 'CAMA';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 17', pregunta = '¿Los corrales disponen de iluminación apropiada (natural o artificial)?', metodo = 'Inspección visual sujeta a muestreo',
    crit_100 = 'En todos los corrales evaluados se observan todos los animales, instalaciones y equipos durante el día.', crit_55 = 'Cumple en más del 75% de los corrales evaluados.', crit_20 = 'Cumple en más del 50% de los corrales evaluados.', crit_0 = 'Cumple en igual o menos del 50% de los corrales evaluados.',
    medicion = 'CUMPLE', corte_100 = 100, corte_55 = 75, corte_20 = 50, unidad = 'corrales'
 WHERE codigo = 'ILUMINACION';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 18', pregunta = '¿Los corrales disponen de ventilación apropiada (natural o artificial)?', metodo = 'Inspección visual sujeta a muestreo',
    crit_100 = 'En todos los corrales se respira sin dificultad, se siente corriente de aire y no hay olores fuertes.', crit_55 = 'Cumple en más del 75% de los corrales evaluados.', crit_20 = 'Cumple en más del 50% de los corrales evaluados.', crit_0 = 'Cumple en igual o menos del 50% de los corrales evaluados.',
    medicion = 'CUMPLE', corte_100 = 100, corte_55 = 75, corte_20 = 50, unidad = 'corrales'
 WHERE codigo = 'VENTILACION';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 19', pregunta = '¿Los animales cuentan con elementos de enriquecimiento ambiental o potreros de descanso?', metodo = 'Inspección visual',
    crit_100 = 'Todos los animales cuentan con enriquecimiento ambiental y/o potrero de descanso.', crit_55 = 'No todos los animales cuentan con enriquecimiento ambiental y/o potrero de descanso.', crit_20 = NULL, crit_0 = 'Los animales no cuentan con enriquecimiento ambiental ni potrero de descanso.',
    medicion = NULL, corte_100 = NULL, corte_55 = NULL, corte_20 = NULL, unidad = NULL
 WHERE codigo = 'ENRIQUECIMIENTO';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 21', pregunta = '¿Cuál es la condición corporal de los animales adultos? (escala 1-5; cumple con 3 o 4)', metodo = 'Inspección visual sujeta a muestreo',
    crit_100 = 'Todos los animales con condición corporal 3 o 4.', crit_55 = 'Más del 75% de los animales con condición corporal 3 o 4.', crit_20 = 'Más del 50% de los animales con condición corporal 3 o 4.', crit_0 = 'Igual o menos del 50% de los animales con condición corporal 3 o 4.',
    medicion = 'CUMPLE', corte_100 = 100, corte_55 = 75, corte_20 = 50, unidad = 'animales adultos'
 WHERE codigo = 'CONDICION_CORPORAL';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 22', pregunta = '¿Los animales presentan signos de estrés térmico? (calor: jadeo, salivación, menos rumia; frío: se amontonan)', metodo = 'Inspección visual sujeta a muestreo',
    crit_100 = 'Menos del 10% de los animales presentan signos de estrés térmico.', crit_55 = 'Menos del 20% de los animales presentan signos de estrés térmico.', crit_20 = 'Menos del 30% de los animales presentan signos de estrés térmico.', crit_0 = 'Igual o más del 30% de los animales presentan signos de estrés térmico.',
    medicion = 'HALLAZGO', corte_100 = 10, corte_55 = 20, corte_20 = 30, unidad = 'animales'
 WHERE codigo = 'ESTRES_TERMICO';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 23', pregunta = '¿Los animales presentan secreción ocular, nasal y/o tos persistente? (al menos 50% de la muestra deben ser cabritos)', metodo = 'Inspección visual sujeta a muestreo',
    crit_100 = 'Menos del 3% de los animales presentan secreción ocular, nasal y/o tos.', crit_55 = 'Menos del 7% de los animales presentan secreción ocular, nasal y/o tos.', crit_20 = 'Menos del 10% de los animales presentan secreción ocular, nasal y/o tos.', crit_0 = 'Igual o más del 10% de los animales presentan secreción ocular, nasal y/o tos.',
    medicion = 'HALLAZGO', corte_100 = 3, corte_55 = 7, corte_20 = 10, unidad = 'animales'
 WHERE codigo = 'SECRECION';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 24', pregunta = '¿Cuántos animales presentan FAMACHA con calificación 1 o 2?', metodo = 'Inspección visual sujeta a muestreo',
    crit_100 = 'Más del 90% de los animales evaluados con FAMACHA 1 o 2.', crit_55 = 'Más del 75% de los animales evaluados con FAMACHA 1 o 2.', crit_20 = 'Más del 50% de los animales evaluados con FAMACHA 1 o 2.', crit_0 = 'Igual o menos del 50% de los animales con FAMACHA 1 o 2.',
    medicion = 'CUMPLE', corte_100 = 90, corte_55 = 75, corte_20 = 50, unidad = 'animales'
 WHERE codigo = 'FAMACHA';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 25', pregunta = '¿Se realiza topizado o descorne a edad temprana, con anestesia y analgesia y un método que minimice el dolor?', metodo = 'Inspección visual sujeta a muestreo',
    crit_100 = 'No se realiza topizado ni descorne, o se hace antes de los 10 días de edad con evidencia de anestesia y analgesia.', crit_55 = 'Se realiza después de los 10 días de edad con evidencia de anestesia y/o analgesia.', crit_20 = NULL, crit_0 = 'Se realiza topizado o descorne sin evidencia de anestesia y/o analgesia.',
    medicion = NULL, corte_100 = NULL, corte_55 = NULL, corte_20 = NULL, unidad = NULL
 WHERE codigo = 'TOPIZADO_DESCORNE';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 26', pregunta = '¿Se observa infestación por ectoparásitos? (1 nuche, 1 miasis, garrapatas en 2 zonas, más de 3 tábanos o 10 falsas garrapatas)', metodo = 'Inspección visual sujeta a muestreo',
    crit_100 = 'En ningún animal se observa infestación por ectoparásitos.', crit_55 = 'Menos del 10% de los animales con infestación.', crit_20 = 'Menos del 20% de los animales con infestación.', crit_0 = 'Igual o más del 20% de los animales con infestación.',
    medicion = 'HALLAZGO', corte_100 = 0, corte_55 = 10, corte_20 = 20, unidad = 'animales'
 WHERE codigo = 'ECTOPARASITOS';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 27', pregunta = '¿Los animales presentan úlceras, lesiones, heridas recientes o alopecia? ¿Están siendo tratadas?', metodo = 'Inspección visual sujeta a muestreo',
    crit_100 = 'Menos del 3% de los animales con alopecias, úlceras, heridas o lesiones, y están siendo tratadas.', crit_55 = 'Menos del 6% de los animales con lesiones, y están siendo tratadas.', crit_20 = 'Menos del 10% de los animales con lesiones, y están siendo tratadas.', crit_0 = 'Igual o más del 10% de los animales con lesiones, o las lesiones no son tratadas.',
    medicion = 'HALLAZGO', corte_100 = 3, corte_55 = 6, corte_20 = 10, unidad = 'animales'
 WHERE codigo = 'LESIONES';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 28', pregunta = '¿Los animales en ordeño presentan mastitis clínica? (contar por animal, no por glándula)', metodo = 'Inspección visual sujeta a muestreo',
    crit_100 = 'Ningún animal en ordeño presenta mastitis clínica.', crit_55 = 'Menos del 3% de los animales en ordeño presentan mastitis clínica.', crit_20 = 'Menos del 5% de los animales en ordeño presentan mastitis clínica.', crit_0 = 'Igual o más del 5% de los animales en ordeño presentan mastitis clínica.',
    medicion = 'HALLAZGO', corte_100 = 0, corte_55 = 3, corte_20 = 5, unidad = 'animales en ordeño'
 WHERE codigo = 'MASTITIS';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 29', pregunta = '¿Se castran los animales? En caso afirmativo, ¿a qué edad, con qué método y con anestesia/analgesia?', metodo = 'Inspección visual sujeta a muestreo y documental',
    crit_100 = 'No se castra, o castración quirúrgica por MV/MVZ antes de 15 días de edad con anestesia y/o analgesia.', crit_55 = 'Castración quirúrgica por MV/MVZ con anestesia y/o analgesia, después de 15 días de edad.', crit_20 = 'Castración con banda constrictora con evidencia de uso de analgesia.', crit_0 = 'Castración quirúrgica sin anestesia/analgesia, o no la realiza MV/MVZ, o banda constrictora sin analgesia.',
    medicion = NULL, corte_100 = NULL, corte_55 = NULL, corte_20 = NULL, unidad = NULL
 WHERE codigo = 'CASTRACION';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 32', pregunta = '¿Los animales presentan cojeras? (observar 6 a 10 zancadas sobre superficie plana)', metodo = 'Inspección visual sujeta a muestreo',
    crit_100 = 'Menos del 5% de los animales presentan cojeras.', crit_55 = 'Menos del 8% de los animales presentan cojeras.', crit_20 = 'Menos del 12% de los animales presentan cojeras.', crit_0 = 'Igual o más del 12% de los animales presentan cojeras.',
    medicion = 'HALLAZGO', corte_100 = 5, corte_55 = 8, corte_20 = 12, unidad = 'animales'
 WHERE codigo = 'COJERAS';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 33', pregunta = '¿Los animales presentan sobrecrecimiento de pezuñas? (pérdida del perfil triangular, ángulo de 45°)', metodo = 'Inspección visual sujeta a muestreo',
    crit_100 = 'Menos del 5% de los animales con sobrecrecimiento de pezuñas.', crit_55 = 'Menos del 8% de los animales con sobrecrecimiento de pezuñas.', crit_20 = 'Menos del 12% de los animales con sobrecrecimiento de pezuñas.', crit_0 = 'Igual o más del 12% de los animales con sobrecrecimiento de pezuñas.',
    medicion = 'HALLAZGO', corte_100 = 5, corte_55 = 8, corte_20 = 12, unidad = 'animales'
 WHERE codigo = 'SOBRECRECIMIENTO_PEZUNAS';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 34', pregunta = '¿Cómo es la reacción de los animales frente a las personas? (mínimo 3 minutos de acercamiento)', metodo = 'Inspección visual',
    crit_100 = 'En todos los grupos de animales se manifiesta comportamiento positivo.', crit_55 = 'En la mayoría de los animales el comportamiento es positivo y en algunos neutro.', crit_20 = 'En la mayoría de los animales el comportamiento es neutro.', crit_0 = 'En la mayoría de los animales el comportamiento es negativo.',
    medicion = NULL, corte_100 = NULL, corte_55 = NULL, corte_20 = NULL, unidad = NULL
 WHERE codigo = 'RESPUESTA_HUMANO';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 35', pregunta = '¿Existen animales amarrados o con elementos que restrinjan su movilidad?', metodo = 'Inspección visual',
    crit_100 = 'Ningún animal está amarrado o tiene palos amarrados al cuello.', crit_55 = 'Menos del 2% de los animales están amarrados o con palos al cuello.', crit_20 = 'Menos del 5% de los animales están amarrados o con palos al cuello.', crit_0 = 'Igual o más del 5% de los animales están amarrados o con palos al cuello.',
    medicion = 'HALLAZGO', corte_100 = 0, corte_55 = 2, corte_20 = 5, unidad = 'animales'
 WHERE codigo = 'RESTRINGEN_MOVIMIENTO';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 36', pregunta = '¿Se genera aislamiento social en los animales? (se aceptan machos reproductores, agresivos, enfermos o en cuarentena que puedan ver, oler y oír a otros)', metodo = 'Inspección visual',
    crit_100 = 'Ningún animal se observa aislado del resto del grupo.', crit_55 = 'Menos del 5% de los animales se observan aislados.', crit_20 = 'Menos del 10% de los animales se observan aislados.', crit_0 = 'Igual o más del 10% de los animales se observan aislados.',
    medicion = 'HALLAZGO', corte_100 = 0, corte_55 = 5, corte_20 = 10, unidad = 'animales'
 WHERE codigo = 'AISLAMIENTO_SOCIAL';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 37', pregunta = '¿Se cuenta con registro de mortalidad de crías y adultos del último año? (fecha, animal, etapa, causa)', metodo = 'Documental',
    crit_100 = 'Registros con mortalidad menor al 10% en crías y/o menor al 5% en adultos en el último año.', crit_55 = 'Registros con mortalidad menor al 15% en crías y/o menor al 10% en adultos.', crit_20 = 'Registros con mortalidad menor al 20% en crías y/o menor al 15% en adultos.', crit_0 = 'No hay registros, o mortalidad igual o mayor al 20% en crías y/o 15% en adultos.',
    medicion = NULL, corte_100 = NULL, corte_55 = NULL, corte_20 = NULL, unidad = NULL
 WHERE codigo = 'MORTALIDAD';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 38', pregunta = '¿Se cumplen las Buenas Prácticas de Uso de Medicamentos Veterinarios (BPUMV)?', metodo = 'Documental y visual en el sitio de almacenamiento',
    crit_100 = 'Se cumple con todas las BPUMV.', crit_55 = 'Registro ICA, sin sustancias prohibidas, prescripción MV/MVZ, registro de tratamientos y sin vencidos; pero mal almacenamiento, agujas en mal estado o lugar sucio.', crit_20 = 'Registro ICA, sin sustancias prohibidas, prescripción MV/MVZ y registro de tratamientos; pero se usan medicamentos vencidos o hay fallas de almacenamiento.', crit_0 = 'Medicamentos sin registro ICA, sustancias prohibidas, promotores no autorizados, sin prescripción MV/MVZ o sin registro de tratamientos.',
    medicion = NULL, corte_100 = NULL, corte_55 = NULL, corte_20 = NULL, unidad = NULL
 WHERE codigo = 'MEDICAMENTOS';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 39', pregunta = '¿Existe plan sanitario firmado por MV o MVZ y está implementado?', metodo = 'Documental',
    crit_100 = 'Plan sanitario escrito, firmado por MV o MVZ, implementado y con registros.', crit_55 = 'Hay registros de vacunación y control de parásitos internos y externos, pero no hay plan sanitario escrito.', crit_20 = 'Existe plan sanitario, pero no está implementado y/o no hay registros.', crit_0 = 'No hay plan sanitario ni registros de vacunación ni evidencia de control de parásitos.',
    medicion = NULL, corte_100 = NULL, corte_55 = NULL, corte_20 = NULL, unidad = NULL
 WHERE codigo = 'PLAN_SANITARIO';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 40', pregunta = '¿El personal que maneja los animales tiene certificado de capacitación en bienestar animal y muestra conocimientos?', metodo = 'Documental y entrevista al personal',
    crit_100 = 'Todo el personal tiene conocimientos y está certificado en bienestar animal.', crit_55 = 'El personal tiene conocimientos pero no está certificado.', crit_20 = 'El personal no tiene conocimientos pero está certificado.', crit_0 = 'El personal no tiene conocimientos ni está certificado.',
    medicion = NULL, corte_100 = NULL, corte_55 = NULL, corte_20 = NULL, unidad = NULL
 WHERE codigo = 'CAPACITACION';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = 'Tabla 41', pregunta = '¿El predio cuenta con un protocolo documentado de contingencia ante problemas de abastecimiento de agua y alimento?', metodo = 'Documental',
    crit_100 = 'Existe plan de contingencia escrito y al menos una persona lo conoce en detalle.', crit_55 = 'No hay plan escrito, pero hay acciones de contingencia implementadas.', crit_20 = 'Existe plan escrito, pero ninguna persona lo conoce en detalle.', crit_0 = 'No existe plan de contingencia ni acciones implementadas.',
    medicion = NULL, corte_100 = NULL, corte_55 = NULL, corte_20 = NULL, unidad = NULL
 WHERE codigo = 'PLAN_CONTINGENCIA';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = '5.4.6', pregunta = '¿Se cumple con las condiciones para intervenciones quirúrgicas? (menores por MV/MVZ o personal entrenado, mayores solo MV/MVZ, con protocolo de anestesia/analgesia y registros)', metodo = 'Documental',
    crit_100 = 'Cumple con todas las condiciones.', crit_55 = NULL, crit_20 = NULL, crit_0 = 'No cumple.',
    medicion = NULL, corte_100 = NULL, corte_55 = NULL, corte_20 = NULL, unidad = NULL
 WHERE codigo = 'INTERVENCIONES_QUIRURGICAS';
UPDATE BIENESTAR_INDICADOR_CAT SET
    referencia = '5.4.7', pregunta = '¿El método de sacrificio está recomendado por la OMSA, hay procedimiento escrito, personal capacitado y elementos adecuados?', metodo = 'Documental',
    crit_100 = 'Cumple con todo.', crit_55 = NULL, crit_20 = NULL, crit_0 = 'No cumple.',
    medicion = NULL, corte_100 = NULL, corte_55 = NULL, corte_20 = NULL, unidad = NULL
 WHERE codigo = 'SACRIFICIO_HUMANITARIO';

-- ------------------------------------------------------------------
-- 3. CABECERA: evaluadores y estado
-- ------------------------------------------------------------------
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE EVALUACION_BIENESTAR ADD (evaluadores VARCHAR2(400))';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE EVALUACION_BIENESTAR ADD (estado VARCHAR2(12) DEFAULT ''FINALIZADA'')';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE EVALUACION_BIENESTAR ADD (fecha_modificacion TIMESTAMP)';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/

BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE EVALUACION_BIENESTAR ADD CONSTRAINT check_bien_estado
        CHECK (estado IN (''BORRADOR'', ''FINALIZADA''))';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -2264 THEN NULL; ELSE RAISE; END IF;
END;
/

UPDATE EVALUACION_BIENESTAR SET estado = 'FINALIZADA' WHERE estado IS NULL;

COMMENT ON COLUMN EVALUACION_BIENESTAR.evaluadores IS 'Nombres de quienes realizaron la evaluación (estudiantes, docente)';
COMMENT ON COLUMN EVALUACION_BIENESTAR.estado      IS 'BORRADOR mientras se recogen datos; FINALIZADA al cerrar la visita';

-- ------------------------------------------------------------------
-- 4. DETALLE: conteos del muestreo
-- ------------------------------------------------------------------
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE EVAL_BIENESTAR_DETALLE ADD (n_evaluados NUMBER)';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE EVAL_BIENESTAR_DETALLE ADD (n_hallazgo NUMBER)';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/

COMMENT ON COLUMN EVAL_BIENESTAR_DETALLE.n_evaluados IS 'Unidades evaluadas (animales, bebederos, corrales...)';
COMMENT ON COLUMN EVAL_BIENESTAR_DETALLE.n_hallazgo  IS 'Unidades que cumplen (medicion CUMPLE) o con el problema (medicion HALLAZGO)';

-- ------------------------------------------------------------------
-- 5. FOTOS DE EVIDENCIA
-- ------------------------------------------------------------------
BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE EVAL_BIENESTAR_FOTO (
            id_foto        NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            id_evaluacion  NUMBER NOT NULL,
            id_indicador   NUMBER,
            ruta_archivo   VARCHAR2(300) NOT NULL,
            descripcion    VARCHAR2(300),
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_bienfoto_eval FOREIGN KEY (id_evaluacion)
                REFERENCES EVALUACION_BIENESTAR(id_evaluacion) ON DELETE CASCADE,
            CONSTRAINT fk_bienfoto_ind FOREIGN KEY (id_indicador)
                REFERENCES BIENESTAR_INDICADOR_CAT(id_indicador)
        )';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -955 THEN NULL; ELSE RAISE; END IF;
END;
/
BEGIN
    EXECUTE IMMEDIATE 'CREATE INDEX idx_bienfoto_eval ON EVAL_BIENESTAR_FOTO(id_evaluacion)';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -955 THEN NULL; ELSE RAISE; END IF;
END;
/

COMMENT ON TABLE EVAL_BIENESTAR_FOTO IS 'Evidencia fotográfica de una evaluación de bienestar (por indicador o general)';

COMMIT;

-- ==================================================================
-- Verificación rápida
-- ==================================================================
-- SELECT codigo, medicion, corte_100, corte_55, corte_20, unidad FROM BIENESTAR_INDICADOR_CAT ORDER BY orden;
