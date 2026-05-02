<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/reportes')]
class ReporteController extends AbstractController
{
    public function __construct(private Connection $connection) {}

    // ──────────────────────────────────────────────────────────────────
    //  RESUMEN GENERAL (Dashboard)
    // ──────────────────────────────────────────────────────────────────

    #[Route('/resumen', name: 'api_reportes_resumen', methods: ['GET'])]
    public function resumen(): JsonResponse
    {
        $stats['totalAnimales'] = (int) $this->connection->fetchOne(
            "SELECT COUNT(*) FROM ANIMAL WHERE estado = 'activo'"
        );
        $stats['totalHembras'] = (int) $this->connection->fetchOne(
            "SELECT COUNT(*) FROM ANIMAL WHERE sexo = 'hembra' AND estado = 'activo'"
        );
        $stats['totalMachos'] = (int) $this->connection->fetchOne(
            "SELECT COUNT(*) FROM ANIMAL WHERE sexo = 'macho' AND estado = 'activo'"
        );
        $stats['produccionLitrosMes'] = round((float) $this->connection->fetchOne(
            "SELECT NVL(SUM(litros),0) FROM PRODUCCION_LECHE
             WHERE EXTRACT(MONTH FROM fecha_produccion)=EXTRACT(MONTH FROM SYSDATE)
               AND EXTRACT(YEAR  FROM fecha_produccion)=EXTRACT(YEAR  FROM SYSDATE)"
        ), 2);
        $stats['produccionLitrosMesAnterior'] = round((float) $this->connection->fetchOne(
            "SELECT NVL(SUM(litros),0) FROM PRODUCCION_LECHE
             WHERE EXTRACT(MONTH FROM fecha_produccion)=EXTRACT(MONTH FROM ADD_MONTHS(SYSDATE,-1))
               AND EXTRACT(YEAR  FROM fecha_produccion)=EXTRACT(YEAR  FROM ADD_MONTHS(SYSDATE,-1))"
        ), 2);
        $stats['gestacionesPendientes'] = (int) $this->connection->fetchOne(
            "SELECT COUNT(*) FROM REPRODUCCION WHERE resultado='pendiente'"
        );
        $stats['vacunasMes'] = (int) $this->connection->fetchOne(
            "SELECT COUNT(*) FROM SALUD WHERE tipo_registro='vacuna'
             AND EXTRACT(MONTH FROM fecha_aplicacion)=EXTRACT(MONTH FROM SYSDATE)
             AND EXTRACT(YEAR  FROM fecha_aplicacion)=EXTRACT(YEAR  FROM SYSDATE)"
        );
        $stats['alertasPendientes'] = (int) $this->connection->fetchOne(
            "SELECT COUNT(*) FROM SALUD WHERE fecha_proxima_aplicacion BETWEEN SYSDATE AND SYSDATE+15"
        );
        $stats['partosProximos30'] = (int) $this->connection->fetchOne(
            "SELECT COUNT(*) FROM REPRODUCCION
             WHERE resultado='pendiente' AND fecha_parto_estimada BETWEEN SYSDATE AND SYSDATE+30"
        );
        $stats['animalesEnRetiro'] = (int) $this->connection->fetchOne(
            "SELECT COUNT(DISTINCT id_animal) FROM SALUD
             WHERE (dias_retiro_leche>0 OR dias_retiro_carne>0)
               AND (fecha_aplicacion + GREATEST(NVL(dias_retiro_leche,0),NVL(dias_retiro_carne,0))) >= SYSDATE"
        );

        return $this->json(['data' => $stats]);
    }

    // ──────────────────────────────────────────────────────────────────
    //  PRODUCCIÓN – mensual (histórico 12 meses)
    // ──────────────────────────────────────────────────────────────────

    #[Route('/produccion', name: 'api_reportes_produccion', methods: ['GET'])]
    public function produccionMensual(): JsonResponse
    {
        $rows = $this->connection->fetchAllAssociative(
            "SELECT TO_CHAR(fecha_produccion,'YYYY-MM') AS mes,
                    ROUND(SUM(litros),2)                AS total_litros,
                    COUNT(*)                             AS registros,
                    COUNT(DISTINCT id_animal)            AS animales,
                    ROUND(AVG(litros),2)                 AS promedio_litros,
                    ROUND(AVG(grasa_porcentaje),1)       AS promedio_grasa,
                    ROUND(AVG(proteina_porcentaje),1)    AS promedio_proteina
             FROM PRODUCCION_LECHE
             WHERE fecha_produccion >= ADD_MONTHS(SYSDATE,-12)
             GROUP BY TO_CHAR(fecha_produccion,'YYYY-MM')
             ORDER BY mes"
        );

        $data = array_map(fn($r) => [
            'mes'              => $r['MES'],
            'totalLitros'      => (float) $r['TOTAL_LITROS'],
            'registros'        => (int)   $r['REGISTROS'],
            'animales'         => (int)   $r['ANIMALES'],
            'promedioLitros'   => (float) $r['PROMEDIO_LITROS'],
            'promedioGrasa'    => $r['PROMEDIO_GRASA']    !== null ? (float) $r['PROMEDIO_GRASA']    : null,
            'promedioProteina' => $r['PROMEDIO_PROTEINA'] !== null ? (float) $r['PROMEDIO_PROTEINA'] : null,
        ], $rows);

        return $this->json(['data' => $data]);
    }

    // ──────────────────────────────────────────────────────────────────
    //  PRODUCCIÓN – diaria detallada
    // ──────────────────────────────────────────────────────────────────

