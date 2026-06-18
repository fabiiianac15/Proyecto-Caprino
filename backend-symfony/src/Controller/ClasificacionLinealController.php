<?php

namespace App\Controller;

use App\Entity\User;
use App\Service\AuditoriaService;
use App\Service\ClasificacionLinealService;
use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/clasificacion-lineal')]
class ClasificacionLinealController extends AbstractController
{
    private const VISTAS = ['FRONTAL', 'LATERAL', 'POSTERIOR', 'UBRE_POST', 'UBRE_LAT', 'PATAS'];

    public function __construct(
        private Connection                 $connection,
        private ClasificacionLinealService $clasificacion,
        private AuditoriaService           $auditoria,
    ) {}

    private function uploadsDir(): string
    {
        $base = $_ENV['APP_UPLOADS_DIR'] ?? $_SERVER['APP_UPLOADS_DIR'] ?? null;
        if (!$base) {
            $base = $this->getParameter('kernel.project_dir') . '/var/uploads';
        }
        return rtrim($base, '/');
    }

    // ------------------------------------------------------------------
    // Catálogo de rasgos
    // ------------------------------------------------------------------
    #[Route('/catalogo', name: 'api_clasif_catalogo', methods: ['GET'])]
    public function catalogo(): JsonResponse
    {
        $rows = $this->connection->fetchAllAssociative(
            "SELECT id_rasgo, codigo, nombre, region, pts_region, orden
               FROM CLASIF_RASGO_CAT ORDER BY orden"
        );

        return $this->json(['data' => array_map(fn($r) => [
            'idRasgo'   => (int) $r['ID_RASGO'],
            'codigo'    => $r['CODIGO'],
            'nombre'    => $r['NOMBRE'],
            'region'    => $r['REGION'],
            'ptsRegion' => (float) $r['PTS_REGION'],
            'orden'     => (int) $r['ORDEN'],
        ], $rows)]);
    }

    // ------------------------------------------------------------------
    // Listado (opcionalmente por animal)
    // ------------------------------------------------------------------
    #[Route('', name: 'api_clasif_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $idAnimal = $request->query->get('idAnimal');
        $sql = "SELECT e.id_evaluacion, e.id_animal, a.nombre AS nombre_animal,
                       a.codigo_identificacion, e.fecha_evaluacion, e.punt_final, e.categoria
                  FROM EVALUACION_LINEAL e JOIN ANIMAL a ON e.id_animal = a.id_animal";
        $params = [];
        if ($idAnimal) {
            $sql .= ' WHERE e.id_animal = :ia';
            $params['ia'] = (int) $idAnimal;
        }
        $sql .= ' ORDER BY e.fecha_evaluacion DESC';

        $rows = $this->connection->fetchAllAssociative($sql, $params);

