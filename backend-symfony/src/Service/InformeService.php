<?php

namespace App\Service;

use Doctrine\DBAL\Connection;

/**
 * Informes del hato.
 *
 * Todos los informes devuelven la misma estructura para que la web los pinte
 * y los exporte a Excel o PDF con un solo código:
 *
 *   titulo, descripcion, periodo, generado,
 *   indicadores: [{etiqueta, valor, formato, unidad}]
 *   graficos:    [{titulo, tipo: barras|linea|torta, series: [{clave, nombre}], datos: [{nombre, ...}]}]
 *   tabla:       {columnas: [{clave, titulo, tipo}], filas: [{...}]}
 *   notas:       [texto]
 *
 * Cada informe sale de las tablas reales; ninguno inventa cifras.
 */
class InformeService
{
    /** Chapeta visible del animal: la nueva, si no la vieja, si no el código. */
    private const CHAPETA = "NVL(a.chapeta_nueva, NVL(a.chapeta_vieja, a.codigo_identificacion))";

    private const SEXO       = ['hembra' => 'Hembra', 'macho' => 'Macho'];
    private const ESTADO     = ['activo' => 'Activo', 'vendido' => 'Vendido', 'muerto' => 'Muerto', 'donado' => 'Donado', 'descartado' => 'Descartado'];
    private const PRODUCTIVO = ['produccion' => 'Producción', 'seca' => 'Seca', 'prenada' => 'Preñada', 'cabretona' => 'Cabretona', 'cabrita' => 'Cabrita'];
    private const RESULTADO  = ['pendiente' => 'En espera', 'exitoso' => 'Parto exitoso', 'aborto' => 'Aborto', 'mortinato' => 'Mortinato'];
    private const PARTO      = ['simple' => 'Sencillo', 'doble' => 'Gemelar', 'triple' => 'Trillizo', 'multiple' => 'Múltiple'];
    private const SERVICIO   = ['monta_natural' => 'Monta natural', 'inseminacion_artificial' => 'Inseminación', 'transferencia_embriones' => 'Transferencia de embriones'];
    private const SALUD      = ['vacuna' => 'Vacuna', 'tratamiento' => 'Tratamiento', 'diagnostico' => 'Enfermedad', 'cirugia' => 'Cirugía', 'desparasitacion' => 'Desparasitación'];
    private const TURNO      = ['mañana' => 'Mañana', 'manana' => 'Mañana', 'tarde' => 'Tarde', 'noche' => 'Noche', 'total_dia' => 'Todo el día'];
    private const CORRAL     = ['general' => 'General', 'gestante' => 'Gestantes', 'ordeno' => 'Ordeño', 'lactancia' => 'Lactancia', 'levante' => 'Levante', 'machos' => 'Machos'];
    private const BIENESTAR  = ['EXCELENTE' => 'Excelente', 'ALTO' => 'Alto', 'MEDIO' => 'Medio', 'BAJO' => 'Bajo'];
    private const LINEAL     = ['EXCELENTE' => 'Excelente', 'MUY_BUENO' => 'Muy bueno', 'BUENO' => 'Bueno', 'ACEPTABLE' => 'Aceptable', 'REGULAR' => 'Regular', 'POBRE' => 'Pobre'];
    private const PRODUCTOR  = ['FAMILIAR' => 'Familiar', 'EXTENSIVO' => 'Extensivo', 'SEMI_INTENSIVO' => 'Semi-intensivo', 'INTENSIVO' => 'Intensivo'];
    private const FAMACHA    = [1 => '1 · Rojo (sana)', 2 => '2 · Rojo rosado (sana)', 3 => '3 · Rosado (vigilar)', 4 => '4 · Rosado pálido (anemia)', 5 => '5 · Blanco (anemia grave)'];

    /** clave => [método, usa periodo] */
    private const INFORMES = [
        'inventario'        => ['inventario', false],
        'movimientos'       => ['movimientos', true],
        'corrales'          => ['corrales', false],
        'leche-mensual'     => ['lecheMensual', true],
        'leche-cabra'       => ['lechePorCabra', true],
        'leche-detalle'     => ['lecheDetalle', true],
        'servicios'         => ['servicios', true],
        'partos-proximos'   => ['partosProximos', false],
        'machos'            => ['machos', true],
        'salud-eventos'     => ['saludEventos', true],
        'enfermedades'      => ['enfermedades', true],
        'salud-pendientes'  => ['saludPendientes', false],
        'famacha'           => ['famacha', true],
        'pesajes'           => ['pesajes', true],
        'crecimiento'       => ['crecimiento', true],
        'bienestar'         => ['bienestar', true],
        'lineal'            => ['lineal', true],
    ];

    public function __construct(private Connection $db) {}

    public function existe(string $clave): bool
    {
        return isset(self::INFORMES[$clave]);
    }

    public function generar(string $clave, string $desde, string $hasta): array
    {
        [$metodo, $conPeriodo] = self::INFORMES[$clave];
        $informe = $this->$metodo($desde, $hasta);

        return [
            'clave'    => $clave,
            'periodo'  => $conPeriodo ? ['desde' => $desde, 'hasta' => $hasta] : null,
            'generado' => date('Y-m-d H:i'),
        ] + $informe + [
            'indicadores' => [],
            'graficos'    => [],
            'tabla'       => ['columnas' => [], 'filas' => []],
            'notas'       => [],
        ];
    }

    /** Indicadores generales para la portada del módulo. */
    public function resumen(string $desde, string $hasta): array
    {
        $p = ['d' => $desde, 'h' => $hasta];
        $uno = fn(string $sql, array $params = []) => $this->db->fetchOne($sql, $params);

        $partos = $this->q(
            "SELECT COUNT(*) partos, NVL(SUM(numero_crias),0) crias FROM REPRODUCCION
              WHERE resultado = 'exitoso' AND fecha_parto_real " . $this->entre(), $p
        )[0];
        $servicios = $this->q(
            "SELECT COUNT(*) total, SUM(CASE WHEN resultado = 'exitoso' THEN 1 ELSE 0 END) exitosos,
                    SUM(CASE WHEN resultado <> 'pendiente' THEN 1 ELSE 0 END) cerrados
               FROM REPRODUCCION WHERE fecha_servicio " . $this->entre(), $p
        )[0];

        return [
            'periodo' => ['desde' => $desde, 'hasta' => $hasta],
            'indicadores' => [
                $this->ind('Animales activos', (int) $uno("SELECT COUNT(*) FROM ANIMAL WHERE estado = 'activo'")),
                $this->ind('Hembras', (int) $uno("SELECT COUNT(*) FROM ANIMAL WHERE estado = 'activo' AND sexo = 'hembra'")),
                $this->ind('Machos', (int) $uno("SELECT COUNT(*) FROM ANIMAL WHERE estado = 'activo' AND sexo = 'macho'")),
                $this->ind('Leche en el periodo', (float) $uno("SELECT NVL(SUM(litros),0) FROM PRODUCCION_LECHE WHERE fecha_produccion " . $this->entre(), $p), 'decimal', 'L'),
                $this->ind('Partos en el periodo', (int) $partos['partos']),
                $this->ind('Crías nacidas', (int) $partos['crias']),
                $this->ind('Tasa de preñez', $servicios['cerrados'] > 0 ? round($servicios['exitosos'] * 100 / $servicios['cerrados'], 1) : null, 'porcentaje'),
                $this->ind('Eventos de salud', (int) $uno("SELECT COUNT(*) FROM SALUD WHERE fecha_aplicacion " . $this->entre(), $p)),
            ],
            'graficos' => [
                $this->grafico('Leche por mes (litros)', 'linea', [['clave' => 'litros', 'nombre' => 'Litros']], $this->q(
                    "SELECT TO_CHAR(fecha_produccion,'YYYY-MM') nombre, ROUND(SUM(litros),1) litros
                       FROM PRODUCCION_LECHE WHERE fecha_produccion " . $this->entre() . "
                      GROUP BY TO_CHAR(fecha_produccion,'YYYY-MM') ORDER BY 1", $p
                ), ['litros']),
                $this->grafico('Hato activo por raza', 'torta', [['clave' => 'valor', 'nombre' => 'Animales']], $this->q(
                    "SELECT r.nombre_raza nombre, COUNT(*) valor FROM ANIMAL a JOIN RAZA r ON a.id_raza = r.id_raza
                      WHERE a.estado = 'activo' GROUP BY r.nombre_raza ORDER BY 2 DESC"
                ), ['valor']),
                $this->grafico('Eventos de salud por tipo', 'barras', [['clave' => 'valor', 'nombre' => 'Eventos']], $this->contar($this->q(
                    "SELECT tipo_registro FROM SALUD WHERE fecha_aplicacion " . $this->entre(), $p
                ), 'tipo_registro', self::SALUD)),
            ],
        ];
    }

