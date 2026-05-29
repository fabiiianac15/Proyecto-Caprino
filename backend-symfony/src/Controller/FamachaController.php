<?php

namespace App\Controller;

use App\Entity\User;
use App\Service\AuditoriaService;
use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/famacha')]
class FamachaController extends AbstractController
{
    public function __construct(
        private Connection $connection,
        private AuditoriaService $auditoria,
    ) {}

    #[Route('', name: 'api_famacha_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $animalId = $request->query->get('idAnimal');

        $sql = "SELECT f.id_registro, f.id_animal, a.nombre AS nombre_animal,
                       a.codigo_identificacion, f.fecha_evaluacion, f.puntuacion,
                       f.ojo_evaluado, f.tratamiento_aplicado, f.medicamento,
                       f.proxima_evaluacion, f.observaciones
                FROM FAMACHA f JOIN ANIMAL a ON f.id_animal = a.id_animal";
        $params = [];

        if ($animalId) {
            $sql .= ' WHERE f.id_animal = :animalId';
            $params['animalId'] = (int) $animalId;
        }

        $sql .= ' ORDER BY f.fecha_evaluacion DESC';

        $rows = $this->connection->fetchAllAssociative($sql, $params);

        $data = array_map(fn($row) => [
            'id'                  => (int) $row['ID_REGISTRO'],
            'idAnimal'            => (int) $row['ID_ANIMAL'],
            'nombreAnimal'        => $row['NOMBRE_ANIMAL'],
            'codigoAnimal'        => $row['CODIGO_IDENTIFICACION'],
            'fechaEvaluacion'     => $row['FECHA_EVALUACION'],
            'puntuacion'          => (int) $row['PUNTUACION'],
            'ojoEvaluado'         => $row['OJO_EVALUADO'],
            'tratamientoAplicado' => (bool) $row['TRATAMIENTO_APLICADO'],
            'medicamento'         => $row['MEDICAMENTO'],
            'proximaEvaluacion'   => $row['PROXIMA_EVALUACION'],
            'observaciones'       => $row['OBSERVACIONES'],
        ], $rows);

        return $this->json(['data' => $data, 'total' => count($data)]);
    }

    #[Route('', name: 'api_famacha_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data        = json_decode($request->getContent(), true) ?? [];
        $idAnimal    = $data['idAnimal']          ?? null;
        $fechaEval   = $data['fechaEvaluacion']   ?? date('Y-m-d');
        $puntuacion  = $data['puntuacion']         ?? null;
        $ojo         = $data['ojoEvaluado']        ?? 'ambos';
        $tratamiento = isset($data['tratamientoAplicado']) ? ($data['tratamientoAplicado'] ? 1 : 0) : 0;
        $medicamento = $data['medicamento']        ?? null;
        $proximaEval = $data['proximaEvaluacion']  ?? null;
        $obs         = $data['observaciones']      ?? null;

        if (!$idAnimal || $puntuacion === null) {
            return $this->json(['error' => 'Campos requeridos: idAnimal, puntuacion'], Response::HTTP_BAD_REQUEST);
        }

        if (!in_array((int) $puntuacion, [1, 2, 3, 4, 5])) {
            return $this->json(['error' => 'puntuacion debe ser un valor entre 1 y 5'], Response::HTTP_BAD_REQUEST);
        }

        $user = $this->getUser();
        $uReg = $user instanceof User ? $user->getId() : 1;

        try {
            $this->connection->executeStatement(
                "INSERT INTO FAMACHA (id_animal, fecha_evaluacion, puntuacion, ojo_evaluado,
                   tratamiento_aplicado, medicamento, proxima_evaluacion, observaciones, usuario_registro)
                 VALUES (:id, TO_DATE(:fec, 'YYYY-MM-DD'), :pun, :ojo, :trat, :med,
                   CASE WHEN :fp IS NOT NULL THEN TO_DATE(:fp, 'YYYY-MM-DD') ELSE NULL END,
                   :obs, :ur)",
                [
                    'id'   => $idAnimal,
                    'fec'  => $fechaEval,
                    'pun'  => (int) $puntuacion,
                    'ojo'  => $ojo,
                    'trat' => $tratamiento,
                    'med'  => $medicamento,
                    'fp'   => $proximaEval,
                    'obs'  => $obs,
                    'ur'   => $uReg,
                ]
            );
        } catch (\Doctrine\DBAL\Exception $e) {
            $msg = $e->getPrevious()?->getMessage() ?? $e->getMessage();
            preg_match('/ORA-\d+:\s*(.*?)(?:\nORA-|\z)/s', $msg, $m);
            return $this->json(['error' => trim($m[1] ?? $msg)], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            $this->auditoria->registrar(
                tabla: 'FAMACHA',
                operacion: 'CREAR',
                idRegistro: null,
                descripcion: "Evaluación FAMACHA score {$puntuacion} para animal ID {$idAnimal}",
                datosNuevos: $data,
            );
        } catch (\Throwable) {}

        return $this->json(['success' => true, 'message' => 'Evaluación FAMACHA registrada'], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_famacha_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $data        = json_decode($request->getContent(), true) ?? [];
        $puntuacion  = $data['puntuacion']         ?? null;
        $ojo         = $data['ojoEvaluado']        ?? null;
        $tratamiento = isset($data['tratamientoAplicado']) ? ($data['tratamientoAplicado'] ? 1 : 0) : null;
        $medicamento = $data['medicamento']        ?? null;
        $proximaEval = $data['proximaEvaluacion']  ?? null;
        $obs         = $data['observaciones']      ?? null;

        if ($puntuacion !== null && !in_array((int) $puntuacion, [1, 2, 3, 4, 5])) {
            return $this->json(['error' => 'puntuacion debe ser un valor entre 1 y 5'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $sets = "puntuacion = NVL(:pun, puntuacion),
                     ojo_evaluado = NVL(:ojo, ojo_evaluado),
                     medicamento = NVL(:med, medicamento),
                     observaciones = NVL(:obs, observaciones)";
            $params = [
                'pun' => $puntuacion !== null ? (int) $puntuacion : null,
                'ojo' => $ojo,
                'med' => $medicamento,
                'obs' => $obs,
                'id'  => $id,
            ];

            if ($tratamiento !== null) {
                $sets .= ', tratamiento_aplicado = :trat';
                $params['trat'] = $tratamiento;
            }
            if ($proximaEval !== null) {
                $sets .= ', proxima_evaluacion = CASE WHEN :fp IS NOT NULL THEN TO_DATE(:fp, \'YYYY-MM-DD\') ELSE NULL END';
                $params['fp'] = $proximaEval;
            }

            $this->connection->executeStatement(
                "UPDATE FAMACHA SET {$sets} WHERE id_registro = :id",
                $params
            );
        } catch (\Throwable) {
            return $this->json(['error' => 'Error al actualizar la evaluación.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->json(['success' => true, 'message' => 'Evaluación actualizada']);
    }

    #[Route('/{id}', name: 'api_famacha_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        try {
            $this->connection->executeStatement(
                'DELETE FROM FAMACHA WHERE id_registro = :id',
                ['id' => $id]
            );
        } catch (\Throwable) {
            return $this->json(['error' => 'Error al eliminar la evaluación.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->json(['success' => true, 'message' => 'Evaluación eliminada']);
    }
}
