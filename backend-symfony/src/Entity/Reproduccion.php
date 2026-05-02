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
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Animal::class)]
    #[ORM\JoinColumn(name: 'id_hembra', referencedColumnName: 'id_animal', nullable: false)]
    #[Assert\NotNull(message: 'La hembra es obligatoria')]
    #[EdadReproductiva]
    #[Groups(['reproduccion:read', 'reproduccion:write'])]
    private ?Animal $hembra = null;

    #[ORM\ManyToOne(targetEntity: Animal::class)]
    #[ORM\JoinColumn(name: 'id_macho', referencedColumnName: 'id_animal', nullable: true)]
    #[EdadReproductiva]
    #[Groups(['reproduccion:read', 'reproduccion:write'])]
    private ?Animal $macho = null;

    #[ORM\Column(name: 'tipo_servicio', type: Types::STRING, length: 30, nullable: true)]
    #[Assert\Choice(
        choices: ['monta_natural', 'inseminacion_artificial', 'transferencia_embrion'],
        message: 'Valores válidos: monta_natural, inseminacion_artificial, transferencia_embrion'
    )]
    #[Groups(['reproduccion:read', 'reproduccion:write'])]
    private ?string $tipoServicio = null;

    #[ORM\Column(name: 'fecha_servicio', type: Types::DATE_MUTABLE)]
    #[Assert\NotBlank(message: 'La fecha de servicio es obligatoria')]
    #[Assert\LessThanOrEqual('today', message: 'La fecha de servicio no puede ser futura')]
    #[Groups(['reproduccion:read', 'reproduccion:write'])]
    private ?\DateTimeInterface $fechaServicio = null;

    #[ORM\Column(name: 'fecha_parto_estimada', type: Types::DATE_MUTABLE, nullable: true)]
    #[Groups(['reproduccion:read'])]
    private ?\DateTimeInterface $fechaPartoEstimada = null;

    #[ORM\Column(name: 'fecha_parto_real', type: Types::DATE_MUTABLE, nullable: true)]
    #[Groups(['reproduccion:read', 'reproduccion:write'])]
    private ?\DateTimeInterface $fechaPartoReal = null;

    #[ORM\Column(name: 'tipo_parto', type: Types::STRING, length: 30, nullable: true)]
    #[Assert\Choice(
        choices: ['simple', 'doble', 'triple', 'multiple'],
        message: 'Valores válidos: simple, doble, triple, multiple'
    )]
    #[Groups(['reproduccion:read', 'reproduccion:write'])]
    private ?string $tipoParto = null;

    #[ORM\Column(name: 'numero_crias', type: Types::INTEGER, nullable: true)]
    #[Assert\Range(min: 1, max: 5)]
    #[Groups(['reproduccion:read', 'reproduccion:write'])]
    private ?int $numeroCrias = null;

    #[ORM\Column(name: 'resultado', type: Types::STRING, length: 30, nullable: true)]
    #[Assert\Choice(
        choices: ['exitoso', 'aborto', 'mortinato', 'pendiente'],
        message: 'Valores válidos: exitoso, aborto, mortinato, pendiente'
    )]
    #[Groups(['reproduccion:read', 'reproduccion:write'])]
    private ?string $resultado = 'pendiente';

    #[ORM\Column(name: 'dificultad_parto', type: Types::STRING, length: 30, nullable: true)]
    #[Assert\Choice(
        choices: ['normal', 'asistido', 'distocico', 'cesarea'],
        message: 'Valores válidos: normal, asistido, distocico, cesarea'
    )]
    #[Groups(['reproduccion:read', 'reproduccion:write'])]
    private ?string $dificultadParto = null;

    #[ORM\Column(name: 'observaciones', type: Types::TEXT, nullable: true)]
    #[Groups(['reproduccion:read', 'reproduccion:write'])]
    private ?string $observaciones = null;

    #[ORM\Column(name: 'usuario_registro', type: Types::INTEGER)]
    #[Groups(['reproduccion:read'])]
    private ?int $usuarioRegistro = null;

    #[ORM\Column(name: 'fecha_registro', type: Types::DATETIME_MUTABLE)]
    #[Groups(['reproduccion:read'])]
    private ?\DateTimeInterface $fechaRegistro = null;

    public function __construct()
    {
        $this->fechaRegistro = new \DateTime();
        $this->resultado = 'pendiente';
    }

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

    public function setTipoServicio(?string $tipoServicio): self
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
        // Fecha estimada de parto: gestación caprina ~150 días
        $this->fechaPartoEstimada = (clone $fechaServicio)->modify('+150 days');
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

    public function getResultado(): ?string
    {
        return $this->resultado;
    }

    public function setResultado(?string $resultado): self
    {
        $this->resultado = $resultado;
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

    public function fueExitoso(): bool
    {
        return $this->resultado === 'exitoso';
    }

    public function getDiasGestacion(): ?int
    {
        if (!$this->fechaServicio) {
            return null;
        }
        $fechaFinal = $this->fechaPartoReal ?? new \DateTime();
        return $this->fechaServicio->diff($fechaFinal)->days;
    }
}
