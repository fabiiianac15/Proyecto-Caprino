# Capa de IA generativa: Módulo de Genealogía

Complemento de IA generativa local que **interpreta** los resultados del modelo de
Machine Learning y redacta un análisis profesional en lenguaje natural.

> La IA **no** calcula ni predice. El score, la clasificación y las probabilidades
> los produce el `RandomForest` (`modelo.py`). La IA solo reescribe esos hechos.

## Arquitectura (v3: genética cuantitativa + modelo de la granja + IA)

```
BD Oracle ──(RebanoService: 7 consultas agregadas)──► instantánea del rebaño
                                                            │
Frontend → Symfony /api/genealogia/* ──► ml-service /ml/cruce | /ml/ranking | /ml/entrenar
                                             │
          rebano.py     → índice del rebaño y consultas "a una fecha"
          genetica.py   → parentesco exacto, ancestros comunes (Wright), BLUP
          modelo.py     → probabilidad de parto (bosque aleatorio calibrado con la granja)
          evaluador.py  → 9 dimensiones, predicciones, alertas, árbol de la cría
          ia_generativa → narrativa en streaming (Ollama), validada contra el informe
```

El backend ya no hace ~20 consultas por pareja: arma una sola **instantánea** del
rebaño (animales con pedigrí, producción por lactancia sumando los ordeños de cada
día, servicios, salud, condición corporal, FAMACHA y clasificación lineal) y el
microservicio la guarda en caché por su huella. Con 1.358 animales simulados, una
evaluación tarda ~0,25 s y el ranking de 759 candidatos ~0,5 s.

## Qué se calcula y con qué precisión

| Cálculo | Método | Precisión |
|---|---|---|
| Consanguinidad de la cría | Método tabular recursivo sobre **todo** el pedigrí | Exacta (verificada: medios hermanos 12,5 %, primos 6,25 %…) |
| Ancestros comunes y su aporte | Fórmula de Wright por caminos | Suman exactamente la F |
| Valor genético de leche, grasa y proteína | **BLUP**, modelo animal de repetibilidad con A⁻¹ (Henderson), clase de parto como efecto fijo | Confiabilidad exacta (PEV por factorización LU); sube con los registros propios, de hijas y de padres |
| Leche esperada de una hija | Media de los EBV de los padres − depresión endogámica, con intervalo del 80 % | Intervalo honesto (incluye muestreo mendeliano) |
| Probabilidad de parto exitoso | Bosque aleatorio: conocimiento previo + servicios reales con peso creciente; recalibrado a la tasa de la granja y con red de seguridad λ | Validada con validación cruzada solo sobre datos reales |
| Fertilidad, camada | Tasas con prior bayesiano (Beta) y repetibilidad | Con pocos datos se acercan a la media del rebaño |

**Sobre el "100 %":** la consanguinidad y los valores genéticos se vuelven tan
precisos como el pedigrí y los registros lo permitan. La probabilidad de que UNA
monta termine en parto no puede acertarse al 100 %: aun conociendo la probabilidad
verdadera, el AUC máximo en datos simulados es ~0,72. El modelo informa su precisión
real (AUC, Brier y mejora frente al promedio de la granja) en vez de inventarla, y si
no supera al promedio, su confianza λ baja a 0 y predice el promedio.

## Modelo predictivo (`modelo.py`)

- 18 variables calculadas **a la fecha del servicio** (sin mirar el futuro): consanguinidad
  de la cría, edades, historial de la hembra y del macho, días desde el último parto,
  condición corporal, FAMACHA, salud de 12 meses, tipo de servicio, época del año.
- Peso de lo sintético: `max(0,05; 1 − n_reales/300)`.
- Reentrenar: botón «Reentrenar con los datos de la granja» (administrador,
  zootecnista o veterinario) → `POST /api/genealogia/modelo/entrenar`.
- Explicación por cruce con SHAP (los datos faltantes no se muestran como factores).

## Dimensiones del informe (`evaluador.py`)

Parto exitoso, consanguinidad, mérito genético lechero (percentil entre todos los
cruces posibles del rebaño activo), fertilidad y prolificidad, sanidad (incluye
FAMACHA y células somáticas), aptitud reproductiva actual (edad, posparto < 60 días,
preñada o servicio pendiente), conformación (clasificación lineal de la hembra y de
las hijas del macho), riesgo hereditario y afinidad de razas. El score global pondera
cada una por su importancia y por su confianza. Con consanguinidad ≥ 12,5 % el
veredicto nunca pasa de «Precaución»; con ≥ 25 % es «No recomendado».

## Endpoints

| Symfony | ml-service | Uso |
|---|---|---|
| `GET /api/genealogia/arbol/{id}` | (no aplica) | Árbol de 4 generaciones en una llamada |
| `POST /api/genealogia/compatibilidad` | `POST /ml/cruce` | Evaluación completa + árbol de la cría |
| `POST /api/genealogia/analisis-ia` | `POST /ml/cruce` + `/ml/analisis-ia` | Narrativa en streaming |
| `POST /api/genealogia/ranking` | `POST /ml/ranking` | Mejores parejas (filtros: raza, disponibles, F máx.) |
| `POST /api/genealogia/ranking/analisis-ia` | `/ml/ranking` + `/ml/analisis-ranking` | Resumen comparativo |
| `GET /api/genealogia/modelo` | `GET /ml/modelo` | Estado y métricas del modelo |
| `POST /api/genealogia/modelo/entrenar` | `POST /ml/entrenar` | Reentrenar con la granja |

## Frontend (`frontend-web/src/componentes/genealogia/`)

`ArbolHorizontal.jsx` (árbol genérico, líneas en ámbar hacia los ancestros comunes),
`VistaArbol.jsx` (árbol editable de 4 generaciones), `VistaCruce.jsx` (evaluación),
`VistaRanking.jsx` (podio, tabla y gráfico puntaje vs consanguinidad),
`PanelModelo.jsx` (precisión del modelo y reentrenar), `comun.jsx`.

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
- **Reporte PDF** del análisis para el ganadero.
- Reentrenamiento automático periódico cuando se acumulen partos nuevos.