    // ══════════════════════════════════════════════════════════════════
    //  HATO
    // ══════════════════════════════════════════════════════════════════

    private function inventario(): array
    {
        $filas = $this->q(
            "SELECT " . self::CHAPETA . " chapeta, a.nombre, a.sexo, r.nombre_raza raza,
                    TO_CHAR(a.fecha_nacimiento,'YYYY-MM-DD') nacimiento,
                    TRUNC(MONTHS_BETWEEN(SYSDATE, a.fecha_nacimiento)) edad_meses,
                    a.estado_productivo productivo, c.nombre corral,
                    (SELECT MAX(p.peso_kg) KEEP (DENSE_RANK LAST ORDER BY p.fecha_pesaje) FROM PESAJE p WHERE p.id_animal = a.id_animal) ultimo_peso,
                    a.color_pelaje color
               FROM ANIMAL a
               JOIN RAZA r ON a.id_raza = r.id_raza
               LEFT JOIN CORRAL c ON a.id_corral = c.id_corral
              WHERE a.estado = 'activo'
              ORDER BY a.sexo, chapeta"
        );
        foreach ($filas as &$f) {
            $f['grupo'] = $this->grupoEdad($f['edad_meses']);
            $f['sexo'] = self::SEXO[$f['sexo']] ?? $f['sexo'];
            $f['productivo'] = self::PRODUCTIVO[$f['productivo']] ?? ($f['sexo'] === 'Macho' ? 'No aplica' : 'Sin definir');
        }
        unset($f);

        $edades = array_filter(array_column($filas, 'edad_meses'), fn($v) => $v !== null);
        $hembras = count(array_filter($filas, fn($f) => $f['sexo'] === 'Hembra'));

        return [
            'titulo' => 'Censo del hato',
            'descripcion' => 'Todos los animales activos con su raza, edad, estado productivo, corral y último peso.',
            'indicadores' => [
                $this->ind('Animales activos', count($filas)),
                $this->ind('Hembras', $hembras),
                $this->ind('Machos', count($filas) - $hembras),
                $this->ind('Razas', count(array_unique(array_column($filas, 'raza')))),
                $this->ind('Edad promedio', $edades ? round(array_sum($edades) / count($edades) / 12, 1) : null, 'decimal', 'años'),
            ],
            'graficos' => [
                $this->grafico('Animales por raza', 'torta', [['clave' => 'valor', 'nombre' => 'Animales']], $this->contar($filas, 'raza')),
                $this->grafico('Animales por edad', 'barras', [['clave' => 'valor', 'nombre' => 'Animales']],
                    $this->contar($filas, 'grupo', null, ['Cría (0-6 meses)', 'Levante (6-12 meses)', 'Joven (1-2 años)', 'Adulto (2-6 años)', 'Mayor (más de 6 años)'])),
                $this->grafico('Hembras por estado productivo', 'barras', [['clave' => 'valor', 'nombre' => 'Hembras']],
                    $this->contar(array_filter($filas, fn($f) => $f['sexo'] === 'Hembra'), 'productivo')),
            ],
            'tabla' => $this->tabla([
                ['chapeta', 'Chapeta'], ['nombre', 'Nombre'], ['sexo', 'Sexo'], ['raza', 'Raza'],
                ['nacimiento', 'Nacimiento', 'fecha'], ['edad_meses', 'Edad (meses)', 'entero'], ['grupo', 'Grupo de edad'],
                ['productivo', 'Estado productivo'], ['corral', 'Corral'], ['ultimo_peso', 'Último peso (kg)', 'decimal'], ['color', 'Color'],
            ], $filas),
        ];
    }

    private function movimientos(string $d, string $h): array
    {
        $p = ['d' => $d, 'h' => $h];
        $filas = $this->q(
            "SELECT * FROM (
                SELECT TO_CHAR(a.fecha_registro,'YYYY-MM-DD') fecha, 'Ingreso' movimiento,
                       CASE WHEN a.id_reproduccion_origen IS NOT NULL THEN 'Nacimiento en la granja' ELSE 'Registro' END detalle,
                       " . self::CHAPETA . " chapeta, a.nombre, a.sexo, r.nombre_raza raza
                  FROM ANIMAL a JOIN RAZA r ON a.id_raza = r.id_raza
                 WHERE a.fecha_registro " . $this->entre() . "
                UNION ALL
                SELECT TO_CHAR(a.fecha_cambio_estado,'YYYY-MM-DD'), 'Salida', a.estado || NVL2(a.motivo_estado, ': ' || a.motivo_estado, ''),
                       " . self::CHAPETA . ", a.nombre, a.sexo, r.nombre_raza
                  FROM ANIMAL a JOIN RAZA r ON a.id_raza = r.id_raza
                 WHERE a.estado <> 'activo' AND a.fecha_cambio_estado " . $this->entre() . "
             ) ORDER BY fecha DESC", $p
        );
        foreach ($filas as &$f) {
            $f['sexo'] = self::SEXO[$f['sexo']] ?? $f['sexo'];
            $f['detalle'] = ucfirst((string) $f['detalle']);
        }
        unset($f);
        $ingresos = count(array_filter($filas, fn($f) => $f['movimiento'] === 'Ingreso'));

