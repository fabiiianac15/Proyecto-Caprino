-- ==================================================================
-- TABLA: FAMACHA
-- Descripción: Evaluaciones FAMACHA para control de anemia por
--              Haemonchus contortus (parásitos gastrointestinales)
-- Ejecutar como caprino_user DESPUES de 01-tablas-principales.sql
-- ==================================================================

CREATE TABLE FAMACHA (
    id_registro           NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_animal             NUMBER NOT NULL,
    fecha_evaluacion      DATE NOT NULL,
    puntuacion            NUMBER(1) NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
    ojo_evaluado          VARCHAR2(20) DEFAULT 'ambos'
                              CHECK (ojo_evaluado IN ('ambos', 'derecho', 'izquierdo')),
    tratamiento_aplicado  NUMBER(1) DEFAULT 0 CHECK (tratamiento_aplicado IN (0, 1)),
    medicamento           VARCHAR2(200),
    proxima_evaluacion    DATE,
    observaciones         CLOB,
    usuario_registro      NUMBER NOT NULL,
    fecha_registro        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_famacha_animal FOREIGN KEY (id_animal) REFERENCES ANIMAL(id_animal),
    CONSTRAINT check_famacha_proxima CHECK (
        proxima_evaluacion IS NULL OR proxima_evaluacion >= fecha_evaluacion
    )
);

COMMENT ON TABLE FAMACHA IS 'Evaluaciones FAMACHA: escala 1-5 según color de conjuntiva ocular';
COMMENT ON COLUMN FAMACHA.puntuacion IS '1=Rojo(sano) a 5=Blanco(anemia severa)';
COMMENT ON COLUMN FAMACHA.tratamiento_aplicado IS '0=No, 1=Si se aplicó antihelmíntico';

CREATE INDEX idx_famacha_animal ON FAMACHA(id_animal);
CREATE INDEX idx_famacha_fecha ON FAMACHA(fecha_evaluacion);
