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
     * Llama a POST /ml/evaluar — motor de evaluación multidimensional.
     *
     * @param array $datos     Registros crudos del cruce (producción, salud, etc.)
     * @param array|null $features  Las 15 features para el RandomForest (o null)
     * @return array{ok:bool, data:array|null, error:string|null}
     */
    public function evaluar(array $datos, ?array $features): array
    {
        return $this->postJson('/ml/evaluar', [
            'datos'       => $datos,
            'ml_features' => $features !== null ? array_values($features) : null,
        ], 15);
    }

    /**
     * Llama a POST /ml/evaluar-batch para el ranking (un resumen por item).
     *
     * @param array<int,array{datos:array,ml_features:array}> $items
     * @return array{ok:bool, data:array|null, error:string|null}
     */
    public function evaluarBatch(array $items): array
    {
        return $this->postJson('/ml/evaluar-batch', ['items' => array_values($items)], 30);
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
     * Llama a POST /ml/compatibilidad-batch para el ranking de candidatos.
     *
     * @param array<int,array<string,float|int>> $items  Lista de mapas de features
     * @return array{ok:bool, data:array|null, error:string|null}
     */
    public function evaluarCompatibilidadBatch(array $items): array
    {
        $url  = rtrim($this->mlServiceUrl, '/') . '/ml/compatibilidad-batch';
        $body = json_encode(['items' => array_values($items)], JSON_THROW_ON_ERROR);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $body,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 20,
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
            return ['ok' => false, 'data' => null, 'error' => "Error del servicio ML ($code)"];
        }
        return ['ok' => true, 'data' => $decoded, 'error' => null];
    }

    /**
     * Stream del análisis comparativo del ranking (POST /ml/analisis-ranking).
     *
     * @param callable(string):void $onChunk
     */
    public function analisisRankingStream(array $payload, callable $onChunk): bool
    {
        $url  = rtrim($this->mlServiceUrl, '/') . '/ml/analisis-ranking';
        $body = json_encode($payload, JSON_THROW_ON_ERROR);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST          => true,
            CURLOPT_POSTFIELDS    => $body,
            CURLOPT_HTTPHEADER    => ['Content-Type: application/json', 'Accept: text/plain'],
            CURLOPT_TIMEOUT       => 180,
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

    /**
     * Llama a POST /ml/analisis-ia y reenvía el stream de la IA chunk a chunk.
     *
     * El microservicio devuelve texto plano (tokens del LLM) narrando el informe
     * de evaluación. Cada fragmento se entrega al callback `$onChunk`.
     *
     * @param array $evaluacion  Informe que devolvió POST /ml/evaluar
     * @param array $animales    {macho:{nombre,codigo}, hembra:{...}}
     * @param callable(string):void $onChunk
     * @return bool  true si la conexión con el servicio ML fue correcta
     */
    public function analisisIaStream(array $evaluacion, array $animales, callable $onChunk): bool
    {
        $url  = rtrim($this->mlServiceUrl, '/') . '/ml/analisis-ia';
        $body = json_encode(
            ['evaluacion' => $evaluacion, 'animales' => $animales],
            JSON_THROW_ON_ERROR
        );

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
