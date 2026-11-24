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
    private const VISTAS = ['FRONTAL', 'LATERAL', 'POSTERIOR', 'UBRE_POST', 'UBRE_LAT', 'PATAS', 'MEDICION', 'TESTICULOS'];
    private const SEXOS  = ['HEMBRA', 'MACHO'];

    private function sexoDe(?string $s): string
    {
        $s = strtoupper((string) $s);
        return in_array($s, self::SEXOS, true) ? $s : 'HEMBRA';
    }

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
    // Catálogo de rasgos (y de medidas, en "medidas")
    // ------------------------------------------------------------------
    #[Route('/catalogo', name: 'api_clasif_catalogo', methods: ['GET'])]
    public function catalogo(Request $request): JsonResponse
    {
        $sexo = $this->sexoDe($request->query->get('sexo'));
        $rows = $this->connection->fetchAllAssociative(
            "SELECT id_rasgo, codigo, nombre, region, pts_region, pts_rasgo, orden,
                    vista, que_mirar, desc_1, desc_2, desc_3
               FROM CLASIF_RASGO_CAT WHERE sexo = :s ORDER BY orden",
            ['s' => $sexo]
        );
        $porRegion = array_count_values(array_column($rows, 'REGION'));

        return $this->json([
            'data' => array_map(fn($r) => [
                'idRasgo'   => (int) $r['ID_RASGO'],
                'codigo'    => $r['CODIGO'],
                'nombre'    => $r['NOMBRE'],
                'region'    => $r['REGION'],
                'ptsRegion' => (float) $r['PTS_REGION'],
                'ptsRasgo'  => $r['PTS_RASGO'] !== null
                    ? (float) $r['PTS_RASGO']
                    : (float) $r['PTS_REGION'] / $porRegion[$r['REGION']],
                'orden'     => (int) $r['ORDEN'],
                'vista'     => $r['VISTA'],
                'queMirar'  => $r['QUE_MIRAR'],
                'niveles'   => [1 => $r['DESC_1'], 2 => $r['DESC_2'], 3 => $r['DESC_3']],
            ], $rows),
            'medidas' => $this->catalogoMedidas($sexo),
            'reglas'  => $this->reglas(),
            'sexo'    => $sexo,
        ]);
    }

    #[Route('/medidas/catalogo', name: 'api_clasif_medidas_catalogo', methods: ['GET'])]
    public function medidasCatalogo(Request $request): JsonResponse
    {
        $s = $request->query->get('sexo');
        return $this->json(['data' => $this->catalogoMedidas($s ? $this->sexoDe($s) : null)]);
    }

    // ------------------------------------------------------------------
    // Medidas de referencia por raza (base de las reglas morfométricas)
    // ------------------------------------------------------------------
    #[Route('/referencias', name: 'api_clasif_referencias', methods: ['GET'])]
    public function referencias(Request $request): JsonResponse
    {
        $idRaza = $request->query->get('idRaza');
        $sexo   = $request->query->get('sexo');
        $sql = "SELECT r.id_raza, z.nombre_raza, r.sexo, r.codigo_medida, r.media, r.de, r.fuente
                  FROM RAZA_MEDIDA_REF r LEFT JOIN RAZA z ON z.id_raza = r.id_raza WHERE 1 = 1";
        $p = [];
        if ($idRaza !== null && $idRaza !== '') {
            // La de la raza más la general (ubre), que aplica a todas
            $sql .= ' AND (r.id_raza = :ir OR r.id_raza IS NULL)';
            $p['ir'] = (int) $idRaza;
        }
        if ($sexo) {
            $sql .= ' AND r.sexo = :sx';
            $p['sx'] = $this->sexoDe($sexo);
        }
        $sql .= ' ORDER BY z.nombre_raza NULLS FIRST, r.sexo, r.codigo_medida';

        return $this->json(['data' => array_map(fn($r) => [
            'idRaza'  => $r['ID_RAZA'] !== null ? (int) $r['ID_RAZA'] : null,
            'raza'    => $r['NOMBRE_RAZA'] ?? 'General (todas las razas)',
            'sexo'    => $r['SEXO'],
            'codigo'  => $r['CODIGO_MEDIDA'],
            'media'   => (float) $r['MEDIA'],
            'de'      => (float) $r['DE'],
            'fuente'  => $r['FUENTE'],
        ], $this->connection->fetchAllAssociative($sql, $p))]);
    }

    /** Guarda (crea o actualiza) valores de referencia. Cuerpo: {referencias:[{idRaza,sexo,codigo,media,de,fuente}]} */
    #[Route('/referencias', name: 'api_clasif_referencias_guardar', methods: ['PUT'])]
    public function guardarReferencias(Request $request): JsonResponse
    {
        if (!$this->isGranted('ROLE_ADMIN') && !$this->isGranted('ROLE_ZOOTECNISTA') && !$this->isGranted('ROLE_VETERINARIO')) {
            return $this->json(['error' => 'Solo el docente (administrador, zootecnista o veterinario) puede cambiar las referencias'], Response::HTTP_FORBIDDEN);
        }
        $data  = json_decode($request->getContent(), true) ?? [];
        $lista = $data['referencias'] ?? [];
        $codigos = array_flip($this->connection->fetchFirstColumn('SELECT codigo FROM CLASIF_MEDIDA_CAT'));
        $n = 0;
        $this->connection->beginTransaction();
        try {
            foreach ((array) $lista as $r) {
                $cod   = (string) ($r['codigo'] ?? '');
                $media = (float) str_replace(',', '.', (string) ($r['media'] ?? 0));
                $de    = (float) str_replace(',', '.', (string) ($r['de'] ?? 0));
                $idR   = isset($r['idRaza']) && $r['idRaza'] !== '' && $r['idRaza'] !== null ? (int) $r['idRaza'] : null;
                if (!isset($codigos[$cod]) || $media <= 0 || $media >= 300 || $de <= 0 || $de >= 100) {
                    throw new \InvalidArgumentException("Valor inválido en {$cod}: el promedio y la desviación deben ser mayores que cero");
                }
                $params = ['ir' => $idR, 'sx' => $this->sexoDe($r['sexo'] ?? null), 'cod' => $cod, 'me' => round($media, 2),
                           'de' => round($de, 2), 'fu' => isset($r['fuente']) ? (mb_substr(trim((string) $r['fuente']), 0, 200) ?: null) : null];
                $this->connection->executeStatement(
                    "MERGE INTO RAZA_MEDIDA_REF t
                     USING (SELECT :ir id_raza, :sx sexo, :cod codigo_medida FROM dual) s
                        ON (NVL(t.id_raza, 0) = NVL(s.id_raza, 0) AND t.sexo = s.sexo AND t.codigo_medida = s.codigo_medida)
                     WHEN MATCHED THEN UPDATE SET t.media = :me, t.de = :de, t.fuente = NVL(:fu, t.fuente), t.fecha_modificacion = CURRENT_TIMESTAMP
                     WHEN NOT MATCHED THEN INSERT (id_raza, sexo, codigo_medida, media, de, fuente)
                          VALUES (:ir, :sx, :cod, :me, :de, :fu)",
                    $params
                );
                $n++;
            }
            $this->connection->commit();
        } catch (\InvalidArgumentException $e) {
            $this->connection->rollBack();
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (\Doctrine\DBAL\Exception $e) {
            $this->connection->rollBack();
            return $this->errorOracle($e);
        }
        try {
            $this->auditoria->registrar(tabla: 'RAZA_MEDIDA_REF', operacion: 'ACTUALIZAR', idRegistro: 0,
                descripcion: "Medidas de referencia por raza actualizadas ({$n})");
        } catch (\Throwable) {}

        return $this->json(['success' => true, 'message' => "{$n} valor(es) de referencia guardados"]);
    }

    // ------------------------------------------------------------------
    // Listado (opcionalmente por animal)
    // ------------------------------------------------------------------
    #[Route('', name: 'api_clasif_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $idAnimal = $request->query->get('idAnimal');
        $sql = "SELECT e.id_evaluacion, e.id_animal, a.nombre AS nombre_animal,
                       a.codigo_identificacion, a.sexo, e.fecha_evaluacion, e.punt_final, e.categoria,
                       (SELECT COUNT(*) FROM EVAL_LINEAL_FOTO f WHERE f.id_evaluacion = e.id_evaluacion) AS num_fotos,
                       (SELECT COUNT(*) FROM EVAL_LINEAL_MEDIDA m WHERE m.id_evaluacion = e.id_evaluacion) AS num_medidas
                  FROM EVALUACION_LINEAL e JOIN ANIMAL a ON e.id_animal = a.id_animal";
        $params = [];
        $where = [];
        if ($idAnimal) {
            $where[] = 'e.id_animal = :ia';
            $params['ia'] = (int) $idAnimal;
        }
        if ($request->query->get('sexo')) {
            $where[] = 'LOWER(a.sexo) = :sx';
            $params['sx'] = strtolower($this->sexoDe($request->query->get('sexo')));
        }
        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY e.fecha_evaluacion DESC, e.id_evaluacion DESC';

        $rows = $this->connection->fetchAllAssociative($sql, $params);

        return $this->json(['data' => array_map(fn($r) => [
            'id'              => (int) $r['ID_EVALUACION'],
            'idAnimal'        => (int) $r['ID_ANIMAL'],
            'nombreAnimal'    => $this->nombreVisible($r['NOMBRE_ANIMAL']),
            'codigoAnimal'    => $r['CODIGO_IDENTIFICACION'],
            'sexo'            => strtoupper((string) $r['SEXO']),
            'fechaEvaluacion' => $r['FECHA_EVALUACION'],
            'puntFinal'       => $r['PUNT_FINAL'] !== null ? (float) $r['PUNT_FINAL'] : null,
            'categoria'       => $r['CATEGORIA'],
            'numFotos'        => (int) $r['NUM_FOTOS'],
            'numMedidas'      => (int) $r['NUM_MEDIDAS'],
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
                    a.sexo, a.id_raza, z.nombre_raza, e.fecha_evaluacion, e.edad_meses, e.num_lactancia,
                    e.punt_apariencia, e.punt_estructura, e.punt_mamario, e.punt_patas,
                    e.punt_final, e.categoria, e.observaciones
               FROM EVALUACION_LINEAL e JOIN ANIMAL a ON e.id_animal = a.id_animal
               LEFT JOIN RAZA z ON z.id_raza = a.id_raza
              WHERE e.id_evaluacion = :id",
            ['id' => $id]
        );
        if (!$cab) {
            return $this->json(['error' => 'Evaluación no encontrada'], Response::HTTP_NOT_FOUND);
        }

        $det = $this->connection->fetchAllAssociative(
            "SELECT d.id_detalle, d.id_rasgo, c.codigo, c.nombre, c.region,
                    d.calificacion, d.puntaje, d.observacion, d.origen, c.desc_1, c.desc_2, c.desc_3
               FROM EVAL_LINEAL_DETALLE d JOIN CLASIF_RASGO_CAT c ON d.id_rasgo = c.id_rasgo
              WHERE d.id_evaluacion = :id ORDER BY c.orden",
            ['id' => $id]
        );
        $fotos = $this->connection->fetchAllAssociative(
            "SELECT id_foto, tipo_vista, ruta_archivo, descripcion
               FROM EVAL_LINEAL_FOTO WHERE id_evaluacion = :id ORDER BY id_foto",
            ['id' => $id]
        );
        $medidas = $this->connection->fetchAllAssociative(
            "SELECT c.id_medida, c.codigo, c.nombre, c.grupo, c.unidad, c.min_normal, c.max_normal, m.valor, m.metodo
               FROM EVAL_LINEAL_MEDIDA m JOIN CLASIF_MEDIDA_CAT c ON m.id_medida = c.id_medida
              WHERE m.id_evaluacion = :id ORDER BY c.orden",
            ['id' => $id]
        );
        $porCodigo = [];
        foreach ($medidas as $m) {
            $porCodigo[$m['CODIGO']] = (float) $m['VALOR'];
        }

        return $this->json(['data' => [
            'id'              => (int) $cab['ID_EVALUACION'],
            'idAnimal'        => (int) $cab['ID_ANIMAL'],
            'nombreAnimal'    => $this->nombreVisible($cab['NOMBRE_ANIMAL']),
            'codigoAnimal'    => $cab['CODIGO_IDENTIFICACION'],
            'sexo'            => strtoupper((string) $cab['SEXO']),
            'idRaza'          => $cab['ID_RAZA'] !== null ? (int) $cab['ID_RAZA'] : null,
            'nombreRaza'      => $cab['NOMBRE_RAZA'],
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
                'origen'       => $r['ORIGEN'] ?? 'VISUAL',
                'nivelTexto'   => $r['DESC_' . (int) $r['CALIFICACION']] ?? null,
            ], $det),
            'medidas'         => array_map(fn($r) => [
                'idMedida'  => (int) $r['ID_MEDIDA'],
                'codigo'    => $r['CODIGO'],
                'nombre'    => $r['NOMBRE'],
                'grupo'     => $r['GRUPO'],
                'unidad'    => $r['UNIDAD'],
                'valor'     => (float) $r['VALOR'],
                'metodo'    => $r['METODO'] ?? 'INSTRUMENTO',
                'fueraRango' => ($r['MIN_NORMAL'] !== null && (float) $r['VALOR'] < (float) $r['MIN_NORMAL'])
                             || ($r['MAX_NORMAL'] !== null && (float) $r['VALOR'] > (float) $r['MAX_NORMAL']),
            ], $medidas),
            'indices'         => $this->clasificacion->indices($porCodigo),
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
        $in = $this->leerPayload($request);
        if (isset($in['error'])) {
            return $this->json(['error' => $in['error']], Response::HTTP_BAD_REQUEST);
        }
        $r = $this->clasificacion->calcular($in['detalles'], $in['catalogo']);

        $user = $this->getUser();
        $uReg = $user instanceof User ? $user->getId() : 1;

        $this->connection->beginTransaction();
        try {
            $this->connection->executeStatement(
                "INSERT INTO EVALUACION_LINEAL
                   (id_animal, fecha_evaluacion, edad_meses, num_lactancia,
                    punt_apariencia, punt_estructura, punt_mamario, punt_patas,
                    punt_final, categoria, observaciones, sexo, usuario_registro)
                 VALUES (:ia, TO_DATE(:fec,'YYYY-MM-DD'), :ed, :lc,
                    :pap, :pes, :pma, :ppa, :pf, :cat, :obs, :sx, :ur)",
                $this->paramsCabecera($in, $r) + ['ia' => $in['idAnimal'], 'ur' => $uReg]
            );
            $idEval = (int) $this->connection->fetchOne(
                "SELECT id_evaluacion FROM EVALUACION_LINEAL
                  WHERE usuario_registro = :ur ORDER BY id_evaluacion DESC FETCH FIRST 1 ROWS ONLY",
                ['ur' => $uReg]
            );
            $this->insertarDetalle($idEval, $in['detalles'], $r);
            $this->insertarMedidas($idEval, $in['medidas']);
            $this->connection->commit();
        } catch (\Doctrine\DBAL\Exception $e) {
            $this->connection->rollBack();
            return $this->errorOracle($e);
        }

        try {
            $this->auditoria->registrar(
                tabla: 'EVALUACION_LINEAL',
                operacion: 'CREAR',
                idRegistro: $idEval,
                descripcion: "Clasificación lineal {$r['categoria']} ({$r['puntFinal']} pts) animal ID {$in['idAnimal']}",
            );
        } catch (\Throwable) {}

        return $this->json([
            'success' => true,
            'message' => 'Clasificación lineal registrada',
            'data'    => ['idEvaluacion' => $idEval] + $r,
        ], Response::HTTP_CREATED);
    }

    // ------------------------------------------------------------------
    // Editar evaluación (rasgos, medidas y datos; las fotos se conservan)
    // ------------------------------------------------------------------
    #[Route('/{id}', name: 'api_clasif_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        if (!$this->connection->fetchOne('SELECT 1 FROM EVALUACION_LINEAL WHERE id_evaluacion = :id', ['id' => $id])) {
            return $this->json(['error' => 'Evaluación no encontrada'], Response::HTTP_NOT_FOUND);
        }
        $in = $this->leerPayload($request);
        if (isset($in['error'])) {
            return $this->json(['error' => $in['error']], Response::HTTP_BAD_REQUEST);
        }
        $r = $this->clasificacion->calcular($in['detalles'], $in['catalogo']);

        $this->connection->beginTransaction();
        try {
            $this->connection->executeStatement(
                "UPDATE EVALUACION_LINEAL SET
                    id_animal = :ia, fecha_evaluacion = TO_DATE(:fec,'YYYY-MM-DD'),
                    edad_meses = :ed, num_lactancia = :lc,
                    punt_apariencia = :pap, punt_estructura = :pes, punt_mamario = :pma, punt_patas = :ppa,
                    punt_final = :pf, categoria = :cat, observaciones = :obs, sexo = :sx,
                    fecha_modificacion = CURRENT_TIMESTAMP
                  WHERE id_evaluacion = :id",
                $this->paramsCabecera($in, $r) + ['ia' => $in['idAnimal'], 'id' => $id]
            );
            $this->connection->executeStatement('DELETE FROM EVAL_LINEAL_DETALLE WHERE id_evaluacion = :id', ['id' => $id]);
            $this->connection->executeStatement('DELETE FROM EVAL_LINEAL_MEDIDA WHERE id_evaluacion = :id', ['id' => $id]);
            $this->insertarDetalle($id, $in['detalles'], $r);
            $this->insertarMedidas($id, $in['medidas']);
            $this->connection->commit();
        } catch (\Doctrine\DBAL\Exception $e) {
            $this->connection->rollBack();
            return $this->errorOracle($e);
        }

        try {
            $this->auditoria->registrar(
                tabla: 'EVALUACION_LINEAL',
                operacion: 'ACTUALIZAR',
                idRegistro: $id,
                descripcion: "Clasificación lineal {$r['categoria']} ({$r['puntFinal']} pts) animal ID {$in['idAnimal']}",
            );
        } catch (\Throwable) {}

        return $this->json([
            'success' => true,
            'message' => 'Clasificación lineal actualizada',
            'data'    => ['idEvaluacion' => $id] + $r,
        ]);
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
            ['ie' => $id, 'tv' => $tipoVista, 'ruta' => $rutaRel, 'desc' => $descripcion ? mb_substr((string) $descripcion, 0, 200) : null]
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

    #[Route('/foto/{idFoto}', name: 'api_clasif_foto_delete', methods: ['DELETE'], requirements: ['idFoto' => '\d+'])]
    public function eliminarFoto(int $idFoto): JsonResponse
    {
        $ruta = $this->connection->fetchOne('SELECT ruta_archivo FROM EVAL_LINEAL_FOTO WHERE id_foto = :id', ['id' => $idFoto]);
        if (!$ruta) {
            return $this->json(['error' => 'Foto no encontrada'], Response::HTTP_NOT_FOUND);
        }
        $this->connection->executeStatement('DELETE FROM EVAL_LINEAL_FOTO WHERE id_foto = :id', ['id' => $idFoto]);
        $abs = $this->uploadsDir() . '/' . $ruta;
        if (is_file($abs)) { @unlink($abs); }

        return $this->json(['success' => true]);
    }

    // ------------------------------------------------------------------
    // Eliminar evaluación (detalle, medidas y fotos caen por ON DELETE
    // CASCADE; los archivos en disco se borran explícitamente)
    // ------------------------------------------------------------------
    #[Route('/{id}', name: 'api_clasif_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $rutas = $this->connection->fetchFirstColumn(
            'SELECT ruta_archivo FROM EVAL_LINEAL_FOTO WHERE id_evaluacion = :id', ['id' => $id]
        );
        try {
            $n = $this->connection->executeStatement('DELETE FROM EVALUACION_LINEAL WHERE id_evaluacion = :id', ['id' => $id]);
        } catch (\Throwable) {
            return $this->json(['error' => 'Error al eliminar la evaluación.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
        if ($n === 0) {
            return $this->json(['error' => 'Evaluación no encontrada'], Response::HTTP_NOT_FOUND);
        }
        foreach ($rutas as $ruta) {
            $abs = $this->uploadsDir() . '/' . $ruta;
            if (is_file($abs)) { @unlink($abs); }
        }
        @rmdir($this->uploadsDir() . '/lineal/' . $id);

        try {
            $this->auditoria->registrar(tabla: 'EVALUACION_LINEAL', operacion: 'ELIMINAR', idRegistro: $id,
                descripcion: "Clasificación lineal eliminada");
        } catch (\Throwable) {}

        return $this->json(['success' => true, 'message' => 'Evaluación eliminada']);
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    /** Lee y valida el cuerpo de create/update. Devuelve ['error' => ...] si no es válido. */
    private function leerPayload(Request $request): array
    {
        $data      = json_decode($request->getContent(), true) ?? [];
        $idAnimal  = (int) ($data['idAnimal'] ?? 0);
        $fecha     = $data['fechaEvaluacion'] ?? date('Y-m-d');
        $detalleIn = $data['detalle'] ?? [];
        $medidasIn = $data['medidas'] ?? [];

        if (!$idAnimal) {
            return ['error' => 'Elige la cabra que se va a evaluar'];
        }
        $animal = $this->connection->fetchAssociative('SELECT sexo FROM ANIMAL WHERE id_animal = :id', ['id' => $idAnimal]);
        if (!$animal) {
            return ['error' => 'La cabra elegida no existe'];
        }
        // Hembras y machos tienen cada uno su propio catálogo de rasgos
        $sexo = strtoupper((string) $animal['SEXO']) === 'MACHO' ? 'MACHO' : 'HEMBRA';
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $fecha)) {
            return ['error' => 'Fecha inválida (use AAAA-MM-DD)'];
        }
        if ($fecha > date('Y-m-d', strtotime('+1 day'))) {
            return ['error' => 'La fecha de evaluación no puede ser futura'];
        }
        if (!is_array($detalleIn) || count($detalleIn) === 0) {
            return ['error' => 'Debe enviar el detalle de rasgos'];
        }

        $catalogo = [];
        $nombres  = [];
        foreach ($this->connection->fetchAllAssociative(
            'SELECT id_rasgo, nombre, region, pts_region, pts_rasgo FROM CLASIF_RASGO_CAT WHERE sexo = :s', ['s' => $sexo]
        ) as $r) {
            $catalogo[(int) $r['ID_RASGO']] = [
                'region'    => $r['REGION'],
                'ptsRegion' => (float) $r['PTS_REGION'],
                'ptsRasgo'  => $r['PTS_RASGO'] !== null ? (float) $r['PTS_RASGO'] : null,
            ];
            $nombres[(int) $r['ID_RASGO']] = $r['NOMBRE'];
        }

        $detalles = [];
        foreach ($detalleIn as $d) {
            $idRasgo = (int) ($d['idRasgo'] ?? 0);
            $cal     = (int) ($d['calificacion'] ?? 0);
            if (!isset($catalogo[$idRasgo])) {
                return ['error' => $sexo === 'MACHO'
                    ? 'Los rasgos enviados no son los de un macho. Vuelva a abrir la evaluación desde la sección de machos.'
                    : "Rasgo inválido: {$idRasgo}"];
            }
            if (!in_array($cal, [1, 2, 3], true)) {
                return ['error' => "Califique «{$nombres[$idRasgo]}» con 1, 2 o 3"];
            }
            $detalles[$idRasgo] = [
                'idRasgo' => $idRasgo, 'calificacion' => $cal,
                'observacion' => isset($d['observacion']) ? mb_substr((string) $d['observacion'], 0, 500) : null,
                'origen'      => strtoupper((string) ($d['origen'] ?? '')) === 'MEDIDA' ? 'MEDIDA' : 'VISUAL',
            ];
        }
        $faltan = array_diff_key($nombres, $detalles);
        if ($faltan) {
            return ['error' => 'Faltan rasgos por calificar: ' . implode(', ', $faltan)];
        }

        // Medidas: opcionales; se aceptan como lista [{codigo|idMedida, valor}] o mapa {codigo: valor}
        $catMed = [];
        foreach ($this->connection->fetchAllAssociative('SELECT id_medida, codigo, nombre FROM CLASIF_MEDIDA_CAT') as $m) {
            $catMed[$m['CODIGO']] = ['id' => (int) $m['ID_MEDIDA'], 'nombre' => $m['NOMBRE']];
        }
        $porId = array_column($catMed, null, 'id');
        if (is_array($medidasIn) && !array_is_list($medidasIn)) {
            $medidasIn = array_map(fn($k, $v) => ['codigo' => $k, 'valor' => $v], array_keys($medidasIn), $medidasIn);
        }
        $medidas = [];
        foreach ((array) $medidasIn as $m) {
            $valor = $m['valor'] ?? null;
            if ($valor === null || $valor === '') {
                continue;
            }
            $cod = $m['codigo'] ?? null;
            $idM = $cod !== null ? ($catMed[$cod]['id'] ?? null) : (isset($porId[(int) ($m['idMedida'] ?? 0)]) ? (int) $m['idMedida'] : null);
            if (!$idM) {
                return ['error' => 'Medida inválida: ' . ($cod ?? ($m['idMedida'] ?? '?'))];
            }
            $v = is_string($valor) ? (float) str_replace(',', '.', $valor) : (float) $valor;
            if ($v <= 0 || $v >= 300) {
                return ['error' => "El valor de «{$porId[$idM]['nombre']}» no es válido"];
            }
            $metodo = strtoupper((string) ($m['metodo'] ?? 'INSTRUMENTO')) === 'FOTO' ? 'FOTO' : 'INSTRUMENTO';
            $medidas[$idM] = ['valor' => round($v, 2), 'metodo' => $metodo];
        }

        return [
            'idAnimal' => $idAnimal,
            'sexo'     => $sexo,
            'fecha'    => $fecha,
            'edad'     => isset($data['edadMeses']) && $data['edadMeses'] !== '' ? max(0, (int) $data['edadMeses']) : null,
            'lact'     => isset($data['numLactancia']) && $data['numLactancia'] !== '' ? max(0, (int) $data['numLactancia']) : null,
            'obs'      => $data['observaciones'] ?? null,
            'detalles' => array_values($detalles),
            'catalogo' => $catalogo,
            'medidas'  => $medidas,
        ];
    }

    private function paramsCabecera(array $in, array $r): array
    {
        return [
            'fec' => $in['fecha'], 'ed' => $in['edad'], 'lc' => $in['lact'],
            'pap' => $r['subtotales']['APARIENCIA'], 'pes' => $r['subtotales']['ESTRUCTURA'],
            'pma' => $r['subtotales']['MAMARIO'], 'ppa' => $r['subtotales']['PATAS'],
            'pf' => $r['puntFinal'], 'cat' => $r['categoria'], 'obs' => $in['obs'], 'sx' => $in['sexo'],
        ];
    }

    private function insertarDetalle(int $idEval, array $detalles, array $r): void
    {
        foreach ($detalles as $d) {
            $this->connection->executeStatement(
                "INSERT INTO EVAL_LINEAL_DETALLE (id_evaluacion, id_rasgo, calificacion, puntaje, observacion, origen)
                 VALUES (:ie, :ir, :cal, :pun, :ob, :org)",
                [
                    'ie' => $idEval, 'ir' => $d['idRasgo'], 'cal' => $d['calificacion'],
                    'pun' => $r['puntajes'][$d['idRasgo']] ?? 0, 'ob' => $d['observacion'], 'org' => $d['origen'],
                ]
            );
        }
    }

    private function insertarMedidas(int $idEval, array $medidas): void
    {
        foreach ($medidas as $idM => $m) {
            $this->connection->executeStatement(
                'INSERT INTO EVAL_LINEAL_MEDIDA (id_evaluacion, id_medida, valor, metodo) VALUES (:ie, :im, :v, :me)',
                ['ie' => $idEval, 'im' => $idM, 'v' => $m['valor'], 'me' => $m['metodo']]
            );
        }
    }

    private function reglas(): array
    {
        $num = fn($v) => $v !== null ? (float) $v : null;
        return array_map(fn($r) => [
            'codigoRasgo' => $r['CODIGO_RASGO'],
            'calculo'     => $r['CALCULO'],
            'tipo'        => $r['TIPO'],
            'sentido'     => $r['SENTIDO'],
            'k'           => (float) $r['K'],
            'corteBajo'   => $num($r['CORTE_BAJO']),
            'corteAlto'   => $num($r['CORTE_ALTO']),
            'explicacion' => $r['EXPLICACION'],
        ], $this->connection->fetchAllAssociative(
            'SELECT codigo_rasgo, calculo, tipo, sentido, k, corte_bajo, corte_alto, explicacion FROM CLASIF_REGLA_MORFO'
        ));
    }

    private function catalogoMedidas(?string $sexo = null): array
    {
        $num = fn($v) => $v !== null ? (float) $v : null;
        return array_map(fn($r) => [
            'idMedida'    => (int) $r['ID_MEDIDA'],
            'codigo'      => $r['CODIGO'],
            'nombre'      => $r['NOMBRE'],
            'grupo'       => $r['GRUPO'],
            'unidad'      => $r['UNIDAD'],
            'instrumento' => $r['INSTRUMENTO'],
            'comoMedir'   => $r['COMO_MEDIR'],
            'minNormal'   => $num($r['MIN_NORMAL']),
            'maxNormal'   => $num($r['MAX_NORMAL']),
            'rasgoRel'    => $r['RASGO_REL'],
            'sexo'        => $r['SEXO'],
            'orden'       => (float) $r['ORDEN'],
        ], $this->connection->fetchAllAssociative(
            'SELECT id_medida, codigo, nombre, grupo, unidad, instrumento, como_medir,
                    min_normal, max_normal, rasgo_rel, orden, sexo
               FROM CLASIF_MEDIDA_CAT' . ($sexo ? " WHERE sexo IN ('AMBOS', :s)" : '') . ' ORDER BY orden',
            $sexo ? ['s' => $sexo] : []
        ));
    }

    /** Las cabras sin nombre se registraron con "." o "-": se tratan como sin nombre. */
    private function nombreVisible(?string $n): ?string
    {
        $n = trim((string) $n);
        return ($n === '' || preg_match('/^[.\-_ ]+$/', $n)) ? null : $n;
    }

    private function errorOracle(\Doctrine\DBAL\Exception $e): JsonResponse
    {
        $msg = $e->getPrevious()?->getMessage() ?? $e->getMessage();
        preg_match('/ORA-\d+:\s*(.*?)(?:\nORA-|\z)/s', $msg, $m);
        return $this->json(['error' => trim($m[1] ?? $msg)], Response::HTTP_UNPROCESSABLE_ENTITY);
    }
}
