<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use App\Repository\SaludRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Entidad Salud - Registro sanitario del animal
 * 
 * Controla todos los eventos de salud: vacunas, desparasitaciones,
 * tratamientos médicos y enfermedades.
 */
#[ORM\Entity(repositoryClass: SaludRepository::class)]
#[ORM\Table(name: 'SALUD')]
#[ApiResource(
    operations: [
        new GetCollection(),
        new Get(),
        new Post(security: "is_granted('ROLE_VETERINARIO') or is_granted('ROLE_ZOOTECNISTA')")
    ],
    normalizationContext: ['groups' => ['salud:read']],
    denormalizationContext: ['groups' => ['salud:write']],
    order: ['fechaEvento' => 'DESC']
)]
class Salud
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(name: 'id_salud', type: Types::INTEGER)]
    #[Groups(['salud:read'])]
    private ?int $id = null;

    /**
     * Animal al que pertenece el registro sanitario
     */
    #[ORM\ManyToOne(targetEntity: Animal::class)]
    #[ORM\JoinColumn(name: 'id_animal', referencedColumnName: 'id_animal', nullable: false)]
    #[Assert\NotNull(message: 'El animal es obligatorio')]
    #[Groups(['salud:read', 'salud:write'])]
    private ?Animal $animal = null;

    /**
     * Tipo de evento sanitario
     */
    #[ORM\Column(name: 'tipo_evento', type: Types::STRING, length: 30)]
    #[Assert\NotBlank(message: 'El tipo de evento es obligatorio')]
    #[Assert\Choice(
        choices: ['Vacunación', 'Desparasitación', 'Tratamiento', 'Enfermedad', 'Cirugía', 'Revisión'],
        message: 'Tipo de evento no válido'
    )]
    #[Groups(['salud:read', 'salud:write'])]
    private ?string $tipoEvento = null;

    /**
     * Fecha del evento sanitario
     */
    #[ORM\Column(name: 'fecha_evento', type: Types::DATE_MUTABLE)]
    #[Assert\NotBlank(message: 'La fecha del evento es obligatoria')]
    #[Assert\LessThanOrEqual('today', message: 'La fecha del evento no puede ser futura')]
    #[Groups(['salud:read', 'salud:write'])]
    private ?\DateTimeInterface $fechaEvento = null;

    /**
     * Descripción del evento (vacuna aplicada, enfermedad diagnosticada, etc.)
     */
    #[ORM\Column(type: Types::STRING, length: 200)]
    #[Assert\NotBlank(message: 'La descripción es obligatoria')]
    #[Assert\Length(max: 200)]
    #[Groups(['salud:read', 'salud:write'])]
    private ?string $descripcion = null;

    /**
     * Producto utilizado (nombre de vacuna, antiparasitario, medicamento)
     */
    #[ORM\Column(type: Types::STRING, length: 150, nullable: true)]
    #[Assert\Length(max: 150)]
    #[Groups(['salud:read', 'salud:write'])]
    private ?string $producto = null;

    /**
     * Dosis aplicada
     */
    #[ORM\Column(type: Types::STRING, length: 50, nullable: true)]
    #[Assert\Length(max: 50)]
    #[Groups(['salud:read', 'salud:write'])]
    private ?string $dosis = null;

    /**
     * Vía de administración
     */
    #[ORM\Column(name: 'via_administracion', type: Types::STRING, length: 50, nullable: true)]
    #[Assert\Choice(
        choices: ['Oral', 'Intramuscular', 'Subcutánea', 'Intravenosa', 'Tópica', 'Intranasal'],
        message: 'Vía de administración no válida'
    )]
    #[Groups(['salud:read', 'salud:write'])]
    private ?string $viaAdministracion = null;

    /**
     * Veterinario o técnico responsable
     */
    #[ORM\Column(type: Types::STRING, length: 100, nullable: true)]
    #[Assert\Length(max: 100)]
    #[Groups(['salud:read', 'salud:write'])]
    private ?string $responsable = null;

    /**
     * Fecha de próxima aplicación o revisión
     */
    #[ORM\Column(name: 'fecha_proxima', type: Types::DATE_MUTABLE, nullable: true)]
    #[Groups(['salud:read', 'salud:write'])]
    private ?\DateTimeInterface $fechaProxima = null;

    /**
     * Días de retiro (para carne o leche) después del tratamiento
     */
    #[ORM\Column(name: 'dias_retiro', type: Types::INTEGER, nullable: true)]
    #[Assert\Range(
        min: 0,
        max: 180,
        notInRangeMessage: 'Los días de retiro deben estar entre {{ min }} y {{ max }}'
    )]
    #[Groups(['salud:read', 'salud:write'])]
    private ?int $diasRetiro = null;

    /**
     * Costo del tratamiento o servicio veterinario
     */
    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    #[Assert\PositiveOrZero(message: 'El costo no puede ser negativo')]
    #[Groups(['salud:read', 'salud:write'])]
    private ?float $costo = null;

    /**
     * Diagnóstico clínico (para enfermedades)
     */
    #[ORM\Column(type: Types::STRING, length: 300, nullable: true)]
    #[Assert\Length(max: 300)]
    #[Groups(['salud:read', 'salud:write'])]
    private ?string $diagnostico = null;

    /**
     * Síntomas observados
     */
    #[ORM\Column(type: Types::STRING, length: 500, nullable: true)]
    #[Assert\Length(max: 500)]
    #[Groups(['salud:read', 'salud:write'])]
    private ?string $sintomas = null;

    /**
     * Temperatura corporal (°C)
     */
    #[ORM\Column(name: 'temperatura_corporal', type: Types::FLOAT, nullable: true)]
    #[Assert\Range(
        min: 35.0,
        max: 42.0,
        notInRangeMessage: 'La temperatura debe estar entre {{ min }}°C y {{ max }}°C'
    )]
    #[Groups(['salud:read', 'salud:write'])]
    private ?float $temperaturaCorporal = null;

    /**
     * Observaciones adicionales
     */
    #[ORM\Column(type: Types::STRING, length: 500, nullable: true)]
    #[Assert\Length(max: 500)]
    #[Groups(['salud:read', 'salud:write'])]
    private ?string $observaciones = null;

    /**
     * Estado del animal después del tratamiento
     */
    #[ORM\Column(name: 'estado_resultado', type: Types::STRING, length: 50, nullable: true)]
    #[Assert\Choice(
        choices: ['Recuperado', 'En tratamiento', 'Crónico', 'Fallecido', 'Descartado'],
        message: 'Estado no válido'
    )]
    #[Groups(['salud:read', 'salud:write'])]
    private ?string $estadoResultado = null;

    /**
     * ID del usuario que registró el evento
     */
    #[ORM\Column(name: 'usuario_registro', type: Types::INTEGER)]
    #[Groups(['salud:read'])]
    private ?int $usuarioRegistro = null;

    /**
     * Fecha de registro en el sistema
     */
    #[ORM\Column(name: 'fecha_registro', type: Types::DATETIME_MUTABLE)]
    #[Groups(['salud:read'])]
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

    public function getTipoEvento(): ?string
    {
        return $this->tipoEvento;
    }

    public function setTipoEvento(string $tipoEvento): self
    {
        $this->tipoEvento = $tipoEvento;
        return $this;
    }

    public function getFechaEvento(): ?\DateTimeInterface
    {
        return $this->fechaEvento;
    }

    public function setFechaEvento(\DateTimeInterface $fechaEvento): self
    {
        $this->fechaEvento = $fechaEvento;
        return $this;
    }

    public function getDescripcion(): ?string
    {
        return $this->descripcion;
    }

    public function setDescripcion(string $descripcion): self
    {
        $this->descripcion = $descripcion;
        return $this;
    }

    public function getProducto(): ?string
    {
        return $this->producto;
    }

    public function setProducto(?string $producto): self
    {
        $this->producto = $producto;
        return $this;
    }

    public function getDosis(): ?string
    {
        return $this->dosis;
    }

    public function setDosis(?string $dosis): self
    {
        $this->dosis = $dosis;
        return $this;
    }

    public function getViaAdministracion(): ?string
    {
        return $this->viaAdministracion;
    }

    public function setViaAdministracion(?string $viaAdministracion): self
    {
        $this->viaAdministracion = $viaAdministracion;
        return $this;
    }

    public function getResponsable(): ?string
    {
        return $this->responsable;
    }

    public function setResponsable(?string $responsable): self
    {
        $this->responsable = $responsable;
        return $this;
    }

    public function getFechaProxima(): ?\DateTimeInterface
    {
        return $this->fechaProxima;
    }

    public function setFechaProxima(?\DateTimeInterface $fechaProxima): self
    {
        $this->fechaProxima = $fechaProxima;
        return $this;
    }

    public function getDiasRetiro(): ?int
    {
        return $this->diasRetiro;
    }

    public function setDiasRetiro(?int $diasRetiro): self
    {
        $this->diasRetiro = $diasRetiro;
        return $this;
    }

    public function getCosto(): ?float
    {
        return $this->costo;
    }

    public function setCosto(?float $costo): self
    {
        $this->costo = $costo;
        return $this;
    }

    public function getDiagnostico(): ?string
    {
        return $this->diagnostico;
    }

    public function setDiagnostico(?string $diagnostico): self
    {
        $this->diagnostico = $diagnostico;
        return $this;
    }

    public function getSintomas(): ?string
    {
        return $this->sintomas;
    }

    public function setSintomas(?string $sintomas): self
    {
        $this->sintomas = $sintomas;
        return $this;
    }

    public function getTemperaturaCorporal(): ?float
    {
        return $this->temperaturaCorporal;
    }

    public function setTemperaturaCorporal(?float $temperaturaCorporal): self
    {
        $this->temperaturaCorporal = $temperaturaCorporal;
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

    public function getEstadoResultado(): ?string
    {
        return $this->estadoResultado;
    }

    public function setEstadoResultado(?string $estadoResultado): self
    {
        $this->estadoResultado = $estadoResultado;
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
     * Determina si la temperatura corporal está en rango normal
     * Normal: 38.5°C - 40.0°C para caprinos
     * 
     * @return bool true si está en rango normal
     */
    public function tieneTemperaturaNormal(): bool
    {
        if ($this->temperaturaCorporal === null) {
            return true; // No medida
        }

        return $this->temperaturaCorporal >= 38.5 && $this->temperaturaCorporal <= 40.0;
    }

    /**
     * Determina si el evento requiere seguimiento
     * 
     * @return bool true si tiene fecha próxima programada
     */
    public function requiereSeguimiento(): bool
    {
        return $this->fechaProxima !== null;
    }

    /**
     * Calcula los días restantes hasta el próximo evento
     * 
     * @return int|null Días hasta fecha_proxima, negativo si ya pasó
     */
    public function getDiasHastaProximoEvento(): ?int
    {
        if ($this->fechaProxima === null) {
            return null;
        }

        $hoy = new \DateTime();
        $intervalo = $hoy->diff($this->fechaProxima);
        
        return $intervalo->invert ? -$intervalo->days : $intervalo->days;
    }

    /**
     * Determina si el animal está en período de retiro
     * 
     * @return bool true si aún está en período de retiro
     */
    public function estaEnRetiro(): bool
    {
        if ($this->diasRetiro === null || $this->diasRetiro === 0) {
            return false;
        }

        $fechaFinRetiro = (clone $this->fechaEvento)->modify("+{$this->diasRetiro} days");
        $hoy = new \DateTime();
        
        return $hoy <= $fechaFinRetiro;
    }

    /**
     * Calcula los días restantes de retiro
     * 
     * @return int Días restantes, 0 si ya terminó el retiro
     */
    public function getDiasRetiroRestantes(): int
    {
        if (!$this->estaEnRetiro()) {
            return 0;
        }

        $fechaFinRetiro = (clone $this->fechaEvento)->modify("+{$this->diasRetiro} days");
        $hoy = new \DateTime();
        $intervalo = $hoy->diff($fechaFinRetiro);
        
        return $intervalo->days;
    }
}
