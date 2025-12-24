# Backend API - Sistema de Gestión Zootécnica Caprina

## Descripción

API REST desarrollada con Symfony 6.4 y API Platform para la gestión integral de datos zootécnicos de ganado caprino.

## Tecnologías

- PHP 8.1+
- Symfony 6.4 LTS
- API Platform 3.x
- Doctrine ORM
- Oracle Database
- JWT Authentication
- PHPUnit para testing

## Requisitos Previos

- PHP 8.1 o superior
- Composer 2.x
- Oracle Instant Client
- Extensión PHP OCI8
- Oracle Database 19c o superior

## Instalación

### 1. Clonar el repositorio e instalar dependencias

```bash
cd backend-symfony
composer install
```

### 2. Configurar variables de entorno

Copiar el archivo `.env` y configurar las credenciales de Oracle:

```bash
cp .env .env.local
```

Editar `.env.local`:

```env
DATABASE_URL="oci8://usuario:password@localhost:1521/XEPDB1"
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=tu_passphrase_segura
```

### 3. Generar claves JWT

```bash
php bin/console lexik:jwt:generate-keypair
```

### 4. Crear estructura de base de datos

Ejecutar los scripts SQL ubicados en `/base-de-datos/`:

```bash
# Conectar a Oracle y ejecutar en orden:
# 1. esquemas/01-tablas-principales.sql
# 2. procedimientos/01-triggers-y-funciones.sql
# 3. vistas/01-vistas-reportes.sql
```

### 5. Cargar datos iniciales (opcional)

```bash
php bin/console doctrine:fixtures:load
```

## Estructura del Proyecto

```
backend-symfony/
├── config/                 # Configuración de Symfony
│   ├── packages/          # Configuración de bundles
│   ├── routes/            # Definición de rutas
│   └── services.yaml      # Contenedor de servicios
├── src/
│   ├── Entity/            # Entidades Doctrine (mapeo de tablas)
│   │   ├── Animal.php
│   │   ├── Raza.php
│   │   ├── Genealogia.php
│   │   ├── Pesaje.php
│   │   ├── ProduccionLeche.php
│   │   ├── Reproduccion.php
│   │   ├── Salud.php
│   │   └── Usuario.php
│   ├── Repository/        # Repositorios para consultas personalizadas
│   ├── Controller/        # Controladores adicionales (si necesarios)
│   ├── Service/           # Lógica de negocio
│   │   ├── AnimalService.php
│   │   ├── ReproduccionService.php
│   │   └── ProduccionService.php
│   ├── Validator/         # Validadores personalizados
│   │   ├── ConsanguinidadValidator.php
│   │   └── EdadReproductivaValidator.php
│   ├── Security/          # Autenticación y autorización
│   │   ├── JWTAuthenticator.php
│   │   └── Voter/         # Voters para permisos
│   ├── EventSubscriber/   # Eventos del sistema
│   └── DataFixtures/      # Datos de prueba
├── tests/                 # Pruebas unitarias y funcionales
│   ├── Unit/
│   └── Functional/
├── migrations/            # Migraciones de BD (si se usan)
├── var/                   # Cache y logs
└── composer.json          # Dependencias PHP
```

## Endpoints Principales

### Autenticación

```
POST /api/login
Body: {"username": "email", "password": "password"}
Response: {"token": "JWT_TOKEN"}
```

### Animales

```
GET    /api/animales                    # Listar animales con filtros
GET    /api/animales/{id}               # Detalle de un animal
POST   /api/animales                    # Registrar nuevo animal
PUT    /api/animales/{id}               # Actualizar animal
DELETE /api/animales/{id}               # Eliminar (cambiar estado)
GET    /api/animales/{id}/genealogia    # Árbol genealógico
```

### Pesajes

```
GET    /api/pesajes                     # Listar pesajes
POST   /api/pesajes                     # Registrar pesaje
GET    /api/pesajes?animal={id}         # Pesajes de un animal
```

### Producción de Leche

```
GET    /api/produccion                  # Listar producciones
POST   /api/produccion                  # Registrar producción
GET    /api/produccion/estadisticas     # Estadísticas generales
GET    /api/produccion?animal={id}      # Producción de un animal
```

### Reproducción

```
GET    /api/reproduccion                # Listar eventos reproductivos
POST   /api/reproduccion                # Registrar servicio/parto
GET    /api/reproduccion/calendario     # Calendario de partos próximos
```

### Salud

