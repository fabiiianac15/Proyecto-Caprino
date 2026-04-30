<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/notificaciones')]
class NotificacionController extends AbstractController
{
    public function __construct(private Connection $connection) {}

    #[Route('', name: 'api_notificaciones', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $alertas = [];

        // Vacunas próximas (15 días)
        $rows = $this->connection->fetchAllAssociative(
            "SELECT 'vacuna' as tipo,
                    'Vacuna próxima' as titulo,
                    'El animal ' || a.nombre || ' (' || a.codigo_identificacion || ') tiene aplicación programada para el ' ||
                    TO_CHAR(s.fecha_proxima_aplicacion, 'DD/MM/YYYY') as mensaje,
                    TO_CHAR(s.fecha_proxima_aplicacion, 'YYYY-MM-DD') as fecha_alerta,
                    a.id_animal, 'media' as urgencia
             FROM SALUD s JOIN ANIMAL a ON s.id_animal = a.id_animal
             WHERE s.fecha_proxima_aplicacion BETWEEN SYSDATE AND SYSDATE + 15
             ORDER BY s.fecha_proxima_aplicacion"
        );
        foreach ($rows as $row) {
            $alertas[] = [
                'tipo'        => $row['TIPO'],
                'titulo'      => $row['TITULO'],
                'mensaje'     => $row['MENSAJE'],
                'fechaAlerta' => $row['FECHA_ALERTA'],
                'idAnimal'    => (int) $row['ID_ANIMAL'],
                'urgencia'    => $row['URGENCIA'],
            ];
        }

        // Partos estimados próximos (15 días)
        $rows = $this->connection->fetchAllAssociative(
            "SELECT 'parto' as tipo,
                    'Parto próximo' as titulo,
                    'La cabra ' || a.nombre || ' (' || a.codigo_identificacion || ') tiene parto estimado para el ' ||
                    TO_CHAR(r.fecha_parto_estimada, 'DD/MM/YYYY') as mensaje,
                    TO_CHAR(r.fecha_parto_estimada, 'YYYY-MM-DD') as fecha_alerta,
                    a.id_animal, 'alta' as urgencia
             FROM REPRODUCCION r JOIN ANIMAL a ON r.id_hembra = a.id_animal
             WHERE r.fecha_parto_estimada BETWEEN SYSDATE AND SYSDATE + 15
               AND r.resultado = 'pendiente'
             ORDER BY r.fecha_parto_estimada"
        );
        foreach ($rows as $row) {
            $alertas[] = [
                'tipo'        => $row['TIPO'],
                'titulo'      => $row['TITULO'],
                'mensaje'     => $row['MENSAJE'],
                'fechaAlerta' => $row['FECHA_ALERTA'],
                'idAnimal'    => (int) $row['ID_ANIMAL'],
                'urgencia'    => $row['URGENCIA'],
            ];
        }

        // Aplicaciones vencidas sin seguimiento
        $rows = $this->connection->fetchAllAssociative(
            "SELECT 'vencido' as tipo,
                    'Aplicación vencida' as titulo,
                    'El animal ' || a.nombre || ' tenía aplicación el ' ||
                    TO_CHAR(s.fecha_proxima_aplicacion, 'DD/MM/YYYY') || ' sin registrar' as mensaje,
                    TO_CHAR(s.fecha_proxima_aplicacion, 'YYYY-MM-DD') as fecha_alerta,
                    a.id_animal, 'alta' as urgencia
             FROM SALUD s JOIN ANIMAL a ON s.id_animal = a.id_animal
             WHERE s.fecha_proxima_aplicacion < SYSDATE
               AND NOT EXISTS (
                   SELECT 1 FROM SALUD s2
                   WHERE s2.id_animal = s.id_animal
                     AND s2.fecha_aplicacion >= s.fecha_proxima_aplicacion
               )
             ORDER BY s.fecha_proxima_aplicacion DESC
             FETCH FIRST 20 ROWS ONLY"
        );
        foreach ($rows as $row) {
            $alertas[] = [
                'tipo'        => $row['TIPO'],
                'titulo'      => $row['TITULO'],
                'mensaje'     => $row['MENSAJE'],
                'fechaAlerta' => $row['FECHA_ALERTA'],
                'idAnimal'    => (int) $row['ID_ANIMAL'],
                'urgencia'    => $row['URGENCIA'],
            ];
        }

        return $this->json(['data' => $alertas, 'total' => count($alertas)]);
    }
}
