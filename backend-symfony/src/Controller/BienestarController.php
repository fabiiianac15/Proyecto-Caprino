<?php

namespace App\Controller;

use App\Entity\User;
use App\Service\AuditoriaService;
use App\Service\BienestarService;
use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/bienestar')]
class BienestarController extends AbstractController
{
    private const ESTADOS = ['BORRADOR', 'FINALIZADA'];

    public function __construct(
        private Connection       $connection,
        private BienestarService $bienestar,
        private AuditoriaService $auditoria,
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
    // Catálogo de indicadores (para construir el formulario)
    // ------------------------------------------------------------------
    #[Route('/catalogo', name: 'api_bienestar_catalogo', methods: ['GET'])]
    public function catalogo(Request $request): JsonResponse
    {
        $especie = strtoupper($request->query->get('especie', 'CAPRINO'));
        $col     = $especie === 'OVINO' ? 'aplica_ovino' : 'aplica_caprino';

        $rows = $this->connection->fetchAllAssociative(
            "SELECT id_indicador, codigo, nombre, tipo_medida, solo_confinamiento,
                    es_documental, es_binario, fuente_modulo, orden,
                    referencia, pregunta, metodo, crit_100, crit_55, crit_20, crit_0,
                    medicion, corte_100, corte_55, corte_20, unidad
               FROM BIENESTAR_INDICADOR_CAT
              WHERE {$col} = 1
              ORDER BY orden"
        );

        return $this->json(['data' => array_map($this->mapIndicador(...), $rows)]);
    }

    // ------------------------------------------------------------------
    // Listado de evaluaciones
    // ------------------------------------------------------------------
    #[Route('', name: 'api_bienestar_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $rows = $this->connection->fetchAllAssociative(
            "SELECT e.id_evaluacion, e.especie, e.fecha_evaluacion, e.tipo_productor,
                    e.sistema_productivo, e.num_animales, e.tamano_muestra,
                    e.tiene_rspp, e.tiene_asi, e.punt_recursos, e.punt_animal,
                    e.punt_gestion, e.punt_total, e.clasificacion, e.evaluadores, e.estado,
                    (SELECT COUNT(*) FROM EVAL_BIENESTAR_FOTO f WHERE f.id_evaluacion = e.id_evaluacion) AS num_fotos
               FROM EVALUACION_BIENESTAR e
              ORDER BY e.fecha_evaluacion DESC, e.id_evaluacion DESC"
        );

