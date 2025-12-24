-- ==================================================================
-- Script de Datos Iniciales - Razas Caprinas
-- Descripción: Carga del catálogo de razas caprinas más comunes
-- ==================================================================

-- Limpiar datos previos (solo para desarrollo)
-- DELETE FROM RAZA;

-- ==================================================================
-- RAZAS LECHERAS
-- ==================================================================

-- Raza Saanen
INSERT INTO RAZA (nombre_raza, origen, aptitud, peso_adulto_promedio_kg, produccion_leche_dia_promedio, caracteristicas)
VALUES (
    'Saanen',
    'Suiza',
    'lechera',
    65.0,
    4.5,
    'Raza suiza de gran tamaño y color blanco uniforme. Excelente productora de leche con bajo contenido graso. Muy adaptable a diferentes climas. Carácter dócil y fácil manejo.'
);

-- Raza Alpina Francesa
INSERT INTO RAZA (nombre_raza, origen, aptitud, peso_adulto_promedio_kg, produccion_leche_dia_promedio, caracteristicas)
VALUES (
    'Alpina Francesa',
    'Francia',
    'lechera',
    55.0,
    3.8,
    'Origen en los Alpes franceses. Pelaje variado con colores desde beige hasta negro. Buena producción lechera con mayor contenido graso que Saanen. Muy resistente a diferentes condiciones climáticas.'
);

-- Raza Toggenburg
INSERT INTO RAZA (nombre_raza, origen, aptitud, peso_adulto_promedio_kg, produccion_leche_dia_promedio, caracteristicas)
VALUES (
    'Toggenburg',
    'Suiza',
    'lechera',
    50.0,
    3.2,
    'Una de las razas más antiguas. Color marrón con marcas blancas características. Buena producción lechera constante. Muy adaptable a climas fríos y montañosos.'
);

-- Raza Murciano-Granadina
INSERT INTO RAZA (nombre_raza, origen, aptitud, peso_adulto_promedio_kg, produccion_leche_dia_promedio, caracteristicas)
VALUES (
    'Murciano-Granadina',
    'España',
    'lechera',
    50.0,
    3.5,
    'Raza española de color negro o caoba uniforme. Excelente producción lechera con alta calidad. Muy adaptada a climas cálidos y secos del Mediterráneo. Gran rusticidad.'
);

-- Raza Lamancha
INSERT INTO RAZA (nombre_raza, origen, aptitud, peso_adulto_promedio_kg, produccion_leche_dia_promedio, caracteristicas)
VALUES (
    'Lamancha',
    'Estados Unidos',
    'lechera',
    60.0,
    3.0,
    'Caracterizada por sus orejas muy pequeñas o inexistentes. Buena producción lechera con alto contenido graso. Temperamento tranquilo. Adaptable a diversos climas.'
);

-- ==================================================================
-- RAZAS CÁRNICAS
-- ==================================================================

-- Raza Boer
INSERT INTO RAZA (nombre_raza, origen, aptitud, peso_adulto_promedio_kg, produccion_leche_dia_promedio, caracteristicas)
VALUES (
    'Boer',
    'Sudáfrica',
    'carnica',
    80.0,
    0.0,
    'Raza especializada en producción de carne. Cuerpo blanco con cabeza marrón. Excelente conformación muscular y rápido crecimiento. Alta prolificidad y buena habilidad materna.'
);

-- Raza Kiko
INSERT INTO RAZA (nombre_raza, origen, aptitud, peso_adulto_promedio_kg, produccion_leche_dia_promedio, caracteristicas)
VALUES (
    'Kiko',
    'Nueva Zelanda',
    'carnica',
    70.0,
    0.0,
    'Desarrollada para resistencia y bajo mantenimiento. Excelente rusticidad y adaptabilidad. Buenos índices de crecimiento. Resistente a parásitos y enfermedades.'
);

-- Raza Spanish o Española
INSERT INTO RAZA (nombre_raza, origen, aptitud, peso_adulto_promedio_kg, produccion_leche_dia_promedio, caracteristicas)
VALUES (
    'Spanish',
    'España/México',
    'carnica',
    55.0,
    0.0,
    'Raza criolla muy rústica. Diversos colores de pelaje. Alta adaptabilidad a condiciones adversas. Resistente a parásitos. Buena prolificidad.'
);

-- ==================================================================
-- RAZAS DE DOBLE PROPÓSITO
-- ==================================================================

-- Raza Nubia o Anglo-Nubiana
INSERT INTO RAZA (nombre_raza, origen, aptitud, peso_adulto_promedio_kg, produccion_leche_dia_promedio, caracteristicas)
VALUES (
    'Nubia',
    'África del Norte',
    'doble_proposito',
    60.0,
    2.5,
    'Orejas largas y colgantes características. Leche con alto contenido graso y proteico. Buena conformación cárnica. Adaptada a climas cálidos. Temperamento activo.'
);

-- Raza Criolla Local
INSERT INTO RAZA (nombre_raza, origen, aptitud, peso_adulto_promedio_kg, produccion_leche_dia_promedio, caracteristicas)
VALUES (
    'Criolla',
    'América Latina',
    'doble_proposito',
    45.0,
    2.0,
    'Cabra adaptada localmente a través de generaciones. Gran rusticidad y resistencia. Moderada producción lechera y cárnica. Bajo requerimiento de manejo. Diversos colores.'
);

-- Raza Damascus o Shami
INSERT INTO RAZA (nombre_raza, origen, aptitud, peso_adulto_promedio_kg, produccion_leche_dia_promedio, caracteristicas)
VALUES (
    'Damascus',
    'Siria',
    'doble_proposito',
    70.0,
    3.0,
    'También conocida como cabra de Damasco. Gran tamaño corporal. Buena producción lechera y cárnica. Perfil cefálico convexo característico. Resistente a climas cálidos.'
);

-- ==================================================================
-- RAZAS ADICIONALES PARA DIVERSIDAD
-- ==================================================================

-- Raza Oberhasli
INSERT INTO RAZA (nombre_raza, origen, aptitud, peso_adulto_promedio_kg, produccion_leche_dia_promedio, caracteristicas)
VALUES (
    'Oberhasli',
    'Suiza',
    'lechera',
    54.0,
    3.0,
    'Color rojizo característico con marcas negras. Buena producción lechera constante. Temperamento dócil y tranquilo. Adaptable a diferentes sistemas de producción.'
);

-- Raza Nigora (Angora x Nigerian Dwarf)
INSERT INTO RAZA (nombre_raza, origen, aptitud, peso_adulto_promedio_kg, produccion_leche_dia_promedio, caracteristicas)
VALUES (
    'Nigora',
    'Estados Unidos',
    'doble_proposito',
    40.0,
    1.5,
    'Raza híbrida de tamaño pequeño a mediano. Produce fibra de mohair y leche. Ideal para pequeñas propiedades. Bajo consumo de alimento. Carácter amigable.'
);

COMMIT;

-- ==================================================================
-- Verificación de datos insertados
-- ==================================================================

-- Contar razas insertadas
SELECT COUNT(*) AS total_razas FROM RAZA;

-- Ver resumen por aptitud
SELECT 
    aptitud,
    COUNT(*) AS cantidad,
    ROUND(AVG(peso_adulto_promedio_kg), 2) AS peso_promedio,
    ROUND(AVG(produccion_leche_dia_promedio), 2) AS produccion_promedio
FROM RAZA
GROUP BY aptitud
ORDER BY aptitud;

-- ==================================================================
-- FIN DEL SCRIPT
-- ==================================================================
