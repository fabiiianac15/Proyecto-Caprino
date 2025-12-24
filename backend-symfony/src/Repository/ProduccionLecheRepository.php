<?php

namespace App\Repository;

use App\Entity\ProduccionLeche;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * Repositorio para la entidad ProduccionLeche
 * 
 * Métodos personalizados para consultas y estadísticas de producción láctea
 */
class ProduccionLecheRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ProduccionLeche::class);
    }

    /**
     * Obtiene toda la producción de un animal específico
     * 
     * @param int $idAnimal ID del animal
     * @return ProduccionLeche[]
     */
    public function findByAnimal(int $idAnimal): array
    {
        return $this->createQueryBuilder('p')
            ->andWhere('p.animal = :idAnimal')
            ->setParameter('idAnimal', $idAnimal)
            ->orderBy('p.fechaOrdeño', 'DESC')
            ->addOrderBy('p.turnoOrdeño', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Calcula la producción total diaria de un animal en una fecha
     * 
     * @param int $idAnimal ID del animal
     * @param \DateTimeInterface $fecha Fecha a consultar
     * @return float Total de litros producidos ese día
     */
    public function getProduccionDiaria(int $idAnimal, \DateTimeInterface $fecha): float
    {
        $result = $this->createQueryBuilder('p')
            ->select('SUM(p.litrosProducidos) as total')
            ->andWhere('p.animal = :idAnimal')
            ->andWhere('p.fechaOrdeño = :fecha')
            ->setParameter('idAnimal', $idAnimal)
            ->setParameter('fecha', $fecha)
            ->getQuery()
            ->getSingleScalarResult();

        return (float) ($result ?? 0);
    }

    /**
     * Calcula el promedio de producción de un animal en un período
     * 
     * @param int $idAnimal ID del animal
     * @param \DateTimeInterface $fechaInicio
     * @param \DateTimeInterface $fechaFin
     * @return float Promedio diario de litros
     */
    public function getPromedioProduccion(int $idAnimal, \DateTimeInterface $fechaInicio, \DateTimeInterface $fechaFin): float
    {
        $result = $this->createQueryBuilder('p')
            ->select('AVG(p.litrosProducidos) as promedio')
            ->andWhere('p.animal = :idAnimal')
            ->andWhere('p.fechaOrdeño BETWEEN :inicio AND :fin')
            ->setParameter('idAnimal', $idAnimal)
            ->setParameter('inicio', $fechaInicio)
            ->setParameter('fin', $fechaFin)
            ->getQuery()
            ->getSingleScalarResult();

        return round((float) ($result ?? 0), 2);
    }

    /**
     * Obtiene la curva de lactancia de un animal (producción por día de lactancia)
     * 
     * @param int $idAnimal ID del animal
     * @param int $numeroLactancia Número de lactancia específica
     * @return array Array con dias_lactancia y produccion_promedio
     */
    public function getCurvaLactancia(int $idAnimal, int $numeroLactancia): array
    {
        $conn = $this->getEntityManager()->getConnection();
        
        $sql = '
            SELECT 
                dias_lactancia,
                ROUND(AVG(litros_producidos), 2) AS produccion_promedio,
                COUNT(*) AS num_registros
            FROM PRODUCCION_LECHE
            WHERE id_animal = :idAnimal
            AND numero_lactancia = :numeroLactancia
            GROUP BY dias_lactancia
            ORDER BY dias_lactancia
        ';
        
        return $conn->executeQuery($sql, [
            'idAnimal' => $idAnimal,
            'numeroLactancia' => $numeroLactancia
        ])->fetchAllAssociative();
    }

    /**
     * Obtiene estadísticas de calidad de leche por período
     * 
     * @param \DateTimeInterface $fechaInicio
     * @param \DateTimeInterface $fechaFin
     * @return array Estadísticas de grasa, proteína y CCS
     */
    public function getEstadisticasCalidad(\DateTimeInterface $fechaInicio, \DateTimeInterface $fechaFin): array
    {
        $conn = $this->getEntityManager()->getConnection();
        
        $sql = '
            SELECT 
                COUNT(*) AS total_registros,
                ROUND(AVG(porcentaje_grasa), 2) AS grasa_promedio,
                ROUND(AVG(porcentaje_proteina), 2) AS proteina_promedio,
                ROUND(AVG(ccs), 0) AS ccs_promedio,
                SUM(CASE WHEN ccs > 500000 THEN 1 ELSE 0 END) AS registros_con_mastitis,
                ROUND(AVG(litros_producidos), 2) AS produccion_promedio
            FROM PRODUCCION_LECHE
            WHERE fecha_ordeño BETWEEN :inicio AND :fin
            AND porcentaje_grasa IS NOT NULL
            AND porcentaje_proteina IS NOT NULL
        ';
        
        return $conn->executeQuery($sql, [
            'inicio' => $fechaInicio->format('Y-m-d'),
            'fin' => $fechaFin->format('Y-m-d')
        ])->fetchAssociative() ?: [];
    }

    /**
     * Obtiene el ranking de animales por producción en un período
     * 
     * @param \DateTimeInterface $fechaInicio
     * @param \DateTimeInterface $fechaFin
     * @param int $limite Número de animales a retornar
     * @return array Ranking de animales con producción total y promedio
     */
    public function getRankingProduccion(\DateTimeInterface $fechaInicio, \DateTimeInterface $fechaFin, int $limite = 10): array
    {
        $conn = $this->getEntityManager()->getConnection();
        
        $sql = '
            SELECT 
                a.id_animal,
                a.identificacion,
                a.nombre,
                r.nombre_raza,
                COUNT(*) AS total_ordeños,
                ROUND(SUM(p.litros_producidos), 2) AS produccion_total,
                ROUND(AVG(p.litros_producidos), 2) AS produccion_promedio,
                ROUND(AVG(p.porcentaje_grasa), 2) AS grasa_promedio
            FROM PRODUCCION_LECHE p
            INNER JOIN ANIMAL a ON p.id_animal = a.id_animal
            INNER JOIN RAZA r ON a.id_raza = r.id_raza
            WHERE p.fecha_ordeño BETWEEN :inicio AND :fin
            GROUP BY a.id_animal, a.identificacion, a.nombre, r.nombre_raza
            ORDER BY produccion_total DESC
            FETCH FIRST :limite ROWS ONLY
        ';
        
        return $conn->executeQuery($sql, [
            'inicio' => $fechaInicio->format('Y-m-d'),
            'fin' => $fechaFin->format('Y-m-d'),
            'limite' => $limite
        ])->fetchAllAssociative();
    }
}
