<?php

namespace App\Validator;

use Symfony\Component\Validator\Constraint;

/**
 * Constraint para validar que un animal tenga edad reproductiva adecuada
 * 
 * @Annotation
 */
#[\Attribute(\Attribute::TARGET_PROPERTY | \Attribute::TARGET_METHOD)]
class EdadReproductiva extends Constraint
{
    public string $messageMuyJoven = 'El animal {{ identificacion }} es muy joven para reproducción. Edad mínima: {{ edadMinima }} meses (actual: {{ edadActual }} meses)';
    public string $messageMuyViejo = 'El animal {{ identificacion }} ha superado la edad reproductiva óptima. Edad máxima recomendada: {{ edadMaxima }} años (actual: {{ edadActual }} años)';
    
    public int $edadMinimaHembrasMeses = 7;
    public int $edadMinimaMachosMeses = 8;
    public int $edadMaximaHembrasAnios = 10;
    public int $edadMaximaMachosAnios = 8;
}
