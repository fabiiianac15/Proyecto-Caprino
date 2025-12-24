<?php

namespace App\Validator;

use Symfony\Component\Validator\Constraint;

/**
 * Constraint para validar que no exista alta consanguinidad en un apareamiento
 * 
 * @Annotation
 */
#[\Attribute(\Attribute::TARGET_CLASS)]
class ConsanguinidadPermitida extends Constraint
{
    public string $message = 'El apareamiento entre estos animales presenta alto riesgo de consanguinidad ({{ coeficiente }}). Se recomienda evitar cruces con coeficiente superior a 0.25';

    public function getTargets(): string
    {
        return self::CLASS_CONSTRAINT;
    }
}
