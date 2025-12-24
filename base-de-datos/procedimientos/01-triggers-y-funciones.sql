-- ==================================================================
-- Sistema de Gestión Zootécnica Caprina
-- Triggers y Procedimientos Almacenados
-- Versión: 1.0
-- Descripción: Lógica de negocio automatizada en base de datos
-- ==================================================================

-- ==================================================================
-- TRIGGER: calcular_fecha_parto_estimada
-- Descripción: Calcula automáticamente la fecha estimada de parto
-- Nota: Gestación caprina = 150 días promedio
-- ==================================================================
CREATE OR REPLACE TRIGGER trg_calcular_fecha_parto
BEFORE INSERT ON REPRODUCCION
FOR EACH ROW
BEGIN
    -- Si no se proporciona fecha estimada, calcularla automáticamente
    IF :NEW.fecha_parto_estimada IS NULL THEN
        :NEW.fecha_parto_estimada := :NEW.fecha_servicio + 150;
    END IF;
    
    -- Validar que la fecha estimada sea coherente (entre 145 y 155 días)
    IF :NEW.fecha_parto_estimada < :NEW.fecha_servicio + 145 OR 
       :NEW.fecha_parto_estimada > :NEW.fecha_servicio + 155 THEN
        RAISE_APPLICATION_ERROR(-20001, 
            'La fecha de parto estimada debe estar entre 145 y 155 días después del servicio');
    END IF;
END;
/

-- ==================================================================
-- TRIGGER: calcular_edad_en_pesaje
-- Descripción: Calcula la edad del animal al momento del pesaje
-- ==================================================================
CREATE OR REPLACE TRIGGER trg_calcular_edad_pesaje
BEFORE INSERT ON PESAJE
FOR EACH ROW
DECLARE
    v_fecha_nacimiento DATE;
BEGIN
    -- Obtener fecha de nacimiento del animal
    SELECT fecha_nacimiento INTO v_fecha_nacimiento
    FROM ANIMAL
    WHERE id_animal = :NEW.id_animal;
    
    -- Calcular edad en días
    :NEW.edad_dias := TRUNC(:NEW.fecha_pesaje - v_fecha_nacimiento);
    
    -- Validar que el pesaje no sea anterior al nacimiento
    IF :NEW.edad_dias < 0 THEN
        RAISE_APPLICATION_ERROR(-20002, 
            'La fecha de pesaje no puede ser anterior a la fecha de nacimiento del animal');
    END IF;
END;
/

-- ==================================================================
-- TRIGGER: calcular_ganancia_diaria_peso
-- Descripción: Calcula la ganancia diaria de peso desde el último pesaje
-- ==================================================================
CREATE OR REPLACE TRIGGER trg_calcular_ganancia_peso
BEFORE INSERT ON PESAJE
FOR EACH ROW
DECLARE
    v_peso_anterior NUMBER;
    v_fecha_anterior DATE;
    v_dias_diferencia NUMBER;
BEGIN
    -- Buscar el pesaje anterior más reciente
    BEGIN
        SELECT peso_kg, fecha_pesaje 
        INTO v_peso_anterior, v_fecha_anterior
        FROM PESAJE
        WHERE id_animal = :NEW.id_animal
        AND fecha_pesaje < :NEW.fecha_pesaje
        ORDER BY fecha_pesaje DESC
        FETCH FIRST 1 ROW ONLY;
        
        -- Calcular días transcurridos
        v_dias_diferencia := TRUNC(:NEW.fecha_pesaje - v_fecha_anterior);
        
        -- Calcular ganancia diaria promedio
        IF v_dias_diferencia > 0 THEN
            :NEW.ganancia_diaria_kg := ROUND((:NEW.peso_kg - v_peso_anterior) / v_dias_diferencia, 3);
        END IF;
        
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            -- Es el primer pesaje del animal, no hay ganancia que calcular
            :NEW.ganancia_diaria_kg := NULL;
    END;
END;
/

-- ==================================================================
-- TRIGGER: calcular_dias_lactancia
-- Descripción: Calcula los días de lactancia basándose en el último parto
-- ==================================================================
CREATE OR REPLACE TRIGGER trg_calcular_dias_lactancia
BEFORE INSERT ON PRODUCCION_LECHE
FOR EACH ROW
DECLARE
    v_fecha_ultimo_parto DATE;
    v_numero_lactancia NUMBER;
