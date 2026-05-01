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

#[Route('/api/reproduccion')]
class ReproduccionController extends AbstractController
{
    public function __construct(
        private Connection $connection,
        private AuditoriaService $auditoria,
    ) {}

    #[Route('', name: 'api_reproduccion_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $resultado = $request->query->get('resultado');
        $idHembra  = $request->query->get('idHembra') ?? $request->query->get('hembra');

        $sql    = "SELECT r.id_reproduccion, r.id_hembra, r.id_macho,
                          h.nombre as nombre_hembra, h.codigo_identificacion as codigo_hembra,
                          m.nombre as nombre_macho,  m.codigo_identificacion as codigo_macho,
                          r.tipo_servicio, r.fecha_servicio, r.fecha_parto_estimada,
                          r.fecha_parto_real, r.tipo_parto, r.numero_crias,
                          r.resultado, r.dificultad_parto, r.observaciones
                   FROM REPRODUCCION r
                   JOIN ANIMAL h ON r.id_hembra = h.id_animal
                   LEFT JOIN ANIMAL m ON r.id_macho = m.id_animal
                   WHERE 1=1";
        $params = [];

        if ($resultado) {
            $sql .= ' AND r.resultado = :resultado';
            $params['resultado'] = $resultado;
        }
        if ($idHembra) {
            $sql .= ' AND r.id_hembra = :idHembra';
            $params['idHembra'] = (int) $idHembra;
        }

        $sql .= ' ORDER BY r.fecha_servicio DESC';

        $rows = $this->connection->fetchAllAssociative($sql, $params);

        $data = array_map(fn($row) => [
            'id'                 => (int) $row['ID_REPRODUCCION'],
            'idHembra'           => (int) $row['ID_HEMBRA'],
            'nombreHembra'       => $row['NOMBRE_HEMBRA'],
            'codigoHembra'       => $row['CODIGO_HEMBRA'],
            'idMacho'            => $row['ID_MACHO'] !== null ? (int) $row['ID_MACHO'] : null,
            'nombreMacho'        => $row['NOMBRE_MACHO'],
            'codigoMacho'        => $row['CODIGO_MACHO'],
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

        $newId = (int) $this->connection->fetchOne(
            'SELECT MAX(id_reproduccion) FROM REPRODUCCION WHERE id_hembra = :h AND fecha_servicio = TO_DATE(:f, \'YYYY-MM-DD\')',
            ['h' => $idHembra, 'f' => $fechaServicio]
        );

        try {
            $this->auditoria->registrar(
                tabla: 'REPRODUCCION',
                operacion: 'CREAR',
                idRegistro: $newId ?: null,
                descripcion: "Registro de servicio reproductivo ({$tipoServicio}) para hembra ID {$idHembra}",
                datosNuevos: [
                    'idHembra'     => $idHembra,
                    'idMacho'      => $idMacho,
                    'tipoServicio' => $tipoServicio,
                    'fechaServicio'=> $fechaServicio,
                    'resultado'    => 'pendiente',
                    'observaciones'=> $obs,
                ],
            );
        } catch (\Throwable) {}

        return $this->json(['success' => true, 'message' => 'Reproducción registrada'], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_reproduccion_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $data       = json_decode($request->getContent(), true) ?? [];
        $resultado      = $data['resultado']          ?? null;
        $numCrias       = $data['numeroCrias']        ?? null;
        $tipoParto      = $data['tipoParto']          ?? null;
        $fechaReal      = $data['fechaPartoReal']     ?? null;
        $fechaEstimada  = $data['fechaPartoEstimada'] ?? null;
        $dificultad     = $data['dificultadParto']    ?? null;
        $obs            = $data['observaciones']      ?? null;

        // Validar valores contra CHECK constraints
        $resultadosValidos  = ['exitoso', 'aborto', 'mortinato', 'pendiente'];
        $tiposPartoValidos  = ['simple', 'doble', 'triple', 'multiple'];
        $dificultadesValidas = ['normal', 'asistido', 'distocico', 'cesarea'];
        if ($resultado  && !in_array($resultado,  $resultadosValidos))  $resultado  = null;
        if ($tipoParto  && !in_array($tipoParto,  $tiposPartoValidos))  $tipoParto  = null;
        if ($dificultad && !in_array($dificultad, $dificultadesValidas)) $dificultad = null;

        $oldRow = $this->connection->fetchAssociative(
            'SELECT * FROM REPRODUCCION WHERE id_reproduccion = :id',
            ['id' => $id]
        );

        if (!$oldRow) {
            return $this->json(['error' => 'Registro no encontrado'], Response::HTTP_NOT_FOUND);
        }

        $this->connection->executeStatement(
            "UPDATE REPRODUCCION SET
               resultado            = NVL(:res, resultado),
               numero_crias         = NVL(:nc, numero_crias),
               tipo_parto           = NVL(:tp, tipo_parto),
               fecha_parto_real     = CASE WHEN :fr IS NOT NULL THEN TO_DATE(:fr, 'YYYY-MM-DD') ELSE fecha_parto_real END,
               fecha_parto_estimada = CASE WHEN :fe IS NOT NULL THEN TO_DATE(:fe, 'YYYY-MM-DD') ELSE fecha_parto_estimada END,
               dificultad_parto     = NVL(:dif, dificultad_parto),
               observaciones        = NVL(:obs, observaciones)
             WHERE id_reproduccion = :id",
            [
                'res' => $resultado,
                'nc'  => $numCrias,
                'tp'  => $tipoParto,
                'fr'  => $fechaReal,
                'fe'  => $fechaEstimada,
                'dif' => $dificultad,
                'obs' => $obs,
                'id'  => $id,
            ]
        );

        try {
            $this->auditoria->registrar(
                tabla: 'REPRODUCCION',
                operacion: 'ACTUALIZAR',
                idRegistro: $id,
                descripcion: "Actualización de registro reproductivo ID {$id}",
                datosAnt: $oldRow ?: [],
                datosNuevos: $data,
            );
        } catch (\Throwable) {}

        return $this->json(['success' => true, 'message' => 'Reproducción actualizada']);
    }
}
