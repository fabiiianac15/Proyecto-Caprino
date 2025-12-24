-- ==================================================================
-- Sistema de Gestión Zootécnica Caprina
-- Vistas para Reportes y Consultas Optimizadas
-- Versión: 1.0
-- Descripción: Vistas que simplifican consultas complejas y mejoran rendimiento
-- ==================================================================

-- ==================================================================
-- VISTA: vista_animales_completa
-- Descripción: Vista completa de animales con datos de raza
-- Uso: Listado principal de animales en el sistema
-- ==================================================================
CREATE OR REPLACE VIEW vista_animales_completa AS
SELECT 
    a.id_animal,
    a.codigo_identificacion,
    a.nombre,
    a.fecha_nacimiento,
    TRUNC(MONTHS_BETWEEN(SYSDATE, a.fecha_nacimiento) / 12) AS edad_anios,
    TRUNC(SYSDATE - a.fecha_nacimiento) AS edad_dias,
    a.sexo,
    r.nombre_raza,
    r.aptitud AS aptitud_raza,
    a.color_pelaje,
    a.peso_nacimiento_kg,
    a.estado,
    a.motivo_estado,
    a.fecha_cambio_estado,
    a.foto_url,
    a.fecha_registro,
    -- Genealogía
    g.id_padre,
    (SELECT codigo_identificacion FROM ANIMAL WHERE id_animal = g.id_padre) AS codigo_padre,
    g.id_madre,
    (SELECT codigo_identificacion FROM ANIMAL WHERE id_animal = g.id_madre) AS codigo_madre,
    -- Último pesaje
    (SELECT peso_kg FROM PESAJE 
     WHERE id_animal = a.id_animal 
     ORDER BY fecha_pesaje DESC 
     FETCH FIRST 1 ROW ONLY) AS peso_actual_kg,
    (SELECT fecha_pesaje FROM PESAJE 
     WHERE id_animal = a.id_animal 
     ORDER BY fecha_pesaje DESC 
     FETCH FIRST 1 ROW ONLY) AS fecha_ultimo_pesaje
FROM ANIMAL a
INNER JOIN RAZA r ON a.id_raza = r.id_raza
LEFT JOIN GENEALOGIA g ON a.id_animal = g.id_animal;

COMMENT ON VIEW vista_animales_completa IS 'Vista completa de animales con datos relacionados para listados';

-- ==================================================================
-- VISTA: vista_produccion_por_raza
-- Descripción: Estadísticas de producción lechera agrupadas por raza
-- Uso: Comparación de productividad entre razas
-- ==================================================================
CREATE OR REPLACE VIEW vista_produccion_por_raza AS
SELECT 
    r.id_raza,
    r.nombre_raza,
    r.aptitud,
    COUNT(DISTINCT p.id_animal) AS total_hembras_productivas,
    ROUND(AVG(p.litros), 2) AS promedio_litros_dia,
    ROUND(MAX(p.litros), 2) AS maximo_litros_dia,
    ROUND(MIN(p.litros), 2) AS minimo_litros_dia,
    ROUND(SUM(p.litros), 2) AS produccion_total_litros,
    ROUND(AVG(p.grasa_porcentaje), 2) AS promedio_grasa_porcentaje,
    ROUND(AVG(p.proteina_porcentaje), 2) AS promedio_proteina_porcentaje,
    COUNT(p.id_produccion) AS total_registros
FROM RAZA r
INNER JOIN ANIMAL a ON r.id_raza = a.id_raza
INNER JOIN PRODUCCION_LECHE p ON a.id_animal = p.id_animal
WHERE a.estado = 'activo'
GROUP BY r.id_raza, r.nombre_raza, r.aptitud;

COMMENT ON VIEW vista_produccion_por_raza IS 'Estadísticas de producción lechera por raza';

-- ==================================================================
-- VISTA: vista_produccion_mensual
-- Descripción: Producción total por mes para análisis temporal
-- Uso: Gráficos de producción histórica
-- ==================================================================
CREATE OR REPLACE VIEW vista_produccion_mensual AS
SELECT 
    EXTRACT(YEAR FROM fecha_produccion) AS anio,
    EXTRACT(MONTH FROM fecha_produccion) AS mes,
    TO_CHAR(fecha_produccion, 'YYYY-MM') AS periodo,
    COUNT(DISTINCT id_animal) AS animales_produciendo,
    ROUND(SUM(litros), 2) AS produccion_total_litros,
    ROUND(AVG(litros), 2) AS promedio_diario_litros,
    ROUND(AVG(grasa_porcentaje), 2) AS promedio_grasa,
    ROUND(AVG(proteina_porcentaje), 2) AS promedio_proteina,
    COUNT(id_produccion) AS total_registros
