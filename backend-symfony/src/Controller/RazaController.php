<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api')]
class RazaController extends AbstractController
{
    public function __construct(private Connection $connection) {}

    #[Route('/razas', name: 'api_razas', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $rows = $this->connection->fetchAllAssociative(
            "SELECT id_raza, nombre_raza, origen, caracteristicas, aptitud FROM RAZA WHERE estado = 'activo' ORDER BY nombre_raza"
        );

        $data = array_map(fn($row) => [
            'id_raza'        => (int) $row['ID_RAZA'],
            'nombre_raza'    => $row['NOMBRE_RAZA'],
            'origen'         => $row['ORIGEN'],
            'caracteristicas'=> $row['CARACTERISTICAS'],
            'aptitud'        => $row['APTITUD'],
        ], $rows);

        return $this->json(['data' => $data]);
    }
}
