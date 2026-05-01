<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/auditoria')]
class AuditoriaController extends AbstractController
{
    public function __construct(private Connection $connection) {}

    #[Route('', name: 'api_auditoria_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $tabla     = $request->query->get('tabla');
        $operacion = $request->query->get('operacion');
        $usuario   = $request->query->get('usuario');
        $desde     = $request->query->get('desde');
        $hasta     = $request->query->get('hasta');
        $limite    = min((int) ($request->query->get('limite', 100)), 500);

        $sql    = "SELECT a.id_auditoria, a.tabla, a.operacion, a.id_registro,
                          a.descripcion, a.nombre_usuario, a.id_usuario,
                          a.ip_origen, a.fecha_operacion,
                          a.datos_anteriores, a.datos_nuevos
                   FROM AUDITORIA a
                   WHERE 1=1";
        $params = [];

        if ($tabla) {
            $sql .= ' AND UPPER(a.tabla) = UPPER(:tabla)';
            $params['tabla'] = $tabla;
        }
        if ($operacion) {
            $sql .= ' AND UPPER(a.operacion) = UPPER(:op)';
            $params['op'] = $operacion;
        }
        if ($usuario) {
            $sql .= ' AND LOWER(a.nombre_usuario) LIKE LOWER(:usr)';
            $params['usr'] = '%' . $usuario . '%';
        }
        if ($desde) {
            $sql .= " AND a.fecha_operacion >= TO_TIMESTAMP(:desde, 'YYYY-MM-DD')";
            $params['desde'] = $desde;
        }
        if ($hasta) {
            $sql .= " AND a.fecha_operacion < TO_TIMESTAMP(:hasta, 'YYYY-MM-DD') + 1";
            $params['hasta'] = $hasta;
        }

        $sql .= ' ORDER BY a.fecha_operacion DESC FETCH FIRST :lim ROWS ONLY';
        $params['lim'] = $limite;

        $rows = $this->connection->fetchAllAssociative($sql, $params);

        $data = array_map(fn($r) => [
            'id'              => (int) $r['ID_AUDITORIA'],
            'tabla'           => $r['TABLA'],
            'operacion'       => $r['OPERACION'],
            'idRegistro'      => $r['ID_REGISTRO'] !== null ? (int) $r['ID_REGISTRO'] : null,
            'descripcion'     => $r['DESCRIPCION'],
            'usuario'         => $r['NOMBRE_USUARIO'] ?? 'Sistema',
            'idUsuario'       => $r['ID_USUARIO'] !== null ? (int) $r['ID_USUARIO'] : null,
            'ip'              => $r['IP_ORIGEN'],
            'fecha'           => $r['FECHA_OPERACION'],
            'datosAnteriores' => $r['DATOS_ANTERIORES'] ? json_decode($r['DATOS_ANTERIORES'], true) : null,
            'datosNuevos'     => $r['DATOS_NUEVOS']     ? json_decode($r['DATOS_NUEVOS'],     true) : null,
        ], $rows);

        return $this->json(['data' => $data, 'total' => count($data)]);
    }

    #[Route('/resumen', name: 'api_auditoria_resumen', methods: ['GET'])]
    public function resumen(): JsonResponse
    {
        $stats = [];

        $stats['totalAcciones'] = (int) $this->connection->fetchOne('SELECT COUNT(*) FROM AUDITORIA');

        $stats['porOperacion'] = $this->connection->fetchAllAssociative(
            "SELECT operacion, COUNT(*) as total FROM AUDITORIA GROUP BY operacion ORDER BY total DESC"
        );

        $stats['porUsuario'] = $this->connection->fetchAllAssociative(
            "SELECT NVL(nombre_usuario, 'Sistema') as usuario, COUNT(*) as total
             FROM AUDITORIA GROUP BY nombre_usuario ORDER BY total DESC FETCH FIRST 10 ROWS ONLY"
        );

        $stats['ultimasAcciones'] = $this->connection->fetchAllAssociative(
            "SELECT tabla, operacion, descripcion, nombre_usuario, fecha_operacion
             FROM AUDITORIA ORDER BY fecha_operacion DESC FETCH FIRST 5 ROWS ONLY"
        );

        return $this->json(['data' => $stats]);
    }
}