BEGIN
    -- Buscar el último parto del animal
    BEGIN
        SELECT fecha_parto_real, ROWNUM
        INTO v_fecha_ultimo_parto, v_numero_lactancia
        FROM (
            SELECT fecha_parto_real
            FROM REPRODUCCION
            WHERE id_hembra = :NEW.id_animal
            AND fecha_parto_real IS NOT NULL
            AND resultado = 'exitoso'
            ORDER BY fecha_parto_real DESC
        )
        WHERE ROWNUM = 1;
        
        -- Calcular días de lactancia
        :NEW.dias_lactancia := TRUNC(:NEW.fecha_produccion - v_fecha_ultimo_parto);
        
        -- Contar número de lactancia
        SELECT COUNT(*) + 1 INTO :NEW.numero_lactancia
        FROM REPRODUCCION
        WHERE id_hembra = :NEW.id_animal
        AND fecha_parto_real IS NOT NULL
        AND fecha_parto_real <= v_fecha_ultimo_parto
        AND resultado = 'exitoso';
        
        -- Validar que no se registre producción sin haber parido
        IF :NEW.dias_lactancia < 0 THEN
            RAISE_APPLICATION_ERROR(-20003, 
                'No se puede registrar producción antes del parto');
        END IF;
        
        -- Advertencia si la lactancia es muy extensa (más de 305 días)
        IF :NEW.dias_lactancia > 305 THEN
            DBMS_OUTPUT.PUT_LINE('ADVERTENCIA: Lactancia extendida, revisar estado reproductivo');
        END IF;
        
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20004, 
                'No se puede registrar producción de leche sin un parto previo registrado');
    END;
END;
/

-- ==================================================================
-- TRIGGER: validar_estado_animal_activo
-- Descripción: Impide registrar datos en animales no activos
-- ==================================================================
CREATE OR REPLACE TRIGGER trg_validar_animal_activo_pesaje
BEFORE INSERT ON PESAJE
FOR EACH ROW
DECLARE
    v_estado_animal VARCHAR2(30);
BEGIN
    SELECT estado INTO v_estado_animal
    FROM ANIMAL
    WHERE id_animal = :NEW.id_animal;
    
    IF v_estado_animal != 'activo' THEN
        RAISE_APPLICATION_ERROR(-20005, 
            'No se pueden registrar pesajes en animales con estado: ' || v_estado_animal);
    END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_validar_animal_activo_prod
BEFORE INSERT ON PRODUCCION_LECHE
FOR EACH ROW
DECLARE
    v_estado_animal VARCHAR2(30);
BEGIN
    SELECT estado INTO v_estado_animal
    FROM ANIMAL
    WHERE id_animal = :NEW.id_animal;
    
    IF v_estado_animal != 'activo' THEN
        RAISE_APPLICATION_ERROR(-20006, 
            'No se puede registrar producción en animales con estado: ' || v_estado_animal);
    END IF;
END;
/

-- ==================================================================
-- TRIGGER: auditoria_animal
-- Descripción: Registra cambios en la tabla ANIMAL para trazabilidad
-- ==================================================================
CREATE OR REPLACE TRIGGER trg_auditoria_animal
AFTER INSERT OR UPDATE OR DELETE ON ANIMAL
FOR EACH ROW
DECLARE
    v_operacion VARCHAR2(20);
    v_datos_anteriores CLOB;
    v_datos_nuevos CLOB;
