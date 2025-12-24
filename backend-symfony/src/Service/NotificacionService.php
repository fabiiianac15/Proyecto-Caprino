<?php

namespace App\Service;

use App\Repository\ReproduccionRepository;
use App\Repository\SaludRepository;

/**
 * Servicio de Notificaciones y Alertas
 * 
 * Genera alertas para eventos importantes que requieren atención
 */
class NotificacionService
{
    public function __construct(
        private ReproduccionRepository $reproduccionRepository,
        private SaludRepository $saludRepository
    ) {}

    /**
     * Obtiene todas las notificaciones pendientes
     * 
     * @return array Array de notificaciones agrupadas por tipo
     */
    public function obtenerNotificacionesPendientes(): array
    {
        return [
            'partos_proximos' => $this->getAlertasPartosProximos(),
            'diagnosticos_pendientes' => $this->getAlertasDiagnosticosPendientes(),
            'vacunaciones_proximas' => $this->getAlertasVacunacionesProximas(),
            'seguimiento_sanitario' => $this->getAlertasSeguimientoSanitario(),
            'animales_en_retiro' => $this->getAlertasAnimalesEnRetiro(),
        ];
    }

    /**
     * Alertas de partos próximos (siguientes 15 días)
     * 
     * @return array
     */
    private function getAlertasPartosProximos(): array
    {
        $partosProximos = $this->reproduccionRepository->findPartosProximos(15);
        
        $alertas = [];
        foreach ($partosProximos as $reproduccion) {
            $diasRestantes = $reproduccion->getFechaPartoEstimada()
                ->diff(new \DateTime())->days;
            
            $alertas[] = [
                'tipo' => 'parto_proximo',
                'prioridad' => $diasRestantes <= 7 ? 'alta' : 'media',
                'animal_id' => $reproduccion->getHembra()->getId(),
                'identificacion' => $reproduccion->getHembra()->getIdentificacion(),
                'nombre' => $reproduccion->getHembra()->getNombre(),
                'fecha_estimada' => $reproduccion->getFechaPartoEstimada()->format('Y-m-d'),
                'dias_restantes' => $diasRestantes,
                'mensaje' => "Parto estimado en {$diasRestantes} días"
            ];
        }
        
        return $alertas;
    }

    /**
     * Alertas de diagnósticos de gestación pendientes
     * 
     * @return array
     */
    private function getAlertasDiagnosticosPendientes(): array
    {
        $pendientes = $this->reproduccionRepository->findPendientesDiagnostico();
        
        $alertas = [];
        foreach ($pendientes as $reproduccion) {
            $diasDesdeServicio = $reproduccion->getFechaServicio()
                ->diff(new \DateTime())->days;
            
            $alertas[] = [
                'tipo' => 'diagnostico_pendiente',
                'prioridad' => $diasDesdeServicio > 30 ? 'alta' : 'media',
                'animal_id' => $reproduccion->getHembra()->getId(),
                'identificacion' => $reproduccion->getHembra()->getIdentificacion(),
                'nombre' => $reproduccion->getHembra()->getNombre(),
                'fecha_servicio' => $reproduccion->getFechaServicio()->format('Y-m-d'),
                'dias_desde_servicio' => $diasDesdeServicio,
                'mensaje' => "Diagnóstico pendiente ({$diasDesdeServicio} días desde servicio)"
            ];
        }
        
        return $alertas;
    }

    /**
     * Alertas de vacunaciones próximas o vencidas
     * 
     * @return array
     */
    private function getAlertasVacunacionesProximas(): array
    {
        $calendario = $this->saludRepository->getCalendarioVacunacion();
        
        $alertas = [];
        foreach ($calendario as $vacuna) {
            $estado = $vacuna['estado'];
            $prioridad = match($estado) {
                'Vencida' => 'alta',
                'Urgente' => 'alta',
                'Próxima' => 'media',
                default => 'baja'
            };
            
            $alertas[] = [
                'tipo' => 'vacunacion',
                'prioridad' => $prioridad,
                'estado' => $estado,
                'animal_id' => $vacuna['id_animal'],
                'identificacion' => $vacuna['identificacion'],
                'nombre' => $vacuna['nombre'],
                'vacuna' => $vacuna['vacuna'],
                'fecha_proxima' => $vacuna['fecha_proxima'],
                'dias_hasta_proxima' => $vacuna['dias_hasta_proxima'],
                'mensaje' => "{$vacuna['vacuna']} - Estado: {$estado}"
            ];
        }
        
        return $alertas;
    }

