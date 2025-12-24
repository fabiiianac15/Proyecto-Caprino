<?php

namespace App\Controller;

use App\Service\NotificacionService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Controlador de Notificaciones
 * 
 * Endpoints para obtener alertas y notificaciones del sistema
 */
#[Route('/api/notificaciones', name: 'api_notificaciones_')]
class NotificacionController extends AbstractController
{
    public function __construct(
        private NotificacionService $notificacionService
    ) {}

    /**
     * Obtiene todas las notificaciones pendientes
     */
    #[Route('', name: 'index', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $notificaciones = $this->notificacionService->obtenerNotificacionesPendientes();
        $contadores = $this->notificacionService->contarNotificacionesPorPrioridad();
        
        return $this->json([
            'success' => true,
            'data' => $notificaciones,
            'contadores' => $contadores
        ]);
    }

    /**
     * Obtiene solo notificaciones urgentes (alta prioridad)
     */
    #[Route('/urgentes', name: 'urgentes', methods: ['GET'])]
    public function urgentes(): JsonResponse
    {
        $notificaciones = $this->notificacionService->obtenerNotificacionesUrgentes();
        
        return $this->json([
            'success' => true,
            'total' => count($notificaciones),
            'data' => $notificaciones
        ]);
    }

    /**
     * Obtiene resumen de contadores por prioridad
     */
    #[Route('/contadores', name: 'contadores', methods: ['GET'])]
    public function contadores(): JsonResponse
    {
        $contadores = $this->notificacionService->contarNotificacionesPorPrioridad();
        
        return $this->json([
            'success' => true,
            'data' => $contadores
        ]);
    }
}
