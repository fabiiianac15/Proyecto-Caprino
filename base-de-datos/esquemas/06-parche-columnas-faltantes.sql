-- ==================================================================
-- PARCHE: Columnas faltantes en AUDITORIA + tabla USUARIO_PERFIL
-- Ejecutar como caprino_user en la BD Oracle Autonomous
-- ==================================================================

-- 1. Agregar columnas faltantes a AUDITORIA
ALTER TABLE AUDITORIA ADD (
    nombre_usuario VARCHAR2(200),
    descripcion    VARCHAR2(500)
);

-- 2. Crear tabla USUARIO_PERFIL (si no existe)
BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE USUARIO_PERFIL (
            id_usuario          NUMBER PRIMARY KEY,
            telefono            VARCHAR2(30),
            cedula              VARCHAR2(20),
            fecha_nacimiento    DATE,
            direccion           VARCHAR2(200),
            ciudad              VARCHAR2(100),
            departamento        VARCHAR2(100),
            nombre_granja       VARCHAR2(200) DEFAULT ''Granja Experimental UFPSO'',
            tipo_produccion     VARCHAR2(50)  DEFAULT ''Leche y Carne'',
            area_total          VARCHAR2(50),
            sistema_manejo      VARCHAR2(50),
            capacidad_instalada NUMBER,
            coordenadas_gps     VARCHAR2(100) DEFAULT ''8°14''''20"N, 73°21''''21"W'',
            altitud             VARCHAR2(50)  DEFAULT ''1.200 msnm'',
            temperatura_prom    VARCHAR2(50)  DEFAULT ''21°C'',
            precipitacion       VARCHAR2(50)  DEFAULT ''1.400 mm/año'',
            nit                 VARCHAR2(30),
            registro_ica        VARCHAR2(50),
            registro_ganadero   VARCHAR2(50),
            licencia_ambiental  VARCHAR2(50),
            notif_reproduccion  NUMBER(1) DEFAULT 1,
            notif_salud         NUMBER(1) DEFAULT 1,
            notif_produccion    NUMBER(1) DEFAULT 1,
            notif_reportes      NUMBER(1) DEFAULT 0,
            notif_push          NUMBER(1) DEFAULT 1,
            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_perfil_usuario FOREIGN KEY (id_usuario)
                REFERENCES USUARIO(id_usuario) ON DELETE CASCADE
        )';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE = -955 THEN NULL; -- tabla ya existe, ignorar
        ELSE RAISE;
        END IF;
END;
/

COMMIT;
