<?php

namespace App\Controller;

use App\Service\AuditoriaService;
use App\Service\MlService;
use App\Service\RebanoService;
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
        private RebanoService $rebano,
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
    // GET /api/genealogia/arbol/{id}?generaciones=3
    // Árbol genealógico completo en una sola llamada (antes una por ancestro).
    // ─────────────────────────────────────────────────────────────────────────
    #[Route('/arbol/{id}', name: 'api_genealogia_arbol', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function arbol(int $id, Request $request): JsonResponse
    {
        $generaciones = max(1, min(5, (int) $request->query->get('generaciones', 3)));
        $rows = $this->connection->fetchAllAssociative(
            "SELECT a.id_animal, a.nombre, a.codigo_identificacion, a.sexo, a.estado,
                    TO_CHAR(a.fecha_nacimiento, 'YYYY-MM-DD') AS fnac,
                    r.nombre_raza, g.id_padre, g.id_madre
               FROM ANIMAL a
               LEFT JOIN RAZA r ON a.id_raza = r.id_raza
               LEFT JOIN GENEALOGIA g ON g.id_animal = a.id_animal"
        );
        $porId = [];
        foreach ($rows as $r) {
            $porId[(int) $r['ID_ANIMAL']] = $r;
        }
        if (!isset($porId[$id])) {
            return $this->json(['error' => 'Animal no encontrado'], Response::HTTP_NOT_FOUND);
        }

        $nodo = function (?int $aid, int $nivel) use (&$nodo, $porId, $generaciones): ?array {
            if ($aid === null || !isset($porId[$aid]) || $nivel > $generaciones) {
                return null;
            }
            $r = $porId[$aid];
            $idPadre = $r['ID_PADRE'] !== null ? (int) $r['ID_PADRE'] : null;
            $idMadre = $r['ID_MADRE'] !== null ? (int) $r['ID_MADRE'] : null;
            return [
                'id'              => $aid,
                'nombre'          => $r['NOMBRE'],
                'codigo'          => $r['CODIGO_IDENTIFICACION'],
                'sexo'            => $r['SEXO'],
                'estado'          => $r['ESTADO'],
                'raza'            => $r['NOMBRE_RAZA'],
                'fechaNacimiento' => $r['FNAC'],
                'idPadre'         => $idPadre,
                'idMadre'         => $idMadre,
                'padre'           => $nivel < $generaciones ? $nodo($idPadre, $nivel + 1) : null,
                'madre'           => $nivel < $generaciones ? $nodo($idMadre, $nivel + 1) : null,
            ];
        };

        return $this->json(['data' => $nodo($id, 0)]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/genealogia/compatibilidad
    // Evaluación completa del cruce: consanguinidad exacta, valores genéticos
    // (BLUP), modelo predictivo de la granja y árbol de la futura cría.
    // ─────────────────────────────────────────────────────────────────────────
    #[Route('/compatibilidad', name: 'api_genealogia_compatibilidad', methods: ['POST'])]
    public function compatibilidad(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];
        $par  = $this->leerPar($data);
        if (isset($par['error'])) {
            return $this->json(['error' => $par['error']], Response::HTTP_BAD_REQUEST);
        }

        $eval = $this->ml->cruce($this->rebano->instantanea($data['fechaReferencia'] ?? null), $par['macho'], $par['hembra']);
        if (!$eval['ok']) {
            return $this->errorMl($eval);
        }

        try {
            $this->auditoria->registrar(
                tabla: 'GENEALOGIA_COMPATIBILIDAD',
                operacion: 'CONSULTAR',
                idRegistro: $par['macho'],
                descripcion: "Evaluación de cruce macho {$par['macho']} × hembra {$par['hembra']}",
                datosNuevos: [
                    'idMacho'       => $par['macho'],
                    'idHembra'      => $par['hembra'],
                    'scoreGlobal'   => $eval['data']['scoreGlobal'] ?? null,
                    'clasificacion' => $eval['data']['clasificacion'] ?? null,
                ],
            );
        } catch (\Throwable) {}

        return $this->json([
            'animales'   => $eval['data']['animales'] ?? null,
            'evaluacion' => $eval['data'],
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/genealogia/analisis-ia
    // Interpretación en lenguaje natural (IA local) en streaming. La IA solo
    // redacta lo que calculó el motor; no inventa cifras.
    // ─────────────────────────────────────────────────────────────────────────
    #[Route('/analisis-ia', name: 'api_genealogia_analisis_ia', methods: ['POST'])]
    public function analisisIa(Request $request): Response
    {
        $data = json_decode($request->getContent(), true) ?? [];
        $par  = $this->leerPar($data);
        if (isset($par['error'])) {
            return $this->json(['error' => $par['error']], Response::HTTP_BAD_REQUEST);
        }

        // El microservicio guarda en caché la instantánea: no se recalcula el BLUP
        $eval = $this->ml->cruce($this->rebano->instantanea($data['fechaReferencia'] ?? null), $par['macho'], $par['hembra']);
        if (!$eval['ok']) {
            return $this->errorMl($eval);
        }

        $evaluacion = $eval['data'];
        $animales   = [
            'macho'  => array_intersect_key($evaluacion['animales']['macho'] ?? [], ['nombre' => 1, 'codigo' => 1]),
            'hembra' => array_intersect_key($evaluacion['animales']['hembra'] ?? [], ['nombre' => 1, 'codigo' => 1]),
        ];
        // El árbol no aporta a la narrativa y alarga el prompt
        unset($evaluacion['arbolCria'], $evaluacion['animales']);

        return $this->streamIa(fn (callable $emitir) => $this->ml->analisisIaStream($evaluacion, $animales, $emitir),
            "\n\n_No se pudo conectar con el asistente de IA. Consulta el panel de resultados del modelo._");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/genealogia/ranking
    // Mejores parejas para un animal entre los activos del sexo opuesto.
    // ─────────────────────────────────────────────────────────────────────────
    #[Route('/ranking', name: 'api_genealogia_ranking', methods: ['POST'])]
    public function ranking(Request $request): JsonResponse
    {
        $data     = json_decode($request->getContent(), true) ?? [];
        $idAnimal = isset($data['idAnimal']) ? (int) $data['idAnimal'] : null;
        if (!$idAnimal) {
            return $this->json(['error' => 'Se requiere idAnimal'], Response::HTTP_BAD_REQUEST);
        }

        $res = $this->ml->ranking($this->rebano->instantanea($data['fechaReferencia'] ?? null), $idAnimal, [
            'limite'            => max(1, min(50, (int) ($data['limite'] ?? 10))),
            'soloMismaRaza'     => (bool) ($data['soloMismaRaza'] ?? false),
            'maxConsanguinidad' => isset($data['maxConsanguinidad']) && $data['maxConsanguinidad'] !== '' ? (float) $data['maxConsanguinidad'] : null,
            'soloDisponibles'   => (bool) ($data['soloDisponibles'] ?? false),
        ]);
        if (!$res['ok']) {
            return $this->errorMl($res);
        }

        return $this->json($res['data']);
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
        if (!$idAnimal) {
            return $this->json(['error' => 'Se requiere idAnimal'], Response::HTTP_BAD_REQUEST);
        }

        // Se reconstruye el ranking en el servidor (no se confía en datos del cliente)
        $res = $this->ml->ranking($this->rebano->instantanea($data['fechaReferencia'] ?? null), $idAnimal, [
            'limite'            => 5,
            'soloMismaRaza'     => (bool) ($data['soloMismaRaza'] ?? false),
            'maxConsanguinidad' => isset($data['maxConsanguinidad']) && $data['maxConsanguinidad'] !== '' ? (float) $data['maxConsanguinidad'] : null,
            'soloDisponibles'   => (bool) ($data['soloDisponibles'] ?? false),
        ]);
        if (!$res['ok']) {
            return $this->errorMl($res);
        }
        if (empty($res['data']['ranking'])) {
            return $this->json(['error' => 'No hay candidatos suficientes para analizar'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $payload = ['animal_base' => $res['data']['base'], 'ranking' => $res['data']['ranking']];
        return $this->streamIa(fn (callable $emitir) => $this->ml->analisisRankingStream($payload, $emitir),
            "\n\n_No se pudo conectar con el asistente de IA._");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/genealogia/modelo — estado del modelo predictivo
    // ─────────────────────────────────────────────────────────────────────────
    #[Route('/modelo', name: 'api_genealogia_modelo', methods: ['GET'])]
    public function modelo(): JsonResponse
    {
        $res = $this->ml->modelo();
        $cerrados = $this->rebano->serviciosCerrados();
        if (!$res['ok']) {
            return $this->json(['disponible' => false, 'serviciosCerrados' => $cerrados, 'error' => $res['error']]);
        }
        $metricas = $res['data']['metricas'] ?? [];
        $usados   = (int) ($metricas['n_reales'] ?? 0);

        return $this->json([
            'disponible'        => true,
            'metricas'          => $metricas,
            'serviciosCerrados' => $cerrados,
            'serviciosNuevos'   => max(0, $cerrados - $usados),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/genealogia/modelo/entrenar — reentrenar con datos de la granja
    // ─────────────────────────────────────────────────────────────────────────
    #[Route('/modelo/entrenar', name: 'api_genealogia_modelo_entrenar', methods: ['POST'])]
    public function entrenarModelo(): JsonResponse
    {
        if (!$this->isGranted('ROLE_ADMIN') && !$this->isGranted('ROLE_ZOOTECNISTA') && !$this->isGranted('ROLE_VETERINARIO')) {
            return $this->json(['error' => 'Solo administradores, zootecnistas o veterinarios pueden reentrenar el modelo.'],
                Response::HTTP_FORBIDDEN);
        }

        $res = $this->ml->entrenar($this->rebano->instantanea());
        if (!$res['ok']) {
            return $this->errorMl($res);
        }

        try {
            $m = $res['data']['metricas'] ?? [];
            $this->auditoria->registrar(
                tabla: 'MODELO_ML',
                operacion: 'ACTUALIZAR',
                idRegistro: null,
                descripcion: 'Reentrenamiento del modelo de cruces con ' . ($m['n_reales'] ?? 0) . ' servicios reales',
                datosNuevos: ['validacion' => $m['validacion_real'] ?? null],
            );
        } catch (\Throwable) {}

        return $this->json($res['data']);
    }

    // ─── Helpers privados ────────────────────────────────────────────────────

    /** Lee y valida el par macho/hembra del cuerpo de la petición. */
    private function leerPar(array $data): array
    {
        $macho  = isset($data['idMacho'])  ? (int) $data['idMacho']  : null;
        $hembra = isset($data['idHembra']) ? (int) $data['idHembra'] : null;
        if (!$macho || !$hembra) {
            return ['error' => 'Se requieren idMacho e idHembra'];
        }
        if ($macho === $hembra) {
            return ['error' => 'El macho y la hembra no pueden ser el mismo animal'];
        }
        return ['macho' => $macho, 'hembra' => $hembra];
    }

    private function errorMl(array $res): JsonResponse
    {
        $code = $res['code'] ?? Response::HTTP_SERVICE_UNAVAILABLE;
        $msg  = $code === Response::HTTP_SERVICE_UNAVAILABLE ? 'Servicio ML no disponible' : $res['error'];
        return $this->json(['error' => $msg, 'detalle' => $res['error']], $code);
    }

    /** Retransmite al navegador el texto de la IA a medida que se genera. */
    private function streamIa(callable $generar, string $mensajeFallo): StreamedResponse
    {
        $response = new StreamedResponse(function () use ($generar, $mensajeFallo) {
            $ok = $generar(function (string $chunk) {
                echo $chunk;
                if (function_exists('ob_get_level') && ob_get_level() > 0) {
                    @ob_flush();
                }
                flush();
            });
            if (!$ok) {
                echo $mensajeFallo;
            }
        });
        $response->headers->set('Content-Type', 'text/plain; charset=utf-8');
        $response->headers->set('X-Accel-Buffering', 'no');   // evita buffering en Nginx
        $response->headers->set('Cache-Control', 'no-cache');

        return $response;
    }
}
