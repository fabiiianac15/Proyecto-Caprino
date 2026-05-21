<?php

namespace App\Controller;

use App\Service\AuditoriaService;
use App\Service\MlService;
use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
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

            $this->connection->executeStatement(
                'UPDATE GENEALOGIA SET id_padre = :p, id_madre = :m, observaciones = NVL(:obs, observaciones) WHERE id_animal = :id',
                ['p' => $idPadre, 'm' => $idMadre, 'obs' => $obs, 'id' => $idAnimal]
            );

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
            $this->connection->executeStatement(
                'INSERT INTO GENEALOGIA (id_animal, id_padre, id_madre, observaciones) VALUES (:id, :p, :m, :obs)',
                ['id' => $idAnimal, 'p' => $idPadre, 'm' => $idMadre, 'obs' => $obs]
            );

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

        // ── 1. Cargar animales ────────────────────────────────────────────────
        $macho  = $this->fetchAnimal($idMacho);
        $hembra = $this->fetchAnimal($idHembra);

        if (!$macho) {
            return $this->json(['error' => "Animal macho (ID $idMacho) no encontrado"], Response::HTTP_NOT_FOUND);
        }
        if (!$hembra) {
            return $this->json(['error' => "Animal hembra (ID $idHembra) no encontrado"], Response::HTTP_NOT_FOUND);
        }

        // ── 2. Validar sexos ──────────────────────────────────────────────────
        if (strtolower((string) $macho['SEXO']) !== 'macho') {
            return $this->json(
                ['error' => "El animal ID $idMacho no es macho (sexo: {$macho['SEXO']})"],
                Response::HTTP_BAD_REQUEST
            );
        }
        if (strtolower((string) $hembra['SEXO']) !== 'hembra') {
            return $this->json(
                ['error' => "El animal ID $idHembra no es hembra (sexo: {$hembra['SEXO']})"],
                Response::HTTP_BAD_REQUEST
            );
        }

        // ── 3. Construir árbol de ancestros (2 niveles) ───────────────────────
        $ancestrosMacho  = $this->fetchAncestros($idMacho);
        $ancestrosHembra = $this->fetchAncestros($idHembra);

        $idsAncestrosMacho  = array_keys($ancestrosMacho);
        $idsAncestrosHembra = array_keys($ancestrosHembra);

        $ancestrosComunes = count(array_intersect($idsAncestrosMacho, $idsAncestrosHembra));

        $relacionDirecta      = in_array($idHembra, $idsAncestrosMacho) || in_array($idMacho, $idsAncestrosHembra) ? 1 : 0;
        $mismosPadresCompletos = ($ancestrosMacho['padre_id'] ?? null) && ($ancestrosMacho['padre_id'] === $ancestrosHembra['padre_id'])
                              && ($ancestrosMacho['madre_id'] ?? null) && ($ancestrosMacho['madre_id'] === $ancestrosHembra['madre_id']) ? 1 : 0;
        $mismoPadre = ($ancestrosMacho['padre_id'] ?? null) && ($ancestrosMacho['padre_id'] === $ancestrosHembra['padre_id']) ? 1 : 0;
        $mismaMadre = ($ancestrosMacho['madre_id'] ?? null) && ($ancestrosMacho['madre_id'] === $ancestrosHembra['madre_id']) ? 1 : 0;

        // ── 4. Edades ─────────────────────────────────────────────────────────
        $edadMachoMeses  = $this->edadEnMeses((string) $macho['FECHA_NACIMIENTO'],  $fechaRef);
        $edadHembraMeses = $this->edadEnMeses((string) $hembra['FECHA_NACIMIENTO'], $fechaRef);

        // ── 5. Misma raza ─────────────────────────────────────────────────────
        $mismaRaza = ($macho['ID_RAZA'] !== null && $macho['ID_RAZA'] === $hembra['ID_RAZA']) ? 1 : 0;

        // ── 6. Eventos de salud últimos 12 meses ──────────────────────────────
        $eventosMacho  = $this->contarEventosSalud($idMacho);
        $eventosHembra = $this->contarEventosSalud($idHembra);

        // ── 7. Historial reproductivo de la hembra ────────────────────────────
        $reproHembra = $this->historialReproductivo($idHembra);

        // ── 8. Profundidad genealógica conocida ───────────────────────────────
        $genMacho  = $this->profundidadGenealogica($idMacho);
        $genHembra = $this->profundidadGenealogica($idHembra);

        // ── 9. Llamar al servicio ML ──────────────────────────────────────────
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

        $mlResult = $this->ml->evaluarCompatibilidad($features);

        if (!$mlResult['ok']) {
            return $this->json(
                ['error' => 'Servicio ML no disponible', 'detalle' => $mlResult['error']],
                Response::HTTP_SERVICE_UNAVAILABLE
            );
        }

        // ── 10. Auditoría ─────────────────────────────────────────────────────
        try {
            $this->auditoria->registrar(
                tabla: 'GENEALOGIA_COMPATIBILIDAD',
                operacion: 'CONSULTAR',
                idRegistro: $idMacho,
                descripcion: "Evaluación ML compatibilidad macho $idMacho × hembra $idHembra",
                datosNuevos: [
                    'idMacho'         => $idMacho,
                    'idHembra'        => $idHembra,
                    'score'           => $mlResult['data']['scoreCompatibilidad'] ?? null,
                    'clasificacion'   => $mlResult['data']['clasificacion'] ?? null,
                    'modelVersion'    => $mlResult['data']['metadata']['modelVersion'] ?? null,
                ],
            );
        } catch (\Throwable) {}

        return $this->json([
            'features'  => $features,
            'resultado' => $mlResult['data'],
        ]);
    }

    // ─── Helpers privados ────────────────────────────────────────────────────

    private function fetchAnimal(int $id): array|false
    {
        return $this->connection->fetchAssociative(
            'SELECT id_animal, sexo, fecha_nacimiento, id_raza FROM ANIMAL WHERE id_animal = :id',
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
