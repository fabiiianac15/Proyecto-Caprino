# Scripts de Instalacion para Linux

Scripts equivalentes a `00-SCRIPTS-INSTALACION` (Windows/PowerShell) pero para **Linux**.

Probados en Ubuntu 22.04+, Fedora 38+, Arch Linux y derivadas (Manjaro, EndeavourOS).

---

## Inicio rapido

```bash
# 1. Dar permisos de ejecucion a todos los scripts (una sola vez)
chmod +x 01-SCRIPTS-LINUX/*.sh

# 2. Ejecutar la instalacion completa
bash 01-SCRIPTS-LINUX/00-INSTALACION-COMPLETA.sh
```

---

## Scripts disponibles

| Script | Descripcion |
|--------|-------------|
| `00-INSTALACION-COMPLETA.sh` | **Script maestro** — ejecuta todos los pasos en orden |
| `00-INSTALAR-PHP.sh` | Instala PHP 8.2 (apt / dnf / pacman segun distro) |
| `00-INSTALAR-NODE.sh` | Instala Node.js 20 LTS via nvm |
| `01-VERIFICAR-REQUISITOS.sh` | Verifica que todos los componentes esten listos |
| `02-INSTALAR-INSTANT-CLIENT.sh` | Descarga Oracle Instant Client 21.x para Linux |
| `02-CONFIGURAR-ORACLE-ENV.sh` | Configura el wallet y la variable `TNS_ADMIN` |
| `02b-CREAR-USUARIO-ORACLE.sh` | Crea `caprino_user` y las tablas en Oracle ADB |
| `03-INSTALAR-OCI8.sh` | Compila e instala la extension OCI8 via PECL |
| `03b-INSTALAR-COMPOSER.sh` | Instala Composer |
| `04-INSTALAR-DEPENDENCIAS-BACKEND.sh` | `composer install` en `backend-symfony/` |
| `05-INSTALAR-DEPENDENCIAS-FRONTEND.sh` | `npm install` en `frontend-web/` |
| `09-CONFIGURAR-ENV.sh` | Genera `.env` y `frontend-web/.env.local` |
| `07-INICIAR-BACKEND.sh` | Inicia el servidor PHP en `localhost:8000` |
| `08-INICIAR-FRONTEND.sh` | Inicia Vite en `localhost:5173` |

---

## Diferencias clave respecto a los scripts de Windows

| Concepto | Windows | Linux |
|----------|---------|-------|
| Instant Client | `oci.dll` en `C:\oracle\instantclient_21_14` | `libclntsh.so` en `/opt/oracle/instantclient_21_14` |
| Variables de entorno | Registro del sistema (`Machine`) | `~/.bashrc` / `~/.bash_profile` |
| OCI8 | DLL descargada de windows.php.net | Compilada via `pecl install oci8` |
| Node.js | Instalador `.msi` | nvm (portable, sin sudo) |
| Composer | `composer.phar` en `C:\ProgramData\ComposerSetup` | `/usr/local/bin/composer` |
| Wallet | `C:\Caprino-Wallet` | `~/caprino-wallet` |

---

## Requisitos previos

- `curl`, `unzip`, `sudo` disponibles
- Acceso a internet para descargar paquetes
- Wallet de Oracle Autonomous DB descargado y extraido en `~/caprino-wallet`
