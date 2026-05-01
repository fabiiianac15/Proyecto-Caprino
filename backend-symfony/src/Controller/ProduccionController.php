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

#[Route('/api/produccion')]
class ProduccionController extends AbstractController
{
    public function __construct(
        private Connection $connection,
        private AuditoriaService $auditoria,
    ) {}

    #[Route('', name: 'api_produccion_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $animalId = $request->query->get('animal');
        $sql = "SELECT p.id_produccion, p.id_animal, a.nombre as nombre_animal,
                       a.codigo_identificacion, p.fecha_produccion, p.litros,
                       p.turno, p.numero_lactancia, p.dias_lactancia,
                       p.grasa_porcentaje, p.observaciones
                FROM PRODUCCION_LECHE p JOIN ANIMAL a ON p.id_animal = a.id_animal";
        $params = [];

        if ($animalId) {
            $sql .= ' WHERE p.id_animal = :animalId';
            $params['animalId'] = (int) $animalId;
        }

        $sql .= ' ORDER BY p.fecha_produccion DESC';

        $rows = $this->connection->fetchAllAssociative($sql, $params);

        $data = array_map(fn($row) => [
            'id'              => (int) $row['ID_PRODUCCION'],
            'idAnimal'        => (int) $row['ID_ANIMAL'],
            'nombreAnimal'    => $row['NOMBRE_ANIMAL'],
            'codigoAnimal'    => $row['CODIGO_IDENTIFICACION'],
            'fechaProduccion' => $row['FECHA_PRODUCCION'],
            'litros'          => (float) $row['LITROS'],
            'turno'           => $row['TURNO'],
            'numeroLactancia' => $row['NUMERO_LACTANCIA'] !== null ? (int) $row['NUMERO_LACTANCIA'] : null,
            'diasLactancia'   => $row['DIAS_LACTANCIA'] !== null ? (int) $row['DIAS_LACTANCIA'] : null,
            'grasaPorcentaje' => $row['GRASA_PORCENTAJE'] !== null ? (float) $row['GRASA_PORCENTAJE'] : null,
            'observaciones'   => $row['OBSERVACIONES'],
        ], $rows);

        return $this->json(['data' => $data]);
    }

    #[Route('', name: 'api_produccion_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data     = json_decode($request->getContent(), true) ?? [];
        $idAnimal = $data['idAnimal'] ?? null;
        $fecha    = $data['fechaProduccion'] ?? date('Y-m-d');
        $litros   = $data['litros'] ?? null;
        $turno    = $data['turno'] ?? 'total_dia';
        $numLact  = $data['numeroLactancia'] ?? null;
        $diasLact = $data['diasLactancia'] ?? null;
        $grasa    = $data['grasaPorcentaje'] ?? null;
        $obs      = $data['observaciones'] ?? null;

        if (!$idAnimal || $litros === null) {
            return $this->json(['error' => 'Campos requeridos: idAnimal, litros'], Response::HTTP_BAD_REQUEST);
        }

        $turnosValidos = ['mañana', 'manana', 'tarde', 'noche', 'total_dia'];
        if (!in_array($turno, $turnosValidos)) {
            $turno = 'total_dia';
        }
        if ($turno === 'manana') {
            $turno = 'mañana';
        }

        $user = $this->getUser();
        $uReg = $user instanceof User ? $user->getId() : 1;

        $this->connection->executeStatement(
            "INSERT INTO PRODUCCION_LECHE (id_animal, fecha_produccion, litros, turno, numero_lactancia, dias_lactancia, grasa_porcentaje, observaciones, usuario_registro)
             VALUES (:id, TO_DATE(:f, 'YYYY-MM-DD'), :l, :t, :nl, :dl, :gr, :obs, :ur)",
            [
                'id'  => $idAnimal,
                'f'   => $fecha,
                'l'   => $litros,
                't'   => $turno,
                'nl'  => $numLact,
                'dl'  => $diasLact,
                'gr'  => $grasa,
                'obs' => $obs,
                'ur'  => $uReg,
            ]
        );

        $newId = (int) $this->connection->fetchOne(
            'SELECT MAX(id_produccion) FROM PRODUCCION_LECHE WHERE id_animal = :id AND fecha_produccion = TO_DATE(:f, \'YYYY-MM-DD\')',
            ['id' => $idAnimal, 'f' => $fecha]
        );

        try {
            $this->auditoria->registrar(
                tabla: 'PRODUCCION_LECHE',
                operacion: 'CREAR',
                idRegistro: $newId ?: null,
                descripcion: "Registro de producción de leche para animal ID {$idAnimal} - {$litros} litros ({$turno})",
                datosNuevos: [
                    'idAnimal'        => $idAnimal,
                    'fechaProduccion' => $fecha,
                    'litros'          => $litros,
                    'turno'           => $turno,
                    'numeroLactancia' => $numLact,
                    'diasLactancia'   => $diasLact,
                    'grasaPorcentaje' => $grasa,
                    'observaciones'   => $obs,
                ],
            );
        } catch (\Throwable) {}

        return $this->json(['success' => true, 'message' => 'Producción registrada'], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_produccion_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $oldRow = $this->connection->fetchAssociative(
            'SELECT * FROM PRODUCCION_LECHE WHERE id_produccion = :id',
            ['id' => $id]
        );

        $this->connection->executeStatement(
            'DELETE FROM PRODUCCION_LECHE WHERE id_produccion = :id',
            ['id' => $id]
        );

        try {
            $this->auditoria->registrar(
                tabla: 'PRODUCCION_LECHE',
                operacion: 'ELIMINAR',
                idRegistro: $id,
                descripcion: "Eliminación de registro de producción de leche ID {$id}",
                datosAnt: $oldRow ?: [],
            );
        } catch (\Throwable) {}

        return $this->json(['success' => true, 'message' => 'Registro de producción eliminado']);
    }
}