    #[Route('/produccion/diaria', name: 'api_reportes_produccion_diaria', methods: ['GET'])]
    public function produccionDiaria(Request $request): JsonResponse
    {
        [$ini, $fin] = $this->rango($request, 30);

        $rows = $this->connection->fetchAllAssociative(
            "SELECT TO_CHAR(p.fecha_produccion,'YYYY-MM-DD') AS fecha,
                    a.codigo_identificacion, a.nombre,
                    r.nombre_raza,
                    ROUND(SUM(p.litros),2)                    AS litros,
                    COUNT(p.id_produccion)                    AS ordenos,
                    ROUND(AVG(p.grasa_porcentaje),1)          AS grasa,
                    ROUND(AVG(p.proteina_porcentaje),1)        AS proteina,
                    ROUND(AVG(p.celulas_somaticas))            AS celulas_somaticas
             FROM PRODUCCION_LECHE p
             JOIN ANIMAL a ON p.id_animal=a.id_animal
             JOIN RAZA   r ON a.id_raza=r.id_raza
             WHERE p.fecha_produccion BETWEEN TO_DATE(:ini,'YYYY-MM-DD') AND TO_DATE(:fin,'YYYY-MM-DD')
             GROUP BY TO_CHAR(p.fecha_produccion,'YYYY-MM-DD'),
                      a.id_animal, a.codigo_identificacion, a.nombre, r.nombre_raza
             ORDER BY fecha DESC, litros DESC",
            ['ini' => $ini, 'fin' => $fin]
        );

        $totalLitros = array_sum(array_column($rows, 'LITROS'));

        return $this->json([
            'data'    => array_map(fn($r) => [
                'fecha'           => $r['FECHA'],
                'codigo'          => $r['CODIGO_IDENTIFICACION'],
                'nombre'          => $r['NOMBRE'],
                'raza'            => $r['NOMBRE_RAZA'],
                'litros'          => (float) $r['LITROS'],
                'ordenos'         => (int)   $r['ORDENOS'],
                'grasa'           => $r['GRASA']           !== null ? (float) $r['GRASA']           : null,
                'proteina'        => $r['PROTEINA']        !== null ? (float) $r['PROTEINA']        : null,
                'celulasSomaticas'=> $r['CELULAS_SOMATICAS'] !== null ? (int) $r['CELULAS_SOMATICAS'] : null,
            ], $rows),
            'resumen' => [
                'totalLitros'  => round($totalLitros, 2),
                'totalOrdenos' => array_sum(array_column($rows, 'ORDENOS')),
                'totalAnimales'=> count(array_unique(array_column($rows, 'CODIGO_IDENTIFICACION'))),
                'promedioGrasa'=> count($rows) ? round(array_sum(array_filter(array_column($rows, 'GRASA'))) / count(array_filter(array_column($rows, 'GRASA')) ?: [1]), 1) : 0,
            ],
        ]);
    }

    // ──────────────────────────────────────────────────────────────────
    //  PRODUCCIÓN – ranking de animales productores
    // ──────────────────────────────────────────────────────────────────

    #[Route('/produccion/ranking', name: 'api_reportes_produccion_ranking', methods: ['GET'])]
    public function produccionRanking(Request $request): JsonResponse
    {
        [$ini, $fin] = $this->rango($request, 90);

        $rows = $this->connection->fetchAllAssociative(
            "SELECT a.id_animal, a.codigo_identificacion, a.nombre,
                    r.nombre_raza, a.sexo,
                    ROUND(SUM(p.litros),2)                AS total_litros,
                    COUNT(p.id_produccion)                AS registros,
                    ROUND(AVG(p.litros),2)                AS promedio_dia,
                    ROUND(AVG(p.grasa_porcentaje),1)      AS promedio_grasa,
                    ROUND(AVG(p.proteina_porcentaje),1)   AS promedio_proteina,
                    MAX(p.litros)                         AS max_litros,
                    MIN(TO_DATE(:ini,'YYYY-MM-DD'))       AS periodo_inicio,
                    MAX(TO_DATE(:fin,'YYYY-MM-DD'))       AS periodo_fin
             FROM PRODUCCION_LECHE p
             JOIN ANIMAL a ON p.id_animal=a.id_animal
             JOIN RAZA   r ON a.id_raza=r.id_raza
             WHERE p.fecha_produccion BETWEEN TO_DATE(:ini,'YYYY-MM-DD') AND TO_DATE(:fin,'YYYY-MM-DD')
             GROUP BY a.id_animal, a.codigo_identificacion, a.nombre, r.nombre_raza, a.sexo
             ORDER BY total_litros DESC",
            ['ini' => $ini, 'fin' => $fin]
        );

        $data = array_values(array_map(fn($r, $i) => [
            'posicion'       => $i + 1,
            'id'             => (int) $r['ID_ANIMAL'],
            'codigo'         => $r['CODIGO_IDENTIFICACION'],
            'nombre'         => $r['NOMBRE'],
            'raza'           => $r['NOMBRE_RAZA'],
            'totalLitros'    => (float) $r['TOTAL_LITROS'],
            'registros'      => (int)   $r['REGISTROS'],
            'promedioDia'    => (float) $r['PROMEDIO_DIA'],
            'promedioGrasa'  => $r['PROMEDIO_GRASA']  !== null ? (float) $r['PROMEDIO_GRASA']   : null,
            'promedioProteina'=> $r['PROMEDIO_PROTEINA'] !== null ? (float) $r['PROMEDIO_PROTEINA'] : null,
            'maxLitros'      => (float) $r['MAX_LITROS'],
        ], $rows, array_keys($rows)));

        return $this->json(['data' => $data, 'periodo' => ['inicio' => $ini, 'fin' => $fin]]);
    }

    // ──────────────────────────────────────────────────────────────────
    //  REPRODUCCIÓN – eficiencia general
    // ──────────────────────────────────────────────────────────────────

