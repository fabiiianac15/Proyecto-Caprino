<?php

namespace App\Service;

/**
 * Motor de cálculo de la clasificación lineal fenotípica (método ADGA,
 * Cedeño et al. 2024). Cuatro regiones con puntos máximos fijos:
 *   APARIENCIA 25, ESTRUCTURA 15, MAMARIO 40, PATAS 20 (total 100).
 *
 * Cada rasgo se califica 1 (bajo), 2 (intermedio) o 3 (alto). Dentro de
 * una región los puntos se reparten por igual entre sus rasgos y se
 * escalan por un factor según la calificación.
 */
class ClasificacionLinealService
{
    // Factor de aporte por calificación (1=bajo, 2=intermedio, 3=alto).
    public const FACTOR = [1 => 0.10, 2 => 0.50, 3 => 1.00];

    public const REGIONES = ['APARIENCIA', 'ESTRUCTURA', 'MAMARIO', 'PATAS'];

    /**
     * @param array<int,array{idRasgo:int,calificacion:int}> $detalles
     * @param array<int,array{region:string,ptsRegion:float}> $catalogo  indexado por idRasgo
     *
     * @return array{
     *   subtotales: array<string,float>,
     *   puntajes: array<int,float>,      // aporte por idRasgo
     *   puntFinal: float,
     *   categoria: string
     * }
     */
    public function calcular(array $detalles, array $catalogo): array
    {
        // Cuántos rasgos tiene cada región (según el catálogo) para repartir puntos.
        $rasgosPorRegion = [];
        foreach ($catalogo as $rasgo) {
            $rasgosPorRegion[$rasgo['region']] = ($rasgosPorRegion[$rasgo['region']] ?? 0) + 1;
        }

        $subtotales = array_fill_keys(self::REGIONES, 0.0);
        $puntajes   = [];

        foreach ($detalles as $d) {
            $idRasgo = (int) $d['idRasgo'];
            if (!isset($catalogo[$idRasgo])) {
                continue;
            }
            $region = $catalogo[$idRasgo]['region'];
            $cal    = (int) $d['calificacion'];
            $factor = self::FACTOR[$cal] ?? 0.0;
            $n      = max(1, $rasgosPorRegion[$region] ?? 1);

            $aporte = round(($catalogo[$idRasgo]['ptsRegion'] / $n) * $factor, 2);
            $puntajes[$idRasgo] = $aporte;
            $subtotales[$region] += $aporte;
        }

        foreach ($subtotales as $r => $v) {
            $subtotales[$r] = round($v, 2);
        }

        $puntFinal = round(array_sum($subtotales), 2);

        return [
            'subtotales' => $subtotales,
            'puntajes'   => $puntajes,
            'puntFinal'  => $puntFinal,
            'categoria'  => $this->categoria($puntFinal),
        ];
    }

    /**
     * Categoría según la calificación final (Cedeño et al. 2024).
     * <60 POBRE | 60-69 REGULAR | 70-79 ACEPTABLE | 80-84 BUENO |
     * 85-89 MUY_BUENO | >=90 EXCELENTE
     */
    public function categoria(float $puntFinal): string
    {
        if ($puntFinal >= 90) return 'EXCELENTE';
        if ($puntFinal >= 85) return 'MUY_BUENO';
        if ($puntFinal >= 80) return 'BUENO';
        if ($puntFinal >= 70) return 'ACEPTABLE';
        if ($puntFinal >= 60) return 'REGULAR';
        return 'POBRE';
    }
}
