<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'USUARIO')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(name: 'ID_USUARIO', type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(name: 'NOMBRE_COMPLETO', type: 'string', length: 150)]
    private ?string $nombreCompleto = null;

    #[ORM\Column(name: 'EMAIL', type: 'string', length: 180, unique: true)]
    private ?string $email = null;

    #[ORM\Column(name: 'PASSWORD_HASH', type: 'string')]
    private ?string $password = null;

    #[ORM\Column(name: 'ROL', type: 'string', length: 30)]
    private string $rol = 'tecnico';

    #[ORM\Column(name: 'ESTADO', type: 'string', length: 20)]
    private string $estado = 'activo';

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
        if ($this->rol === 'administrador') {
            $roles[] = 'ROLE_ADMIN';
        }
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

    public function getEstado(): string
    {
        return $this->estado;
    }

    public function setEstado(string $estado): self
    {
        $this->estado = $estado;
        return $this;
    }

    public function eraseCredentials(): void {}
}