        return $this->json(['data' => array_map($this->mapCabecera(...), $rows), 'total' => count($rows)]);
    }

    // ------------------------------------------------------------------
    // Detalle de una evaluación
    // ------------------------------------------------------------------
    #[Route('/{id}', name: 'api_bienestar_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): JsonResponse
    {
        $cab = $this->connection->fetchAssociative(
            "SELECT id_evaluacion, especie, fecha_evaluacion, tipo_productor,
                    sistema_productivo, num_animales, tamano_muestra,
                    tiene_rspp, tiene_asi, punt_recursos, punt_animal,
                    punt_gestion, punt_total, clasificacion, observaciones,
                    evaluadores, estado
               FROM EVALUACION_BIENESTAR WHERE id_evaluacion = :id",
            ['id' => $id]
        );

        if (!$cab) {
            return $this->json(['error' => 'Evaluación no encontrada'], Response::HTTP_NOT_FOUND);
        }

        $det = $this->connection->fetchAllAssociative(
            "SELECT d.id_detalle, d.id_indicador, c.codigo, c.nombre, c.tipo_medida,
                    d.puntaje, d.aplica, d.soporte_doc, d.observacion,
                    d.n_evaluados, d.n_hallazgo, c.medicion, c.unidad
               FROM EVAL_BIENESTAR_DETALLE d
               JOIN BIENESTAR_INDICADOR_CAT c ON d.id_indicador = c.id_indicador
              WHERE d.id_evaluacion = :id
              ORDER BY c.orden",
            ['id' => $id]
        );

        $fotos = $this->connection->fetchAllAssociative(
            "SELECT id_foto, id_indicador, descripcion, fecha_registro
               FROM EVAL_BIENESTAR_FOTO WHERE id_evaluacion = :id ORDER BY id_foto",
            ['id' => $id]
        );

        $data = $this->mapCabecera($cab);
        $data['observaciones'] = $cab['OBSERVACIONES'];
        $data['detalle'] = array_map(fn($r) => [
            'idDetalle'   => (int) $r['ID_DETALLE'],
            'idIndicador' => (int) $r['ID_INDICADOR'],
            'codigo'      => $r['CODIGO'],
            'nombre'      => $r['NOMBRE'],
            'tipoMedida'  => $r['TIPO_MEDIDA'],
            'puntaje'     => $r['PUNTAJE'] !== null ? (int) $r['PUNTAJE'] : null,
            'aplica'      => (bool) $r['APLICA'],
            'soporteDoc'  => $r['SOPORTE_DOC'],
            'observacion' => $r['OBSERVACION'],
            'nEvaluados'  => $r['N_EVALUADOS'] !== null ? (int) $r['N_EVALUADOS'] : null,
            'nHallazgo'   => $r['N_HALLAZGO'] !== null ? (int) $r['N_HALLAZGO'] : null,
            'medicion'    => $r['MEDICION'],
            'unidad'      => $r['UNIDAD'],
        ], $det);
        $data['fotos'] = array_map($this->mapFoto(...), $fotos);

        return $this->json(['data' => $data]);
    }

    // ------------------------------------------------------------------
    // Sugerencias: autollenado desde otros módulos (FAMACHA, PESO, SALUD)
    // ------------------------------------------------------------------
    #[Route('/sugerencias', name: 'api_bienestar_sugerencias', methods: ['GET'])]
    public function sugerencias(): JsonResponse
    {
        $sug = [];

        // Inventario actual de caprinos (para el tamaño de muestra, Tabla 1)
        $sug['_INVENTARIO'] = [
            'totalAnimales' => (int) $this->connection->fetchOne(
                "SELECT COUNT(*) FROM ANIMAL WHERE estado = 'activo'"
            ),
        ];

        // FAMACHA: animales cuya última evaluación es 1 o 2 (Tabla 24)
        $fam = $this->ultimoPorAnimal('FAMACHA', 'puntuacion', 'fecha_evaluacion');
        if ($fam['total'] > 0) {
            $sug['FAMACHA'] = [
                'nEvaluados' => $fam['total'],
                'nHallazgo'  => $fam['cumple'],
                'info' => sprintf('Desde el módulo FAMACHA: %d de %d animales con calificación 1-2', $fam['cumple'], $fam['total']),
            ];
        }

        // CONDICIÓN CORPORAL: animales cuyo último pesaje tiene CC 3-4 (Tabla 21)
        $cc = $this->ultimoPorAnimal('PESAJE', 'condicion_corporal', 'fecha_pesaje', [3, 4]);
        if ($cc['total'] > 0) {
            $sug['CONDICION_CORPORAL'] = [
                'nEvaluados' => $cc['total'],
                'nHallazgo'  => $cc['cumple'],
                'info' => sprintf('Desde el módulo de Pesaje: %d de %d animales con CC 3-4', $cc['cumple'], $cc['total']),
            ];
        }

        // SALUD: registros recientes (12 meses) como referencia informativa
        foreach ([
            'LESIONES'      => "tipo_registro = 'diagnostico'",
            'MASTITIS'      => "LOWER(enfermedad_diagnostico) LIKE '%mastitis%'",
            'ECTOPARASITOS' => "tipo_registro = 'desparasitacion' OR LOWER(enfermedad_diagnostico) LIKE '%parasit%'",
        ] as $codigo => $cond) {
            $n = (int) $this->connection->fetchOne(
                "SELECT COUNT(*) FROM SALUD
                  WHERE fecha_aplicacion >= ADD_MONTHS(SYSDATE, -12) AND ({$cond})"
            );
            $sug[$codigo] = ['info' => "{$n} registro(s) relacionados en Salud (últimos 12 meses)"];
        }

        return $this->json(['data' => $sug]);
    }

    // ------------------------------------------------------------------
    // Crear evaluación (calcula puntajes y clasificación)
    // ------------------------------------------------------------------
    #[Route('', name: 'api_bienestar_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $in = $this->leerPayload($request);
        if (isset($in['error'])) {
            return $this->json(['error' => $in['error']], Response::HTTP_BAD_REQUEST);
        }
        $r = $this->bienestar->calcular($in['detalles'], (bool) $in['rspp'], (bool) $in['asi']);

        $user = $this->getUser();
        $uReg = $user instanceof User ? $user->getId() : 1;

        $this->connection->beginTransaction();
        try {
            $this->connection->executeStatement(
                "INSERT INTO EVALUACION_BIENESTAR
                   (especie, fecha_evaluacion, tipo_productor, sistema_productivo,
                    num_animales, tamano_muestra, tiene_rspp, tiene_asi,
                    punt_recursos, punt_animal, punt_gestion, punt_total,
                    clasificacion, observaciones, evaluadores, estado, usuario_registro)
                 VALUES
                   (:esp, TO_DATE(:fec,'YYYY-MM-DD'), :tp, :sis, :na, :ms, :rspp, :asi,
                    :pr, :pa, :pg, :pt, :clas, :obs, :evs, :est, :ur)",
                $this->paramsCabecera($in, $r) + ['esp' => $in['especie'], 'ur' => $uReg]
            );
            $idEval = (int) $this->connection->fetchOne(
                "SELECT id_evaluacion FROM EVALUACION_BIENESTAR
                  WHERE usuario_registro = :ur ORDER BY id_evaluacion DESC FETCH FIRST 1 ROWS ONLY",
                ['ur' => $uReg]
            );

            $this->insertarDetalle($idEval, $in['detalles']);
            $this->connection->commit();
        } catch (\Doctrine\DBAL\Exception $e) {
            $this->connection->rollBack();
            return $this->errorOracle($e);
        }

        try {
            $this->auditoria->registrar(
                tabla: 'EVALUACION_BIENESTAR',
                operacion: 'CREAR',
                idRegistro: $idEval,
                descripcion: "Evaluación de bienestar {$r['clasificacion']} ({$r['puntTotal']}%) - {$in['estado']}",
            );
        } catch (\Throwable) {}

        return $this->json([
            'success' => true,
            'message' => 'Evaluación de bienestar registrada',
            'data'    => ['idEvaluacion' => $idEval] + $r,
        ], Response::HTTP_CREATED);
    }

    // ------------------------------------------------------------------
    // Actualizar evaluación (borradores que se completan en varias visitas)
    // ------------------------------------------------------------------
    #[Route('/{id}', name: 'api_bienestar_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $existe = $this->connection->fetchOne('SELECT 1 FROM EVALUACION_BIENESTAR WHERE id_evaluacion = :id', ['id' => $id]);
        if (!$existe) {
            return $this->json(['error' => 'Evaluación no encontrada'], Response::HTTP_NOT_FOUND);
        }

        $in = $this->leerPayload($request);
        if (isset($in['error'])) {
            return $this->json(['error' => $in['error']], Response::HTTP_BAD_REQUEST);
        }
        $r = $this->bienestar->calcular($in['detalles'], (bool) $in['rspp'], (bool) $in['asi']);

        $this->connection->beginTransaction();
        try {
            $this->connection->executeStatement(
                "UPDATE EVALUACION_BIENESTAR SET
                    fecha_evaluacion = TO_DATE(:fec,'YYYY-MM-DD'), tipo_productor = :tp,
                    sistema_productivo = :sis, num_animales = :na, tamano_muestra = :ms,
                    tiene_rspp = :rspp, tiene_asi = :asi,
                    punt_recursos = :pr, punt_animal = :pa, punt_gestion = :pg, punt_total = :pt,
                    clasificacion = :clas, observaciones = :obs, evaluadores = :evs, estado = :est,
                    fecha_modificacion = CURRENT_TIMESTAMP
                  WHERE id_evaluacion = :id",
                $this->paramsCabecera($in, $r) + ['id' => $id]
            );
            // El detalle se reemplaza completo; las fotos cuelgan del indicador y se conservan.
            $this->connection->executeStatement('DELETE FROM EVAL_BIENESTAR_DETALLE WHERE id_evaluacion = :id', ['id' => $id]);
            $this->insertarDetalle($id, $in['detalles']);
            $this->connection->commit();
        } catch (\Doctrine\DBAL\Exception $e) {
            $this->connection->rollBack();
            return $this->errorOracle($e);
        }

        try {
            $this->auditoria->registrar(
                tabla: 'EVALUACION_BIENESTAR',
                operacion: 'ACTUALIZAR',
                idRegistro: $id,
                descripcion: "Evaluación de bienestar {$r['clasificacion']} ({$r['puntTotal']}%) - {$in['estado']}",
            );
        } catch (\Throwable) {}

        return $this->json([
            'success' => true,
            'message' => 'Evaluación de bienestar actualizada',
            'data'    => ['idEvaluacion' => $id] + $r,
        ]);
    }

    // ------------------------------------------------------------------
    // Eliminar evaluación (detalle y fotos caen por ON DELETE CASCADE;
    // los archivos en disco se borran explícitamente)
    // ------------------------------------------------------------------
    #[Route('/{id}', name: 'api_bienestar_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $rutas = $this->connection->fetchFirstColumn(
            'SELECT ruta_archivo FROM EVAL_BIENESTAR_FOTO WHERE id_evaluacion = :id', ['id' => $id]
        );
        try {
            $this->connection->executeStatement(
                'DELETE FROM EVALUACION_BIENESTAR WHERE id_evaluacion = :id',
                ['id' => $id]
            );
        } catch (\Throwable) {
            return $this->json(['error' => 'Error al eliminar la evaluación.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
        foreach ($rutas as $ruta) {
            $abs = $this->uploadsDir() . '/' . $ruta;
            if (is_file($abs)) { @unlink($abs); }
        }
        @rmdir($this->uploadsDir() . '/bienestar/' . $id);

        try {
            $this->auditoria->registrar(tabla: 'EVALUACION_BIENESTAR', operacion: 'ELIMINAR', idRegistro: $id,
                descripcion: 'Evaluación de bienestar eliminada');
        } catch (\Throwable) {}

        return $this->json(['success' => true, 'message' => 'Evaluación eliminada']);
    }

    // ------------------------------------------------------------------
    // Fotos de evidencia (por indicador o generales de la visita)
    // ------------------------------------------------------------------
    #[Route('/{id}/foto', name: 'api_bienestar_foto_upload', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function subirFoto(int $id, Request $request): JsonResponse
    {
        $existe = $this->connection->fetchOne('SELECT 1 FROM EVALUACION_BIENESTAR WHERE id_evaluacion = :id', ['id' => $id]);
        if (!$existe) {
            return $this->json(['error' => 'Evaluación no encontrada'], Response::HTTP_NOT_FOUND);
        }

        $idInd = $request->request->get('idIndicador');
        $idInd = $idInd !== null && $idInd !== '' ? (int) $idInd : null;
        $descripcion = $request->request->get('descripcion');
        $file = $request->files->get('file');

        if ($idInd !== null && !$this->connection->fetchOne(
            'SELECT 1 FROM BIENESTAR_INDICADOR_CAT WHERE id_indicador = :i', ['i' => $idInd]
        )) {
            return $this->json(['error' => 'Indicador inválido'], Response::HTTP_BAD_REQUEST);
        }
        if (!$file) {
            return $this->json(['error' => 'No se recibió el archivo'], Response::HTTP_BAD_REQUEST);
        }
        if (!str_starts_with($file->getMimeType() ?? '', 'image/')) {
            return $this->json(['error' => 'El archivo debe ser una imagen'], Response::HTTP_BAD_REQUEST);
        }

        $dirRel = 'bienestar/' . $id;
        $dirAbs = $this->uploadsDir() . '/' . $dirRel;
        if (!is_dir($dirAbs) && !mkdir($dirAbs, 0775, true) && !is_dir($dirAbs)) {
            return $this->json(['error' => 'No se pudo crear el directorio de subidas'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $ext = $file->guessExtension() ?: 'jpg';
        $nombre = uniqid(($idInd ?? 'general') . '_', true) . '.' . $ext;
        try {
            $file->move($dirAbs, $nombre);
        } catch (\Throwable) {
            return $this->json(['error' => 'Error al guardar la imagen'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $this->connection->executeStatement(
            "INSERT INTO EVAL_BIENESTAR_FOTO (id_evaluacion, id_indicador, ruta_archivo, descripcion)
             VALUES (:ie, :ind, :ruta, :desc)",
            ['ie' => $id, 'ind' => $idInd, 'ruta' => $dirRel . '/' . $nombre, 'desc' => $descripcion ?: null]
        );
        $idFoto = (int) $this->connection->fetchOne(
            "SELECT id_foto FROM EVAL_BIENESTAR_FOTO WHERE id_evaluacion = :ie ORDER BY id_foto DESC FETCH FIRST 1 ROWS ONLY",
            ['ie' => $id]
        );

        return $this->json([
            'success' => true,
            'data' => ['idFoto' => $idFoto, 'idIndicador' => $idInd, 'descripcion' => $descripcion ?: null],
        ], Response::HTTP_CREATED);
    }

    #[Route('/foto/{idFoto}', name: 'api_bienestar_foto_get', methods: ['GET'], requirements: ['idFoto' => '\d+'])]
    public function verFoto(int $idFoto): Response
    {
        $ruta = $this->connection->fetchOne('SELECT ruta_archivo FROM EVAL_BIENESTAR_FOTO WHERE id_foto = :id', ['id' => $idFoto]);
        if (!$ruta) {
            return $this->json(['error' => 'Foto no encontrada'], Response::HTTP_NOT_FOUND);
        }
        $abs = $this->uploadsDir() . '/' . $ruta;
        if (!is_file($abs)) {
            return $this->json(['error' => 'Archivo no disponible'], Response::HTTP_NOT_FOUND);
        }

        return new BinaryFileResponse($abs);
    }

    #[Route('/foto/{idFoto}', name: 'api_bienestar_foto_delete', methods: ['DELETE'], requirements: ['idFoto' => '\d+'])]
    public function eliminarFoto(int $idFoto): JsonResponse
    {
        $ruta = $this->connection->fetchOne('SELECT ruta_archivo FROM EVAL_BIENESTAR_FOTO WHERE id_foto = :id', ['id' => $idFoto]);
        if (!$ruta) {
            return $this->json(['error' => 'Foto no encontrada'], Response::HTTP_NOT_FOUND);
        }
        $this->connection->executeStatement('DELETE FROM EVAL_BIENESTAR_FOTO WHERE id_foto = :id', ['id' => $idFoto]);
        $abs = $this->uploadsDir() . '/' . $ruta;
        if (is_file($abs)) { @unlink($abs); }

        return $this->json(['success' => true]);
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    /**
     * Lee y valida el cuerpo de create/update. Devuelve ['error' => ...] si no es válido.
     */
    private function leerPayload(Request $request): array
    {
        $data      = json_decode($request->getContent(), true) ?? [];
        $detalleIn = $data['detalle'] ?? [];
        $estado    = strtoupper($data['estado'] ?? 'FINALIZADA');

        if (!is_array($detalleIn) || count($detalleIn) === 0) {
            return ['error' => 'Debe enviar el detalle de indicadores'];
        }
        if (!in_array($estado, self::ESTADOS, true)) {
            $estado = 'FINALIZADA';
        }

        // Catálogo indexado por id para validar y conocer el tipo de medida.
        $cat = [];
        foreach ($this->connection->fetchAllAssociative(
            'SELECT id_indicador, codigo, nombre, tipo_medida FROM BIENESTAR_INDICADOR_CAT'
        ) as $r) {
            $cat[(int) $r['ID_INDICADOR']] = $r;
        }

        $detalles = [];
        foreach ($detalleIn as $d) {
            $idInd  = (int) ($d['idIndicador'] ?? 0);
            if (!isset($cat[$idInd])) {
                return ['error' => "Indicador inválido: {$idInd}"];
            }
            $aplica  = !array_key_exists('aplica', $d) || $d['aplica'];
            // Un borrador puede dejar indicadores sin calificar (puntaje null)
            $puntaje = isset($d['puntaje']) && $d['puntaje'] !== '' ? (int) $d['puntaje'] : null;
            if ($aplica && $puntaje === null && $estado === 'FINALIZADA') {
                return ['error' => "Falta calificar «{$cat[$idInd]['NOMBRE']}». Guárdala como borrador o califícalo."];
            }
            if ($aplica && $puntaje !== null && !in_array($puntaje, [0, 20, 55, 100], true)) {
                return ['error' => 'puntaje debe ser 0, 20, 55 o 100'];
            }
            $nEval = isset($d['nEvaluados']) && $d['nEvaluados'] !== '' ? max(0, (int) $d['nEvaluados']) : null;
            $nHall = isset($d['nHallazgo'])  && $d['nHallazgo']  !== '' ? max(0, (int) $d['nHallazgo'])  : null;
            if ($nEval !== null && $nHall !== null && $nHall > $nEval) {
                return ['error' => "En «{$cat[$idInd]['NOMBRE']}» el conteo no puede superar el total evaluado"];
            }
            $detalles[] = [
                'idIndicador' => $idInd,
                'tipoMedida'  => $cat[$idInd]['TIPO_MEDIDA'],
                'codigo'      => $cat[$idInd]['CODIGO'],
                'nombre'      => $cat[$idInd]['NOMBRE'],
                'puntaje'     => $puntaje,
                'aplica'      => $aplica,
                'soporteDoc'  => $d['soporteDoc'] ?? null,
                'observacion' => isset($d['observacion']) ? mb_substr((string) $d['observacion'], 0, 500) : null,
                'nEvaluados'  => $nEval,
                'nHallazgo'   => $nHall,
            ];
        }

        return [
            'especie'   => strtoupper($data['especie'] ?? 'CAPRINO'),
            'fecha'     => $data['fechaEvaluacion']   ?? date('Y-m-d'),
            'tipoProd'  => $data['tipoProductor']     ?? null,
            'sistema'   => $data['sistemaProductivo'] ?? null,
            'numAnim'   => $data['numAnimales']       ?? null,
            'muestra'   => $data['tamanoMuestra']     ?? null,
            'rspp'      => !empty($data['tieneRspp']) ? 1 : 0,
            'asi'       => !empty($data['tieneAsi'])  ? 1 : 0,
            'obs'       => $data['observaciones']     ?? null,
            'evaluadores' => isset($data['evaluadores']) ? (mb_substr(trim((string) $data['evaluadores']), 0, 400) ?: null) : null,
            'estado'    => $estado,
            'detalles'  => $detalles,
        ];
    }

    private function paramsCabecera(array $in, array $r): array
    {
        return [
            'fec' => $in['fecha'], 'tp' => $in['tipoProd'], 'sis' => $in['sistema'],
            'na' => $in['numAnim'], 'ms' => $in['muestra'], 'rspp' => $in['rspp'], 'asi' => $in['asi'],
            'pr' => $r['puntRecursos'], 'pa' => $r['puntAnimal'], 'pg' => $r['puntGestion'],
            'pt' => $r['puntTotal'], 'clas' => $r['clasificacion'], 'obs' => $in['obs'],
            'evs' => $in['evaluadores'], 'est' => $in['estado'],
        ];
    }

    private function insertarDetalle(int $idEval, array $detalles): void
    {
        foreach ($detalles as $d) {
            $this->connection->executeStatement(
                "INSERT INTO EVAL_BIENESTAR_DETALLE
                   (id_evaluacion, id_indicador, puntaje, aplica, soporte_doc, observacion, n_evaluados, n_hallazgo)
                 VALUES (:ie, :ind, :pun, :ap, :sd, :ob, :ne, :nh)",
                [
                    'ie' => $idEval, 'ind' => $d['idIndicador'],
                    'pun' => $d['aplica'] ? $d['puntaje'] : null,
                    'ap' => $d['aplica'] ? 1 : 0,
                    'sd' => $d['soporteDoc'], 'ob' => $d['observacion'],
                    'ne' => $d['nEvaluados'], 'nh' => $d['nHallazgo'],
                ]
            );
        }
    }

    private function errorOracle(\Doctrine\DBAL\Exception $e): JsonResponse
    {
        $msg = $e->getPrevious()?->getMessage() ?? $e->getMessage();
        preg_match('/ORA-\d+:\s*(.*?)(?:\nORA-|\z)/s', $msg, $m);
        return $this->json(['error' => trim($m[1] ?? $msg)], Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    /**
     * Cuenta animales según el último registro de una tabla por animal.
     * Devuelve ['total' => N, 'cumple' => M] donde "cumple" son los que
     * tienen el valor de $col dentro de $valoresOk (por defecto 1 o 2).
     */
    private function ultimoPorAnimal(string $tabla, string $col, string $colFecha, array $valoresOk = [1, 2]): array
    {
        $in = implode(',', array_map('intval', $valoresOk));
        $sql = "SELECT COUNT(*) AS total,
                       SUM(CASE WHEN u.val IN ({$in}) THEN 1 ELSE 0 END) AS cumple
                  FROM (
                        SELECT id_animal, {$col} AS val,
                               ROW_NUMBER() OVER (PARTITION BY id_animal ORDER BY {$colFecha} DESC) rn
                          FROM {$tabla}
                         WHERE {$col} IS NOT NULL
                       ) u
                 WHERE u.rn = 1";
        $row = $this->connection->fetchAssociative($sql);

        return [
            'total'  => (int) ($row['TOTAL'] ?? 0),
            'cumple' => (int) ($row['CUMPLE'] ?? 0),
        ];
    }

    private function mapIndicador(array $r): array
    {
        $num = fn($v) => $v !== null ? (float) $v : null;
        return [
            'idIndicador'       => (int) $r['ID_INDICADOR'],
            'codigo'            => $r['CODIGO'],
            'nombre'            => $r['NOMBRE'],
            'tipoMedida'        => $r['TIPO_MEDIDA'],
            'soloConfinamiento' => (bool) $r['SOLO_CONFINAMIENTO'],
            'esDocumental'      => (bool) $r['ES_DOCUMENTAL'],
            'esBinario'         => (bool) $r['ES_BINARIO'],
            'fuenteModulo'      => $r['FUENTE_MODULO'],
            'orden'             => (int) $r['ORDEN'],
            'referencia'        => $r['REFERENCIA'],
            'pregunta'          => $r['PREGUNTA'],
            'metodo'            => $r['METODO'],
            'criterios'         => [
                100 => $r['CRIT_100'],
                55  => $r['CRIT_55'],
                20  => $r['CRIT_20'],
                0   => $r['CRIT_0'],
            ],
            'medicion'          => $r['MEDICION'],
            'cortes'            => [100 => $num($r['CORTE_100']), 55 => $num($r['CORTE_55']), 20 => $num($r['CORTE_20'])],
            'unidad'            => $r['UNIDAD'],
        ];
    }

    private function mapFoto(array $r): array
    {
        return [
            'idFoto'      => (int) $r['ID_FOTO'],
            'idIndicador' => $r['ID_INDICADOR'] !== null ? (int) $r['ID_INDICADOR'] : null,
            'descripcion' => $r['DESCRIPCION'],
            'fecha'       => $r['FECHA_REGISTRO'],
        ];
    }

    private function mapCabecera(array $r): array
    {
        return [
            'id'                => (int) $r['ID_EVALUACION'],
            'especie'           => $r['ESPECIE'],
            'fechaEvaluacion'   => $r['FECHA_EVALUACION'],
            'tipoProductor'     => $r['TIPO_PRODUCTOR'],
            'sistemaProductivo' => $r['SISTEMA_PRODUCTIVO'],
            'numAnimales'       => $r['NUM_ANIMALES'] !== null ? (int) $r['NUM_ANIMALES'] : null,
            'tamanoMuestra'     => $r['TAMANO_MUESTRA'] !== null ? (int) $r['TAMANO_MUESTRA'] : null,
            'tieneRspp'         => (bool) $r['TIENE_RSPP'],
            'tieneAsi'          => (bool) $r['TIENE_ASI'],
            'puntRecursos'      => $r['PUNT_RECURSOS'] !== null ? (float) $r['PUNT_RECURSOS'] : null,
            'puntAnimal'        => $r['PUNT_ANIMAL'] !== null ? (float) $r['PUNT_ANIMAL'] : null,
            'puntGestion'       => $r['PUNT_GESTION'] !== null ? (float) $r['PUNT_GESTION'] : null,
            'puntTotal'         => $r['PUNT_TOTAL'] !== null ? (float) $r['PUNT_TOTAL'] : null,
            'clasificacion'     => $r['CLASIFICACION'],
            'evaluadores'       => $r['EVALUADORES'] ?? null,
            'estado'            => $r['ESTADO'] ?? 'FINALIZADA',
            'numFotos'          => isset($r['NUM_FOTOS']) ? (int) $r['NUM_FOTOS'] : null,
        ];
    }
}
