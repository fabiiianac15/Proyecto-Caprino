<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/animales')]
class AnimalController extends AbstractController
{
    public function __construct(private Connection $connection) {}

    #[Route('', name: 'api_animales_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $sexo   = $request->query->get('sexo');
        $estado = $request->query->get('estado');

        $sql    = "SELECT a.id_animal, a.codigo_identificacion, a.nombre, a.fecha_nacimiento,
                          a.sexo, a.id_raza, r.nombre_raza, a.color_pelaje,
                          a.peso_nacimiento_kg, a.estado, a.observaciones, a.foto_url
                   FROM ANIMAL a LEFT JOIN RAZA r ON a.id_raza = r.id_raza
                   WHERE 1=1";
        $params = [];

        if ($sexo) {
            $sql .= ' AND a.sexo = :sexo';
            $params['sexo'] = $sexo;
        }
        if ($estado) {
            $sql .= ' AND a.estado = :estado';
            $params['estado'] = $estado;
        }

        $sql .= ' ORDER BY a.codigo_identificacion';

        $rows = $this->connection->fetchAllAssociative($sql, $params);

        $data = array_map(fn($row) => [
            'id'             => (int) $row['ID_ANIMAL'],
            'codigo'         => $row['CODIGO_IDENTIFICACION'],
            'nombre'         => $row['NOMBRE'],
            'fechaNacimiento'=> $row['FECHA_NACIMIENTO'],
            'sexo'           => $row['SEXO'],
            'idRaza'         => (int) $row['ID_RAZA'],
            'nombreRaza'     => $row['NOMBRE_RAZA'],
            'colorPelaje'    => $row['COLOR_PELAJE'],
            'pesoNacimiento' => $row['PESO_NACIMIENTO_KG'] !== null ? (float) $row['PESO_NACIMIENTO_KG'] : null,
            'estado'         => $row['ESTADO'],
            'observaciones'  => $row['OBSERVACIONES'],
            'fotoUrl'        => $row['FOTO_URL'],
        ], $rows);

        return $this->json(['data' => $data]);
    }

    #[Route('/{id}', name: 'api_animales_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): JsonResponse
    {
        $row = $this->connection->fetchAssociative(
            'SELECT a.*, r.nombre_raza FROM ANIMAL a LEFT JOIN RAZA r ON a.id_raza = r.id_raza WHERE a.id_animal = :id',
            ['id' => $id]
        );

        if (!$row) {
            return $this->json(['error' => 'Animal no encontrado'], Response::HTTP_NOT_FOUND);
        }

        return $this->json(['data' => [
            'id'             => (int) $row['ID_ANIMAL'],
            'codigo'         => $row['CODIGO_IDENTIFICACION'],
            'nombre'         => $row['NOMBRE'],
            'fechaNacimiento'=> $row['FECHA_NACIMIENTO'],
            'sexo'           => $row['SEXO'],
            'idRaza'         => (int) $row['ID_RAZA'],
            'nombreRaza'     => $row['NOMBRE_RAZA'],
            'colorPelaje'    => $row['COLOR_PELAJE'],
            'pesoNacimiento' => $row['PESO_NACIMIENTO_KG'] !== null ? (float) $row['PESO_NACIMIENTO_KG'] : null,
            'estado'         => $row['ESTADO'],
            'observaciones'  => $row['OBSERVACIONES'],
            'fotoUrl'        => $row['FOTO_URL'],
        ]]);
    }

    #[Route('', name: 'api_animales_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data       = json_decode($request->getContent(), true) ?? [];
        $codigo     = $data['codigo'] ?? $data['codigo_identificacion'] ?? null;
        $nombre     = $data['nombre'] ?? null;
        $sexo       = $data['sexo']   ?? null;
        $idRaza     = $data['idRaza'] ?? $data['id_raza'] ?? null;
        $fechaNac   = $data['fechaNacimiento'] ?? $data['fecha_nacimiento'] ?? date('Y-m-d');
        $color      = $data['colorPelaje'] ?? $data['color_pelaje'] ?? null;
        $pesoNac    = $data['pesoNacimiento'] ?? $data['peso_nacimiento_kg'] ?? null;
        $obs        = $data['observaciones'] ?? null;

        if (!$codigo || !$sexo || !$idRaza) {
            return $this->json(['error' => 'Campos requeridos: codigo, sexo, idRaza'], Response::HTTP_BAD_REQUEST);
        }

        if (!in_array($sexo, ['macho', 'hembra'])) {
            return $this->json(['error' => "sexo debe ser 'macho' o 'hembra'"], Response::HTTP_BAD_REQUEST);
        }

        $user = $this->getUser();
        $usuarioReg = $user instanceof User ? $user->getId() : 1;

        $this->connection->executeStatement(
            "INSERT INTO ANIMAL (codigo_identificacion, nombre, fecha_nacimiento, sexo, id_raza, color_pelaje, peso_nacimiento_kg, estado, observaciones, usuario_registro)
             VALUES (:codigo, :nombre, TO_DATE(:fec, 'YYYY-MM-DD'), :sexo, :raza, :color, :peso, 'activo', :obs, :ureg)",
            [
                'codigo' => $codigo,
                'nombre' => $nombre,
                'fec'    => $fechaNac,
                'sexo'   => $sexo,
                'raza'   => $idRaza,
                'color'  => $color,
                'peso'   => $pesoNac,
                'obs'    => $obs,
                'ureg'   => $usuarioReg,
            ]
        );

        $newId = (int) $this->connection->fetchOne(
            'SELECT id_animal FROM ANIMAL WHERE codigo_identificacion = :c',
            ['c' => $codigo]
        );

        return $this->json([
            'success' => true,
            'message' => 'Animal creado correctamente',
            'data'    => ['id' => $newId, 'codigo' => $codigo, 'nombre' => $nombre],
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_animales_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $data   = json_decode($request->getContent(), true) ?? [];
        $nombre = $data['nombre'] ?? null;
        $sexo   = $data['sexo']   ?? null;
        $idRaza = $data['idRaza'] ?? $data['id_raza'] ?? null;
        $color  = $data['colorPelaje'] ?? $data['color_pelaje'] ?? null;
        $estado = $data['estado'] ?? null;
        $obs    = $data['observaciones'] ?? null;

        $this->connection->executeStatement(
            "UPDATE ANIMAL SET
               nombre        = NVL(:nombre, nombre),
               sexo          = NVL(:sexo, sexo),
               id_raza       = NVL(:raza, id_raza),
               color_pelaje  = NVL(:color, color_pelaje),
               estado        = NVL(:estado, estado),
               observaciones = NVL(:obs, observaciones)
             WHERE id_animal = :id",
            [
                'nombre' => $nombre,
                'sexo'   => $sexo,
                'raza'   => $idRaza,
                'color'  => $color,
                'estado' => $estado,
                'obs'    => $obs,
                'id'     => $id,
            ]
        );

        return $this->json(['success' => true, 'message' => 'Animal actualizado']);
    }

    #[Route('/{id}', name: 'api_animales_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $this->connection->executeStatement(
            "UPDATE ANIMAL SET estado = 'muerto', fecha_cambio_estado = CURRENT_TIMESTAMP WHERE id_animal = :id",
            ['id' => $id]
        );

        return $this->json(['success' => true, 'message' => 'Animal dado de baja']);
    }
}
