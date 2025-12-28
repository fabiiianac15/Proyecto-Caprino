<?php

namespace App\Repository;

use App\Entity\Raza;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Raza>
 */
class RazaRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Raza::class);
    }

    public function findActivas(): array
    {
        return $this->createQueryBuilder('r')
            ->andWhere('r.estado = :estado')
            ->setParameter('estado', 'activa')
            ->orderBy('r.nombreRaza', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