BEGIN
    -- Determinar tipo de operación
    IF INSERTING THEN
        v_operacion := 'INSERT';
        v_datos_nuevos := JSON_OBJECT(
            'id_animal' VALUE :NEW.id_animal,
            'codigo_identificacion' VALUE :NEW.codigo_identificacion,
            'nombre' VALUE :NEW.nombre,
            'estado' VALUE :NEW.estado
        );
    ELSIF UPDATING THEN
        v_operacion := 'UPDATE';
        v_datos_anteriores := JSON_OBJECT(
            'id_animal' VALUE :OLD.id_animal,
            'codigo_identificacion' VALUE :OLD.codigo_identificacion,
            'nombre' VALUE :OLD.nombre,
            'estado' VALUE :OLD.estado
        );
        v_datos_nuevos := JSON_OBJECT(
            'id_animal' VALUE :NEW.id_animal,
            'codigo_identificacion' VALUE :NEW.codigo_identificacion,
            'nombre' VALUE :NEW.nombre,
            'estado' VALUE :NEW.estado
        );
    ELSIF DELETING THEN
        v_operacion := 'DELETE';
        v_datos_anteriores := JSON_OBJECT(
            'id_animal' VALUE :OLD.id_animal,
            'codigo_identificacion' VALUE :OLD.codigo_identificacion,
            'nombre' VALUE :OLD.nombre,
            'estado' VALUE :OLD.estado
        );
    END IF;
    
    -- Insertar registro de auditoría
    INSERT INTO AUDITORIA (
        tabla,
        operacion,
        id_registro,
        datos_anteriores,
        datos_nuevos,
        fecha_operacion
    ) VALUES (
        'ANIMAL',
        v_operacion,
        COALESCE(:NEW.id_animal, :OLD.id_animal),
        v_datos_anteriores,
        v_datos_nuevos,
        CURRENT_TIMESTAMP
    );
END;
/

-- ==================================================================
-- PROCEDIMIENTO: registrar_descarte_animal
-- Descripción: Procedimiento para dar de baja un animal del sistema
-- Parámetros:
--   p_id_animal: ID del animal a descartar
--   p_motivo: Razón del descarte
--   p_usuario: Usuario que realiza la operación
-- ==================================================================
CREATE OR REPLACE PROCEDURE sp_registrar_descarte_animal (
    p_id_animal IN NUMBER,
    p_motivo IN VARCHAR2,
    p_usuario IN NUMBER
)
AS
    v_estado_actual VARCHAR2(30);
BEGIN
    -- Verificar estado actual del animal
    SELECT estado INTO v_estado_actual
    FROM ANIMAL
    WHERE id_animal = p_id_animal;
    
    IF v_estado_actual = 'descartado' THEN
        RAISE_APPLICATION_ERROR(-20007, 'El animal ya está descartado');
    END IF;
    
    -- Actualizar estado del animal
    UPDATE ANIMAL
    SET estado = 'descartado',
        motivo_estado = p_motivo,
        fecha_cambio_estado = CURRENT_TIMESTAMP
    WHERE id_animal = p_id_animal;
    
    -- Confirmar transacción
    COMMIT;
    
    DBMS_OUTPUT.PUT_LINE('Animal ' || p_id_animal || ' descartado exitosamente');
    
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20008, 'Animal no encontrado');
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END;
/

-- ==================================================================
-- PROCEDIMIENTO: calcular_peso_estimado
-- Descripción: Estima el peso actual de un animal basándose en curva de crecimiento
-- Parámetros:
--   p_id_animal: ID del animal
--   p_fecha: Fecha para la cual estimar el peso
-- Retorna: Peso estimado en kg
-- ==================================================================
CREATE OR REPLACE FUNCTION fn_calcular_peso_estimado (
    p_id_animal IN NUMBER,
    p_fecha IN DATE DEFAULT SYSDATE
) RETURN NUMBER
AS
    v_peso_anterior NUMBER;
    v_fecha_anterior DATE;
    v_peso_posterior NUMBER;
    v_fecha_posterior DATE;
    v_peso_estimado NUMBER;
    v_dias_diferencia NUMBER;
    v_peso_por_dia NUMBER;
BEGIN
    -- Buscar el pesaje inmediatamente anterior a la fecha
    BEGIN
        SELECT peso_kg, fecha_pesaje
        INTO v_peso_anterior, v_fecha_anterior
        FROM PESAJE
        WHERE id_animal = p_id_animal
        AND fecha_pesaje <= p_fecha
        ORDER BY fecha_pesaje DESC
        FETCH FIRST 1 ROW ONLY;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RETURN NULL; -- No hay datos suficientes
    END;
    
    -- Buscar el pesaje inmediatamente posterior a la fecha
    BEGIN
        SELECT peso_kg, fecha_pesaje
        INTO v_peso_posterior, v_fecha_posterior
        FROM PESAJE
        WHERE id_animal = p_id_animal
        AND fecha_pesaje > p_fecha
        ORDER BY fecha_pesaje ASC
        FETCH FIRST 1 ROW ONLY;
        
        -- Interpolación lineal entre dos pesajes
        v_dias_diferencia := TRUNC(v_fecha_posterior - v_fecha_anterior);
        v_peso_por_dia := (v_peso_posterior - v_peso_anterior) / v_dias_diferencia;
        v_peso_estimado := v_peso_anterior + (v_peso_por_dia * TRUNC(p_fecha - v_fecha_anterior));
        
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            -- No hay pesaje posterior, retornar el último peso conocido
            v_peso_estimado := v_peso_anterior;
    END;
    
    RETURN ROUND(v_peso_estimado, 2);
