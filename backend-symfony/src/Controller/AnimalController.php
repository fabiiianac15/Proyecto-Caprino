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

#[Route('/api/animales')]
class AnimalController extends AbstractController
{
    /** Estado productivo de la hembra (complementa al estado general). */
    public const ESTADOS_PRODUCTIVOS = ['produccion', 'seca', 'prenada', 'cabretona', 'cabrita'];

    public function __construct(
        private Connection $connection,
        private AuditoriaService $auditoria,
    ) {}

    #[Route('', name: 'api_animales_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $sexo   = $request->query->get('sexo');
        $estado = $request->query->get('estado');

        $sql    = "SELECT a.id_animal, a.codigo_identificacion, a.chapeta_nueva, a.chapeta_vieja,
                          a.nombre, a.fecha_nacimiento,
                          a.sexo, a.id_raza, r.nombre_raza, a.color_pelaje,
                          a.peso_nacimiento_kg, a.estado, a.motivo_estado, a.fecha_cambio_estado,
                          a.estado_productivo, a.id_corral, c.nombre AS nombre_corral, c.tipo AS tipo_corral, c.lote AS lote_corral,
                          a.observaciones, a.foto_url
                   FROM ANIMAL a
                   LEFT JOIN RAZA r ON a.id_raza = r.id_raza
                   LEFT JOIN CORRAL c ON a.id_corral = c.id_corral
                   WHERE 1=1";
        $params = [];

        if ($sexo) {
            $sql .= ' AND a.sexo = :sexo';
            $params['sexo'] = $sexo;
        }
        if ($estado) {
            $sql .= ' AND a.estado = :estado';
            $params['estado'] = $estado;
        } else {
            $sql .= " AND a.estado != 'muerto'";
        }

        $sql .= ' ORDER BY a.codigo_identificacion';

        $rows = $this->connection->fetchAllAssociative($sql, $params);

        $data = array_map(fn($row) => [
            'id'             => (int) $row['ID_ANIMAL'],
            'codigo'         => $row['CODIGO_IDENTIFICACION'],
            'chapetaNueva'   => $row['CHAPETA_NUEVA'],
            'chapetaVieja'   => $row['CHAPETA_VIEJA'],
            'nombre'         => $row['NOMBRE'],
            'fechaNacimiento'=> $row['FECHA_NACIMIENTO'],
            'sexo'           => $row['SEXO'],
            'idRaza'         => (int) $row['ID_RAZA'],
            'nombreRaza'     => $row['NOMBRE_RAZA'],
            'colorPelaje'    => $row['COLOR_PELAJE'],
            'pesoNacimiento' => $row['PESO_NACIMIENTO_KG'] !== null ? (float) $row['PESO_NACIMIENTO_KG'] : null,
            'estado'         => $row['ESTADO'],
            'motivoEstado'   => $row['MOTIVO_ESTADO'],
            'fechaCambioEstado' => $row['FECHA_CAMBIO_ESTADO'],
            'estadoProductivo'  => $row['ESTADO_PRODUCTIVO'],
            'idCorral'       => $row['ID_CORRAL'] !== null ? (int) $row['ID_CORRAL'] : null,
            'nombreCorral'   => $row['NOMBRE_CORRAL'],
            'tipoCorral'     => $row['TIPO_CORRAL'],
            'loteCorral'     => $row['LOTE_CORRAL'],
            'observaciones'  => $row['OBSERVACIONES'],
            'fotoUrl'        => $row['FOTO_URL'],
        ], $rows);