    #[Route('/reproduccion', name: 'api_reportes_reproduccion', methods: ['GET'])]
    public function reproduccionEficiencia(Request $request): JsonResponse
    {
        [$ini, $fin] = $this->rango($request, 365);

        $rows = $this->connection->fetchAllAssociative(
            "SELECT TO_CHAR(r.fecha_servicio,'YYYY-MM') AS mes,
                    COUNT(*)                             AS servicios,
                    SUM(CASE WHEN r.resultado='exitoso'   THEN 1 ELSE 0 END) AS exitosos,
                    SUM(CASE WHEN r.resultado='aborto'    THEN 1 ELSE 0 END) AS abortos,
                    SUM(CASE WHEN r.resultado='mortinato' THEN 1 ELSE 0 END) AS mortinatos,
                    SUM(CASE WHEN r.resultado='pendiente' THEN 1 ELSE 0 END) AS pendientes,
                    SUM(NVL(r.numero_crias,0))           AS total_crias,
                    ROUND(
                      SUM(CASE WHEN r.resultado='exitoso' THEN 1 ELSE 0 END)*100 /
                      NULLIF(COUNT(*)-SUM(CASE WHEN r.resultado='pendiente' THEN 1 ELSE 0 END),0), 1
                    ) AS tasa_concepcion
             FROM REPRODUCCION r
             WHERE r.fecha_servicio BETWEEN TO_DATE(:ini,'YYYY-MM-DD') AND TO_DATE(:fin,'YYYY-MM-DD')
             GROUP BY TO_CHAR(r.fecha_servicio,'YYYY-MM')
             ORDER BY mes",
            ['ini' => $ini, 'fin' => $fin]
        );

        $detalleRows = $this->connection->fetchAllAssociative(
            "SELECT TO_CHAR(r.fecha_servicio,'YYYY-MM-DD') AS fecha_servicio,
                    h.codigo_identificacion AS codigo_hembra, h.nombre AS nombre_hembra,
                    m.codigo_identificacion AS codigo_macho,  m.nombre AS nombre_macho,
                    r.tipo_servicio, r.resultado,
                    TO_CHAR(r.fecha_parto_estimada,'YYYY-MM-DD') AS fecha_parto_estimada,
                    TO_CHAR(r.fecha_parto_real,'YYYY-MM-DD')     AS fecha_parto_real,
                    r.tipo_parto, r.numero_crias, r.dificultad_parto
             FROM REPRODUCCION r
             JOIN ANIMAL h ON r.id_hembra=h.id_animal
             LEFT JOIN ANIMAL m ON r.id_macho=m.id_animal
             WHERE r.fecha_servicio BETWEEN TO_DATE(:ini,'YYYY-MM-DD') AND TO_DATE(:fin,'YYYY-MM-DD')
             ORDER BY r.fecha_servicio DESC",
            ['ini' => $ini, 'fin' => $fin]
        );

        $resumen = $this->connection->fetchAssociative(
            "SELECT COUNT(*) AS total,
                    SUM(CASE WHEN resultado='exitoso'   THEN 1 ELSE 0 END) AS exitosos,
                    SUM(CASE WHEN resultado='aborto'    THEN 1 ELSE 0 END) AS abortos,
                    SUM(CASE WHEN resultado='mortinato' THEN 1 ELSE 0 END) AS mortinatos,
                    SUM(CASE WHEN resultado='pendiente' THEN 1 ELSE 0 END) AS pendientes,
                    SUM(NVL(numero_crias,0)) AS total_crias,
                    ROUND(SUM(CASE WHEN resultado='exitoso' THEN 1 ELSE 0 END)*100 /
                          NULLIF(COUNT(*)-SUM(CASE WHEN resultado='pendiente' THEN 1 ELSE 0 END),0),1) AS tasa
             FROM REPRODUCCION
             WHERE fecha_servicio BETWEEN TO_DATE(:ini,'YYYY-MM-DD') AND TO_DATE(:fin,'YYYY-MM-DD')",
            ['ini' => $ini, 'fin' => $fin]
        );

        return $this->json([
            'mensual' => array_map(fn($r) => [
                'mes'            => $r['MES'],
                'servicios'      => (int)   $r['SERVICIOS'],
                'exitosos'       => (int)   $r['EXITOSOS'],
                'abortos'        => (int)   $r['ABORTOS'],
                'mortinatos'     => (int)   $r['MORTINATOS'],
                'pendientes'     => (int)   $r['PENDIENTES'],
                'totalCrias'     => (int)   $r['TOTAL_CRIAS'],
                'tasaConcepcion' => $r['TASA_CONCEPCION'] !== null ? (float) $r['TASA_CONCEPCION'] : null,
            ], $rows),
            'detalle' => array_map(fn($r) => [
                'fechaServicio'      => $r['FECHA_SERVICIO'],
                'codigoHembra'       => $r['CODIGO_HEMBRA'],
                'nombreHembra'       => $r['NOMBRE_HEMBRA'],
                'codigoMacho'        => $r['CODIGO_MACHO'],
                'nombreMacho'        => $r['NOMBRE_MACHO'],
                'tipoServicio'       => $r['TIPO_SERVICIO'],
                'resultado'          => $r['RESULTADO'],
                'fechaPartoEstimada' => $r['FECHA_PARTO_ESTIMADA'],
                'fechaPartoReal'     => $r['FECHA_PARTO_REAL'],
                'tipoParto'          => $r['TIPO_PARTO'],
                'numeroCrias'        => $r['NUMERO_CRIAS'] !== null ? (int) $r['NUMERO_CRIAS'] : null,
                'dificultadParto'    => $r['DIFICULTAD_PARTO'],
            ], $detalleRows),
            'resumen' => [
                'total'          => (int)   $resumen['TOTAL'],
                'exitosos'       => (int)   $resumen['EXITOSOS'],
                'abortos'        => (int)   $resumen['ABORTOS'],
                'mortinatos'     => (int)   $resumen['MORTINATOS'],
                'pendientes'     => (int)   $resumen['PENDIENTES'],
                'totalCrias'     => (int)   $resumen['TOTAL_CRIAS'],
                'tasaConcepcion' => $resumen['TASA'] !== null ? (float) $resumen['TASA'] : null,
            ],
            'periodo' => ['inicio' => $ini, 'fin' => $fin],
        ]);
    }

