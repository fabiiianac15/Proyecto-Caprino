<?php

namespace App\Repository;

use App\Entity\Animal;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Animal>
 */
class AnimalRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Animal::class);
    }

    /**
     * Buscar animales por estado general
     */
    public function findByEstadoGeneral(string $estado): array
    {
        return $this->createQueryBuilder('a')
            ->andWhere('a.estadoGeneral = :estado')
            ->setParameter('estado', $estado)
            ->orderBy('a.fechaNacimiento', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Buscar animales activos por raza
     */
    public function findActivosByRaza(int $idRaza): array
    {
        return $this->createQueryBuilder('a')
            ->andWhere('a.idRaza = :idRaza')
            ->andWhere('a.estadoGeneral IN (:estados)')
            ->setParameter('idRaza', $idRaza)
            ->setParameter('estados', ['activo', 'gestante', 'lactante'])
            ->orderBy('a.codigoIdentificacion', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Obtener animales disponibles para reproducción (por sexo y edad)
     */
    public function findDisponiblesParaReproduccion(string $sexo): array
    {
        $qb = $this->createQueryBuilder('a');
        
        return $qb
            ->andWhere('a.sexo = :sexo')
            ->andWhere('a.estadoGeneral = :estado')
            ->andWhere('a.estadoReproductivo = :estadoRepro')
            ->setParameter('sexo', $sexo)
            ->setParameter('estado', 'activo')
            ->setParameter('estadoRepro', 'disponible')
            ->orderBy('a.fechaNacimiento', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
