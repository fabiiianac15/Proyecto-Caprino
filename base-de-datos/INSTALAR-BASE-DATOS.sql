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
--   @<ruta>\base-de-datos\esquemas\04-perfil-usuario.sql
--   @<ruta>\base-de-datos\esquemas\05-tabla-famacha.sql
--   @<ruta>\base-de-datos\esquemas\06-parche-columnas-faltantes.sql
--   @<ruta>\base-de-datos\esquemas\07-reformas-granja.sql
--   @<ruta>\base-de-datos\esquemas\09-bienestar.sql
--   @<ruta>\base-de-datos\esquemas\10-clasificacion-lineal.sql
--   @<ruta>\base-de-datos\procedimientos\01-triggers-y-funciones.sql
--   @<ruta>\base-de-datos\vistas\01-vistas-reportes.sql
-- (08-limpieza-entrega.sql es opcional: vacía datos para una entrega limpia)

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
-- CREDENCIALES DE LA BASE DE DATOS (Oracle Autonomous Cloud)
-- ==================================================================
-- Usuario Oracle de la aplicación: caprino_user
-- Contraseña Oracle:               CaprinoPass2025!
-- TNS Name (wallet):               dbcaprino_high
-- Wallet path (servidor):          /ruta/al/wallet/Caprino-Wallet
--
-- IMPORTANTE: Configurar en backend-symfony/.env.local (no subir a git):
--   DATABASE_TNS_NAME=dbcaprino_high
--   DATABASE_USER=caprino_user
--   DATABASE_PASSWORD=CaprinoPass2025!
--   DATABASE_WALLET_PATH=/ruta/al/wallet/en/servidor
-- ==================================================================

-- ==================================================================
-- NOTA PARA BD YA EXISTENTE (si las tablas principales ya están):
-- ==================================================================
-- Si la BD ya tiene las tablas del paso 01 pero le faltan las de
-- los pasos 04, 05, 06, 07, 09, 10, ejecutar SOLO esos scripts adicionales.
-- Los scripts 06, 07, 09 y 10 usan BEGIN/EXCEPTION e IF count=0 para
-- ignorar objetos ya existentes (son idempotentes).
-- ==================================================================
