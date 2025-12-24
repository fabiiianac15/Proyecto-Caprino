# Reglas de Negocio Zootécnicas del Sistema Caprino

## Introducción

Este documento define las reglas de negocio específicas del sector caprino que el sistema debe implementar y validar. Estas reglas garantizan la integridad de los datos zootécnicos y aseguran que las operaciones cumplan con las prácticas profesionales del sector.

## 1. Gestión de Animales

### 1.1 Identificación Animal

**Regla RN-001: Identificador Único Obligatorio**
- Cada animal debe tener un código de identificación único en el sistema
- El código puede ser: crotal oficial, código QR, chip RFID o código interno
- No se permite duplicar códigos de identificación
- Una vez asignado, el código solo puede modificarse con autorización especial

**Regla RN-002: Datos Mínimos de Registro**
- Campos obligatorios: código, fecha de nacimiento, sexo, raza
- La fecha de nacimiento no puede ser posterior a la fecha actual
- El peso al nacer debe estar entre 2 y 6 kg (rango normal para caprinos)

**Regla RN-003: Estados del Animal**
- Estados permitidos: activo, vendido, muerto, descartado
- Solo animales con estado "activo" pueden tener registros nuevos (pesajes, producción, etc.)
- El cambio de estado debe incluir motivo y fecha
- Los cambios de estado son irreversibles (excepto errores administrativos)

### 1.2 Clasificación por Edad

**Regla RN-004: Categorías de Edad**
- Cabrito/a: 0-4 meses
- Joven: 4-12 meses
- Adulto: mayor a 12 meses
- Edad reproductiva hembra: a partir de 7-8 meses (dependiendo de peso)
- Edad reproductiva macho: a partir de 8-10 meses

## 2. Genealogía y Genética

### 2.1 Registro Genealógico

**Regla RN-005: Validación de Parentesco**
- El padre debe ser macho y la madre debe ser hembra
- Un animal no puede ser padre o madre de sí mismo
- La fecha de nacimiento del hijo debe ser posterior a la fecha de nacimiento de los padres
- Los padres deben tener al menos 7 meses más que el hijo (edad mínima reproductiva)

**Regla RN-006: Control de Consanguinidad**
- El sistema debe advertir si se detecta consanguinidad cercana
- No permitir cruces padre-hija o madre-hijo
- No permitir cruces entre hermanos completos (mismo padre y madre)
- Alertar si los padres comparten abuelos comunes

**Regla RN-007: Trazabilidad Genética**
- Mantener registro genealógico hasta 3 generaciones atrás como mínimo
- Permitir consultar descendencia completa de un reproductor
- Calcular coeficiente de consanguinidad según pedigrí

## 3. Control de Crecimiento (Pesajes)

### 3.1 Registro de Pesajes

**Regla RN-008: Frecuencia de Pesajes**
- Cabritos: pesaje semanal durante el primer mes
- Jóvenes: pesaje quincenal hasta los 6 meses
- Adultos: pesaje mensual mínimo
- Hembras gestantes: pesaje en servicio, mitad de gestación y pre-parto

**Regla RN-009: Validación de Pesos**
- El peso debe ser siempre positivo
- El peso máximo permitido es 200 kg (extraordinariamente grande para caprino)
- El peso no debe disminuir más del 15% entre pesajes consecutivos sin justificación
- Alertar si la ganancia diaria es menor a 50g en cabritos lactantes

**Regla RN-010: Condición Corporal**
- Escala de 1 a 5 (1=muy delgado, 5=obeso)
- Condición óptima: 2.5-3.5 para hembras en producción
- Condición óptima: 3.0-4.0 para hembras en gestación
- Alertar si la condición es menor a 2 o mayor a 4

### 3.2 Curvas de Crecimiento

**Regla RN-011: Pesos Esperados**
- Nacimiento: 2.5-4.0 kg
- 30 días: 8-12 kg
- 60 días: 12-18 kg
- 6 meses: 18-25 kg
- 12 meses: 25-35 kg
- Adulto: 40-70 kg (dependiendo de raza y sexo)

**Regla RN-012: Ganancia de Peso**
- Cabritos lactantes: mínimo 150-200 g/día
- Jóvenes en crecimiento: 80-120 g/día
- Alertar si la ganancia es inferior al 70% del esperado

## 4. Producción de Leche

### 4.1 Registro de Producción

**Regla RN-013: Prerrequisitos para Producción**
- Solo hembras pueden tener registros de producción
- Debe existir un parto previo registrado en el sistema
- No se puede registrar producción antes del parto
- El animal debe estar en estado "activo"

**Regla RN-014: Validación de Cantidades**
- La producción diaria debe estar entre 0 y 8 litros (máximo fisiológico)
- Producción típica: 1.5-3.5 litros/día según raza y lactancia
- Alertar si la producción supera 6 litros/día (verificar error de registro)

**Regla RN-015: Curva de Lactancia**
- Duración típica: 240-305 días
- Pico de producción: 4-8 semanas post-parto
- Producción debe disminuir gradualmente después del pico
- Alertar si la producción aumenta después de 60 días de lactancia

