# Servidor de AWS (producción)

| Dato | Valor |
|---|---|
| IP elástica (fija) | `3.95.12.233` |
| Instancia | `c7i-flex.large` (2 vCPU, 3,7 GB RAM), Ubuntu 24.04, us-east-1 |
| SSH | `ssh -i caprino-aws.pem ubuntu@3.95.12.233` |
| Web | `/var/www/frontend` (build de `frontend-web`) |
| API | `/var/www/caprino/backend-symfony` (PHP 8.2-FPM + nginx) |
| Fotos de evidencia | `/var/www/caprino-datos/uploads` (fuera del código) |
| Servicio ML | systemd `caprino-ml`, `127.0.0.1:8001` |
| IA generativa | systemd `ollama`, `127.0.0.1:11434`, modelo `qwen2.5:1.5b-instruct` |
| Base de datos | Oracle Autonomous (wallet en `/Caprino-Wallet`) |

## Scripts

Se ejecutan desde este equipo. La llave se busca en `~/Descargas/Claves/caprino-aws.pem`
(se cambia con `CAPRIVA_LLAVE=...`; el servidor con `CAPRIVA_SERVIDOR=...`).

- `desplegar-backend.sh`: sube `backend-symfony/src`, limpia la caché y recarga PHP (con respaldo previo).
- `desplegar-web.sh`: compila `frontend-web` y lo publica.
- `desplegar-ml.sh`: sube el servicio de ML y lo reinicia.
- `ejecutar-sql.sh archivo.sql`: corre un parche de `base-de-datos/esquemas` con sqlplus en UTF-8.

## Configuración del servidor (`config/`)

Copias de lo que está instalado, para reconstruir el servidor si hace falta:

- `nginx-caprino.conf` → `/etc/nginx/sites-available/caprino` (subidas de 12 MB, gzip, caché de `/assets`).
- `php-99-caprino.ini` → `/etc/php/8.2/fpm/conf.d/` (fotos de hasta 10 MB).
- `php-fpm-pool-env.conf` → línea `env[TNS_ADMIN]` del pool de PHP-FPM.
- `caprino-ml.service` → `/etc/systemd/system/`.
- `caprino-ml.service.d-ollama.conf` → `/etc/systemd/system/caprino-ml.service.d/ollama.conf`.
- `ollama.service.d-capriva.conf` → `/etc/systemd/system/ollama.service.d/capriva.conf`.

Ollama se instaló con el instalador oficial (`curl -fsSL https://ollama.com/install.sh | sh`) y el modelo con
`ollama pull qwen2.5:1.5b-instruct`. En CPU un análisis de genealogía tarda de 2 a 3,5 minutos y se ve
mientras se escribe; por eso `MlService.php` espera hasta 420 s.

## Costos

La instancia consume créditos de AWS (≈ 62 USD/mes encendida). Si no se usa, se puede detener desde la
consola: la IP elástica se conserva y todo arranca solo al encenderla.
