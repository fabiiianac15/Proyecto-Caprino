<?php

namespace App\Validator;

use App\Entity\Animal;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;
use Symfony\Component\Validator\Exception\UnexpectedValueException;

/**
 * Validador de edad reproductiva
 * 
 * Verifica que los animales tengan edad adecuada para reproducción
 */
class EdadReproductivaValidator extends ConstraintValidator
{
    public function validate($value, Constraint $constraint): void
    {
        if (!$constraint instanceof EdadReproductiva) {
            throw new UnexpectedTypeException($constraint, EdadReproductiva::class);
        }

        if (null === $value) {
            return;
        }

        if (!$value instanceof Animal) {
            throw new UnexpectedValueException($value, Animal::class);
        }

        $edadMeses = $value->getEdadMeses();
        $edadAnios = $value->getEdadAnios();

        if ($edadMeses === null || $edadAnios === null) {
            return; // No se puede validar sin fecha de nacimiento
        }

        // Validar edad mínima
        if ($value->getSexo() === 'Hembra') {
            if ($edadMeses < $constraint->edadMinimaHembrasMeses) {
                $this->context->buildViolation($constraint->messageMuyJoven)
                    ->setParameter('{{ identificacion }}', $value->getIdentificacion())
                    ->setParameter('{{ edadMinima }}', (string) $constraint->edadMinimaHembrasMeses)
                    ->setParameter('{{ edadActual }}', (string) $edadMeses)
                    ->addViolation();
                return;
            }

            // Validar edad máxima recomendada
            if ($edadAnios > $constraint->edadMaximaHembrasAnios) {
                $this->context->buildViolation($constraint->messageMuyViejo)
                    ->setParameter('{{ identificacion }}', $value->getIdentificacion())
                    ->setParameter('{{ edadMaxima }}', (string) $constraint->edadMaximaHembrasAnios)
                    ->setParameter('{{ edadActual }}', (string) $edadAnios)
                    ->addViolation();
            }
        } elseif ($value->getSexo() === 'Macho') {
            if ($edadMeses < $constraint->edadMinimaMachosMeses) {
                $this->context->buildViolation($constraint->messageMuyJoven)
                    ->setParameter('{{ identificacion }}', $value->getIdentificacion())
                    ->setParameter('{{ edadMinima }}', (string) $constraint->edadMinimaMachosMeses)
                    ->setParameter('{{ edadActual }}', (string) $edadMeses)
                    ->addViolation();
                return;
            }

            // Validar edad máxima recomendada
            if ($edadAnios > $constraint->edadMaximaMachosAnios) {
                $this->context->buildViolation($constraint->messageMuyViejo)
                    ->setParameter('{{ identificacion }}', $value->getIdentificacion())
                    ->setParameter('{{ edadMaxima }}', (string) $constraint->edadMaximaMachosAnios)
                    ->setParameter('{{ edadActual }}', (string) $edadAnios)
                    ->addViolation();
            }
        }
    }
}
