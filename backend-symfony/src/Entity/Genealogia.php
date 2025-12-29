<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Delete;
use App\Repository\GenealogiaRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Entidad Genealogia - Árbol genealógico y parentesco
 * 
 * Registra las relaciones de parentesco entre animales para
 * control de consanguinidad y mejoramiento genético.
 */
#[ORM\Entity(repositoryClass: GenealogiaRepository::class)]
#[ORM\Table(name: 'GENEALOGIA')]
#[ORM\UniqueConstraint(name: 'uk_genealogia_cria', columns: ['id_cria'])]
#[ApiResource(
    operations: [
        new GetCollection(),
        new Get(),
        new Post(security: "is_granted('ROLE_ZOOTECNISTA')"),
        new Delete(security: "is_granted('ROLE_ADMINISTRADOR')")
    ],
    normalizationContext: ['groups' => ['genealogia:read']],
    denormalizationContext: ['groups' => ['genealogia:write']]
)]
class Genealogia
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(name: 'id_genealogia', type: Types::INTEGER)]
    #[Groups(['genealogia:read'])]
    private ?int $id = null;

    /**
     * Cría (animal hijo/hija)
     * Cada cría solo puede tener un registro genealógico único
     */
    #[ORM\ManyToOne(targetEntity: Animal::class)]
    #[ORM\JoinColumn(name: 'id_cria', referencedColumnName: 'id_animal', nullable: false)]
    #[Assert\NotNull(message: 'La cría es obligatoria')]
    #[Groups(['genealogia:read', 'genealogia:write'])]
    private ?Animal $cria = null;

    /**
     * Padre del animal
     */
    #[ORM\ManyToOne(targetEntity: Animal::class)]
    #[ORM\JoinColumn(name: 'id_padre', referencedColumnName: 'id_animal', nullable: true)]
    #[Groups(['genealogia:read', 'genealogia:write'])]
    private ?Animal $padre = null;

    /**
     * Madre del animal
     */
    #[ORM\ManyToOne(targetEntity: Animal::class)]
    #[ORM\JoinColumn(name: 'id_madre', referencedColumnName: 'id_animal', nullable: true)]
    #[Groups(['genealogia:read', 'genealogia:write'])]
    private ?Animal $madre = null;

    /**
     * Coeficiente de consanguinidad (0-1)
     * Se calcula automáticamente mediante trigger
     * 0 = Sin consanguinidad
     * >0.25 = Alta consanguinidad (evitar)
     */
    #[ORM\Column(name: 'coeficiente_consanguinidad', type: Types::FLOAT, nullable: true)]
    #[Groups(['genealogia:read'])]
    private ?float $coeficienteConsanguinidad = null;

    /**
     * Número de generaciones registradas en el pedigrí
     */
    #[ORM\Column(name: 'generaciones_conocidas', type: Types::INTEGER, options: ['default' => 1])]
    #[Assert\Range(
        min: 1,
        max: 10,
        notInRangeMessage: 'Las generaciones deben estar entre {{ min }} y {{ max }}'
    )]
    #[Groups(['genealogia:read', 'genealogia:write'])]
    private int $generacionesConocidas = 1;

    /**
     * Indica si el animal tiene pedigrí certificado
     */
    #[ORM\Column(name: 'pedigri_certificado', type: Types::STRING, length: 2, options: ['default' => 'No'])]
    #[Assert\Choice(
        choices: ['Sí', 'No'],
        message: 'Debe ser Sí o No'
    )]
    #[Groups(['genealogia:read', 'genealogia:write'])]
    private string $pedigriCertificado = 'No';

    /**
     * Número de certificado de pedigrí
     */
    #[ORM\Column(name: 'numero_certificado', type: Types::STRING, length: 50, nullable: true)]
    #[Assert\Length(max: 50)]
    #[Groups(['genealogia:read', 'genealogia:write'])]
    private ?string $numeroCertificado = null;

    /**
     * Organización que emitió el certificado
     */
    #[ORM\Column(name: 'organizacion_certificadora', type: Types::STRING, length: 100, nullable: true)]
    #[Assert\Length(max: 100)]
    #[Groups(['genealogia:read', 'genealogia:write'])]
    private ?string $organizacionCertificadora = null;

    /**
     * Notas sobre el pedigrí o la genealogía
     */
    #[ORM\Column(type: Types::STRING, length: 500, nullable: true)]
    #[Assert\Length(max: 500)]
    #[Groups(['genealogia:read', 'genealogia:write'])]
    private ?string $notas = null;

    /**
     * ID del usuario que registró la genealogía
     */
    #[ORM\Column(name: 'usuario_registro', type: Types::INTEGER)]
    #[Groups(['genealogia:read'])]
    private ?int $usuarioRegistro = null;

    /**
     * Fecha de registro en el sistema
     */
    #[ORM\Column(name: 'fecha_registro', type: Types::DATETIME_MUTABLE)]
    #[Groups(['genealogia:read'])]
    private ?\DateTimeInterface $fechaRegistro = null;

    public function __construct()
    {
        $this->fechaRegistro = new \DateTime();
        $this->generacionesConocidas = 1;
        $this->pedigriCertificado = 'No';
    }

    // Getters y Setters

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCria(): ?Animal
    {
        return $this->cria;
    }

    public function setCria(?Animal $cria): self
    {
        $this->cria = $cria;
        return $this;
    }

    public function getPadre(): ?Animal
    {
        return $this->padre;
    }

    public function setPadre(?Animal $padre): self
    {
        $this->padre = $padre;
        return $this;
    }

    public function getMadre(): ?Animal
    {
        return $this->madre;
    }

    public function setMadre(?Animal $madre): self
    {
        $this->madre = $madre;
        return $this;
    }

    public function getCoeficienteConsanguinidad(): ?float
    {
        return $this->coeficienteConsanguinidad;
    }

    public function setCoeficienteConsanguinidad(?float $coeficienteConsanguinidad): self
    {
        $this->coeficienteConsanguinidad = $coeficienteConsanguinidad;
        return $this;
    }

    public function getGeneracionesConocidas(): int
    {
        return $this->generacionesConocidas;
    }

    public function setGeneracionesConocidas(int $generacionesConocidas): self
    {
        $this->generacionesConocidas = $generacionesConocidas;
        return $this;
    }

    public function getPedigriCertificado(): string
    {
        return $this->pedigriCertificado;
    }

    public function setPedigriCertificado(string $pedigriCertificado): self
    {
        $this->pedigriCertificado = $pedigriCertificado;
        return $this;
    }

    public function getNumeroCertificado(): ?string
    {
        return $this->numeroCertificado;
    }

    public function setNumeroCertificado(?string $numeroCertificado): self
    {
        $this->numeroCertificado = $numeroCertificado;
        return $this;
    }

    public function getOrganizacionCertificadora(): ?string
    {
        return $this->organizacionCertificadora;
    }

    public function setOrganizacionCertificadora(?string $organizacionCertificadora): self
    {
        $this->organizacionCertificadora = $organizacionCertificadora;
        return $this;
    }

    public function getNotas(): ?string
    {
        return $this->notas;
    }

    public function setNotas(?string $notas): self
    {
        $this->notas = $notas;
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
     * Determina si el registro genealógico está completo (padre y madre)
     * 
     * @return bool true si tiene ambos padres registrados
     */
    public function esGenealogiaCompleta(): bool
    {
        return $this->padre !== null && $this->madre !== null;
    }

    /**
     * Determina si existe alto riesgo de consanguinidad
     * 
     * @return bool true si el coeficiente es mayor a 0.25
     */
    public function tieneAltaConsanguinidad(): bool
    {
        if ($this->coeficienteConsanguinidad === null) {
            return false;
        }

        return $this->coeficienteConsanguinidad > 0.25;
    }

    /**
     * Evalúa el nivel de consanguinidad
     * 
     * @return string Nivel: 'Ninguna', 'Baja', 'Media', 'Alta', 'Muy Alta'
     */
    public function getNivelConsanguinidad(): string
    {
        if ($this->coeficienteConsanguinidad === null) {
            return 'No calculada';
        }

        return match(true) {
            $this->coeficienteConsanguinidad == 0 => 'Ninguna',
            $this->coeficienteConsanguinidad <= 0.0625 => 'Baja',
            $this->coeficienteConsanguinidad <= 0.125 => 'Media',
            $this->coeficienteConsanguinidad <= 0.25 => 'Alta',
            default => 'Muy Alta'
        };
    }

    /**
     * Determina si tiene pedigrí certificado válido
     * 
     * @return bool true si está certificado y tiene número
     */
    public function tienePedigriValido(): bool
    {
        return $this->pedigriCertificado === 'Sí' 
            && $this->numeroCertificado !== null 
            && trim($this->numeroCertificado) !== '';
    }

    /**
     * Verifica si los padres son de la misma raza
     * 
     * @return bool true si ambos padres son de la misma raza que la cría
     */
    public function esCruzaPura(): bool
    {
        if (!$this->esGenealogiaCompleta() || $this->cria === null) {
            return false;
        }

        $razaCria = $this->cria->getRaza();
        $razaPadre = $this->padre->getRaza();
        $razaMadre = $this->madre->getRaza();

        if ($razaCria === null || $razaPadre === null || $razaMadre === null) {
            return false;
        }

        return $razaCria->getId() === $razaPadre->getId() 
            && $razaCria->getId() === $razaMadre->getId();
    }
}