FROM PRODUCCION_LECHE
GROUP BY 
    EXTRACT(YEAR FROM fecha_produccion),
    EXTRACT(MONTH FROM fecha_produccion),
    TO_CHAR(fecha_produccion, 'YYYY-MM')
ORDER BY anio DESC, mes DESC;

COMMENT ON VIEW vista_produccion_mensual IS 'Producción lechera agregada por mes';

-- ==================================================================
-- VISTA: vista_crecimiento_por_edad
-- Descripción: Curva de crecimiento promedio por edad
-- Uso: Evaluar si los animales crecen según lo esperado
-- ==================================================================
CREATE OR REPLACE VIEW vista_crecimiento_por_edad AS
SELECT 
    CASE 
        WHEN edad_dias <= 30 THEN '0-1 mes'
        WHEN edad_dias <= 60 THEN '1-2 meses'
        WHEN edad_dias <= 90 THEN '2-3 meses'
        WHEN edad_dias <= 120 THEN '3-4 meses'
        WHEN edad_dias <= 180 THEN '4-6 meses'
        WHEN edad_dias <= 365 THEN '6-12 meses'
        ELSE 'Más de 1 año'
    END AS rango_edad,
    a.sexo,
    r.nombre_raza,
    COUNT(p.id_pesaje) AS total_pesajes,
    ROUND(AVG(p.peso_kg), 2) AS peso_promedio_kg,
    ROUND(MIN(p.peso_kg), 2) AS peso_minimo_kg,
    ROUND(MAX(p.peso_kg), 2) AS peso_maximo_kg,
    ROUND(AVG(p.ganancia_diaria_kg), 3) AS ganancia_diaria_promedio_kg
FROM PESAJE p
INNER JOIN ANIMAL a ON p.id_animal = a.id_animal
INNER JOIN RAZA r ON a.id_raza = r.id_raza
GROUP BY 
    CASE 
        WHEN edad_dias <= 30 THEN '0-1 mes'
        WHEN edad_dias <= 60 THEN '1-2 meses'
        WHEN edad_dias <= 90 THEN '2-3 meses'
        WHEN edad_dias <= 120 THEN '3-4 meses'
        WHEN edad_dias <= 180 THEN '4-6 meses'
        WHEN edad_dias <= 365 THEN '6-12 meses'
        ELSE 'Más de 1 año'
    END,
    a.sexo,
    r.nombre_raza
ORDER BY rango_edad, sexo, nombre_raza;

COMMENT ON VIEW vista_crecimiento_por_edad IS 'Estadísticas de peso por rango de edad, sexo y raza';

-- ==================================================================
-- VISTA: vista_historial_reproductivo
-- Descripción: Historial completo de reproducción por hembra
-- Uso: Evaluar fertilidad y productividad reproductiva
-- ==================================================================
CREATE OR REPLACE VIEW vista_historial_reproductivo AS
SELECT 
    a.id_animal AS id_hembra,
    a.codigo_identificacion AS codigo_hembra,
    a.nombre AS nombre_hembra,
    r.id_reproduccion,
    r.tipo_servicio,
    r.fecha_servicio,
    r.fecha_parto_estimada,
    r.fecha_parto_real,
    CASE 
        WHEN r.fecha_parto_real IS NULL THEN NULL
        ELSE TRUNC(r.fecha_parto_real - r.fecha_servicio)
    END AS dias_gestacion_real,
    r.tipo_parto,
    r.numero_crias,
    r.resultado,
    r.dificultad_parto,
    am.codigo_identificacion AS codigo_macho,
    am.nombre AS nombre_macho,
    rz.nombre_raza AS raza_macho
FROM REPRODUCCION r
INNER JOIN ANIMAL a ON r.id_hembra = a.id_animal
LEFT JOIN ANIMAL am ON r.id_macho = am.id_animal
LEFT JOIN RAZA rz ON am.id_raza = rz.id_raza
ORDER BY a.id_animal, r.fecha_servicio DESC;