END;
/

-- ==================================================================
-- PROCEDIMIENTO: validar_consanguinidad
-- Descripción: Valida que un cruce no genere consanguinidad excesiva
-- Parámetros:
--   p_id_padre: ID del padre propuesto
--   p_id_madre: ID de la madre propuesta
-- Retorna: TRUE si el cruce es válido, FALSE si hay consanguinidad
-- ==================================================================
CREATE OR REPLACE FUNCTION fn_validar_consanguinidad (
    p_id_padre IN NUMBER,
    p_id_madre IN NUMBER
) RETURN BOOLEAN
AS
    v_abuelo_paterno NUMBER;
    v_abuela_paterna NUMBER;
    v_abuelo_materno NUMBER;
    v_abuela_materna NUMBER;
    v_consanguinidad_detectada BOOLEAN := FALSE;
BEGIN
    -- Obtener abuelos paternos
    BEGIN
        SELECT id_padre, id_madre
        INTO v_abuelo_paterno, v_abuela_paterna
        FROM GENEALOGIA
        WHERE id_animal = p_id_padre;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            v_abuelo_paterno := NULL;
            v_abuela_paterna := NULL;
    END;
    
    -- Obtener abuelos maternos
    BEGIN
        SELECT id_padre, id_madre
        INTO v_abuelo_materno, v_abuela_materna
        FROM GENEALOGIA
        WHERE id_animal = p_id_madre;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            v_abuelo_materno := NULL;
            v_abuela_materna := NULL;
    END;
    
    -- Validar que no sean hermanos completos (mismo padre y madre)
    IF v_abuelo_paterno IS NOT NULL AND v_abuelo_materno IS NOT NULL THEN
        IF v_abuelo_paterno = v_abuelo_materno AND v_abuela_paterna = v_abuela_materna THEN
            v_consanguinidad_detectada := TRUE;
        END IF;
    END IF;
    
    -- Validar que el padre no sea hijo de la madre o viceversa
    IF p_id_padre = v_abuelo_materno OR p_id_padre = v_abuela_materna THEN
        v_consanguinidad_detectada := TRUE;
    END IF;
    
    IF p_id_madre = v_abuelo_paterno OR p_id_madre = v_abuela_paterna THEN
        v_consanguinidad_detectada := TRUE;
    END IF;
    
    RETURN NOT v_consanguinidad_detectada;
END;
/

-- ==================================================================
-- PROCEDIMIENTO: calcular_produccion_promedio_lactancia
-- Descripción: Calcula la producción total y promedio de una lactancia
-- Parámetros:
--   p_id_animal: ID del animal
--   p_numero_lactancia: Número de lactancia (1, 2, 3, etc.)
-- Retorna: Producción total en litros
-- ==================================================================
CREATE OR REPLACE FUNCTION fn_calcular_produccion_lactancia (
    p_id_animal IN NUMBER,
    p_numero_lactancia IN NUMBER DEFAULT NULL
) RETURN NUMBER
AS
    v_produccion_total NUMBER;
    v_lactancia_actual NUMBER;
BEGIN
    -- Si no se especifica lactancia, usar la actual
    IF p_numero_lactancia IS NULL THEN
        SELECT MAX(numero_lactancia) INTO v_lactancia_actual
        FROM PRODUCCION_LECHE
        WHERE id_animal = p_id_animal;
    ELSE
        v_lactancia_actual := p_numero_lactancia;
    END IF;
    
    -- Calcular producción total de esa lactancia
    SELECT SUM(litros) INTO v_produccion_total
    FROM PRODUCCION_LECHE
    WHERE id_animal = p_id_animal
    AND numero_lactancia = v_lactancia_actual;
    
    RETURN COALESCE(v_produccion_total, 0);
END;
/

