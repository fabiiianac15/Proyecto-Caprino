<?php

namespace App\Controller;

use App\Entity\User;
use App\Service\AuditoriaService;
use App\Service\BienestarService;
use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/bienestar')]
class BienestarController extends AbstractController
{
    public function __construct(
        private Connection       $connection,
        private BienestarService $bienestar,
        private AuditoriaService $auditoria,
    ) {}

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
                    es_documental, es_binario, fuente_modulo, orden
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
            "SELECT id_evaluacion, especie, fecha_evaluacion, tipo_productor,
                    sistema_productivo, num_animales, tamano_muestra,
                    tiene_rspp, tiene_asi, punt_recursos, punt_animal,
                    punt_gestion, punt_total, clasificacion
               FROM EVALUACION_BIENESTAR
              ORDER BY fecha_evaluacion DESC"
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
                    punt_gestion, punt_total, clasificacion, observaciones
               FROM EVALUACION_BIENESTAR WHERE id_evaluacion = :id",
            ['id' => $id]
        );

        if (!$cab) {
            return $this->json(['error' => 'Evaluación no encontrada'], Response::HTTP_NOT_FOUND);
        }

        $det = $this->connection->fetchAllAssociative(
            "SELECT d.id_detalle, d.id_indicador, c.codigo, c.nombre, c.tipo_medida,
                    d.puntaje, d.aplica, d.soporte_doc, d.observacion
               FROM EVAL_BIENESTAR_DETALLE d
               JOIN BIENESTAR_INDICADOR_CAT c ON d.id_indicador = c.id_indicador
              WHERE d.id_evaluacion = :id
              ORDER BY c.orden",
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
        ], $det);

        return $this->json(['data' => $data]);
    }

    // ------------------------------------------------------------------
    // Sugerencias: autollenado desde otros módulos (FAMACHA, PESO, SALUD)
    // ------------------------------------------------------------------
    #[Route('/sugerencias', name: 'api_bienestar_sugerencias', methods: ['GET'])]
    public function sugerencias(): JsonResponse
    {
        $sug = [];

        // FAMACHA: % de animales con última evaluación en 1 o 2 (Tabla 24)
        $fam = $this->ultimoPorAnimal('FAMACHA', 'puntuacion', 'fecha_evaluacion');
        if ($fam['total'] > 0) {
            $pct = 100 * $fam['cumple'] / $fam['total'];
            $sug['FAMACHA'] = [
                'puntajeSugerido' => $this->bienestar->porcentajeAPuntaje($pct, [90, 75, 50], true),
                'info' => sprintf('%d de %d animales con FAMACHA 1-2 (%.0f%%)', $fam['cumple'], $fam['total'], $pct),
            ];
        }

        // CONDICIÓN CORPORAL: % de animales con último pesaje en CC 3-4 (Tabla 21)
        $cc = $this->ultimoPorAnimal('PESAJE', 'condicion_corporal', 'fecha_pesaje', [3, 4]);
        if ($cc['total'] > 0) {
            $pct = 100 * $cc['cumple'] / $cc['total'];
            $sug['CONDICION_CORPORAL'] = [
                'puntajeSugerido' => $this->bienestar->porcentajeAPuntaje($pct, [100, 75, 50], true),
                'info' => sprintf('%d de %d animales con condición corporal 3-4 (%.0f%%)', $cc['cumple'], $cc['total'], $pct),
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
            $sug[$codigo] = ['info' => "{$n} registro(s) relacionados en SALUD (últimos 12 meses)"];
        }

        return $this->json(['data' => $sug]);
    }

    // ------------------------------------------------------------------
    // Crear evaluación (calcula puntajes y clasificación)
    // ------------------------------------------------------------------
    #[Route('', name: 'api_bienestar_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data       = json_decode($request->getContent(), true) ?? [];
        $especie    = strtoupper($data['especie'] ?? 'CAPRINO');
        $fecha      = $data['fechaEvaluacion']   ?? date('Y-m-d');
        $tipoProd   = $data['tipoProductor']     ?? null;
        $sistema    = $data['sistemaProductivo'] ?? null;
        $numAnim    = $data['numAnimales']       ?? null;
        $muestra    = $data['tamanoMuestra']     ?? null;
        $rspp       = !empty($data['tieneRspp']) ? 1 : 0;
        $asi        = !empty($data['tieneAsi'])  ? 1 : 0;
        $obs        = $data['observaciones']     ?? null;
        $detalleIn  = $data['detalle']           ?? [];

        if (!is_array($detalleIn) || count($detalleIn) === 0) {
            return $this->json(['error' => 'Debe enviar el detalle de indicadores'], Response::HTTP_BAD_REQUEST);
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
                return $this->json(['error' => "Indicador inválido: {$idInd}"], Response::HTTP_BAD_REQUEST);
            }
            $aplica  = !array_key_exists('aplica', $d) || $d['aplica'];
            $puntaje = (int) ($d['puntaje'] ?? 0);
            if ($aplica && !in_array($puntaje, [0, 20, 55, 100], true)) {
                return $this->json(['error' => 'puntaje debe ser 0, 20, 55 o 100'], Response::HTTP_BAD_REQUEST);
            }
            $detalles[] = [
                'idIndicador' => $idInd,
                'tipoMedida'  => $cat[$idInd]['TIPO_MEDIDA'],
                'codigo'      => $cat[$idInd]['CODIGO'],
                'nombre'      => $cat[$idInd]['NOMBRE'],
                'puntaje'     => $puntaje,
                'aplica'      => $aplica,
                'soporteDoc'  => $d['soporteDoc'] ?? null,
                'observacion' => $d['observacion'] ?? null,
            ];
        }

        $r = $this->bienestar->calcular($detalles, (bool) $rspp, (bool) $asi);

        $user = $this->getUser();
        $uReg = $user instanceof User ? $user->getId() : 1;

        $this->connection->beginTransaction();
        try {
            $this->connection->executeStatement(
                "INSERT INTO EVALUACION_BIENESTAR
                   (especie, fecha_evaluacion, tipo_productor, sistema_productivo,
                    num_animales, tamano_muestra, tiene_rspp, tiene_asi,
                    punt_recursos, punt_animal, punt_gestion, punt_total,
                    clasificacion, observaciones, usuario_registro)
                 VALUES
                   (:esp, TO_DATE(:fec,'YYYY-MM-DD'), :tp, :sis, :na, :ms, :rspp, :asi,
                    :pr, :pa, :pg, :pt, :clas, :obs, :ur)",
                [
                    'esp' => $especie, 'fec' => $fecha, 'tp' => $tipoProd, 'sis' => $sistema,
                    'na' => $numAnim, 'ms' => $muestra, 'rspp' => $rspp, 'asi' => $asi,
                    'pr' => $r['puntRecursos'], 'pa' => $r['puntAnimal'], 'pg' => $r['puntGestion'],
                    'pt' => $r['puntTotal'], 'clas' => $r['clasificacion'], 'obs' => $obs, 'ur' => $uReg,
                ]
            );
            $idEval = (int) $this->connection->fetchOne(
                "SELECT id_evaluacion FROM EVALUACION_BIENESTAR
                  WHERE usuario_registro = :ur ORDER BY id_evaluacion DESC FETCH FIRST 1 ROWS ONLY",
                ['ur' => $uReg]
            );

            foreach ($detalles as $d) {
                $this->connection->executeStatement(
                    "INSERT INTO EVAL_BIENESTAR_DETALLE
                       (id_evaluacion, id_indicador, puntaje, aplica, soporte_doc, observacion)
                     VALUES (:ie, :ind, :pun, :ap, :sd, :ob)",
                    [
                        'ie' => $idEval, 'ind' => $d['idIndicador'],
                        'pun' => $d['aplica'] ? $d['puntaje'] : null,
                        'ap' => $d['aplica'] ? 1 : 0,
                        'sd' => $d['soporteDoc'], 'ob' => $d['observacion'],
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
                tabla: 'EVALUACION_BIENESTAR',
                operacion: 'CREAR',
                idRegistro: $idEval,
                descripcion: "Evaluación de bienestar {$r['clasificacion']} ({$r['puntTotal']}%)",
            );
        } catch (\Throwable) {}

        return $this->json([
            'success' => true,
            'message' => 'Evaluación de bienestar registrada',
            'data'    => [
                'idEvaluacion'  => $idEval,
                'puntRecursos'  => $r['puntRecursos'],
                'puntAnimal'    => $r['puntAnimal'],
                'puntGestion'   => $r['puntGestion'],
                'puntTotal'     => $r['puntTotal'],
                'clasificacion' => $r['clasificacion'],
                'pendientes'    => $r['pendientes'],
            ],
        ], Response::HTTP_CREATED);
    }

    // ------------------------------------------------------------------
    // Eliminar evaluación (el detalle cae por ON DELETE CASCADE)
    // ------------------------------------------------------------------
    #[Route('/{id}', name: 'api_bienestar_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        try {
            $this->connection->executeStatement(
                'DELETE FROM EVALUACION_BIENESTAR WHERE id_evaluacion = :id',
                ['id' => $id]
            );
        } catch (\Throwable) {
            return $this->json(['error' => 'Error al eliminar la evaluación.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->json(['success' => true, 'message' => 'Evaluación eliminada']);
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

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
        ];
    }
}
