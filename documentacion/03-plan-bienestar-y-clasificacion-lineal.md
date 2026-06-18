# Plan de implementación: Bienestar Animal (MEBA) y Clasificación Lineal Fenotípica

> Fuentes: `Realizar-Temporal/MEBA-ovinos-y-caprinos.pdf` (ICA v3.0, 2026) y
> `Realizar-Temporal/Clasificacionlinealfenotipica.pdf` (Cedeño et al., 2024 – método ADGA).
> Decisiones tomadas: (1) fotos como **evidencia** + score manual; (2) Bienestar **reutiliza**
> FAMACHA/Salud/Peso/Corrales; (3) este documento es el plan a revisar antes de codificar.

Ambos módulos son una **capa de agregación** que cuelga del Expediente del Animal. No
duplican datos: leen de los módulos existentes y solo agregan lo que falta. Siguen los
patrones ya usados (controladores DBAL con SQL Oracle, JSON camelCase, `AuditoriaService`,
esquemas con `IDENTITY`/`CHECK`/FK a `ANIMAL`, componentes en `frontend-web/src/componentes`).

---

## MÓDULO A — Bienestar Animal (MEBA)

### Regla de cálculo (replicar exactamente el PDF)
- Cada indicador puntúa **0, 20, 55 o 100**.
- 3 grupos con peso fijo: **Recursos 35 %**, **Animal 55 %**, **Gestión 10 %**.
- Puntaje grupo = promedio de sus indicadores **aplicables** → × peso → suma de los 3 = 0-100.
- Clasificación: **EXCELENTE** ≥90 % **+ RSPP + ASI**; **ALTO** ≥75 % y <90 %;
  **MEDIO** ≥50 % y <75 %; **BAJO** <50 %. (Sin RSPP+ASI, tope = Alto.)
- Solo caprino → excluir **Descole** y **Suciedad tren posterior**; **Topizado/descorne** sí.
- Indicadores solo de semi-intensivo/intensivo (espacio confinamiento, iluminación,
  ventilación, enriquecimiento, cama) → si el sistema no aplica, **se excluyen** del promedio.
- Tamaño de muestra según Tabla 1 (10/20/35/45/4 %).

### Modelo de datos (esquema `09-bienestar.sql`)

**1. `BIENESTAR_INDICADOR_CAT`** — catálogo de los 36 indicadores caprinos (semilla fija).
```
id_indicador      NUMBER PK (IDENTITY)
codigo            VARCHAR2(40)  -- 'AGUA_ACCESO', 'FAMACHA', 'PLAN_SANITARIO'...
nombre            VARCHAR2(200)
tipo_medida       VARCHAR2(10) CHECK IN ('RECURSOS','ANIMAL','GESTION')
es_documental     NUMBER(1) DEFAULT 0
solo_confinamiento NUMBER(1) DEFAULT 0   -- aplica solo semi-intensivo/intensivo
fuente_modulo     VARCHAR2(20)  -- NULL | 'FAMACHA' | 'SALUD' | 'PESO' | 'CORRAL'
es_binario        NUMBER(1) DEFAULT 0    -- intervenciones quirúrgicas / sacrificio (0 ó 100)
orden             NUMBER
```

