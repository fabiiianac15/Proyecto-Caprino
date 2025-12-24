<?php

namespace App\Validator;

use Symfony\Component\Validator\Constraint;

/**
 * Constraint para validar intervalo entre servicios/partos
 * 
 * @Annotation
 */
#[\Attribute(\Attribute::TARGET_CLASS)]
class IntervaloReproductivo extends Constraint
{
    public string $message = 'El intervalo desde el último evento reproductivo es muy corto ({{ diasTranscurridos }} días). Se recomienda esperar al menos {{ diasMinimos }} días';
    
    public int $diasMinimosDespuesParto = 45; // Días de descanso post-parto
    public int $diasMinimosDespuesServicio = 21; // Días antes de repetir servicio

    public function getTargets(): string
    {
        return self::CLASS_CONSTRAINT;
    }
}
