<?php

namespace App\Repository;

use App\Entity\Genealogia;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * Repositorio para la entidad Genealogia
 * 
 * Métodos personalizados para consultas genealógicas y análisis de parentesco
 */
class GenealogiaRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Genealogia::class);
    }

    /**
     * Obtiene el registro genealógico de un animal
     * 
     * @param int $idCria ID del animal
     * @return Genealogia|null
     */
    public function findByCria(int $idCria): ?Genealogia
    {
        return $this->createQueryBuilder('g')
            ->andWhere('g.cria = :idCria')
            ->setParameter('idCria', $idCria)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Obtiene todas las crías de un padre
     * 
     * @param int $idPadre ID del padre
     * @return Genealogia[]
     */
    public function findByPadre(int $idPadre): array
    {
        return $this->createQueryBuilder('g')
            ->andWhere('g.padre = :idPadre')
            ->setParameter('idPadre', $idPadre)
            ->getQuery()
            ->getResult();
    }

    /**
     * Obtiene todas las crías de una madre
     * 
     * @param int $idMadre ID de la madre
     * @return Genealogia[]
     */
    public function findByMadre(int $idMadre): array
    {
        return $this->createQueryBuilder('g')
            ->andWhere('g.madre = :idMadre')
            ->setParameter('idMadre', $idMadre)
            ->getQuery()
            ->getResult();
    }

    /**
     * Obtiene hermanos completos (mismo padre y madre)
     * 
     * @param int $idAnimal ID del animal
     * @return array Array de genealogías de hermanos
     */
    public function findHermanosCompletos(int $idAnimal): array
    {
        $genealogia = $this->findByCria($idAnimal);
        
        if (!$genealogia || !$genealogia->getPadre() || !$genealogia->getMadre()) {
            return [];
        }

        return $this->createQueryBuilder('g')
            ->andWhere('g.padre = :padre')
            ->andWhere('g.madre = :madre')
            ->andWhere('g.cria != :cria')
            ->setParameter('padre', $genealogia->getPadre())
            ->setParameter('madre', $genealogia->getMadre())
            ->setParameter('cria', $idAnimal)
            ->getQuery()
            ->getResult();
    }

    /**
     * Obtiene medio hermanos (mismo padre o misma madre, pero no ambos)
     * 
     * @param int $idAnimal ID del animal
     * @return array Array con 'por_padre' y 'por_madre'
     */
    public function findMedioHermanos(int $idAnimal): array
    {
        $genealogia = $this->findByCria($idAnimal);
        
        if (!$genealogia) {
            return ['por_padre' => [], 'por_madre' => []];
        }

        $porPadre = [];
        $porMadre = [];

        if ($genealogia->getPadre()) {
            $qb = $this->createQueryBuilder('g')
                ->andWhere('g.padre = :padre')
                ->andWhere('g.cria != :cria')
                ->setParameter('padre', $genealogia->getPadre())
                ->setParameter('cria', $idAnimal);
            
            if ($genealogia->getMadre()) {
                $qb->andWhere('g.madre != :madre')
                   ->setParameter('madre', $genealogia->getMadre());
            }
            
            $porPadre = $qb->getQuery()->getResult();
        }

        if ($genealogia->getMadre()) {
            $qb = $this->createQueryBuilder('g')
                ->andWhere('g.madre = :madre')
                ->andWhere('g.cria != :cria')
                ->setParameter('madre', $genealogia->getMadre())
                ->setParameter('cria', $idAnimal);
            
            if ($genealogia->getPadre()) {
                $qb->andWhere('g.padre != :padre')
                   ->setParameter('padre', $genealogia->getPadre());
            }
            
            $porMadre = $qb->getQuery()->getResult();
        }

        return [
            'por_padre' => $porPadre,
            'por_madre' => $porMadre
        ];
    }

    /**
     * Obtiene animales con alta consanguinidad
     * 
     * @param float $umbral Umbral mínimo de consanguinidad (default: 0.25)
     * @return Genealogia[]
     */
    public function findAltaConsanguinidad(float $umbral = 0.25): array
    {
        return $this->createQueryBuilder('g')
            ->andWhere('g.coeficienteConsanguinidad > :umbral')
            ->setParameter('umbral', $umbral)
            ->orderBy('g.coeficienteConsanguinidad', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Obtiene animales con pedigrí certificado
     * 
     * @return Genealogia[]
     */
    public function findConPedigriCertificado(): array
    {
        return $this->createQueryBuilder('g')
            ->andWhere('g.pedigriCertificado = :si')
            ->setParameter('si', 'Sí')
            ->orderBy('g.numeroCertificado', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Obtiene estadísticas genealógicas generales
     * 
     * @return array
     */
    public function getEstadisticasGenealogicas(): array
    {
        $conn = $this->getEntityManager()->getConnection();
        
        $sql = '
            SELECT 
                COUNT(*) AS total_registros,
                SUM(CASE WHEN id_padre IS NOT NULL AND id_madre IS NOT NULL THEN 1 ELSE 0 END) AS genealogias_completas,
                SUM(CASE WHEN pedigri_certificado = \'Sí\' THEN 1 ELSE 0 END) AS con_pedigri,
                SUM(CASE WHEN coeficiente_consanguinidad > 0.25 THEN 1 ELSE 0 END) AS alta_consanguinidad,
                ROUND(AVG(CASE WHEN coeficiente_consanguinidad IS NOT NULL THEN coeficiente_consanguinidad END), 4) AS consanguinidad_promedio,
                ROUND(AVG(generaciones_conocidas), 1) AS generaciones_promedio,
                MAX(generaciones_conocidas) AS generaciones_maximas
            FROM GENEALOGIA
        ';
        
        return $conn->executeQuery($sql)->fetchAssociative() ?: [];
    }

    /**
     * Obtiene el ranking de reproductores por número de crías
     * 
     * @param string $sexo 'Macho' o 'Hembra'
     * @param int $limite Número de animales a retornar
     * @return array
     */
    public function getRankingReproductores(string $sexo = 'Macho', int $limite = 10): array
    {
        $conn = $this->getEntityManager()->getConnection();
        
        $campo = $sexo === 'Macho' ? 'id_padre' : 'id_madre';
        
        $sql = "
            SELECT 
                a.id_animal,
                a.identificacion,
                a.nombre,
                r.nombre_raza,
                COUNT(*) AS total_crias,
                ROUND(AVG(g.coeficiente_consanguinidad), 4) AS consanguinidad_promedio_crias,
                MIN(ac.fecha_nacimiento) AS cria_mas_antigua,
                MAX(ac.fecha_nacimiento) AS cria_mas_reciente
            FROM GENEALOGIA g
            INNER JOIN ANIMAL a ON g.{$campo} = a.id_animal
            INNER JOIN RAZA r ON a.id_raza = r.id_raza
            INNER JOIN ANIMAL ac ON g.id_cria = ac.id_animal
            WHERE g.{$campo} IS NOT NULL
            GROUP BY a.id_animal, a.identificacion, a.nombre, r.nombre_raza
            ORDER BY total_crias DESC
            FETCH FIRST :limite ROWS ONLY
        ";
        
        return $conn->executeQuery($sql, [
            'limite' => $limite
        ])->fetchAllAssociative();
    }

    /**
     * Verifica si dos animales están emparentados
     * 
     * @param int $idAnimal1 ID del primer animal
     * @param int $idAnimal2 ID del segundo animal
     * @return array Información del parentesco si existe
     */
    public function verificarParentesco(int $idAnimal1, int $idAnimal2): array
    {
        $gen1 = $this->findByCria($idAnimal1);
        $gen2 = $this->findByCria($idAnimal2);

        $parentesco = [
            'emparentados' => false,
            'tipo_parentesco' => null,
            'detalles' => []
        ];

        if (!$gen1 || !$gen2) {
            return $parentesco;
        }

        // Verificar si son hermanos completos
        if ($gen1->getPadre() && $gen2->getPadre() && 
            $gen1->getMadre() && $gen2->getMadre() &&
            $gen1->getPadre()->getId() === $gen2->getPadre()->getId() &&
            $gen1->getMadre()->getId() === $gen2->getMadre()->getId()) {
            
            $parentesco['emparentados'] = true;
            $parentesco['tipo_parentesco'] = 'Hermanos completos';
            $parentesco['detalles'][] = 'Mismo padre y misma madre';
            return $parentesco;
        }

        // Verificar medio hermanos por padre
        if ($gen1->getPadre() && $gen2->getPadre() && 
            $gen1->getPadre()->getId() === $gen2->getPadre()->getId()) {
            
            $parentesco['emparentados'] = true;
            $parentesco['tipo_parentesco'] = 'Medio hermanos por padre';
            $parentesco['detalles'][] = 'Mismo padre';
        }

        // Verificar medio hermanos por madre
        if ($gen1->getMadre() && $gen2->getMadre() && 
            $gen1->getMadre()->getId() === $gen2->getMadre()->getId()) {
            
            $parentesco['emparentados'] = true;
            $parentesco['tipo_parentesco'] = 'Medio hermanos por madre';
            $parentesco['detalles'][] = 'Misma madre';
        }

        // Verificar relación padre-hijo
        if ($gen1->getPadre() && $gen1->getPadre()->getId() === $idAnimal2) {
            $parentesco['emparentados'] = true;
            $parentesco['tipo_parentesco'] = 'Padre-hijo';
            $parentesco['detalles'][] = 'Animal 2 es padre de Animal 1';
        }

        if ($gen1->getMadre() && $gen1->getMadre()->getId() === $idAnimal2) {
            $parentesco['emparentados'] = true;
            $parentesco['tipo_parentesco'] = 'Madre-hijo';
            $parentesco['detalles'][] = 'Animal 2 es madre de Animal 1';
        }

        if ($gen2->getPadre() && $gen2->getPadre()->getId() === $idAnimal1) {
            $parentesco['emparentados'] = true;
            $parentesco['tipo_parentesco'] = 'Padre-hijo';
            $parentesco['detalles'][] = 'Animal 1 es padre de Animal 2';
        }

        if ($gen2->getMadre() && $gen2->getMadre()->getId() === $idAnimal1) {
            $parentesco['emparentados'] = true;
            $parentesco['tipo_parentesco'] = 'Madre-hijo';
            $parentesco['detalles'][] = 'Animal 1 es madre de Animal 2';
        }

        return $parentesco;
    }

    /**
     * Construye el árbol genealógico de un animal hasta N generaciones
     * 
     * @param int $idAnimal ID del animal
     * @param int $generaciones Número de generaciones hacia atrás (default: 3)
     * @return array Árbol genealógico
     */
    public function construirArbolGenealogico(int $idAnimal, int $generaciones = 3): array
    {
        if ($generaciones <= 0) {
            return [];
        }

        $genealogia = $this->findByCria($idAnimal);
        
        if (!$genealogia) {
            return [];
        }

        $arbol = [
            'animal_id' => $idAnimal,
            'padre' => null,
            'madre' => null
        ];

        if ($genealogia->getPadre()) {
            $arbol['padre'] = [
                'animal_id' => $genealogia->getPadre()->getId(),
                'identificacion' => $genealogia->getPadre()->getIdentificacion(),
                'nombre' => $genealogia->getPadre()->getNombre(),
                'ancestros' => $this->construirArbolGenealogico(
                    $genealogia->getPadre()->getId(), 
                    $generaciones - 1
                )
            ];
        }

        if ($genealogia->getMadre()) {
            $arbol['madre'] = [
                'animal_id' => $genealogia->getMadre()->getId(),
                'identificacion' => $genealogia->getMadre()->getIdentificacion(),
                'nombre' => $genealogia->getMadre()->getNombre(),
                'ancestros' => $this->construirArbolGenealogico(
                    $genealogia->getMadre()->getId(), 
                    $generaciones - 1
                )
            ];
        }

        return $arbol;
    }
}
