<?php

namespace App\Validator;

use App\Entity\Reproduccion;
use App\Repository\GenealogiaRepository;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;

/**
 * Validador de consanguinidad entre reproductores
 * 
 * Verifica que el apareamiento propuesto no genere alta consanguinidad
 */
class ConsanguinidadPermitidaValidator extends ConstraintValidator
{
    public function __construct(
        private GenealogiaRepository $genealogiaRepository
    ) {}

    public function validate($value, Constraint $constraint): void
    {
        if (!$constraint instanceof ConsanguinidadPermitida) {
            throw new UnexpectedTypeException($constraint, ConsanguinidadPermitida::class);
        }

        if (!$value instanceof Reproduccion) {
            throw new UnexpectedTypeException($value, Reproduccion::class);
        }

        // Solo validar en monta natural (cuando hay macho definido)
        if ($value->getTipoServicio() !== 'Monta Natural' || !$value->getMacho()) {
            return;
        }

        $hembra = $value->getHembra();
        $macho = $value->getMacho();

        if (!$hembra || !$macho) {
            return;
        }

        // Verificar parentesco directo
        $parentesco = $this->genealogiaRepository->verificarParentesco(
            $hembra->getId(),
            $macho->getId()
        );

        if ($parentesco['emparentados']) {
            // Evitar apareamientos entre padres-hijos y hermanos completos
            if (in_array($parentesco['tipo_parentesco'], ['Padre-hijo', 'Madre-hijo', 'Hermanos completos'])) {
                $this->context->buildViolation($constraint->message)
                    ->setParameter('{{ coeficiente }}', 'Alto - ' . $parentesco['tipo_parentesco'])
                    ->addViolation();
                return;
            }
        }

        // Si ambos tienen genealogía, calcular coeficiente estimado
        $genHembra = $this->genealogiaRepository->findByCria($hembra->getId());
        $genMacho = $this->genealogiaRepository->findByCria($macho->getId());

        if ($genHembra && $genMacho) {
            // Cálculo simplificado: si comparten ancestros directos
            $coeficienteEstimado = 0.0;

            // Si comparten padre
            if ($genHembra->getPadre() && $genMacho->getPadre() && 
                $genHembra->getPadre()->getId() === $genMacho->getPadre()->getId()) {
                $coeficienteEstimado += 0.25; // Medio hermanos
            }

            // Si comparten madre
            if ($genHembra->getMadre() && $genMacho->getMadre() && 
                $genHembra->getMadre()->getId() === $genMacho->getMadre()->getId()) {
                $coeficienteEstimado += 0.25; // Medio hermanos
            }

            if ($coeficienteEstimado > 0.25) {
                $this->context->buildViolation($constraint->message)
                    ->setParameter('{{ coeficiente }}', number_format($coeficienteEstimado, 4))
                    ->addViolation();
            }
        }
    }
}
