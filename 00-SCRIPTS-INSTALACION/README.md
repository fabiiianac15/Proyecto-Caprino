# Scripts de Instalación: Proyecto Caprino

Guía de instalación para conectar el sistema a **Oracle Autonomous Database** (nube).

---

## Prerequisitos manuales (antes de ejecutar cualquier script)

1. **Oracle Autonomous DB creado** en Oracle Cloud Console
2. **Wallet descargado**: ADB → DB Connection → Download Wallet → extraer en `C:\Caprino-Wallet`
3. **Password del usuario ADMIN** del ADB (la configuraste al crear la instancia)

---

## Opción A: Instalación automática (recomendada)

Ejecuta el script maestro; él corre todos los pasos en orden:

```
powershell -ExecutionPolicy Bypass -File "00-INSTALACION-COMPLETA.ps1"
```

---

## Opción B: Instalación paso a paso

| Script | Qué hace | Admin |
|--------|----------|-------|
| `00b-INSTALAR-VCRUNTIME.ps1` | Instala Visual C++ Runtime (prerequisito PHP) | No |
| `00-INSTALAR-PHP-COMPATIBLE.ps1` | Instala PHP 8.2 | No |
| `00c-INSTALAR-NODE.ps1` | Instala Node.js LTS | No |
| `02-INSTALAR-INSTANT-CLIENT.ps1` | Instala Oracle Instant Client 21.x | No |
| `02-CONFIGURAR-ORACLE-ENV.ps1` | Configura wallet + TNS_ADMIN | **Si** |
| `02b-CREAR-USUARIO-ORACLE.ps1` | Crea usuario y tablas en el ADB | No |
| `03-INSTALAR-OCI8.ps1` | Instala extension OCI8 para PHP | No |
| `03b-INSTALAR-COMPOSER.ps1` | Instala Composer | No |
| `04-INSTALAR-DEPENDENCIAS-BACKEND.ps1` | `composer install` | No |
| `05-INSTALAR-DEPENDENCIAS-FRONTEND.ps1` | `npm install` | No |
| `09-CONFIGURAR-ENV.ps1` | Genera secrets y configura `.env` | No |
| `01-VERIFICAR-REQUISITOS.ps1` | Comprobacion final de todo | No |

---

## Iniciar el sistema (cada vez que quieras usarlo)

```
# Terminal 1
07-INICIAR-BACKEND.bat      -> http://localhost:8000

# Terminal 2
08-INICIAR-FRONTEND.bat     -> http://localhost:5173
```

---

## Arquitectura de conexion

```
Frontend (React/Vite :5173)
    | HTTP
Backend (Symfony/PHP :8000)
    | OCI8 + Instant Client + Wallet
Oracle Autonomous Database (nube)
```

---

## Solucion de problemas frecuentes

**"OCI8 no cargado"**
- Abre una nueva terminal (para que el PATH con Instant Client este activo)
- Ejecuta: `php -m | findstr oci8`
- Si sigue fallando: corre `03-INSTALAR-OCI8.ps1`

**"TNS: sin nombre de servicio encontrado"**
- Verifica que TNS_ADMIN apunte a la carpeta del wallet: `echo %TNS_ADMIN%`
- Verifica que `C:\Caprino-Wallet\tnsnames.ora` existe
- Corre `02-CONFIGURAR-ORACLE-ENV.ps1` de nuevo como Administrador

**"ORA-12541: TNS sin listener"**
- El alias TNS no es correcto: abre `C:\Caprino-Wallet\tnsnames.ora` y verifica los nombres
- Actualiza `DATABASE_TNS_NAME` en `backend-symfony\.env`

**"ORA-01017: usuario/contrasena no validos"**
- Verifica `DATABASE_USER` y `DATABASE_PASSWORD` en `backend-symfony\.env`

---

## Capa de IA (módulo de Genealogía)

La evaluación de cruces necesita el microservicio ML (puerto 8001) y Ollama. Con Docker Desktop, desde la raíz del proyecto:

```
docker compose -f docker-compose.ia.yml up -d
docker compose -f docker-compose.ia.yml exec ollama ollama pull qwen2.5:3b-instruct
```

Sin Docker: instala Ollama desde ollama.com, ejecuta `ollama pull qwen2.5:3b-instruct` y luego:

```
cd ml-service
python -m venv venv
venv\Scripts\pip install -r requirements.txt
venv\Scripts\uvicorn main:app --host 127.0.0.1 --port 8001
```

El backend lo encuentra por `ML_SERVICE_URL` en `backend-symfony\.env.local`. El árbol genealógico funciona sin la IA; la evaluación de cruces y el ranking no.