    // ──────────────────────────────────────────────────────────────────
    //  REPRODUCCIÓN – partos próximos y recientes
    // ──────────────────────────────────────────────────────────────────

    #[Route('/reproduccion/partos', name: 'api_reportes_reproduccion_partos', methods: ['GET'])]
    public function reproduccionPartos(): JsonResponse
    {
        $proximos = $this->connection->fetchAllAssociative(
            "SELECT a.codigo_identificacion, a.nombre, rz.nombre_raza,
                    TO_CHAR(r.fecha_servicio,'YYYY-MM-DD')      AS fecha_servicio,
                    TO_CHAR(r.fecha_parto_estimada,'YYYY-MM-DD')AS fecha_estimada,
                    TRUNC(r.fecha_parto_estimada - SYSDATE)     AS dias_restantes,
                    r.tipo_servicio,
                    m.codigo_identificacion                      AS codigo_macho,
                    m.nombre                                     AS nombre_macho
             FROM REPRODUCCION r
             JOIN ANIMAL a  ON r.id_hembra=a.id_animal
             JOIN RAZA   rz ON a.id_raza=rz.id_raza
             LEFT JOIN ANIMAL m ON r.id_macho=m.id_animal
             WHERE r.resultado='pendiente'
               AND r.fecha_parto_estimada IS NOT NULL
             ORDER BY r.fecha_parto_estimada"
        );

        $recientes = $this->connection->fetchAllAssociative(
            "SELECT a.codigo_identificacion, a.nombre, rz.nombre_raza,
                    TO_CHAR(r.fecha_parto_real,'YYYY-MM-DD') AS fecha_parto_real,
                    r.tipo_parto, r.numero_crias, r.dificultad_parto, r.resultado
             FROM REPRODUCCION r
             JOIN ANIMAL a  ON r.id_hembra=a.id_animal
             JOIN RAZA   rz ON a.id_raza=rz.id_raza
             WHERE r.resultado IN ('exitoso','aborto','mortinato')
               AND r.fecha_parto_real >= ADD_MONTHS(SYSDATE,-3)
             ORDER BY r.fecha_parto_real DESC"
        );

        $mapProximo = fn($r) => [
            'codigo'       => $r['CODIGO_IDENTIFICACION'],
            'nombre'       => $r['NOMBRE'],
            'raza'         => $r['NOMBRE_RAZA'],
            'fechaServicio'=> $r['FECHA_SERVICIO'],
            'fechaEstimada'=> $r['FECHA_ESTIMADA'],
            'diasRestantes'=> (int) $r['DIAS_RESTANTES'],
            'tipoServicio' => $r['TIPO_SERVICIO'],
            'codigoMacho'  => $r['CODIGO_MACHO'],
            'nombreMacho'  => $r['NOMBRE_MACHO'],
            'urgencia'     => (int) $r['DIAS_RESTANTES'] <= 7 ? 'alta' : ((int) $r['DIAS_RESTANTES'] <= 21 ? 'media' : 'baja'),
        ];

        $mapReciente = fn($r) => [
            'codigo'          => $r['CODIGO_IDENTIFICACION'],
            'nombre'          => $r['NOMBRE'],
            'raza'            => $r['NOMBRE_RAZA'],
            'fechaPartoReal'  => $r['FECHA_PARTO_REAL'],
            'tipoParto'       => $r['TIPO_PARTO'],
            'numeroCrias'     => $r['NUMERO_CRIAS'] !== null ? (int) $r['NUMERO_CRIAS'] : null,
            'dificultadParto' => $r['DIFICULTAD_PARTO'],
            'resultado'       => $r['RESULTADO'],
        ];

        return $this->json([
            'proximos'  => array_map($mapProximo,  $proximos),
            'recientes' => array_map($mapReciente, $recientes),
            'resumen'   => [
                'gestantes'     => count($proximos),
                'proximos7dias' => count(array_filter($proximos, fn($r) => (int)$r['DIAS_RESTANTES'] <= 7)),
                'proximos30dias'=> count(array_filter($proximos, fn($r) => (int)$r['DIAS_RESTANTES'] <= 30)),
                'partosUltimos90'=> count($recientes),
            ],
        ]);
    }

    // ──────────────────────────────────────────────────────────────────
    //  REPRODUCCIÓN – desempeño de machos
    // ──────────────────────────────────────────────────────────────────

