-- ==================================================================
-- PARCHE 07: Reformas solicitadas por la granja (2026-06)
-- Ejecutar como caprino_user en la BD Oracle Autonomous.
-- Es idempotente: puede ejecutarse varias veces sin error.
--
-- Incluye:
--   1. Doble chapeta (vieja / nueva) en ANIMAL
--   2. Renombrar razas Criolla -> Criolla Santandereana, Nubia -> Anglonubiana
--   3. fecha_nacimiento opcional (NULL) en ANIMAL
--   4. Módulo de corrales (tabla CORRAL + ANIMAL.id_corral)
--   5. Trazabilidad de crías nacidas en un parto (ANIMAL.id_reproduccion_origen)
-- ==================================================================

SET DEFINE OFF;

-- ------------------------------------------------------------------
-- 1. DOBLE CHAPETA EN ANIMAL
-- ------------------------------------------------------------------
-- chapeta_nueva: crotal del nuevo esquema de identificación.
-- chapeta_vieja: crotal antiguo (las cabras viejas solo conservan esta).
-- Regla de negocio (validada en backend): al menos una de las dos.
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE ANIMAL ADD (chapeta_nueva VARCHAR2(50))';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF; -- columna ya existe
END;
/
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE ANIMAL ADD (chapeta_vieja VARCHAR2(50))';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF;
END;
/

-- Restricciones UNIQUE (en Oracle NULL no viola UNIQUE, así que conviven cabras sin una de las dos)
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE ANIMAL ADD CONSTRAINT uk_animal_chapeta_nueva UNIQUE (chapeta_nueva)';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -2261 OR SQLCODE = -955 THEN NULL; ELSE RAISE; END IF; -- constraint ya existe
END;
/
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE ANIMAL ADD CONSTRAINT uk_animal_chapeta_vieja UNIQUE (chapeta_vieja)';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -2261 OR SQLCODE = -955 THEN NULL; ELSE RAISE; END IF;
END;
/

COMMENT ON COLUMN ANIMAL.chapeta_nueva IS 'Crotal del nuevo esquema de identificación de la granja';
COMMENT ON COLUMN ANIMAL.chapeta_vieja IS 'Crotal antiguo; las cabras viejas suelen conservar solo esta';

-- Backfill: las cabras ya registradas son "viejas", su código actual pasa a ser la chapeta vieja.
UPDATE ANIMAL
   SET chapeta_vieja = codigo_identificacion
 WHERE chapeta_vieja IS NULL
   AND chapeta_nueva IS NULL;

-- ------------------------------------------------------------------
-- 2. RENOMBRAR RAZAS
-- ------------------------------------------------------------------
UPDATE RAZA SET nombre_raza = 'Criolla Santandereana'
 WHERE nombre_raza = 'Criolla';

UPDATE RAZA SET nombre_raza = 'Anglonubiana'
 WHERE nombre_raza = 'Nubia';

-- ------------------------------------------------------------------
-- 3. FECHA DE NACIMIENTO OPCIONAL
-- ------------------------------------------------------------------
-- Algunas cabras viejas no tienen fecha de nacimiento conocida.
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE ANIMAL MODIFY (fecha_nacimiento NULL)';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1451 THEN NULL; ELSE RAISE; END IF; -- ya es NULLable
END;
/

-- ------------------------------------------------------------------
-- 4. MÓDULO DE CORRALES
-- ------------------------------------------------------------------
-- Cada corral tiene un tipo (algunos solo para gestantes o solo ordeño),
-- una capacidad máxima de animales y un rango de peso recomendado,
-- ya que las cabras se mueven de corral según su peso.
BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE CORRAL (
            id_corral        NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            nombre           VARCHAR2(100) NOT NULL,
            lote             VARCHAR2(50),
            tipo             VARCHAR2(30) DEFAULT ''general''
                             CHECK (tipo IN (''general'', ''gestante'', ''ordeno'', ''lactancia'', ''levante'', ''machos'')),
            capacidad_maxima NUMBER,
            peso_min_kg      NUMBER(6,2),
            peso_max_kg      NUMBER(6,2),
            descripcion      VARCHAR2(500),
            estado           VARCHAR2(20) DEFAULT ''activo'' CHECK (estado IN (''activo'', ''inactivo'')),
            fecha_creacion   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uk_corral_nombre UNIQUE (nombre),
            CONSTRAINT check_corral_capacidad CHECK (capacidad_maxima IS NULL OR capacidad_maxima > 0)
        )';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -955 THEN NULL; ELSE RAISE; END IF; -- tabla ya existe
END;
/

COMMENT ON TABLE CORRAL IS 'Corrales/lotes de la granja con tipo, capacidad y rango de peso';
COMMENT ON COLUMN CORRAL.tipo IS 'general, gestante, ordeno, lactancia, levante o machos';
COMMENT ON COLUMN CORRAL.capacidad_maxima IS 'Número máximo de animales que admite el corral';

