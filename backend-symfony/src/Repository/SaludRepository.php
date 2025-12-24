<?php

namespace App\Repository;

use App\Entity\Salud;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * Repositorio para la entidad Salud
 * 
 * Métodos personalizados para consultas sanitarias y de salud animal
 */
class SaludRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Salud::class);
    }

    /**
     * Obtiene todo el historial sanitario de un animal
     * 
     * @param int $idAnimal ID del animal
     * @return Salud[]
     */
    public function findByAnimal(int $idAnimal): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.animal = :idAnimal')
            ->setParameter('idAnimal', $idAnimal)
            ->orderBy('s.fechaEvento', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Obtiene eventos sanitarios por tipo
     * 
     * @param string $tipoEvento Tipo de evento
     * @return Salud[]
     */
    public function findByTipo(string $tipoEvento): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.tipoEvento = :tipo')
            ->setParameter('tipo', $tipoEvento)
            ->orderBy('s.fechaEvento', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Obtiene eventos sanitarios que requieren seguimiento próximo
     * 
     * @param int $diasAdelante Días hacia adelante para buscar
     * @return Salud[]
     */
    public function findProximosEventos(int $diasAdelante = 30): array
    {
        $fechaLimite = new \DateTime("+{$diasAdelante} days");
        $hoy = new \DateTime();

        return $this->createQueryBuilder('s')
            ->andWhere('s.fechaProxima BETWEEN :hoy AND :limite')
            ->setParameter('hoy', $hoy)
            ->setParameter('limite', $fechaLimite)
            ->orderBy('s.fechaProxima', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Obtiene animales en período de retiro
     * 
     * @return array Array con información de animales en retiro
     */
    public function findAnimalesEnRetiro(): array
    {
        $conn = $this->getEntityManager()->getConnection();
        
        $sql = '
            SELECT 
                s.id_salud,
                a.id_animal,
                a.identificacion,
                a.nombre,
                s.tipo_evento,
                s.descripcion,
                s.producto,
                s.fecha_evento,
                s.dias_retiro,
                (s.fecha_evento + s.dias_retiro) AS fecha_fin_retiro,
                TRUNC((s.fecha_evento + s.dias_retiro) - SYSDATE) AS dias_restantes
            FROM SALUD s
            INNER JOIN ANIMAL a ON s.id_animal = a.id_animal
            WHERE s.dias_retiro IS NOT NULL
            AND s.dias_retiro > 0
            AND (s.fecha_evento + s.dias_retiro) >= SYSDATE
            ORDER BY fecha_fin_retiro ASC
        ';
        
        return $conn->executeQuery($sql)->fetchAllAssociative();
    }

    /**
     * Obtiene estadísticas sanitarias por tipo de evento
     * 
     * @param \DateTimeInterface $fechaInicio
     * @param \DateTimeInterface $fechaFin
     * @return array
     */
    public function getEstadisticasPorTipo(\DateTimeInterface $fechaInicio, \DateTimeInterface $fechaFin): array
    {
        $conn = $this->getEntityManager()->getConnection();
        
        $sql = '
            SELECT 
                tipo_evento,
                COUNT(*) AS total_eventos,
                COUNT(DISTINCT id_animal) AS animales_afectados,
                ROUND(SUM(CASE WHEN costo IS NOT NULL THEN costo ELSE 0 END), 2) AS costo_total,
                ROUND(AVG(CASE WHEN costo IS NOT NULL THEN costo END), 2) AS costo_promedio
            FROM SALUD
            WHERE fecha_evento BETWEEN :inicio AND :fin
            GROUP BY tipo_evento
            ORDER BY total_eventos DESC
        ';
        
        return $conn->executeQuery($sql, [
            'inicio' => $fechaInicio->format('Y-m-d'),
            'fin' => $fechaFin->format('Y-m-d')
        ])->fetchAllAssociative();
    }

    /**
     * Obtiene las enfermedades más frecuentes
     * 
     * @param int $limite Número de enfermedades a retornar
     * @return array
     */
    public function getEnfermedadesFrecuentes(int $limite = 10): array
    {
        $conn = $this->getEntityManager()->getConnection();
        
        $sql = '
            SELECT 
                diagnostico,
                COUNT(*) AS casos,
                COUNT(DISTINCT id_animal) AS animales_afectados,
                ROUND(SUM(CASE WHEN costo IS NOT NULL THEN costo ELSE 0 END), 2) AS costo_total,
                SUM(CASE WHEN estado_resultado = \'Recuperado\' THEN 1 ELSE 0 END) AS casos_recuperados,
                SUM(CASE WHEN estado_resultado = \'Fallecido\' THEN 1 ELSE 0 END) AS casos_fallecidos
            FROM SALUD
            WHERE tipo_evento = \'Enfermedad\'
            AND diagnostico IS NOT NULL
            GROUP BY diagnostico
            ORDER BY casos DESC
            FETCH FIRST :limite ROWS ONLY
        ';
        
        return $conn->executeQuery($sql, [
            'limite' => $limite
        ])->fetchAllAssociative();
    }

    /**
     * Obtiene el calendario de vacunación pendiente
     * 
     * @return array Vacunas próximas o vencidas
     */
    public function getCalendarioVacunacion(): array
    {
        $conn = $this->getEntityManager()->getConnection();
        
        $sql = '
            SELECT 
                s.id_salud,
                a.id_animal,
                a.identificacion,
                a.nombre,
                s.descripcion AS vacuna,
                s.fecha_evento AS ultima_aplicacion,
                s.fecha_proxima,
                TRUNC(s.fecha_proxima - SYSDATE) AS dias_hasta_proxima,
                CASE 
                    WHEN s.fecha_proxima < SYSDATE THEN \'Vencida\'
                    WHEN s.fecha_proxima <= SYSDATE + 7 THEN \'Urgente\'
                    WHEN s.fecha_proxima <= SYSDATE + 30 THEN \'Próxima\'
                    ELSE \'Programada\'
                END AS estado
            FROM SALUD s
            INNER JOIN ANIMAL a ON s.id_animal = a.id_animal
            WHERE s.tipo_evento = \'Vacunación\'
            AND s.fecha_proxima IS NOT NULL
            AND s.fecha_proxima >= SYSDATE - 30
            AND a.estado = \'Activo\'
            ORDER BY s.fecha_proxima ASC
        ';
        
        return $conn->executeQuery($sql)->fetchAllAssociative();
    }

    /**
     * Obtiene el historial de temperaturas anormales
     * 
     * @param \DateTimeInterface $fechaInicio
     * @param \DateTimeInterface $fechaFin
     * @return array
     */
    public function getTemperaturasAnormales(\DateTimeInterface $fechaInicio, \DateTimeInterface $fechaFin): array
    {
        return $this->createQueryBuilder('s')
            ->select('s', 'a')
            ->join('s.animal', 'a')
            ->andWhere('s.temperaturaCorporal IS NOT NULL')
            ->andWhere('s.temperaturaCorporal < 38.5 OR s.temperaturaCorporal > 40.0')
            ->andWhere('s.fechaEvento BETWEEN :inicio AND :fin')
            ->setParameter('inicio', $fechaInicio)
            ->setParameter('fin', $fechaFin)
            ->orderBy('s.fechaEvento', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Obtiene el resumen sanitario de un animal
     * 
     * @param int $idAnimal ID del animal
     * @return array Resumen con conteos por tipo de evento
     */
    public function getResumenSanitario(int $idAnimal): array
    {
        $conn = $this->getEntityManager()->getConnection();
        
        $sql = '
            SELECT 
                tipo_evento,
                COUNT(*) AS total,
                MAX(fecha_evento) AS ultimo_evento
            FROM SALUD
            WHERE id_animal = :idAnimal
            GROUP BY tipo_evento
            ORDER BY ultimo_evento DESC
        ';
        
        return $conn->executeQuery($sql, [
            'idAnimal' => $idAnimal
        ])->fetchAllAssociative();
    }
}
