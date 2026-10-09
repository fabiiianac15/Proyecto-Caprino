<?php

namespace App\Service;

use Doctrine\DBAL\Connection;

/**
 * Instantánea del rebaño para el microservicio ML.
 *
 * Reúne TODO lo que necesita la evaluación genética y predictiva en 7 consultas
 * agregadas (independiente del número de animales): animales con su pedigrí,
 * producción por lactancia, servicios/partos, salud, condición corporal,
 * FAMACHA y clasificación lineal. Así el ranking escala a miles de animales.
 */
class RebanoService
{
    public function __construct(private Connection $connection) {}

    public function instantanea(?string $fechaReferencia = null): array
    {
        $c = $this->connection;

        // Todos los animales (también muertos/vendidos: son ancestros del pedigrí)
        $animales = array_map(fn ($r) => [
            'id'             => (int) $r['ID_ANIMAL'],
            'nombre'         => $r['NOMBRE'],
            'codigo'         => $r['CODIGO_IDENTIFICACION'],
            'sexo'           => $r['SEXO'],
            'fecha_nac'      => $r['FNAC'],
            'estado'         => $r['ESTADO'],
            'raza'           => $r['NOMBRE_RAZA'],
            'aptitud'        => $r['APTITUD'],
            'raza_leche_dia' => $r['LECHE_RAZA'] !== null ? (float) $r['LECHE_RAZA'] : null,
            'padre'          => $r['ID_PADRE'] !== null ? (int) $r['ID_PADRE'] : null,
            'madre'          => $r['ID_MADRE'] !== null ? (int) $r['ID_MADRE'] : null,
        ], $c->fetchAllAssociative(
            "SELECT a.id_animal, a.nombre, a.codigo_identificacion, a.sexo, a.estado,
                    TO_CHAR(a.fecha_nacimiento, 'YYYY-MM-DD') AS fnac,
                    r.nombre_raza, r.aptitud, r.produccion_leche_dia_promedio AS leche_raza,
                    g.id_padre, g.id_madre
               FROM ANIMAL a
               LEFT JOIN RAZA r ON a.id_raza = r.id_raza
               LEFT JOIN GENEALOGIA g ON g.id_animal = a.id_animal"
        ));

        // Producción por lactancia. Primero se suma cada día (los ordeños de
        // mañana y tarde son registros separados) y luego se promedia.
        $produccion = array_map(fn ($r) => [
            'id'        => (int) $r['ID_ANIMAL'],
            'lactancia' => (int) $r['LACT'] ?: null,
            'n'         => (int) $r['N'],
            'litros'    => $r['LITROS'] !== null ? round((float) $r['LITROS'], 3) : null,
            'grasa'     => $r['GRASA'] !== null ? round((float) $r['GRASA'], 3) : null,
            'proteina'  => $r['PROT'] !== null ? round((float) $r['PROT'], 3) : null,
            'cs'        => $r['CS'] !== null ? (int) round((float) $r['CS']) : null,
        ], $c->fetchAllAssociative(
            "SELECT id_animal, lact, COUNT(*) AS n, AVG(litros_dia) AS litros,
                    AVG(grasa) AS grasa, AVG(prot) AS prot, AVG(cs) AS cs
               FROM (
                   SELECT id_animal, NVL(numero_lactancia, 0) AS lact, fecha_produccion,
                          SUM(litros) AS litros_dia, AVG(grasa_porcentaje) AS grasa,
                          AVG(proteina_porcentaje) AS prot, AVG(celulas_somaticas) AS cs
                     FROM PRODUCCION_LECHE
                    GROUP BY id_animal, NVL(numero_lactancia, 0), fecha_produccion
               )
              GROUP BY id_animal, lact"
        ));

        $servicios = array_map(fn ($r) => [
            'hembra'      => (int) $r['ID_HEMBRA'],
            'macho'       => $r['ID_MACHO'] !== null ? (int) $r['ID_MACHO'] : null,
            'fecha'       => $r['FSERV'],
            'tipo'        => $r['TIPO_SERVICIO'],
            'resultado'   => $r['RESULTADO'],
            'fecha_parto' => $r['FPARTO'],
            'crias'       => $r['NUMERO_CRIAS'] !== null ? (int) $r['NUMERO_CRIAS'] : null,
        ], $c->fetchAllAssociative(
            "SELECT id_hembra, id_macho, tipo_servicio, resultado, numero_crias,
                    TO_CHAR(fecha_servicio, 'YYYY-MM-DD') AS fserv,
                    TO_CHAR(fecha_parto_real, 'YYYY-MM-DD') AS fparto
               FROM REPRODUCCION"
        ));

        $salud = array_map(fn ($r) => [
            'id' => (int) $r['ID_ANIMAL'], 'fecha' => $r['F'],
            'tipo' => $r['TIPO_REGISTRO'], 'diag' => $r['ENFERMEDAD_DIAGNOSTICO'],
        ], $c->fetchAllAssociative(
            "SELECT id_animal, tipo_registro, enfermedad_diagnostico,
                    TO_CHAR(fecha_aplicacion, 'YYYY-MM-DD') AS f
               FROM SALUD
              WHERE fecha_aplicacion >= ADD_MONTHS(SYSDATE, -60)"
        ));

        $pesajes = array_map(fn ($r) => [
            'id' => (int) $r['ID_ANIMAL'], 'fecha' => $r['F'], 'cc' => (float) $r['CONDICION_CORPORAL'],
        ], $c->fetchAllAssociative(
            "SELECT id_animal, condicion_corporal, TO_CHAR(fecha_pesaje, 'YYYY-MM-DD') AS f
               FROM PESAJE
              WHERE condicion_corporal IS NOT NULL AND fecha_pesaje >= ADD_MONTHS(SYSDATE, -36)"
        ));

        $famacha = array_map(fn ($r) => [
            'id' => (int) $r['ID_ANIMAL'], 'fecha' => $r['F'], 'puntuacion' => (int) $r['PUNTUACION'],
        ], $c->fetchAllAssociative(
            "SELECT id_animal, puntuacion, TO_CHAR(fecha_evaluacion, 'YYYY-MM-DD') AS f
               FROM FAMACHA
              WHERE fecha_evaluacion >= ADD_MONTHS(SYSDATE, -36)"
        ));

        $lineal = array_map(fn ($r) => [
            'id' => (int) $r['ID_ANIMAL'], 'fecha' => $r['F'],
            'punt_final' => $r['PUNT_FINAL'] !== null ? (float) $r['PUNT_FINAL'] : null,
            'mamario'    => $r['PUNT_MAMARIO'] !== null ? (float) $r['PUNT_MAMARIO'] : null,
        ], $c->fetchAllAssociative(
            "SELECT id_animal, punt_final, punt_mamario, TO_CHAR(fecha_evaluacion, 'YYYY-MM-DD') AS f
               FROM EVALUACION_LINEAL"
        ));

        return [
            'fecha_referencia' => $fechaReferencia ?: date('Y-m-d'),
            'animales'   => $animales,
            'produccion' => $produccion,
            'servicios'  => $servicios,
            'salud'      => $salud,
            'pesajes'    => $pesajes,
            'famacha'    => $famacha,
            'lineal'     => $lineal,
        ];
    }

    /** Número de servicios con resultado conocido (para sugerir reentrenar). */
    public function serviciosCerrados(): int
    {
        return (int) $this->connection->fetchOne(
            "SELECT COUNT(*) FROM REPRODUCCION
              WHERE id_macho IS NOT NULL
                AND (resultado IN ('aborto', 'mortinato')
                     OR (resultado = 'exitoso' AND fecha_parto_real IS NOT NULL))"
        );
    }
}