    #[Route('/reproduccion/machos', name: 'api_reportes_reproduccion_machos', methods: ['GET'])]
    public function reproduccionMachos(Request $request): JsonResponse
    {
        [$ini, $fin] = $this->rango($request, 365);

        $rows = $this->connection->fetchAllAssociative(
            "SELECT m.id_animal, m.codigo_identificacion, m.nombre, rz.nombre_raza,
                    COUNT(r.id_reproduccion)                          AS servicios,
                    SUM(CASE WHEN r.resultado='exitoso'  THEN 1 ELSE 0 END) AS exitosos,
                    SUM(CASE WHEN r.resultado='aborto'   THEN 1 ELSE 0 END) AS abortos,
                    SUM(CASE WHEN r.resultado='pendiente'THEN 1 ELSE 0 END) AS pendientes,
                    SUM(NVL(r.numero_crias,0))                        AS total_crias,
                    ROUND(SUM(CASE WHEN r.resultado='exitoso' THEN 1 ELSE 0 END)*100 /
                          NULLIF(COUNT(r.id_reproduccion)-SUM(CASE WHEN r.resultado='pendiente' THEN 1 ELSE 0 END),0),1) AS tasa
             FROM ANIMAL m
             JOIN REPRODUCCION r ON r.id_macho=m.id_animal
             JOIN RAZA rz ON m.id_raza=rz.id_raza
             WHERE m.sexo='macho'
               AND r.fecha_servicio BETWEEN TO_DATE(:ini,'YYYY-MM-DD') AND TO_DATE(:fin,'YYYY-MM-DD')
             GROUP BY m.id_animal, m.codigo_identificacion, m.nombre, rz.nombre_raza
             ORDER BY servicios DESC",
            ['ini' => $ini, 'fin' => $fin]
        );

        return $this->json([
            'data' => array_map(fn($r) => [
                'id'         => (int) $r['ID_ANIMAL'],
                'codigo'     => $r['CODIGO_IDENTIFICACION'],
                'nombre'     => $r['NOMBRE'],
                'raza'       => $r['NOMBRE_RAZA'],
                'servicios'  => (int) $r['SERVICIOS'],
                'exitosos'   => (int) $r['EXITOSOS'],
                'abortos'    => (int) $r['ABORTOS'],
                'pendientes' => (int) $r['PENDIENTES'],
                'totalCrias' => (int) $r['TOTAL_CRIAS'],
                'tasa'       => $r['TASA'] !== null ? (float) $r['TASA'] : null,
            ], $rows),
            'periodo' => ['inicio' => $ini, 'fin' => $fin],
        ]);
    }

    // ──────────────────────────────────────────────────────────────────
    //  SALUD – plan de vacunación
    // ──────────────────────────────────────────────────────────────────

    #[Route('/salud', name: 'api_reportes_salud', methods: ['GET'])]
    public function saludVacunacion(): JsonResponse
    {
        $vacunas = $this->connection->fetchAllAssociative(
            "SELECT s.id_registro, a.codigo_identificacion, a.nombre, rz.nombre_raza, a.estado AS estado_animal,
                    s.medicamento_producto AS vacuna,
                    TO_CHAR(s.fecha_aplicacion,'YYYY-MM-DD')        AS fecha_aplicacion,
                    TO_CHAR(s.fecha_proxima_aplicacion,'YYYY-MM-DD')AS fecha_proxima,
                    s.veterinario, s.dosis, s.via_administracion, s.observaciones,
                    TRUNC(s.fecha_proxima_aplicacion - SYSDATE)     AS dias_restantes,
                    CASE WHEN s.fecha_proxima_aplicacion IS NULL    THEN 'Sin próxima'
                         WHEN s.fecha_proxima_aplicacion < SYSDATE  THEN 'Vencida'
                         WHEN s.fecha_proxima_aplicacion <= SYSDATE+7  THEN 'Urgente'
                         WHEN s.fecha_proxima_aplicacion <= SYSDATE+30 THEN 'Próxima'
                         ELSE 'Programada' END AS estado_vacuna
             FROM SALUD s
             JOIN ANIMAL a  ON s.id_animal=a.id_animal
             JOIN RAZA   rz ON a.id_raza=rz.id_raza
             WHERE s.tipo_registro='vacuna'
             ORDER BY s.fecha_proxima_aplicacion NULLS LAST, s.fecha_aplicacion DESC"
        );

        $tratamientos = $this->connection->fetchAllAssociative(
            "SELECT s.id_registro, a.codigo_identificacion, a.nombre,
                    s.tipo_registro, s.enfermedad_diagnostico, s.medicamento_producto,
                    s.dosis, s.via_administracion, s.veterinario,
                    TO_CHAR(s.fecha_aplicacion,'YYYY-MM-DD') AS fecha_aplicacion,
                    s.dias_retiro_leche, s.dias_retiro_carne, s.observaciones
             FROM SALUD s
             JOIN ANIMAL a ON s.id_animal=a.id_animal
             WHERE s.tipo_registro IN ('tratamiento','desparasitacion')
             ORDER BY s.fecha_aplicacion DESC"
        );

        $vencidas  = count(array_filter($vacunas, fn($r) => $r['ESTADO_VACUNA'] === 'Vencida'));
        $urgentes  = count(array_filter($vacunas, fn($r) => $r['ESTADO_VACUNA'] === 'Urgente'));
        $proximas  = count(array_filter($vacunas, fn($r) => $r['ESTADO_VACUNA'] === 'Próxima'));
        $alDia     = count(array_filter($vacunas, fn($r) => $r['ESTADO_VACUNA'] === 'Programada'));

        return $this->json([
            'vacunas' => array_map(fn($r) => [
                'id'            => (int) $r['ID_REGISTRO'],
                'codigo'        => $r['CODIGO_IDENTIFICACION'],
                'nombre'        => $r['NOMBRE'],
                'raza'          => $r['NOMBRE_RAZA'],
                'estadoAnimal'  => $r['ESTADO_ANIMAL'],
                'vacuna'        => $r['VACUNA'],
                'fechaAplicacion'=> $r['FECHA_APLICACION'],
                'fechaProxima'  => $r['FECHA_PROXIMA'],
                'diasRestantes' => $r['DIAS_RESTANTES'] !== null ? (int) $r['DIAS_RESTANTES'] : null,
                'estadoVacuna'  => $r['ESTADO_VACUNA'],
                'veterinario'   => $r['VETERINARIO'],
                'dosis'         => $r['DOSIS'],
                'via'           => $r['VIA_ADMINISTRACION'],
            ], $vacunas),
            'tratamientos' => array_map(fn($r) => [
                'id'             => (int) $r['ID_REGISTRO'],
                'codigo'         => $r['CODIGO_IDENTIFICACION'],
                'nombre'         => $r['NOMBRE'],
                'tipo'           => $r['TIPO_REGISTRO'],
                'enfermedad'     => $r['ENFERMEDAD_DIAGNOSTICO'],
                'medicamento'    => $r['MEDICAMENTO_PRODUCTO'],
                'dosis'          => $r['DOSIS'],
                'via'            => $r['VIA_ADMINISTRACION'],
                'veterinario'    => $r['VETERINARIO'],
                'fechaAplicacion'=> $r['FECHA_APLICACION'],
                'diasRetiroLeche'=> $r['DIAS_RETIRO_LECHE'] !== null ? (int) $r['DIAS_RETIRO_LECHE'] : null,
                'diasRetiroCarne'=> $r['DIAS_RETIRO_CARNE'] !== null ? (int) $r['DIAS_RETIRO_CARNE'] : null,
            ], $tratamientos),
            'resumen' => [
                'totalVacunas'  => count($vacunas),
                'vencidas'      => $vencidas,
                'urgentes'      => $urgentes,
                'proximas'      => $proximas,
                'alDia'         => $alDia,
                'tratamientos'  => count($tratamientos),
            ],
        ]);
    }

