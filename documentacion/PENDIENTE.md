# Pendiente — Qué falta para que el sistema esté completo

**Fecha:** Abril 2026

Este documento lista todo lo que falta hacer, en orden de prioridad. Los items marcados con **[BLOQUEANTE]** impiden que el módulo funcione hasta que se resuelvan.

---

## 1. Base de datos — Scripts SQL faltantes [BLOQUEANTE]

### Problema
El archivo `base-de-datos/esquemas/01-tablas-principales.sql` tiene las tablas ANIMAL, RAZA, GENEALOGIA, PESAJE y PRODUCCION_LECHE, pero el script `02b-CREAR-USUARIO-ORACLE.ps1` solo ejecuta los archivos que existen. Faltan los scripts de **SALUD**, **REPRODUCCION** y **NOTIFICACION** como archivos separados.

### Verificación
Conectarse a Oracle y ejecutar:
```sql
SELECT TABLE_NAME FROM USER_TABLES ORDER BY TABLE_NAME;
```
Si falta alguna de estas tablas, hay que crearla:
- `SALUD` — eventos médicos, vacunas, tratamientos
- `REPRODUCCION` — montas y partos
- `NOTIFICACION` — alertas del sistema

### Solución
Los scripts SQL están documentados en `documentacion/Que_hacer.txt` (Partes 2.3). Crear los archivos faltantes en `base-de-datos/esquemas/` y agregarlos a `02b-CREAR-USUARIO-ORACLE.ps1`.

---

## 2. Mismatch de genealogía entre BD y API [BLOQUEANTE para el módulo Genealogía]

### Problema
La tabla `01-tablas-principales.sql` define la genealogía como una **tabla separada `GENEALOGIA`** con columnas `id_animal`, `id_padre`, `id_madre`. Sin embargo, los endpoints de genealogía en `api.php` hacen `UPDATE ANIMAL SET id_padre = ...` asumiendo que esas columnas están en la tabla `ANIMAL` (que no es el caso).

### Solución
Reescribir los endpoints `/api/genealogia/{id}` en `api.php` para que trabajen con la tabla `GENEALOGIA`:

```php
// GET: leer genealogía
SELECT g.*, p.nombre as nombre_padre, m.nombre as nombre_madre
FROM GENEALOGIA g
LEFT JOIN ANIMAL p ON g.id_padre = p.id_animal
LEFT JOIN ANIMAL m ON g.id_madre = m.id_animal
WHERE g.id_animal = :id

// POST/PUT: insertar o actualizar
MERGE INTO GENEALOGIA g
USING DUAL ON (g.id_animal = :id)
WHEN MATCHED THEN UPDATE SET id_padre = :padre, id_madre = :madre
WHEN NOT MATCHED THEN INSERT (id_animal, id_padre, id_madre) VALUES (:id, :padre, :madre)
```

---

## 3. Frontend — Verificar que los módulos llaman al API correcto

### Estado desconocido
Los componentes React existen (`ModuloProduccion.jsx`, `ModuloSalud.jsx`, etc.) pero no se ha verificado si:
- Llaman a las URLs correctas (`/api/produccion`, `/api/salud`, etc.)
- Manejan correctamente el token JWT en el header `Authorization: Bearer <token>`
- Muestran mensajes de error cuando el servidor falla

### Qué revisar en cada módulo
Abrir cada archivo en `frontend-web/src/componentes/` y confirmar que:
1. La URL de la petición coincide con el endpoint de `api.php`
2. El header `Authorization` se envía en peticiones autenticadas
3. Si la respuesta es un error, se muestra un mensaje al usuario (no solo en consola)

### Módulos a revisar (en este orden)
1. `ModuloProduccion.jsx` → `/api/produccion`
2. `ModuloSalud.jsx` → `/api/salud`
3. `ModuloReproduccion.jsx` → `/api/reproduccion`
4. `ModuloPeso.jsx` → `/api/pesaje`
5. `ModuloGenealogia.jsx` → `/api/genealogia/{id}`
6. `Notificaciones.jsx` → `/api/notificaciones`
7. `ModuloReportes.jsx` → `/api/reportes/resumen`

---

## 4. Frontend — Build de producción no generado

### Problema
El frontend React nunca se ha compilado (`npm run build`). Actualmente solo funciona en modo desarrollo con Vite en el puerto 5173. Para que funcione desde el backend PHP (un solo servidor, puerto 8000 o 80), hay que:

1. Compilar el frontend:
   ```bash
   cd frontend-web
   npm run build
   ```
2. Copiar el contenido de `frontend-web/dist/` a `backend-symfony/public/`:
   ```powershell
   Copy-Item -Recurse .\frontend-web\dist\* .\backend-symfony\public\
   ```
3. En producción, la URL sería `http://localhost:8000` (sin el puerto 5173)

> Mientras no se haga esto, el sistema requiere dos servidores corriendo (PHP + Vite), lo que complica el uso diario.

---

## 5. Script de inicio para uso diario (granjero)