        return $this->json(['data' => $data]);
    }

    #[Route('/{id}', name: 'api_animales_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): JsonResponse
    {
        $row = $this->connection->fetchAssociative(
            'SELECT a.*, r.nombre_raza, c.nombre AS nombre_corral, c.tipo AS tipo_corral, c.lote AS lote_corral
             FROM ANIMAL a
             LEFT JOIN RAZA r ON a.id_raza = r.id_raza
             LEFT JOIN CORRAL c ON a.id_corral = c.id_corral
             WHERE a.id_animal = :id',
            ['id' => $id]
        );

        if (!$row) {
            return $this->json(['error' => 'Animal no encontrado'], Response::HTTP_NOT_FOUND);
        }

        return $this->json(['data' => [
            'id'             => (int) $row['ID_ANIMAL'],
            'codigo'         => $row['CODIGO_IDENTIFICACION'],
            'chapetaNueva'   => $row['CHAPETA_NUEVA'],
            'chapetaVieja'   => $row['CHAPETA_VIEJA'],
            'nombre'         => $row['NOMBRE'],
            'fechaNacimiento'=> $row['FECHA_NACIMIENTO'],
            'sexo'           => $row['SEXO'],
            'idRaza'         => (int) $row['ID_RAZA'],
            'nombreRaza'     => $row['NOMBRE_RAZA'],
            'colorPelaje'    => $row['COLOR_PELAJE'],
            'pesoNacimiento' => $row['PESO_NACIMIENTO_KG'] !== null ? (float) $row['PESO_NACIMIENTO_KG'] : null,
            'estado'         => $row['ESTADO'],
            'motivoEstado'   => $row['MOTIVO_ESTADO'],
            'fechaCambioEstado' => $row['FECHA_CAMBIO_ESTADO'],
            'estadoProductivo'  => $row['ESTADO_PRODUCTIVO'],
            'idCorral'       => $row['ID_CORRAL'] !== null ? (int) $row['ID_CORRAL'] : null,
            'nombreCorral'   => $row['NOMBRE_CORRAL'],
            'tipoCorral'     => $row['TIPO_CORRAL'],
            'loteCorral'     => $row['LOTE_CORRAL'],
            'observaciones'  => $row['OBSERVACIONES'],
            'fotoUrl'        => $row['FOTO_URL'],
        ]]);
    }

    #[Route('', name: 'api_animales_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data     = json_decode($request->getContent(), true) ?? [];
        $chapNueva = $data['chapetaNueva'] ?? $data['chapeta_nueva'] ?? null;
        $chapVieja = $data['chapetaVieja'] ?? $data['chapeta_vieja'] ?? null;
        $chapNueva = $chapNueva !== null ? trim($chapNueva) : null;
        $chapVieja = $chapVieja !== null ? trim($chapVieja) : null;
        $chapNueva = $chapNueva ?: null;
        $chapVieja = $chapVieja ?: null;
        // codigo principal: identificacion explícita, o la chapeta nueva, o la vieja
        $codigo   = $data['codigo'] ?? $data['codigo_identificacion'] ?? $data['codigoIdentificacion'] ?? $data['identificacion'] ?? $chapNueva ?? $chapVieja ?? null;
        $nombre   = self::limpiarNombre($data['nombre'] ?? null);
        $sexo     = $data['sexo']   ?? null;
        $idRaza   = $data['idRaza'] ?? $data['razaId'] ?? $data['id_raza'] ?? null;
        $fechaNac = $data['fechaNacimiento'] ?? $data['fecha_nacimiento'] ?? null;
        $fechaNac = $fechaNac ?: null;
        $color    = $data['colorPelaje'] ?? $data['color_pelaje'] ?? null;
        $pesoNac  = $data['pesoNacimiento'] ?? $data['peso_nacimiento_kg'] ?? null;
        $estado   = $data['estado'] ?? 'activo';
        $motivo   = $data['motivoEstado'] ?? $data['motivo_estado'] ?? null;
        $estProd  = $data['estadoProductivo'] ?? $data['estado_productivo'] ?? null;
        $idCorral = $data['idCorral'] ?? $data['id_corral'] ?? null;
        $obs      = $data['observaciones'] ?? null;
        $fotoData = $data['fotoUrl'] ?? $data['foto_url'] ?? null;

        if ((!$chapNueva && !$chapVieja) || !$sexo || !$idRaza) {
            return $this->json(['error' => 'Campos requeridos: al menos una chapeta, sexo e idRaza'], Response::HTTP_BAD_REQUEST);
        }

        if (!in_array($sexo, ['macho', 'hembra'])) {
            return $this->json(['error' => "sexo debe ser 'macho' o 'hembra'"], Response::HTTP_BAD_REQUEST);
        }

        // El estado productivo solo aplica a hembras
        $estProd = $sexo === 'hembra' && in_array($estProd, self::ESTADOS_PRODUCTIVOS, true) ? $estProd : null;

        $fotoUrl = $this->guardarFoto($fotoData);

        $user = $this->getUser();
        $usuarioReg = $user instanceof User ? $user->getId() : 1;

        // La fecha de nacimiento es opcional
        $fecExpr = $fechaNac ? "TO_DATE(:fec, 'YYYY-MM-DD')" : 'NULL';

        try {
            $params = [
                'codigo'   => $codigo,
                'chapn'    => $chapNueva,
                'chapv'    => $chapVieja,
                'nombre'   => $nombre,
                'sexo'     => $sexo,
                'raza'     => $idRaza,
                'color'    => $color,
                'peso'     => $pesoNac,
                'estado'   => $estado,
                'motivo'   => $estado !== 'activo' ? $motivo : null,
                'estprod'  => $estProd,
                'corral'   => $idCorral ?: null,
                'obs'      => $obs,
                'foto'     => $fotoUrl,
                'ureg'     => $usuarioReg,
            ];
            if ($fechaNac) {
                $params['fec'] = $fechaNac;
            }
            $this->connection->executeStatement(
                "INSERT INTO ANIMAL (codigo_identificacion, chapeta_nueva, chapeta_vieja, nombre, fecha_nacimiento, sexo, id_raza, color_pelaje, peso_nacimiento_kg, estado, motivo_estado, estado_productivo, id_corral, observaciones, foto_url, usuario_registro, fecha_cambio_estado)
                 VALUES (:codigo, :chapn, :chapv, :nombre, $fecExpr, :sexo, :raza, :color, :peso, :estado, :motivo, :estprod, :corral, :obs, :foto, :ureg, "
                 . ($estado !== 'activo' ? 'CURRENT_TIMESTAMP' : 'NULL') . ")",
                $params
            );
        } catch (\Throwable $e) {
            $msg = $e->getMessage();
            if (str_contains($msg, 'ORA-00001') || str_contains($msg, 'unique constraint')) {
                return $this->json(
                    ['error' => "El código '{$codigo}' ya está registrado. Usa un código diferente."],
                    Response::HTTP_CONFLICT
                );
            }
            if (str_contains($msg, 'ORA-02291')) {
                return $this->json(
                    ['error' => 'La raza seleccionada no existe.'],
                    Response::HTTP_BAD_REQUEST
                );
            }
            if (str_contains($msg, 'ORA-02290') || str_contains($msg, 'check constraint')) {
                return $this->json(
                    ['error' => 'Valor inválido: revisa el peso al nacimiento (debe ser > 0 y < 10 kg).'],
                    Response::HTTP_BAD_REQUEST
                );
            }
            return $this->json(
                ['error' => 'Error al registrar el animal. Verifica los datos e intenta de nuevo.'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }

        $newId = (int) $this->connection->fetchOne(
            'SELECT id_animal FROM ANIMAL WHERE codigo_identificacion = :c',
            ['c' => $codigo]
        );

        try {
            $this->auditoria->registrar(
                tabla: 'ANIMAL',
                operacion: 'CREAR',
                idRegistro: $newId,
                descripcion: "Registro de animal {$codigo} - {$nombre}",
                datosNuevos: [
                    'codigo'         => $codigo,
                    'nombre'         => $nombre,
                    'fechaNacimiento'=> $fechaNac,
                    'sexo'           => $sexo,
                    'estadoProductivo' => $estProd,
                    'idRaza'         => $idRaza,
                    'colorPelaje'    => $color,
                    'pesoNacimiento' => $pesoNac,
                    'observaciones'  => $obs,
                ],
            );
        } catch (\Throwable) {}

        return $this->json([
            'success' => true,
            'message' => 'Animal creado correctamente',
            'data'    => ['id' => $newId, 'codigo' => $codigo, 'nombre' => $nombre, 'fotoUrl' => $fotoUrl],
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_animales_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $data     = json_decode($request->getContent(), true) ?? [];
        $nombre   = self::limpiarNombre($data['nombre'] ?? null);
        $sexo     = $data['sexo']   ?? null;
        $idRaza   = $data['idRaza'] ?? $data['razaId'] ?? $data['id_raza'] ?? null;
        $color    = $data['colorPelaje'] ?? $data['color_pelaje'] ?? null;
        $estado   = $data['estado'] ?? null;
        $motivo   = $data['motivoEstado'] ?? $data['motivo_estado'] ?? null;
        $idCorral = $data['idCorral'] ?? $data['id_corral'] ?? null;
        $chapNueva = array_key_exists('chapetaNueva', $data) ? ($data['chapetaNueva'] ?: null) : null;
        $chapVieja = array_key_exists('chapetaVieja', $data) ? ($data['chapetaVieja'] ?: null) : null;
        $fechaNac = $data['fechaNacimiento'] ?? $data['fecha_nacimiento'] ?? null;
        $obs      = $data['observaciones'] ?? null;
        $fotoData = $data['fotoUrl'] ?? $data['foto_url'] ?? null;

        $oldRow = $this->connection->fetchAssociative(
            'SELECT * FROM ANIMAL WHERE id_animal = :id',
            ['id' => $id]
        );

        // Si la petición trae "nombre" (aunque sea vacío) se guarda tal cual: así se puede
        // quitar el nombre a una cabra que solo se identifica por la chapeta.
        $sets  = (array_key_exists('nombre', $data) ? 'nombre = :nombre' : 'nombre = NVL(:nombre, nombre)') . ", sexo = NVL(:sexo, sexo), id_raza = NVL(:raza, id_raza),
                  color_pelaje = NVL(:color, color_pelaje), estado = NVL(:estado, estado),
                  observaciones = NVL(:obs, observaciones)";
        $params = [
            'nombre' => $nombre, 'sexo' => $sexo, 'raza' => $idRaza,
            'color' => $color, 'estado' => $estado, 'obs' => $obs, 'id' => $id,
        ];

        // Chapetas (solo si vienen en la petición)
        if (array_key_exists('chapetaNueva', $data)) {
            $sets .= ', chapeta_nueva = :chapn';
            $params['chapn'] = $chapNueva;
        }
        if (array_key_exists('chapetaVieja', $data)) {
            $sets .= ', chapeta_vieja = :chapv';
            $params['chapv'] = $chapVieja;
        }

        // Estado productivo (permite limpiarlo enviando null; solo aplica a hembras)
        if (array_key_exists('estadoProductivo', $data)) {
            $estProd = $data['estadoProductivo'];
            $sexoFinal = $sexo ?? ($oldRow['SEXO'] ?? null);
            $sets .= ', estado_productivo = :estprod';
            $params['estprod'] = $sexoFinal === 'hembra' && in_array($estProd, self::ESTADOS_PRODUCTIVOS, true) ? $estProd : null;
        }

        // Corral (permite asignar o desasignar enviando null)
        if (array_key_exists('idCorral', $data) || array_key_exists('id_corral', $data)) {
            $sets .= ', id_corral = :corral';
            $params['corral'] = $idCorral ?: null;
        }

        // Fecha de nacimiento (opcional)
        if (array_key_exists('fechaNacimiento', $data) || array_key_exists('fecha_nacimiento', $data)) {
            if ($fechaNac) {
                $sets .= ", fecha_nacimiento = TO_DATE(:fec, 'YYYY-MM-DD')";
                $params['fec'] = $fechaNac;
            } else {
                $sets .= ', fecha_nacimiento = NULL';
            }
        }

        // Estado: registrar motivo y fecha de cambio cuando cambia a un estado no-activo
        if ($estado !== null) {
            $sets .= ', motivo_estado = :motivo';
            $params['motivo'] = $estado !== 'activo' ? $motivo : null;
            $estadoAnterior = $oldRow['ESTADO'] ?? null;
            if ($estado !== 'activo' && $estado !== $estadoAnterior) {
                $sets .= ', fecha_cambio_estado = CURRENT_TIMESTAMP';
            }
        }

        // Actualizar foto solo si se envió una nueva imagen base64
        $fotoUrl = null;
        if ($fotoData && str_starts_with($fotoData, 'data:image')) {
            $fotoUrl = $this->guardarFoto($fotoData);
            $sets .= ', foto_url = :foto';
            $params['foto'] = $fotoUrl;
        }

        $this->connection->executeStatement(
            "UPDATE ANIMAL SET $sets WHERE id_animal = :id",
            $params
        );

        try {
            $this->auditoria->registrar(
                tabla: 'ANIMAL',
                operacion: 'ACTUALIZAR',
                idRegistro: $id,
                descripcion: "Actualización de animal ID {$id}",
                datosAnt: $oldRow ?: [],
                datosNuevos: $data,
            );
        } catch (\Throwable) {}

        return $this->json(['success' => true, 'message' => 'Animal actualizado', 'fotoUrl' => $fotoUrl]);
    }

    #[Route('/{id}', name: 'api_animales_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $oldRow = $this->connection->fetchAssociative(
            'SELECT * FROM ANIMAL WHERE id_animal = :id',
            ['id' => $id]
        );

        $this->connection->executeStatement(
            "UPDATE ANIMAL SET estado = 'muerto', fecha_cambio_estado = CURRENT_TIMESTAMP WHERE id_animal = :id",
            ['id' => $id]
        );

        try {
            $codigo = $oldRow['CODIGO_IDENTIFICACION'] ?? '';
            $nombre = $oldRow['NOMBRE'] ?? '';
            $this->auditoria->registrar(
                tabla: 'ANIMAL',
                operacion: 'ELIMINAR',
                idRegistro: $id,
                descripcion: "Baja de animal {$codigo} - {$nombre}",
                datosAnt: $oldRow ?: [],
            );
        } catch (\Throwable) {}

        return $this->json(['success' => true, 'message' => 'Animal dado de baja']);
    }

    // ------------------------------------------------------------------
    // Galería de fotos por vista (carrusel). ANIMAL.foto_url es la principal.
    // ------------------------------------------------------------------
    public const VISTAS_FOTO = ['LATERAL', 'FRONTAL', 'POSTERIOR', 'CABEZA', 'UBRE', 'TESTICULOS', 'PATAS', 'OTRA'];

    #[Route('/{id}/fotos', name: 'api_animales_fotos', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function fotos(int $id): JsonResponse
    {
        return $this->json(['data' => $this->listarFotos($id)]);
    }

    /**
     * Sube una foto a la galería. Acepta multipart (file + tipoVista) o JSON
     * con {foto: "data:image/...;base64,...", tipoVista}. principal=1 la deja
     * además como foto principal del animal.
     */
    #[Route('/{id}/fotos', name: 'api_animales_fotos_subir', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function subirFotoGaleria(int $id, Request $request): JsonResponse
    {
        if (!$this->connection->fetchOne('SELECT 1 FROM ANIMAL WHERE id_animal = :id', ['id' => $id])) {
            return $this->json(['error' => 'Animal no encontrado'], Response::HTTP_NOT_FOUND);
        }
        $json = str_contains((string) $request->headers->get('Content-Type'), 'application/json')
            ? (json_decode($request->getContent(), true) ?? []) : [];
        $vista = strtoupper((string) ($request->request->get('tipoVista') ?? $json['tipoVista'] ?? 'OTRA'));
        if (!in_array($vista, self::VISTAS_FOTO, true)) {
            return $this->json(['error' => 'Tipo de foto inválido'], Response::HTTP_BAD_REQUEST);
        }
        $descripcion = $request->request->get('descripcion') ?? $json['descripcion'] ?? null;
        $principal = filter_var($request->request->get('principal') ?? $json['principal'] ?? false, FILTER_VALIDATE_BOOLEAN);

        $dirRel = '/uploads/animales/' . $id;
        $dirAbs = $this->getParameter('kernel.project_dir') . '/public' . $dirRel;
        if (!is_dir($dirAbs) && !mkdir($dirAbs, 0775, true) && !is_dir($dirAbs)) {
            return $this->json(['error' => 'No se pudo crear la carpeta de fotos'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $file = $request->files->get('file');
        if ($file) {
            if (!str_starts_with($file->getMimeType() ?? '', 'image/')) {
                return $this->json(['error' => 'El archivo debe ser una imagen'], Response::HTTP_BAD_REQUEST);
            }
            $nombre = uniqid(strtolower($vista) . '_', true) . '.' . ($file->guessExtension() ?: 'jpg');
            try {
                $file->move($dirAbs, $nombre);
            } catch (\Throwable) {
                return $this->json(['error' => 'Error al guardar la imagen'], Response::HTTP_INTERNAL_SERVER_ERROR);
            }
        } else {
            $b64 = (string) ($json['foto'] ?? '');
            if (!preg_match('/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i', $b64, $m) || ($bin = base64_decode($m[2], true)) === false) {
                return $this->json(['error' => 'No se recibió la imagen'], Response::HTTP_BAD_REQUEST);
            }
            $nombre = uniqid(strtolower($vista) . '_', true) . '.' . (strtolower($m[1]) === 'jpeg' ? 'jpg' : strtolower($m[1]));
            file_put_contents($dirAbs . '/' . $nombre, $bin);
        }
        $ruta = $dirRel . '/' . $nombre;

        $user = $this->getUser();
        $this->connection->executeStatement(
            'INSERT INTO ANIMAL_FOTO (id_animal, tipo_vista, ruta, descripcion, usuario_registro) VALUES (:ia, :tv, :ru, :de, :ur)',
            ['ia' => $id, 'tv' => $vista, 'ru' => $ruta,
             'de' => $descripcion ? mb_substr(trim((string) $descripcion), 0, 200) : null,
             'ur' => $user instanceof User ? $user->getId() : null]
        );
        // Si no tenía foto principal (o se pidió), esta queda como principal
        $actual = $this->connection->fetchOne('SELECT foto_url FROM ANIMAL WHERE id_animal = :id', ['id' => $id]);
        if ($principal || !$actual) {
            $this->connection->executeStatement('UPDATE ANIMAL SET foto_url = :f WHERE id_animal = :id', ['f' => $ruta, 'id' => $id]);
        }

        return $this->json(['success' => true, 'data' => $this->listarFotos($id)], Response::HTTP_CREATED);
    }

    /** Deja una foto de la galería como principal del animal. */
    #[Route('/fotos/{idFoto}/principal', name: 'api_animales_fotos_principal', methods: ['PUT'], requirements: ['idFoto' => '\d+'])]
    public function fotoPrincipal(int $idFoto): JsonResponse
    {
        $f = $this->connection->fetchAssociative('SELECT id_animal, ruta FROM ANIMAL_FOTO WHERE id_foto = :id', ['id' => $idFoto]);
        if (!$f) {
            return $this->json(['error' => 'Foto no encontrada'], Response::HTTP_NOT_FOUND);
        }
        $this->connection->executeStatement('UPDATE ANIMAL SET foto_url = :r WHERE id_animal = :ia', ['r' => $f['RUTA'], 'ia' => $f['ID_ANIMAL']]);

        return $this->json(['success' => true, 'data' => $this->listarFotos((int) $f['ID_ANIMAL'])]);
    }

    #[Route('/fotos/{idFoto}', name: 'api_animales_fotos_eliminar', methods: ['DELETE'], requirements: ['idFoto' => '\d+'])]
    public function eliminarFotoGaleria(int $idFoto): JsonResponse
    {
        $f = $this->connection->fetchAssociative('SELECT id_animal, ruta FROM ANIMAL_FOTO WHERE id_foto = :id', ['id' => $idFoto]);
        if (!$f) {
            return $this->json(['error' => 'Foto no encontrada'], Response::HTTP_NOT_FOUND);
        }
        $idAnimal = (int) $f['ID_ANIMAL'];
        $this->connection->executeStatement('DELETE FROM ANIMAL_FOTO WHERE id_foto = :id', ['id' => $idFoto]);
        $abs = $this->getParameter('kernel.project_dir') . '/public' . $f['RUTA'];
        if (str_starts_with((string) $f['RUTA'], '/uploads/animales/') && is_file($abs)) {
            @unlink($abs);
        }
        // Si era la principal, pasa a la siguiente de la galería (o queda sin foto)
        $actual = $this->connection->fetchOne('SELECT foto_url FROM ANIMAL WHERE id_animal = :id', ['id' => $idAnimal]);
        if ($actual === $f['RUTA']) {
            $otra = $this->connection->fetchOne(
                'SELECT ruta FROM ANIMAL_FOTO WHERE id_animal = :id ORDER BY id_foto FETCH FIRST 1 ROWS ONLY', ['id' => $idAnimal]
            );
            $this->connection->executeStatement('UPDATE ANIMAL SET foto_url = :f WHERE id_animal = :id', ['f' => $otra ?: null, 'id' => $idAnimal]);
        }

        return $this->json(['success' => true, 'data' => $this->listarFotos($idAnimal)]);
    }

    private function listarFotos(int $idAnimal): array
    {
        $principal = $this->connection->fetchOne('SELECT foto_url FROM ANIMAL WHERE id_animal = :id', ['id' => $idAnimal]);
        $orden = "CASE tipo_vista WHEN 'LATERAL' THEN 1 WHEN 'FRONTAL' THEN 2 WHEN 'POSTERIOR' THEN 3 WHEN 'CABEZA' THEN 4
                  WHEN 'UBRE' THEN 5 WHEN 'TESTICULOS' THEN 5 WHEN 'PATAS' THEN 6 ELSE 7 END";
        $filas = $this->connection->fetchAllAssociative(
            "SELECT id_foto, tipo_vista, ruta, descripcion, TO_CHAR(fecha_registro, 'YYYY-MM-DD') AS fecha
               FROM ANIMAL_FOTO WHERE id_animal = :id ORDER BY {$orden}, id_foto",
            ['id' => $idAnimal]
        );
        $fotos = array_map(fn($r) => [
            'idFoto'      => (int) $r['ID_FOTO'],
            'tipoVista'   => $r['TIPO_VISTA'],
            'url'         => $r['RUTA'],
            'descripcion' => $r['DESCRIPCION'],
            'fecha'       => $r['FECHA'],
            'principal'   => $r['RUTA'] === $principal,
        ], $filas);
        // La foto principal antigua (de antes de la galería) se muestra primero como "General"
        if ($principal && !in_array($principal, array_column($fotos, 'url'), true)) {
            array_unshift($fotos, ['idFoto' => null, 'tipoVista' => 'OTRA', 'url' => $principal,
                'descripcion' => 'Foto principal', 'fecha' => null, 'principal' => true]);
        }
        return $fotos;
    }

    private function guardarFoto(?string $fotoData): ?string
    {
        if (!$fotoData || !str_starts_with($fotoData, 'data:image')) {
            return null;
        }

        // data:image/jpeg;base64,/9j/4AAQ...
        if (!preg_match('/^data:image\/(jpeg|jpg|png|webp|gif);base64,(.+)$/i', $fotoData, $m)) {
            return null;
        }

        $ext      = strtolower($m[1] === 'jpeg' ? 'jpg' : $m[1]);
        $binData  = base64_decode($m[2]);
        if ($binData === false) {
            return null;
        }

        $dir      = $this->getParameter('kernel.project_dir') . '/public/uploads/animales';
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        $filename = uniqid('animal_', true) . '.' . $ext;
        file_put_contents($dir . '/' . $filename, $binData);

        return '/uploads/animales/' . $filename;
    }

    /** Nombre opcional: vacío, "." o "-" significa que la cabra solo tiene chapeta. */
    private static function limpiarNombre(mixed $n): ?string
    {
        $n = trim((string) ($n ?? ''));
        return ($n === '' || preg_match('/^[.\-_ ]+$/', $n)) ? null : mb_substr($n, 0, 100);
    }
}
