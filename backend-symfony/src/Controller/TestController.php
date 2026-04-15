<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

class TestController extends AbstractController
{
    #[Route('/api/test-db', name: 'test_db')]
    public function testDatabase(): Response
    {
        try {
            // Conectar directamente con OCI8
            $con = oci_connect('C##caprino', 'CaprinoPass2025', '127.0.0.1:1521/XEPDB1');
            
            if (!$con) {
                $error = oci_error();
                return new Response(json_encode([
                    'status' => 'error',
                    'message' => 'No se pudo conectar a Oracle',
                    'error' => $error['message']
                ]), Response::HTTP_INTERNAL_SERVER_ERROR, ['Content-Type' => 'application/json']);
            }

            // Ejecutar una consulta simple
            $stid = oci_parse($con, 'SELECT COUNT(*) as tabla_count FROM user_tables');
            if (!oci_execute($stid)) {
                $error = oci_error($stid);
                oci_close($con);
                return new Response(json_encode([
                    'status' => 'error',
                    'message' => 'Error ejecutando consulta',
                    'error' => $error['message']
                ]), Response::HTTP_INTERNAL_SERVER_ERROR, ['Content-Type' => 'application/json']);
            }

            $row = oci_fetch_array($stid, OCI_ASSOC);
            oci_close($con);

            return new Response(json_encode([
                'status' => 'success',
                'message' => 'Conexión exitosa a Oracle',
                'database' => 'XEPDB1',
                'user' => 'C##caprino',
                'tables_count' => $row['TABLA_COUNT']
            ]), Response::HTTP_OK, ['Content-Type' => 'application/json']);

        } catch (\Exception $e) {
            return new Response(json_encode([
                'status' => 'error',
                'message' => 'Excepción PHP',
                'error' => $e->getMessage()
            ]), Response::HTTP_INTERNAL_SERVER_ERROR, ['Content-Type' => 'application/json']);
        }
    }
}
