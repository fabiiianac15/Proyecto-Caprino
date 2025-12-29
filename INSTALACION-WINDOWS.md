# Instalación en Windows

Guía paso a paso para instalar el Sistema de Gestión Caprina en Windows.

## Requisitos Previos

### 1. Oracle Database 21c XE
- Descargar desde: https://www.oracle.com/database/technologies/xe-downloads.html
- Instalar y configurar con:
  - Puerto: 1521
  - Service Name: XEPDB1
  - Usuario: caprino_user
  - Contraseña: CaprinoPass2025

### 2. Docker Desktop para Windows
- Descargar desde: https://www.docker.com/products/docker-desktop
- Instalar y reiniciar el sistema
- Verificar que WSL 2 esté habilitado

### 3. Node.js (LTS)
- Descargar desde: https://nodejs.org/
- Instalar versión 18.x o superior
- Verificar: `node --version` y `npm --version`

### 4. Git para Windows
- Descargar desde: https://git-scm.com/download/win
- Usar Git Bash para los comandos

## Pasos de Instalación

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd "Proyecto Caprino"
```

### 2. Configurar Oracle Database

#### A. Crear el usuario y permisos

Abrir SQL*Plus como administrador:

```sql
sqlplus sys as sysdba

-- Conectar al PDB
ALTER SESSION SET CONTAINER = XEPDB1;

-- Crear usuario
CREATE USER caprino_user IDENTIFIED BY CaprinoPass2025;

-- Otorgar permisos
GRANT CONNECT, RESOURCE, CREATE SESSION TO caprino_user;
GRANT CREATE TABLE, CREATE SEQUENCE, CREATE TRIGGER TO caprino_user;
GRANT CREATE VIEW, CREATE PROCEDURE TO caprino_user;
GRANT UNLIMITED TABLESPACE TO caprino_user;

EXIT;
```

#### B. Ejecutar scripts SQL

```bash
cd base-de-datos

# Ejecutar scripts en orden
sqlplus caprino_user/CaprinoPass2025@localhost:1521/XEPDB1 @esquemas/01-tablas-principales.sql
sqlplus caprino_user/CaprinoPass2025@localhost:1521/XEPDB1 @esquemas/02-datos-iniciales-razas.sql
sqlplus caprino_user/CaprinoPass2025@localhost:1521/XEPDB1 @esquemas/03-datos-iniciales-usuarios.sql
sqlplus caprino_user/CaprinoPass2025@localhost:1521/XEPDB1 @esquemas/04-tabla-usuarios.sql
sqlplus caprino_user/CaprinoPass2025@localhost:1521/XEPDB1 @procedimientos/01-triggers-y-funciones.sql
sqlplus caprino_user/CaprinoPass2025@localhost:1521/XEPDB1 @vistas/01-vistas-reportes.sql
```

### 3. Configurar Backend (Symfony)

#### A. Configurar variables de entorno

```bash
cd backend-symfony
copy .env.example .env
```

Editar `.env` y ajustar:
- `DATABASE_HOST`: localhost o IP del servidor Oracle
- `DATABASE_PORT`: 1521
- `DATABASE_NAME`: XEPDB1
- `DATABASE_USER`: caprino_user
- `DATABASE_PASSWORD`: CaprinoPass2025

#### B. Generar claves JWT

```bash
# Crear directorio
mkdir config\jwt

# Generar claves (necesita OpenSSL)
openssl genpkey -algorithm RSA -out config/jwt/private.pem -pkeyopt rsa_keygen_bits:4096
openssl rsa -pubout -in config/jwt/private.pem -out config/jwt/public.pem
```

#### C. Construir contenedor Docker

```bash
cd ..
docker-compose -f docker-compose.dev.yml up -d
```

Esperar 2-3 minutos para que Oracle inicialice completamente.

#### D. Verificar conexión

```bash
docker exec -it caprino_symfony_dev php bin/console doctrine:schema:validate
```

Debe mostrar: "The mapping files are correct" y "The database schema is in sync"

### 4. Configurar Frontend (React)

#### A. Instalar dependencias

```bash
cd frontend-web
npm install
```

#### B. Configurar variables de entorno

Crear archivo `.env.local`:

```env
VITE_API_URL=http://localhost:8000/api
```

#### C. Iniciar servidor de desarrollo

```bash
npm run dev
```

### 5. Iniciar el Sistema Completo

Opción 1 - Script automatizado (Git Bash):

```bash
./start-all.sh
```

Opción 2 - Manual:

```bash
# 1. Iniciar Oracle (si no está corriendo)
# Desde Services de Windows o:
net start OracleServiceXE