**2. `EVALUACION_BIENESTAR`** — cabecera por visita/predio (nivel **hato**, no por animal individual).
```
id_evaluacion     NUMBER PK (IDENTITY)
especie           VARCHAR2(20) DEFAULT 'CAPRINO'  -- por ahora solo cabras; extensible a futuro
fecha_evaluacion  DATE
tipo_productor    VARCHAR2(15) CHECK IN ('FAMILIAR','EXTENSIVO','SEMI_INTENSIVO','INTENSIVO')
sistema_productivo VARCHAR2(30)
num_animales      NUMBER
tamano_muestra    NUMBER
tiene_rspp        NUMBER(1) DEFAULT 0
tiene_asi         NUMBER(1) DEFAULT 0
punt_recursos     NUMBER(5,2)
punt_animal       NUMBER(5,2)
punt_gestion      NUMBER(5,2)
punt_total        NUMBER(5,2)
clasificacion     VARCHAR2(10)  -- EXCELENTE/ALTO/MEDIO/BAJO
observaciones     CLOB
usuario_registro  NUMBER
fecha_registro    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**3. `EVAL_BIENESTAR_DETALLE`** — un renglón por indicador.
```
id_detalle        NUMBER PK (IDENTITY)
id_evaluacion     NUMBER FK -> EVALUACION_BIENESTAR
id_indicador      NUMBER FK -> BIENESTAR_INDICADOR_CAT
puntaje           NUMBER(3) CHECK IN (0,20,55,100)
aplica            NUMBER(1) DEFAULT 1
soporte_doc       VARCHAR2(300)  -- referencia al documento/registro
observacion       VARCHAR2(500)
```

### Backend (`BienestarController` + `BienestarService`)
- `GET  /api/bienestar` — lista de evaluaciones.
- `GET  /api/bienestar/{id}` — cabecera + detalle.
- `GET  /api/bienestar/catalogo` — los 36 indicadores (para armar el formulario).
- `GET  /api/bienestar/sugerencias?sistema=...` — **autollenado** desde otros módulos:
  - `FAMACHA` → % animales con calificación 1-2 → mapear a 0/20/55/100 (Tabla 24).
  - `SALUD` → lesiones/heridas (Tabla 27), mastitis (Tabla 28), ectoparásitos (Tabla 26).
  - `PESO`/ML → condición corporal 3-4 en escala 1-5 (Tabla 21).
  - `CORRAL` → sombra, espacio, piso/limpieza.
  El evaluador confirma o ajusta el score sugerido.
- `POST /api/bienestar` — crea evaluación; el **service calcula** punt_recursos/animal/gestion/
  total y clasificacion (con regla RSPP+ASI). Registra en `AuditoriaService`.
- `BienestarService::calcular()`: promedio por grupo sobre `aplica=1`, pesos 35/55/10,
  suma, clasifica. Devuelve también “qué falta para Excelente” (lista de indicadores <100).

### Frontend (`ModuloBienestar.jsx`)
- Wizard en 3 pestañas (Recursos / Animal / Gestión) generadas desde el catálogo.
- Cada indicador: selector 0/20/55/100 con la descripción de la tabla como ayuda; los
  documentales piden adjuntar/referenciar soporte; los con `fuente_modulo` vienen pre-llenados.
- Panel de resultado: barra por grupo, total, clasificación y **lista accionable
  “para llegar a 100 / Excelente falta…”** (incluye RSPP/ASI si faltan).
- Ruta en `App.jsx` + tarjeta en `Dashboard.jsx`.

### IA (reutiliza `ml-service/ia_generativa.py`)
- Endpoint que recibe el resultado y genera, en streaming, la interpretación y el plan de
  mejora (igual que ya hace genealogía). No requiere modelo nuevo.

---

## MÓDULO B — Clasificación Lineal Fenotípica

### Estructura (100 puntos, método ADGA)
| Región | Pts | Rasgos |
|---|---|---|
| Apariencia general y capacidad | 25 | estatura, ancho pecho, profundidad, ancho grupa, ángulo grupa |
| Estructura y fortaleza lechera | 15 | angulosidad, calidad de hueso |
| Sistema mamario | 40 | inserción ant/post, altura, ligamento susp., anchura, profundidad ubre, colocación y diámetro pezones |
| Patas y pezuñas | 20 | patas vista posterior, patas vista lateral, movilidad |

Cada rasgo se califica **1 (bajo) / 2 (intermedio) / 3 (alto)**. CFINAL → 6 categorías:
<59 pobre, 60-69 regular, 70-79 aceptable, 80-84 bueno, 85-89 muy bueno, 90-100 excelente.

### Modelo de datos (esquema `10-clasificacion-lineal.sql`)

**1. `CLASIF_RASGO_CAT`** — catálogo de rasgos (semilla).
```
id_rasgo    NUMBER PK (IDENTITY)
codigo      VARCHAR2(20)   -- ESTAT, ANCPEC, ANGUL, INAU, COLPE, PTVP...
nombre      VARCHAR2(120)
region      VARCHAR2(15) CHECK IN ('APARIENCIA','ESTRUCTURA','MAMARIO','PATAS')
pts_region  NUMBER         -- 25/15/40/20 (peso de la región)
orden       NUMBER
```

**2. `EVALUACION_LINEAL`** — cabecera por animal.
```
id_evaluacion   NUMBER PK (IDENTITY)
id_animal       NUMBER FK -> ANIMAL
fecha_evaluacion DATE
edad_meses      NUMBER
num_lactancia   NUMBER
punt_apariencia NUMBER(5,2)
punt_estructura NUMBER(5,2)
punt_mamario    NUMBER(5,2)
punt_patas      NUMBER(5,2)
punt_final      NUMBER(5,2)
categoria       VARCHAR2(15)  -- POBRE..EXCELENTE
observaciones   CLOB
usuario_registro NUMBER
fecha_registro  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**3. `EVAL_LINEAL_DETALLE`** — un renglón por rasgo.
```
id_detalle    NUMBER PK (IDENTITY)
id_evaluacion NUMBER FK -> EVALUACION_LINEAL
id_rasgo      NUMBER FK -> CLASIF_RASGO_CAT
calificacion  NUMBER(1) CHECK IN (1,2,3)
puntaje       NUMBER(5,2)   -- aporte del rasgo a su región
observacion   VARCHAR2(500)
```

