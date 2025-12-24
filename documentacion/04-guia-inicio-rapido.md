# Guía de Primeros Pasos
## Sistema de Gestión Zootécnica Caprina

Esta guía te ayudará a comenzar con el proyecto paso a paso.

---

## Paso 1: Clonar y Preparar el Entorno

### 1.1 Verificar Requisitos

```bash
# Verificar versiones instaladas
php --version        # Debe ser >= 8.1
composer --version   # Debe ser >= 2.0
node --version       # Debe ser >= 18.0
npm --version        # Debe ser >= 9.0
git --version
```

### 1.2 Configurar Oracle Database

Si no tienes Oracle instalado, puedes usar Docker:

```bash
# Descargar imagen de Oracle XE
docker pull container-registry.oracle.com/database/express:21.3.0-xe

# Iniciar contenedor
docker run -d \
  --name oracle-caprino \
  -p 1521:1521 \
  -e ORACLE_PWD=OraclePass123 \
  container-registry.oracle.com/database/express:21.3.0-xe

# Esperar a que inicie (puede tomar 2-3 minutos)
docker logs -f oracle-caprino
```

---

## Paso 2: Configurar Base de Datos

### 2.1 Conectar a Oracle

```bash
# Conectar con SQLPlus
sqlplus sys/OraclePass123@localhost:1521/XEPDB1 as sysdba
```

### 2.2 Crear Usuario

```sql
-- Crear usuario para el proyecto
CREATE USER usuario_caprino IDENTIFIED BY password_seguro;

-- Otorgar permisos
GRANT CONNECT, RESOURCE TO usuario_caprino;
GRANT CREATE VIEW TO usuario_caprino;
GRANT CREATE SEQUENCE TO usuario_caprino;
GRANT CREATE TRIGGER TO usuario_caprino;
GRANT UNLIMITED TABLESPACE TO usuario_caprino;

-- Salir
EXIT;
```

### 2.3 Ejecutar Scripts SQL

```bash
# Conectar como usuario del proyecto
sqlplus usuario_caprino/password_seguro@localhost:1521/XEPDB1

# Ejecutar scripts en orden
@base-de-datos/esquemas/01-tablas-principales.sql
@base-de-datos/procedimientos/01-triggers-y-funciones.sql
@base-de-datos/vistas/01-vistas-reportes.sql
```

### 2.4 Verificar Instalación

```sql
-- Ver tablas creadas
SELECT table_name FROM user_tables ORDER BY table_name;

-- Debería mostrar: ANIMAL, RAZA, GENEALOGIA, PESAJE, PRODUCCION_LECHE, REPRODUCCION, SALUD, USUARIO, AUDITORIA

-- Verificar vistas
SELECT view_name FROM user_views ORDER BY view_name;

EXIT;
```

---

## Paso 3: Configurar Backend (Symfony)

### 3.1 Instalar Dependencias

```bash
cd backend-symfony
composer install
```

### 3.2 Configurar Variables de Entorno

```bash
cp .env .env.local
nano .env.local
```

Editar:
```env
DATABASE_URL="oci8://usuario_caprino:password_seguro@localhost:1521/XEPDB1"
APP_SECRET=cambiar_por_string_aleatorio_seguro
JWT_PASSPHRASE=otra_passphrase_segura
```

### 3.3 Generar Claves JWT

```bash
php bin/console lexik:jwt:generate-keypair
```

### 3.4 Iniciar Servidor

```bash
symfony server:start
# O si no tienes Symfony CLI:
php -S localhost:8000 -t public
```

### 3.5 Verificar API

Abrir navegador: `http://localhost:8000/api`

Deberías ver la documentación de API Platform.

---

## Paso 4: Configurar Frontend Web (React)

### 4.1 Instalar Dependencias

```bash
cd frontend-web
npm install
```

### 4.2 Configurar Variables de Entorno

```bash
cp .env.example .env
nano .env
```

Verificar:
```env
VITE_API_URL=http://localhost:8000/api
```

### 4.3 Iniciar Servidor de Desarrollo

```bash
npm run dev
```

Abrir navegador: `http://localhost:5173`

---

## Paso 5: Configurar App Móvil (Capacitor)

### 5.1 Instalar Dependencias

```bash
cd aplicacion-movil
npm install
```

