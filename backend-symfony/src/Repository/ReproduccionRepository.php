<?php

namespace App\Repository;

use App\Entity\Reproduccion;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * Repositorio para la entidad Reproduccion
 * 
 * Métodos personalizados para consultas y estadísticas reproductivas
 */
class ReproduccionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Reproduccion::class);
    }

    /**
     * Obtiene el historial reproductivo completo de una hembra
     * 
     * @param int $idHembra ID del animal hembra
     * @return Reproduccion[]
     */
    public function findByHembra(int $idHembra): array
    {
        return $this->createQueryBuilder('r')
            ->andWhere('r.hembra = :idHembra')
            ->setParameter('idHembra', $idHembra)
            ->orderBy('r.fechaServicio', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Obtiene todos los servicios realizados por un macho
     * 
     * @param int $idMacho ID del animal macho
     * @return Reproduccion[]
     */
    public function findByMacho(int $idMacho): array
    {
        return $this->createQueryBuilder('r')
            ->andWhere('r.macho = :idMacho')
            ->setParameter('idMacho', $idMacho)
            ->orderBy('r.fechaServicio', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Obtiene hembras gestantes actualmente
     * 
     * @return Reproduccion[] Array de gestaciones activas
     */
    public function findGestantesActivas(): array
    {
        return $this->createQueryBuilder('r')
            ->andWhere('r.resultadoDiagnostico = :resultado')
            ->andWhere('r.fechaPartoReal IS NULL')
            ->setParameter('resultado', 'Positivo')
            ->orderBy('r.fechaPartoEstimada', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Obtiene partos próximos (en los siguientes N días)
     * 
     * @param int $dias Número de días hacia adelante
     * @return Reproduccion[]
     */
    public function findPartosProximos(int $dias = 30): array
    {
        $fechaLimite = new \DateTime("+{$dias} days");
        $hoy = new \DateTime();

        return $this->createQueryBuilder('r')
            ->andWhere('r.fechaPartoEstimada BETWEEN :hoy AND :limite')
            ->andWhere('r.fechaPartoReal IS NULL')
            ->andWhere('r.resultadoDiagnostico = :resultado')
            ->setParameter('hoy', $hoy)
            ->setParameter('limite', $fechaLimite)
            ->setParameter('resultado', 'Positivo')
            ->orderBy('r.fechaPartoEstimada', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Obtiene servicios pendientes de diagnóstico
     * 
     * @return Reproduccion[]
     */
    public function findPendientesDiagnostico(): array
    {
        $hace21Dias = new \DateTime('-21 days');

        return $this->createQueryBuilder('r')
            ->andWhere('r.resultadoDiagnostico = :pendiente')
            ->andWhere('r.fechaServicio <= :fecha')
            ->setParameter('pendiente', 'Pendiente')
            ->setParameter('fecha', $hace21Dias)
            ->orderBy('r.fechaServicio', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Calcula estadísticas reproductivas generales
     * 
     * @param \DateTimeInterface $fechaInicio
     * @param \DateTimeInterface $fechaFin
     * @return array Estadísticas del período
     */
    public function getEstadisticasReproductivas(\DateTimeInterface $fechaInicio, \DateTimeInterface $fechaFin): array
    {
        $conn = $this->getEntityManager()->getConnection();
        
        $sql = '
            SELECT 
                COUNT(*) AS total_servicios,
                SUM(CASE WHEN resultado_diagnostico = \'Positivo\' THEN 1 ELSE 0 END) AS servicios_efectivos,
                SUM(CASE WHEN resultado_diagnostico = \'Negativo\' THEN 1 ELSE 0 END) AS servicios_fallidos,
                SUM(CASE WHEN resultado_diagnostico = \'Pendiente\' THEN 1 ELSE 0 END) AS pendientes_diagnostico,
                ROUND(
                    (SUM(CASE WHEN resultado_diagnostico = \'Positivo\' THEN 1 ELSE 0 END) * 100.0 / 
                    NULLIF(SUM(CASE WHEN resultado_diagnostico IN (\'Positivo\', \'Negativo\') THEN 1 ELSE 0 END), 0)),
                    1
                ) AS tasa_concepcion,
                SUM(CASE WHEN fecha_parto_real IS NOT NULL THEN 1 ELSE 0 END) AS total_partos,
                SUM(CASE WHEN numero_crias IS NOT NULL THEN numero_crias ELSE 0 END) AS total_crias_nacidas,
                SUM(CASE WHEN crias_vivas IS NOT NULL THEN crias_vivas ELSE 0 END) AS total_crias_vivas,
                ROUND(AVG(CASE WHEN numero_crias > 0 THEN numero_crias END), 2) AS promedio_crias_por_parto,
                ROUND(AVG(CASE WHEN intervalo_partos_dias IS NOT NULL THEN intervalo_partos_dias END), 0) AS promedio_intervalo_partos
            FROM REPRODUCCION
            WHERE fecha_servicio BETWEEN :inicio AND :fin
        ';
        
        return $conn->executeQuery($sql, [
            'inicio' => $fechaInicio->format('Y-m-d'),
            'fin' => $fechaFin->format('Y-m-d')
        ])->fetchAssociative() ?: [];
    }

    /**
     * Obtiene el ranking de machos por efectividad
     * 
     * @param int $limite Número de machos a retornar
     * @return array Ranking de machos con estadísticas
     */
    public function getRankingMachos(int $limite = 10): array
    {
        $conn = $this->getEntityManager()->getConnection();
        
        $sql = '
            SELECT 
                a.id_animal,
                a.identificacion,
                a.nombre,
                COUNT(*) AS total_servicios,
                SUM(CASE WHEN r.resultado_diagnostico = \'Positivo\' THEN 1 ELSE 0 END) AS servicios_efectivos,
                ROUND(
                    (SUM(CASE WHEN r.resultado_diagnostico = \'Positivo\' THEN 1 ELSE 0 END) * 100.0 / 
                    NULLIF(COUNT(*), 0)),
                    1
                ) AS tasa_efectividad,
                SUM(CASE WHEN r.crias_vivas IS NOT NULL THEN r.crias_vivas ELSE 0 END) AS total_crias
            FROM REPRODUCCION r
            INNER JOIN ANIMAL a ON r.id_macho = a.id_animal
            WHERE r.id_macho IS NOT NULL
            GROUP BY a.id_animal, a.identificacion, a.nombre
            HAVING COUNT(*) >= 5
            ORDER BY tasa_efectividad DESC, total_servicios DESC
            FETCH FIRST :limite ROWS ONLY
        ';
        
        return $conn->executeQuery($sql, [
            'limite' => $limite
        ])->fetchAllAssociative();
    }

    /**
     * Obtiene la prolificidad por raza (promedio de crías por parto)
     * 
     * @return array Estadísticas por raza
     */
    public function getProlificidadPorRaza(): array
    {
        $conn = $this->getEntityManager()->getConnection();
        
        $sql = '
            SELECT 
                rz.nombre_raza,
                rz.tipo_produccion,
                COUNT(*) AS total_partos,
                ROUND(AVG(r.numero_crias), 2) AS promedio_crias,
                MAX(r.numero_crias) AS maximo_crias,
                SUM(CASE WHEN r.tipo_parto = \'Gemelar\' OR r.tipo_parto = \'Triple\' OR r.tipo_parto = \'Múltiple\' 
                    THEN 1 ELSE 0 END) AS partos_multiples,
                ROUND(AVG(r.crias_vivas * 100.0 / NULLIF(r.numero_crias, 0)), 1) AS tasa_sobrevivencia
            FROM REPRODUCCION r
            INNER JOIN ANIMAL a ON r.id_hembra = a.id_animal
            INNER JOIN RAZA rz ON a.id_raza = rz.id_raza
            WHERE r.fecha_parto_real IS NOT NULL
            AND r.numero_crias IS NOT NULL
            GROUP BY rz.nombre_raza, rz.tipo_produccion
            ORDER BY promedio_crias DESC
        ';
        
        return $conn->executeQuery($sql)->fetchAllAssociative();
    }

    /**
     * Obtiene el calendario reproductivo del mes
     * 
     * @param int $mes Mes (1-12)
     * @param int $año Año
     * @return array Eventos del mes
     */
    public function getCalendarioMensual(int $mes, int $año): array
    {
        $conn = $this->getEntityManager()->getConnection();
        
        $sql = '
            SELECT 
                r.id_reproduccion,
                a.identificacion,
                a.nombre,
                r.fecha_parto_estimada,
                r.tipo_servicio,
                TRUNC(r.fecha_parto_estimada - SYSDATE) AS dias_restantes
            FROM REPRODUCCION r
            INNER JOIN ANIMAL a ON r.id_hembra = a.id_animal
            WHERE EXTRACT(MONTH FROM r.fecha_parto_estimada) = :mes
            AND EXTRACT(YEAR FROM r.fecha_parto_estimada) = :año
            AND r.fecha_parto_real IS NULL
            AND r.resultado_diagnostico = \'Positivo\'
            ORDER BY r.fecha_parto_estimada ASC
        ';
        
        return $conn->executeQuery($sql, [
            'mes' => $mes,
            'año' => $año
        ])->fetchAllAssociative();
    }
}
