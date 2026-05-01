<?php

namespace App\Doctrine;

use Doctrine\DBAL\Driver;
use Doctrine\DBAL\Driver\Middleware;
use Doctrine\DBAL\Driver\Middleware\AbstractDriverMiddleware;

/**
 * Middleware que corrige los parámetros de conexión Oracle TNS.
 *
 * DoctrineBundle inyecta host=localhost y port=1521 como defaults,
 * lo que hace que EasyConnectString construya un descriptor TCP en lugar
 * de usar el alias TNS del wallet. Este middleware reemplaza esos defaults
 * con el connectstring del tnsnames.ora.
 */
class OracleTnsMiddleware implements Middleware
{
    public function wrap(Driver $driver): Driver
    {
        return new class($driver) extends AbstractDriverMiddleware {
            public function connect(array $params): Driver\Connection
            {
                // Si el driver es OCI8 y hay un dbname pero el host fue inyectado
                // por DoctrineBundle como default, usar el dbname como connectstring TNS
                if (isset($params['dbname']) && ($params['host'] ?? '') === 'localhost') {
                    $params['connectstring'] = $params['dbname'];
                    unset($params['host'], $params['port']);
                }

                return parent::connect($params);
            }
        };
    }
}