        return [
            'titulo' => 'Ingresos y salidas del hato',
            'descripcion' => 'Animales que entraron (nacimientos y registros) y que salieron (ventas, muertes, donaciones, descartes) en el periodo.',
            'indicadores' => [
                $this->ind('Ingresos', $ingresos),
                $this->ind('Salidas', count($filas) - $ingresos),
                $this->ind('Balance', $ingresos - (count($filas) - $ingresos)),
            ],
            'graficos' => [
                $this->grafico('Movimientos por mes', 'barras', [['clave' => 'Ingreso', 'nombre' => 'Ingresos'], ['clave' => 'Salida', 'nombre' => 'Salidas']],
                    $this->porMes($filas, 'fecha', 'movimiento', ['Ingreso', 'Salida'])),
            ],
            'tabla' => $this->tabla([
                ['fecha', 'Fecha', 'fecha'], ['movimiento', 'Movimiento'], ['detalle', 'Detalle'],
                ['chapeta', 'Chapeta'], ['nombre', 'Nombre'], ['sexo', 'Sexo'], ['raza', 'Raza'],
            ], $filas),
        ];
    }

    private function corrales(): array
    {
        $filas = $this->q(
            "SELECT c.nombre, c.lote, c.tipo, c.capacidad_maxima capacidad,
                    (SELECT COUNT(*) FROM ANIMAL a WHERE a.id_corral = c.id_corral AND a.estado = 'activo') animales,
                    c.peso_min_kg, c.peso_max_kg, c.descripcion
               FROM CORRAL c ORDER BY c.nombre"
        );
        foreach ($filas as &$f) {
            $f['tipo'] = self::CORRAL[$f['tipo']] ?? $f['tipo'];
            $f['ocupacion'] = $f['capacidad'] > 0 ? round($f['animales'] * 100 / $f['capacidad'], 1) : null;
            $f['libres'] = $f['capacidad'] !== null ? max(0, $f['capacidad'] - $f['animales']) : null;
        }
        unset($f);
        $sinCorral = (int) $this->db->fetchOne("SELECT COUNT(*) FROM ANIMAL WHERE estado = 'activo' AND id_corral IS NULL");
        $capacidad = array_sum(array_column($filas, 'capacidad'));
        $ubicados = array_sum(array_column($filas, 'animales'));

        return [
            'titulo' => 'Ocupación de corrales',
            'descripcion' => 'Cuántos animales hay en cada corral frente a su capacidad.',
            'indicadores' => [
                $this->ind('Corrales', count($filas)),
                $this->ind('Capacidad total', (int) $capacidad),
                $this->ind('Animales ubicados', (int) $ubicados),
                $this->ind('Ocupación', $capacidad > 0 ? round($ubicados * 100 / $capacidad, 1) : null, 'porcentaje'),
                $this->ind('Animales sin corral', $sinCorral),
            ],
            'graficos' => [
                $this->grafico('Animales y capacidad por corral', 'barras', [['clave' => 'animales', 'nombre' => 'Animales'], ['clave' => 'capacidad', 'nombre' => 'Capacidad']],
                    array_map(fn($f) => ['nombre' => $f['nombre'], 'animales' => (int) $f['animales'], 'capacidad' => (int) $f['capacidad']], $filas)),
            ],
            'tabla' => $this->tabla([
                ['nombre', 'Corral'], ['lote', 'Lote'], ['tipo', 'Tipo'], ['animales', 'Animales', 'entero'], ['capacidad', 'Capacidad', 'entero'],
                ['libres', 'Cupos libres', 'entero'], ['ocupacion', 'Ocupación', 'porcentaje'],
                ['peso_min_kg', 'Peso mínimo (kg)', 'decimal'], ['peso_max_kg', 'Peso máximo (kg)', 'decimal'], ['descripcion', 'Descripción'],
            ], $filas),
            'notas' => $sinCorral > 0 ? ["Hay {$sinCorral} animales activos sin corral asignado."] : [],
        ];
    }

    // ══════════════════════════════════════════════════════════════════
    //  LECHE
    // ══════════════════════════════════════════════════════════════════

    private function lecheMensual(string $d, string $h): array
    {
        $filas = $this->q(
            "SELECT TO_CHAR(fecha_produccion,'YYYY-MM') mes, ROUND(SUM(litros),2) litros, COUNT(*) registros,
                    COUNT(DISTINCT id_animal) cabras, COUNT(DISTINCT TRUNC(fecha_produccion)) dias,
                    ROUND(AVG(grasa_porcentaje),2) grasa, ROUND(AVG(proteina_porcentaje),2) proteina
               FROM PRODUCCION_LECHE WHERE fecha_produccion " . $this->entre() . "
              GROUP BY TO_CHAR(fecha_produccion,'YYYY-MM') ORDER BY 1", ['d' => $d, 'h' => $h]
        );
        foreach ($filas as &$f) {
            $f['por_dia'] = $f['dias'] > 0 ? round($f['litros'] / $f['dias'], 2) : null;
            $f['por_cabra_dia'] = $f['dias'] > 0 && $f['cabras'] > 0 ? round($f['litros'] / $f['dias'] / $f['cabras'], 2) : null;
        }
        unset($f);
        $total = array_sum(array_column($filas, 'litros'));
        $mejor = $filas ? array_reduce($filas, fn($m, $f) => $m === null || $f['litros'] > $m['litros'] ? $f : $m) : null;

        return [
            'titulo' => 'Producción de leche por mes',
            'descripcion' => 'Litros ordeñados cada mes, cabras en ordeño y calidad de la leche.',
            'indicadores' => [
                $this->ind('Total del periodo', round($total, 1), 'decimal', 'L'),
                $this->ind('Promedio mensual', $filas ? round($total / count($filas), 1) : null, 'decimal', 'L'),
                $this->ind('Mejor mes', $mejor ? $mejor['mes'] : null, 'texto'),
                $this->ind('Meses con registros', count($filas)),
            ],
            'graficos' => [
                $this->grafico('Litros por mes', 'linea', [['clave' => 'litros', 'nombre' => 'Litros']],
                    array_map(fn($f) => ['nombre' => $f['mes'], 'litros' => (float) $f['litros']], $filas)),
                $this->grafico('Litros por cabra al día', 'barras', [['clave' => 'por_cabra_dia', 'nombre' => 'L por cabra al día']],
                    array_map(fn($f) => ['nombre' => $f['mes'], 'por_cabra_dia' => (float) $f['por_cabra_dia']], $filas)),
            ],
            'tabla' => $this->tabla([
                ['mes', 'Mes'], ['litros', 'Litros', 'decimal'], ['dias', 'Días con ordeño', 'entero'], ['cabras', 'Cabras ordeñadas', 'entero'],
                ['por_dia', 'Litros por día', 'decimal'], ['por_cabra_dia', 'Litros por cabra al día', 'decimal'],
                ['registros', 'Registros', 'entero'], ['grasa', 'Grasa (%)', 'decimal'], ['proteina', 'Proteína (%)', 'decimal'],
            ], $filas),
        ];
    }

    private function lechePorCabra(string $d, string $h): array
    {
        $filas = $this->q(
            "SELECT " . self::CHAPETA . " chapeta, a.nombre, r.nombre_raza raza,
                    ROUND(SUM(p.litros),2) litros, COUNT(DISTINCT TRUNC(p.fecha_produccion)) dias,
                    ROUND(SUM(p.litros) / COUNT(DISTINCT TRUNC(p.fecha_produccion)), 2) por_dia,
                    ROUND(MAX(p.litros),2) maximo, ROUND(AVG(p.grasa_porcentaje),2) grasa, ROUND(AVG(p.proteina_porcentaje),2) proteina,
                    TO_CHAR(MAX(p.fecha_produccion),'YYYY-MM-DD') ultimo
               FROM PRODUCCION_LECHE p JOIN ANIMAL a ON p.id_animal = a.id_animal JOIN RAZA r ON a.id_raza = r.id_raza
              WHERE p.fecha_produccion " . $this->entre('p.fecha_produccion') . "
              GROUP BY " . self::CHAPETA . ", a.nombre, r.nombre_raza
              ORDER BY litros DESC", ['d' => $d, 'h' => $h]
        );
        $total = array_sum(array_column($filas, 'litros'));
        foreach ($filas as $i => &$f) {
            $f['puesto'] = $i + 1;
            $f['aporte'] = $total > 0 ? round($f['litros'] * 100 / $total, 1) : null;
        }
        unset($f);

        return [
            'titulo' => 'Producción por cabra',
            'descripcion' => 'Cabras ordenadas de la que más leche dio a la que menos en el periodo.',
            'indicadores' => [
                $this->ind('Cabras ordeñadas', count($filas)),
                $this->ind('Total del periodo', round($total, 1), 'decimal', 'L'),
                $this->ind('Promedio por cabra', $filas ? round($total / count($filas), 1) : null, 'decimal', 'L'),
                $this->ind('Mejor productora', $filas ? trim($filas[0]['chapeta'] . ' ' . $filas[0]['nombre']) : null, 'texto'),
            ],
            'graficos' => [
                $this->grafico('Las 10 cabras que más produjeron (litros)', 'barras', [['clave' => 'litros', 'nombre' => 'Litros']],
                    array_map(fn($f) => ['nombre' => $f['nombre'] ?: $f['chapeta'], 'litros' => (float) $f['litros']], array_slice($filas, 0, 10))),
            ],
            'tabla' => $this->tabla([
                ['puesto', 'Puesto', 'entero'], ['chapeta', 'Chapeta'], ['nombre', 'Nombre'], ['raza', 'Raza'],
                ['litros', 'Litros', 'decimal'], ['aporte', 'Aporte al total', 'porcentaje'], ['dias', 'Días ordeñada', 'entero'],
                ['por_dia', 'Litros por día', 'decimal'], ['maximo', 'Mayor ordeño (L)', 'decimal'],
                ['grasa', 'Grasa (%)', 'decimal'], ['proteina', 'Proteína (%)', 'decimal'], ['ultimo', 'Último ordeño', 'fecha'],
            ], $filas),
        ];
    }

    private function lecheDetalle(string $d, string $h): array
    {
        $filas = $this->q(
            "SELECT TO_CHAR(p.fecha_produccion,'YYYY-MM-DD') fecha, " . self::CHAPETA . " chapeta, a.nombre, p.turno,
                    p.litros, p.grasa_porcentaje grasa, p.proteina_porcentaje proteina, p.celulas_somaticas celulas,
                    p.numero_lactancia lactancia, p.dias_lactancia dias_lactancia, p.observaciones
               FROM PRODUCCION_LECHE p JOIN ANIMAL a ON p.id_animal = a.id_animal
              WHERE p.fecha_produccion " . $this->entre('p.fecha_produccion') . "
              ORDER BY p.fecha_produccion DESC, chapeta", ['d' => $d, 'h' => $h]
        );
        foreach ($filas as &$f) {
            $f['turno'] = self::TURNO[$f['turno']] ?? $f['turno'];
        }
        unset($f);
        $total = array_sum(array_column($filas, 'litros'));

        return [
            'titulo' => 'Registro de ordeños',
            'descripcion' => 'Cada ordeño anotado en el periodo, con litros y calidad.',
            'indicadores' => [
                $this->ind('Ordeños registrados', count($filas)),
                $this->ind('Total', round($total, 1), 'decimal', 'L'),
                $this->ind('Promedio por ordeño', $filas ? round($total / count($filas), 2) : null, 'decimal', 'L'),
            ],
            'graficos' => [
                $this->grafico('Litros por turno', 'torta', [['clave' => 'valor', 'nombre' => 'Litros']], $this->sumar($filas, 'turno', 'litros')),
            ],
            'tabla' => $this->tabla([
                ['fecha', 'Fecha', 'fecha'], ['chapeta', 'Chapeta'], ['nombre', 'Nombre'], ['turno', 'Turno'], ['litros', 'Litros', 'decimal'],
                ['grasa', 'Grasa (%)', 'decimal'], ['proteina', 'Proteína (%)', 'decimal'], ['celulas', 'Células somáticas', 'entero'],
                ['lactancia', 'Lactancia n.º', 'entero'], ['dias_lactancia', 'Días en lactancia', 'entero'], ['observaciones', 'Observaciones'],
            ], $filas),
        ];
    }

    // ══════════════════════════════════════════════════════════════════
    //  REPRODUCCIÓN
    // ══════════════════════════════════════════════════════════════════

    private function servicios(string $d, string $h): array
    {
        $filas = $this->q(
            "SELECT TO_CHAR(rp.fecha_servicio,'YYYY-MM-DD') fecha,
                    NVL(hh.chapeta_nueva, NVL(hh.chapeta_vieja, hh.codigo_identificacion)) hembra_chapeta, hh.nombre hembra,
                    NVL(m.chapeta_nueva, NVL(m.chapeta_vieja, m.codigo_identificacion)) macho_chapeta, m.nombre macho,
                    rp.tipo_servicio servicio, rp.resultado,
                    TO_CHAR(rp.fecha_parto_estimada,'YYYY-MM-DD') estimado, TO_CHAR(rp.fecha_parto_real,'YYYY-MM-DD') parto,
                    rp.tipo_parto, rp.numero_crias crias, rp.dificultad_parto dificultad,
                    CASE WHEN rp.fecha_parto_real IS NOT NULL THEN TRUNC(rp.fecha_parto_real - rp.fecha_servicio) END gestacion
               FROM REPRODUCCION rp
               JOIN ANIMAL hh ON rp.id_hembra = hh.id_animal
               LEFT JOIN ANIMAL m ON rp.id_macho = m.id_animal
              WHERE rp.fecha_servicio " . $this->entre('rp.fecha_servicio') . "
              ORDER BY rp.fecha_servicio DESC", ['d' => $d, 'h' => $h]
        );
        $exitosos = $cerrados = $crias = 0;
        foreach ($filas as &$f) {
            if ($f['resultado'] === 'exitoso') { $exitosos++; $crias += (int) $f['crias']; }
            if ($f['resultado'] !== 'pendiente') { $cerrados++; }
            $f['resultado'] = self::RESULTADO[$f['resultado']] ?? $f['resultado'];
            $f['servicio'] = self::SERVICIO[$f['servicio']] ?? ucfirst(str_replace('_', ' ', (string) $f['servicio']));
            $f['tipo_parto'] = self::PARTO[$f['tipo_parto']] ?? $f['tipo_parto'];
            $f['dificultad'] = $f['dificultad'] ? ucfirst((string) $f['dificultad']) : null;
        }
        unset($f);

        return [
            'titulo' => 'Servicios y partos',
            'descripcion' => 'Cada monta o inseminación del periodo y en qué terminó.',
            'indicadores' => [
                $this->ind('Servicios', count($filas)),
                $this->ind('Partos exitosos', $exitosos),
                $this->ind('Tasa de preñez', $cerrados > 0 ? round($exitosos * 100 / $cerrados, 1) : null, 'porcentaje'),
                $this->ind('Crías nacidas', $crias),
                $this->ind('Crías por parto', $exitosos > 0 ? round($crias / $exitosos, 2) : null, 'decimal'),
                $this->ind('En espera', count($filas) - $cerrados),
            ],
            'graficos' => [
                $this->grafico('Resultado de los servicios', 'torta', [['clave' => 'valor', 'nombre' => 'Servicios']], $this->contar($filas, 'resultado')),
                $this->grafico('Tipo de parto', 'barras', [['clave' => 'valor', 'nombre' => 'Partos']],
                    $this->contar(array_filter($filas, fn($f) => $f['tipo_parto']), 'tipo_parto', null, array_values(self::PARTO))),
            ],
            'tabla' => $this->tabla([
                ['fecha', 'Servicio', 'fecha'], ['hembra_chapeta', 'Hembra'], ['hembra', 'Nombre'], ['macho_chapeta', 'Macho'], ['macho', 'Nombre del macho'],
                ['servicio', 'Tipo de servicio'], ['resultado', 'Resultado'], ['estimado', 'Parto estimado', 'fecha'], ['parto', 'Parto real', 'fecha'],
                ['gestacion', 'Días de gestación', 'entero'], ['tipo_parto', 'Tipo de parto'], ['crias', 'Crías', 'entero'], ['dificultad', 'Dificultad'],
            ], $filas),
            'notas' => ['La tasa de preñez se calcula sobre los servicios que ya tienen resultado; los que siguen en espera no cuentan.'],
        ];
    }

    private function partosProximos(): array
    {
        $filas = $this->q(
            "SELECT NVL(hh.chapeta_nueva, NVL(hh.chapeta_vieja, hh.codigo_identificacion)) chapeta, hh.nombre, c.nombre corral,
                    m.nombre macho, TO_CHAR(rp.fecha_servicio,'YYYY-MM-DD') servicio,
                    TO_CHAR(rp.fecha_parto_estimada,'YYYY-MM-DD') estimado,
                    TRUNC(rp.fecha_parto_estimada) - TRUNC(SYSDATE) faltan, TRUNC(SYSDATE - rp.fecha_servicio) dias_gestacion
               FROM REPRODUCCION rp
               JOIN ANIMAL hh ON rp.id_hembra = hh.id_animal
               LEFT JOIN ANIMAL m ON rp.id_macho = m.id_animal
               LEFT JOIN CORRAL c ON hh.id_corral = c.id_corral
              WHERE rp.resultado = 'pendiente' AND hh.estado = 'activo'
              ORDER BY rp.fecha_parto_estimada"
        );
        foreach ($filas as &$f) {
            $f['aviso'] = $f['faltan'] === null ? 'Sin fecha' : ($f['faltan'] < 0 ? 'Pasada de fecha' : ($f['faltan'] <= 15 ? 'Preparar paridera' : ($f['faltan'] <= 45 ? 'Secar y vigilar' : 'En gestación')));
        }
        unset($f);

        return [
            'titulo' => 'Partos esperados',
            'descripcion' => 'Hembras servidas que siguen en espera, ordenadas por la fecha en que deben parir.',
            'indicadores' => [
                $this->ind('Hembras en espera', count($filas)),
                $this->ind('Paren en 15 días', count(array_filter($filas, fn($f) => $f['faltan'] !== null && $f['faltan'] >= 0 && $f['faltan'] <= 15))),
                $this->ind('Paren en 30 días', count(array_filter($filas, fn($f) => $f['faltan'] !== null && $f['faltan'] >= 0 && $f['faltan'] <= 30))),
                $this->ind('Pasadas de fecha', count(array_filter($filas, fn($f) => $f['faltan'] !== null && $f['faltan'] < 0))),
            ],
            'graficos' => [
                $this->grafico('Partos esperados por mes', 'barras', [['clave' => 'valor', 'nombre' => 'Partos']],
                    $this->contar(array_map(fn($f) => ['mes' => substr((string) $f['estimado'], 0, 7) ?: 'Sin fecha'], $filas), 'mes')),
            ],
            'tabla' => $this->tabla([
                ['chapeta', 'Chapeta'], ['nombre', 'Hembra'], ['corral', 'Corral'], ['macho', 'Macho'], ['servicio', 'Servicio', 'fecha'],
                ['dias_gestacion', 'Días de gestación', 'entero'], ['estimado', 'Parto estimado', 'fecha'], ['faltan', 'Días que faltan', 'entero'], ['aviso', 'Qué hacer'],
            ], $filas),
            'notas' => ['Este informe muestra la situación de hoy; no depende del periodo elegido.'],
        ];
    }

    private function machos(string $d, string $h): array
    {
        $filas = $this->q(
            "SELECT NVL(m.chapeta_nueva, NVL(m.chapeta_vieja, m.codigo_identificacion)) chapeta, m.nombre, r.nombre_raza raza,
                    COUNT(*) servicios,
                    SUM(CASE WHEN rp.resultado = 'exitoso' THEN 1 ELSE 0 END) partos,
                    SUM(CASE WHEN rp.resultado IN ('aborto','mortinato') THEN 1 ELSE 0 END) perdidas,
                    SUM(CASE WHEN rp.resultado = 'pendiente' THEN 1 ELSE 0 END) espera,
                    NVL(SUM(CASE WHEN rp.resultado = 'exitoso' THEN rp.numero_crias END),0) crias,
                    COUNT(DISTINCT rp.id_hembra) hembras
               FROM REPRODUCCION rp JOIN ANIMAL m ON rp.id_macho = m.id_animal JOIN RAZA r ON m.id_raza = r.id_raza
              WHERE rp.fecha_servicio " . $this->entre('rp.fecha_servicio') . "
              GROUP BY NVL(m.chapeta_nueva, NVL(m.chapeta_vieja, m.codigo_identificacion)), m.nombre, r.nombre_raza
              ORDER BY servicios DESC", ['d' => $d, 'h' => $h]
        );
        foreach ($filas as &$f) {
            $cerrados = $f['partos'] + $f['perdidas'];
            $f['tasa'] = $cerrados > 0 ? round($f['partos'] * 100 / $cerrados, 1) : null;
            $f['crias_parto'] = $f['partos'] > 0 ? round($f['crias'] / $f['partos'], 2) : null;
        }
        unset($f);

        return [
            'titulo' => 'Desempeño de los machos',
            'descripcion' => 'Servicios de cada reproductor, cuántos terminaron en parto y cuántas crías dejó.',
            'indicadores' => [
                $this->ind('Machos usados', count($filas)),
                $this->ind('Servicios', (int) array_sum(array_column($filas, 'servicios'))),
                $this->ind('Crías', (int) array_sum(array_column($filas, 'crias'))),
            ],
            'graficos' => [
                $this->grafico('Servicios y partos por macho', 'barras', [['clave' => 'servicios', 'nombre' => 'Servicios'], ['clave' => 'partos', 'nombre' => 'Partos']],
                    array_map(fn($f) => ['nombre' => $f['nombre'] ?: $f['chapeta'], 'servicios' => (int) $f['servicios'], 'partos' => (int) $f['partos']], $filas)),
            ],
            'tabla' => $this->tabla([
                ['chapeta', 'Chapeta'], ['nombre', 'Macho'], ['raza', 'Raza'], ['servicios', 'Servicios', 'entero'], ['hembras', 'Hembras servidas', 'entero'],
                ['partos', 'Partos', 'entero'], ['perdidas', 'Abortos o mortinatos', 'entero'], ['espera', 'En espera', 'entero'],
                ['tasa', 'Tasa de preñez', 'porcentaje'], ['crias', 'Crías', 'entero'], ['crias_parto', 'Crías por parto', 'decimal'],
            ], $filas),
        ];
    }

    // ══════════════════════════════════════════════════════════════════
    //  SALUD
    // ══════════════════════════════════════════════════════════════════

    private function saludEventos(string $d, string $h): array
    {
        $filas = $this->q(
            "SELECT TO_CHAR(s.fecha_aplicacion,'YYYY-MM-DD') fecha, " . self::CHAPETA . " chapeta, a.nombre, s.tipo_registro tipo,
                    s.enfermedad_diagnostico enfermedad, s.medicamento_producto producto, s.dosis, s.via_administracion via,
                    s.lote_producto lote, s.veterinario, TO_CHAR(s.fecha_proxima_aplicacion,'YYYY-MM-DD') proxima,
                    s.dias_retiro_leche retiro_leche, s.dias_retiro_carne retiro_carne, s.observaciones
               FROM SALUD s JOIN ANIMAL a ON s.id_animal = a.id_animal
              WHERE s.fecha_aplicacion " . $this->entre('s.fecha_aplicacion') . "
              ORDER BY s.fecha_aplicacion DESC", ['d' => $d, 'h' => $h]
        );
        foreach ($filas as &$f) {
            $f['tipo'] = self::SALUD[$f['tipo']] ?? ucfirst((string) $f['tipo']);
        }
        unset($f);
        $de = fn(string $t) => count(array_filter($filas, fn($f) => $f['tipo'] === $t));

        return [
            'titulo' => 'Registro sanitario',
            'descripcion' => 'Vacunas, desparasitaciones, tratamientos, enfermedades y cirugías del periodo, con producto, dosis y tiempos de retiro.',
            'indicadores' => [
                $this->ind('Eventos', count($filas)),
                $this->ind('Vacunas', $de('Vacuna')),
                $this->ind('Desparasitaciones', $de('Desparasitación')),
                $this->ind('Tratamientos', $de('Tratamiento')),
                $this->ind('Enfermedades', $de('Enfermedad')),
                $this->ind('Animales atendidos', count(array_unique(array_column($filas, 'chapeta')))),
            ],
            'graficos' => [
                $this->grafico('Eventos por tipo', 'torta', [['clave' => 'valor', 'nombre' => 'Eventos']], $this->contar($filas, 'tipo')),
                $this->grafico('Eventos por mes', 'barras', [['clave' => 'valor', 'nombre' => 'Eventos']],
                    $this->contar(array_map(fn($f) => ['mes' => substr((string) $f['fecha'], 0, 7)], array_reverse($filas)), 'mes', null, null, false)),
            ],
            'tabla' => $this->tabla([
                ['fecha', 'Fecha', 'fecha'], ['chapeta', 'Chapeta'], ['nombre', 'Nombre'], ['tipo', 'Tipo'], ['enfermedad', 'Enfermedad o diagnóstico'],
                ['producto', 'Producto'], ['dosis', 'Dosis'], ['via', 'Vía'], ['lote', 'Lote'], ['veterinario', 'Responsable'],
                ['proxima', 'Próxima aplicación', 'fecha'], ['retiro_leche', 'Retiro leche (días)', 'entero'], ['retiro_carne', 'Retiro carne (días)', 'entero'],
                ['observaciones', 'Observaciones'],
            ], $filas),
        ];
    }

    private function enfermedades(string $d, string $h): array
    {
        $filas = $this->q(
            "SELECT s.enfermedad_diagnostico enfermedad, COUNT(*) casos, COUNT(DISTINCT s.id_animal) animales,
                    TO_CHAR(MIN(s.fecha_aplicacion),'YYYY-MM-DD') primero, TO_CHAR(MAX(s.fecha_aplicacion),'YYYY-MM-DD') ultimo
               FROM SALUD s
              WHERE s.enfermedad_diagnostico IS NOT NULL AND s.tipo_registro IN ('diagnostico','tratamiento','cirugia')
                AND s.fecha_aplicacion " . $this->entre('s.fecha_aplicacion') . "
              GROUP BY s.enfermedad_diagnostico ORDER BY casos DESC", ['d' => $d, 'h' => $h]
        );
        $activos = max(1, (int) $this->db->fetchOne("SELECT COUNT(*) FROM ANIMAL WHERE estado = 'activo'"));
        $casos = array_sum(array_column($filas, 'casos'));
        foreach ($filas as &$f) {
            $f['parte'] = $casos > 0 ? round($f['casos'] * 100 / $casos, 1) : null;
            $f['afectado'] = round($f['animales'] * 100 / $activos, 1);
        }
        unset($f);

        return [
            'titulo' => 'Enfermedades más frecuentes',
            'descripcion' => 'Diagnósticos del periodo agrupados, con cuántos animales tocó cada uno.',
            'indicadores' => [
                $this->ind('Enfermedades distintas', count($filas)),
                $this->ind('Casos', (int) $casos),
                $this->ind('La más frecuente', $filas ? $filas[0]['enfermedad'] : null, 'texto'),
            ],
            'graficos' => [
                $this->grafico('Casos por enfermedad', 'barras', [['clave' => 'casos', 'nombre' => 'Casos']],
                    array_map(fn($f) => ['nombre' => $f['enfermedad'], 'casos' => (int) $f['casos']], array_slice($filas, 0, 10))),
            ],
            'tabla' => $this->tabla([
                ['enfermedad', 'Enfermedad o diagnóstico'], ['casos', 'Casos', 'entero'], ['parte', 'Parte del total', 'porcentaje'],
                ['animales', 'Animales distintos', 'entero'], ['afectado', 'Hato afectado', 'porcentaje'],
                ['primero', 'Primer caso', 'fecha'], ['ultimo', 'Último caso', 'fecha'],
            ], $filas),
            'notas' => ['"Hato afectado" compara los animales con ese diagnóstico contra los animales activos de hoy.'],
        ];
    }

    private function saludPendientes(): array
    {
        $filas = $this->q(
            "SELECT * FROM (
                SELECT 'Próxima aplicación' asunto, " . self::CHAPETA . " chapeta, a.nombre, s.tipo_registro tipo, s.medicamento_producto producto,
                       TO_CHAR(s.fecha_aplicacion,'YYYY-MM-DD') aplicado, TO_CHAR(s.fecha_proxima_aplicacion,'YYYY-MM-DD') fecha,
                       TRUNC(s.fecha_proxima_aplicacion) - TRUNC(SYSDATE) dias
                  FROM SALUD s JOIN ANIMAL a ON s.id_animal = a.id_animal
                 WHERE a.estado = 'activo' AND s.fecha_proxima_aplicacion IS NOT NULL
                   AND s.fecha_proxima_aplicacion >= SYSDATE - 30 AND s.fecha_proxima_aplicacion <= SYSDATE + 60
                   AND NOT EXISTS (SELECT 1 FROM SALUD s2 WHERE s2.id_animal = s.id_animal AND s2.tipo_registro = s.tipo_registro
                                      AND NVL(s2.medicamento_producto,'-') = NVL(s.medicamento_producto,'-') AND s2.fecha_aplicacion > s.fecha_aplicacion)
                UNION ALL
                SELECT 'Retiro de leche', " . self::CHAPETA . ", a.nombre, s.tipo_registro, s.medicamento_producto,
                       TO_CHAR(s.fecha_aplicacion,'YYYY-MM-DD'), TO_CHAR(s.fecha_aplicacion + s.dias_retiro_leche,'YYYY-MM-DD'),
                       TRUNC(s.fecha_aplicacion + s.dias_retiro_leche) - TRUNC(SYSDATE)
                  FROM SALUD s JOIN ANIMAL a ON s.id_animal = a.id_animal
                 WHERE a.estado = 'activo' AND s.dias_retiro_leche > 0 AND s.fecha_aplicacion + s.dias_retiro_leche >= TRUNC(SYSDATE)
                UNION ALL
                SELECT 'Retiro de carne', " . self::CHAPETA . ", a.nombre, s.tipo_registro, s.medicamento_producto,
                       TO_CHAR(s.fecha_aplicacion,'YYYY-MM-DD'), TO_CHAR(s.fecha_aplicacion + s.dias_retiro_carne,'YYYY-MM-DD'),
                       TRUNC(s.fecha_aplicacion + s.dias_retiro_carne) - TRUNC(SYSDATE)
                  FROM SALUD s JOIN ANIMAL a ON s.id_animal = a.id_animal
                 WHERE a.estado = 'activo' AND s.dias_retiro_carne > 0 AND s.fecha_aplicacion + s.dias_retiro_carne >= TRUNC(SYSDATE)
             ) ORDER BY dias"
        );
        foreach ($filas as &$f) {
            $f['tipo'] = self::SALUD[$f['tipo']] ?? ucfirst((string) $f['tipo']);
            $f['situacion'] = $f['asunto'] === 'Próxima aplicación'
                ? ($f['dias'] < 0 ? 'Vencida' : ($f['dias'] <= 7 ? 'Esta semana' : 'Programada'))
                : 'No usar hasta la fecha';
        }
        unset($f);
        $de = fn(string $a) => count(array_filter($filas, fn($f) => $f['asunto'] === $a));

        return [
            'titulo' => 'Pendientes sanitarios',
            'descripcion' => 'Aplicaciones que vienen o ya se vencieron, y animales cuya leche o carne todavía no se puede usar.',
            'indicadores' => [
                $this->ind('Aplicaciones vencidas', count(array_filter($filas, fn($f) => $f['situacion'] === 'Vencida'))),
                $this->ind('Para esta semana', count(array_filter($filas, fn($f) => $f['situacion'] === 'Esta semana'))),
                $this->ind('En retiro de leche', $de('Retiro de leche')),
                $this->ind('En retiro de carne', $de('Retiro de carne')),
            ],
            'graficos' => [
                $this->grafico('Pendientes por situación', 'barras', [['clave' => 'valor', 'nombre' => 'Pendientes']], $this->contar($filas, 'situacion')),
            ],
            'tabla' => $this->tabla([
                ['asunto', 'Asunto'], ['situacion', 'Situación'], ['chapeta', 'Chapeta'], ['nombre', 'Nombre'], ['tipo', 'Tipo'], ['producto', 'Producto'],
                ['aplicado', 'Aplicado', 'fecha'], ['fecha', 'Fecha límite', 'fecha'], ['dias', 'Días que faltan', 'entero'],
            ], $filas),
            'notas' => ['Muestra la situación de hoy: aplicaciones de los últimos 30 días sin repetir y las de los próximos 60 días. No depende del periodo elegido.'],
        ];
    }

    private function famacha(string $d, string $h): array
    {
        $filas = $this->q(
            "SELECT TO_CHAR(f.fecha_evaluacion,'YYYY-MM-DD') fecha, " . self::CHAPETA . " chapeta, a.nombre, f.puntuacion,
                    f.ojo_evaluado ojo, f.tratamiento_aplicado tratado, f.medicamento, TO_CHAR(f.proxima_evaluacion,'YYYY-MM-DD') proxima, f.observaciones
               FROM FAMACHA f JOIN ANIMAL a ON f.id_animal = a.id_animal
              WHERE f.fecha_evaluacion " . $this->entre('f.fecha_evaluacion') . "
              ORDER BY f.fecha_evaluacion DESC, f.puntuacion DESC", ['d' => $d, 'h' => $h]
        );
        $distribucion = [];
        foreach (self::FAMACHA as $n => $texto) {
            $distribucion[] = ['nombre' => $texto, 'valor' => count(array_filter($filas, fn($f) => (int) $f['puntuacion'] === $n))];
        }
        foreach ($filas as &$f) {
            $f['lectura'] = self::FAMACHA[(int) $f['puntuacion']] ?? null;
            $f['tratado'] = (int) $f['tratado'] === 1 ? 'Sí' : 'No';
            $f['ojo'] = $f['ojo'] ? ucfirst((string) $f['ojo']) : null;
        }
        unset($f);
        $riesgo = array_filter($filas, fn($f) => (int) $f['puntuacion'] >= 4);
        $puntos = array_column($filas, 'puntuacion');

        return [
            'titulo' => 'FAMACHA: anemia por parásitos',
            'descripcion' => 'Revisiones del color del párpado. Los puntajes 4 y 5 indican anemia y necesitan desparasitación.',
            'indicadores' => [
                $this->ind('Revisiones', count($filas)),
                $this->ind('Promedio', $puntos ? round(array_sum($puntos) / count($puntos), 2) : null, 'decimal'),
                $this->ind('Con anemia (4 o 5)', count($riesgo)),
                $this->ind('Sin tratar', count(array_filter($riesgo, fn($f) => $f['tratado'] === 'No'))),
            ],
            'graficos' => [
                $this->grafico('Revisiones por puntaje', 'barras', [['clave' => 'valor', 'nombre' => 'Revisiones']], $distribucion),
            ],
            'tabla' => $this->tabla([
                ['fecha', 'Fecha', 'fecha'], ['chapeta', 'Chapeta'], ['nombre', 'Nombre'], ['puntuacion', 'Puntaje', 'entero'], ['lectura', 'Lectura'],
                ['ojo', 'Ojo'], ['tratado', 'Se desparasitó'], ['medicamento', 'Producto'], ['proxima', 'Próxima revisión', 'fecha'], ['observaciones', 'Observaciones'],
            ], $filas),
        ];
    }

    // ══════════════════════════════════════════════════════════════════
    //  PESO
    // ══════════════════════════════════════════════════════════════════

    private function pesajes(string $d, string $h): array
    {
        $filas = $this->q(
            "SELECT TO_CHAR(p.fecha_pesaje,'YYYY-MM-DD') fecha, " . self::CHAPETA . " chapeta, a.nombre, a.sexo,
                    p.peso_kg peso, p.condicion_corporal cc, ROUND(p.ganancia_diaria_kg * 1000) ganancia, p.edad_dias,
                    p.metodo_pesaje metodo, p.observaciones
               FROM PESAJE p JOIN ANIMAL a ON p.id_animal = a.id_animal
              WHERE p.fecha_pesaje " . $this->entre('p.fecha_pesaje') . "
              ORDER BY p.fecha_pesaje DESC, chapeta", ['d' => $d, 'h' => $h]
        );
        foreach ($filas as &$f) {
            $f['sexo'] = self::SEXO[$f['sexo']] ?? $f['sexo'];
            $f['metodo'] = $f['metodo'] ? ucfirst((string) $f['metodo']) : null;
        }
        unset($f);
        $pesos = array_column($filas, 'peso');
        $cc = array_filter(array_column($filas, 'cc'), fn($v) => $v !== null);

        $porMes = [];
        foreach (array_reverse($filas) as $f) {
            $m = substr((string) $f['fecha'], 0, 7);
            $porMes[$m][] = (float) $f['peso'];
        }

        return [
            'titulo' => 'Registro de pesajes',
            'descripcion' => 'Cada pesaje del periodo con el peso, la condición corporal y la ganancia diaria.',
            'indicadores' => [
                $this->ind('Pesajes', count($filas)),
                $this->ind('Animales pesados', count(array_unique(array_column($filas, 'chapeta')))),
                $this->ind('Peso promedio', $pesos ? round(array_sum($pesos) / count($pesos), 1) : null, 'decimal', 'kg'),
                $this->ind('Condición corporal promedio', $cc ? round(array_sum($cc) / count($cc), 1) : null, 'decimal'),
            ],
            'graficos' => [
                $this->grafico('Peso promedio por mes (kg)', 'linea', [['clave' => 'peso', 'nombre' => 'Peso promedio']],
                    array_map(fn($m, $v) => ['nombre' => $m, 'peso' => round(array_sum($v) / count($v), 1)], array_keys($porMes), $porMes)),
            ],
            'tabla' => $this->tabla([
                ['fecha', 'Fecha', 'fecha'], ['chapeta', 'Chapeta'], ['nombre', 'Nombre'], ['sexo', 'Sexo'], ['peso', 'Peso (kg)', 'decimal'],
                ['cc', 'Condición corporal', 'decimal'], ['ganancia', 'Ganancia diaria (g)', 'entero'], ['edad_dias', 'Edad (días)', 'entero'],
                ['metodo', 'Método'], ['observaciones', 'Observaciones'],
            ], $filas),
            'notas' => ['La condición corporal va de 1 (muy flaca) a 5 (muy gorda); lo ideal está entre 3 y 4.'],
        ];
    }

    private function crecimiento(string $d, string $h): array
    {
        $filas = $this->q(
            "SELECT " . self::CHAPETA . " chapeta, a.nombre, a.sexo, r.nombre_raza raza, COUNT(*) pesajes,
                    TO_CHAR(MIN(p.fecha_pesaje),'YYYY-MM-DD') primera, TO_CHAR(MAX(p.fecha_pesaje),'YYYY-MM-DD') ultima,
                    MAX(p.peso_kg) KEEP (DENSE_RANK FIRST ORDER BY p.fecha_pesaje) peso_inicial,
                    MAX(p.peso_kg) KEEP (DENSE_RANK LAST ORDER BY p.fecha_pesaje) peso_final,
                    MAX(p.condicion_corporal) KEEP (DENSE_RANK LAST ORDER BY p.fecha_pesaje) cc,
                    TRUNC(MAX(p.fecha_pesaje)) - TRUNC(MIN(p.fecha_pesaje)) dias
               FROM PESAJE p JOIN ANIMAL a ON p.id_animal = a.id_animal JOIN RAZA r ON a.id_raza = r.id_raza
              WHERE p.fecha_pesaje " . $this->entre('p.fecha_pesaje') . "
              GROUP BY " . self::CHAPETA . ", a.nombre, a.sexo, r.nombre_raza
              ORDER BY chapeta", ['d' => $d, 'h' => $h]
        );
        foreach ($filas as &$f) {
            $f['sexo'] = self::SEXO[$f['sexo']] ?? $f['sexo'];
            $f['cambio'] = round($f['peso_final'] - $f['peso_inicial'], 2);
            $f['ganancia'] = $f['dias'] > 0 ? (int) round($f['cambio'] * 1000 / $f['dias']) : null;
        }
        unset($f);
        usort($filas, fn($a, $b) => ($b['ganancia'] ?? -99999) <=> ($a['ganancia'] ?? -99999));
        $conGanancia = array_filter(array_column($filas, 'ganancia'), fn($v) => $v !== null);

        return [
            'titulo' => 'Crecimiento por animal',
            'descripcion' => 'Primer y último peso de cada animal en el periodo y cuántos gramos ganó por día.',
            'indicadores' => [
                $this->ind('Animales con pesajes', count($filas)),
                $this->ind('Ganancia diaria promedio', $conGanancia ? (int) round(array_sum($conGanancia) / count($conGanancia)) : null, 'entero', 'g'),
                $this->ind('Animales que bajaron de peso', count(array_filter($filas, fn($f) => $f['cambio'] < 0))),
            ],
            'graficos' => [
                $this->grafico('Ganancia diaria por animal (gramos)', 'barras', [['clave' => 'ganancia', 'nombre' => 'Gramos por día']],
                    array_map(fn($f) => ['nombre' => $f['nombre'] ?: $f['chapeta'], 'ganancia' => (int) $f['ganancia']],
                        array_slice(array_filter($filas, fn($f) => $f['ganancia'] !== null), 0, 15))),
            ],
            'tabla' => $this->tabla([
                ['chapeta', 'Chapeta'], ['nombre', 'Nombre'], ['sexo', 'Sexo'], ['raza', 'Raza'], ['pesajes', 'Pesajes', 'entero'],
                ['primera', 'Primer pesaje', 'fecha'], ['peso_inicial', 'Peso inicial (kg)', 'decimal'], ['ultima', 'Último pesaje', 'fecha'],
                ['peso_final', 'Peso final (kg)', 'decimal'], ['cambio', 'Cambio (kg)', 'decimal'], ['dias', 'Días', 'entero'],
                ['ganancia', 'Ganancia diaria (g)', 'entero'], ['cc', 'Condición corporal', 'decimal'],
            ], $filas),
            'notas' => ['La ganancia diaria necesita al menos dos pesajes del mismo animal en el periodo.'],
        ];
    }

    // ══════════════════════════════════════════════════════════════════
    //  EVALUACIONES
    // ══════════════════════════════════════════════════════════════════

    private function bienestar(string $d, string $h): array
    {
        $filas = $this->q(
            "SELECT TO_CHAR(e.fecha_evaluacion,'YYYY-MM-DD') fecha, e.tipo_productor productor, e.num_animales animales, e.tamano_muestra muestra,
                    e.punt_recursos recursos, e.punt_animal animal, e.punt_gestion gestion, e.punt_total total, e.clasificacion,
                    e.tiene_rspp rspp, e.tiene_asi asi, e.estado, e.evaluadores,
                    (SELECT COUNT(*) FROM EVAL_BIENESTAR_FOTO f WHERE f.id_evaluacion = e.id_evaluacion) fotos
               FROM EVALUACION_BIENESTAR e
              WHERE e.fecha_evaluacion " . $this->entre('e.fecha_evaluacion') . "
              ORDER BY e.fecha_evaluacion DESC", ['d' => $d, 'h' => $h]
        );
        foreach ($filas as &$f) {
            $f['productor'] = self::PRODUCTOR[$f['productor']] ?? $f['productor'];
            $f['clasificacion'] = self::BIENESTAR[$f['clasificacion']] ?? $f['clasificacion'];
            $f['estado'] = $f['estado'] === 'FINALIZADA' ? 'Terminada' : 'Borrador';
            $f['rspp'] = (int) $f['rspp'] === 1 ? 'Sí' : 'No';
            $f['asi'] = (int) $f['asi'] === 1 ? 'Sí' : 'No';
        }
        unset($f);
        $terminadas = array_values(array_filter($filas, fn($f) => $f['estado'] === 'Terminada'));
        $ultima = $terminadas[0] ?? null;

        return [
            'titulo' => 'Bienestar animal (MEBA)',
            'descripcion' => 'Evaluaciones de bienestar con la guía del ICA: puntaje de recursos, animal y gestión, y la clasificación final.',
            'indicadores' => [
                $this->ind('Evaluaciones', count($filas)),
                $this->ind('Terminadas', count($terminadas)),
                $this->ind('Último puntaje', $ultima ? (float) $ultima['total'] : null, 'decimal'),
                $this->ind('Última clasificación', $ultima['clasificacion'] ?? null, 'texto'),
                $this->ind('Promedio del periodo', $terminadas ? round(array_sum(array_column($terminadas, 'total')) / count($terminadas), 1) : null, 'decimal'),
            ],
            'graficos' => [
                $this->grafico('Puntaje por evaluación', 'linea',
                    [['clave' => 'total', 'nombre' => 'Total'], ['clave' => 'recursos', 'nombre' => 'Recursos'], ['clave' => 'animal', 'nombre' => 'Animal'], ['clave' => 'gestion', 'nombre' => 'Gestión']],
                    array_map(fn($f) => ['nombre' => $f['fecha'], 'total' => (float) $f['total'], 'recursos' => (float) $f['recursos'], 'animal' => (float) $f['animal'], 'gestion' => (float) $f['gestion']], array_reverse($terminadas))),
            ],
            'tabla' => $this->tabla([
                ['fecha', 'Fecha', 'fecha'], ['estado', 'Estado'], ['productor', 'Tipo de granja'], ['animales', 'Animales', 'entero'], ['muestra', 'Muestra', 'entero'],
                ['recursos', 'Recursos (35 %)', 'decimal'], ['animal', 'Animal (55 %)', 'decimal'], ['gestion', 'Gestión (10 %)', 'decimal'],
                ['total', 'Puntaje total', 'decimal'], ['clasificacion', 'Clasificación'], ['rspp', 'RSPP'], ['asi', 'ASI'], ['fotos', 'Fotos', 'entero'], ['evaluadores', 'Evaluadores'],
            ], $filas),
            'notas' => ['Clasificación: Excelente desde 90 puntos con RSPP y ASI, Alto desde 75, Medio desde 50 y Bajo por debajo de 50.'],
        ];
    }

    private function lineal(string $d, string $h): array
    {
        $filas = $this->q(
            "SELECT TO_CHAR(e.fecha_evaluacion,'YYYY-MM-DD') fecha, " . self::CHAPETA . " chapeta, a.nombre, r.nombre_raza raza,
                    e.edad_meses edad, e.num_lactancia lactancia, e.punt_apariencia apariencia, e.punt_estructura estructura,
                    e.punt_mamario mamario, e.punt_patas patas, e.punt_final final, e.categoria,
                    (SELECT COUNT(*) FROM EVAL_LINEAL_FOTO f WHERE f.id_evaluacion = e.id_evaluacion) fotos
               FROM EVALUACION_LINEAL e JOIN ANIMAL a ON e.id_animal = a.id_animal JOIN RAZA r ON a.id_raza = r.id_raza
              WHERE e.fecha_evaluacion " . $this->entre('e.fecha_evaluacion') . "
              ORDER BY e.punt_final DESC", ['d' => $d, 'h' => $h]
        );
        foreach ($filas as $i => &$f) {
            $f['puesto'] = $i + 1;
            $f['categoria'] = self::LINEAL[$f['categoria']] ?? $f['categoria'];
        }
        unset($f);
        $puntos = array_column($filas, 'final');

        return [
            'titulo' => 'Clasificación lineal',
            'descripcion' => 'Cabras calificadas con el método ADGA, de la mejor a la más baja, con el puntaje de cada parte del cuerpo.',
            'indicadores' => [
                $this->ind('Evaluaciones', count($filas)),
                $this->ind('Cabras evaluadas', count(array_unique(array_column($filas, 'chapeta')))),
                $this->ind('Puntaje promedio', $puntos ? round(array_sum($puntos) / count($puntos), 1) : null, 'decimal'),
                $this->ind('Mejor cabra', $filas ? trim($filas[0]['chapeta'] . ' ' . $filas[0]['nombre']) : null, 'texto'),
            ],
            'graficos' => [
                $this->grafico('Cabras por categoría', 'barras', [['clave' => 'valor', 'nombre' => 'Cabras']], $this->contar($filas, 'categoria', null, array_values(self::LINEAL))),
                $this->grafico('Puntaje final por cabra', 'barras', [['clave' => 'final', 'nombre' => 'Puntaje']],
                    array_map(fn($f) => ['nombre' => $f['nombre'] ?: $f['chapeta'], 'final' => (float) $f['final']], array_slice($filas, 0, 15))),
            ],
            'tabla' => $this->tabla([
                ['puesto', 'Puesto', 'entero'], ['fecha', 'Fecha', 'fecha'], ['chapeta', 'Chapeta'], ['nombre', 'Nombre'], ['raza', 'Raza'],
                ['edad', 'Edad (meses)', 'entero'], ['lactancia', 'Partos', 'entero'], ['apariencia', 'Apariencia (25)', 'decimal'],
                ['estructura', 'Fortaleza lechera (15)', 'decimal'], ['mamario', 'Ubre (40)', 'decimal'], ['patas', 'Patas (20)', 'decimal'],
                ['final', 'Puntaje final', 'decimal'], ['categoria', 'Categoría'], ['fotos', 'Fotos', 'entero'],
            ], $filas),
            'notas' => ['Categorías: Excelente desde 90, Muy bueno desde 85, Bueno desde 80, Aceptable desde 70, Regular desde 60 y Pobre por debajo de 60.'],
        ];
    }

    // ══════════════════════════════════════════════════════════════════
    //  Utilidades
    // ══════════════════════════════════════════════════════════════════

    /** Filas con las claves en minúscula (Oracle las devuelve en mayúscula). */
    private function q(string $sql, array $params = []): array
    {
        return array_map(fn($r) => array_change_key_case($r, CASE_LOWER), $this->db->fetchAllAssociative($sql, $params));
    }

    /** Condición de periodo; incluye todo el día final. */
    private function entre(string $campo = ''): string
    {
        return "BETWEEN TO_DATE(:d,'YYYY-MM-DD') AND TO_DATE(:h,'YYYY-MM-DD') + 0.99999";
    }

    private function ind(string $etiqueta, mixed $valor, string $formato = 'entero', ?string $unidad = null): array
    {
        return ['etiqueta' => $etiqueta, 'valor' => $valor, 'formato' => $formato, 'unidad' => $unidad];
    }

    /** Un gráfico; si no hay datos se omite. $numericas: claves a convertir a número. */
    private function grafico(string $titulo, string $tipo, array $series, array $datos, array $numericas = []): array
    {
        foreach ($datos as &$fila) {
            foreach ($numericas as $k) {
                $fila[$k] = isset($fila[$k]) ? (float) $fila[$k] : 0;
            }
        }
        unset($fila);
        return ['titulo' => $titulo, 'tipo' => $tipo, 'series' => $series, 'datos' => array_values($datos)];
    }

    /** Arma la tabla y convierte cada valor al tipo de su columna. */
    private function tabla(array $columnas, array $filas): array
    {
        $cols = array_map(fn($c) => ['clave' => $c[0], 'titulo' => $c[1], 'tipo' => $c[2] ?? 'texto'], $columnas);
        $salida = [];
        foreach ($filas as $f) {
            $fila = [];
            foreach ($cols as $c) {
                $v = $f[$c['clave']] ?? null;
                $fila[$c['clave']] = $v === null || $v === '' ? null : match ($c['tipo']) {
                    'entero' => (int) $v,
                    'decimal', 'porcentaje' => (float) $v,
                    default => (string) $v,
                };
            }
            $salida[] = $fila;
        }
        return ['columnas' => $cols, 'filas' => $salida];
    }

    /** Cuenta filas por el valor de un campo → [{nombre, valor}]. */
    private function contar(array $filas, string $campo, ?array $etiquetas = null, ?array $orden = null, bool $ordenar = true): array
    {
        $n = [];
        foreach ($filas as $f) {
            $v = $f[$campo] ?? null;
            $k = $v === null || $v === '' ? 'Sin dato' : ($etiquetas[$v] ?? (string) $v);
            $n[$k] = ($n[$k] ?? 0) + 1;
        }
        if ($orden) {
            $ordenado = [];
            foreach ($orden as $k) { if (isset($n[$k])) { $ordenado[$k] = $n[$k]; unset($n[$k]); } }
            $n = $ordenado + $n;
        } elseif ($ordenar) {
            arsort($n);
        }
        return array_map(fn($k, $v) => ['nombre' => (string) $k, 'valor' => $v], array_keys($n), $n);
    }

    /** Suma un campo numérico agrupando por otro → [{nombre, valor}]. */
    private function sumar(array $filas, string $campo, string $valor): array
    {
        $n = [];
        foreach ($filas as $f) {
            $k = $f[$campo] ?? 'Sin dato';
            $n[$k] = ($n[$k] ?? 0) + (float) $f[$valor];
        }
        arsort($n);
        return array_map(fn($k, $v) => ['nombre' => (string) $k, 'valor' => round($v, 2)], array_keys($n), $n);
    }

    /** Conteo por mes y por categoría → [{nombre: 'YYYY-MM', cat1: n, cat2: n}]. */
    private function porMes(array $filas, string $campoFecha, string $campoCat, array $categorias): array
    {
        $m = [];
        foreach ($filas as $f) {
            $mes = substr((string) $f[$campoFecha], 0, 7);
            if (!isset($m[$mes])) { $m[$mes] = ['nombre' => $mes] + array_fill_keys($categorias, 0); }
            if (isset($m[$mes][$f[$campoCat]])) { $m[$mes][$f[$campoCat]]++; }
        }
        ksort($m);
        return array_values($m);
    }

    private function grupoEdad(mixed $meses): string
    {
        if ($meses === null) { return 'Sin dato'; }
        $m = (int) $meses;
        return $m < 6 ? 'Cría (0-6 meses)' : ($m < 12 ? 'Levante (6-12 meses)' : ($m < 24 ? 'Joven (1-2 años)' : ($m < 72 ? 'Adulto (2-6 años)' : 'Mayor (más de 6 años)')));
    }
}
