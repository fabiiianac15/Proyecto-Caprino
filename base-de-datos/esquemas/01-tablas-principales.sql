-- ==================================================================
-- Sistema de Gestión Zootécnica Caprina
-- Esquema de Base de Datos Oracle
-- Versión: 1.0
-- Descripción: Definición completa de tablas para trazabilidad animal
-- ==================================================================

-- ==================================================================
-- TABLA: RAZA
-- Descripción: Catálogo de razas caprinas disponibles en el sistema
-- ==================================================================
CREATE TABLE RAZA (
    id_raza NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_raza VARCHAR2(100) NOT NULL UNIQUE,
    origen VARCHAR2(100),
    caracteristicas CLOB,
    aptitud VARCHAR2(50) CHECK (aptitud IN ('lechera', 'carnica', 'doble_proposito')),
    peso_adulto_promedio_kg NUMBER(5,2),
    produccion_leche_dia_promedio NUMBER(5,2),
    estado VARCHAR2(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_peso_positivo CHECK (peso_adulto_promedio_kg > 0),
    CONSTRAINT check_produccion_positiva CHECK (produccion_leche_dia_promedio >= 0)
);

COMMENT ON TABLE RAZA IS 'Catálogo de razas caprinas con características zootécnicas';
COMMENT ON COLUMN RAZA.aptitud IS 'Clasificación productiva: lechera, cárnica o doble propósito';
COMMENT ON COLUMN RAZA.peso_adulto_promedio_kg IS 'Peso promedio de un animal adulto de la raza en kilogramos';

-- ==================================================================
-- TABLA: ANIMAL
-- Descripción: Entidad principal que representa cada cabra individual
-- Nota: Centro del sistema de trazabilidad
-- ==================================================================
CREATE TABLE ANIMAL (
    id_animal NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_identificacion VARCHAR2(50) NOT NULL UNIQUE,
    nombre VARCHAR2(100),
    fecha_nacimiento DATE NOT NULL,
    sexo VARCHAR2(10) NOT NULL CHECK (sexo IN ('macho', 'hembra')),
    id_raza NUMBER NOT NULL,
    color_pelaje VARCHAR2(50),
    peso_nacimiento_kg NUMBER(5,2),
    estado VARCHAR2(30) DEFAULT 'activo' CHECK (estado IN ('activo', 'vendido', 'muerto', 'descartado')),
    motivo_estado VARCHAR2(500),
    fecha_cambio_estado TIMESTAMP,
    observaciones CLOB,
    foto_url VARCHAR2(500),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_registro NUMBER NOT NULL,
    CONSTRAINT fk_animal_raza FOREIGN KEY (id_raza) REFERENCES RAZA(id_raza),
    CONSTRAINT check_peso_nacimiento CHECK (peso_nacimiento_kg > 0 AND peso_nacimiento_kg < 10)
);

COMMENT ON TABLE ANIMAL IS 'Registro individual de cada cabra con identificación única';
COMMENT ON COLUMN ANIMAL.codigo_identificacion IS 'Identificador único del animal (crotal, QR o chip)';
COMMENT ON COLUMN ANIMAL.estado IS 'Estado actual del animal en la explotación';
COMMENT ON COLUMN ANIMAL.peso_nacimiento_kg IS 'Peso al nacer, normalmente entre 2-4 kg';

-- Indice en codigo_identificacion eliminado: UNIQUE constraint ya crea indice automatico
CREATE INDEX idx_animal_estado ON ANIMAL(estado);
CREATE INDEX idx_animal_raza ON ANIMAL(id_raza);

-- ==================================================================
-- TABLA: GENEALOGIA
-- Descripción: Relación de parentesco entre animales
-- Nota: Permite trazabilidad genética y evitar consanguinidad
-- ==================================================================
CREATE TABLE GENEALOGIA (
    id_genealogia NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_animal NUMBER NOT NULL,
    id_padre NUMBER,
    id_madre NUMBER,
    generacion NUMBER,
    coeficiente_consanguinidad NUMBER(5,4),
    observaciones VARCHAR2(500),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_gen_animal FOREIGN KEY (id_animal) REFERENCES ANIMAL(id_animal),
    CONSTRAINT fk_gen_padre FOREIGN KEY (id_padre) REFERENCES ANIMAL(id_animal),
    CONSTRAINT fk_gen_madre FOREIGN KEY (id_madre) REFERENCES ANIMAL(id_animal),
    CONSTRAINT uk_genealogia_animal UNIQUE (id_animal),
    CONSTRAINT check_padre_distinto CHECK (id_animal != id_padre),
    CONSTRAINT check_madre_distinta CHECK (id_animal != id_madre),
    CONSTRAINT check_padres_distintos CHECK (id_padre != id_madre)
);

COMMENT ON TABLE GENEALOGIA IS 'Registro genealógico con padre y madre de cada animal';
COMMENT ON COLUMN GENEALOGIA.coeficiente_consanguinidad IS 'Medida de consanguinidad, entre 0 y 1';
COMMENT ON COLUMN GENEALOGIA.generacion IS 'Número de generación en el programa de cría';

-- Indice en id_animal eliminado: UNIQUE constraint ya crea indice automatico
CREATE INDEX idx_gen_padre ON GENEALOGIA(id_padre);
CREATE INDEX idx_gen_madre ON GENEALOGIA(id_madre);

-- ==================================================================
-- TABLA: PESAJE
-- Descripción: Registro de pesos para control de crecimiento
-- Nota: Esencial para evaluación nutricional y desarrollo
-- ==================================================================
CREATE TABLE PESAJE (
    id_pesaje NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_animal NUMBER NOT NULL,
    fecha_pesaje DATE NOT NULL,
    peso_kg NUMBER(6,2) NOT NULL,
    edad_dias NUMBER,
    ganancia_diaria_kg NUMBER(5,3),
    condicion_corporal NUMBER(1) CHECK (condicion_corporal BETWEEN 1 AND 5),
    observaciones VARCHAR2(500),
    metodo_pesaje VARCHAR2(50),
    usuario_registro NUMBER NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pesaje_animal FOREIGN KEY (id_animal) REFERENCES ANIMAL(id_animal),
    CONSTRAINT check_peso_pesaje_positivo CHECK (peso_kg > 0),
    CONSTRAINT check_peso_pesaje_maximo CHECK (peso_kg < 200)
);

COMMENT ON TABLE PESAJE IS 'Historial de pesajes para seguimiento de crecimiento';
COMMENT ON COLUMN PESAJE.condicion_corporal IS 'Escala de 1 a 5 según evaluación visual y palpación';
COMMENT ON COLUMN PESAJE.ganancia_diaria_kg IS 'Ganancia de peso promedio diaria desde último pesaje';
COMMENT ON COLUMN PESAJE.edad_dias IS 'Edad del animal en días al momento del pesaje';

CREATE INDEX idx_pesaje_animal ON PESAJE(id_animal);
CREATE INDEX idx_pesaje_fecha ON PESAJE(fecha_pesaje);

-- ==================================================================
-- TABLA: PRODUCCION_LECHE
-- Descripción: Registro diario de producción lechera
-- Nota: Tabla de alta frecuencia, considerar particionamiento
-- ==================================================================
CREATE TABLE PRODUCCION_LECHE (
    id_produccion NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_animal NUMBER NOT NULL,
    fecha_produccion DATE NOT NULL,
    litros NUMBER(5,2) NOT NULL,
    numero_lactancia NUMBER,
    dias_lactancia NUMBER,
    grasa_porcentaje NUMBER(4,2),
    proteina_porcentaje NUMBER(4,2),
    celulas_somaticas NUMBER,
    metodo_medicion VARCHAR2(50),
    turno VARCHAR2(20) CHECK (turno IN ('mañana', 'tarde', 'noche', 'total_dia')),
    observaciones VARCHAR2(500),
    usuario_registro NUMBER NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prod_animal FOREIGN KEY (id_animal) REFERENCES ANIMAL(id_animal),
    CONSTRAINT check_litros_positivo CHECK (litros >= 0),
    CONSTRAINT check_litros_maximo CHECK (litros < 20),
    CONSTRAINT check_grasa CHECK (grasa_porcentaje BETWEEN 0 AND 10),
    CONSTRAINT check_proteina CHECK (proteina_porcentaje BETWEEN 0 AND 8)
);

COMMENT ON TABLE PRODUCCION_LECHE IS 'Registro de producción lechera con parámetros de calidad';
COMMENT ON COLUMN PRODUCCION_LECHE.numero_lactancia IS 'Número de lactancia actual (1=primera, 2=segunda, etc.)';
COMMENT ON COLUMN PRODUCCION_LECHE.dias_lactancia IS 'Días transcurridos desde el parto';
COMMENT ON COLUMN PRODUCCION_LECHE.celulas_somaticas IS 'Indicador de salud de la ubre (células/ml)';

CREATE INDEX idx_prod_animal ON PRODUCCION_LECHE(id_animal);
CREATE INDEX idx_prod_fecha ON PRODUCCION_LECHE(fecha_produccion);
CREATE INDEX idx_prod_animal_fecha ON PRODUCCION_LECHE(id_animal, fecha_produccion);

-- ==================================================================
-- TABLA: REPRODUCCION
-- Descripción: Control de eventos reproductivos (cubrición y parto)
-- Nota: Crítico para planificación reproductiva y genética
-- ==================================================================
CREATE TABLE REPRODUCCION (
    id_reproduccion NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_hembra NUMBER NOT NULL,
    id_macho NUMBER,
    tipo_servicio VARCHAR2(30) CHECK (tipo_servicio IN ('monta_natural', 'inseminacion_artificial', 'transferencia_embrion')),
    fecha_servicio DATE NOT NULL,
    fecha_parto_estimada DATE,
    fecha_parto_real DATE,
    tipo_parto VARCHAR2(30) CHECK (tipo_parto IN ('simple', 'doble', 'triple', 'multiple')),
    numero_crias NUMBER,
    resultado VARCHAR2(30) CHECK (resultado IN ('exitoso', 'aborto', 'mortinato', 'pendiente')),
    dificultad_parto VARCHAR2(30) CHECK (dificultad_parto IN ('normal', 'asistido', 'distocico', 'cesarea')),
    observaciones CLOB,
    usuario_registro NUMBER NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_repro_hembra FOREIGN KEY (id_hembra) REFERENCES ANIMAL(id_animal),
    CONSTRAINT fk_repro_macho FOREIGN KEY (id_macho) REFERENCES ANIMAL(id_animal),
    CONSTRAINT check_hembra_distinto_macho CHECK (id_hembra != id_macho),
    CONSTRAINT check_fecha_parto_estimada CHECK (fecha_parto_estimada > fecha_servicio),
    CONSTRAINT check_fecha_parto_real CHECK (fecha_parto_real IS NULL OR fecha_parto_real >= fecha_servicio),
    CONSTRAINT check_numero_crias CHECK (numero_crias BETWEEN 1 AND 5)
);

COMMENT ON TABLE REPRODUCCION IS 'Historial reproductivo con servicios y partos';
COMMENT ON COLUMN REPRODUCCION.fecha_parto_estimada IS 'Fecha calculada: fecha_servicio + 150 días (gestación caprina)';
COMMENT ON COLUMN REPRODUCCION.tipo_parto IS 'Número de crías nacidas en el parto';
COMMENT ON COLUMN REPRODUCCION.dificultad_parto IS 'Clasificación de la asistencia requerida en el parto';

CREATE INDEX idx_repro_hembra ON REPRODUCCION(id_hembra);
CREATE INDEX idx_repro_macho ON REPRODUCCION(id_macho);
CREATE INDEX idx_repro_fecha_servicio ON REPRODUCCION(fecha_servicio);

-- ==================================================================
-- TABLA: SALUD
-- Descripción: Historial sanitario completo del animal
-- Nota: Incluye vacunas, tratamientos y diagnósticos
-- ==================================================================
CREATE TABLE SALUD (
    id_registro NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_animal NUMBER NOT NULL,
    tipo_registro VARCHAR2(30) CHECK (tipo_registro IN ('vacuna', 'tratamiento', 'diagnostico', 'cirugia', 'desparasitacion')),
    fecha_aplicacion DATE NOT NULL,
    enfermedad_diagnostico VARCHAR2(200),
    medicamento_producto VARCHAR2(200),
    dosis VARCHAR2(100),
    via_administracion VARCHAR2(50) CHECK (via_administracion IN ('oral', 'intramuscular', 'subcutanea', 'intravenosa', 'topica')),
    lote_producto VARCHAR2(100),
    fecha_proxima_aplicacion DATE,
    dias_retiro_leche NUMBER,
    dias_retiro_carne NUMBER,
    veterinario VARCHAR2(200),
    observaciones CLOB,
    usuario_registro NUMBER NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_salud_animal FOREIGN KEY (id_animal) REFERENCES ANIMAL(id_animal),
    CONSTRAINT check_fecha_proxima CHECK (fecha_proxima_aplicacion IS NULL OR fecha_proxima_aplicacion > fecha_aplicacion)
);

COMMENT ON TABLE SALUD IS 'Registro sanitario completo con trazabilidad de tratamientos';
COMMENT ON COLUMN SALUD.dias_retiro_leche IS 'Días que debe suspenderse el consumo de leche tras aplicación';
COMMENT ON COLUMN SALUD.dias_retiro_carne IS 'Días que debe suspenderse el consumo de carne tras aplicación';
COMMENT ON COLUMN SALUD.lote_producto IS 'Número de lote del medicamento para trazabilidad';

CREATE INDEX idx_salud_animal ON SALUD(id_animal);
CREATE INDEX idx_salud_fecha ON SALUD(fecha_aplicacion);
CREATE INDEX idx_salud_tipo ON SALUD(tipo_registro);

-- ==================================================================
-- TABLA: USUARIO
-- Descripción: Usuarios del sistema con roles definidos
-- Nota: Controla acceso y auditoría de operaciones
-- ==================================================================
CREATE TABLE USUARIO (
    id_usuario NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_completo VARCHAR2(200) NOT NULL,
    email VARCHAR2(200) NOT NULL UNIQUE,
    password_hash VARCHAR2(255) NOT NULL,
    rol VARCHAR2(30) NOT NULL CHECK (rol IN ('administrador', 'zootecnista', 'tecnico', 'veterinario')),
    telefono VARCHAR2(20),
    estado VARCHAR2(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'bloqueado')),
    ultimo_acceso TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP,
    CONSTRAINT check_email_formato CHECK (email LIKE '%@%.%')
);

