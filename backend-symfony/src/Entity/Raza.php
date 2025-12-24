<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use App\Repository\RazaRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Entidad Raza - Catálogo de razas caprinas
 * 
 * Almacena información sobre las diferentes razas de cabras
 * y sus características zootécnicas principales.
 */
#[ORM\Entity(repositoryClass: RazaRepository::class)]
#[ORM\Table(name: 'RAZA')]
#[ApiResource(
    operations: [
        new GetCollection(),
        new Get(),
        new Post(security: "is_granted('ROLE_ADMIN')"),
        new Put(security: "is_granted('ROLE_ADMIN')")
    ],
    normalizationContext: ['groups' => ['raza:read']],
    denormalizationContext: ['groups' => ['raza:write']]
)]
class Raza
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(name: 'id_raza', type: Types::INTEGER)]
    #[Groups(['raza:read', 'animal:read'])]
    private ?int $id = null;

    /**
     * Nombre de la raza
     */
    #[ORM\Column(name: 'nombre_raza', type: Types::STRING, length: 100, unique: true)]
    #[Assert\NotBlank(message: 'El nombre de la raza es obligatorio')]
    #[Assert\Length(max: 100)]
    #[Groups(['raza:read', 'raza:write', 'animal:read'])]
    private ?string $nombreRaza = null;

    /**
     * Origen geográfico de la raza
     */
    #[ORM\Column(type: Types::STRING, length: 100, nullable: true)]
    #[Assert\Length(max: 100)]
    #[Groups(['raza:read', 'raza:write'])]
    private ?string $origen = null;

    /**
     * Características distintivas de la raza
     */
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['raza:read', 'raza:write'])]
    private ?string $caracteristicas = null;

    /**
     * Aptitud productiva de la raza
     * Valores: lechera, carnica, doble_proposito
     */
    #[ORM\Column(type: Types::STRING, length: 50)]
    #[Assert\Choice(
        choices: ['lechera', 'carnica', 'doble_proposito'],
        message: 'La aptitud debe ser: lechera, carnica o doble_proposito'
    )]
    #[Groups(['raza:read', 'raza:write', 'animal:read'])]
    private ?string $aptitud = null;

    /**
     * Peso adulto promedio en kilogramos
     */
    #[ORM\Column(name: 'peso_adulto_promedio_kg', type: Types::DECIMAL, precision: 5, scale: 2, nullable: true)]
    #[Assert\Positive(message: 'El peso debe ser positivo')]
    #[Assert\Range(min: 20, max: 150)]
    #[Groups(['raza:read', 'raza:write'])]
    private ?float $pesoAdultoPromedioKg = null;

    /**
     * Producción de leche promedio por día en litros
     */
    #[ORM\Column(name: 'produccion_leche_dia_promedio', type: Types::DECIMAL, precision: 5, scale: 2, nullable: true)]
    #[Assert\PositiveOrZero]
    #[Assert\Range(min: 0, max: 10)]
    #[Groups(['raza:read', 'raza:write'])]
    private ?float $produccionLecheDiaPromedio = null;

    /**
     * Estado de la raza en el catálogo
     */
    #[ORM\Column(type: Types::STRING, length: 20)]
    #[Assert\Choice(choices: ['activo', 'inactivo'])]
    #[Groups(['raza:read', 'raza:write'])]
    private string $estado = 'activo';

    /**
     * Fecha de creación del registro
     */
    #[ORM\Column(name: 'fecha_creacion', type: Types::DATETIME_MUTABLE)]
    #[Groups(['raza:read'])]
    private ?\DateTimeInterface $fechaCreacion = null;

    public function __construct()
    {
        $this->fechaCreacion = new \DateTime();
        $this->estado = 'activo';
    }

    // Getters y Setters

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNombreRaza(): ?string
    {
        return $this->nombreRaza;
    }

    public function setNombreRaza(string $nombreRaza): self
    {
        $this->nombreRaza = $nombreRaza;
        return $this;
    }

    public function getOrigen(): ?string
    {
        return $this->origen;
    }

    public function setOrigen(?string $origen): self
    {
        $this->origen = $origen;
        return $this;
    }

    public function getCaracteristicas(): ?string
    {
        return $this->caracteristicas;
    }

    public function setCaracteristicas(?string $caracteristicas): self
    {
        $this->caracteristicas = $caracteristicas;
        return $this;
    }

    public function getAptitud(): ?string
    {
        return $this->aptitud;
    }

    public function setAptitud(string $aptitud): self
    {
        $this->aptitud = $aptitud;
        return $this;
    }

    public function getPesoAdultoPromedioKg(): ?float
    {
        return $this->pesoAdultoPromedioKg;
    }

    public function setPesoAdultoPromedioKg(?float $pesoAdultoPromedioKg): self
    {
        $this->pesoAdultoPromedioKg = $pesoAdultoPromedioKg;
        return $this;
    }

    public function getProduccionLecheDiaPromedio(): ?float
    {
        return $this->produccionLecheDiaPromedio;
    }

    public function setProduccionLecheDiaPromedio(?float $produccionLecheDiaPromedio): self
    {
        $this->produccionLecheDiaPromedio = $produccionLecheDiaPromedio;
        return $this;
    }

    public function getEstado(): string
    {
        return $this->estado;
    }

    public function setEstado(string $estado): self
    {
        $this->estado = $estado;
        return $this;
    }

    public function getFechaCreacion(): ?\DateTimeInterface
    {
        return $this->fechaCreacion;
    }

    public function setFechaCreacion(\DateTimeInterface $fechaCreacion): self
    {
        $this->fechaCreacion = $fechaCreacion;
        return $this;
    }

    /**
     * Verifica si la raza es de aptitud lechera
     */
    public function esLechera(): bool
    {
        return $this->aptitud === 'lechera' || $this->aptitud === 'doble_proposito';
    }

    /**
     * Verifica si la raza es de aptitud cárnica
     */
    public function esCarnica(): bool
    {
        return $this->aptitud === 'carnica' || $this->aptitud === 'doble_proposito';
    }
}
