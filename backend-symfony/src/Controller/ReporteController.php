<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Service\InformeService;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/reportes')]
class ReporteController extends AbstractController
{
    public function __construct(private Connection $connection, private InformeService $informes) {}

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
    //  PANEL: indicadores y gráficos generales del periodo
    // ──────────────────────────────────────────────────────────────────

    #[Route('/panel', name: 'api_reportes_panel', methods: ['GET'])]
    public function panel(Request $request): JsonResponse
    {
        [$desde, $hasta] = $this->periodo($request);
        return $this->json(['data' => $this->informes->resumen($desde, $hasta)]);
    }

    // ──────────────────────────────────────────────────────────────────
    //  INFORME: todos devuelven la misma estructura (ver InformeService)
    // ──────────────────────────────────────────────────────────────────

    #[Route('/informe/{clave}', name: 'api_reportes_informe', methods: ['GET'], requirements: ['clave' => '[a-z\-]+'])]
    public function informe(string $clave, Request $request): JsonResponse
    {
        if (!$this->informes->existe($clave)) {
            return $this->json(['error' => 'Ese informe no existe'], Response::HTTP_NOT_FOUND);
        }
        [$desde, $hasta] = $this->periodo($request);
        return $this->json(['data' => $this->informes->generar($clave, $desde, $hasta)]);
    }

    /** Periodo pedido (desde, hasta). Por defecto, los últimos 12 meses. */
    private function periodo(Request $request): array
    {
        $valida = fn($v) => is_string($v) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $v) && strtotime($v) !== false;
        $hasta = $request->query->get('hasta');
        $desde = $request->query->get('desde');
        $hasta = $valida($hasta) ? $hasta : date('Y-m-d');
        $desde = $valida($desde) ? $desde : date('Y-m-d', strtotime('-12 months', strtotime($hasta)));
        if ($desde > $hasta) {
            [$desde, $hasta] = [$hasta, $desde];
        }
        return [$desde, $hasta];
    }
}
