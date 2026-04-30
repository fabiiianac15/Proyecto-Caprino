<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\DBAL\Connection;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api')]
class AuthController extends AbstractController
{
    public function __construct(
        private Connection $connection,
        private JWTTokenManagerInterface $jwtManager
    ) {}

    #[Route('/auth/register', name: 'api_auth_register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $data     = json_decode($request->getContent(), true) ?? [];
        $nombre   = $data['nombre_completo'] ?? $data['nombre'] ?? null;
        $email    = $data['email']    ?? null;
        $password = $data['password'] ?? null;
        $rol      = $data['rol']      ?? 'tecnico';

        if (!$nombre || !$email || !$password) {
            return $this->json(['error' => 'Campos requeridos: nombre_completo, email, password'], Response::HTTP_BAD_REQUEST);
        }

        if (strlen($password) < 8) {
            return $this->json(['error' => 'La contraseña debe tener al menos 8 caracteres'], Response::HTTP_BAD_REQUEST);
        }

        if (!in_array($rol, ['administrador', 'zootecnista', 'tecnico', 'veterinario'])) {
            $rol = 'tecnico';
        }

        $count = (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM USUARIO WHERE EMAIL = :email',
            ['email' => $email]
        );

        if ($count > 0) {
            return $this->json(['error' => 'El email ya está registrado'], Response::HTTP_CONFLICT);
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);

        $this->connection->executeStatement(
            "INSERT INTO USUARIO (nombre_completo, email, password_hash, rol, estado) VALUES (:nombre, :email, :hash, :rol, 'activo')",
            ['nombre' => $nombre, 'email' => $email, 'hash' => $hash, 'rol' => $rol]
        );

        $userId = (int) $this->connection->fetchOne(
            'SELECT id_usuario FROM USUARIO WHERE email = :email',
            ['email' => $email]
        );

        $userObj = new User();
        $userObj->setNombreCompleto($nombre);
        $userObj->setEmail($email);
        $userObj->setPassword($hash);
        $userObj->setRol($rol);

        $token = $this->jwtManager->create($userObj);

        return $this->json([
            'success' => true,
            'message' => 'Usuario registrado correctamente',
            'token'   => $token,
            'user'    => ['id' => $userId, 'nombre' => $nombre, 'email' => $email, 'rol' => $rol],
        ], Response::HTTP_CREATED);
    }

    #[Route('/me', name: 'api_me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json(['error' => 'No autenticado'], Response::HTTP_UNAUTHORIZED);
        }

        return $this->json([
            'id'     => $user->getId(),
            'nombre' => $user->getNombreCompleto(),
            'email'  => $user->getEmail(),
            'rol'    => $user->getRol(),
        ]);
    }
}
