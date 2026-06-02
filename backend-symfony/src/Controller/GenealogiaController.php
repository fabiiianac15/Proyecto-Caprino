<?php

namespace App\Controller;

use App\Service\AuditoriaService;
use App\Service\MlService;
use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/genealogia')]
class GenealogiaController extends AbstractController
{
    public function __construct(
        private Connection $connection,
        private AuditoriaService $auditoria,
        private MlService $ml,
    ) {}

    #[Route('/{id}', name: 'api_genealogia_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): JsonResponse
    {
        $row = $this->connection->fetchAssociative(
            "SELECT g.id_genealogia, g.id_animal, g.id_padre, g.id_madre,
                    g.generacion, g.coeficiente_consanguinidad, g.observaciones,
                    a.nombre as nombre_animal, a.codigo_identificacion,
                    p.nombre as nombre_padre, p.codigo_identificacion as codigo_padre,
                    m.nombre as nombre_madre, m.codigo_identificacion as codigo_madre
             FROM GENEALOGIA g
             JOIN ANIMAL a ON g.id_animal = a.id_animal
             LEFT JOIN ANIMAL p ON g.id_padre = p.id_animal
             LEFT JOIN ANIMAL m ON g.id_madre = m.id_animal
             WHERE g.id_animal = :id",
            ['id' => $id]
        );

        if (!$row) {
            $animal = $this->connection->fetchAssociative(
                'SELECT nombre, codigo_identificacion FROM ANIMAL WHERE id_animal = :id',
                ['id' => $id]
            );

            return $this->json(['data' => [
                'animal' => $animal ? ['id' => $id, 'nombre' => $animal['NOMBRE'], 'codigo' => $animal['CODIGO_IDENTIFICACION']] : null,
                'padre'  => null,
                'madre'  => null,
            ]]);
        }

        return $this->json(['data' => [
            'animal' => ['id' => $id, 'nombre' => $row['NOMBRE_ANIMAL'], 'codigo' => $row['CODIGO_IDENTIFICACION']],
            'padre'  => $row['ID_PADRE'] !== null ? ['id' => (int) $row['ID_PADRE'], 'nombre' => $row['NOMBRE_PADRE'], 'codigo' => $row['CODIGO_PADRE']] : null,
            'madre'  => $row['ID_MADRE'] !== null ? ['id' => (int) $row['ID_MADRE'], 'nombre' => $row['NOMBRE_MADRE'], 'codigo' => $row['CODIGO_MADRE']] : null,
            'generacion'                => $row['GENERACION'] !== null ? (int) $row['GENERACION'] : null,
            'coeficienteConsanguinidad' => $row['COEFICIENTE_CONSANGUINIDAD'] !== null ? (float) $row['COEFICIENTE_CONSANGUINIDAD'] : null,
        ]]);
    }

