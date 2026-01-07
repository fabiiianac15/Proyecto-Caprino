-- Crear tabla de usuarios para autenticación JWT
CREATE TABLE USUARIOS (
    ID NUMBER(10) NOT NULL,
    EMAIL VARCHAR2(180) NOT NULL UNIQUE,
    ROLES CLOB,
    PASSWORD VARCHAR2(255) NOT NULL,
    NOMBRE VARCHAR2(100) NOT NULL,
    APELLIDO VARCHAR2(100),
    TELEFONO VARCHAR2(20),
    ACTIVO NUMBER(1) DEFAULT 1,
    FECHA_REGISTRO TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_USUARIOS PRIMARY KEY (ID)
);

-- Indice en EMAIL eliminado: UNIQUE constraint ya crea indice automatico

-- Crear secuencia para IDs
CREATE SEQUENCE USUARIOS_SEQ
    START WITH 1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE;

-- Trigger para auto-increment
CREATE OR REPLACE TRIGGER TRG_USUARIOS_ID
BEFORE INSERT ON USUARIOS
FOR EACH ROW
BEGIN
    IF :NEW.ID IS NULL THEN
        SELECT USUARIOS_SEQ.NEXTVAL INTO :NEW.ID FROM DUAL;
    END IF;
END;
/

-- Insertar usuario de prueba (password: Admin123!)
-- Hash bcrypt generado con costo 12
INSERT INTO USUARIOS (EMAIL, ROLES, PASSWORD, NOMBRE, APELLIDO, ACTIVO)
VALUES (
    'admin@caprino.com',
    '["ROLE_USER","ROLE_ADMIN"]',
    '$2y$13$qwertyuiopasdfghjklzxcvbnm1234567890ABCDEFGHIJK',  -- Esto se generará en backend
    'Administrador',
    'Sistema',
    1
);

COMMIT;