    // ──────────────────────────────────────────────────────────────────
    //  SALUD – enfermedades frecuentes
    // ──────────────────────────────────────────────────────────────────

    #[Route('/salud/enfermedades', name: 'api_reportes_salud_enfermedades', methods: ['GET'])]
    public function saludEnfermedades(Request $request): JsonResponse
    {
        [$ini, $fin] = $this->rango($request, 365);

        $frecuentes = $this->connection->fetchAllAssociative(
            "SELECT NVL(s.enfermedad_diagnostico,'Sin diagnóstico') AS enfermedad,
                    COUNT(*)                       AS casos,
                    COUNT(DISTINCT s.id_animal)    AS animales_afectados,
                    s.tipo_registro
             FROM SALUD s
             WHERE s.tipo_registro IN ('diagnostico','tratamiento','cirugia')
               AND s.fecha_aplicacion BETWEEN TO_DATE(:ini,'YYYY-MM-DD') AND TO_DATE(:fin,'YYYY-MM-DD')
             GROUP BY s.enfermedad_diagnostico, s.tipo_registro
             ORDER BY casos DESC",
            ['ini' => $ini, 'fin' => $fin]
        );

        $detalle = $this->connection->fetchAllAssociative(
            "SELECT a.codigo_identificacion, a.nombre, rz.nombre_raza,
                    s.tipo_registro, s.enfermedad_diagnostico, s.medicamento_producto,
                    s.dosis, s.veterinario,
                    TO_CHAR(s.fecha_aplicacion,'YYYY-MM-DD') AS fecha,
                    s.observaciones
             FROM SALUD s
             JOIN ANIMAL a  ON s.id_animal=a.id_animal
             JOIN RAZA   rz ON a.id_raza=rz.id_raza
             WHERE s.tipo_registro IN ('diagnostico','tratamiento','cirugia')
               AND s.fecha_aplicacion BETWEEN TO_DATE(:ini,'YYYY-MM-DD') AND TO_DATE(:fin,'YYYY-MM-DD')
             ORDER BY s.fecha_aplicacion DESC",
            ['ini' => $ini, 'fin' => $fin]
        );

        return $this->json([
            'frecuentes' => array_map(fn($r) => [
                'enfermedad'       => $r['ENFERMEDAD'],
                'casos'            => (int) $r['CASOS'],
                'animalesAfectados'=> (int) $r['ANIMALES_AFECTADOS'],
                'tipo'             => $r['TIPO_REGISTRO'],
            ], $frecuentes),
            'detalle' => array_map(fn($r) => [
                'codigo'     => $r['CODIGO_IDENTIFICACION'],
                'nombre'     => $r['NOMBRE'],
                'raza'       => $r['NOMBRE_RAZA'],
                'tipo'       => $r['TIPO_REGISTRO'],
                'enfermedad' => $r['ENFERMEDAD_DIAGNOSTICO'],
                'medicamento'=> $r['MEDICAMENTO_PRODUCTO'],
                'dosis'      => $r['DOSIS'],
                'veterinario'=> $r['VETERINARIO'],
                'fecha'      => $r['FECHA'],
            ], $detalle),
            'resumen' => [
                'totalCasos'    => count($detalle),
                'tiposDistintos'=> count(array_unique(array_column($frecuentes, 'ENFERMEDAD'))),
                'animalesAfectados' => count(array_unique(array_column($detalle, 'codigo'))),
            ],
            'periodo' => ['inicio' => $ini, 'fin' => $fin],
        ]);
    }

    // ──────────────────────────────────────────────────────────────────
    //  PESO – evolución y condición corporal
    // ──────────────────────────────────────────────────────────────────