### Falta
Un archivo `.bat` que el usuario final pueda hacer doble clic para iniciar todo el sistema en un solo paso, sin abrir PowerShell ni terminales.

### Crear el archivo `INICIAR-SISTEMA.bat` en la raíz del proyecto
El contenido está documentado en `documentacion/Que_hacer.txt` (Parte 5.2). Resumen:

```batch
@echo off
title Sistema Caprino
net start OracleServiceXE >nul 2>&1
cd /d "%~dp0backend-symfony\public"
start /B /MIN php -S localhost:80 -t .
timeout /t 3 /nobreak >nul
start http://localhost
```

> Este script requiere que el frontend ya esté compilado y copiado a `backend-symfony/public/` (ver punto 4).

---

## 6. Oracle Autonomous Database (ADB) — Conexión en nube

### Estado
El código en `api.php` ya tiene soporte para conectarse a Oracle ADB via wallet. Las variables en `backend-symfony/.env` están comentadas:

```env
# DATABASE_WALLET_PATH=C:\oracle\wallet\Wallet_Caprino
# DATABASE_TNS_NAME=caprino_high
```

### Qué falta
1. Crear una instancia de Oracle ADB en Oracle Cloud (Free Tier disponible)
2. Descargar el wallet de conexión (`Wallet_xxx.zip`) desde la consola de Oracle Cloud
3. Extraer el wallet a una carpeta local (ej: `C:\oracle\wallet\`)
4. Descomentarear las dos líneas en `backend-symfony/.env` y ajustar la ruta y el nombre TNS
5. Asegurarse de que el Instant Client de Oracle esté instalado en la máquina (el wallet requiere el cliente completo, no solo OCI8)
6. Probar la conexión: `php -r "echo oci_connect('usuario', 'pass', 'nombre_tns') ? 'OK' : 'FAIL';"`

> Mientras no se configure el ADB, el sistema solo funciona con Oracle XE local.

---

## 7. Contraseñas por defecto — Cambiar antes de entregar

Antes de dar el sistema a un usuario final, cambiar:

| Qué | Valor actual | Dónde cambiar |
|---|---|---|
| Admin del sistema | `Admin123!` | SQL: `UPDATE USUARIO SET password_hash = :nuevo WHERE email = 'admin@caprino.com'` (usar `password_hash()` de PHP para generar el hash) |
| Usuario Oracle | `CaprinoPass2025` | Oracle: `ALTER USER caprino_user IDENTIFIED BY "NuevaPassword";` + actualizar `backend-symfony/.env` |
| JWT Secret | Generado por `09-CONFIGURAR-ENV.ps1` | Ya está aleatorio, pero anotar en lugar seguro |

---

## 8. Backup automático — Sin configurar

El sistema no tiene backup configurado. Si Oracle falla o se borra la base de datos, se pierden todos los datos.

### Mínimo recomendado
Crear una tarea programada en Windows que ejecute diariamente:
```batch
exp caprino_user/CaprinoPass2025@XEPDB1 file=C:\Backups\backup_%DATE%.dmp owner=caprino_user
```

El script completo está en `documentacion/Que_hacer.txt` (Extra 1).

---

## 9. Manual de usuario

Falta un documento (PDF o Word) con capturas de pantalla que explique al granjero cómo:
- Registrar una cabra nueva
- Registrar producción diaria de leche
- Registrar una vacuna
- Ver las notificaciones de próximas vacunas
- Exportar un reporte

---

## 10. Reportes PDF

El módulo `ModuloReportes.jsx` existe pero no genera PDFs. Para agregar esta funcionalidad:

```bash
cd frontend-web
npm install jspdf jspdf-autotable
```

El código de ejemplo está en `documentacion/Que_hacer.txt` (Extra 2).

---

## Resumen de prioridades

| # | Item | Impacto | Esfuerzo |
|---|---|---|---|
| 1 | Verificar tablas SQL (SALUD, REPRODUCCION, NOTIFICACION) | Bloquea 3 módulos | Bajo — ejecutar scripts |
| 2 | Corregir endpoints de genealogía en api.php | Bloquea módulo Genealogía | Medio — 30 líneas PHP |
| 3 | Revisar y corregir llamadas API en cada módulo React | Módulos pueden fallar silenciosamente | Medio — revisar 7 archivos |
| 4 | Build de producción + copiar dist/ al backend | Sistema requiere dos servidores en desarrollo | Bajo — 2 comandos |
| 5 | Script INICIAR-SISTEMA.bat para usuario final | Facilita el uso diario | Bajo — 15 líneas batch |
| 6 | Oracle ADB en nube | Acceso remoto a la BD | Alto — requiere cuenta Oracle Cloud |
| 7 | Cambiar contraseñas por defecto | Seguridad | Bajo |
| 8 | Backup automático | Protección de datos | Bajo — una tarea de Windows |
| 9 | Manual de usuario con capturas | Usabilidad para el granjero | Medio |
| 10 | Reportes PDF con jsPDF | Funcionalidad extra | Bajo |
