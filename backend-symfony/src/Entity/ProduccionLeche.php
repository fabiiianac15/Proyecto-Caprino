<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use App\Repository\ProduccionLecheRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Entidad ProduccionLeche - Registro diario de producción láctea
 * 
 * Controla la producción de leche de cada animal durante la lactancia,
 * permitiendo evaluar productividad y calidad.
 */
#[ORM\Entity(repositoryClass: ProduccionLecheRepository::class)]
#[ORM\Table(name: 'PRODUCCION_LECHE')]
#[ApiResource(
    operations: [
        new GetCollection(),
        new Get(),
        new Post(security: "is_granted('ROLE_TECNICO')")
    ],
    normalizationContext: ['groups' => ['produccion:read']],
    denormalizationContext: ['groups' => ['produccion:write']],
    order: ['fechaOrdeño' => 'DESC']
)]
class ProduccionLeche
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(name: 'id_produccion', type: Types::INTEGER)]
    #[Groups(['produccion:read'])]
    private ?int $id = null;

    /**
     * Animal que produjo la leche
     */
    #[ORM\ManyToOne(targetEntity: Animal::class)]
    #[ORM\JoinColumn(name: 'id_animal', referencedColumnName: 'id_animal', nullable: false)]
    #[Assert\NotNull(message: 'El animal es obligatorio')]
    #[Groups(['produccion:read', 'produccion:write'])]
    private ?Animal $animal = null;

    /**
     * Fecha del ordeño
     */
    #[ORM\Column(name: 'fecha_ordeño', type: Types::DATE_MUTABLE)]
    #[Assert\NotBlank(message: 'La fecha de ordeño es obligatoria')]
    #[Assert\LessThanOrEqual('today', message: 'La fecha de ordeño no puede ser futura')]
    #[Groups(['produccion:read', 'produccion:write'])]
    private ?\DateTimeInterface $fechaOrdeño = null;

    /**
     * Turno del ordeño (Mañana o Tarde)
     */
    #[ORM\Column(name: 'turno_ordeño', type: Types::STRING, length: 20)]
    #[Assert\NotBlank(message: 'El turno de ordeño es obligatorio')]
    #[Assert\Choice(
        choices: ['Mañana', 'Tarde'],
        message: 'El turno debe ser Mañana o Tarde'
    )]
    #[Groups(['produccion:read', 'produccion:write'])]
    private ?string $turnoOrdeño = null;

    /**
     * Litros de leche producidos
     */
    #[ORM\Column(name: 'litros_producidos', type: Types::FLOAT)]
    #[Assert\NotBlank(message: 'Los litros producidos son obligatorios')]
    #[Assert\Positive(message: 'La producción debe ser positiva')]
    #[Assert\Range(
        min: 0.1,
        max: 15,
        notInRangeMessage: 'La producción debe estar entre {{ min }} y {{ max }} litros'
    )]
    #[Groups(['produccion:read', 'produccion:write'])]
    private ?float $litrosProducidos = null;

    /**
     * Días en lactancia al momento del ordeño
     * Se calcula automáticamente mediante trigger
     */
    #[ORM\Column(name: 'dias_lactancia', type: Types::INTEGER, nullable: true)]
    #[Groups(['produccion:read'])]
    private ?int $diasLactancia = null;

    /**
     * Número de lactancia (1ra, 2da, 3ra, etc.)
     * Se obtiene automáticamente del registro de reproducción
     */
    #[ORM\Column(name: 'numero_lactancia', type: Types::INTEGER, nullable: true)]
    #[Groups(['produccion:read'])]
    private ?int $numeroLactancia = null;

    /**
     * Porcentaje de grasa en la leche
     */
    #[ORM\Column(name: 'porcentaje_grasa', type: Types::FLOAT, nullable: true)]
    #[Assert\Range(
        min: 2.0,
        max: 8.0,
        notInRangeMessage: 'El porcentaje de grasa debe estar entre {{ min }}% y {{ max }}%'
    )]
    #[Groups(['produccion:read', 'produccion:write'])]
    private ?float $porcentajeGrasa = null;

    /**
     * Porcentaje de proteína en la leche
     */
    #[ORM\Column(name: 'porcentaje_proteina', type: Types::FLOAT, nullable: true)]
    #[Assert\Range(
        min: 2.0,
        max: 5.0,
        notInRangeMessage: 'El porcentaje de proteína debe estar entre {{ min }}% y {{ max }}%'
    )]
    #[Groups(['produccion:read', 'produccion:write'])]
    private ?float $porcentajeProteina = null;

    /**
     * Conteo de células somáticas (CCS) - indicador de mastitis
     * Valores normales: < 500,000 células/ml
     */
    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    #[Assert\Range(
        min: 0,
        max: 10000000,
        notInRangeMessage: 'El CCS debe estar entre {{ min }} y {{ max }} células/ml'
    )]
    #[Groups(['produccion:read', 'produccion:write'])]
    private ?int $ccs = null;

    /**
     * Método de ordeño utilizado
     */
    #[ORM\Column(name: 'metodo_ordeño', type: Types::STRING, length: 50, nullable: true)]
    #[Assert\Length(max: 50)]
    #[Groups(['produccion:read', 'produccion:write'])]
    private ?string $metodoOrdeño = null;

    /**
     * Observaciones sobre el ordeño o calidad de la leche
     */
    #[ORM\Column(type: Types::STRING, length: 500, nullable: true)]
    #[Assert\Length(max: 500)]
    #[Groups(['produccion:read', 'produccion:write'])]
    private ?string $observaciones = null;

    /**
     * ID del usuario que registró la producción
     */
    #[ORM\Column(name: 'usuario_registro', type: Types::INTEGER)]
    #[Groups(['produccion:read'])]
    private ?int $usuarioRegistro = null;

    /**
     * Fecha de registro en el sistema
     */
    #[ORM\Column(name: 'fecha_registro', type: Types::DATETIME_MUTABLE)]
    #[Groups(['produccion:read'])]
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

    public function getFechaOrdeño(): ?\DateTimeInterface
    {
        return $this->fechaOrdeño;
    }

    public function setFechaOrdeño(\DateTimeInterface $fechaOrdeño): self
    {
        $this->fechaOrdeño = $fechaOrdeño;
        return $this;
    }

    public function getTurnoOrdeño(): ?string
    {
        return $this->turnoOrdeño;
    }

    public function setTurnoOrdeño(string $turnoOrdeño): self
    {
        $this->turnoOrdeño = $turnoOrdeño;
        return $this;
    }

    public function getLitrosProducidos(): ?float
    {
        return $this->litrosProducidos;
    }

    public function setLitrosProducidos(float $litrosProducidos): self
    {
        $this->litrosProducidos = $litrosProducidos;
        return $this;
    }

    public function getDiasLactancia(): ?int
    {
        return $this->diasLactancia;
    }

    public function setDiasLactancia(?int $diasLactancia): self
    {
        $this->diasLactancia = $diasLactancia;
        return $this;
    }

    public function getNumeroLactancia(): ?int
    {
        return $this->numeroLactancia;
    }

    public function setNumeroLactancia(?int $numeroLactancia): self
    {
        $this->numeroLactancia = $numeroLactancia;
        return $this;
    }

    public function getPorcentajeGrasa(): ?float
    {
        return $this->porcentajeGrasa;
    }

    public function setPorcentajeGrasa(?float $porcentajeGrasa): self
    {
        $this->porcentajeGrasa = $porcentajeGrasa;
        return $this;
    }

    public function getPorcentajeProteina(): ?float
    {
        return $this->porcentajeProteina;
    }

    public function setPorcentajeProteina(?float $porcentajeProteina): self
    {
        $this->porcentajeProteina = $porcentajeProteina;
        return $this;
    }

    public function getCcs(): ?int
    {
        return $this->ccs;
    }

    public function setCcs(?int $ccs): self
    {
        $this->ccs = $ccs;
        return $this;
    }

    public function getMetodoOrdeño(): ?string
    {
        return $this->metodoOrdeño;
    }

    public function setMetodoOrdeño(?string $metodoOrdeño): self
    {
        $this->metodoOrdeño = $metodoOrdeño;
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
     * Determina si la producción es normal según la etapa de lactancia
     * 
     * @return bool true si la producción está en rango esperado
     */
    public function tieneProduccionNormal(): bool
    {
        if ($this->diasLactancia === null || $this->litrosProducidos === null) {
            return true; // No podemos evaluar
        }

        // Pico de lactancia (30-90 días): producción alta esperada
        if ($this->diasLactancia >= 30 && $this->diasLactancia <= 90) {
            return $this->litrosProducidos >= 2.0;
        }

        // Lactancia media (90-180 días): producción moderada
        if ($this->diasLactancia > 90 && $this->diasLactancia <= 180) {
            return $this->litrosProducidos >= 1.5;
        }

        // Lactancia tardía (>180 días): producción en descenso
        if ($this->diasLactancia > 180) {
            return $this->litrosProducidos >= 0.8;
        }

        // Inicio de lactancia (<30 días)
        return $this->litrosProducidos >= 1.0;
    }

    /**
     * Evalúa si el CCS indica posible mastitis
     * 
     * @return bool true si el CCS es normal (<500,000)
     */
    public function tieneCcsNormal(): bool
    {
        if ($this->ccs === null) {
            return true; // No evaluado
        }

        return $this->ccs < 500000;
    }

    /**
     * Calcula la calidad composicional de la leche
     * 
     * @return string 'Excelente', 'Buena', 'Regular' o 'Baja'
     */
    public function getCalidadComposicional(): string
    {
        if ($this->porcentajeGrasa === null || $this->porcentajeProteina === null) {
            return 'No evaluada';
        }

        $puntaje = 0;

        // Evaluar grasa (óptimo 3.5-4.5%)
        if ($this->porcentajeGrasa >= 3.5 && $this->porcentajeGrasa <= 4.5) {
            $puntaje += 2;
        } elseif ($this->porcentajeGrasa >= 3.0 && $this->porcentajeGrasa < 5.0) {
            $puntaje += 1;
        }

        // Evaluar proteína (óptimo 3.0-3.5%)
        if ($this->porcentajeProteina >= 3.0 && $this->porcentajeProteina <= 3.5) {
            $puntaje += 2;
        } elseif ($this->porcentajeProteina >= 2.5 && $this->porcentajeProteina < 4.0) {
            $puntaje += 1;
        }

        return match(true) {
            $puntaje >= 4 => 'Excelente',
            $puntaje >= 3 => 'Buena',
            $puntaje >= 2 => 'Regular',
            default => 'Baja'
        };
    }
}
