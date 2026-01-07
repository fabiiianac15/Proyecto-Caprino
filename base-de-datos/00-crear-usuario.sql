-- ============================================================================
-- CREAR USUARIO PARA LA APLICACION CAPRINA
-- Ejecutar este script en SQL Developer conectado como SYS (SYSDBA)
-- ============================================================================

-- Conectar al PDB
ALTER SESSION SET CONTAINER = xe;

-- Crear el usuario
CREATE USER caprino_user IDENTIFIED BY CaprinoPass2025;

-- Otorgar permisos
GRANT CONNECT TO caprino_user;
GRANT RESOURCE TO caprino_user;
GRANT CREATE SESSION TO caprino_user;
GRANT CREATE TABLE TO caprino_user;
GRANT CREATE SEQUENCE TO caprino_user;
GRANT CREATE TRIGGER TO caprino_user;
GRANT CREATE VIEW TO caprino_user;
GRANT CREATE PROCEDURE TO caprino_user;
GRANT UNLIMITED TABLESPACE TO caprino_user;

-- Verificar
SELECT username FROM dba_users WHERE username = 'CAPRINO_USER';

-- Mensaje
SELECT 'Usuario caprino_user creado exitosamente!' as RESULTADO FROM DUAL;