# 2. Iniciar contenedores Docker
docker start caprino_oracle_dev caprino_symfony_dev

# 3. Iniciar frontend
cd frontend-web
npm run dev
```

### 6. Acceder a la Aplicación

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **Documentación API**: http://localhost:8000/api/docs

## Verificación de la Instalación

### 1. Verificar Oracle

```bash
sqlplus caprino_user/CaprinoPass2025@localhost:1521/XEPDB1

SELECT table_name FROM user_tables;
```

Debe mostrar 8 tablas:
- ANIMAL
- RAZA
- PESAJE
- PRODUCCION_LECHE
- REPRODUCCION
- SALUD
- GENEALOGIA
- USUARIOS

### 2. Verificar Backend

```bash
curl http://localhost:8000/api
```

Debe devolver JSON con los endpoints disponibles.

### 3. Verificar Frontend

Abrir http://localhost:5173 en el navegador.
Debe mostrar la pantalla de login/registro.

## Primer Usuario

### Registrarse desde la interfaz

1. Ir a http://localhost:5173
2. Hacer clic en "Registrarse"
3. Llenar el formulario:
   - Nombre: Tu nombre
   - Apellido: Tu apellido
   - Email: tu@email.com
   - Teléfono: (opcional)
   - Contraseña: mínimo 8 caracteres

### O crear usuario por SQL

```sql
INSERT INTO USUARIOS (
    id_usuario, email, roles, password, nombre, apellido, activo, fecha_registro
) VALUES (
    USUARIOS_SEQ.NEXTVAL,
    'admin@caprino.com',
    '["ROLE_ADMIN"]',
    '$2y$13$hashed_password_aqui', -- Generar con Symfony
    'Administrador',
    'Sistema',
    1,
    SYSTIMESTAMP
);
```

## Solución de Problemas

### Error: "No se puede conectar a Oracle"

1. Verificar que Oracle esté corriendo:
   ```
   lsnrctl status
   ```

2. Verificar puerto abierto:
   ```
   netstat -an | findstr 1521
   ```

3. Verificar conectividad:
   ```
   sqlplus caprino_user/CaprinoPass2025@localhost:1521/XEPDB1
   ```

### Error: "Doctrine DBAL no puede conectarse"

1. Verificar extensión PDO_OCI en PHP:
   ```
   docker exec caprino_symfony_dev php -m | findstr oci
   ```

2. Verificar configuración en `backend-symfony/config/packages/doctrine.yaml`

3. Limpiar cache de Doctrine:
   ```
   docker exec caprino_symfony_dev php bin/console cache:clear
   ```

### Error: "Puerto 8000 o 5173 en uso"

1. Encontrar proceso:
   ```
   netstat -ano | findstr :8000
   ```

2. Matar proceso (usar PID del comando anterior):
   ```
   taskkill /PID <número> /F
   ```

### Frontend no carga datos

1. Verificar que USE_MOCK_DATA esté en `false`:
   - Archivo: `frontend-web/src/servicios/caprino-api.js`
   - Línea 5: `const USE_MOCK_DATA = false;`

2. Verificar URL del API:
   - Archivo: `frontend-web/.env.local`
   - Debe tener: `VITE_API_URL=http://localhost:8000/api`

3. Abrir consola del navegador (F12) y verificar errores

## Detener el Sistema

### Script automatizado:

```bash
./stop-all.sh
```

### Manual:

```bash
# 1. Detener frontend (Ctrl+C en la terminal)

# 2. Detener contenedores Docker
docker stop caprino_symfony_dev caprino_oracle_dev

# 3. (Opcional) Detener Oracle en Windows
net stop OracleServiceXE
```

## Próximos Pasos

1. Registrar primer usuario administrador
2. Importar razas de cabras desde datos iniciales
3. Comenzar a registrar animales
4. Consultar documentación completa en `/documentacion`

## Soporte

- Ver documentación técnica: `documentacion/`
- Resumen del proyecto: `RESUMEN_COMPLETO.md`
- Guía rápida: `INICIO-RAPIDO.md`
