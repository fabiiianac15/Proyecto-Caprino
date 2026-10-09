<?php

namespace App\Service;

/**
 * Motor de cálculo de la metodología de bienestar animal (MEBA - ICA v3.0).
 *
 * Cada indicador puntúa 0, 20, 55 o 100. Se agrupan en tres tipos de medida
 * con peso fijo: Recursos 35 %, Animal 55 %, Gestión 10 %. El puntaje de cada
 * grupo es el promedio de sus indicadores aplicables; el total es la suma
 * ponderada (renormalizada si algún grupo no tiene indicadores aplicables).
 */
class BienestarService
{
    public const PESOS = [
        'RECURSOS' => 0.35,
        'ANIMAL'   => 0.55,
        'GESTION'  => 0.10,
    ];

    /**
     * @param array<int,array{tipoMedida:string,puntaje:int|null,aplica:bool,codigo?:string,nombre?:string}> $detalles
     *
     * @return array{
     *   puntRecursos: float|null,
     *   puntAnimal: float|null,
     *   puntGestion: float|null,
     *   puntTotal: float,
     *   clasificacion: string,
     *   pendientes: array<int,array{codigo:string,nombre:string,puntaje:int}>
     * }
     */
    public function calcular(array $detalles, bool $tieneRspp, bool $tieneAsi): array
    {
        $sumas  = ['RECURSOS' => 0.0, 'ANIMAL' => 0.0, 'GESTION' => 0.0];
        $conteo = ['RECURSOS' => 0,   'ANIMAL' => 0,   'GESTION' => 0];

        foreach ($detalles as $d) {
            // No aplica o sin calificar (borrador): no entra en el promedio
            if (empty($d['aplica']) || $d['puntaje'] === null) {
                continue;
            }
            $grupo = $d['tipoMedida'];
            if (!isset($sumas[$grupo])) {
                continue;
            }
            $sumas[$grupo]  += (float) $d['puntaje'];
            $conteo[$grupo] += 1;
        }

        $promedios = [];
        foreach ($sumas as $grupo => $suma) {
            $promedios[$grupo] = $conteo[$grupo] > 0
                ? round($suma / $conteo[$grupo], 2)
                : null;
        }

        // Total ponderado, renormalizado sobre los grupos que sí tienen datos.
        $acum = 0.0;
        $pesoUsado = 0.0;
        foreach (self::PESOS as $grupo => $peso) {
            if ($promedios[$grupo] !== null) {
                $acum      += $promedios[$grupo] * $peso;
                $pesoUsado += $peso;
            }
        }
        $total = $pesoUsado > 0 ? round($acum / $pesoUsado, 2) : 0.0;

        // Indicadores aplicables que aún no llegan a 100 (lo que falta para el máximo).
        $pendientes = [];
        foreach ($detalles as $d) {
            if (!empty($d['aplica']) && $d['puntaje'] !== null && (int) $d['puntaje'] < 100) {
                $pendientes[] = [
                    'codigo'  => $d['codigo'] ?? '',
                    'nombre'  => $d['nombre'] ?? ($d['codigo'] ?? ''),
                    'puntaje' => (int) $d['puntaje'],
                ];
            }
        }

        return [
            'puntRecursos'  => $promedios['RECURSOS'],
            'puntAnimal'    => $promedios['ANIMAL'],
            'puntGestion'   => $promedios['GESTION'],
            'puntTotal'     => $total,
            'clasificacion' => $this->clasificar($total, $tieneRspp, $tieneAsi),
            'pendientes'    => $pendientes,
        ];
    }

    /**
     * Clasificación final del predio (Tabla 3 del MEBA).
     * EXCELENTE exige además RSPP + ASI; sin ellos el tope es ALTO.
     */
    public function clasificar(float $total, bool $tieneRspp, bool $tieneAsi): string
    {
        if ($total >= 90 && $tieneRspp && $tieneAsi) {
            return 'EXCELENTE';
        }
        if ($total >= 75) {
            return 'ALTO';
        }
        if ($total >= 50) {
            return 'MEDIO';
        }
        return 'BAJO';
    }
}
