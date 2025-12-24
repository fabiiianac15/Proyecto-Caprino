<?php

namespace App\Repository;

use App\Entity\Pesaje;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * Repositorio para la entidad Pesaje
 * 
 * Métodos personalizados para consultas específicas de pesajes
 */
class PesajeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Pesaje::class);
    }

    /**
     * Obtiene todos los pesajes de un animal específico ordenados por fecha
     * 
     * @param int $idAnimal ID del animal
     * @return Pesaje[] Array de pesajes
     */
    public function findByAnimal(int $idAnimal): array
    {
        return $this->createQueryBuilder('p')
            ->andWhere('p.animal = :idAnimal')
            ->setParameter('idAnimal', $idAnimal)
            ->orderBy('p.fechaPesaje', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Obtiene el último pesaje de un animal
     * 
     * @param int $idAnimal ID del animal
     * @return Pesaje|null Último pesaje o null si no hay
     */
    public function findUltimoPesaje(int $idAnimal): ?Pesaje
    {
        return $this->createQueryBuilder('p')
            ->andWhere('p.animal = :idAnimal')
            ->setParameter('idAnimal', $idAnimal)
            ->orderBy('p.fechaPesaje', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Obtiene pesajes en un rango de fechas
     * 
     * @param \DateTimeInterface $fechaInicio
     * @param \DateTimeInterface $fechaFin
     * @return Pesaje[]
     */
    public function findByRangoFechas(\DateTimeInterface $fechaInicio, \DateTimeInterface $fechaFin): array
    {
        return $this->createQueryBuilder('p')
            ->andWhere('p.fechaPesaje BETWEEN :inicio AND :fin')
            ->setParameter('inicio', $fechaInicio)
            ->setParameter('fin', $fechaFin)
            ->orderBy('p.fechaPesaje', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Calcula el promedio de ganancia diaria por rango de edad
     * 
     * @return array Array con estadísticas
     */
    public function getEstadisticasGananciaPorEdad(): array
    {
        $conn = $this->getEntityManager()->getConnection();
        
        $sql = '
            SELECT 
                CASE 
                    WHEN edad_dias <= 90 THEN \'0-3 meses\'
                    WHEN edad_dias <= 180 THEN \'3-6 meses\'
                    WHEN edad_dias <= 365 THEN \'6-12 meses\'
                    ELSE \'Más de 1 año\'
                END AS rango_edad,
                COUNT(*) AS total_pesajes,
                ROUND(AVG(ganancia_diaria_kg), 3) AS ganancia_promedio,
                ROUND(MIN(ganancia_diaria_kg), 3) AS ganancia_minima,
                ROUND(MAX(ganancia_diaria_kg), 3) AS ganancia_maxima
            FROM PESAJE
            WHERE ganancia_diaria_kg IS NOT NULL
            GROUP BY 
                CASE 
                    WHEN edad_dias <= 90 THEN \'0-3 meses\'
                    WHEN edad_dias <= 180 THEN \'3-6 meses\'
                    WHEN edad_dias <= 365 THEN \'6-12 meses\'
                    ELSE \'Más de 1 año\'
                END
            ORDER BY rango_edad
        ';
        
        return $conn->executeQuery($sql)->fetchAllAssociative();
    }
}
