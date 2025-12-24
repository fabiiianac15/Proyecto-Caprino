# Arquitectura del Sistema de Gestión Zootécnica Caprina

## Visión General

Sistema distribuido de tres capas diseñado para gestionar datos zootécnicos con alta integridad y disponibilidad, soportando operaciones en línea y fuera de línea.

## Capas del Sistema

### 1. Capa de Datos (Oracle Database)

#### Responsabilidades
- Almacenamiento persistente de todos los datos zootécnicos
- Garantizar integridad referencial mediante constraints
- Ejecutar lógica de negocio crítica mediante triggers
- Proporcionar vistas optimizadas para reportes
- Realizar cálculos complejos mediante procedimientos almacenados

#### Componentes Principales
- Tablas maestras: ANIMAL, USUARIO, RAZA
- Tablas de gestión: GENEALOGIA, PESAJE, PRODUCCION_LECHE, REPRODUCCION, SALUD
- Vistas de negocio: produccion_por_raza, crecimiento_promedio, historial_reproductivo
- Procedimientos: calcular_peso_estimado, validar_fecha_parto, registrar_descarte

#### Consideraciones de Diseño
- Uso de secuencias para generación de IDs
- Índices en columnas de búsqueda frecuente (codigo_identificacion, fecha)
- Particionamiento de tablas grandes por fecha (PRODUCCION_LECHE, PESAJE)
- Auditoría mediante tablas de log automáticas

### 2. Capa de Lógica de Negocio (Backend Symfony)

#### Responsabilidades
- Exponer API REST para clientes web y móviles
- Validar datos de entrada según reglas zootécnicas
- Gestionar autenticación y autorización
- Aplicar reglas de negocio complejas
- Transformar datos entre formato de base de datos y API

#### Estructura de Directorios
```
backend-symfony/
├── config/                 # Configuración de Symfony
│   ├── packages/          # Configuración de bundles
│   └── routes/            # Definición de rutas
├── src/
│   ├── Entity/            # Entidades Doctrine (mapeo a tablas Oracle)
│   ├── Repository/        # Repositorios para consultas personalizadas
│   ├── Controller/        # Controladores de API (si no se usa solo API Platform)
│   ├── Service/           # Lógica de negocio reutilizable
│   ├── Validator/         # Validadores personalizados
│   ├── Security/          # Autenticación y autorización
│   └── EventSubscriber/   # Eventos del sistema
├── tests/                 # Pruebas unitarias y de integración
└── migrations/            # Migraciones de base de datos
```

#### Tecnologías Clave
- Symfony 6.4 LTS
- API Platform 3.x para API REST automática
- Doctrine ORM para mapeo objeto-relacional con Oracle
- LexikJWTAuthenticationBundle para tokens JWT
- Symfony Validator para validación de datos

#### Endpoints Principales
```
POST   /api/login                    # Autenticación
GET    /api/animales                 # Lista de animales con filtros
POST   /api/animales                 # Registro de nuevo animal
GET    /api/animales/{id}            # Detalle de animal
PUT    /api/animales/{id}            # Actualización de animal
DELETE /api/animales/{id}            # Eliminación lógica (cambio estado)

POST   /api/pesajes                  # Registro de pesaje
GET    /api/pesajes?animal={id}      # Historial de pesajes

POST   /api/produccion               # Registro de producción lechera
GET    /api/produccion/estadisticas  # Estadísticas de producción

POST   /api/reproduccion             # Registro de evento reproductivo
GET    /api/reproduccion/calendario  # Calendario reproductivo

POST   /api/salud                    # Registro sanitario
GET    /api/salud/vacunacion         # Plan de vacunación

GET    /api/reportes/produccion      # Reporte de producción
GET    /api/reportes/genealogia/{id} # Árbol genealógico
```

### 3. Capa de Presentación

#### 3.1 Frontend Web (React + Tailwind)

##### Responsabilidades
- Interfaz administrativa para gestión completa
- Visualización de dashboards y gráficos analíticos
- Generación y exportación de reportes
- Gestión de usuarios y configuración del sistema

