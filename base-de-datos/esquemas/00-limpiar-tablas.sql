-- ==================================================================
-- Script para ELIMINAR todas las tablas antes de recrearlas
-- ATENCION: Esto borra TODOS los datos
-- ==================================================================

-- Desactivar constraints temporalmente para evitar errores de dependencias
BEGIN
   FOR c IN (SELECT constraint_name, table_name FROM user_constraints WHERE constraint_type = 'R') LOOP
      EXECUTE IMMEDIATE 'ALTER TABLE ' || c.table_name || ' DROP CONSTRAINT ' || c.constraint_name;
   END LOOP;
END;
/

-- Eliminar tablas en orden inverso (de dependientes a independientes)
DROP TABLE AUDITORIA CASCADE CONSTRAINTS;
DROP TABLE SALUD CASCADE CONSTRAINTS;
DROP TABLE REPRODUCCION CASCADE CONSTRAINTS;
DROP TABLE PRODUCCION_LECHE CASCADE CONSTRAINTS;
DROP TABLE PESAJE CASCADE CONSTRAINTS;
DROP TABLE GENEALOGIA CASCADE CONSTRAINTS;
DROP TABLE ANIMAL CASCADE CONSTRAINTS;
DROP TABLE RAZA CASCADE CONSTRAINTS;
DROP TABLE USUARIO CASCADE CONSTRAINTS;

-- Mensaje de confirmacion
SELECT 'Todas las tablas eliminadas correctamente' AS resultado FROM DUAL;
