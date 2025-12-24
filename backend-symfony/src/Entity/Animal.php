<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Delete;
use App\Repository\AnimalRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Entidad Animal - Representa cada cabra individual en el sistema
 * 
 * Esta es la entidad principal del sistema. Cada animal tiene un identificador
 * único y contiene toda la información básica necesaria para su trazabilidad.
 */
#[ORM\Entity(repositoryClass: AnimalRepository::class)]
#[ORM\Table(name: 'ANIMAL')]
#[ApiResource(
    operations: [
        new GetCollection(),
        new Get(),
        new Post(security: "is_granted('ROLE_ZOOTECNISTA')"),
        new Put(security: "is_granted('ROLE_ZOOTECNISTA')"),
        new Delete(security: "is_granted('ROLE_ADMIN')")
    ],
    normalizationContext: ['groups' => ['animal:read']],
    denormalizationContext: ['groups' => ['animal:write']],
    paginationEnabled: true,
    paginationItemsPerPage: 30
)]
class Animal
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(name: 'id_animal', type: Types::INTEGER)]
    #[Groups(['animal:read'])]
    private ?int $id = null;

    /**
     * Código de identificación único del animal
     * Puede ser: crotal oficial, código QR, chip RFID o código interno
     */
    #[ORM\Column(name: 'codigo_identificacion', type: Types::STRING, length: 50, unique: true)]
    #[Assert\NotBlank(message: 'El código de identificación es obligatorio')]
    #[Assert\Length(
        min: 3,
        max: 50,
        minMessage: 'El código debe tener al menos {{ limit }} caracteres',
        maxMessage: 'El código no puede superar {{ limit }} caracteres'
    )]
    #[Groups(['animal:read', 'animal:write'])]
    private ?string $codigoIdentificacion = null;

    /**
     * Nombre del animal (opcional pero recomendado)
     */
    #[ORM\Column(type: Types::STRING, length: 100, nullable: true)]
    #[Assert\Length(max: 100)]
    #[Groups(['animal:read', 'animal:write'])]
    private ?string $nombre = null;

    /**
     * Fecha de nacimiento del animal
     * Debe ser anterior o igual a la fecha actual
     */
    #[ORM\Column(name: 'fecha_nacimiento', type: Types::DATE_MUTABLE)]
    #[Assert\NotBlank(message: 'La fecha de nacimiento es obligatoria')]
    #[Assert\LessThanOrEqual(
        'today',
        message: 'La fecha de nacimiento no puede ser futura'
    )]
    #[Groups(['animal:read', 'animal:write'])]
    private ?\DateTimeInterface $fechaNacimiento = null;

    /**
     * Sexo del animal: macho o hembra
     */
    #[ORM\Column(type: Types::STRING, length: 10)]
    #[Assert\NotBlank(message: 'El sexo es obligatorio')]
    #[Assert\Choice(
        choices: ['macho', 'hembra'],
        message: 'El sexo debe ser "macho" o "hembra"'
    )]
    #[Groups(['animal:read', 'animal:write'])]
    private ?string $sexo = null;

    /**
     * Relación con la entidad Raza
     */
    #[ORM\ManyToOne(targetEntity: Raza::class)]
    #[ORM\JoinColumn(name: 'id_raza', referencedColumnName: 'id_raza', nullable: false)]
    #[Assert\NotNull(message: 'La raza es obligatoria')]
    #[Groups(['animal:read', 'animal:write'])]
    private ?Raza $raza = null;

    /**
     * Color del pelaje del animal
     */
    #[ORM\Column(name: 'color_pelaje', type: Types::STRING, length: 50, nullable: true)]
    #[Assert\Length(max: 50)]
    #[Groups(['animal:read', 'animal:write'])]
    private ?string $colorPelaje = null;

    /**
     * Peso al nacer en kilogramos
     * Rango normal: 2-6 kg
     */
    #[ORM\Column(name: 'peso_nacimiento_kg', type: Types::DECIMAL, precision: 5, scale: 2, nullable: true)]
    #[Assert\Positive(message: 'El peso al nacer debe ser positivo')]
    #[Assert\Range(
        min: 1.0,
        max: 6.0,
        notInRangeMessage: 'El peso al nacer debe estar entre {{ min }} y {{ max }} kg'
    )]
    #[Groups(['animal:read', 'animal:write'])]
    private ?float $pesoNacimientoKg = null;

    /**
     * Estado actual del animal
     * Valores: activo, vendido, muerto, descartado
     */
    #[ORM\Column(type: Types::STRING, length: 30)]
    #[Assert\Choice(
        choices: ['activo', 'vendido', 'muerto', 'descartado'],
        message: 'Estado inválido'
    )]
    #[Groups(['animal:read', 'animal:write'])]
    private string $estado = 'activo';

    /**
     * Motivo del cambio de estado (requerido cuando estado != activo)
     */
    #[ORM\Column(name: 'motivo_estado', type: Types::STRING, length: 500, nullable: true)]
    #[Assert\Length(max: 500)]
    #[Groups(['animal:read', 'animal:write'])]
    private ?string $motivoEstado = null;

    /**
     * Fecha del cambio de estado
     */
    #[ORM\Column(name: 'fecha_cambio_estado', type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['animal:read'])]
    private ?\DateTimeInterface $fechaCambioEstado = null;

    /**
     * Observaciones adicionales sobre el animal
     */
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['animal:read', 'animal:write'])]
    private ?string $observaciones = null;

    /**
     * URL de la fotografía del animal
     */
    #[ORM\Column(name: 'foto_url', type: Types::STRING, length: 500, nullable: true)]
    #[Assert\Url(message: 'La URL de la foto no es válida')]
    #[Assert\Length(max: 500)]
    #[Groups(['animal:read', 'animal:write'])]
    private ?string $fotoUrl = null;

    /**
     * Fecha de registro en el sistema
     */
    #[ORM\Column(name: 'fecha_registro', type: Types::DATETIME_MUTABLE)]
    #[Groups(['animal:read'])]
    private ?\DateTimeInterface $fechaRegistro = null;

    /**
     * ID del usuario que registró el animal
     */
    #[ORM\Column(name: 'usuario_registro', type: Types::INTEGER)]
    #[Groups(['animal:read'])]
    private ?int $usuarioRegistro = null;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->fechaRegistro = new \DateTime();
        $this->estado = 'activo';
    }

    // Getters y Setters

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCodigoIdentificacion(): ?string
    {
        return $this->codigoIdentificacion;
    }

    public function setCodigoIdentificacion(string $codigoIdentificacion): self
    {
        $this->codigoIdentificacion = $codigoIdentificacion;
        return $this;
    }

    public function getNombre(): ?string
    {
        return $this->nombre;
    }

    public function setNombre(?string $nombre): self
    {
        $this->nombre = $nombre;
        return $this;
    }

    public function getFechaNacimiento(): ?\DateTimeInterface
    {
        return $this->fechaNacimiento;
    }

    public function setFechaNacimiento(\DateTimeInterface $fechaNacimiento): self
    {
        $this->fechaNacimiento = $fechaNacimiento;
        return $this;
    }

    /**
     * Calcula la edad del animal en años
     */
    public function getEdadAnios(): int
    {
        if (!$this->fechaNacimiento) {
            return 0;
        }
        
        $ahora = new \DateTime();
        $diferencia = $ahora->diff($this->fechaNacimiento);
        return $diferencia->y;
    }

    /**
     * Calcula la edad del animal en días
     */
    public function getEdadDias(): int
    {
        if (!$this->fechaNacimiento) {
            return 0;
        }
        
        $ahora = new \DateTime();
        $diferencia = $ahora->diff($this->fechaNacimiento);
        return $diferencia->days;
    }

    public function getSexo(): ?string
    {
        return $this->sexo;
    }

    public function setSexo(string $sexo): self
    {
        $this->sexo = $sexo;
        return $this;
    }

    public function getRaza(): ?Raza
    {
        return $this->raza;
    }

    public function setRaza(?Raza $raza): self
    {
        $this->raza = $raza;
        return $this;
    }

    public function getColorPelaje(): ?string
    {
        return $this->colorPelaje;
    }

    public function setColorPelaje(?string $colorPelaje): self
    {
        $this->colorPelaje = $colorPelaje;
        return $this;
    }

    public function getPesoNacimientoKg(): ?float
    {
        return $this->pesoNacimientoKg;
    }

    public function setPesoNacimientoKg(?float $pesoNacimientoKg): self
    {
        $this->pesoNacimientoKg = $pesoNacimientoKg;
        return $this;
    }

    public function getEstado(): string
    {
        return $this->estado;
    }

    public function setEstado(string $estado): self
    {
        // Si cambia el estado, actualizar la fecha
        if ($this->estado !== $estado && $estado !== 'activo') {
            $this->fechaCambioEstado = new \DateTime();
        }
        
        $this->estado = $estado;
        return $this;
    }

    public function getMotivoEstado(): ?string
    {
        return $this->motivoEstado;
    }

    public function setMotivoEstado(?string $motivoEstado): self
    {
        $this->motivoEstado = $motivoEstado;
        return $this;
    }

    public function getFechaCambioEstado(): ?\DateTimeInterface
    {
        return $this->fechaCambioEstado;
    }

    public function setFechaCambioEstado(?\DateTimeInterface $fechaCambioEstado): self
    {
        $this->fechaCambioEstado = $fechaCambioEstado;
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

    public function getFotoUrl(): ?string
    {
        return $this->fotoUrl;
    }

    public function setFotoUrl(?string $fotoUrl): self
    {
        $this->fotoUrl = $fotoUrl;
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

    public function getUsuarioRegistro(): ?int
    {
        return $this->usuarioRegistro;
    }

    public function setUsuarioRegistro(int $usuarioRegistro): self
    {
        $this->usuarioRegistro = $usuarioRegistro;
        return $this;
    }

    /**
     * Verifica si el animal está activo
     */
    public function estaActivo(): bool
    {
        return $this->estado === 'activo';
    }

    /**
     * Verifica si el animal es hembra
     */
    public function esHembra(): bool
    {
        return $this->sexo === 'hembra';
    }

    /**
     * Verifica si el animal es macho
     */
    public function esMacho(): bool
    {
        return $this->sexo === 'macho';
    }

    /**
     * Verifica si el animal tiene edad reproductiva
     * Hembras: 7 meses, Machos: 8 meses
     */
    public function tieneEdadReproductiva(): bool
    {
        $edadMeses = $this->getEdadDias() / 30;
        
        if ($this->esHembra()) {
            return $edadMeses >= 7;
        }
        
        return $edadMeses >= 8;
    }
}
