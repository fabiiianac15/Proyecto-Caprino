-- ==================================================================
-- SCRIPT MAESTRO DE INSTALACIÓN — Sistema Caprino
-- Ejecutar los pasos en el orden indicado
-- ==================================================================

-- ==================================================================
-- PASO 1: Ejecutar como SYS (SYSDBA) para crear el usuario de la app
-- ==================================================================
-- Conectar como SYS:
--   sqlplus sys/<password_de_sys>@localhost:1521/XEPDB1 as sysdba
-- Luego ejecutar:
--   @<ruta>\base-de-datos\00-crear-usuario.sql

-- ==================================================================
-- PASO 2: Ejecutar como caprino_user (el usuario recién creado)
-- ==================================================================
-- Conectar como caprino_user:
--   sqlplus caprino_user/CaprinoPass2025@localhost:1521/XEPDB1
-- Luego ejecutar EN ESTE ORDEN:

--   @<ruta>\base-de-datos\esquemas\01-tablas-principales.sql
--   @<ruta>\base-de-datos\esquemas\02-datos-iniciales-razas.sql
--   @<ruta>\base-de-datos\esquemas\03-datos-iniciales-usuarios.sql
--   @<ruta>\base-de-datos\procedimientos\01-triggers-y-funciones.sql
--   @<ruta>\base-de-datos\vistas\01-vistas-reportes.sql

-- ==================================================================
-- NO EJECUTAR los siguientes scripts (obsoletos/conflictivos):
-- ==================================================================
--   base-de-datos/00-init-database.sql       — crea secuencias innecesarias
--   base-de-datos/esquemas/04-tabla-usuarios.sql — crea tabla USUARIOS (duplicado)
--   base-de-datos/05-usuarios-iniciales.sql  — hashes inválidos

-- ==================================================================
-- VERIFICACIÓN POST-INSTALACIÓN
-- ==================================================================
-- Ejecutar para verificar que todo quedó correcto:
--   @<ruta>\base-de-datos\verificacion-completa.sql

-- ==================================================================
-- CREDENCIALES DE LA BASE DE DATOS
-- ==================================================================
-- Usuario Oracle de la aplicación: caprino_user
-- Contraseña Oracle:               CaprinoPass2025
-- Host local:                      127.0.0.1:1521/XEPDB1
--
-- IMPORTANTE: Cambiar CaprinoPass2025 antes de ir a producción.
-- ==================================================================
