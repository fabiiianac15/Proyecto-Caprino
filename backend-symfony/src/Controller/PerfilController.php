<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/perfil')]
class PerfilController extends AbstractController
{
    public function __construct(private Connection $connection) {}

    // ─── GET /api/perfil ────────────────────────────────────────────────────────
    #[Route('', name: 'api_perfil_get', methods: ['GET'])]
    public function getPerfil(): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['error' => 'No autenticado'], Response::HTTP_UNAUTHORIZED);
        }

        $id = $user->getId();

        // Crear fila de perfil si no existe
        $existe = $this->connection->fetchOne(
            'SELECT COUNT(*) FROM USUARIO_PERFIL WHERE id_usuario = :id',
            ['id' => $id]
        );
        if (!$existe) {
            $this->connection->executeStatement(
                "INSERT INTO USUARIO_PERFIL (id_usuario) VALUES (:id)",
                ['id' => $id]
            );
        }

        $perfil = $this->connection->fetchAssociative(
            'SELECT * FROM USUARIO_PERFIL WHERE id_usuario = :id',
            ['id' => $id]
        );

        return $this->json($this->normalizarPerfil($perfil));
    }

    // ─── PUT /api/perfil ─────────────────────────────────────────────────────────
    #[Route('', name: 'api_perfil_put', methods: ['PUT'])]
    public function updatePerfil(Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['error' => 'No autenticado'], Response::HTTP_UNAUTHORIZED);
        }

        $id   = $user->getId();
        $data = json_decode($request->getContent(), true) ?? [];

        // Actualizar nombre en USUARIO si viene
        if (!empty($data['nombre'])) {
            $this->connection->executeStatement(
                'UPDATE USUARIO SET nombre_completo = :nombre WHERE id_usuario = :id',
                ['nombre' => trim($data['nombre']), 'id' => $id]
            );
        }

        // Crear perfil si no existe
        $existe = $this->connection->fetchOne(
            'SELECT COUNT(*) FROM USUARIO_PERFIL WHERE id_usuario = :id',
            ['id' => $id]
        );
        if (!$existe) {
            $this->connection->executeStatement(
                "INSERT INTO USUARIO_PERFIL (id_usuario) VALUES (:id)",
                ['id' => $id]
            );
        }

        $campos = [
            'telefono', 'cedula', 'direccion', 'ciudad', 'departamento',
            'nombre_granja', 'tipo_produccion', 'area_total', 'sistema_manejo', 'capacidad_instalada',
            'coordenadas_gps', 'altitud', 'temperatura_prom', 'precipitacion',
            'nit', 'registro_ica', 'registro_ganadero', 'licencia_ambiental',
            'notif_reproduccion', 'notif_salud', 'notif_produccion', 'notif_reportes', 'notif_push',
        ];

        // Fecha de nacimiento: convertir de string a DATE
        $fechaNac = null;
        if (!empty($data['fecha_nacimiento'])) {
            $fechaNac = date('Y-m-d', strtotime($data['fecha_nacimiento']));
        }

        $sets    = [];
        $params  = ['id' => $id];

        foreach ($campos as $campo) {
            $claveFrontend = $this->camelCase($campo);
            $valor = $data[$claveFrontend] ?? $data[$campo] ?? null;
            if ($valor !== null) {
                $sets[]         = "$campo = :$campo";
                $params[$campo] = $valor;
            }
        }

        if ($fechaNac !== null) {
            $sets[]                    = "fecha_nacimiento = TO_DATE(:fecha_nacimiento,'YYYY-MM-DD')";
            $params['fecha_nacimiento'] = $fechaNac;
        }

        if (!empty($sets)) {
            $sets[] = "fecha_actualizacion = CURRENT_TIMESTAMP";
            $sql    = 'UPDATE USUARIO_PERFIL SET ' . implode(', ', $sets) . ' WHERE id_usuario = :id';
            $this->connection->executeStatement($sql, $params);
        }

        return $this->json(['success' => true, 'message' => 'Perfil actualizado correctamente']);
    }

    // ─── PUT /api/perfil/password ────────────────────────────────────────────────
    #[Route('/password', name: 'api_perfil_password', methods: ['PUT'])]
    public function changePassword(Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['error' => 'No autenticado'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $passwordActual = $data['password_actual'] ?? '';
        $passwordNueva  = $data['password_nueva']  ?? '';

        if (!$passwordActual || !$passwordNueva) {
            return $this->json(['error' => 'Se requieren ambas contraseñas'], Response::HTTP_BAD_REQUEST);
        }

        if (strlen($passwordNueva) < 8) {
            return $this->json(['error' => 'La nueva contraseña debe tener al menos 8 caracteres'], Response::HTTP_BAD_REQUEST);
        }

        // Verificar contraseña actual
        $hashActual = $this->connection->fetchOne(
            'SELECT password_hash FROM USUARIO WHERE id_usuario = :id',
            ['id' => $user->getId()]
        );

        if (!password_verify($passwordActual, $hashActual)) {
            return $this->json(['error' => 'La contraseña actual es incorrecta'], Response::HTTP_BAD_REQUEST);
        }

        $nuevoHash = password_hash($passwordNueva, PASSWORD_BCRYPT);
        $this->connection->executeStatement(
            'UPDATE USUARIO SET password_hash = :hash WHERE id_usuario = :id',
            ['hash' => $nuevoHash, 'id' => $user->getId()]
        );

        return $this->json(['success' => true, 'message' => 'Contraseña actualizada correctamente']);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private function normalizarPerfil(array $p): array
    {
        return [
            'telefono'           => $p['TELEFONO']            ?? $p['telefono']            ?? '',
            'cedula'             => $p['CEDULA']              ?? $p['cedula']              ?? '',
            'fechaNacimiento'    => $p['FECHA_NACIMIENTO']    ?? $p['fecha_nacimiento']    ?? '',
            'direccion'          => $p['DIRECCION']           ?? $p['direccion']           ?? '',
            'ciudad'             => $p['CIUDAD']              ?? $p['ciudad']              ?? '',
            'departamento'       => $p['DEPARTAMENTO']        ?? $p['departamento']        ?? '',
            'nombreGranja'       => $p['NOMBRE_GRANJA']       ?? $p['nombre_granja']       ?? 'Granja Experimental UFPSO',
            'tipoProduccion'     => $p['TIPO_PRODUCCION']     ?? $p['tipo_produccion']     ?? 'Leche y Carne',
            'areaTotal'          => $p['AREA_TOTAL']          ?? $p['area_total']          ?? '',
            'sistemaManejo'      => $p['SISTEMA_MANEJO']      ?? $p['sistema_manejo']      ?? '',
            'capacidadInstalada' => $p['CAPACIDAD_INSTALADA'] ?? $p['capacidad_instalada'] ?? '',
            'coordenadasGPS'     => $p['COORDENADAS_GPS']     ?? $p['coordenadas_gps']     ?? '8°14\'20"N, 73°21\'21"W',
            'altitud'            => $p['ALTITUD']             ?? $p['altitud']             ?? '1.200 msnm',
            'temperaturaPromedio'=> $p['TEMPERATURA_PROM']    ?? $p['temperatura_prom']    ?? '21°C',
            'precipitacion'      => $p['PRECIPITACION']       ?? $p['precipitacion']       ?? '1.400 mm/año',
            'nit'                => $p['NIT']                 ?? $p['nit']                 ?? '',
            'ica'                => $p['REGISTRO_ICA']        ?? $p['registro_ica']        ?? '',
            'registroGanadero'   => $p['REGISTRO_GANADERO']  ?? $p['registro_ganadero']   ?? '',
            'licenciaAmbiental'  => $p['LICENCIA_AMBIENTAL']  ?? $p['licencia_ambiental']  ?? '',
            'notifReproduccion'  => (bool)($p['NOTIF_REPRODUCCION'] ?? $p['notif_reproduccion'] ?? true),
            'notifSalud'         => (bool)($p['NOTIF_SALUD']        ?? $p['notif_salud']        ?? true),
            'notifProduccion'    => (bool)($p['NOTIF_PRODUCCION']   ?? $p['notif_produccion']   ?? true),
            'notifReportes'      => (bool)($p['NOTIF_REPORTES']     ?? $p['notif_reportes']     ?? false),
            'notifPush'          => (bool)($p['NOTIF_PUSH']         ?? $p['notif_push']         ?? true),
        ];
    }

    private function camelCase(string $snake): string
    {
        $map = [
            'nombre_granja'       => 'nombreGranja',
            'tipo_produccion'     => 'tipoProduccion',
            'area_total'          => 'areaTotal',
            'sistema_manejo'      => 'sistemaManejo',
            'capacidad_instalada' => 'capacidadInstalada',
            'coordenadas_gps'     => 'coordenadasGPS',
            'temperatura_prom'    => 'temperaturaPromedio',
            'registro_ica'        => 'ica',
            'registro_ganadero'   => 'registroGanadero',
            'licencia_ambiental'  => 'licenciaAmbiental',
            'notif_reproduccion'  => 'notifReproduccion',
            'notif_salud'         => 'notifSalud',
            'notif_produccion'    => 'notifProduccion',
            'notif_reportes'      => 'notifReportes',
            'notif_push'          => 'notifPush',
        ];
        return $map[$snake] ?? lcfirst(str_replace('_', '', ucwords($snake, '_')));
    }
}