### 5.2 Configurar Variables

```bash
cp .env.example .env
```

### 5.3 Build Inicial

```bash
npm run build
```

### 5.4 Agregar Plataforma Android (Opcional)

```bash
npx cap add android
npx cap sync android
```

### 5.5 Iniciar en Modo Web

```bash
npm run dev
```

---

## Paso 6: Cargar Datos Iniciales

### 6.1 Crear Datos de Prueba

Conectar a Oracle y ejecutar:

```sql
-- Insertar razas comunes
INSERT INTO RAZA (nombre_raza, origen, aptitud, peso_adulto_promedio_kg, produccion_leche_dia_promedio) 
VALUES ('Saanen', 'Suiza', 'lechera', 65, 4.5);

INSERT INTO RAZA (nombre_raza, origen, aptitud, peso_adulto_promedio_kg, produccion_leche_dia_promedio) 
VALUES ('Alpina Francesa', 'Francia', 'lechera', 55, 3.8);

INSERT INTO RAZA (nombre_raza, origen, aptitud, peso_adulto_promedio_kg, produccion_leche_dia_promedio) 
VALUES ('Boer', 'Sudáfrica', 'carnica', 80, 0);

INSERT INTO RAZA (nombre_raza, origen, aptitud, peso_adulto_promedio_kg, produccion_leche_dia_promedio) 
VALUES ('Nubia', 'África', 'doble_proposito', 60, 2.5);

COMMIT;

-- Crear usuario administrador
INSERT INTO USUARIO (nombre_completo, email, password_hash, rol) 
VALUES ('Administrador', 'admin@caprino.com', '$2y$13$hashedpassword', 'administrador');

COMMIT;
```

---

## Paso 7: Primeras Pruebas

### 7.1 Probar API con Postman

1. Importar colección (crear una con estos endpoints):

```
POST http://localhost:8000/api/login
Body: {"username": "admin@caprino.com", "password": "password"}

GET http://localhost:8000/api/animales
Header: Authorization: Bearer {token}

GET http://localhost:8000/api/razas
```

### 7.2 Probar Frontend

1. Abrir `http://localhost:5173`
2. Intentar iniciar sesión
3. Navegar por las secciones
4. Registrar un animal de prueba

---

## Paso 8: Próximos Pasos

### Desarrollo
- [ ] Completar entidades faltantes del backend
- [ ] Implementar validadores personalizados
- [ ] Crear componentes del frontend
- [ ] Implementar sincronización móvil

### Testing
- [ ] Crear pruebas unitarias
- [ ] Probar con datos reales
- [ ] Validar cálculos zootécnicos

### Documentación
- [ ] Documentar endpoints de API
- [ ] Crear manual de usuario
- [ ] Documentar procesos de despliegue

---

## Solución de Problemas Comunes

### Error: "No se puede conectar a Oracle"

```bash
# Verificar que el servicio esté corriendo
docker ps

# Ver logs
docker logs oracle-caprino

# Reiniciar contenedor
docker restart oracle-caprino
```

### Error: "Composer no encuentra la extensión oci8"

```bash
# Instalar extensión en Ubuntu/Debian
sudo apt-get install php8.1-oci8

# En macOS con Homebrew
brew install php@8.1
pecl install oci8
```

### Error: "JWT no funciona"

```bash
# Regenerar claves
rm -rf config/jwt/*.pem
php bin/console lexik:jwt:generate-keypair

# Verificar permisos
chmod 644 config/jwt/public.pem
chmod 600 config/jwt/private.pem
```

### Error: "CORS en el frontend"

Verificar archivo `config/packages/nelmio_cors.yaml`:

```yaml
nelmio_cors:
    defaults:
        origin_regex: true
        allow_origin: ['*']
        allow_methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
        allow_headers: ['*']
```

---

## Recursos Adicionales

- [Documentación de Symfony](https://symfony.com/doc/current/index.html)
- [Documentación de API Platform](https://api-platform.com/docs/)
- [Documentación de React](https://react.dev)
- [Documentación de Capacitor](https://capacitorjs.com/docs)
- [Documentación de Oracle](https://docs.oracle.com/en/database/)

---

¡Listo! Ahora tienes el proyecto base funcionando. Continúa con el desarrollo según el plan de implementación.