    #[Route('', name: 'api_genealogia_upsert', methods: ['POST'])]
    public function upsert(Request $request): JsonResponse
    {
        $data     = json_decode($request->getContent(), true) ?? [];
        $idAnimal = $data['idAnimal'] ?? null;
        $idPadre  = $data['idPadre'] ?? null;
        $idMadre  = $data['idMadre'] ?? null;
        $obs      = $data['observaciones'] ?? null;

        if (!$idAnimal) {
            return $this->json(['error' => 'Campo requerido: idAnimal'], Response::HTTP_BAD_REQUEST);
        }

        $count = (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM GENEALOGIA WHERE id_animal = :id',
            ['id' => $idAnimal]
        );

        if ($count > 0) {
            $oldRow = $this->connection->fetchAssociative(
                'SELECT * FROM GENEALOGIA WHERE id_animal = :id',
                ['id' => $idAnimal]
            );

            try {
                $this->connection->executeStatement(
                    'UPDATE GENEALOGIA SET id_padre = :p, id_madre = :m, observaciones = NVL(:obs, observaciones) WHERE id_animal = :id',
                    ['p' => $idPadre, 'm' => $idMadre, 'obs' => $obs, 'id' => $idAnimal]
                );
            } catch (\Doctrine\DBAL\Exception $e) {
                $msg = $e->getPrevious()?->getMessage() ?? $e->getMessage();
                preg_match('/ORA-\d+:\s*(.*?)(?:\nORA-|\z)/s', $msg, $m);
                return $this->json(['error' => trim($m[1] ?? $msg)], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            try {
                $this->auditoria->registrar(
                    tabla: 'GENEALOGIA',
                    operacion: 'ACTUALIZAR',
                    idRegistro: (int) $idAnimal,
                    descripcion: "Actualización de genealogía para animal ID {$idAnimal}",
                    datosAnt: $oldRow ?: [],
                    datosNuevos: [
                        'idAnimal'     => $idAnimal,
                        'idPadre'      => $idPadre,
                        'idMadre'      => $idMadre,
                        'observaciones'=> $obs,
                    ],
                );
            } catch (\Throwable) {}
        } else {
            try {
                $this->connection->executeStatement(
                    'INSERT INTO GENEALOGIA (id_animal, id_padre, id_madre, observaciones) VALUES (:id, :p, :m, :obs)',
                    ['id' => $idAnimal, 'p' => $idPadre, 'm' => $idMadre, 'obs' => $obs]
                );
            } catch (\Doctrine\DBAL\Exception $e) {
                $msg = $e->getPrevious()?->getMessage() ?? $e->getMessage();
                preg_match('/ORA-\d+:\s*(.*?)(?:\nORA-|\z)/s', $msg, $m);
                return $this->json(['error' => trim($m[1] ?? $msg)], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            try {
                $this->auditoria->registrar(
                    tabla: 'GENEALOGIA',
                    operacion: 'CREAR',
                    idRegistro: (int) $idAnimal,
                    descripcion: "Registro de genealogía para animal ID {$idAnimal}",
                    datosNuevos: [
                        'idAnimal'     => $idAnimal,
                        'idPadre'      => $idPadre,
                        'idMadre'      => $idMadre,
                        'observaciones'=> $obs,
                    ],
                );
            } catch (\Throwable) {}
        }

        return $this->json(['success' => true, 'message' => 'Genealogía actualizada']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/genealogia/compatibilidad
    // Evalúa compatibilidad de cruce macho+hembra usando el microservicio ML
    // ─────────────────────────────────────────────────────────────────────────
    #[Route('/compatibilidad', name: 'api_genealogia_compatibilidad', methods: ['POST'])]
    public function compatibilidad(Request $request): JsonResponse
    {
        $data           = json_decode($request->getContent(), true) ?? [];
        $idMacho        = isset($data['idMacho'])  ? (int) $data['idMacho']  : null;
        $idHembra       = isset($data['idHembra']) ? (int) $data['idHembra'] : null;
        $fechaRef       = $data['fechaReferencia'] ?? date('Y-m-d');

        if (!$idMacho || !$idHembra) {
            return $this->json(
                ['error' => 'Se requieren idMacho e idHembra'],
                Response::HTTP_BAD_REQUEST
            );
        }

        if ($idMacho === $idHembra) {
            return $this->json(
                ['error' => 'El macho y la hembra no pueden ser el mismo animal'],
                Response::HTTP_BAD_REQUEST
            );
        }

        // ── Recolectar datos reales del cruce ─────────────────────────────────
        $rec = $this->recolectarDatosCruce($idMacho, $idHembra, $fechaRef);
        if (!$rec['ok']) {
            return $this->json(['error' => $rec['error']], $rec['code']);
        }

        // ── Evaluación multidimensional fundamentada (motor en ml-service) ────
        $eval = $this->ml->evaluar($rec['datos'], $rec['features']);
        if (!$eval['ok']) {
            return $this->json(
                ['error' => 'Servicio ML no disponible', 'detalle' => $eval['error']],
                Response::HTTP_SERVICE_UNAVAILABLE
            );
        }

        // ── Auditoría ─────────────────────────────────────────────────────────
        try {
            $this->auditoria->registrar(
                tabla: 'GENEALOGIA_COMPATIBILIDAD',
                operacion: 'CONSULTAR',
                idRegistro: $idMacho,
                descripcion: "Evaluación de cruce macho $idMacho × hembra $idHembra",
                datosNuevos: [
                    'idMacho'       => $idMacho,
                    'idHembra'      => $idHembra,
                    'scoreGlobal'   => $eval['data']['scoreGlobal'] ?? null,
                    'clasificacion' => $eval['data']['clasificacion'] ?? null,
                ],
            );
        } catch (\Throwable) {}

        return $this->json([
            'animales'   => $rec['animales'],
            'evaluacion' => $eval['data'],
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/genealogia/analisis-ia
    // Genera la interpretación en lenguaje natural (IA generativa local) en
    // streaming. El modelo ML hace la predicción; la IA solo la redacta.
    // ─────────────────────────────────────────────────────────────────────────
    #[Route('/analisis-ia', name: 'api_genealogia_analisis_ia', methods: ['POST'])]
    public function analisisIa(Request $request): Response
    {
        $data     = json_decode($request->getContent(), true) ?? [];
        $idMacho  = isset($data['idMacho'])  ? (int) $data['idMacho']  : null;
        $idHembra = isset($data['idHembra']) ? (int) $data['idHembra'] : null;
        $fechaRef = $data['fechaReferencia'] ?? date('Y-m-d');

        if (!$idMacho || !$idHembra || $idMacho === $idHembra) {
            return $this->json(['error' => 'Se requieren idMacho e idHembra distintos'], Response::HTTP_BAD_REQUEST);
        }

        // 1. Recolectar datos reales del cruce
        $rec = $this->recolectarDatosCruce($idMacho, $idHembra, $fechaRef);
        if (!$rec['ok']) {
            return $this->json(['error' => $rec['error']], $rec['code']);
        }

        // 2. Evaluación multidimensional (la IA NO evalúa, solo la narra)
        $eval = $this->ml->evaluar($rec['datos'], $rec['features']);
        if (!$eval['ok']) {
            return $this->json(
                ['error' => 'Servicio ML no disponible', 'detalle' => $eval['error']],
                Response::HTTP_SERVICE_UNAVAILABLE
            );
        }

        // 3. Retransmitir el stream de la IA al navegador token a token
        $ml         = $this->ml;
        $evaluacion = $eval['data'];
        $animales   = $rec['animales'];

        $response = new StreamedResponse(function () use ($ml, $evaluacion, $animales) {
            $ok = $ml->analisisIaStream($evaluacion, $animales, function (string $chunk) {
                echo $chunk;
                if (function_exists('ob_get_level') && ob_get_level() > 0) {
                    @ob_flush();
                }
                flush();
            });
            if (!$ok) {
                echo "\n\n_No se pudo conectar con el asistente de IA. "
                   . "Consulta el panel de resultados del modelo._";
            }
        });
        $response->headers->set('Content-Type', 'text/plain; charset=utf-8');
        $response->headers->set('X-Accel-Buffering', 'no');   // evita buffering en Nginx
        $response->headers->set('Cache-Control', 'no-cache');

        return $response;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/genealogia/ranking
    // Dado un animal, evalúa todos los candidatos del sexo opuesto y los ordena
    // por compatibilidad (inferencia ML en lote). Apoyo a la decisión de monta.
    // ─────────────────────────────────────────────────────────────────────────
    #[Route('/ranking', name: 'api_genealogia_ranking', methods: ['POST'])]
    public function ranking(Request $request): JsonResponse
    {
        $data     = json_decode($request->getContent(), true) ?? [];
        $idAnimal = isset($data['idAnimal']) ? (int) $data['idAnimal'] : null;
        $limite   = isset($data['limite']) ? max(1, (int) $data['limite']) : 10;
        $mismaRaza = (bool) ($data['soloMismaRaza'] ?? false);
        $fechaRef = $data['fechaReferencia'] ?? date('Y-m-d');

        if (!$idAnimal) {
            return $this->json(['error' => 'Se requiere idAnimal'], Response::HTTP_BAD_REQUEST);
        }

        $base = $this->fetchAnimal($idAnimal);
        if (!$base) {
            return $this->json(['error' => "Animal (ID $idAnimal) no encontrado"], Response::HTTP_NOT_FOUND);
        }

        $sexoBase     = strtolower((string) $base['SEXO']);
        $sexoOpuesto  = $sexoBase === 'hembra' ? 'macho' : 'hembra';
        $candidatos   = $this->fetchCandidatos($sexoOpuesto, $mismaRaza ? (int) $base['ID_RAZA'] : null);

        // Recolectar los datos reales de cada par (mismo motor que el análisis
        // individual → el score del ranking COINCIDE con el detallado).
        $items = [];
        $meta  = [];
        foreach ($candidatos as $c) {
            $idMacho  = $sexoBase === 'macho'  ? $idAnimal : (int) $c['ID_ANIMAL'];
            $idHembra = $sexoBase === 'hembra' ? $idAnimal : (int) $c['ID_ANIMAL'];

            $rec = $this->recolectarDatosCruce($idMacho, $idHembra, $fechaRef);
            if (!$rec['ok']) {
                continue;   // omite pares inválidos (sin datos, etc.)
            }
            $items[] = ['datos' => $rec['datos'], 'ml_features' => array_values($rec['features'])];
            $meta[]  = [
                'candidato' => [
                    'id'     => (int) $c['ID_ANIMAL'],
                    'nombre' => $c['NOMBRE'],
                    'codigo' => $c['CODIGO_IDENTIFICACION'],
                    'raza'   => $c['NOMBRE_RAZA'] ?? null,
                ],
                'coi' => $rec['datos']['consanguinidad']['coi_aprox'] ?? 0,
            ];
        }

        if (!$items) {
            return $this->json(['base' => $this->resumenAnimal($base), 'ranking' => []]);
        }

        // Evaluación multidimensional en lote (mismo motor → score global)
        $batch = $this->ml->evaluarBatch($items);
        if (!$batch['ok']) {
            return $this->json(
                ['error' => 'Servicio ML no disponible', 'detalle' => $batch['error']],
                Response::HTTP_SERVICE_UNAVAILABLE
            );
        }

        $resultados = $batch['data']['resultados'] ?? [];
        $ranking = [];
        foreach ($resultados as $i => $r) {
            $ranking[] = array_merge($meta[$i], [
                'score'              => $r['scoreGlobal'],
                'clasificacion'      => $r['clasificacion'],
                'confianza'          => $r['confianzaGlobal'],
                'nivelConsanguinidad'=> $r['nivelConsanguinidad'] ?? null,
                'nivelFertilidad'    => $r['nivelFertilidad'] ?? null,
            ]);
        }

        // Ordenar por score descendente y recortar
        usort($ranking, fn ($a, $b) => $b['score'] <=> $a['score']);
        $ranking = array_slice($ranking, 0, $limite);

        return $this->json([
            'base'    => $this->resumenAnimal($base),
            'total'   => count($resultados),
            'ranking' => $ranking,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/genealogia/ranking/analisis-ia
    // Resumen comparativo del ranking redactado por la IA (streaming).
    // ─────────────────────────────────────────────────────────────────────────
    #[Route('/ranking/analisis-ia', name: 'api_genealogia_ranking_ia', methods: ['POST'])]
    public function rankingAnalisisIa(Request $request): Response
    {
        $data     = json_decode($request->getContent(), true) ?? [];
        $idAnimal = isset($data['idAnimal']) ? (int) $data['idAnimal'] : null;
        $fechaRef = $data['fechaReferencia'] ?? date('Y-m-d');
        $mismaRaza = (bool) ($data['soloMismaRaza'] ?? false);

        if (!$idAnimal) {
            return $this->json(['error' => 'Se requiere idAnimal'], Response::HTTP_BAD_REQUEST);
        }

        // Reconstruir el ranking server-side (no se confía en datos del cliente)
        $rankReq = new Request([], [], [], [], [], [], json_encode([
            'idAnimal' => $idAnimal, 'limite' => 5,
            'soloMismaRaza' => $mismaRaza, 'fechaReferencia' => $fechaRef,
        ]));
        $rankResp = $this->ranking($rankReq);
        $payload  = json_decode($rankResp->getContent(), true) ?? [];

        if (empty($payload['ranking'])) {
            return $this->json(['error' => 'No hay candidatos suficientes para analizar'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $ml = $this->ml;
        $iaPayload = ['animal_base' => $payload['base'], 'ranking' => $payload['ranking']];

        $response = new StreamedResponse(function () use ($ml, $iaPayload) {
            $ok = $ml->analisisRankingStream($iaPayload, function (string $chunk) {
                echo $chunk;
                if (function_exists('ob_get_level') && ob_get_level() > 0) {
                    @ob_flush();
                }
                flush();
            });
            if (!$ok) {
                echo "\n\n_No se pudo conectar con el asistente de IA._";
            }
        });
        $response->headers->set('Content-Type', 'text/plain; charset=utf-8');
        $response->headers->set('X-Accel-Buffering', 'no');
        $response->headers->set('Cache-Control', 'no-cache');

        return $response;
    }

    // ─── Helpers privados ────────────────────────────────────────────────────

    /** Resumen compacto de un animal para las respuestas. */
    private function resumenAnimal(array $a): array
    {
        return [
            'id'     => (int) $a['ID_ANIMAL'],
            'nombre' => $a['NOMBRE'] ?? null,
            'codigo' => $a['CODIGO_IDENTIFICACION'] ?? null,
            'sexo'   => $a['SEXO'] ?? null,
            'raza'   => $this->nombreRaza($a['ID_RAZA'] ?? null),
        ];
    }

    /** Animales activos del sexo indicado (candidatos para el ranking). */
    private function fetchCandidatos(string $sexo, ?int $idRaza = null): array
    {
        $sql = "SELECT a.id_animal, a.nombre, a.codigo_identificacion, a.id_raza,
                       r.nombre_raza
                FROM ANIMAL a
                LEFT JOIN RAZA r ON a.id_raza = r.id_raza
                WHERE LOWER(a.sexo) = :sexo AND a.estado = 'activo'";
        $params = ['sexo' => strtolower($sexo)];
        if ($idRaza !== null) {
            $sql .= ' AND a.id_raza = :raza';
            $params['raza'] = $idRaza;
        }
        $rows = $this->connection->fetchAllAssociative($sql, $params);
        return array_map(
            fn ($r) => [
                'ID_ANIMAL'             => $r['ID_ANIMAL'],
                'NOMBRE'                => $r['NOMBRE'],
                'CODIGO_IDENTIFICACION' => $r['CODIGO_IDENTIFICACION'],
                'ID_RAZA'               => $r['ID_RAZA'],
                'NOMBRE_RAZA'           => $r['NOMBRE_RAZA'] ?? null,
            ],
            $rows
        );
    }

    /**
     * Recolecta TODOS los datos reales del cruce desde Oracle y arma el payload
     * para el motor de evaluación multidimensional. Cada dimensión se fundamenta
     * en estos registros. Devuelve también las 15 features para el RandomForest.
     *
     * @return array{ok:bool, code:int, error:?string, datos:array, features:array, animales:array}
     */
    private function recolectarDatosCruce(int $idMacho, int $idHembra, string $fechaRef): array
    {
        $prep = $this->prepararDatosCruce($idMacho, $idHembra, $fechaRef);
        if (!$prep['ok']) {
            return ['ok' => false, 'code' => $prep['code'], 'error' => $prep['error'],
                    'datos' => [], 'features' => [], 'animales' => []];
        }
        $f   = $prep['features'];
        $ctx = $prep['contexto'];

        $macho  = $this->fetchAnimal($idMacho);
        $hembra = $this->fetchAnimal($idHembra);
        $infoM  = $this->infoRaza((int) ($macho['ID_RAZA'] ?? 0));
        $infoH  = $this->infoRaza((int) ($hembra['ID_RAZA'] ?? 0));

        $datos = [
            'macho' => [
                'id' => $idMacho, 'nombre' => $macho['NOMBRE'] ?? null,
                'codigo' => $macho['CODIGO_IDENTIFICACION'] ?? null,
                'edad_meses' => $ctx['edad_macho_meses'], 'raza_nombre' => $ctx['raza_macho'],
                'aptitud' => $infoM['aptitud'], 'raza_leche_dia' => $infoM['leche_dia'],
                'generaciones' => $ctx['generaciones_macho'],
                'condicion_corporal' => $this->condicionCorporal($idMacho),
            ],
            'hembra' => [
                'id' => $idHembra, 'nombre' => $hembra['NOMBRE'] ?? null,
                'codigo' => $hembra['CODIGO_IDENTIFICACION'] ?? null,
                'edad_meses' => $ctx['edad_hembra_meses'], 'raza_nombre' => $ctx['raza_hembra'],
                'aptitud' => $infoH['aptitud'], 'raza_leche_dia' => $infoH['leche_dia'],
                'generaciones' => $ctx['generaciones_hembra'],
                'condicion_corporal' => $this->condicionCorporal($idHembra),
            ],
            'consanguinidad' => [
                'coi_aprox'         => $ctx['coi_descendencia_aprox'],
                'ancestros_comunes' => $ctx['ancestros_comunes'],
                'relacion_directa'  => (bool) $f['relacion_directa'],
                'mismos_padres'     => (bool) $f['mismos_padres_completos'],
                'mismo_padre'       => (bool) $f['mismo_padre'],
                'misma_madre'       => (bool) $f['misma_madre'],
            ],
            'produccion_hembra'   => $this->produccionLeche($idHembra),
            'reproduccion_hembra' => $this->reproduccionHembraDetalle($idHembra),
            'reproduccion_macho'  => $this->reproduccionMacho($idMacho),
            'salud_macho'         => $this->saludDetalle($idMacho),
            'salud_hembra'        => $this->saludDetalle($idHembra),
        ];

        $animales = [
            'macho'  => ['nombre' => $macho['NOMBRE'] ?? null,  'codigo' => $macho['CODIGO_IDENTIFICACION'] ?? null],
            'hembra' => ['nombre' => $hembra['NOMBRE'] ?? null, 'codigo' => $hembra['CODIGO_IDENTIFICACION'] ?? null],
        ];

        return ['ok' => true, 'code' => 200, 'error' => null,
                'datos' => $datos, 'features' => $f, 'animales' => $animales];
    }

    /** Aptitud y potencial lechero de una raza. */
    private function infoRaza(int $idRaza): array
    {
        if ($idRaza <= 0) {
            return ['aptitud' => null, 'leche_dia' => null];
        }
        $row = $this->connection->fetchAssociative(
            'SELECT aptitud, produccion_leche_dia_promedio FROM RAZA WHERE id_raza = :id',
            ['id' => $idRaza]
        );
        return [
            'aptitud'   => $row['APTITUD'] ?? null,
            'leche_dia' => isset($row['PRODUCCION_LECHE_DIA_PROMEDIO']) && $row['PRODUCCION_LECHE_DIA_PROMEDIO'] !== null
                ? (float) $row['PRODUCCION_LECHE_DIA_PROMEDIO'] : null,
        ];
    }

    /** Última condición corporal registrada (escala 1-5). */
    private function condicionCorporal(int $id): ?float
    {
        $v = $this->connection->fetchOne(
            'SELECT condicion_corporal FROM PESAJE
             WHERE id_animal = :id AND condicion_corporal IS NOT NULL
             ORDER BY fecha_pesaje DESC FETCH FIRST 1 ROWS ONLY',
            ['id' => $id]
        );
        return ($v !== false && $v !== null) ? (float) $v : null;
    }

    /** Promedios de producción de leche y calidad de la hembra. */
    private function produccionLeche(int $id): array
    {
        $row = $this->connection->fetchAssociative(
            'SELECT COUNT(*) AS n, AVG(litros) AS litros, AVG(grasa_porcentaje) AS grasa,
                    AVG(proteina_porcentaje) AS prot, AVG(celulas_somaticas) AS cs
             FROM PRODUCCION_LECHE WHERE id_animal = :id',
            ['id' => $id]
        );
        $n = (int) ($row['N'] ?? 0);
        return [
            'n_registros'            => $n,
            'litros_promedio'        => ($n > 0 && $row['LITROS'] !== null) ? round((float) $row['LITROS'], 2) : null,
            'grasa_prom'             => $row['GRASA'] !== null ? round((float) $row['GRASA'], 2) : null,
            'proteina_prom'          => $row['PROT'] !== null ? round((float) $row['PROT'], 2) : null,
            'celulas_somaticas_prom' => $row['CS'] !== null ? (int) round((float) $row['CS']) : null,
        ];
    }

    /** Historial reproductivo detallado de la hembra. */
    private function reproduccionHembraDetalle(int $id): array
    {
        $row = $this->connection->fetchAssociative(
            "SELECT
                SUM(CASE WHEN resultado != 'pendiente' THEN 1 ELSE 0 END) AS total,
                SUM(CASE WHEN resultado = 'exitoso'    THEN 1 ELSE 0 END) AS exitosos,
                SUM(CASE WHEN resultado = 'aborto'     THEN 1 ELSE 0 END) AS abortos,
                SUM(CASE WHEN resultado = 'mortinato'  THEN 1 ELSE 0 END) AS mortinatos,
                AVG(CASE WHEN resultado = 'exitoso' THEN numero_crias END) AS crias
             FROM REPRODUCCION WHERE id_hembra = :id",
            ['id' => $id]
        );
        return [
            'total_partos'   => (int) ($row['TOTAL'] ?? 0),
            'exitosos'       => (int) ($row['EXITOSOS'] ?? 0),
            'abortos'        => (int) ($row['ABORTOS'] ?? 0),
            'mortinatos'     => (int) ($row['MORTINATOS'] ?? 0),
            'crias_promedio' => $row['CRIAS'] !== null ? round((float) $row['CRIAS'], 2) : null,
        ];
    }

    /** Historial de servicios del macho (como reproductor). */
    private function reproduccionMacho(int $id): array
    {
        $row = $this->connection->fetchAssociative(
            "SELECT SUM(CASE WHEN resultado != 'pendiente' THEN 1 ELSE 0 END) AS serv,
                    SUM(CASE WHEN resultado = 'exitoso'    THEN 1 ELSE 0 END) AS ok
             FROM REPRODUCCION WHERE id_macho = :id",
            ['id' => $id]
        );
        return ['servicios' => (int) ($row['SERV'] ?? 0), 'exitosos' => (int) ($row['OK'] ?? 0)];
    }

    /** Resumen sanitario: eventos recientes y diagnósticos de enfermedad. */
    private function saludDetalle(int $id): array
    {
        $ev12 = (int) $this->connection->fetchOne(
            "SELECT COUNT(*) FROM SALUD
             WHERE id_animal = :id AND fecha_aplicacion >= ADD_MONTHS(SYSDATE, -12)",
            ['id' => $id]
        );
        $diags = $this->connection->fetchFirstColumn(
            "SELECT DISTINCT enfermedad_diagnostico FROM SALUD
             WHERE id_animal = :id AND tipo_registro = 'diagnostico'
               AND enfermedad_diagnostico IS NOT NULL",
            ['id' => $id]
        );
        return [
            'eventos_12m'    => $ev12,
            'n_diagnosticos' => count($diags),
            'diagnosticos'   => array_values($diags),
        ];
    }

    /**
     * Carga ambos animales, valida sexos, calcula las 15 features del modelo y
     * arma el contexto genealógico (COI aproximado, ancestros comunes, razas…).
     *
     * @return array{ok:bool, code:int, error:?string, features:array, contexto:array}
     */
    private function prepararDatosCruce(int $idMacho, int $idHembra, string $fechaRef): array
    {
        $fail = fn (string $msg, int $code) => [
            'ok' => false, 'code' => $code, 'error' => $msg, 'features' => [], 'contexto' => [],
        ];

        $macho  = $this->fetchAnimal($idMacho);
        $hembra = $this->fetchAnimal($idHembra);

        if (!$macho)  return $fail("Animal macho (ID $idMacho) no encontrado", Response::HTTP_NOT_FOUND);
        if (!$hembra) return $fail("Animal hembra (ID $idHembra) no encontrado", Response::HTTP_NOT_FOUND);

        if (strtolower((string) $macho['SEXO']) !== 'macho') {
            return $fail("El animal ID $idMacho no es macho (sexo: {$macho['SEXO']})", Response::HTTP_BAD_REQUEST);
        }
        if (strtolower((string) $hembra['SEXO']) !== 'hembra') {
            return $fail("El animal ID $idHembra no es hembra (sexo: {$hembra['SEXO']})", Response::HTTP_BAD_REQUEST);
        }

        // Árbol de ancestros (2 niveles)
        $ancestrosMacho  = $this->fetchAncestros($idMacho);
        $ancestrosHembra = $this->fetchAncestros($idHembra);

        // IDs reales de ancestros (se excluyen las claves especiales padre_id/madre_id)
        $idsMacho  = array_filter(array_keys($ancestrosMacho), 'is_int');
        $idsHembra = array_filter(array_keys($ancestrosHembra), 'is_int');
        $idsComunes = array_values(array_intersect($idsMacho, $idsHembra));
        $ancestrosComunes = count($idsComunes);

        $relacionDirecta       = in_array($idHembra, $idsMacho, true) || in_array($idMacho, $idsHembra, true) ? 1 : 0;
        $mismosPadresCompletos = ($ancestrosMacho['padre_id'] ?? null) && ($ancestrosMacho['padre_id'] === $ancestrosHembra['padre_id'])
                              && ($ancestrosMacho['madre_id'] ?? null) && ($ancestrosMacho['madre_id'] === $ancestrosHembra['madre_id']) ? 1 : 0;
        $mismoPadre = ($ancestrosMacho['padre_id'] ?? null) && ($ancestrosMacho['padre_id'] === $ancestrosHembra['padre_id']) ? 1 : 0;
        $mismaMadre = ($ancestrosMacho['madre_id'] ?? null) && ($ancestrosMacho['madre_id'] === $ancestrosHembra['madre_id']) ? 1 : 0;

        $edadMachoMeses  = $this->edadEnMeses((string) $macho['FECHA_NACIMIENTO'],  $fechaRef);
        $edadHembraMeses = $this->edadEnMeses((string) $hembra['FECHA_NACIMIENTO'], $fechaRef);
        $mismaRaza = ($macho['ID_RAZA'] !== null && $macho['ID_RAZA'] === $hembra['ID_RAZA']) ? 1 : 0;

        $eventosMacho  = $this->contarEventosSalud($idMacho);
        $eventosHembra = $this->contarEventosSalud($idHembra);
        $reproHembra   = $this->historialReproductivo($idHembra);
        $genMacho      = $this->profundidadGenealogica($idMacho);
        $genHembra     = $this->profundidadGenealogica($idHembra);

        $features = [
            'ancestros_comunes_count'       => $ancestrosComunes,
            'relacion_directa'              => $relacionDirecta,
            'mismos_padres_completos'       => $mismosPadresCompletos,
            'mismo_padre'                   => $mismoPadre,
            'misma_madre'                   => $mismaMadre,
            'edad_macho_meses'              => $edadMachoMeses,
            'edad_hembra_meses'             => $edadHembraMeses,
            'misma_raza'                    => $mismaRaza,
            'eventos_salud_macho_12m'       => $eventosMacho,
            'eventos_salud_hembra_12m'      => $eventosHembra,
            'partos_exitosos_hembra'        => $reproHembra['partos_exitosos'],
            'total_partos_hembra'           => $reproHembra['total_partos'],
            'num_crias_promedio'            => $reproHembra['num_crias_promedio'],
            'generaciones_conocidas_macho'  => $genMacho,
            'generaciones_conocidas_hembra' => $genHembra,
        ];

        $contexto = [
            'coi_descendencia_aprox' => $this->coiAproximado($features),
            'ancestros_comunes_count'=> $ancestrosComunes,
            'ancestros_comunes'      => $this->nombresAnimales($idsComunes),
            'raza_macho'             => $this->nombreRaza($macho['ID_RAZA'] ?? null),
            'raza_hembra'            => $this->nombreRaza($hembra['ID_RAZA'] ?? null),
            'edad_macho_meses'       => $edadMachoMeses,
            'edad_hembra_meses'      => $edadHembraMeses,
            'generaciones_macho'     => $genMacho,
            'generaciones_hembra'    => $genHembra,
        ];

        return ['ok' => true, 'code' => 200, 'error' => null, 'features' => $features, 'contexto' => $contexto];
    }

    /**
     * Coeficiente de consanguinidad APROXIMADO de la posible descendencia,
     * derivado del parentesco entre los progenitores (kinship → F de la cría).
     * Es una estimación de apoyo, no un cálculo exacto del pedigrí completo.
     */
    private function coiAproximado(array $f): float
    {
        if ($f['relacion_directa'] || $f['mismos_padres_completos']) {
            return 0.25;                       // padre-hija / hermanos completos
        }
        if ($f['mismo_padre'] && $f['misma_madre']) {
            return 0.25;
        }
        if ($f['mismo_padre'] || $f['misma_madre']) {
            return 0.125;                      // medios hermanos
        }
        if ($f['ancestros_comunes_count'] > 0) {
            return min(0.03125 * $f['ancestros_comunes_count'], 0.125);
        }
        return 0.0;
    }

    /** Nombres de animales a partir de una lista de IDs. */
    private function nombresAnimales(array $ids): array
    {
        $ids = array_values(array_filter(array_map('intval', $ids)));
        if (!$ids) {
            return [];
        }
        $rows = $this->connection->fetchAllAssociative(
            'SELECT nombre, codigo_identificacion FROM ANIMAL WHERE id_animal IN (:ids)',
            ['ids' => $ids],
            ['ids' => \Doctrine\DBAL\ArrayParameterType::INTEGER]
        );
        return array_map(
            fn ($r) => trim(($r['NOMBRE'] ?? '') . ' (' . ($r['CODIGO_IDENTIFICACION'] ?? '') . ')'),
            $rows
        );
    }

    /** Nombre de la raza a partir de su ID (null-safe). */
    private function nombreRaza(mixed $idRaza): ?string
    {
        if ($idRaza === null) {
            return null;
        }
        $nombre = $this->connection->fetchOne(
            'SELECT nombre_raza FROM RAZA WHERE id_raza = :id',
            ['id' => (int) $idRaza]
        );
        return $nombre !== false ? (string) $nombre : null;
    }

    private function fetchAnimal(int $id): array|false
    {
        return $this->connection->fetchAssociative(
            'SELECT id_animal, nombre, codigo_identificacion, sexo, fecha_nacimiento, id_raza
             FROM ANIMAL WHERE id_animal = :id',
            ['id' => $id]
        );
    }

    /**
     * Devuelve mapa [id => true] de todos los ancestros conocidos hasta 2 generaciones,
     * más las claves especiales 'padre_id' y 'madre_id' del propio animal.
     */
    private function fetchAncestros(int $id): array
    {
        $resultado = [];

        $gen1 = $this->connection->fetchAssociative(
            'SELECT id_padre, id_madre FROM GENEALOGIA WHERE id_animal = :id',
            ['id' => $id]
        );

        if (!$gen1) {
            return $resultado;
        }

        $padreId = $gen1['ID_PADRE'] !== null ? (int) $gen1['ID_PADRE'] : null;
        $madreId = $gen1['ID_MADRE'] !== null ? (int) $gen1['ID_MADRE'] : null;

        $resultado['padre_id'] = $padreId;
        $resultado['madre_id'] = $madreId;

        if ($padreId) {
            $resultado[$padreId] = true;
            $gen2p = $this->connection->fetchAssociative(
                'SELECT id_padre, id_madre FROM GENEALOGIA WHERE id_animal = :id',
                ['id' => $padreId]
            );
            if ($gen2p) {
                if ($gen2p['ID_PADRE'] !== null) $resultado[(int) $gen2p['ID_PADRE']] = true;
                if ($gen2p['ID_MADRE'] !== null) $resultado[(int) $gen2p['ID_MADRE']] = true;
            }
        }

        if ($madreId) {
            $resultado[$madreId] = true;
            $gen2m = $this->connection->fetchAssociative(
                'SELECT id_padre, id_madre FROM GENEALOGIA WHERE id_animal = :id',
                ['id' => $madreId]
            );
            if ($gen2m) {
                if ($gen2m['ID_PADRE'] !== null) $resultado[(int) $gen2m['ID_PADRE']] = true;
                if ($gen2m['ID_MADRE'] !== null) $resultado[(int) $gen2m['ID_MADRE']] = true;
            }
        }

        return $resultado;
    }

    private function edadEnMeses(string $fechaNac, string $fechaRef): float
    {
        try {
            $nac = new \DateTimeImmutable($fechaNac);
            $ref = new \DateTimeImmutable($fechaRef);
            $diff = $nac->diff($ref);
            return round($diff->y * 12 + $diff->m + $diff->d / 30.44, 1);
        } catch (\Throwable) {
            return 0.0;
        }
    }

    private function contarEventosSalud(int $idAnimal): int
    {
        $count = $this->connection->fetchOne(
            "SELECT COUNT(*) FROM SALUD
             WHERE id_animal = :id
               AND fecha_aplicacion >= ADD_MONTHS(SYSDATE, -12)",
            ['id' => $idAnimal]
        );
        return (int) $count;
    }

    private function historialReproductivo(int $idHembra): array
    {
        $row = $this->connection->fetchAssociative(
            "SELECT
                COUNT(*)                                                           AS total_partos,
                SUM(CASE WHEN resultado = 'exitoso' THEN 1 ELSE 0 END)            AS partos_exitosos,
                COALESCE(AVG(CASE WHEN resultado = 'exitoso' THEN numero_crias END), 0) AS num_crias_promedio
             FROM REPRODUCCION
             WHERE id_hembra = :id
               AND resultado != 'pendiente'",
            ['id' => $idHembra]
        );

        return [
            'total_partos'      => (int)   ($row['TOTAL_PARTOS']       ?? 0),
            'partos_exitosos'   => (int)   ($row['PARTOS_EXITOSOS']     ?? 0),
            'num_crias_promedio'=> (float) ($row['NUM_CRIAS_PROMEDIO']  ?? 0.0),
        ];
    }

    private function profundidadGenealogica(int $id): int
    {
        $gen1 = $this->connection->fetchAssociative(
            'SELECT id_padre, id_madre FROM GENEALOGIA WHERE id_animal = :id',
            ['id' => $id]
        );

        if (!$gen1 || ($gen1['ID_PADRE'] === null && $gen1['ID_MADRE'] === null)) {
            return 0;
        }

        // Comprobar si algún abuelo está registrado
        $progenitorIds = array_filter([
            $gen1['ID_PADRE'] !== null ? (int) $gen1['ID_PADRE'] : null,
            $gen1['ID_MADRE'] !== null ? (int) $gen1['ID_MADRE'] : null,
        ]);

        foreach ($progenitorIds as $pid) {
            $gen2 = $this->connection->fetchAssociative(
                'SELECT id_padre, id_madre FROM GENEALOGIA WHERE id_animal = :id',
                ['id' => $pid]
            );
            if ($gen2 && ($gen2['ID_PADRE'] !== null || $gen2['ID_MADRE'] !== null)) {
                return 2;
            }
        }

        return 1;
    }
}