-- ==================================================================
-- TRIGGER: validar_reproduccion_consanguinidad
-- Descripción: Valida automáticamente consanguinidad antes de insertar
-- ==================================================================
CREATE OR REPLACE TRIGGER trg_validar_consanguinidad
BEFORE INSERT ON REPRODUCCION
FOR EACH ROW
DECLARE
    v_consanguinidad_valida BOOLEAN;
BEGIN
    IF :NEW.id_macho IS NOT NULL THEN
        v_consanguinidad_valida := fn_validar_consanguinidad(:NEW.id_macho, :NEW.id_hembra);
        
        IF NOT v_consanguinidad_valida THEN
            RAISE_APPLICATION_ERROR(-20009, 
                'ADVERTENCIA: Este cruce presenta riesgo de consanguinidad. Revisar genealogía.');
        END IF;
    END IF;
END;
/

-- ==================================================================
-- PROCEDIMIENTO: generar_reporte_animal_completo
-- Descripción: Genera un reporte completo de un animal con todos sus datos
-- ==================================================================
CREATE OR REPLACE PROCEDURE sp_reporte_animal_completo (
    p_id_animal IN NUMBER
)
AS
    v_animal ANIMAL%ROWTYPE;
    v_raza_nombre VARCHAR2(100);
    v_total_pesajes NUMBER;
    v_peso_actual NUMBER;
    v_produccion_total NUMBER;
    v_numero_partos NUMBER;
BEGIN
    -- Obtener datos del animal
    SELECT * INTO v_animal
    FROM ANIMAL
    WHERE id_animal = p_id_animal;
    
    -- Obtener nombre de raza
    SELECT nombre_raza INTO v_raza_nombre
    FROM RAZA
    WHERE id_raza = v_animal.id_raza;
    
    -- Contar pesajes
    SELECT COUNT(*) INTO v_total_pesajes
    FROM PESAJE
    WHERE id_animal = p_id_animal;
    
    -- Obtener peso más reciente
    v_peso_actual := fn_calcular_peso_estimado(p_id_animal, SYSDATE);
    
    -- Calcular producción total (si es hembra)
    IF v_animal.sexo = 'hembra' THEN
        SELECT COALESCE(SUM(litros), 0) INTO v_produccion_total
        FROM PRODUCCION_LECHE
        WHERE id_animal = p_id_animal;
        
        SELECT COUNT(*) INTO v_numero_partos
        FROM REPRODUCCION
        WHERE id_hembra = p_id_animal
        AND fecha_parto_real IS NOT NULL;
    END IF;
    
    -- Imprimir reporte
    DBMS_OUTPUT.PUT_LINE('========================================');
    DBMS_OUTPUT.PUT_LINE('REPORTE COMPLETO DEL ANIMAL');
    DBMS_OUTPUT.PUT_LINE('========================================');
    DBMS_OUTPUT.PUT_LINE('Código: ' || v_animal.codigo_identificacion);
    DBMS_OUTPUT.PUT_LINE('Nombre: ' || v_animal.nombre);
    DBMS_OUTPUT.PUT_LINE('Raza: ' || v_raza_nombre);
    DBMS_OUTPUT.PUT_LINE('Sexo: ' || v_animal.sexo);
    DBMS_OUTPUT.PUT_LINE('Fecha Nacimiento: ' || TO_CHAR(v_animal.fecha_nacimiento, 'DD/MM/YYYY'));
    DBMS_OUTPUT.PUT_LINE('Estado: ' || v_animal.estado);
    DBMS_OUTPUT.PUT_LINE('Total Pesajes: ' || v_total_pesajes);
    DBMS_OUTPUT.PUT_LINE('Peso Actual Estimado: ' || v_peso_actual || ' kg');
    
    IF v_animal.sexo = 'hembra' THEN
        DBMS_OUTPUT.PUT_LINE('Producción Total: ' || v_produccion_total || ' litros');
        DBMS_OUTPUT.PUT_LINE('Número de Partos: ' || v_numero_partos);
    END IF;
    
    DBMS_OUTPUT.PUT_LINE('========================================');
    
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        DBMS_OUTPUT.PUT_LINE('Error: Animal no encontrado');
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error al generar reporte: ' || SQLERRM);
END;
/

-- ==================================================================
-- FIN DE TRIGGERS Y PROCEDIMIENTOS
-- ==================================================================
