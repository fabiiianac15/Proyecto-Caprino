<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/genealogia')]
class GenealogiaController extends AbstractController
{
    public function __construct(private Connection $connection) {}

    #[Route('/{id}', name: 'api_genealogia_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): JsonResponse
    {
        $row = $this->connection->fetchAssociative(
            "SELECT g.id_genealogia, g.id_animal, g.id_padre, g.id_madre,
                    g.generacion, g.coeficiente_consanguinidad, g.observaciones,
                    a.nombre as nombre_animal, a.codigo_identificacion,
                    p.nombre as nombre_padre, p.codigo_identificacion as codigo_padre,
                    m.nombre as nombre_madre, m.codigo_identificacion as codigo_madre
             FROM GENEALOGIA g
             JOIN ANIMAL a ON g.id_animal = a.id_animal
             LEFT JOIN ANIMAL p ON g.id_padre = p.id_animal
             LEFT JOIN ANIMAL m ON g.id_madre = m.id_animal
             WHERE g.id_animal = :id",
            ['id' => $id]
        );

        if (!$row) {
            $animal = $this->connection->fetchAssociative(
                'SELECT nombre, codigo_identificacion FROM ANIMAL WHERE id_animal = :id',
                ['id' => $id]
            );

            return $this->json(['data' => [
                'animal' => $animal ? ['id' => $id, 'nombre' => $animal['NOMBRE'], 'codigo' => $animal['CODIGO_IDENTIFICACION']] : null,
                'padre'  => null,
                'madre'  => null,
            ]]);
        }

        return $this->json(['data' => [
            'animal' => ['id' => $id, 'nombre' => $row['NOMBRE_ANIMAL'], 'codigo' => $row['CODIGO_IDENTIFICACION']],
            'padre'  => $row['ID_PADRE'] !== null ? ['id' => (int) $row['ID_PADRE'], 'nombre' => $row['NOMBRE_PADRE'], 'codigo' => $row['CODIGO_PADRE']] : null,
            'madre'  => $row['ID_MADRE'] !== null ? ['id' => (int) $row['ID_MADRE'], 'nombre' => $row['NOMBRE_MADRE'], 'codigo' => $row['CODIGO_MADRE']] : null,
            'generacion'                => $row['GENERACION'] !== null ? (int) $row['GENERACION'] : null,
            'coeficienteConsanguinidad' => $row['COEFICIENTE_CONSANGUINIDAD'] !== null ? (float) $row['COEFICIENTE_CONSANGUINIDAD'] : null,
        ]]);
    }

    #[Route('', name: 'api_genealogia_upsert', methods: ['POST'])]
    public function upsert(Request $request): JsonResponse
    {
        $data     = json_decode($request->getContent(), true) ?? [];
        $idAnimal = $data['idAnimal'] ?? null;
        $idPadre  = $data['idPadre'] ?? null;
        $idMadre  = $data['idMadre'] ?? null;
        $obs      = $data['observaciones'] ?? null;

        if (!$idAnimal) {
            return $this->json(['error' => 'Campo requerido: idAnimal'], Response::HTTP_BAD_REQUEST);
        }

        $count = (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM GENEALOGIA WHERE id_animal = :id',
            ['id' => $idAnimal]
        );

        if ($count > 0) {
            $this->connection->executeStatement(
                'UPDATE GENEALOGIA SET id_padre = :p, id_madre = :m, observaciones = NVL(:obs, observaciones) WHERE id_animal = :id',
                ['p' => $idPadre, 'm' => $idMadre, 'obs' => $obs, 'id' => $idAnimal]
            );
        } else {
            $this->connection->executeStatement(
                'INSERT INTO GENEALOGIA (id_animal, id_padre, id_madre, observaciones) VALUES (:id, :p, :m, :obs)',
                ['id' => $idAnimal, 'p' => $idPadre, 'm' => $idMadre, 'obs' => $obs]
            );
        }

        return $this->json(['success' => true, 'message' => 'Genealogía actualizada']);
    }
}