    /**
     * Alertas de seguimiento sanitario próximo
     * 
     * @return array
     */
    private function getAlertasSeguimientoSanitario(): array
    {
        $proximosEventos = $this->saludRepository->findProximosEventos(15);
        
        $alertas = [];
        foreach ($proximosEventos as $evento) {
            $diasRestantes = $evento->getDiasHastaProximoEvento();
            
            if ($diasRestantes !== null && $diasRestantes <= 15) {
                $alertas[] = [
                    'tipo' => 'seguimiento_sanitario',
                    'prioridad' => $diasRestantes <= 7 ? 'alta' : 'media',
                    'animal_id' => $evento->getAnimal()->getId(),
                    'identificacion' => $evento->getAnimal()->getIdentificacion(),
                    'nombre' => $evento->getAnimal()->getNombre(),
                    'tipo_evento' => $evento->getTipoEvento(),
                    'descripcion' => $evento->getDescripcion(),
                    'fecha_proxima' => $evento->getFechaProxima()->format('Y-m-d'),
                    'dias_restantes' => $diasRestantes,
                    'mensaje' => "{$evento->getTipoEvento()} en {$diasRestantes} días: {$evento->getDescripcion()}"
                ];
            }
        }
        
        return $alertas;
    }

    /**
     * Alertas de animales en período de retiro
     * 
     * @return array
     */
    private function getAlertasAnimalesEnRetiro(): array
    {
        $animalesEnRetiro = $this->saludRepository->findAnimalesEnRetiro();
        
        $alertas = [];
        foreach ($animalesEnRetiro as $retiro) {
            $alertas[] = [
                'tipo' => 'retiro',
                'prioridad' => 'alta',
                'animal_id' => $retiro['id_animal'],
                'identificacion' => $retiro['identificacion'],
                'nombre' => $retiro['nombre'],
                'tipo_evento' => $retiro['tipo_evento'],
                'producto' => $retiro['producto'],
                'fecha_fin_retiro' => $retiro['fecha_fin_retiro'],
                'dias_restantes' => $retiro['dias_restantes'],
                'mensaje' => "En retiro por {$retiro['producto']} ({$retiro['dias_restantes']} días restantes)"
            ];
        }
        
        return $alertas;
    }

    /**
     * Cuenta el total de notificaciones por prioridad
     * 
     * @return array
     */
    public function contarNotificacionesPorPrioridad(): array
    {
        $notificaciones = $this->obtenerNotificacionesPendientes();
        
        $contadores = [
            'alta' => 0,
            'media' => 0,
            'baja' => 0,
            'total' => 0
        ];
        
        foreach ($notificaciones as $categoria => $alertas) {
            foreach ($alertas as $alerta) {
                $prioridad = $alerta['prioridad'] ?? 'baja';
                $contadores[$prioridad]++;
                $contadores['total']++;
            }
        }
        
        return $contadores;
    }

    /**
     * Obtiene solo notificaciones de alta prioridad
     * 
     * @return array
     */
    public function obtenerNotificacionesUrgentes(): array
    {
        $todasLasNotificaciones = $this->obtenerNotificacionesPendientes();
        $urgentes = [];
        
        foreach ($todasLasNotificaciones as $categoria => $alertas) {
            foreach ($alertas as $alerta) {
                if (($alerta['prioridad'] ?? '') === 'alta') {
                    $urgentes[] = $alerta;
                }
            }
        }
        
        // Ordenar por tipo para agrupar
        usort($urgentes, function($a, $b) {
            return strcmp($a['tipo'], $b['tipo']);
        });
        
        return $urgentes;
    }
}