    #[Route('/peso', name: 'api_reportes_peso', methods: ['GET'])]
    public function peso(Request $request): JsonResponse
    {
        [$ini, $fin] = $this->rango($request, 180);

        $detalle = $this->connection->fetchAllAssociative(
            "SELECT a.id_animal, a.codigo_identificacion, a.nombre, a.sexo,
                    rz.nombre_raza,
                    TO_CHAR(p.fecha_pesaje,'YYYY-MM-DD') AS fecha_pesaje,
                    p.peso_kg, p.edad_dias, p.ganancia_diaria_kg,
                    p.condicion_corporal, p.metodo_pesaje, p.observaciones
             FROM PESAJE p
             JOIN ANIMAL a  ON p.id_animal=a.id_animal
             JOIN RAZA   rz ON a.id_raza=rz.id_raza
             WHERE p.fecha_pesaje BETWEEN TO_DATE(:ini,'YYYY-MM-DD') AND TO_DATE(:fin,'YYYY-MM-DD')
             ORDER BY a.codigo_identificacion, p.fecha_pesaje DESC",
            ['ini' => $ini, 'fin' => $fin]
        );

        $porAnimal = $this->connection->fetchAllAssociative(
            "SELECT a.id_animal, a.codigo_identificacion, a.nombre, a.sexo, rz.nombre_raza,
                    COUNT(p.id_pesaje)              AS pesajes,
                    ROUND(MIN(p.peso_kg),2)         AS peso_min,
                    ROUND(MAX(p.peso_kg),2)         AS peso_max,
                    ROUND(AVG(p.peso_kg),2)         AS peso_promedio,
                    ROUND(AVG(p.ganancia_diaria_kg),3) AS ganancia_promedio,
                    ROUND(AVG(p.condicion_corporal),1)  AS cc_promedio
             FROM PESAJE p
             JOIN ANIMAL a  ON p.id_animal=a.id_animal
             JOIN RAZA   rz ON a.id_raza=rz.id_raza
             WHERE p.fecha_pesaje BETWEEN TO_DATE(:ini,'YYYY-MM-DD') AND TO_DATE(:fin,'YYYY-MM-DD')
             GROUP BY a.id_animal, a.codigo_identificacion, a.nombre, a.sexo, rz.nombre_raza
             ORDER BY peso_promedio DESC",
            ['ini' => $ini, 'fin' => $fin]
        );

        $pesos = array_column($detalle, 'PESO_KG');
        $ganancias = array_filter(array_column($detalle, 'GANANCIA_DIARIA_KG'));
        $ccs = array_filter(array_column($detalle, 'CONDICION_CORPORAL'));

        return $this->json([
            'detalle' => array_map(fn($r) => [
                'id'              => (int) $r['ID_ANIMAL'],
                'codigo'          => $r['CODIGO_IDENTIFICACION'],
                'nombre'          => $r['NOMBRE'],
                'sexo'            => $r['SEXO'],
                'raza'            => $r['NOMBRE_RAZA'],
                'fechaPesaje'     => $r['FECHA_PESAJE'],
                'pesoKg'          => (float) $r['PESO_KG'],
                'edadDias'        => $r['EDAD_DIAS'] !== null ? (int) $r['EDAD_DIAS'] : null,
                'gananciaDiaria'  => $r['GANANCIA_DIARIA_KG'] !== null ? (float) $r['GANANCIA_DIARIA_KG'] : null,
                'condicionCorporal'=> $r['CONDICION_CORPORAL'] !== null ? (int) $r['CONDICION_CORPORAL'] : null,
                'metodoPesaje'    => $r['METODO_PESAJE'],
            ], $detalle),
            'porAnimal' => array_map(fn($r) => [
                'id'             => (int) $r['ID_ANIMAL'],
                'codigo'         => $r['CODIGO_IDENTIFICACION'],
                'nombre'         => $r['NOMBRE'],
                'sexo'           => $r['SEXO'],
                'raza'           => $r['NOMBRE_RAZA'],
                'pesajes'        => (int)   $r['PESAJES'],
                'pesoMin'        => (float) $r['PESO_MIN'],
                'pesoMax'        => (float) $r['PESO_MAX'],
                'pesoPromedio'   => (float) $r['PESO_PROMEDIO'],
                'gananciaProm'   => $r['GANANCIA_PROMEDIO'] !== null ? (float) $r['GANANCIA_PROMEDIO'] : null,
                'ccPromedio'     => $r['CC_PROMEDIO']       !== null ? (float) $r['CC_PROMEDIO']       : null,
            ], $porAnimal),
            'resumen' => [
                'totalPesajes'  => count($detalle),
                'pesoPromedio'  => count($pesos)    ? round(array_sum($pesos)    / count($pesos), 2)    : 0,
                'gananciaProm'  => count($ganancias) ? round(array_sum($ganancias) / count($ganancias), 3) : 0,
                'ccPromedio'    => count($ccs)       ? round(array_sum($ccs)       / count($ccs), 1)      : 0,
                'animalesPesados'=> count($porAnimal),
            ],
            'periodo' => ['inicio' => $ini, 'fin' => $fin],
        ]);
    }

    // ──────────────────────────────────────────────────────────────────
    //  INVENTARIO – censo general del rebaño
    // ──────────────────────────────────────────────────────────────────

