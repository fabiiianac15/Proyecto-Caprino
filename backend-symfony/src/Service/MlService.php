<?php

namespace App\Service;

class MlService
{
    public function __construct(private string $mlServiceUrl) {}

    /**
     * Llama a POST /ml/compatibilidad en el microservicio Python.
     *
     * @param array<string,float|int> $features  Mapa feature_name => valor numérico
     * @return array{ok:bool, data:array|null, error:string|null}
     */
    public function evaluarCompatibilidad(array $features): array
    {
        $url  = rtrim($this->mlServiceUrl, '/') . '/ml/compatibilidad';
        $body = json_encode($features, JSON_THROW_ON_ERROR);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $body,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 8,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Accept: application/json'],
        ]);

        $raw  = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err  = curl_error($ch);
        curl_close($ch);

        if ($err || $raw === false) {
            return ['ok' => false, 'data' => null, 'error' => "No se pudo contactar el servicio ML: $err"];
        }

        $decoded = json_decode($raw, true);
        if ($code !== 200 || !is_array($decoded)) {
            $detail = is_array($decoded) ? ($decoded['detail'] ?? $raw) : $raw;
            return ['ok' => false, 'data' => null, 'error' => "Error del servicio ML ($code): $detail"];
        }

        return ['ok' => true, 'data' => $decoded, 'error' => null];
    }

    /**
     * Verifica que el microservicio ML esté disponible.
     */
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
}
