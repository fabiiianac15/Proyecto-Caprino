<?php

namespace App\Validator;

use App\Entity\Reproduccion;
use App\Repository\ReproduccionRepository;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;

/**
 * Validador de intervalo reproductivo
 * 
 * Verifica que haya pasado suficiente tiempo desde el último evento reproductivo
 */
class IntervaloReproductivoValidator extends ConstraintValidator
{
    public function __construct(
        private ReproduccionRepository $reproduccionRepository
    ) {}

    public function validate($value, Constraint $constraint): void
    {
        if (!$constraint instanceof IntervaloReproductivo) {
            throw new UnexpectedTypeException($constraint, IntervaloReproductivo::class);
        }

        if (!$value instanceof Reproduccion) {
            throw new UnexpectedTypeException($value, Reproduccion::class);
        }

        $hembra = $value->getHembra();
        $fechaServicioActual = $value->getFechaServicio();

        if (!$hembra || !$fechaServicioActual) {
            return;
        }

        // Obtener el historial reproductivo de la hembra
        $historial = $this->reproduccionRepository->findByHembra($hembra->getId());

        if (empty($historial)) {
            return; // Primer servicio, no hay restricciones
        }

        // Buscar el evento más reciente anterior al actual
        $eventoAnterior = null;
        foreach ($historial as $evento) {
            if ($evento->getId() === $value->getId()) {
                continue; // Saltar el registro actual si ya existe
            }
            
            if (!$eventoAnterior || $evento->getFechaServicio() > $eventoAnterior->getFechaServicio()) {
                $eventoAnterior = $evento;
            }
        }

        if (!$eventoAnterior) {
            return;
        }

        // Si el evento anterior resultó en parto
        if ($eventoAnterior->getFechaPartoReal()) {
            $diasDesdeParto = $eventoAnterior->getFechaPartoReal()->diff($fechaServicioActual)->days;
            
            if ($diasDesdeParto < $constraint->diasMinimosDespuesParto) {
                $this->context->buildViolation($constraint->message)
                    ->setParameter('{{ diasTranscurridos }}', (string) $diasDesdeParto)
                    ->setParameter('{{ diasMinimos }}', (string) $constraint->diasMinimosDespuesParto)
                    ->addViolation();
                return;
            }
        }

        // Si el evento anterior fue un servicio sin parto registrado
        $diasDesdeServicio = $eventoAnterior->getFechaServicio()->diff($fechaServicioActual)->days;
        
        // Si fue negativo o pendiente, debe esperar al menos para confirmar
        if ($eventoAnterior->getResultadoDiagnostico() !== 'Positivo' && 
            $diasDesdeServicio < $constraint->diasMinimosDespuesServicio) {
            
            $this->context->buildViolation($constraint->message)
                ->setParameter('{{ diasTranscurridos }}', (string) $diasDesdeServicio)
                ->setParameter('{{ diasMinimos }}', (string) $constraint->diasMinimosDespuesServicio)
                ->addViolation();
        }
    }
}
