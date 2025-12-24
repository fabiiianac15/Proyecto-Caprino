<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use App\Repository\PesajeRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Entidad Pesaje - Control de crecimiento del animal
 * 
 * Registra los pesajes periódicos para seguimiento del desarrollo
 * y evaluación del estado nutricional del animal.
 */
#[ORM\Entity(repositoryClass: PesajeRepository::class)]
#[ORM\Table(name: 'PESAJE')]
#[ApiResource(
    operations: [
        new GetCollection(),
        new Get(),
        new Post(security: "is_granted('ROLE_ZOOTECNISTA')")
    ],
    normalizationContext: ['groups' => ['pesaje:read']],
    denormalizationContext: ['groups' => ['pesaje:write']],
    order: ['fechaPesaje' => 'DESC']
)]
class Pesaje
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(name: 'id_pesaje', type: Types::INTEGER)]
    #[Groups(['pesaje:read'])]
    private ?int $id = null;

    /**
     * Animal al que pertenece el pesaje
     */
    #[ORM\ManyToOne(targetEntity: Animal::class)]
    #[ORM\JoinColumn(name: 'id_animal', referencedColumnName: 'id_animal', nullable: false)]
    #[Assert\NotNull(message: 'El animal es obligatorio')]
    #[Groups(['pesaje:read', 'pesaje:write'])]
    private ?Animal $animal = null;

    /**
     * Fecha del pesaje
     */
    #[ORM\Column(name: 'fecha_pesaje', type: Types::DATE_MUTABLE)]
    #[Assert\NotBlank(message: 'La fecha de pesaje es obligatoria')]
    #[Assert\LessThanOrEqual('today', message: 'La fecha de pesaje no puede ser futura')]
    #[Groups(['pesaje:read', 'pesaje:write'])]
    private ?\DateTimeInterface $fechaPesaje = null;

    /**
     * Peso en kilogramos
     */
    #[ORM\Column(name: 'peso_kg', type: Types::DECIMAL, precision: 6, scale: 2)]
    #[Assert\NotBlank(message: 'El peso es obligatorio')]
    #[Assert\Positive(message: 'El peso debe ser positivo')]
    #[Assert\Range(
        min: 0.5,
        max: 200,
        notInRangeMessage: 'El peso debe estar entre {{ min }} y {{ max }} kg'
    )]
    #[Groups(['pesaje:read', 'pesaje:write'])]
    private ?float $pesoKg = null;

    /**
     * Edad del animal en días al momento del pesaje
     * Se calcula automáticamente mediante trigger en base de datos
     */
    #[ORM\Column(name: 'edad_dias', type: Types::INTEGER, nullable: true)]
    #[Groups(['pesaje:read'])]
    private ?int $edadDias = null;

    /**
     * Ganancia diaria promedio desde el último pesaje (kg/día)
     * Se calcula automáticamente mediante trigger en base de datos
     */
    #[ORM\Column(name: 'ganancia_diaria_kg', type: Types::DECIMAL, precision: 5, scale: 3, nullable: true)]
    #[Groups(['pesaje:read'])]
    private ?float $gananciaDiariaKg = null;

    /**
     * Condición corporal (escala 1-5)
     * 1: Muy delgado
     * 2: Delgado
     * 3: Ideal
     * 4: Sobrepeso
     * 5: Obeso
     */
    #[ORM\Column(name: 'condicion_corporal', type: Types::INTEGER, nullable: true)]
    #[Assert\Range(
        min: 1,
        max: 5,
        notInRangeMessage: 'La condición corporal debe estar entre {{ min }} y {{ max }}'
    )]
    #[Groups(['pesaje:read', 'pesaje:write'])]
    private ?int $condicionCorporal = null;

    /**
     * Observaciones del pesaje
     */
    #[ORM\Column(type: Types::STRING, length: 500, nullable: true)]
    #[Assert\Length(max: 500)]
    #[Groups(['pesaje:read', 'pesaje:write'])]
    private ?string $observaciones = null;

    /**
     * Método utilizado para el pesaje
     */
    #[ORM\Column(name: 'metodo_pesaje', type: Types::STRING, length: 50, nullable: true)]
    #[Assert\Length(max: 50)]
    #[Groups(['pesaje:read', 'pesaje:write'])]
    private ?string $metodoPesaje = null;

    /**
     * ID del usuario que registró el pesaje
     */
    #[ORM\Column(name: 'usuario_registro', type: Types::INTEGER)]
    #[Groups(['pesaje:read'])]
    private ?int $usuarioRegistro = null;

    /**
     * Fecha de registro en el sistema
     */
    #[ORM\Column(name: 'fecha_registro', type: Types::DATETIME_MUTABLE)]
    #[Groups(['pesaje:read'])]
    private ?\DateTimeInterface $fechaRegistro = null;

    public function __construct()
    {
        $this->fechaRegistro = new \DateTime();
    }

    // Getters y Setters

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getAnimal(): ?Animal
    {
        return $this->animal;
    }

    public function setAnimal(?Animal $animal): self
    {
        $this->animal = $animal;
        return $this;
    }

    public function getFechaPesaje(): ?\DateTimeInterface
    {
        return $this->fechaPesaje;
    }

    public function setFechaPesaje(\DateTimeInterface $fechaPesaje): self
    {
        $this->fechaPesaje = $fechaPesaje;
        return $this;
    }

    public function getPesoKg(): ?float
    {
        return $this->pesoKg;
    }

    public function setPesoKg(float $pesoKg): self
    {
        $this->pesoKg = $pesoKg;
        return $this;
    }

    public function getEdadDias(): ?int
    {
        return $this->edadDias;
    }

    public function setEdadDias(?int $edadDias): self
    {
        $this->edadDias = $edadDias;
        return $this;
    }

    public function getGananciaDiariaKg(): ?float
    {
        return $this->gananciaDiariaKg;
    }

    public function setGananciaDiariaKg(?float $gananciaDiariaKg): self
    {
        $this->gananciaDiariaKg = $gananciaDiariaKg;
        return $this;
    }

    public function getCondicionCorporal(): ?int
    {
        return $this->condicionCorporal;
    }

    public function setCondicionCorporal(?int $condicionCorporal): self
    {
        $this->condicionCorporal = $condicionCorporal;
        return $this;
    }

    public function getObservaciones(): ?string
    {
        return $this->observaciones;
    }

    public function setObservaciones(?string $observaciones): self
    {
        $this->observaciones = $observaciones;
        return $this;
    }

    public function getMetodoPesaje(): ?string
    {
        return $this->metodoPesaje;
    }

    public function setMetodoPesaje(?string $metodoPesaje): self
    {
        $this->metodoPesaje = $metodoPesaje;
        return $this;
    }

    public function getUsuarioRegistro(): ?int
    {
        return $this->usuarioRegistro;
    }

    public function setUsuarioRegistro(int $usuarioRegistro): self
    {
        $this->usuarioRegistro = $usuarioRegistro;
        return $this;
    }

    public function getFechaRegistro(): ?\DateTimeInterface
    {
        return $this->fechaRegistro;
    }

    public function setFechaRegistro(\DateTimeInterface $fechaRegistro): self
    {
        $this->fechaRegistro = $fechaRegistro;
        return $this;
    }

    /**
     * Determina si la ganancia de peso es adecuada según la edad
     * 
     * @return bool true si la ganancia es adecuada
     */
    public function tieneGananciaAdecuada(): bool
    {
        if ($this->gananciaDiariaKg === null || $this->edadDias === null) {
            return true; // No podemos evaluar
        }

        // Cabritos lactantes (0-90 días): mínimo 150g/día
        if ($this->edadDias <= 90) {
            return $this->gananciaDiariaKg >= 0.150;
        }

        // Jóvenes en crecimiento (90-365 días): mínimo 80g/día
        if ($this->edadDias <= 365) {
            return $this->gananciaDiariaKg >= 0.080;
        }

        // Adultos: cualquier ganancia positiva es aceptable
        return $this->gananciaDiariaKg >= 0;
    }

    /**
     * Evalúa si la condición corporal está en rango óptimo
     * 
     * @return bool true si está en rango óptimo (2.5-3.5)
     */
    public function tieneCondicionOptima(): bool
    {
        if ($this->condicionCorporal === null) {
            return true; // No evaluado
        }

        return $this->condicionCorporal >= 2.5 && $this->condicionCorporal <= 3.5;
    }
}