-- Columna de asignación en ANIMAL
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE ANIMAL ADD (id_corral NUMBER)';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF;
END;
/
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE ANIMAL ADD CONSTRAINT fk_animal_corral
                       FOREIGN KEY (id_corral) REFERENCES CORRAL(id_corral)';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -2275 OR SQLCODE = -955 THEN NULL; ELSE RAISE; END IF; -- FK ya existe
END;
/
BEGIN
    EXECUTE IMMEDIATE 'CREATE INDEX idx_animal_corral ON ANIMAL(id_corral)';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -955 THEN NULL; ELSE RAISE; END IF;
END;
/

COMMENT ON COLUMN ANIMAL.id_corral IS 'Corral en el que se encuentra actualmente el animal';

-- Corrales de ejemplo (solo si la tabla está vacía)
DECLARE
    v_cnt NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_cnt FROM CORRAL;
    IF v_cnt = 0 THEN
        INSERT INTO CORRAL (nombre, lote, tipo, capacidad_maxima, peso_min_kg, peso_max_kg, descripcion)
            VALUES ('Corral 1', 'Lote 1', 'general',   30, 0,  100, 'Corral general');
        INSERT INTO CORRAL (nombre, lote, tipo, capacidad_maxima, peso_min_kg, peso_max_kg, descripcion)
            VALUES ('Corral 2', 'Lote 1', 'levante',   25, 10, 35,  'Animales en levante');
        INSERT INTO CORRAL (nombre, lote, tipo, capacidad_maxima, peso_min_kg, peso_max_kg, descripcion)
            VALUES ('Corral 3', 'Lote 2', 'gestante',  20, 30, 80,  'Solo hembras gestantes');
        INSERT INTO CORRAL (nombre, lote, tipo, capacidad_maxima, peso_min_kg, peso_max_kg, descripcion)
            VALUES ('Corral 4', 'Lote 2', 'ordeno',    20, 35, 80,  'Solo cabras en ordeño');
        INSERT INTO CORRAL (nombre, lote, tipo, capacidad_maxima, peso_min_kg, peso_max_kg, descripcion)
            VALUES ('Corral 5', 'Lote 3', 'machos',    10, 40, 100, 'Solo machos reproductores');
    END IF;
END;
/

-- ------------------------------------------------------------------
-- 5. TRAZABILIDAD DE CRÍAS NACIDAS EN UN PARTO
-- ------------------------------------------------------------------
-- Permite saber de qué parto (REPRODUCCION) provienen las crías
-- registradas automáticamente al registrar el parto.
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE ANIMAL ADD (id_reproduccion_origen NUMBER)';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN NULL; ELSE RAISE; END IF;
END;
/
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE ANIMAL ADD CONSTRAINT fk_animal_repro_origen
                       FOREIGN KEY (id_reproduccion_origen) REFERENCES REPRODUCCION(id_reproduccion)';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -2275 OR SQLCODE = -955 THEN NULL; ELSE RAISE; END IF;
END;
/

COMMENT ON COLUMN ANIMAL.id_reproduccion_origen IS 'Parto del que proviene la cría (registro automático)';

-- ------------------------------------------------------------------
-- 6. AMPLIAR ESTADOS DEL ANIMAL (agregar 'donado')
-- ------------------------------------------------------------------
-- El formulario ofrece el estado 'donado' pero el CHECK original no lo permitía.
-- Localizamos el CHECK del estado (tenga el nombre de sistema que tenga),
-- lo eliminamos y creamos uno con nombre que incluya 'donado'.
DECLARE
    v_nombre VARCHAR2(128);
BEGIN
    BEGIN
        SELECT constraint_name INTO v_nombre
          FROM user_constraints
         WHERE table_name = 'ANIMAL'
           AND constraint_type = 'C'
           AND constraint_name = 'CHECK_ANIMAL_ESTADO';
    EXCEPTION WHEN NO_DATA_FOUND THEN
        v_nombre := NULL;
    END;

    IF v_nombre IS NULL THEN
        -- buscar el CHECK de sistema sobre 'estado'
        BEGIN
            SELECT constraint_name INTO v_nombre
              FROM user_constraints
             WHERE table_name = 'ANIMAL'
               AND constraint_type = 'C'
               AND search_condition_vc LIKE '%vendido%'
               AND ROWNUM = 1;
        EXCEPTION WHEN NO_DATA_FOUND THEN
            v_nombre := NULL;
        END;

        IF v_nombre IS NOT NULL THEN
            EXECUTE IMMEDIATE 'ALTER TABLE ANIMAL DROP CONSTRAINT ' || v_nombre;
        END IF;

        EXECUTE IMMEDIATE 'ALTER TABLE ANIMAL ADD CONSTRAINT check_animal_estado
            CHECK (estado IN (''activo'', ''vendido'', ''muerto'', ''descartado'', ''donado''))';
    END IF;
END;
/

COMMIT;

-- ==================================================================
-- Verificación rápida
-- ==================================================================
-- SELECT nombre_raza FROM RAZA WHERE nombre_raza IN ('Criolla Santandereana','Anglonubiana');
-- SELECT nombre, tipo, capacidad_maxima FROM CORRAL ORDER BY nombre;
-- DESC ANIMAL;
