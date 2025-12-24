<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use App\Repository\ReproduccionRepository;
use App\Validator\ConsanguinidadPermitida;
use App\Validator\EdadReproductiva;
use App\Validator\IntervaloReproductivo;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Entidad Reproduccion - Gestión del ciclo reproductivo
 * 
 * Controla todo el proceso reproductivo desde el servicio/monta
 * hasta el parto, incluyendo diagnósticos de gestación.
 */
#[ORM\Entity(repositoryClass: ReproduccionRepository::class)]
#[ORM\Table(name: 'REPRODUCCION')]
#[ConsanguinidadPermitida]
#[IntervaloReproductivo]
#[ApiResource(
    operations: [
        new GetCollection(),
        new Get(),
        new Post(security: "is_granted('ROLE_ZOOTECNISTA')"),
        new Put(security: "is_granted('ROLE_ZOOTECNISTA')")
    ],
    normalizationContext: ['groups' => ['reproduccion:read']],
    denormalizationContext: ['groups' => ['reproduccion:write']],
    order: ['fechaServicio' => 'DESC']
)]
class Reproduccion
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(name: 'id_reproduccion', type: Types::INTEGER)]
    #[Groups(['reproduccion:read'])]
    /**
     * Hembra que recibe el servicio
     */
    #[ORM\ManyToOne(targetEntity: Animal::class)]
    #[ORM\JoinColumn(name: 'id_hembra', referencedColumnName: 'id_animal', nullable: false)]
    #[Assert\NotNull(message: 'La hembra es obligatoria')]
    #[EdadReproductiva]
    #[Groups(['reproduccion:read', 'reproduccion:write'])]
    private ?Animal $hembra = null;embra es obligatoria')]
    /**
     * Macho que realiza el servicio (puede ser null si es inseminación)
     */
    #[ORM\ManyToOne(targetEntity: Animal::class)]
    #[ORM\JoinColumn(name: 'id_macho', referencedColumnName: 'id_animal', nullable: true)]
    #[EdadReproductiva]
    #[Groups(['reproduccion:read', 'reproduccion:write'])]
    private ?Animal $macho = null;Animal::class)]
    #[ORM\JoinColumn(name: 'id_macho', referencedColumnName: 'id_animal', nullable: true)]
    #[Groups(['reproduccion:read', 'reproduccion:write'])]
    private ?Animal $macho = null;

    /**
     * Tipo de servicio reproductivo
     */
    #[ORM\Column(name: 'tipo_servicio', type: Types::STRING, length: 30)]
    #[Assert\NotBlank(message: 'El tipo de servicio es obligatorio')]
    #[Assert\Choice(
        choices: ['Monta Natural', 'Inseminación Artificial'],
        message: 'El tipo debe ser Monta Natural o Inseminación Artificial'
    )]
    #[Groups(['reproduccion:read', 'reproduccion:write'])]
    private ?string $tipoServicio = null;

    /**
     * Fecha del servicio/monta
     */
    #[ORM\Column(name: 'fecha_servicio', type: Types::DATE_MUTABLE)]
    #[Assert\NotBlank(message: 'La fecha de servicio es obligatoria')]
    #[Assert\LessThanOrEqual('today', message: 'La fecha de servicio no puede ser futura')]
    #[Groups(['reproduccion:read', 'reproduccion:write'])]
    private ?\DateTimeInterface $fechaServicio = null;

    /**
     * Número de servicio (1ro, 2do, 3ro en caso de repetición)
     */
    #[ORM\Column(name: 'numero_servicio', type: Types::INTEGER, options: ['default' => 1])]
    #[Assert\Positive(message: 'El número de servicio debe ser positivo')]
    #[Assert\Range(
        min: 1,
        max: 10,
        notInRangeMessage: 'El número de servicio debe estar entre {{ min }} y {{ max }}'
    )]
    #[Groups(['reproduccion:read', 'reproduccion:write'])]
    private int $numeroServicio = 1;

    /**
     * Fecha de diagnóstico de gestación
     */
    #[ORM\Column(name: 'fecha_diagnostico', type: Types::DATE_MUTABLE, nullable: true)]
    #[Groups(['reproduccion:read', 'reproduccion:write'])]
    private ?\DateTimeInterface $fechaDiagnostico = null;

    /**
     * Resultado del diagnóstico
     */
    #[ORM\Column(name: 'resultado_diagnostico', type: Types::STRING, length: 20, nullable: true)]
    #[Assert\Choice(
        choices: ['Positivo', 'Negativo', 'Pendiente'],
        message: 'El resultado debe ser Positivo, Negativo o Pendiente'
    )]
    #[Groups(['reproduccion:read', 'reproduccion:write'])]
    private ?string $resultadoDiagnostico = 'Pendiente';

    /**
     * Método usado para el diagnóstico
     */
    #[ORM\Column(name: 'metodo_diagnostico', type: Types::STRING, length: 50, nullable: true)]
    #[Assert\Length(max: 50)]
    #[Groups(['reproduccion:read', 'reproduccion:write'])]
    private ?string $metodoDiagnostico = null;

    /**
     * Fecha estimada de parto
     * Se calcula automáticamente: fecha_servicio + 150 días
     */
    #[ORM\Column(name: 'fecha_parto_estimada', type: Types::DATE_MUTABLE, nullable: true)]
    #[Groups(['reproduccion:read'])]
    private ?\DateTimeInterface $fechaPartoEstimada = null;

    /**
     * Fecha real del parto
     */
    #[ORM\Column(name: 'fecha_parto_real', type: Types::DATE_MUTABLE, nullable: true)]
    #[Groups(['reproduccion:read', 'reproduccion:write'])]
    private ?\DateTimeInterface $fechaPartoReal = null;

    /**
     * Tipo de parto
     */
    #[ORM\Column(name: 'tipo_parto', type: Types::STRING, length: 20, nullable: true)]
    #[Assert\Choice(
        choices: ['Simple', 'Gemelar', 'Triple', 'Múltiple'],
        message: 'El tipo debe ser Simple, Gemelar, Triple o Múltiple'
    )]
    #[Groups(['reproduccion:read', 'reproduccion:write'])]
    private ?string $tipoParto = null;

    /**
     * Número de crías nacidas
     */
    #[ORM\Column(name: 'numero_crias', type: Types::INTEGER, nullable: true)]
    #[Assert\Range(
        min: 0,
        max: 6,
        notInRangeMessage: 'El número de crías debe estar entre {{ min }} y {{ max }}'
    )]
    #[Groups(['reproduccion:read', 'reproduccion:write'])]
    private ?int $numeroCrias = null;

    /**
     * Número de crías vivas al nacer
     */
    #[ORM\Column(name: 'crias_vivas', type: Types::INTEGER, nullable: true)]
    #[Assert\Range(
        min: 0,
        max: 6,
        notInRangeMessage: 'Las crías vivas deben estar entre {{ min }} y {{ max }}'
    )]
    #[Groups(['reproduccion:read', 'reproduccion:write'])]
    private ?int $criasVivas = null;

    /**
     * Dificultad del parto
     */
    #[ORM\Column(name: 'dificultad_parto', type: Types::STRING, length: 20, nullable: true)]
    #[Assert\Choice(
        choices: ['Normal', 'Asistido', 'Distócico', 'Cesárea'],
        message: 'La dificultad debe ser Normal, Asistido, Distócico o Cesárea'
    )]
    #[Groups(['reproduccion:read', 'reproduccion:write'])]
    private ?string $dificultadParto = null;

    /**
     * Condición de la madre después del parto
     */
    #[ORM\Column(name: 'condicion_madre', type: Types::STRING, length: 200, nullable: true)]
    #[Assert\Length(max: 200)]
    #[Groups(['reproduccion:read', 'reproduccion:write'])]
    private ?string $condicionMadre = null;

    /**
     * Intervalo entre partos en días
     * Se calcula automáticamente mediante trigger
     */
    #[ORM\Column(name: 'intervalo_partos_dias', type: Types::INTEGER, nullable: true)]
    #[Groups(['reproduccion:read'])]
    private ?int $intervaloPartosDias = null;

    /**
     * Observaciones del evento reproductivo
     */
    #[ORM\Column(type: Types::STRING, length: 500, nullable: true)]
    #[Assert\Length(max: 500)]
    #[Groups(['reproduccion:read', 'reproduccion:write'])]
    private ?string $observaciones = null;

    /**
     * ID del usuario que registró el evento
     */
    #[ORM\Column(name: 'usuario_registro', type: Types::INTEGER)]
    #[Groups(['reproduccion:read'])]
    private ?int $usuarioRegistro = null;

    /**
     * Fecha de registro en el sistema
     */
    #[ORM\Column(name: 'fecha_registro', type: Types::DATETIME_MUTABLE)]
    #[Groups(['reproduccion:read'])]
    private ?\DateTimeInterface $fechaRegistro = null;

    public function __construct()
    {
        $this->fechaRegistro = new \DateTime();
        $this->resultadoDiagnostico = 'Pendiente';
        $this->numeroServicio = 1;
    }

    // Getters y Setters

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getHembra(): ?Animal
    {
        return $this->hembra;
    }

    public function setHembra(?Animal $hembra): self
    {
        $this->hembra = $hembra;
        return $this;
    }

    public function getMacho(): ?Animal
    {
        return $this->macho;
    }

    public function setMacho(?Animal $macho): self
    {
        $this->macho = $macho;
        return $this;
    }

    public function getTipoServicio(): ?string
    {
        return $this->tipoServicio;
    }

    public function setTipoServicio(string $tipoServicio): self
    {
        $this->tipoServicio = $tipoServicio;
        return $this;
    }

    public function getFechaServicio(): ?\DateTimeInterface
    {
        return $this->fechaServicio;
    }

    public function setFechaServicio(\DateTimeInterface $fechaServicio): self
    {
        $this->fechaServicio = $fechaServicio;
        return $this;
    }

    public function getNumeroServicio(): int
    {
        return $this->numeroServicio;
    }

    public function setNumeroServicio(int $numeroServicio): self
    {
        $this->numeroServicio = $numeroServicio;
        return $this;
    }

    public function getFechaDiagnostico(): ?\DateTimeInterface
    {
        return $this->fechaDiagnostico;
    }

    public function setFechaDiagnostico(?\DateTimeInterface $fechaDiagnostico): self
    {
        $this->fechaDiagnostico = $fechaDiagnostico;
        return $this;
    }

    public function getResultadoDiagnostico(): ?string
    {
        return $this->resultadoDiagnostico;
    }

    public function setResultadoDiagnostico(?string $resultadoDiagnostico): self
    {
        $this->resultadoDiagnostico = $resultadoDiagnostico;
        return $this;
    }

    public function getMetodoDiagnostico(): ?string
    {
        return $this->metodoDiagnostico;
    }

    public function setMetodoDiagnostico(?string $metodoDiagnostico): self
    {
        $this->metodoDiagnostico = $metodoDiagnostico;
        return $this;
    }

    public function getFechaPartoEstimada(): ?\DateTimeInterface
    {
        return $this->fechaPartoEstimada;
    }

    public function setFechaPartoEstimada(?\DateTimeInterface $fechaPartoEstimada): self
    {
        $this->fechaPartoEstimada = $fechaPartoEstimada;
        return $this;
    }

    public function getFechaPartoReal(): ?\DateTimeInterface
    {
        return $this->fechaPartoReal;
    }

    public function setFechaPartoReal(?\DateTimeInterface $fechaPartoReal): self
    {
        $this->fechaPartoReal = $fechaPartoReal;
        return $this;
    }

    public function getTipoParto(): ?string
    {
        return $this->tipoParto;
    }

    public function setTipoParto(?string $tipoParto): self
    {
        $this->tipoParto = $tipoParto;
        return $this;
    }

    public function getNumeroCrias(): ?int
    {
        return $this->numeroCrias;
    }

    public function setNumeroCrias(?int $numeroCrias): self
    {
        $this->numeroCrias = $numeroCrias;
        return $this;
    }

    public function getCriasVivas(): ?int
    {
        return $this->criasVivas;
    }

    public function setCriasVivas(?int $criasVivas): self
    {
        $this->criasVivas = $criasVivas;
        return $this;
    }

    public function getDificultadParto(): ?string
    {
        return $this->dificultadParto;
    }

    public function setDificultadParto(?string $dificultadParto): self
    {
        $this->dificultadParto = $dificultadParto;
        return $this;
    }

    public function getCondicionMadre(): ?string
    {
        return $this->condicionMadre;
    }

    public function setCondicionMadre(?string $condicionMadre): self
    {
        $this->condicionMadre = $condicionMadre;
        return $this;
    }

    public function getIntervaloPartosDias(): ?int
    {
        return $this->intervaloPartosDias;
    }

    public function setIntervaloPartosDias(?int $intervaloPartosDias): self
    {
        $this->intervaloPartosDias = $intervaloPartosDias;
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
     * Determina si la gestación está confirmada
     * 
     * @return bool true si el diagnóstico fue positivo
     */
    public function estaGestante(): bool
    {
        return $this->resultadoDiagnostico === 'Positivo';
    }

    /**
     * Calcula los días de gestación actuales
     * 
     * @return int|null Días desde el servicio hasta hoy o hasta el parto
     */
    public function getDiasGestacion(): ?int
    {
        if (!$this->fechaServicio) {
            return null;
        }

        $fechaFinal = $this->fechaPartoReal ?? new \DateTime();
        $intervalo = $this->fechaServicio->diff($fechaFinal);
        
        return $intervalo->days;
    }

    /**
     * Evalúa si el parto fue exitoso
     * 
     * @return bool true si hubo crías vivas
     */
    public function fuePartoExitoso(): bool
    {
        return $this->criasVivas !== null && $this->criasVivas > 0;
    }

    /**
     * Calcula la tasa de sobrevivencia de las crías
     * 
     * @return float|null Porcentaje de crías vivas (0-100)
     */
    public function getTasaSobrevivencia(): ?float
    {
        if ($this->numeroCrias === null || $this->numeroCrias === 0) {
            return null;
        }

        return round(($this->criasVivas / $this->numeroCrias) * 100, 1);
    }

    /**
     * Determina si el intervalo entre partos es adecuado
     * Óptimo: 8-12 meses (240-365 días)
     * 
     * @return bool true si está en rango óptimo
     */
    public function tieneIntervaloAdecuado(): bool
    {
        if ($this->intervaloPartosDias === null) {
            return true; // Primer parto, no aplica
        }

        return $this->intervaloPartosDias >= 240 && $this->intervaloPartosDias <= 365;
    }
}
