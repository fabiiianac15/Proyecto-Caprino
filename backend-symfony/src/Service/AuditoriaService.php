<?php

namespace App\Service;

use App\Entity\User;
use Doctrine\DBAL\Connection;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

class AuditoriaService
{
    public function __construct(
        private Connection            $connection,
        private RequestStack          $requestStack,
        private TokenStorageInterface $tokenStorage,
    ) {}

    // Mapeo de alias en español a los valores del CHECK constraint de Oracle
    private const OPS = [
        'CREAR'      => 'INSERT',
        'ACTUALIZAR' => 'UPDATE',
        'ELIMINAR'   => 'DELETE',
        'INSERT'     => 'INSERT',
        'UPDATE'     => 'UPDATE',
        'DELETE'     => 'DELETE',
    ];

    /**
     * Registra una acción en la tabla AUDITORIA.
     *
     * @param string     $tabla          Nombre de la tabla afectada (ej: 'ANIMAL')
     * @param string     $operacion      'INSERT'|'UPDATE'|'DELETE' (o alias: 'CREAR'|'ACTUALIZAR'|'ELIMINAR')
     * @param int|null   $idRegistro     PK del registro afectado
     * @param string     $descripcion    Texto legible para mostrar en la UI
     * @param array      $datosAnt       Estado anterior del registro (para UPDATE/DELETE)
     * @param array      $datosNuevos    Estado nuevo del registro (para CREATE/UPDATE)
     */
    public function registrar(
        string  $tabla,
        string  $operacion,
        ?int    $idRegistro,
        string  $descripcion,
        array   $datosAnt    = [],
        array   $datosNuevos = [],
        ?int    $idUsuario   = null,
        ?string $nombreUsuario = null,
    ): void {
        $operacion = self::OPS[strtoupper($operacion)] ?? 'UPDATE';
        // Obtener usuario desde el token de seguridad si no se pasó explícitamente
        if ($idUsuario === null) {
            $token = $this->tokenStorage->getToken();
            $user  = $token?->getUser();
            if ($user instanceof User) {
                $idUsuario    = $user->getId();
                $nombreUsuario = $user->getNombreCompleto() ?? $user->getEmail();
            }
        }

        $request = $this->requestStack->getCurrentRequest();
        $ip      = $request?->getClientIp();

        $this->connection->executeStatement(
            "INSERT INTO AUDITORIA
               (tabla, operacion, id_registro, datos_anteriores, datos_nuevos,
                id_usuario, nombre_usuario, descripcion, fecha_operacion, ip_origen)
             VALUES
               (:tabla, :op, :idReg, :ant, :nue,
                :uid, :unom, :desc, CURRENT_TIMESTAMP, :ip)",
            [
                'tabla'  => strtoupper($tabla),
                'op'     => strtoupper($operacion),
                'idReg'  => $idRegistro,
                'ant'    => $datosAnt    ? json_encode($datosAnt,    JSON_UNESCAPED_UNICODE) : null,
                'nue'    => $datosNuevos ? json_encode($datosNuevos, JSON_UNESCAPED_UNICODE) : null,
                'uid'    => $idUsuario,
                'unom'   => $nombreUsuario,
                'desc'   => $descripcion,
                'ip'     => $ip,
            ]
        );
    }
}
