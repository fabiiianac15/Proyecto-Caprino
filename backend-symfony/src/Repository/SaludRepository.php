<?php

namespace App\Repository;

use App\Entity\Salud;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class SaludRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Salud::class);
    }

    /** @return Salud[] */
    public function findByAnimal(int $idAnimal): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.animal = :idAnimal')
            ->setParameter('idAnimal', $idAnimal)
            ->orderBy('s.fechaAplicacion', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /** @return Salud[] */
    public function findByTipo(string $tipoRegistro): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.tipoRegistro = :tipo')
            ->setParameter('tipo', $tipoRegistro)
            ->orderBy('s.fechaAplicacion', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /** @return Salud[] */
    public function findProximosEventos(int $diasAdelante = 30): array
    {
        $fechaLimite = new \DateTime("+{$diasAdelante} days");
        $hoy = new \DateTime();

        return $this->createQueryBuilder('s')
            ->andWhere('s.fechaProximaAplicacion BETWEEN :hoy AND :limite')
            ->setParameter('hoy', $hoy)
            ->setParameter('limite', $fechaLimite)
            ->orderBy('s.fechaProximaAplicacion', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findAnimalesEnRetiro(): array
    {
        $conn = $this->getEntityManager()->getConnection();

        $sql = "
            SELECT
                s.id_registro,
                a.id_animal,
                a.codigo_identificacion AS identificacion,
                a.nombre,
                s.tipo_registro       AS tipo_evento,
                s.medicamento_producto AS producto,
                s.fecha_aplicacion,
                s.dias_retiro_leche,
                s.dias_retiro_carne,
                (s.fecha_aplicacion + GREATEST(NVL(s.dias_retiro_leche,0), NVL(s.dias_retiro_carne,0))) AS fecha_fin_retiro,
                TRUNC((s.fecha_aplicacion + GREATEST(NVL(s.dias_retiro_leche,0), NVL(s.dias_retiro_carne,0))) - SYSDATE) AS dias_restantes
            FROM SALUD s
            INNER JOIN ANIMAL a ON s.id_animal = a.id_animal
            WHERE (s.dias_retiro_leche > 0 OR s.dias_retiro_carne > 0)
            AND (s.fecha_aplicacion + GREATEST(NVL(s.dias_retiro_leche,0), NVL(s.dias_retiro_carne,0))) >= SYSDATE
            ORDER BY fecha_fin_retiro ASC
        ";

        return $conn->executeQuery($sql)->fetchAllAssociative();
    }

    public function getEstadisticasPorTipo(\DateTimeInterface $fechaInicio, \DateTimeInterface $fechaFin): array
    {
        $conn = $this->getEntityManager()->getConnection();

        $sql = "
            SELECT
                tipo_registro          AS tipo_evento,
                COUNT(*)               AS total_eventos,
                COUNT(DISTINCT id_animal) AS animales_afectados
            FROM SALUD
            WHERE fecha_aplicacion BETWEEN TO_DATE(:inicio,'YYYY-MM-DD') AND TO_DATE(:fin,'YYYY-MM-DD')
            GROUP BY tipo_registro
            ORDER BY total_eventos DESC
        ";

        return $conn->executeQuery($sql, [
            'inicio' => $fechaInicio->format('Y-m-d'),
            'fin'    => $fechaFin->format('Y-m-d'),
        ])->fetchAllAssociative();
    }

    public function getEnfermedadesFrecuentes(int $limite = 10): array
    {
        $conn = $this->getEntityManager()->getConnection();

        $sql = "
            SELECT
                enfermedad_diagnostico AS diagnostico,
                COUNT(*)               AS casos,
                COUNT(DISTINCT id_animal) AS animales_afectados
            FROM SALUD
            WHERE tipo_registro = 'diagnostico'
            AND enfermedad_diagnostico IS NOT NULL
            GROUP BY enfermedad_diagnostico
            ORDER BY casos DESC
            FETCH FIRST :limite ROWS ONLY
        ";

        return $conn->executeQuery($sql, ['limite' => $limite])->fetchAllAssociative();
    }

    public function getCalendarioVacunacion(): array
    {
        $conn = $this->getEntityManager()->getConnection();

        $sql = "
            SELECT
                s.id_registro,
                a.id_animal,
                a.codigo_identificacion AS identificacion,
                a.nombre,
                s.medicamento_producto  AS vacuna,
                s.fecha_aplicacion      AS ultima_aplicacion,
                s.fecha_proxima_aplicacion AS fecha_proxima,
                TRUNC(s.fecha_proxima_aplicacion - SYSDATE) AS dias_hasta_proxima,
                CASE
                    WHEN s.fecha_proxima_aplicacion < SYSDATE THEN 'Vencida'
                    WHEN s.fecha_proxima_aplicacion <= SYSDATE + 7 THEN 'Urgente'
                    WHEN s.fecha_proxima_aplicacion <= SYSDATE + 30 THEN 'Próxima'
                    ELSE 'Programada'
                END AS estado
            FROM SALUD s
            INNER JOIN ANIMAL a ON s.id_animal = a.id_animal
            WHERE s.tipo_registro = 'vacuna'
            AND s.fecha_proxima_aplicacion IS NOT NULL
            AND s.fecha_proxima_aplicacion >= SYSDATE - 30
            AND a.estado = 'activo'
            ORDER BY s.fecha_proxima_aplicacion ASC
        ";

        return $conn->executeQuery($sql)->fetchAllAssociative();
    }

    public function getResumenSanitario(int $idAnimal): array
    {
        $conn = $this->getEntityManager()->getConnection();

        $sql = "
            SELECT
                tipo_registro  AS tipo_evento,
                COUNT(*)       AS total,
                MAX(fecha_aplicacion) AS ultimo_evento
            FROM SALUD
            WHERE id_animal = :idAnimal
            GROUP BY tipo_registro
            ORDER BY ultimo_evento DESC
        ";

        return $conn->executeQuery($sql, ['idAnimal' => $idAnimal])->fetchAllAssociative();
    }
}
