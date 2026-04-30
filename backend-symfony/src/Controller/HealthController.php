<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class HealthController extends AbstractController
{
    public function __construct(private Connection $connection) {}

    #[Route('/api/health', name: 'api_health', methods: ['GET'])]
    public function health(): JsonResponse
    {
        try {
            $this->connection->executeQuery('SELECT 1 FROM DUAL');
            $dbStatus = 'connected';
        } catch (\Throwable) {
            $dbStatus = 'error';
        }

        return $this->json([
            'status'    => 'ok',
            'database'  => $dbStatus,
            'timestamp' => date('Y-m-d H:i:s'),
        ]);
    }
}
