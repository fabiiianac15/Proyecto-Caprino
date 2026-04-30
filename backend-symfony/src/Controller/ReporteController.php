<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/reportes')]
class ReporteController extends AbstractController
{
    public function __construct(private Connection $connection) {}

    #[Route('/resumen', name: 'api_reportes_resumen', methods: ['GET'])]
    public function resumen(): JsonResponse
    {
        $stats = [];

        $stats['totalAnimales'] = (int) $this->connection->fetchOne(
            "SELECT COUNT(*) FROM ANIMAL WHERE estado = 'activo'"
        );

        $stats['totalHembras'] = (int) $this->connection->fetchOne(
            "SELECT COUNT(*) FROM ANIMAL WHERE sexo = 'hembra' AND estado = 'activo'"
        );

        $stats['totalMachos'] = (int) $this->connection->fetchOne(
            "SELECT COUNT(*) FROM ANIMAL WHERE sexo = 'macho' AND estado = 'activo'"
        );

        $stats['produccionLitrosMes'] = (float) $this->connection->fetchOne(
            "SELECT NVL(SUM(litros), 0) FROM PRODUCCION_LECHE
             WHERE EXTRACT(MONTH FROM fecha_produccion) = EXTRACT(MONTH FROM SYSDATE)
               AND EXTRACT(YEAR FROM fecha_produccion) = EXTRACT(YEAR FROM SYSDATE)"
        );

        $stats['gestacionesPendientes'] = (int) $this->connection->fetchOne(
            "SELECT COUNT(*) FROM REPRODUCCION WHERE resultado = 'pendiente'"
        );

        $stats['vacunasMes'] = (int) $this->connection->fetchOne(
            "SELECT COUNT(*) FROM SALUD
             WHERE tipo_registro = 'vacuna'
               AND EXTRACT(MONTH FROM fecha_aplicacion) = EXTRACT(MONTH FROM SYSDATE)"
        );

        $stats['alertasPendientes'] = (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM SALUD WHERE fecha_proxima_aplicacion BETWEEN SYSDATE AND SYSDATE + 15'
        );

        return $this->json(['data' => $stats]);
    }

    #[Route('/produccion', name: 'api_reportes_produccion', methods: ['GET'])]
    public function produccion(): JsonResponse
    {
        $rows = $this->connection->fetchAllAssociative(
            "SELECT TO_CHAR(fecha_produccion, 'YYYY-MM') as mes,
                    SUM(litros) as total_litros,
                    COUNT(*) as registros,
                    COUNT(DISTINCT id_animal) as animales
             FROM PRODUCCION_LECHE
             WHERE fecha_produccion >= ADD_MONTHS(SYSDATE, -12)
             GROUP BY TO_CHAR(fecha_produccion, 'YYYY-MM')
             ORDER BY mes"
        );

        $data = array_map(fn($row) => [
            'mes'         => $row['MES'],
            'totalLitros' => (float) $row['TOTAL_LITROS'],
            'registros'   => (int) $row['REGISTROS'],
            'animales'    => (int) $row['ANIMALES'],
        ], $rows);

        return $this->json(['data' => $data]);
    }
}