**4. `EVAL_LINEAL_FOTO`** — evidencia fotográfica.
```
id_foto       NUMBER PK (IDENTITY)
id_evaluacion NUMBER FK -> EVALUACION_LINEAL
tipo_vista    VARCHAR2(20) CHECK IN ('FRONTAL','LATERAL','POSTERIOR','UBRE_POST','UBRE_LAT','PATAS')
ruta_archivo  VARCHAR2(300)
descripcion   VARCHAR2(200)
```
Las imágenes se guardan en disco (carpeta tipo `var/uploads/lineal/{id_animal}/...`),
la ruta en BD.

### Backend (`ClasificacionLinealController` + `ClasificacionLinealService`)
- `GET  /api/clasificacion-lineal?idAnimal=` — lista por animal.
- `GET  /api/clasificacion-lineal/catalogo` — rasgos por región.
- `POST /api/clasificacion-lineal` — crea evaluación; el service calcula subtotales por región
  (con su peso) y CFINAL, asigna categoría.
- `POST /api/clasificacion-lineal/{id}/foto` — sube foto (multipart) y guarda ruta.
- `GET  /api/clasificacion-lineal/{id}/fotos`.

### Frontend (`ModuloClasificacionLineal.jsx`)
- Formulario por región con selector 1/2/3 por rasgo (apoyado en la guía visual del PDF Fig.1).
- Subida/captura de fotos por tipo de vista (en móvil, cámara de Capacitor — ya disponible).
- Resultado: subtotales por región, CFINAL y categoría; histórico por animal en su expediente.

### Conexión con Genealogía/ML (fase 2, opcional)
- Endpoint `/ml/clasificacion-pca` que corra PCA sobre las evaluaciones para **rankear
  animales sobresalientes** y alimentar la selección/mejoramiento genético que ya existe.
- Encaja con la conclusión del paper: integrar info fenotípica + genealógica + (futuro) genómica.

---

## Orden de trabajo — estado (impl. 2026-06-10)
1. [x] Esquemas SQL `09-bienestar.sql` y `10-clasificacion-lineal.sql` (+ semillas). **Ejecutados en Oracle.**
2. [x] Backend Bienestar (`BienestarService` + `BienestarController`, 6 rutas + sugerencias).
3. [x] Frontend Bienestar (`ModuloBienestar.jsx`, cálculo en vivo + “qué falta para 100/Excelente”).
4. [x] Backend Clasificación Lineal (`ClasificacionLinealService` + `ClasificacionLinealController`, 7 rutas + fotos).
5. [x] Frontend Clasificación Lineal (`ModuloClasificacionLineal.jsx` + subida/visualización de fotos con token).
6. [ ] IA: interpretación de bienestar (reusar ia_generativa) y, opcional, PCA en ml-service. **Pendiente/opcional.**

## Decisiones confirmadas
- **Alcance Bienestar:** evaluación a nivel de **hato**, por ahora solo **caprino**
  (`especie = 'CAPRINO'`). El diseño ya queda preparado para expandir a otras especies a
  futuro sin cambiar el catálogo ni el cálculo (basta otra cabecera con otra `especie`).
- **Fotos:** disco local del backend + ruta en BD. La carpeta base será **configurable por
  variable de entorno** (`APP_UPLOADS_DIR`, ej. `var/uploads/lineal/...`) para que funcione
  igual en local y en servidor.

### Nota sobre el almacenamiento de fotos en servidor
Guardar en disco **sí funciona en servidor**, con dos cuidados:
1. La carpeta de subidas debe estar **fuera del código que se redespliega** (un directorio
   persistente del servidor) y ser **escribible** por el proceso PHP. Por eso se usa la env
   `APP_UPLOADS_DIR` en vez de una ruta fija dentro del proyecto.
2. Las imágenes se entregan vía un **endpoint del backend** (con JWT) o como estáticos
   servidos por el servidor web, no embebidas en BD.

Esto cubre el despliegue actual. Solo si en el futuro el backend corre en contenedores
efímeros/escalado horizontal habría que migrar a almacenamiento de objetos (S3/MinIO); el
diseño con ruta en BD facilita ese cambio sin tocar el modelo.