COMMENT ON VIEW vista_historial_reproductivo IS 'Historial reproductivo completo de cada hembra';

-- ==================================================================
-- VISTA: vista_eficiencia_reproductiva
-- Descripción: Indicadores de eficiencia reproductiva por hembra
-- Uso: Identificar hembras con mejor desempeño reproductivo
-- ==================================================================
CREATE OR REPLACE VIEW vista_eficiencia_reproductiva AS
SELECT 
    a.id_animal,
    a.codigo_identificacion,
    a.nombre,
    r.nombre_raza,
    COUNT(rep.id_reproduccion) AS total_servicios,
    COUNT(CASE WHEN rep.resultado = 'exitoso' THEN 1 END) AS partos_exitosos,
    COUNT(CASE WHEN rep.resultado = 'aborto' THEN 1 END) AS abortos,
    ROUND(
        COUNT(CASE WHEN rep.resultado = 'exitoso' THEN 1 END) * 100.0 / 
        NULLIF(COUNT(rep.id_reproduccion), 0), 
        2
    ) AS tasa_fertilidad_porcentaje,
    SUM(COALESCE(rep.numero_crias, 0)) AS total_crias_producidas,
    ROUND(
        SUM(COALESCE(rep.numero_crias, 0)) * 1.0 / 
        NULLIF(COUNT(CASE WHEN rep.resultado = 'exitoso' THEN 1 END), 0),
        2
    ) AS prolificidad_promedio,
    MIN(rep.fecha_servicio) AS primer_servicio,
    MAX(rep.fecha_servicio) AS ultimo_servicio,
    TRUNC(MONTHS_BETWEEN(SYSDATE, a.fecha_nacimiento) / 12) AS edad_actual_anios
FROM ANIMAL a
INNER JOIN RAZA r ON a.id_raza = r.id_raza
LEFT JOIN REPRODUCCION rep ON a.id_animal = rep.id_hembra
WHERE a.sexo = 'hembra'
GROUP BY 
    a.id_animal,
    a.codigo_identificacion,
    a.nombre,
    r.nombre_raza,
    a.fecha_nacimiento
ORDER BY partos_exitosos DESC;

COMMENT ON VIEW vista_eficiencia_reproductiva IS 'Indicadores de eficiencia reproductiva por hembra';

-- ==================================================================
-- VISTA: vista_calendario_reproductivo
-- Descripción: Calendario de partos próximos y servicios pendientes
-- Uso: Planificación de atención a partos
-- ==================================================================
CREATE OR REPLACE VIEW vista_calendario_reproductivo AS
SELECT 
    r.id_reproduccion,
    a.id_animal,
    a.codigo_identificacion,
    a.nombre,
    rz.nombre_raza,
    r.fecha_servicio,
    r.fecha_parto_estimada,
    TRUNC(r.fecha_parto_estimada - SYSDATE) AS dias_para_parto,
    CASE 
        WHEN TRUNC(r.fecha_parto_estimada - SYSDATE) < 0 THEN 'ATRASADO'
        WHEN TRUNC(r.fecha_parto_estimada - SYSDATE) <= 7 THEN 'URGENTE'
        WHEN TRUNC(r.fecha_parto_estimada - SYSDATE) <= 15 THEN 'PRÓXIMO'
        ELSE 'PROGRAMADO'
    END AS estado_parto,
    r.tipo_servicio,
    am.codigo_identificacion AS codigo_macho,
    r.observaciones
FROM REPRODUCCION r
INNER JOIN ANIMAL a ON r.id_hembra = a.id_animal
INNER JOIN RAZA rz ON a.id_raza = rz.id_raza
LEFT JOIN ANIMAL am ON r.id_macho = am.id_animal
WHERE r.fecha_parto_real IS NULL
AND r.resultado = 'pendiente'
AND a.estado = 'activo'
ORDER BY r.fecha_parto_estimada ASC;

COMMENT ON VIEW vista_calendario_reproductivo IS 'Calendario de partos próximos para planificación';

