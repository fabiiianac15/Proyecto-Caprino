# Backend: API REST de GRANME

API en Symfony 6.4 LTS sobre Oracle Autonomous Database. Los controladores escriben SQL directo con Doctrine DBAL y parámetros enlazados; no se usa el ORM. Las entidades de `src/Entity/` quedaron del diseño inicial y ninguna ruta las usa.

## Requisitos

- PHP 8.1 o superior con `oci8`
- Composer 2
- Oracle Instant Client
- Wallet del Autonomous Database y la variable `TNS_ADMIN` apuntando a él

## Instalación

```bash
composer install
cp .env .env.local      # credenciales reales solo en .env.local
```

Variables que hay que revisar en `.env.local`:

| Variable | Uso |
|----------|-----|
| `DATABASE_TNS_NAME` | alias del `tnsnames.ora` (por ejemplo `dbcaprino_high`) |
| `DATABASE_USER`, `DATABASE_PASSWORD` | usuario de la aplicación (`caprino_user`) |
| `DATABASE_WALLET_PATH` | carpeta del wallet |
| `JWT_SECRET` | secreto HS256; el token dura 24 h (`token_ttl` en `config/packages/lexik_jwt_authentication.yaml`) |
| `ML_SERVICE_URL` | microservicio de genética e IA, por defecto `http://localhost:8001` |
| `APP_UPLOADS_DIR` | opcional; carpeta persistente para las fotos de bienestar y clasificación lineal. Si no se define se usa `var/uploads` |
| `CORS_ALLOW_ORIGIN` | expresión regular de orígenes permitidos |

## Ejecución

```bash
PHP_CLI_SERVER_WORKERS=4 TNS_ADMIN=~/Caprino-Wallet php -S localhost:8000 -t public
```

Sin `TNS_ADMIN` la conexión a Oracle se queda esperando. Con un solo proceso, el análisis en streaming de la IA (unos 3 minutos en CPU) bloquea las demás peticiones; por eso `PHP_CLI_SERVER_WORKERS`.

Para comprobar que responde: `curl http://localhost:8000/api/health`.

## Estructura

```
src/
├── Controller/        un controlador por módulo (Animal, Genealogia, Reproduccion, Bienestar…)
├── Service/
│   ├── RebanoService.php               instantánea del rebaño para el microservicio ML (7 consultas)
│   ├── MlService.php                   cliente HTTP del microservicio (JSON y streaming)
│   ├── BienestarService.php            cálculo MEBA: 35 % recursos, 55 % animal, 10 % gestión
│   ├── ClasificacionLinealService.php  puntaje ADGA por rasgo y categoría final
│   ├── AuditoriaService.php            registro de acciones
│   └── NotificacionService.php
├── Doctrine/          middleware que conecta por alias TNS
└── EventListener/     respuesta del login con los datos del usuario
```

## Rutas

Todas exigen `Authorization: Bearer <token>` salvo `POST /api/auth/login`, `POST /api/auth/register` y `GET /api/health`. La lista completa sale con:

```bash
php bin/console debug:router | grep /api
```

Las rutas de genealogía que dependen del microservicio:

| Ruta | Qué hace |
|------|----------|
| `GET /api/genealogia/arbol/{id}?generaciones=3` | árbol completo en una sola respuesta |
| `POST /api/genealogia/compatibilidad` | evaluación del cruce `{idMacho, idHembra}` |
| `POST /api/genealogia/analisis-ia` | narrativa de la IA, texto en streaming |
| `POST /api/genealogia/ranking` | mejores parejas `{idAnimal, limite, soloMismaRaza, soloDisponibles, maxConsanguinidad}` |
| `POST /api/genealogia/ranking/analisis-ia` | resumen comparativo en streaming |
| `GET /api/genealogia/modelo` | métricas del modelo y partos que aún no conoce |
| `POST /api/genealogia/modelo/entrenar` | reentrena con los partos de la granja (administrador, zootecnista o veterinario) |

## Fotos

- Animales: `public/uploads/animales/`, servidas como archivos estáticos.
- Bienestar y clasificación lineal: `var/uploads/` o `APP_UPLOADS_DIR`. Se entregan por la API con JWT, nunca como estáticos.

La carpeta tiene que existir y PHP debe poder escribir en ella.
