-- Script de inicialización para Oracle Database
-- Sistema de Gestión Zootécnica Caprina

-- ============================================
-- 1. CREAR USUARIO DE LA APLICACIÓN
-- ============================================

-- Crear usuario caprino_user con contraseña
CREATE USER caprino_user IDENTIFIED BY "CaprinoPass2025!"
DEFAULT TABLESPACE users
TEMPORARY TABLESPACE temp
QUOTA UNLIMITED ON users;

-- Otorgar permisos necesarios
GRANT CONNECT, RESOURCE TO caprino_user;
GRANT CREATE SESSION TO caprino_user;
GRANT CREATE TABLE TO caprino_user;
GRANT CREATE VIEW TO caprino_user;
GRANT CREATE SEQUENCE TO caprino_user;
GRANT CREATE TRIGGER TO caprino_user;
GRANT CREATE PROCEDURE TO caprino_user;

-- Permisos adicionales para desarrollo
GRANT SELECT ANY DICTIONARY TO caprino_user;

-- ============================================
-- 2. CONECTAR COMO USUARIO caprino_user
-- ============================================
-- A partir de aquí, ejecutar como caprino_user

-- ============================================
-- 3. CREAR SECUENCIAS
-- ============================================

CREATE SEQUENCE animales_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE usuarios_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE razas_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE produccion_leche_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE reproduccion_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE salud_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE pesaje_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE genealogia_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE notificaciones_seq START WITH 1 INCREMENT BY 1;

-- ============================================
-- 4. VERIFICACIÓN
-- ============================================

-- Verificar que el usuario existe
SELECT username, default_tablespace, temporary_tablespace 
FROM user_users;

-- Verificar las secuencias creadas
SELECT sequence_name, min_value, max_value, increment_by, last_number
FROM user_sequences
ORDER BY sequence_name;

-- Mensaje de confirmación
SELECT 'Base de datos inicializada correctamente para el usuario caprino_user' AS status FROM dual;