-- ==================================================================
-- VISTA: vista_historial_sanitario
-- Descripción: Historial sanitario completo por animal
-- Uso: Trazabilidad de vacunas y tratamientos
-- ==================================================================
CREATE OR REPLACE VIEW vista_historial_sanitario AS
SELECT 
    a.id_animal,
    a.codigo_identificacion,
    a.nombre,
    r.nombre_raza,
    s.id_registro,
    s.tipo_registro,
    s.fecha_aplicacion,
    s.enfermedad_diagnostico,
    s.medicamento_producto,
    s.dosis,
    s.via_administracion,
    s.lote_producto,
    s.fecha_proxima_aplicacion,
    s.dias_retiro_leche,
    s.dias_retiro_carne,
    s.veterinario,
    CASE 
        WHEN s.dias_retiro_leche IS NOT NULL THEN
            s.fecha_aplicacion + s.dias_retiro_leche
        ELSE NULL
    END AS fecha_fin_retiro_leche,
    CASE 
        WHEN s.fecha_fin_retiro_leche >= SYSDATE THEN 'EN RETIRO'
        ELSE 'DISPONIBLE'
    END AS estado_leche
FROM ANIMAL a
INNER JOIN RAZA r ON a.id_raza = r.id_raza
INNER JOIN SALUD s ON a.id_animal = s.id_animal
ORDER BY a.id_animal, s.fecha_aplicacion DESC;

COMMENT ON VIEW vista_historial_sanitario IS 'Historial sanitario completo con estado de retiros';

-- ==================================================================
-- VISTA: vista_plan_vacunacion
-- Descripción: Próximas vacunas y desparasitaciones pendientes
-- Uso: Planificación de calendario sanitario
-- ==================================================================
CREATE OR REPLACE VIEW vista_plan_vacunacion AS
SELECT 
    a.id_animal,
    a.codigo_identificacion,
    a.nombre,
    r.nombre_raza,
    s.tipo_registro,
    s.medicamento_producto,
    s.fecha_aplicacion AS ultima_aplicacion,
    s.fecha_proxima_aplicacion,
    TRUNC(s.fecha_proxima_aplicacion - SYSDATE) AS dias_para_proxima,
    CASE 
        WHEN TRUNC(s.fecha_proxima_aplicacion - SYSDATE) < 0 THEN 'ATRASADO'
        WHEN TRUNC(s.fecha_proxima_aplicacion - SYSDATE) <= 7 THEN 'URGENTE'
        WHEN TRUNC(s.fecha_proxima_aplicacion - SYSDATE) <= 30 THEN 'PRÓXIMO'
        ELSE 'PROGRAMADO'
    END AS prioridad
FROM ANIMAL a
INNER JOIN RAZA r ON a.id_raza = r.id_raza
INNER JOIN SALUD s ON a.id_animal = s.id_animal
WHERE s.fecha_proxima_aplicacion IS NOT NULL
AND s.fecha_proxima_aplicacion >= SYSDATE - 15  -- Incluir atrasados hasta 15 días
AND s.tipo_registro IN ('vacuna', 'desparasitacion')
AND a.estado = 'activo'
ORDER BY s.fecha_proxima_aplicacion ASC;

COMMENT ON VIEW vista_plan_vacunacion IS 'Calendario de vacunaciones y desparasitaciones próximas';

-- ==================================================================
-- VISTA: vista_animales_en_retiro
-- Descripción: Animales con retiro sanitario vigente (no apta leche/carne)
-- Uso: Control de comercialización de productos
-- ==================================================================
CREATE OR REPLACE VIEW vista_animales_en_retiro AS
SELECT 
    a.id_animal,
    a.codigo_identificacion,
    a.nombre,
    s.medicamento_producto,
    s.fecha_aplicacion,
    s.dias_retiro_leche,
    s.dias_retiro_carne,
    s.fecha_aplicacion + COALESCE(s.dias_retiro_leche, 0) AS fecha_fin_retiro_leche,
    s.fecha_aplicacion + COALESCE(s.dias_retiro_carne, 0) AS fecha_fin_retiro_carne,
    TRUNC((s.fecha_aplicacion + s.dias_retiro_leche) - SYSDATE) AS dias_restantes_retiro_leche,
    TRUNC((s.fecha_aplicacion + s.dias_retiro_carne) - SYSDATE) AS dias_restantes_retiro_carne
FROM ANIMAL a
INNER JOIN SALUD s ON a.id_animal = s.id_animal
WHERE a.estado = 'activo'
AND (
    (s.dias_retiro_leche IS NOT NULL AND s.fecha_aplicacion + s.dias_retiro_leche >= SYSDATE)
    OR 
    (s.dias_retiro_carne IS NOT NULL AND s.fecha_aplicacion + s.dias_retiro_carne >= SYSDATE)
)
ORDER BY s.fecha_aplicacion + COALESCE(s.dias_retiro_leche, s.dias_retiro_carne);