    #[Route('/inventario', name: 'api_reportes_inventario', methods: ['GET'])]
    public function inventario(): JsonResponse
    {
        $porRazaSexo = $this->connection->fetchAllAssociative(
            "SELECT rz.nombre_raza, a.sexo, a.estado,
                    COUNT(*) AS total,
                    ROUND(AVG(SYSDATE - a.fecha_nacimiento)/365, 1) AS edad_prom_anos
             FROM ANIMAL a
             JOIN RAZA rz ON a.id_raza=rz.id_raza
             GROUP BY rz.nombre_raza, a.sexo, a.estado
             ORDER BY rz.nombre_raza, a.sexo, a.estado"
        );

        $pirEdades = $this->connection->fetchAllAssociative(
            "SELECT CASE
                      WHEN SYSDATE - fecha_nacimiento < 182  THEN '0-6 meses'
                      WHEN SYSDATE - fecha_nacimiento < 365  THEN '6-12 meses'
                      WHEN SYSDATE - fecha_nacimiento < 730  THEN '1-2 años'
                      ELSE 'Más de 2 años'
                    END AS rango_edad,
                    sexo,
                    COUNT(*) AS total
             FROM ANIMAL
             WHERE estado = 'activo'
             GROUP BY
               CASE WHEN SYSDATE-fecha_nacimiento<182 THEN '0-6 meses'
                    WHEN SYSDATE-fecha_nacimiento<365 THEN '6-12 meses'
                    WHEN SYSDATE-fecha_nacimiento<730 THEN '1-2 años'
                    ELSE 'Más de 2 años' END,
               sexo
             ORDER BY MIN(SYSDATE-fecha_nacimiento)"
        );

        $todos = $this->connection->fetchAllAssociative(
            "SELECT a.id_animal, a.codigo_identificacion, a.nombre, a.sexo, a.estado,
                    rz.nombre_raza, a.color_pelaje,
                    TO_CHAR(a.fecha_nacimiento,'YYYY-MM-DD') AS fecha_nacimiento,
                    ROUND((SYSDATE - a.fecha_nacimiento)/365, 1) AS edad_anos,
                    a.observaciones
             FROM ANIMAL a
             JOIN RAZA rz ON a.id_raza=rz.id_raza
             ORDER BY rz.nombre_raza, a.sexo, a.codigo_identificacion"
        );

        $activos = array_filter($todos, fn($r) => $r['ESTADO'] === 'activo');

        return $this->json([
            'censo' => array_map(fn($r) => [
                'id'            => (int) $r['ID_ANIMAL'],
                'codigo'        => $r['CODIGO_IDENTIFICACION'],
                'nombre'        => $r['NOMBRE'],
                'sexo'          => $r['SEXO'],
                'estado'        => $r['ESTADO'],
                'raza'          => $r['NOMBRE_RAZA'],
                'colorPelaje'   => $r['COLOR_PELAJE'],
                'fechaNacimiento'=> $r['FECHA_NACIMIENTO'],
                'edadAnos'      => $r['EDAD_ANOS'] !== null ? (float) $r['EDAD_ANOS'] : null,
            ], $todos),
            'porRazaSexo' => array_map(fn($r) => [
                'raza'       => $r['NOMBRE_RAZA'],
                'sexo'       => $r['SEXO'],
                'estado'     => $r['ESTADO'],
                'total'      => (int)   $r['TOTAL'],
                'edadPromAnos'=> $r['EDAD_PROM_ANOS'] !== null ? (float) $r['EDAD_PROM_ANOS'] : null,
            ], $porRazaSexo),
            'pirEdades' => array_map(fn($r) => [
                'rangoEdad' => $r['RANGO_EDAD'],
                'sexo'      => $r['SEXO'],
                'total'     => (int) $r['TOTAL'],
            ], $pirEdades),
            'resumen' => [
                'total'    => count($todos),
                'activos'  => count($activos),
                'hembras'  => count(array_filter($activos, fn($r) => $r['SEXO'] === 'hembra')),
                'machos'   => count(array_filter($activos, fn($r) => $r['SEXO'] === 'macho')),
                'razasDistintas' => count(array_unique(array_column($todos, 'NOMBRE_RAZA'))),
            ],
        ]);
    }

    // ──────────────────────────────────────────────────────────────────
    //  AUDITORÍA – actividad del sistema
    // ──────────────────────────────────────────────────────────────────

    #[Route('/auditoria', name: 'api_reportes_auditoria', methods: ['GET'])]
    public function auditoria(Request $request): JsonResponse
    {
        [$ini, $fin] = $this->rango($request, 30);

        $rows = $this->connection->fetchAllAssociative(
            "SELECT a.tabla, a.operacion, a.id_registro,
                    TO_CHAR(a.fecha_operacion,'YYYY-MM-DD HH24:MI:SS') AS fecha,
                    a.ip_origen,
                    u.nombre_completo AS usuario, u.rol
             FROM AUDITORIA a
             LEFT JOIN USUARIO u ON a.id_usuario=u.id_usuario
             WHERE a.fecha_operacion BETWEEN TO_DATE(:ini,'YYYY-MM-DD') AND TO_DATE(:fin,'YYYY-MM-DD')+1
             ORDER BY a.fecha_operacion DESC
             FETCH FIRST 500 ROWS ONLY",
            ['ini' => $ini, 'fin' => $fin]
        );

        $porTabla = [];
        foreach ($rows as $r) {
            $porTabla[$r['TABLA']] = ($porTabla[$r['TABLA']] ?? 0) + 1;
        }
        arsort($porTabla);

        return $this->json([
            'data' => array_map(fn($r) => [
                'tabla'     => $r['TABLA'],
                'operacion' => $r['OPERACION'],
                'idRegistro'=> $r['ID_REGISTRO'] !== null ? (int) $r['ID_REGISTRO'] : null,
                'fecha'     => $r['FECHA'],
                'ip'        => $r['IP_ORIGEN'],
                'usuario'   => $r['USUARIO'],
                'rol'       => $r['ROL'],
            ], $rows),
            'porTabla' => array_map(
                fn($tabla, $total) => ['tabla' => $tabla, 'total' => $total],
                array_keys($porTabla), array_values($porTabla)
            ),
            'resumen' => [
                'total'      => count($rows),
                'inserts'    => count(array_filter($rows, fn($r) => $r['OPERACION'] === 'INSERT')),
                'updates'    => count(array_filter($rows, fn($r) => $r['OPERACION'] === 'UPDATE')),
                'deletes'    => count(array_filter($rows, fn($r) => $r['OPERACION'] === 'DELETE')),
            ],
            'periodo' => ['inicio' => $ini, 'fin' => $fin],
        ]);
    }

    // ──────────────────────────────────────────────────────────────────
    //  Helper: rango de fechas por defecto
    // ──────────────────────────────────────────────────────────────────

    private function rango(Request $request, int $diasDefault): array
    {
        $fin = $request->query->get('fechaFin')    ?: date('Y-m-d');
        $ini = $request->query->get('fechaInicio') ?: date('Y-m-d', strtotime("-{$diasDefault} days"));
        return [$ini, $fin];
    }
}
