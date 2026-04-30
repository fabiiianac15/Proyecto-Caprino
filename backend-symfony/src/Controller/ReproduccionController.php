<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/reproduccion')]
class ReproduccionController extends AbstractController
{
    public function __construct(private Connection $connection) {}

    #[Route('', name: 'api_reproduccion_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $rows = $this->connection->fetchAllAssociative(
            "SELECT r.id_reproduccion, r.id_hembra, r.id_macho,
                    h.nombre as nombre_hembra, h.codigo_identificacion as codigo_hembra,
                    m.nombre as nombre_macho,  m.codigo_identificacion as codigo_macho,
                    r.tipo_servicio, r.fecha_servicio, r.fecha_parto_estimada,
                    r.fecha_parto_real, r.tipo_parto, r.numero_crias,
                    r.resultado, r.dificultad_parto, r.observaciones
             FROM REPRODUCCION r
             JOIN ANIMAL h ON r.id_hembra = h.id_animal
             LEFT JOIN ANIMAL m ON r.id_macho = m.id_animal
             ORDER BY r.fecha_servicio DESC"
        );

        $data = array_map(fn($row) => [
            'id'                 => (int) $row['ID_REPRODUCCION'],
            'idHembra'           => (int) $row['ID_HEMBRA'],
            'nombreHembra'       => $row['NOMBRE_HEMBRA'],
            'codigoHembra'       => $row['CODIGO_HEMBRA'],
            'idMacho'            => $row['ID_MACHO'] !== null ? (int) $row['ID_MACHO'] : null,
            'nombreMacho'        => $row['NOMBRE_MACHO'],
            'tipoServicio'       => $row['TIPO_SERVICIO'],
            'fechaServicio'      => $row['FECHA_SERVICIO'],
            'fechaPartoEstimada' => $row['FECHA_PARTO_ESTIMADA'],
            'fechaPartoReal'     => $row['FECHA_PARTO_REAL'],
            'tipoParto'          => $row['TIPO_PARTO'],
            'numeroCrias'        => $row['NUMERO_CRIAS'] !== null ? (int) $row['NUMERO_CRIAS'] : null,
            'resultado'          => $row['RESULTADO'],
            'dificultadParto'    => $row['DIFICULTAD_PARTO'],
            'observaciones'      => $row['OBSERVACIONES'],
        ], $rows);

        return $this->json(['data' => $data]);
    }

    #[Route('', name: 'api_reproduccion_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data         = json_decode($request->getContent(), true) ?? [];
        $idHembra     = $data['idHembra']    ?? null;
        $idMacho      = $data['idMacho']     ?? null;
        $tipoServicio = $data['tipoServicio'] ?? 'monta_natural';
        $fechaServicio= $data['fechaServicio'] ?? date('Y-m-d');
        $obs          = $data['observaciones'] ?? null;

        if (!$idHembra) {
            return $this->json(['error' => 'Campo requerido: idHembra'], Response::HTTP_BAD_REQUEST);
        }

        $tiposValidos = ['monta_natural', 'inseminacion_artificial', 'transferencia_embrion'];
        if (!in_array($tipoServicio, $tiposValidos)) {
            $tipoServicio = 'monta_natural';
        }

        $user = $this->getUser();
        $uReg = $user instanceof User ? $user->getId() : 1;

        $this->connection->executeStatement(
            "INSERT INTO REPRODUCCION (id_hembra, id_macho, tipo_servicio, fecha_servicio, resultado, observaciones, usuario_registro)
             VALUES (:h, :m, :ts, TO_DATE(:f, 'YYYY-MM-DD'), 'pendiente', :obs, :ur)",
            [
                'h'   => $idHembra,
                'm'   => $idMacho,
                'ts'  => $tipoServicio,
                'f'   => $fechaServicio,
                'obs' => $obs,
                'ur'  => $uReg,
            ]
        );

        return $this->json(['success' => true, 'message' => 'Reproducción registrada'], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_reproduccion_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $data       = json_decode($request->getContent(), true) ?? [];
        $resultado  = $data['resultado']     ?? null;
        $numCrias   = $data['numeroCrias']   ?? null;
        $tipoParto  = $data['tipoParto']     ?? null;
        $fechaReal  = $data['fechaPartoReal'] ?? null;
        $dificultad = $data['dificultadParto'] ?? null;
        $obs        = $data['observaciones'] ?? null;

        $this->connection->executeStatement(
            "UPDATE REPRODUCCION SET
               resultado        = NVL(:res, resultado),
               numero_crias     = NVL(:nc, numero_crias),
               tipo_parto       = NVL(:tp, tipo_parto),
               fecha_parto_real = CASE WHEN :fr IS NOT NULL THEN TO_DATE(:fr, 'YYYY-MM-DD') ELSE fecha_parto_real END,
               dificultad_parto = NVL(:dif, dificultad_parto),
               observaciones    = NVL(:obs, observaciones)
             WHERE id_reproduccion = :id",
            [
                'res' => $resultado,
                'nc'  => $numCrias,
                'tp'  => $tipoParto,
                'fr'  => $fechaReal,
                'dif' => $dificultad,
                'obs' => $obs,
                'id'  => $id,
            ]
        );

        return $this->json(['success' => true, 'message' => 'Reproducción actualizada']);
    }
}