COMMENT ON VIEW vista_animales_en_retiro IS 'Animales con periodo de retiro sanitario vigente';

-- ==================================================================
-- VISTA: vista_resumen_por_estado
-- Descripción: Resumen de animales agrupados por estado
-- Uso: Dashboard principal - indicadores generales
-- ==================================================================
CREATE OR REPLACE VIEW vista_resumen_por_estado AS
SELECT 
    estado,
    sexo,
    COUNT(*) AS total_animales,
    ROUND(AVG(TRUNC(SYSDATE - fecha_nacimiento) / 365), 1) AS edad_promedio_anios
FROM ANIMAL
GROUP BY estado, sexo
ORDER BY estado, sexo;

COMMENT ON VIEW vista_resumen_por_estado IS 'Resumen de animales por estado y sexo';

-- ==================================================================
-- VISTA: vista_indicadores_generales
-- Descripción: Indicadores clave del rebaño (KPIs)
-- Uso: Dashboard principal
-- ==================================================================
CREATE OR REPLACE VIEW vista_indicadores_generales AS
SELECT 
    (SELECT COUNT(*) FROM ANIMAL WHERE estado = 'activo') AS total_animales_activos,
    (SELECT COUNT(*) FROM ANIMAL WHERE estado = 'activo' AND sexo = 'hembra') AS total_hembras,
    (SELECT COUNT(*) FROM ANIMAL WHERE estado = 'activo' AND sexo = 'macho') AS total_machos,
    (SELECT COUNT(*) FROM ANIMAL WHERE estado = 'activo' AND sexo = 'hembra' 
     AND TRUNC(MONTHS_BETWEEN(SYSDATE, fecha_nacimiento) / 12) >= 1) AS hembras_edad_reproductiva,
    (SELECT ROUND(AVG(litros), 2) 
     FROM PRODUCCION_LECHE 
     WHERE fecha_produccion >= SYSDATE - 30) AS produccion_promedio_30dias,
    (SELECT ROUND(SUM(litros), 2) 
     FROM PRODUCCION_LECHE 
     WHERE fecha_produccion >= SYSDATE - 30) AS produccion_total_30dias,
    (SELECT COUNT(*) 
     FROM REPRODUCCION 
     WHERE resultado = 'pendiente' 
     AND fecha_parto_estimada BETWEEN SYSDATE AND SYSDATE + 15) AS partos_proximos_15dias,
    (SELECT COUNT(*) 
     FROM vista_plan_vacunacion 
     WHERE prioridad IN ('URGENTE', 'ATRASADO')) AS vacunas_pendientes_urgentes
FROM DUAL;

COMMENT ON VIEW vista_indicadores_generales IS 'Indicadores clave (KPIs) del rebaño para dashboard';

-- ==================================================================
-- VISTA: vista_produccion_por_animal
-- Descripción: Producción total y promedio por animal
-- Uso: Ranking de productoras
-- ==================================================================
CREATE OR REPLACE VIEW vista_produccion_por_animal AS
SELECT 
    a.id_animal,
    a.codigo_identificacion,
    a.nombre,
    r.nombre_raza,
    COUNT(DISTINCT p.numero_lactancia) AS numero_lactancias,
    ROUND(SUM(p.litros), 2) AS produccion_total_litros,
    ROUND(AVG(p.litros), 2) AS produccion_promedio_dia,
    MAX(p.fecha_produccion) AS ultima_produccion,
    TRUNC(MONTHS_BETWEEN(SYSDATE, a.fecha_nacimiento) / 12) AS edad_anios
FROM ANIMAL a
INNER JOIN RAZA r ON a.id_raza = r.id_raza
INNER JOIN PRODUCCION_LECHE p ON a.id_animal = p.id_animal
WHERE a.estado = 'activo'
GROUP BY 
    a.id_animal,
    a.codigo_identificacion,
    a.nombre,
    r.nombre_raza,
    a.fecha_nacimiento
ORDER BY produccion_total_litros DESC;

COMMENT ON VIEW vista_produccion_por_animal IS 'Producción total y promedio por animal individual';

-- ==================================================================
-- FIN DE VISTAS
-- ==================================================================
