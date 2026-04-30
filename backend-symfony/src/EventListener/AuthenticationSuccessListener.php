<?php

namespace App\EventListener;

use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;

#[AsEventListener(event: 'lexik_jwt_authentication.on_authentication_success')]
class AuthenticationSuccessListener
{
    public function __invoke(AuthenticationSuccessEvent $event): void
    {
        $data = $event->getData();
        $user = $event->getUser();

        if (!$user instanceof User) {
            return;
        }

        $data['success'] = true;
        $data['message'] = 'Login exitoso';
        $data['user'] = [
            'id'     => $user->getId(),
            'nombre' => $user->getNombreCompleto(),
            'email'  => $user->getEmail(),
            'rol'    => $user->getRol(),
        ];

        $event->setData($data);
    }
}
