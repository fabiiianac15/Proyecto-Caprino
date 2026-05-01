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

#[Route('/api/salud')]
class SaludController extends AbstractController
{
    public function __construct(
        private Connection $connection,
        private AuditoriaService $auditoria,
    ) {}

    #[Route('', name: 'api_salud_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $animalId = $request->query->get('animal');
        $sql = "SELECT s.id_registro, s.id_animal, a.nombre as nombre_animal,
                       a.codigo_identificacion, s.tipo_registro, s.fecha_aplicacion,
                       s.enfermedad_diagnostico, s.medicamento_producto, s.dosis,
                       s.via_administracion, s.veterinario, s.fecha_proxima_aplicacion,
                       s.dias_retiro_leche, s.observaciones
                FROM SALUD s JOIN ANIMAL a ON s.id_animal = a.id_animal";
        $params = [];

        if ($animalId) {
            $sql .= ' WHERE s.id_animal = :animalId';
            $params['animalId'] = (int) $animalId;
        }

        $sql .= ' ORDER BY s.fecha_aplicacion DESC';

        $rows = $this->connection->fetchAllAssociative($sql, $params);

        $data = array_map(fn($row) => [
            'id'                    => (int) $row['ID_REGISTRO'],
            'idAnimal'              => (int) $row['ID_ANIMAL'],
            'nombreAnimal'          => $row['NOMBRE_ANIMAL'],
            'codigoAnimal'          => $row['CODIGO_IDENTIFICACION'],
            'tipoRegistro'          => $row['TIPO_REGISTRO'],
            'fechaAplicacion'       => $row['FECHA_APLICACION'],
            'enfermedadDiagnostico' => $row['ENFERMEDAD_DIAGNOSTICO'],
            'medicamentoProducto'   => $row['MEDICAMENTO_PRODUCTO'],
            'dosis'                 => $row['DOSIS'],
            'viaAdministracion'     => $row['VIA_ADMINISTRACION'],
            'veterinario'           => $row['VETERINARIO'],
            'fechaProximaAplicacion'=> $row['FECHA_PROXIMA_APLICACION'],
            'diasRetiroLeche'       => $row['DIAS_RETIRO_LECHE'] !== null ? (int) $row['DIAS_RETIRO_LECHE'] : null,
            'observaciones'         => $row['OBSERVACIONES'],
        ], $rows);

        return $this->json(['data' => $data]);
    }

    #[Route('', name: 'api_salud_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data       = json_decode($request->getContent(), true) ?? [];
        $idAnimal   = $data['idAnimal']    ?? null;
        $tipo       = $data['tipoRegistro'] ?? $data['tipo_registro'] ?? null;
        $fecha      = $data['fechaAplicacion'] ?? $data['fecha_aplicacion'] ?? date('Y-m-d');
        $enfermedad = $data['enfermedadDiagnostico'] ?? null;
        $medicamento= $data['medicamentoProducto'] ?? null;
        $dosis      = $data['dosis']       ?? null;
        $via        = $data['viaAdministracion'] ?? null;
        $lote       = $data['loteProducto'] ?? null;
        $fechaProx  = $data['fechaProximaAplicacion'] ?? null;
        $diasLeche  = $data['diasRetiroLeche'] ?? null;
        $diasCarne  = $data['diasRetiroCarne'] ?? null;
        $vet        = $data['veterinario'] ?? null;
        $obs        = $data['observaciones'] ?? null;

        if (!$idAnimal || !$tipo) {
            return $this->json(['error' => 'Campos requeridos: idAnimal, tipoRegistro'], Response::HTTP_BAD_REQUEST);
        }

        $tiposValidos = ['vacuna', 'tratamiento', 'diagnostico', 'cirugia', 'desparasitacion'];
        if (!in_array($tipo, $tiposValidos)) {
            return $this->json(
                ['error' => 'tipoRegistro inválido. Valores: ' . implode(', ', $tiposValidos)],
                Response::HTTP_BAD_REQUEST
            );
        }

        $user = $this->getUser();
        $uReg = $user instanceof User ? $user->getId() : 1;

        $this->connection->executeStatement(
            "INSERT INTO SALUD (id_animal, tipo_registro, fecha_aplicacion, enfermedad_diagnostico,
               medicamento_producto, dosis, via_administracion, lote_producto,
               fecha_proxima_aplicacion, dias_retiro_leche, dias_retiro_carne,
               veterinario, observaciones, usuario_registro)
             VALUES (:id, :tipo, TO_DATE(:f, 'YYYY-MM-DD'), :enf, :med, :dos, :via, :lote,
               CASE WHEN :fp IS NOT NULL THEN TO_DATE(:fp, 'YYYY-MM-DD') ELSE NULL END,
               :dl, :dc, :vet, :obs, :ur)",
            [
                'id'   => $idAnimal,
                'tipo' => $tipo,
                'f'    => $fecha,
                'enf'  => $enfermedad,
                'med'  => $medicamento,
                'dos'  => $dosis,
                'via'  => $via,
                'lote' => $lote,
                'fp'   => $fechaProx,
                'dl'   => $diasLeche,
                'dc'   => $diasCarne,
                'vet'  => $vet,
                'obs'  => $obs,
                'ur'   => $uReg,
            ]
        );

        $newId = (int) $this->connection->fetchOne(
            'SELECT MAX(id_registro) FROM SALUD WHERE id_animal = :id AND fecha_aplicacion = TO_DATE(:f, \'YYYY-MM-DD\')',
            ['id' => $idAnimal, 'f' => $fecha]
        );

        try {
            $this->auditoria->registrar(
                tabla: 'SALUD',
                operacion: 'CREAR',
                idRegistro: $newId ?: null,
                descripcion: "Registro de evento de salud ({$tipo}) para animal ID {$idAnimal}",
                datosNuevos: [
                    'idAnimal'              => $idAnimal,
                    'tipoRegistro'          => $tipo,
                    'fechaAplicacion'       => $fecha,
                    'enfermedadDiagnostico' => $enfermedad,
                    'medicamentoProducto'   => $medicamento,
                    'dosis'                 => $dosis,
                    'viaAdministracion'     => $via,
                    'veterinario'           => $vet,
                    'observaciones'         => $obs,
                ],
            );
        } catch (\Throwable) {}

        return $this->json(['success' => true, 'message' => 'Evento de salud registrado'], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_salud_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $oldRow = $this->connection->fetchAssociative(
            'SELECT * FROM SALUD WHERE id_registro = :id',
            ['id' => $id]
        );

        $this->connection->executeStatement(
            'DELETE FROM SALUD WHERE id_registro = :id',
            ['id' => $id]
        );

        try {
            $this->auditoria->registrar(
                tabla: 'SALUD',
                operacion: 'ELIMINAR',
                idRegistro: $id,
                descripcion: "Eliminación de registro de salud ID {$id}",
                datosAnt: $oldRow ?: [],
            );
        } catch (\Throwable) {}

        return $this->json(['success' => true, 'message' => 'Registro de salud eliminado']);
    }
}
