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
    order: ['fechaAplicacion' => 'DESC']
)]
class Salud
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(name: 'id_registro', type: Types::INTEGER)]
    #[Groups(['salud:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Animal::class)]
    #[ORM\JoinColumn(name: 'id_animal', referencedColumnName: 'id_animal', nullable: false)]
    #[Assert\NotNull(message: 'El animal es obligatorio')]
    #[Groups(['salud:read', 'salud:write'])]
    private ?Animal $animal = null;

    #[ORM\Column(name: 'tipo_registro', type: Types::STRING, length: 30)]
    #[Assert\NotBlank(message: 'El tipo de registro es obligatorio')]
    #[Assert\Choice(
        choices: ['vacuna', 'tratamiento', 'diagnostico', 'cirugia', 'desparasitacion'],
        message: 'Tipo inválido. Valores: vacuna, tratamiento, diagnostico, cirugia, desparasitacion'
    )]
    #[Groups(['salud:read', 'salud:write'])]
    private ?string $tipoRegistro = null;

    #[ORM\Column(name: 'fecha_aplicacion', type: Types::DATE_MUTABLE)]
    #[Assert\NotBlank(message: 'La fecha de aplicación es obligatoria')]
    #[Assert\LessThanOrEqual('today', message: 'La fecha no puede ser futura')]
    #[Groups(['salud:read', 'salud:write'])]
    private ?\DateTimeInterface $fechaAplicacion = null;

    #[ORM\Column(name: 'enfermedad_diagnostico', type: Types::STRING, length: 200, nullable: true)]
    #[Assert\Length(max: 200)]
    #[Groups(['salud:read', 'salud:write'])]
    private ?string $enfermedadDiagnostico = null;

    #[ORM\Column(name: 'medicamento_producto', type: Types::STRING, length: 200, nullable: true)]
    #[Assert\Length(max: 200)]
    #[Groups(['salud:read', 'salud:write'])]
    private ?string $medicamentoProducto = null;

    #[ORM\Column(name: 'dosis', type: Types::STRING, length: 100, nullable: true)]
    #[Assert\Length(max: 100)]
    #[Groups(['salud:read', 'salud:write'])]
    private ?string $dosis = null;

    #[ORM\Column(name: 'via_administracion', type: Types::STRING, length: 50, nullable: true)]
    #[Assert\Choice(
        choices: ['oral', 'intramuscular', 'subcutanea', 'intravenosa', 'topica'],
        message: 'Vía inválida. Valores: oral, intramuscular, subcutanea, intravenosa, topica'
    )]
    #[Groups(['salud:read', 'salud:write'])]
    private ?string $viaAdministracion = null;

    #[ORM\Column(name: 'lote_producto', type: Types::STRING, length: 100, nullable: true)]
    #[Assert\Length(max: 100)]
    #[Groups(['salud:read', 'salud:write'])]
    private ?string $loteProducto = null;

    #[ORM\Column(name: 'fecha_proxima_aplicacion', type: Types::DATE_MUTABLE, nullable: true)]
    #[Groups(['salud:read', 'salud:write'])]
    private ?\DateTimeInterface $fechaProximaAplicacion = null;

    #[ORM\Column(name: 'dias_retiro_leche', type: Types::INTEGER, nullable: true)]
    #[Assert\Range(min: 0, max: 365)]
    #[Groups(['salud:read', 'salud:write'])]
    private ?int $diasRetiroLeche = null;

    #[ORM\Column(name: 'dias_retiro_carne', type: Types::INTEGER, nullable: true)]
    #[Assert\Range(min: 0, max: 365)]
    #[Groups(['salud:read', 'salud:write'])]
    private ?int $diasRetiroCarne = null;

    #[ORM\Column(name: 'veterinario', type: Types::STRING, length: 200, nullable: true)]
    #[Assert\Length(max: 200)]
    #[Groups(['salud:read', 'salud:write'])]
    private ?string $veterinario = null;

    #[ORM\Column(name: 'observaciones', type: Types::TEXT, nullable: true)]
    #[Groups(['salud:read', 'salud:write'])]
    private ?string $observaciones = null;

    #[ORM\Column(name: 'usuario_registro', type: Types::INTEGER)]
    #[Groups(['salud:read'])]
    private ?int $usuarioRegistro = null;

    #[ORM\Column(name: 'fecha_registro', type: Types::DATETIME_MUTABLE)]
    #[Groups(['salud:read'])]
    private ?\DateTimeInterface $fechaRegistro = null;

    public function __construct()
    {
        $this->fechaRegistro = new \DateTime();
    }

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

    public function getTipoRegistro(): ?string
    {
        return $this->tipoRegistro;
    }

    public function setTipoRegistro(string $tipoRegistro): self
    {
        $this->tipoRegistro = $tipoRegistro;
        return $this;
    }

    public function getFechaAplicacion(): ?\DateTimeInterface
    {
        return $this->fechaAplicacion;
    }

    public function setFechaAplicacion(\DateTimeInterface $fechaAplicacion): self
    {
        $this->fechaAplicacion = $fechaAplicacion;
        return $this;
    }

    public function getEnfermedadDiagnostico(): ?string
    {
        return $this->enfermedadDiagnostico;
    }

    public function setEnfermedadDiagnostico(?string $enfermedadDiagnostico): self
    {
        $this->enfermedadDiagnostico = $enfermedadDiagnostico;
        return $this;
    }

    public function getMedicamentoProducto(): ?string
    {
        return $this->medicamentoProducto;
    }

    public function setMedicamentoProducto(?string $medicamentoProducto): self
    {
        $this->medicamentoProducto = $medicamentoProducto;
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

    public function getLoteProducto(): ?string
    {
        return $this->loteProducto;
    }

    public function setLoteProducto(?string $loteProducto): self
    {
        $this->loteProducto = $loteProducto;
        return $this;
    }

    public function getFechaProximaAplicacion(): ?\DateTimeInterface
    {
        return $this->fechaProximaAplicacion;
    }

    public function setFechaProximaAplicacion(?\DateTimeInterface $fechaProximaAplicacion): self
    {
        $this->fechaProximaAplicacion = $fechaProximaAplicacion;
        return $this;
    }

    public function getDiasRetiroLeche(): ?int
    {
        return $this->diasRetiroLeche;
    }

    public function setDiasRetiroLeche(?int $diasRetiroLeche): self
    {
        $this->diasRetiroLeche = $diasRetiroLeche;
        return $this;
    }

    public function getDiasRetiroCarne(): ?int
    {
        return $this->diasRetiroCarne;
    }

    public function setDiasRetiroCarne(?int $diasRetiroCarne): self
    {
        $this->diasRetiroCarne = $diasRetiroCarne;
        return $this;
    }

    public function getVeterinario(): ?string
    {
        return $this->veterinario;
    }

    public function setVeterinario(?string $veterinario): self
    {
        $this->veterinario = $veterinario;
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

    public function getDiasHastaProximoEvento(): ?int
    {
        if ($this->fechaProximaAplicacion === null) {
            return null;
        }
        $hoy = new \DateTime();
        $intervalo = $hoy->diff($this->fechaProximaAplicacion);
        return $intervalo->invert ? -$intervalo->days : $intervalo->days;
    }

    public function estaEnRetiro(): bool
    {
        $maxDias = max($this->diasRetiroLeche ?? 0, $this->diasRetiroCarne ?? 0);
        if ($maxDias === 0 || $this->fechaAplicacion === null) {
            return false;
        }
        $fechaFin = (clone $this->fechaAplicacion)->modify("+{$maxDias} days");
        return new \DateTime() <= $fechaFin;
    }

    public function requiereSeguimiento(): bool
    {
        return $this->fechaProximaAplicacion !== null;
    }
}
