# Sistema de Gestión Zootécnica para Ganado Caprino

## Descripción del Proyecto

Sistema integral para la gestión profesional de datos zootécnicos en explotaciones caprinas. Permite el control completo de trazabilidad animal, producción lechera, reproducción, sanidad y crecimiento con soporte web y móvil.

## Características Principales

- Trazabilidad individual de cada animal mediante identificación única
- Control genealógico con registro de parentesco
- Seguimiento de producción lechera con análisis de calidad
- Gestión de ciclos reproductivos y partos
- Historial sanitario completo (vacunas, tratamientos, diagnósticos)
- Control de crecimiento mediante pesajes periódicos
- Funcionamiento online y offline
- Interfaz web para análisis y reportes
- Aplicación móvil para trabajo de campo

## Arquitectura del Sistema

### Backend
- Framework: Symfony 6.x
- API: API Platform (REST)
- Autenticación: JWT
- Base de Datos: Oracle Database

### Frontend Web
- Framework: React 18
- Estilos: Tailwind CSS
- Gráficos: Recharts
- Gestión de Estado: React Query

### Aplicación Móvil
- Framework: Capacitor
- Base: React + Ionic
- Almacenamiento Local: SQLite
- Sincronización: Sistema de cola offline-first

## Estructura del Proyecto

```
Proyecto Caprino/
├── documentacion/           # Documentación técnica y funcional
├── base-de-datos/          # Scripts SQL, esquemas y vistas Oracle
│   ├── esquemas/           # Definición de tablas y relaciones
│   ├── vistas/             # Vistas para reportes y consultas
│   └── procedimientos/     # Procedimientos almacenados y triggers
├── backend-symfony/        # API REST y lógica de negocio
├── frontend-web/           # Aplicación web administrativa
├── aplicacion-movil/       # App móvil para trabajo de campo
├── pruebas/               # Casos de prueba y validación
└── despliegue/            # Configuración para producción
```

## Fases de Implementación

### Fase 0: Análisis Zootécnico
Definición de procesos reales y requisitos del sector caprino

### Fase 1: Modelado de Datos
Diseño profesional de base de datos Oracle con integridad referencial

### Fase 2: Backend Symfony
Desarrollo de API REST con validaciones de negocio estrictas

### Fase 3: Frontend Web
Panel administrativo con dashboards y reportes analíticos

### Fase 4: Aplicación Móvil
App de campo con funcionamiento offline para registro en corrales

### Fase 5: Pruebas y Validación
Validación técnica y zootécnica con casos reales

### Fase 6: Despliegue
Puesta en producción con configuración profesional

## Requisitos del Sistema

### Servidor
- Sistema Operativo: Linux (Ubuntu 22.04 LTS recomendado)
- Oracle Database 19c o superior
- PHP 8.1 o superior
- Composer 2.x
- Node.js 18.x o superior
- Nginx o Apache

### Desarrollo
- Docker y Docker Compose (recomendado)
- Git
- Visual Studio Code o PhpStorm

## Seguridad

- Autenticación mediante JWT con tokens de corta duración
- Roles de usuario: Administrador, Zootecnista, Técnico
- Conexiones HTTPS obligatorias en producción
- Validación de datos en backend y frontend
- Respaldos automáticos de base de datos

## Licencia

Proyecto académico - Universidad 
Todos los derechos reservados

## Contacto

Proyecto desarrollado para la gestión profesional del sector caprino zootécnico
