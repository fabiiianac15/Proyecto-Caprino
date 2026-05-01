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

#[Route('/api/pesaje')]
class PesajeController extends AbstractController
{
    public function __construct(
        private Connection $connection,
        private AuditoriaService $auditoria,
    ) {}

    #[Route('', name: 'api_pesaje_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $animalId = $request->query->get('animal');
        $sql = "SELECT p.id_pesaje, p.id_animal, a.nombre as nombre_animal,
                       a.codigo_identificacion, p.fecha_pesaje, p.peso_kg,
                       p.edad_dias, p.ganancia_diaria_kg, p.condicion_corporal,
                       p.metodo_pesaje, p.observaciones
                FROM PESAJE p JOIN ANIMAL a ON p.id_animal = a.id_animal";
        $params = [];

        if ($animalId) {
            $sql .= ' WHERE p.id_animal = :animalId';
            $params['animalId'] = (int) $animalId;
        }

        $sql .= ' ORDER BY p.fecha_pesaje DESC';

        $rows = $this->connection->fetchAllAssociative($sql, $params);

        $data = array_map(fn($row) => [
            'id'               => (int) $row['ID_PESAJE'],
            'idAnimal'         => (int) $row['ID_ANIMAL'],
            'nombreAnimal'     => $row['NOMBRE_ANIMAL'],
            'codigoAnimal'     => $row['CODIGO_IDENTIFICACION'],
            'fechaPesaje'      => $row['FECHA_PESAJE'],
            'pesoKg'           => (float) $row['PESO_KG'],
            'edadDias'         => $row['EDAD_DIAS'] !== null ? (int) $row['EDAD_DIAS'] : null,
            'gananciaDiariaKg' => $row['GANANCIA_DIARIA_KG'] !== null ? (float) $row['GANANCIA_DIARIA_KG'] : null,
            'condicionCorporal'=> $row['CONDICION_CORPORAL'] !== null ? (int) $row['CONDICION_CORPORAL'] : null,
            'metodoPesaje'     => $row['METODO_PESAJE'],
            'observaciones'    => $row['OBSERVACIONES'],
        ], $rows);

        return $this->json(['data' => $data]);
    }

    #[Route('', name: 'api_pesaje_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data      = json_decode($request->getContent(), true) ?? [];
        $idAnimal  = $data['idAnimal']    ?? null;
        $fecha     = $data['fechaPesaje'] ?? date('Y-m-d');
        $pesoKg    = $data['pesoKg']      ?? null;
        $condicion = $data['condicionCorporal'] ?? null;
        $metodo    = $data['metodoPesaje'] ?? null;
        $obs       = $data['observaciones'] ?? null;

        if (!$idAnimal || $pesoKg === null) {
            return $this->json(['error' => 'Campos requeridos: idAnimal, pesoKg'], Response::HTTP_BAD_REQUEST);
        }

        $user = $this->getUser();
        $uReg = $user instanceof User ? $user->getId() : 1;

        $this->connection->executeStatement(
            "INSERT INTO PESAJE (id_animal, fecha_pesaje, peso_kg, condicion_corporal, metodo_pesaje, observaciones, usuario_registro)
             VALUES (:id, TO_DATE(:f, 'YYYY-MM-DD'), :p, :cc, :met, :obs, :ur)",
            [
                'id'  => $idAnimal,
                'f'   => $fecha,
                'p'   => $pesoKg,
                'cc'  => $condicion,
                'met' => $metodo,
                'obs' => $obs,
                'ur'  => $uReg,
            ]
        );

        $newId = (int) $this->connection->fetchOne(
            'SELECT MAX(id_pesaje) FROM PESAJE WHERE id_animal = :id AND fecha_pesaje = TO_DATE(:f, \'YYYY-MM-DD\')',
            ['id' => $idAnimal, 'f' => $fecha]
        );

        try {
            $this->auditoria->registrar(
                tabla: 'PESAJE',
                operacion: 'CREAR',
                idRegistro: $newId ?: null,
                descripcion: "Registro de pesaje para animal ID {$idAnimal} - {$pesoKg} kg",
                datosNuevos: [
                    'idAnimal'         => $idAnimal,
                    'fechaPesaje'      => $fecha,
                    'pesoKg'           => $pesoKg,
                    'condicionCorporal'=> $condicion,
                    'metodoPesaje'     => $metodo,
                    'observaciones'    => $obs,
                ],
            );
        } catch (\Throwable) {}

        return $this->json(['success' => true, 'message' => 'Pesaje registrado'], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_pesaje_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $oldRow = $this->connection->fetchAssociative(
            'SELECT * FROM PESAJE WHERE id_pesaje = :id',
            ['id' => $id]
        );

        $this->connection->executeStatement(
            'DELETE FROM PESAJE WHERE id_pesaje = :id',
            ['id' => $id]
        );

        try {
            $this->auditoria->registrar(
                tabla: 'PESAJE',
                operacion: 'ELIMINAR',
                idRegistro: $id,
                descripcion: "Eliminación de registro de pesaje ID {$id}",
                datosAnt: $oldRow ?: [],
            );
        } catch (\Throwable) {}

        return $this->json(['success' => true, 'message' => 'Pesaje eliminado']);
    }
}
