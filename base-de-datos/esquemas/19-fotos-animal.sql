-- ==================================================================
-- PARCHE 19: Galería de fotos de cada cabra (2026-11)
-- Varias fotos por animal, cada una con su vista (de lado, de frente,
-- desde atrás, cabeza, ubre/testículos, patas, otra) para verla en
-- carrusel y apoyar las mediciones. ANIMAL.foto_url sigue siendo la
-- foto principal (la de la lista y la ficha).
-- Los archivos se guardan en public/uploads/animales/<id_animal>/.
-- Ejecutar como caprino_user. Es idempotente.
-- ==================================================================
SET DEFINE OFF;
BEGIN
    EXECUTE IMMEDIATE q'[CREATE TABLE ANIMAL_FOTO (
        id_foto        NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        id_animal      NUMBER NOT NULL,
        tipo_vista     VARCHAR2(12) NOT NULL
                       CHECK (tipo_vista IN ('LATERAL','FRONTAL','POSTERIOR','CABEZA','UBRE','TESTICULOS','PATAS','OTRA')),
        ruta           VARCHAR2(300) NOT NULL,
        descripcion    VARCHAR2(200),
        usuario_registro NUMBER,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_animalfoto_animal FOREIGN KEY (id_animal) REFERENCES ANIMAL(id_animal) ON DELETE CASCADE
    )]';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -955 THEN NULL; ELSE RAISE; END IF;
END;
/
BEGIN
    EXECUTE IMMEDIATE 'CREATE INDEX idx_animalfoto_animal ON ANIMAL_FOTO(id_animal)';
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE IN (-955, -1408) THEN NULL; ELSE RAISE; END IF;
END;
/
COMMENT ON TABLE ANIMAL_FOTO IS 'Galería de fotos de cada animal por tipo de vista (carrusel)';
COMMENT ON COLUMN ANIMAL_FOTO.ruta IS 'URL pública relativa (/uploads/animales/<id>/archivo.jpg)';

-- Clasificación lineal de machos: vista de los testículos
DECLARE
BEGIN
    FOR c IN (SELECT constraint_name FROM user_constraints
               WHERE table_name = 'EVAL_LINEAL_FOTO' AND constraint_type = 'C'
                 AND search_condition_vc LIKE '%UBRE_POST%') LOOP
        EXECUTE IMMEDIATE 'ALTER TABLE EVAL_LINEAL_FOTO DROP CONSTRAINT ' || c.constraint_name;
    END LOOP;
    EXECUTE IMMEDIATE q'[ALTER TABLE EVAL_LINEAL_FOTO ADD CONSTRAINT ck_evallineal_foto_vista
        CHECK (tipo_vista IN ('FRONTAL','LATERAL','POSTERIOR','UBRE_POST','UBRE_LAT','PATAS','MEDICION','TESTICULOS'))]';
END;
/
COMMIT;
