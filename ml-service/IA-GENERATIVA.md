# Capa de IA generativa — Módulo de Genealogía

Complemento de IA generativa local que **interpreta** los resultados del modelo de
Machine Learning y redacta un análisis profesional en lenguaje natural.

> La IA **no** calcula ni predice. El score, la clasificación y las probabilidades
> los produce el `RandomForest` (`modelo.py`). La IA solo reescribe esos hechos.

## Arquitectura (v2 — evaluación multidimensional fundamentada)

```
BD Oracle ──(Symfony recolecta datos reales)──► ml-service /ml/evaluar
   producción, salud, reproducción, pedigrí, raza, pesaje      │
                                                                ▼
                                         evaluador.py  +  RandomForest (parto exitoso)
                                                                │  informe con N dimensiones,
                                                                │  cada una con evidencia y confianza
                          ┌── Paso 2 (streaming) ───────────────┘
Frontend → Symfony /api/genealogia/analisis-ia → ml-service /ml/analisis-ia
          → ia_generativa.py → Ollama (qwen2.5:3b-instruct) → narrativa fundamentada
```

Principio rector: **cada dato que sale del sistema se fundamenta en registros reales
de las cabras**. Si faltan datos, baja la confianza de esa dimensión; nunca se inventa.

Flujo en **2 pasos** para no congelar la UI mientras el LLM genera en CPU:

1. **Paso 1** (`/ml/evaluar`, ~ms): el usuario ve el score global y las dimensiones
   con su evidencia al instante.
2. **Paso 2** (`/ml/analisis-ia`, streaming): la narrativa aparece token a token.

## Motor de evaluación multidimensional (`evaluador.py`)

Devuelve un informe con 8 dimensiones, cada una con `score` (favorabilidad 0-100),
`nivel`, `confianza` (según datos reales disponibles) y `evidencia` (los hechos en que
se basa). El **score global** es el promedio ponderado por confianza (las dimensiones
sin datos pesan poco). La **confianza global** mide la completitud real de los datos.

| Dimensión | Se fundamenta en |
|---|---|
| Compatibilidad genética | RAZA (aptitud), COI |
| Riesgo de consanguinidad | COI del pedigrí (GENEALOGIA) |
| Riesgo hereditario | COI + diagnósticos (SALUD) |
| Probabilidad de parto exitoso | RandomForest + tasa histórica (REPRODUCCION) |
| Calidad de leche esperada | PRODUCCION_LECHE de la madre + potencial de raza |
| Fertilidad esperada | REPRODUCCION (partos, prolificidad, servicios del macho) |
| Riesgo de enfermedades | SALUD (eventos 12m, diagnósticos, células somáticas) |
| Capacidad reproductiva | Edad fértil + condición corporal (PESAJE) |

Clasificación honesta: con **confianza baja** el veredicto es "Datos insuficientes"
(salvo señales de riesgo claras → "No recomendado").

## Componentes nuevos

| Archivo | Rol |
|---|---|
| `ml-service/ia_generativa.py` | Cliente Ollama, prompts (individual + ranking), validación anti-alucinación, fallback |
| `ml-service/modelo.py` | SHAP `TreeExplainer` (explicación por instancia) + `predict_batch` |
| `ml-service/evaluador.py` | Motor multidimensional fundamentado en datos reales |
| `ml-service/main.py` | `POST /ml/evaluar`, `POST /ml/evaluar-batch`, `POST /ml/analisis-ia`, `POST /ml/analisis-ranking`, `GET /ml/ia-health` |
| `backend-symfony/.../MlService.php` | `evaluar()`, `evaluarBatch()`, `analisisIaStream()`, `analisisRankingStream()` |
| `backend-symfony/.../GenealogiaController.php` | `recolectarDatosCruce()` (consulta PRODUCCION_LECHE/SALUD/REPRODUCCION/PESAJE/GENEALOGIA/RAZA) + endpoints compatibilidad, analisis-ia, ranking |
| `frontend-web/.../api.js` | `apiHelpers.postStream()` |
| `frontend-web/.../ModuloGenealogia.jsx` | Panel `AnalisisIA` + `VistaRanking` (streaming en vivo) |
| `docker-compose.ia.yml` | ml-service + Ollama |

## Explicabilidad por instancia (SHAP)

`modelo.py` usa `shap.TreeExplainer` para calcular, **por cada cruce**, cuánto empujó
cada variable el score (campo `puntos`, con signo, en puntos de score). Sustituye a la
importancia *global* del RandomForest, que era idéntica para todos los cruces. La IA
usa esas magnitudes en su narrativa ("el parentesco bajó el score ~5 puntos").

## Ranking de candidatos

`POST /api/genealogia/ranking` con `{idAnimal, limite, soloMismaRaza}`: evalúa todos
los animales activos del sexo opuesto (inferencia ML en **lote** vía
`/ml/compatibilidad-batch`, sin SHAP por velocidad), los ordena por score y devuelve el
top. `POST /api/genealogia/ranking/analisis-ia` reconstruye el ranking server-side y
devuelve un **resumen comparativo** de la IA en streaming.

## Puesta en marcha (local, Arch Linux)

```bash
# 1. Ollama + modelo
curl -fsSL https://ollama.com/install.sh | sh
ollama pull qwen2.5:3b-instruct
ollama serve            # http://localhost:11434

# 2. Microservicio ML (instala httpx nuevo)
cd ml-service
bash start.sh           # o: venv/bin/uvicorn main:app --port 8001

# 3. Verificar
curl http://localhost:8001/ml/ia-health
```

## Variables de entorno (ml-service)

| Variable | Defecto | Descripción |
|---|---|---|
| `OLLAMA_URL` | `http://localhost:11434` | Endpoint de Ollama |
| `OLLAMA_MODEL` | `qwen2.5:3b-instruct` | Modelo a usar |
| `OLLAMA_TIMEOUT` | `120` | Segundos máx. por generación |

## Diseño anti-alucinación

1. **Números pre-calculados** en el prompt: el LLM solo parafrasea, nunca calcula.
2. **System prompt restrictivo**: "usa EXCLUSIVAMENTE el bloque DATOS".
3. **`num_predict` acotado** (700 tokens) para no divagar.
4. **Validación posterior** (`validar_sin_invencion`): toda cifra del texto debe
   pertenecer al conjunto de valores permitidos (score, prob, confianza, factores,
   COI, edades). Si aparece una cifra "fantasma" se añade una nota de advertencia.
5. **Fallback determinista**: si Ollama no responde, se devuelve el `mensaje`
   plantilla del modelo. El sistema nunca se queda sin respuesta.
6. **Temperatura 0.55 + seed aleatorio**: redacción variada y natural, contenido fijo.

## Despliegue en VPS (DigitalOcean)

- Droplet **8 GB RAM** mínimo (el modelo 3B Q4 ocupa ~2.3 GB + FastAPI).
- `docker compose -f docker-compose.ia.yml up -d` y `ollama pull` dentro del contenedor.
- Si se sirve tras Nginx, mantener `proxy_buffering off;` para el endpoint de
  streaming (la cabecera `X-Accel-Buffering: no` ya se envía).
- `OLLAMA_NUM_PARALLEL=1` y un semáforo de concurrencia evitan saturar la RAM.

## Próximas mejoras sugeridas

- **Caché de narrativas** por hash del `ml_result` (evita regenerar lo mismo).
- **Registro recomendación → resultado real** para realimentar `/ml/train`.
- **Reporte PDF** del análisis para el ganadero.
- **EBV / valores productivos** (leche, prolificidad) como features y traits comentables.
