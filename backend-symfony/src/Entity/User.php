<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'USUARIO')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(name: 'ID_USUARIO', type: Types::INTEGER)]
    private ?int $id = null;

    #[ORM\Column(name: 'NOMBRE_COMPLETO', type: Types::STRING, length: 200)]
    private ?string $nombreCompleto = null;

    #[ORM\Column(name: 'EMAIL', type: Types::STRING, length: 200, unique: true)]
    private ?string $email = null;

    #[ORM\Column(name: 'PASSWORD_HASH', type: Types::STRING, length: 255)]
    private ?string $password = null;

    #[ORM\Column(name: 'ROL', type: Types::STRING, length: 30)]
    private string $rol = 'tecnico';

    #[ORM\Column(name: 'TELEFONO', type: Types::STRING, length: 20, nullable: true)]
    private ?string $telefono = null;

    #[ORM\Column(name: 'ESTADO', type: Types::STRING, length: 20)]
    private string $estado = 'activo';

    #[ORM\Column(name: 'ULTIMO_ACCESO', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $ultimoAcceso = null;

    #[ORM\Column(name: 'FECHA_CREACION', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $fechaCreacion = null;

    #[ORM\Column(name: 'FECHA_MODIFICACION', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $fechaModificacion = null;

    public function __construct()
    {
        $this->fechaCreacion = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNombreCompleto(): ?string
    {
        return $this->nombreCompleto;
    }

    public function setNombreCompleto(string $nombreCompleto): self
    {
        $this->nombreCompleto = $nombreCompleto;
        return $this;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): self
    {
        $this->email = $email;
        return $this;
    }

    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    public function getRoles(): array
    {
        $roles = ['ROLE_USER'];
        match ($this->rol) {
            'administrador' => $roles[] = 'ROLE_ADMIN',
            'zootecnista'   => $roles[] = 'ROLE_ZOOTECNISTA',
            'veterinario'   => $roles[] = 'ROLE_VETERINARIO',
            'tecnico'       => $roles[] = 'ROLE_TECNICO',
            default         => null,
        };
        return array_unique($roles);
    }

    public function getPassword(): string
    {
        return (string) $this->password;
    }

    public function setPassword(string $password): self
    {
        $this->password = $password;
        return $this;
    }

    public function getRol(): string
    {
        return $this->rol;
    }

    public function setRol(string $rol): self
    {
        $this->rol = $rol;
        return $this;
    }

    public function getTelefono(): ?string
    {
        return $this->telefono;
    }

    public function setTelefono(?string $telefono): self
    {
        $this->telefono = $telefono;
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

    public function getUltimoAcceso(): ?\DateTimeInterface
    {
        return $this->ultimoAcceso;
    }

    public function setUltimoAcceso(?\DateTimeInterface $ultimoAcceso): self
    {
        $this->ultimoAcceso = $ultimoAcceso;
        return $this;
    }

    public function getFechaCreacion(): ?\DateTimeInterface
    {
        return $this->fechaCreacion;
    }

    public function setFechaCreacion(?\DateTimeInterface $fechaCreacion): self
    {
        $this->fechaCreacion = $fechaCreacion;
        return $this;
    }

    public function getFechaModificacion(): ?\DateTimeInterface
    {
        return $this->fechaModificacion;
    }

    public function setFechaModificacion(?\DateTimeInterface $fechaModificacion): self
    {
        $this->fechaModificacion = $fechaModificacion;
        return $this;
    }

    public function eraseCredentials(): void {}
}
