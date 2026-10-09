<?php

namespace App\Service;

/**
 * Cliente del microservicio ML (FastAPI). Todas las evaluaciones reciben la
 * instantánea completa del rebaño (ver RebanoService) y el microservicio
 * calcula consanguinidad exacta, BLUP, el modelo predictivo y el ranking.
 */
class MlService
{
    public function __construct(private string $mlServiceUrl) {}

    /** POST /ml/cruce — evaluación completa de un cruce. */
    public function cruce(array $rebano, int $idMacho, int $idHembra): array
    {
        return $this->postJson('/ml/cruce', [
            'rebano' => $rebano, 'macho' => $idMacho, 'hembra' => $idHembra,
        ], 60);
    }

    /** POST /ml/ranking — mejores parejas para un animal. */
    public function ranking(array $rebano, int $idAnimal, array $opciones): array
    {
        return $this->postJson('/ml/ranking', [
            'rebano'             => $rebano,
            'animal'             => $idAnimal,
            'limite'             => (int) ($opciones['limite'] ?? 10),
            'solo_misma_raza'    => (bool) ($opciones['soloMismaRaza'] ?? false),
            'max_consanguinidad' => isset($opciones['maxConsanguinidad']) ? (float) $opciones['maxConsanguinidad'] : null,
            'solo_disponibles'   => (bool) ($opciones['soloDisponibles'] ?? false),
        ], 120);
    }

    /** GET /ml/modelo — estado y métricas del modelo predictivo. */
    public function modelo(): array
    {
        $url = rtrim($this->mlServiceUrl, '/') . '/ml/modelo';
        $ch  = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 5]);
        $raw  = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err  = curl_error($ch);
        curl_close($ch);
        if ($err || $raw === false || $code !== 200) {
            return ['ok' => false, 'data' => null, 'error' => 'Servicio ML no disponible' . ($err ? ": $err" : '')];
        }
        return ['ok' => true, 'data' => json_decode($raw, true), 'error' => null];
    }

    /** POST /ml/entrenar — reentrena con el historial real de la granja. */
    public function entrenar(array $rebano): array
    {
        return $this->postJson('/ml/entrenar', ['rebano' => $rebano], 300);
    }

    /**
     * POST /ml/analisis-ia — narrativa de la IA en streaming.
     *
     * @param callable(string):void $onChunk
     */
    public function analisisIaStream(array $evaluacion, array $animales, callable $onChunk): bool
    {
        return $this->stream('/ml/analisis-ia', ['evaluacion' => $evaluacion, 'animales' => $animales], $onChunk);
    }

    /**
     * POST /ml/analisis-ranking — resumen comparativo del ranking en streaming.
     *
     * @param callable(string):void $onChunk
     */
    public function analisisRankingStream(array $payload, callable $onChunk): bool
    {
        return $this->stream('/ml/analisis-ranking', $payload, $onChunk);
    }

    /** Verifica que el microservicio ML esté disponible. */
    public function health(): array
    {
        $url = rtrim($this->mlServiceUrl, '/') . '/ml/health';
        $ch  = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 3,
        ]);
        $raw  = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code !== 200) {
            return ['status' => 'unavailable'];
        }
        return json_decode($raw, true) ?? ['status' => 'unknown'];
    }

    /** Helper genérico para POST JSON con respuesta JSON. */
    private function postJson(string $path, array $payload, int $timeout): array
    {
        $url  = rtrim($this->mlServiceUrl, '/') . $path;
        $body = json_encode($payload, JSON_THROW_ON_ERROR);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $body,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => $timeout,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Accept: application/json'],
        ]);
        $raw  = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err  = curl_error($ch);
        curl_close($ch);

        if ($err || $raw === false) {
            return ['ok' => false, 'code' => 503, 'data' => null, 'error' => "No se pudo contactar el servicio ML: $err"];
        }
        $decoded = json_decode($raw, true);
        if ($code !== 200 || !is_array($decoded)) {
            $detail = is_array($decoded) ? ($decoded['detail'] ?? $raw) : $raw;
            if (is_array($detail)) {
                $detail = json_encode($detail, JSON_UNESCAPED_UNICODE);
            }
            // Los 400/404 del servicio son errores de datos (p. ej. sexo incorrecto)
            return ['ok' => false, 'code' => in_array($code, [400, 404], true) ? $code : 503,
                    'data' => null, 'error' => (string) $detail];
        }
        return ['ok' => true, 'code' => 200, 'data' => $decoded, 'error' => null];
    }

    /** Helper genérico para reenviar una respuesta en streaming. */
    private function stream(string $path, array $payload, callable $onChunk): bool
    {
        $url  = rtrim($this->mlServiceUrl, '/') . $path;
        $body = json_encode($payload, JSON_THROW_ON_ERROR);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST          => true,
            CURLOPT_POSTFIELDS    => $body,
            CURLOPT_HTTPHEADER    => ['Content-Type: application/json', 'Accept: text/plain'],
            CURLOPT_TIMEOUT       => 180,   // generación en CPU puede ser lenta
            CURLOPT_WRITEFUNCTION => function ($ch, string $data) use ($onChunk): int {
                if ($data !== '') {
                    $onChunk($data);
                }
                return strlen($data);
            },
        ]);
        $ok  = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);

        return $ok !== false && $err === '';
    }
}