### 4.2 Calidad de Leche

**Regla RN-016: Parámetros de Calidad**
- Grasa: rango normal 3.5-5.5%
- Proteína: rango normal 3.0-4.5%
- Células somáticas: <500,000 células/ml (indicador de salud de ubre)
- Alertar si las células somáticas superan 1,000,000 (mastitis probable)

**Regla RN-017: Períodos de Retiro**
- No registrar producción de animales en retiro sanitario
- Verificar días de retiro por medicamentos aplicados
- Advertir si se intenta comercializar leche en período de retiro

## 5. Reproducción

### 5.1 Servicios y Cubriciones

**Regla RN-018: Edad Mínima Reproductiva**
- Hembras: 7-8 meses o 30-35 kg de peso vivo
- Machos: 8-10 meses o 35-40 kg de peso vivo
- No permitir servicios en animales menores a estas edades/pesos

**Regla RN-019: Tipos de Servicio**
- Monta natural: servicio directo con macho presente en el rebaño
- Inseminación artificial: requiere registro de pajuela/lote de semen
- Transferencia de embriones: requiere datos de donante y receptora

**Regla RN-020: Validación de Fechas**
- La fecha de servicio no puede ser futura
- La fecha de parto estimada se calcula automáticamente: servicio + 150 días
- Rango de gestación normal: 145-155 días
- Alertar si el parto ocurre fuera de este rango

### 5.2 Gestación y Partos

**Regla RN-021: Seguimiento de Gestación**
- Confirmar gestación a los 30-45 días post-servicio
- Pesaje a mitad de gestación (75 días)
- Secado (suspender ordeño) 45-60 días antes del parto
- Preparación de área de parto 15 días antes de la fecha estimada

**Regla RN-022: Tipos de Parto**
- Simple: 1 cría (50-60% de los partos)
- Doble: 2 crías (30-40% de los partos)
- Triple o múltiple: 3+ crías (5-10% de los partos)
- El número de crías debe coincidir con el tipo de parto

**Regla RN-023: Resultado del Parto**
- Exitoso: parto normal con crías vivas
- Aborto: pérdida de gestación antes del término
- Mortinato: crías nacidas muertas
- Pendiente: gestación en curso sin parto aún

**Regla RN-024: Intervalo Entre Partos**
- Intervalo ideal: 365 días (1 parto por año)
- Intervalo mínimo aceptable: 240 días
- Alertar si el intervalo es menor a 240 días
- Alertar si el intervalo supera 450 días (posibles problemas reproductivos)

### 5.3 Eficiencia Reproductiva

**Regla RN-025: Indicadores Reproductivos**
- Tasa de fertilidad: partos exitosos / total de servicios (objetivo: >85%)
- Prolificidad: crías nacidas / parto (objetivo: >1.5)
- Tasa de abortos: abortos / total de gestaciones (objetivo: <5%)
- Identificar hembras con más de 3 servicios sin gestación (revisar fertilidad)

## 6. Sanidad

### 6.1 Vacunación

**Regla RN-026: Calendario de Vacunación**
- Vacunación básica obligatoria según región
- Registro de lote y fecha de vencimiento del biológico
- Fecha de próxima aplicación según protocolo (revacunación)
- No vacunar hembras en el primer tercio de gestación

**Regla RN-027: Vacunas Comunes**
- Clostridiosis: cada 6 meses
- Rabia: anual
- Otras según zona endémica (brucelosis, fiebre aftosa, etc.)

### 6.2 Desparasitación

**Regla RN-028: Protocolo de Desparasitación**
- Frecuencia: cada 2-3 meses según carga parasitaria
- Rotación de principios activos para evitar resistencia
- Registro de producto, dosis y vía de administración
- Análisis coprológico semestral para evaluar eficacia

### 6.3 Tratamientos y Retiros

**Regla RN-029: Período de Retiro**
- Registrar días de retiro para leche y carne según medicamento
- No comercializar productos durante el período de retiro
- Alertar automáticamente cuando finaliza el período de retiro
- Mantener trazabilidad del lote de medicamento usado

**Regla RN-030: Enfermedades Comunes**
- Mastitis: inflamación de ubre, afecta calidad de leche
- Neumonía: común en cabritos, requiere aislamiento
- Parasitosis gastrointestinal: pérdida de peso y producción
- Coccidiosis: diarrea en cabritos jóvenes
- Registrar diagnóstico, tratamiento y evolución

## 7. Toma de Decisiones Zootécnicas

### 7.1 Selección Genética

**Regla RN-031: Criterios de Selección**
- Hembras: producción lechera, prolificidad, facilidad de parto
- Machos: genealogía, morfología, libido, calidad seminal
- Eliminar reproductores con defectos hereditarios
- Priorizar animales con genealogía conocida y registrada

### 7.2 Descarte de Animales