##### Estructura de Directorios
```
frontend-web/
├── public/                # Archivos estáticos
├── src/
│   ├── componentes/       # Componentes reutilizables
│   │   ├── comunes/       # Botones, formularios, tablas
│   │   ├── animales/      # Componentes específicos de animales
│   │   ├── produccion/    # Componentes de producción
│   │   └── reportes/      # Componentes de visualización
│   ├── paginas/           # Páginas principales
│   │   ├── Dashboard.jsx
│   │   ├── ListaAnimales.jsx
│   │   ├── DetalleAnimal.jsx
│   │   └── Reportes.jsx
│   ├── servicios/         # Comunicación con API
│   │   ├── api.js         # Cliente HTTP base
│   │   ├── animalesAPI.js
│   │   └── produccionAPI.js
│   ├── contextos/         # Context API de React
│   │   ├── AuthContext.jsx
│   │   └── ConfigContext.jsx
│   ├── utilidades/        # Funciones auxiliares
│   │   ├── formateo.js    # Formateo de fechas, números
│   │   └── validacion.js  # Validaciones del lado del cliente
│   └── estilos/           # Estilos globales y temas
└── package.json
```

##### Tecnologías Clave
- React 18 con Hooks
- React Router para navegación
- React Query para gestión de estado del servidor
- Tailwind CSS para estilos
- Recharts para gráficos
- Axios para peticiones HTTP

#### 3.2 Aplicación Móvil (Capacitor + React)

##### Responsabilidades
- Registro rápido de datos en campo
- Escaneo de códigos QR para identificación animal
- Captura de fotografías
- Funcionamiento sin conexión con sincronización automática
- Interfaz optimizada para uso con una mano

##### Estructura de Directorios
```
aplicacion-movil/
├── android/               # Proyecto Android nativo
├── ios/                  # Proyecto iOS nativo
├── src/
│   ├── componentes/
│   │   ├── formularios/   # Formularios optimizados para móvil
│   │   ├── escaner/       # Componente de escaneo QR
│   │   └── camara/        # Componente de cámara
│   ├── paginas/
│   │   ├── Inicio.jsx
│   │   ├── RegistrarPesaje.jsx
│   │   ├── RegistrarProduccion.jsx
│   │   └── EscanearAnimal.jsx
│   ├── servicios/
│   │   ├── sincronizacion.js  # Cola de sincronización
│   │   ├── almacenamientoLocal.js  # SQLite local
│   │   └── api.js
│   └── utilidades/
│       ├── offline.js     # Detección de conectividad
│       └── validacion.js
└── capacitor.config.ts
```

##### Tecnologías Clave
- Capacitor 5.x
- React con Ionic Components
- SQLite para almacenamiento local
- Capacitor Plugins: Camera, Barcode Scanner, Network
- Workbox para gestión de caché

## Flujo de Datos

### Escenario 1: Registro de Producción Lechera (Online)

1. Zootecnista abre app móvil en el corral
2. Escanea código QR del animal
3. App consulta API para validar que el animal existe
4. Zootecnista ingresa litros producidos
5. App envía POST a `/api/produccion`
6. Backend valida datos según reglas de negocio
7. Backend inserta registro en tabla PRODUCCION_LECHE
8. Oracle ejecuta trigger para actualizar estadísticas
9. Backend retorna confirmación
10. App muestra mensaje de éxito

### Escenario 2: Registro de Pesaje (Offline)

1. Zootecnista está en zona sin señal
2. App detecta modo offline
3. Zootecnista registra pesaje normalmente
4. Datos se guardan en SQLite local con estado "pendiente_sincronizar"
5. App muestra indicador visual de sincronización pendiente
6. Cuando recupera señal, servicio de sincronización detecta cambio
7. App envía datos pendientes a API en orden cronológico
8. Backend procesa y confirma recepción
9. App marca registros como "sincronizado" en SQLite

### Escenario 3: Consulta de Dashboard (Web)

