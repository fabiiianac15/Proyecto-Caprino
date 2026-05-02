<?php

namespace App\Doctrine;

use Doctrine\DBAL\Driver;
use Doctrine\DBAL\Driver\Middleware;
use Doctrine\DBAL\Driver\Middleware\AbstractDriverMiddleware;

/**
 * Middleware Oracle: corrige la conexión TNS y establece formatos NLS.
 *
 * 1. TNS fix: DoctrineBundle inyecta host=localhost por defecto, lo que hace
 *    que OCI8 construya un descriptor TCP en lugar de usar el alias del wallet.
 *    Se reemplaza por el connectstring del tnsnames.ora.
 *
 * 2. NLS fix: Oracle devuelve fechas/timestamps en formato regional (ej.
 *    "30-APR-26 08.39.05.604257 PM") que Doctrine no puede parsear. Se fuerza
 *    el formato ISO en cada sesión para que DateTimeType funcione sin tipos custom.
 */
class OracleTnsMiddleware implements Middleware
{
    public function wrap(Driver $driver): Driver
    {
        return new class($driver) extends AbstractDriverMiddleware {
            public function connect(array $params): Driver\Connection
            {
                if (isset($params['dbname']) && ($params['host'] ?? '') === 'localhost') {
                    $params['connectstring'] = $params['dbname'];
                    unset($params['host'], $params['port']);
                }

                $conn = parent::connect($params);

                // Forzar formatos ISO para que Doctrine\DBAL\Types\DateTimeType
                // pueda convertir los valores sin lanzar ConversionException.
                $conn->prepare("ALTER SESSION SET NLS_DATE_FORMAT = 'YYYY-MM-DD'")->execute();
                $conn->prepare("ALTER SESSION SET NLS_TIMESTAMP_FORMAT = 'YYYY-MM-DD HH24:MI:SS'")->execute();
                $conn->prepare("ALTER SESSION SET NLS_TIMESTAMP_TZ_FORMAT = 'YYYY-MM-DD HH24:MI:SS TZH:TZM'")->execute();

                return $conn;
            }
        };
    }
}