COMMENT ON TABLE USUARIO IS 'Usuarios del sistema con control de acceso por roles';
COMMENT ON COLUMN USUARIO.password_hash IS 'Hash bcrypt del password, nunca almacenar en texto plano';
COMMENT ON COLUMN USUARIO.rol IS 'Rol que determina permisos: administrador tiene acceso total';

-- Indice eliminado: UNIQUE constraint en email ya crea indice automatico

-- ==================================================================
-- TABLA: AUDITORIA
-- Descripción: Log de operaciones críticas para trazabilidad
-- Nota: Se llena automáticamente mediante triggers
-- ==================================================================
CREATE TABLE AUDITORIA (
    id_auditoria NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tabla VARCHAR2(50) NOT NULL,
    operacion VARCHAR2(20) CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
    id_registro NUMBER,
    datos_anteriores CLOB,
    datos_nuevos CLOB,
    id_usuario NUMBER,
    fecha_operacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_origen VARCHAR2(50)
);

COMMENT ON TABLE AUDITORIA IS 'Registro de auditoría de todas las operaciones críticas';
COMMENT ON COLUMN AUDITORIA.datos_anteriores IS 'JSON con estado previo del registro (solo UPDATE)';
COMMENT ON COLUMN AUDITORIA.datos_nuevos IS 'JSON con nuevo estado del registro';

CREATE INDEX idx_audit_tabla ON AUDITORIA(tabla);
CREATE INDEX idx_audit_fecha ON AUDITORIA(fecha_operacion);

-- ==================================================================
-- SECUENCIAS ADICIONALES (si se requieren para compatibilidad)
-- ==================================================================
-- Las secuencias se crean automáticamente con IDENTITY
-- pero se pueden crear manualmente si se prefiere control explícito

-- ==================================================================
-- CONSTRAINTS ADICIONALES
-- ==================================================================
-- NOTA: Oracle no permite subconsultas en CHECK constraints.
-- Estas validaciones de sexo (padre=macho, madre=hembra, etc.)
-- se implementarán mediante TRIGGERS en el archivo:
-- base-de-datos/procedimientos/01-triggers-y-funciones.sql

-- ==================================================================
-- FIN DEL SCRIPT DE CREACIÓN DE ESQUEMA
-- ==================================================================
