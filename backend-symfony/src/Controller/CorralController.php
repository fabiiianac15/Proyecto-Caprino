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

#[Route('/api/corrales')]
class CorralController extends AbstractController
{
    public function __construct(
        private Connection $connection,
        private AuditoriaService $auditoria,
    ) {}

    private function mapRow(array $row): array
    {
        $cap = $row['CAPACIDAD_MAXIMA'] !== null ? (int) $row['CAPACIDAD_MAXIMA'] : null;
        $ocup = (int) ($row['OCUPACION'] ?? 0);

        return [
            'id'              => (int) $row['ID_CORRAL'],
            'nombre'          => $row['NOMBRE'],
            'lote'            => $row['LOTE'],
            'tipo'            => $row['TIPO'],
            'capacidadMaxima' => $cap,
            'pesoMinKg'       => $row['PESO_MIN_KG'] !== null ? (float) $row['PESO_MIN_KG'] : null,
            'pesoMaxKg'       => $row['PESO_MAX_KG'] !== null ? (float) $row['PESO_MAX_KG'] : null,
            'descripcion'     => $row['DESCRIPCION'],
            'estado'          => $row['ESTADO'],
            'ocupacion'       => $ocup,
            'disponibles'     => $cap !== null ? max(0, $cap - $ocup) : null,
            'lleno'           => $cap !== null && $ocup >= $cap,
        ];
    }

    #[Route('', name: 'api_corrales_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $rows = $this->connection->fetchAllAssociative(
            "SELECT c.*,
                    (SELECT COUNT(*) FROM ANIMAL a
                      WHERE a.id_corral = c.id_corral AND a.estado = 'activo') AS ocupacion
               FROM CORRAL c
              ORDER BY c.nombre"
        );

        return $this->json(['data' => array_map([$this, 'mapRow'], $rows)]);
    }

    #[Route('/{id}', name: 'api_corrales_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): JsonResponse
    {
        $row = $this->connection->fetchAssociative(
            "SELECT c.*,
                    (SELECT COUNT(*) FROM ANIMAL a
                      WHERE a.id_corral = c.id_corral AND a.estado = 'activo') AS ocupacion
               FROM CORRAL c WHERE c.id_corral = :id",
            ['id' => $id]
        );

        if (!$row) {
            return $this->json(['error' => 'Corral no encontrado'], Response::HTTP_NOT_FOUND);
        }

        return $this->json(['data' => $this->mapRow($row)]);
    }

    #[Route('', name: 'api_corrales_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $d = json_decode($request->getContent(), true) ?? [];
        $nombre = trim($d['nombre'] ?? '');
        $tipo   = $d['tipo'] ?? 'general';

        if ($nombre === '') {
            return $this->json(['error' => 'El nombre del corral es obligatorio'], Response::HTTP_BAD_REQUEST);
        }
        if (!in_array($tipo, ['general', 'gestante', 'ordeno', 'lactancia', 'levante', 'machos'], true)) {
            return $this->json(['error' => 'Tipo de corral inválido'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $this->connection->executeStatement(
                "INSERT INTO CORRAL (nombre, lote, tipo, capacidad_maxima, peso_min_kg, peso_max_kg, descripcion, estado)
                 VALUES (:nombre, :lote, :tipo, :cap, :pmin, :pmax, :desc, 'activo')",
                [
                    'nombre' => $nombre,
                    'lote'   => $d['lote'] ?? null,
                    'tipo'   => $tipo,
                    'cap'    => isset($d['capacidadMaxima']) && $d['capacidadMaxima'] !== '' ? (int) $d['capacidadMaxima'] : null,
                    'pmin'   => isset($d['pesoMinKg']) && $d['pesoMinKg'] !== '' ? (float) $d['pesoMinKg'] : null,
                    'pmax'   => isset($d['pesoMaxKg']) && $d['pesoMaxKg'] !== '' ? (float) $d['pesoMaxKg'] : null,
                    'desc'   => $d['descripcion'] ?? null,
                ]
            );
        } catch (\Throwable $e) {
            if (str_contains($e->getMessage(), 'ORA-00001') || str_contains($e->getMessage(), 'unique')) {
                return $this->json(['error' => "Ya existe un corral llamado '{$nombre}'."], Response::HTTP_CONFLICT);
            }
            return $this->json(['error' => 'Error al crear el corral.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $id = (int) $this->connection->fetchOne('SELECT id_corral FROM CORRAL WHERE nombre = :n', ['n' => $nombre]);

        try {
            $this->auditoria->registrar(
                tabla: 'CORRAL', operacion: 'CREAR', idRegistro: $id,
                descripcion: "Creación de corral {$nombre}", datosNuevos: $d,
            );
        } catch (\Throwable) {}

        return $this->json(['success' => true, 'data' => ['id' => $id]], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_corrales_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $d = json_decode($request->getContent(), true) ?? [];

        $this->connection->executeStatement(
            "UPDATE CORRAL SET
                nombre = NVL(:nombre, nombre),
                lote = :lote,
                tipo = NVL(:tipo, tipo),
                capacidad_maxima = :cap,
                peso_min_kg = :pmin,
                peso_max_kg = :pmax,
                descripcion = :desc,
                estado = NVL(:estado, estado)
              WHERE id_corral = :id",
            [
                'nombre' => isset($d['nombre']) && $d['nombre'] !== '' ? $d['nombre'] : null,
                'lote'   => $d['lote'] ?? null,
                'tipo'   => $d['tipo'] ?? null,
                'cap'    => isset($d['capacidadMaxima']) && $d['capacidadMaxima'] !== '' ? (int) $d['capacidadMaxima'] : null,
                'pmin'   => isset($d['pesoMinKg']) && $d['pesoMinKg'] !== '' ? (float) $d['pesoMinKg'] : null,
                'pmax'   => isset($d['pesoMaxKg']) && $d['pesoMaxKg'] !== '' ? (float) $d['pesoMaxKg'] : null,
                'desc'   => $d['descripcion'] ?? null,
                'estado' => $d['estado'] ?? null,
                'id'     => $id,
            ]
        );

        return $this->json(['success' => true]);
    }

    #[Route('/{id}', name: 'api_corrales_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $ocupacion = (int) $this->connection->fetchOne(
            "SELECT COUNT(*) FROM ANIMAL WHERE id_corral = :id AND estado = 'activo'",
            ['id' => $id]
        );
        if ($ocupacion > 0) {
            return $this->json(
                ['error' => "No se puede eliminar: el corral tiene {$ocupacion} animal(es) asignado(s). Reubícalos primero."],
                Response::HTTP_CONFLICT
            );
        }

        // Soltar referencias y desactivar (conserva historial)
        $this->connection->executeStatement('UPDATE ANIMAL SET id_corral = NULL WHERE id_corral = :id', ['id' => $id]);
        $this->connection->executeStatement("UPDATE CORRAL SET estado = 'inactivo' WHERE id_corral = :id", ['id' => $id]);

        return $this->json(['success' => true]);
    }
}