**Regla RN-032: Criterios de Descarte en Hembras**
- Edad superior a 8-10 años
- Más de 3 lactancias con producción inferior al 70% del promedio
- Problemas reproductivos recurrentes (más de 3 servicios sin gestación)
- Mastitis crónica o problemas de ubre
- Enfermedades crónicas no tratables

**Regla RN-033: Criterios de Descarte en Machos**
- Edad superior a 6-8 años
- Problemas de fertilidad (menos del 70% de hembras gestantes)
- Lesiones en aparato reproductor
- Consanguinidad excesiva con el rebaño

### 7.3 Reemplazo de Animales

**Regla RN-034: Tasa de Reemplazo**
- Tasa de reemplazo anual recomendada: 20-25%
- Seleccionar hembras de reemplazo de las mejores productoras
- Mantener proporción macho:hembra de 1:25-30 en monta natural
- Renovar sementales cada 2-3 años para evitar consanguinidad

## 8. Alimentación (Integración Futura)

### 8.1 Requerimientos Nutricionales

**Regla RN-035: Necesidades por Categoría**
- Cabritos lactantes: leche materna + iniciador de alta energía
- Jóvenes en crecimiento: 12-14% proteína, 2.5-2.8 Mcal/kg
- Hembras en producción: 15-18% proteína, 2.8-3.0 Mcal/kg
- Hembras gestantes (último tercio): 14-16% proteína, 2.7 Mcal/kg
- Mantenimiento: 10-12% proteína, 2.3-2.5 Mcal/kg

## 9. Instalaciones y Manejo

### 9.1 Densidad y Espacio

**Regla RN-036: Espacio Requerido**
- Cabritos lactantes: 0.5-0.8 m² por animal
- Jóvenes: 1.0-1.5 m² por animal
- Adultos: 1.5-2.5 m² por animal
- Área de parto: 3-4 m² por hembra
- Alertar si la densidad supera los máximos recomendados

## 10. Validaciones Críticas del Sistema

### 10.1 Validaciones al Insertar Datos

**Lista de validaciones que el sistema debe ejecutar:**

1. Animal no puede tener fecha de nacimiento futura
2. Pesaje no puede ser anterior a la fecha de nacimiento
3. Producción de leche requiere parto previo
4. Servicio reproductivo requiere edad/peso mínimo
5. Parto no puede ser anterior al servicio
6. Padre y madre deben ser de sexo correcto
7. No permitir consanguinidad directa
8. Verificar retiro sanitario antes de comercializar
9. Validar que el animal esté activo antes de nuevos registros
10. Verificar coherencia de fechas en todos los registros

### 10.2 Alertas Automáticas

**El sistema debe generar alertas cuando:**

1. Peso de un animal disminuye más del 10% en 30 días
2. Producción lechera cae más del 30% sin justificación
3. Hembra tiene 3+ servicios sin gestación
4. Animal tiene síntomas de enfermedad registrados recurrentemente
5. Vacuna o desparasitación está próxima o atrasada
6. Parto se acerca en menos de 15 días
7. Animal supera edad de descarte recomendada
8. Células somáticas elevadas (posible mastitis)
9. Intervalo entre partos supera 400 días
10. Ganancia de peso en cabritos es menor al 70% del esperado

## 11. Reportes Zootécnicos Clave

### 11.1 Reportes de Producción

- Producción total y promedio por raza
- Producción mensual y proyección anual
- Curva de lactancia por animal
- Ranking de mejores productoras
- Producción por número de lactancia

### 11.2 Reportes Reproductivos

- Tasa de fertilidad y prolificidad
- Calendario de partos próximos
- Intervalo entre partos promedio
- Eficiencia reproductiva por hembra
- Genealogía y descendencia de reproductores

### 11.3 Reportes de Crecimiento

- Curva de crecimiento por edad y raza
- Ganancia diaria promedio
- Peso proyectado al destete (90 días)
- Comparación con estándares raciales

### 11.4 Reportes Sanitarios

- Calendario de vacunación
- Animales en retiro sanitario
- Incidencia de enfermedades
- Consumo de medicamentos
- Trazabilidad de tratamientos

## 12. Consideraciones Finales

### 12.1 Adaptación Regional

Este documento presenta reglas generales para caprinos. Deben adaptarse según:
- Raza específica (lechera vs cárnica)
- Zona geográfica y clima
- Sistema de producción (intensivo vs extensivo)
- Normativa local sanitaria y de identificación

### 12.2 Actualización de Reglas

Las reglas deben revisarse:
- Anualmente según resultados productivos
- Cuando cambien normativas sanitarias oficiales
- Al incorporar nuevas razas o tecnologías
- Según recomendaciones de asesor zootecnista

### 12.3 Excepciones

El sistema debe permitir:
- Sobrescribir validaciones con justificación documentada
- Registrar situaciones excepcionales con observaciones
- Mantener log de excepciones para auditoría
- Requiere autorización de usuario administrador o zootecnista

## Referencias Zootécnicas

- Manual de Producción Caprina (FAO)
- Normas de Manejo de Pequeños Rumiantes
- Guías de Buenas Prácticas Ganaderas
- Protocolos Sanitarios Oficiales según país/región