        return $this->json(['data' => array_map(fn($r) => [
            'id'              => (int) $r['ID_EVALUACION'],
            'idAnimal'        => (int) $r['ID_ANIMAL'],
            'nombreAnimal'    => $r['NOMBRE_ANIMAL'],
            'codigoAnimal'    => $r['CODIGO_IDENTIFICACION'],
            'fechaEvaluacion' => $r['FECHA_EVALUACION'],
            'puntFinal'       => $r['PUNT_FINAL'] !== null ? (float) $r['PUNT_FINAL'] : null,
            'categoria'       => $r['CATEGORIA'],
        ], $rows), 'total' => count($rows)]);
    }

    // ------------------------------------------------------------------
    // Detalle
    // ------------------------------------------------------------------
    #[Route('/{id}', name: 'api_clasif_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): JsonResponse
    {
        $cab = $this->connection->fetchAssociative(
            "SELECT e.id_evaluacion, e.id_animal, a.nombre AS nombre_animal, a.codigo_identificacion,
                    e.fecha_evaluacion, e.edad_meses, e.num_lactancia,
                    e.punt_apariencia, e.punt_estructura, e.punt_mamario, e.punt_patas,
                    e.punt_final, e.categoria, e.observaciones
               FROM EVALUACION_LINEAL e JOIN ANIMAL a ON e.id_animal = a.id_animal
              WHERE e.id_evaluacion = :id",
            ['id' => $id]
        );
        if (!$cab) {
            return $this->json(['error' => 'Evaluación no encontrada'], Response::HTTP_NOT_FOUND);
        }

        $det = $this->connection->fetchAllAssociative(
            "SELECT d.id_detalle, d.id_rasgo, c.codigo, c.nombre, c.region,
                    d.calificacion, d.puntaje, d.observacion
               FROM EVAL_LINEAL_DETALLE d JOIN CLASIF_RASGO_CAT c ON d.id_rasgo = c.id_rasgo
              WHERE d.id_evaluacion = :id ORDER BY c.orden",
            ['id' => $id]
        );
        $fotos = $this->connection->fetchAllAssociative(
            "SELECT id_foto, tipo_vista, ruta_archivo, descripcion
               FROM EVAL_LINEAL_FOTO WHERE id_evaluacion = :id ORDER BY id_foto",
            ['id' => $id]
        );

        return $this->json(['data' => [
            'id'              => (int) $cab['ID_EVALUACION'],
            'idAnimal'        => (int) $cab['ID_ANIMAL'],
            'nombreAnimal'    => $cab['NOMBRE_ANIMAL'],
            'codigoAnimal'    => $cab['CODIGO_IDENTIFICACION'],
            'fechaEvaluacion' => $cab['FECHA_EVALUACION'],
            'edadMeses'       => $cab['EDAD_MESES'] !== null ? (int) $cab['EDAD_MESES'] : null,
            'numLactancia'    => $cab['NUM_LACTANCIA'] !== null ? (int) $cab['NUM_LACTANCIA'] : null,
            'puntApariencia'  => $cab['PUNT_APARIENCIA'] !== null ? (float) $cab['PUNT_APARIENCIA'] : null,
            'puntEstructura'  => $cab['PUNT_ESTRUCTURA'] !== null ? (float) $cab['PUNT_ESTRUCTURA'] : null,
            'puntMamario'     => $cab['PUNT_MAMARIO'] !== null ? (float) $cab['PUNT_MAMARIO'] : null,
            'puntPatas'       => $cab['PUNT_PATAS'] !== null ? (float) $cab['PUNT_PATAS'] : null,
            'puntFinal'       => $cab['PUNT_FINAL'] !== null ? (float) $cab['PUNT_FINAL'] : null,
            'categoria'       => $cab['CATEGORIA'],
            'observaciones'   => $cab['OBSERVACIONES'],
            'detalle'         => array_map(fn($r) => [
                'idDetalle'    => (int) $r['ID_DETALLE'],
                'idRasgo'      => (int) $r['ID_RASGO'],
                'codigo'       => $r['CODIGO'],
                'nombre'       => $r['NOMBRE'],
                'region'       => $r['REGION'],
                'calificacion' => (int) $r['CALIFICACION'],
                'puntaje'      => $r['PUNTAJE'] !== null ? (float) $r['PUNTAJE'] : null,
                'observacion'  => $r['OBSERVACION'],
            ], $det),
            'fotos'           => array_map(fn($r) => [
                'idFoto'      => (int) $r['ID_FOTO'],
                'tipoVista'   => $r['TIPO_VISTA'],
                'descripcion' => $r['DESCRIPCION'],
                'url'         => '/api/clasificacion-lineal/foto/' . (int) $r['ID_FOTO'],
            ], $fotos),
        ]]);
    }

    // ------------------------------------------------------------------
    // Crear evaluación
    // ------------------------------------------------------------------
    #[Route('', name: 'api_clasif_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data      = json_decode($request->getContent(), true) ?? [];
        $idAnimal  = $data['idAnimal'] ?? null;
        $fecha     = $data['fechaEvaluacion'] ?? date('Y-m-d');
        $edad      = $data['edadMeses'] ?? null;
        $lact      = $data['numLactancia'] ?? null;
        $obs       = $data['observaciones'] ?? null;
        $detalleIn = $data['detalle'] ?? [];

        if (!$idAnimal) {
            return $this->json(['error' => 'idAnimal es requerido'], Response::HTTP_BAD_REQUEST);
        }
        if (!is_array($detalleIn) || count($detalleIn) === 0) {
            return $this->json(['error' => 'Debe enviar el detalle de rasgos'], Response::HTTP_BAD_REQUEST);
        }

        // Catálogo indexado por id de rasgo.
        $catalogo = [];
        foreach ($this->connection->fetchAllAssociative(
            'SELECT id_rasgo, region, pts_region FROM CLASIF_RASGO_CAT'
        ) as $r) {
            $catalogo[(int) $r['ID_RASGO']] = ['region' => $r['REGION'], 'ptsRegion' => (float) $r['PTS_REGION']];
        }

        $detalles = [];
        foreach ($detalleIn as $d) {
            $idRasgo = (int) ($d['idRasgo'] ?? 0);
            $cal     = (int) ($d['calificacion'] ?? 0);
            if (!isset($catalogo[$idRasgo])) {
                return $this->json(['error' => "Rasgo inválido: {$idRasgo}"], Response::HTTP_BAD_REQUEST);
            }
            if (!in_array($cal, [1, 2, 3], true)) {
                return $this->json(['error' => 'calificacion debe ser 1, 2 o 3'], Response::HTTP_BAD_REQUEST);
            }
            $detalles[] = ['idRasgo' => $idRasgo, 'calificacion' => $cal, 'observacion' => $d['observacion'] ?? null];
        }

        $r = $this->clasificacion->calcular($detalles, $catalogo);

        $user = $this->getUser();
        $uReg = $user instanceof User ? $user->getId() : 1;

        $this->connection->beginTransaction();
        try {
            $this->connection->executeStatement(
                "INSERT INTO EVALUACION_LINEAL
                   (id_animal, fecha_evaluacion, edad_meses, num_lactancia,
                    punt_apariencia, punt_estructura, punt_mamario, punt_patas,
                    punt_final, categoria, observaciones, usuario_registro)
                 VALUES (:ia, TO_DATE(:fec,'YYYY-MM-DD'), :ed, :lc,
                    :pap, :pes, :pma, :ppa, :pf, :cat, :obs, :ur)",
                [
                    'ia' => (int) $idAnimal, 'fec' => $fecha, 'ed' => $edad, 'lc' => $lact,
                    'pap' => $r['subtotales']['APARIENCIA'], 'pes' => $r['subtotales']['ESTRUCTURA'],
                    'pma' => $r['subtotales']['MAMARIO'], 'ppa' => $r['subtotales']['PATAS'],
                    'pf' => $r['puntFinal'], 'cat' => $r['categoria'], 'obs' => $obs, 'ur' => $uReg,
                ]
            );
            $idEval = (int) $this->connection->fetchOne(
                "SELECT id_evaluacion FROM EVALUACION_LINEAL
                  WHERE usuario_registro = :ur ORDER BY id_evaluacion DESC FETCH FIRST 1 ROWS ONLY",
                ['ur' => $uReg]
            );

            foreach ($detalles as $d) {
                $this->connection->executeStatement(
                    "INSERT INTO EVAL_LINEAL_DETALLE (id_evaluacion, id_rasgo, calificacion, puntaje, observacion)
                     VALUES (:ie, :ir, :cal, :pun, :ob)",
                    [
                        'ie' => $idEval, 'ir' => $d['idRasgo'], 'cal' => $d['calificacion'],
                        'pun' => $r['puntajes'][$d['idRasgo']] ?? 0, 'ob' => $d['observacion'],
                    ]
                );
            }

            $this->connection->commit();
        } catch (\Doctrine\DBAL\Exception $e) {
            $this->connection->rollBack();
            $msg = $e->getPrevious()?->getMessage() ?? $e->getMessage();
            preg_match('/ORA-\d+:\s*(.*?)(?:\nORA-|\z)/s', $msg, $m);
            return $this->json(['error' => trim($m[1] ?? $msg)], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            $this->auditoria->registrar(
                tabla: 'EVALUACION_LINEAL',
                operacion: 'CREAR',
                idRegistro: $idEval,
                descripcion: "Clasificación lineal {$r['categoria']} ({$r['puntFinal']} pts) animal ID {$idAnimal}",
            );
        } catch (\Throwable) {}

        return $this->json([
            'success' => true,
            'message' => 'Clasificación lineal registrada',
            'data'    => ['idEvaluacion' => $idEval] + $r,
        ], Response::HTTP_CREATED);
    }

    // ------------------------------------------------------------------
    // Subir foto de evidencia
    // ------------------------------------------------------------------
    #[Route('/{id}/foto', name: 'api_clasif_foto_upload', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function subirFoto(int $id, Request $request): JsonResponse
    {
        $existe = $this->connection->fetchOne('SELECT 1 FROM EVALUACION_LINEAL WHERE id_evaluacion = :id', ['id' => $id]);
        if (!$existe) {
            return $this->json(['error' => 'Evaluación no encontrada'], Response::HTTP_NOT_FOUND);
        }

        $tipoVista = strtoupper($request->request->get('tipoVista', ''));
        $descripcion = $request->request->get('descripcion');
        $file = $request->files->get('file');

        if (!in_array($tipoVista, self::VISTAS, true)) {
            return $this->json(['error' => 'tipoVista inválido'], Response::HTTP_BAD_REQUEST);
        }
        if (!$file) {
            return $this->json(['error' => 'No se recibió el archivo'], Response::HTTP_BAD_REQUEST);
        }
        if (!str_starts_with($file->getMimeType() ?? '', 'image/')) {
            return $this->json(['error' => 'El archivo debe ser una imagen'], Response::HTTP_BAD_REQUEST);
        }

        $dirRel = 'lineal/' . $id;
        $dirAbs = $this->uploadsDir() . '/' . $dirRel;
        if (!is_dir($dirAbs) && !mkdir($dirAbs, 0775, true) && !is_dir($dirAbs)) {
            return $this->json(['error' => 'No se pudo crear el directorio de subidas'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $ext = $file->guessExtension() ?: 'jpg';
        $nombre = uniqid($tipoVista . '_', true) . '.' . $ext;
        try {
            $file->move($dirAbs, $nombre);
        } catch (\Throwable $e) {
            return $this->json(['error' => 'Error al guardar la imagen'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $rutaRel = $dirRel . '/' . $nombre;
        $this->connection->executeStatement(
            "INSERT INTO EVAL_LINEAL_FOTO (id_evaluacion, tipo_vista, ruta_archivo, descripcion)
             VALUES (:ie, :tv, :ruta, :desc)",
            ['ie' => $id, 'tv' => $tipoVista, 'ruta' => $rutaRel, 'desc' => $descripcion]
        );
        $idFoto = (int) $this->connection->fetchOne(
            "SELECT id_foto FROM EVAL_LINEAL_FOTO WHERE id_evaluacion = :ie ORDER BY id_foto DESC FETCH FIRST 1 ROWS ONLY",
            ['ie' => $id]
        );

        return $this->json([
            'success' => true,
            'data' => ['idFoto' => $idFoto, 'tipoVista' => $tipoVista, 'url' => '/api/clasificacion-lineal/foto/' . $idFoto],
        ], Response::HTTP_CREATED);
    }

    // ------------------------------------------------------------------
    // Descargar/servir foto
    // ------------------------------------------------------------------
    #[Route('/foto/{idFoto}', name: 'api_clasif_foto_get', methods: ['GET'], requirements: ['idFoto' => '\d+'])]
    public function verFoto(int $idFoto): Response
    {
        $ruta = $this->connection->fetchOne('SELECT ruta_archivo FROM EVAL_LINEAL_FOTO WHERE id_foto = :id', ['id' => $idFoto]);
        if (!$ruta) {
            return $this->json(['error' => 'Foto no encontrada'], Response::HTTP_NOT_FOUND);
        }
        $abs = $this->uploadsDir() . '/' . $ruta;
        if (!is_file($abs)) {
            return $this->json(['error' => 'Archivo no disponible'], Response::HTTP_NOT_FOUND);
        }

        return new BinaryFileResponse($abs);
    }

    // ------------------------------------------------------------------
    // Eliminar evaluación (detalle y fotos caen por ON DELETE CASCADE;
    // los archivos en disco se borran explícitamente)
    // ------------------------------------------------------------------
    #[Route('/{id}', name: 'api_clasif_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $rutas = $this->connection->fetchFirstColumn(
            'SELECT ruta_archivo FROM EVAL_LINEAL_FOTO WHERE id_evaluacion = :id', ['id' => $id]
        );
        try {
            $this->connection->executeStatement('DELETE FROM EVALUACION_LINEAL WHERE id_evaluacion = :id', ['id' => $id]);
        } catch (\Throwable) {
            return $this->json(['error' => 'Error al eliminar la evaluación.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
        foreach ($rutas as $ruta) {
            $abs = $this->uploadsDir() . '/' . $ruta;
            if (is_file($abs)) { @unlink($abs); }
        }

        return $this->json(['success' => true, 'message' => 'Evaluación eliminada']);
    }
}
