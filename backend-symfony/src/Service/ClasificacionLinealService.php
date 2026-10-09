<?php

namespace App\Service;

/**
 * Motor de cálculo de la clasificación lineal fenotípica (método ADGA,
 * Cedeño et al. 2024). Cuatro regiones con puntos máximos fijos:
 *   APARIENCIA 25, ESTRUCTURA 15, MAMARIO 40, PATAS 20 (total 100).
 *
 * Cada rasgo se califica 1 (bajo), 2 (intermedio) o 3 (alto). Cada rasgo
 * aporta sus puntos máximos (ptsRasgo; si no tiene, la región se reparte por
 * igual) escalados por un factor según la calificación. Los factores son el
 * tope de cada rango de la escala 1-50 del artículo: bajo 5, intermedio 25,
 * alto 50.
 */
class ClasificacionLinealService
{
    // Factor de aporte por calificación (1=bajo, 2=intermedio, 3=alto).
    public const FACTOR = [1 => 0.10, 2 => 0.50, 3 => 1.00];

    public const REGIONES = ['APARIENCIA', 'ESTRUCTURA', 'MAMARIO', 'PATAS'];

    /**
     * @param array<int,array{idRasgo:int,calificacion:int}> $detalles
     * @param array<int,array{region:string,ptsRegion:float,ptsRasgo?:float|null}> $catalogo  indexado por idRasgo
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

            $maximo = $catalogo[$idRasgo]['ptsRasgo'] ?? ($catalogo[$idRasgo]['ptsRegion'] / $n);
            // Se suma sin redondear (40/7 por rasgo) y se redondea solo el subtotal,
            // para que una cabra con todo en 3 sume exactamente 100.
            $aporte = $maximo * $factor;
            $puntajes[$idRasgo] = round($aporte, 2);
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