```
GET    /api/salud                       # Historial sanitario
POST   /api/salud                       # Registrar evento sanitario
GET    /api/salud/vacunacion            # Plan de vacunación
GET    /api/salud/retiros               # Animales en retiro
```

### Reportes

```
GET    /api/reportes/produccion         # Reporte de producción
GET    /api/reportes/reproduccion       # Reporte reproductivo
GET    /api/reportes/crecimiento        # Reporte de crecimiento
GET    /api/reportes/dashboard          # Indicadores generales
```

## Validaciones Implementadas

### Validaciones de Entidad (Assert)

Cada entidad implementa validaciones con atributos de Symfony Validator:

- `@Assert\NotBlank`: Campo obligatorio
- `@Assert\Positive`: Número positivo
- `@Assert\Range`: Rango de valores
- `@Assert\Choice`: Valores permitidos (enums)
- `@Assert\Email`: Formato de email
- `@Assert\Length`: Longitud de string

### Validadores Personalizados

- **ConsanguinidadValidator**: Valida cruces no consanguíneos
- **EdadReproductivaValidator**: Valida edad mínima para reproducción
- **FechaCoherenteValidator**: Valida coherencia de fechas (parto > servicio)
- **AnimalActivoValidator**: Valida que el animal esté activo

## Seguridad

### Roles de Usuario

- `ROLE_ADMIN`: Acceso total al sistema
- `ROLE_ZOOTECNISTA`: Lectura total, escritura en datos operativos
- `ROLE_TECNICO`: Solo lectura
- `ROLE_VETERINARIO`: Lectura total, escritura en salud

### Configuración de Seguridad

La seguridad se configura en `config/packages/security.yaml`:

- Autenticación mediante JWT
- Firewall para rutas `/api/*`
- Control de acceso por rol
- Rate limiting en endpoints sensibles

## Testing

### Ejecutar todas las pruebas

```bash
php bin/phpunit
```

### Ejecutar pruebas específicas

```bash
# Pruebas unitarias
php bin/phpunit tests/Unit

# Pruebas funcionales
php bin/phpunit tests/Functional

# Prueba específica
php bin/phpunit tests/Unit/Service/AnimalServiceTest.php
```

### Coverage de código

```bash
XDEBUG_MODE=coverage php bin/phpunit --coverage-html var/coverage
```

## Comandos Útiles

### Limpiar caché

```bash
php bin/console cache:clear
```

### Ver rutas disponibles

```bash
php bin/console debug:router
```

### Validar esquema de base de datos

```bash
php bin/console doctrine:schema:validate
```

### Crear nueva entidad

```bash
php bin/console make:entity
```

## Desarrollo

### Convenciones de Código

- PSR-12 para estilo de código PHP
- Comentarios en español para lógica de negocio zootécnica
- Nombres de variables descriptivos
- Métodos cortos y con responsabilidad única

### Commits

Usar mensajes descriptivos en español:

```
feat: agregar endpoint de calendario reproductivo
fix: corregir validación de edad en reproducción
refactor: optimizar consulta de producción por raza
docs: actualizar documentación de API
test: agregar pruebas para servicio de genealogía
```

## Despliegue

Ver documentación completa en `/documentacion/manual-despliegue.md`

### Pasos Básicos

1. Configurar servidor con PHP 8.1 y Oracle Client
2. Clonar repositorio y configurar `.env.local`
3. Instalar dependencias: `composer install --no-dev --optimize-autoloader`
4. Generar claves JWT
5. Configurar Nginx/Apache como reverse proxy
6. Configurar HTTPS con certificado SSL
7. Configurar backups automáticos de base de datos

## Troubleshooting

### Error de conexión a Oracle

```bash
# Verificar extensión OCI8
php -m | grep oci8

# Verificar variables de entorno de Oracle
echo $ORACLE_HOME
echo $LD_LIBRARY_PATH
```

### Error de permisos JWT

```bash
# Dar permisos correctos a las claves
chmod 644 config/jwt/public.pem
chmod 600 config/jwt/private.pem
```

### Lentitud en consultas

```bash
# Ver queries lentas en logs
tail -f var/log/dev.log | grep "doctrine"

# Optimizar con índices en Oracle
# Ver: base-de-datos/esquemas/01-tablas-principales.sql
```

## Soporte

Para dudas o problemas:
1. Revisar documentación en `/documentacion/`
2. Revisar logs en `var/log/`
3. Contactar al equipo de desarrollo

## Licencia

Proyecto académico - Universidad [Nombre]