1. Usuario accede al dashboard web
2. React Query solicita datos a múltiples endpoints en paralelo
3. Backend ejecuta consultas a vistas Oracle optimizadas
4. Datos se transforman a formato JSON
5. Frontend recibe respuestas y las cachea
6. Recharts renderiza gráficos con los datos
7. Usuario puede filtrar por fechas sin nuevas peticiones (filtrado local)

## Seguridad

### Autenticación
- Usuario envía credenciales a POST `/api/login`
- Backend valida contra tabla USUARIO (password hasheado con bcrypt)
- Si válido, genera JWT con claims: user_id, rol, exp (expiración 8 horas)
- Cliente guarda token en localStorage (web) o SecureStorage (móvil)
- Todas las peticiones subsecuentes incluyen header: `Authorization: Bearer {token}`

### Autorización
- Backend verifica token en cada petición
- Extrae rol del usuario
- Valida permisos según matriz de acceso:
  - Administrador: Acceso total
  - Zootecnista: Lectura total, escritura en producción/salud/pesaje
  - Técnico: Solo lectura

### Protección de Datos
- Conexión HTTPS obligatoria en producción (TLS 1.3)
- Validación de entrada en frontend y backend (doble capa)
- Sanitización de consultas SQL mediante Doctrine ORM
- Rate limiting en API (máximo 100 peticiones/minuto por usuario)
- Logs de auditoría para operaciones críticas

## Escalabilidad

### Optimizaciones de Base de Datos
- Índices en columnas de búsqueda frecuente
- Particionamiento de tablas históricas por año
- Vistas materializadas para reportes complejos (refresco nocturno)
- Connection pooling en Symfony (máximo 20 conexiones)

### Optimizaciones de Backend
- Cache de respuestas frecuentes (Redis en futuro)
- Paginación obligatoria en listados (máximo 50 registros por página)
- Compresión gzip de respuestas HTTP
- Procesamiento asíncrono de tareas pesadas (exportación de reportes)

### Optimizaciones de Frontend
- Code splitting por rutas
- Lazy loading de componentes pesados
- Virtualización de tablas grandes
- Service Workers para caché de recursos estáticos

## Mantenibilidad

### Estándares de Código
- PSR-12 para código PHP
- ESLint + Prettier para JavaScript
- Comentarios en español para lógica de negocio zootécnica
- Comentarios en inglés para código técnico genérico

### Documentación
- Diagramas UML en `/documentacion/diagramas/`
- Diccionario de datos en `/documentacion/diccionario-datos.md`
- Casos de uso en `/documentacion/casos-uso/`
- Manual de despliegue en `/documentacion/manual-despliegue.md`

### Control de Versiones
- Git con flujo GitFlow
- Ramas: main, develop, feature/*, release/*, hotfix/*
- Commits descriptivos en español
- Pull requests obligatorios con revisión de código

## Monitoreo

### Métricas Clave
- Tiempo de respuesta de API (objetivo: <200ms percentil 95)
- Tasa de error (objetivo: <0.1%)
- Uso de base de datos (conexiones activas, consultas lentas)
- Sincronizaciones móviles exitosas vs fallidas

### Herramientas
- Logs estructurados en Symfony (Monolog)
- Oracle AWR para análisis de rendimiento de base de datos
- Nginx access logs para tráfico HTTP
- Sistema de alertas para errores críticos (futuro)

## Consideraciones de Despliegue

### Entorno de Desarrollo
- Docker Compose con contenedores para Oracle, PHP y Node
- Datos de prueba sintéticos cargados automáticamente
- Hot reload en frontend y backend

### Entorno de Producción
- VPS con Ubuntu 22.04 LTS
- Oracle Database en servidor dedicado o RDS
- Nginx como reverse proxy
- PHP-FPM para ejecución de Symfony
- Certificado SSL de Let's Encrypt
- Backups diarios automáticos con retención de 30 días
- Plan de recuperación ante desastres (RTO: 4 horas, RPO: 24 horas)
