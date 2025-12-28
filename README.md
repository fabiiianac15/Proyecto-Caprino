# 🐐 Sistema de Gestión Zootécnica Caprina

Sistema web completo para la gestión integral de explotaciones caprinas, desarrollado con tecnologías modernas.

## ✅ Estado Actual del Proyecto

### Backend (Symfony + Oracle) - ✅ FUNCIONAL
- [x] Symfony 6.4.30 LTS configurado
- [x] Oracle Database 21c Express integrado
- [x] API Platform 3.4.17 funcionando
- [x] 7 entidades y tablas creadas
- [x] PDO_OCI con PHP 8.2.30
- [x] Nginx + PHP-FPM en Docker

### Frontend Web (React) - ✅ FUNCIONAL
- [x] React 18 con Vite
- [x] Tailwind CSS 3
- [x] 10 componentes principales
- [x] SelectPersonalizado implementado
- [x] Diseño responsivo completo

### Aplicación Móvil (Capacitor) - 🔄 PENDIENTE
- [ ] Configuración de Capacitor
- [ ] Build para Android/iOS
- [ ] Pruebas en dispositivos

### Base de Datos - ✅ FUNCIONAL
- [x] Oracle 21c Express Edition
- [x] 7 tablas principales
- [x] Secuencias y constraints
- [x] Usuario caprino_user configurado

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTE                              │
│  ┌──────────────┐         ┌────────────────┐           │
│  │ React Web App│         │Capacitor Mobile│           │
│  │  (Vite)      │         │   (Pendiente)  │           │
│  └──────┬───────┘         └────────┬───────┘           │
└─────────┼──────────────────────────┼───────────────────┘
          │                          │
          │     HTTP/JSON            │
          │                          │
┌─────────┼──────────────────────────┼───────────────────┐
│         ▼                          ▼                   │
│  ┌────────────────────────────────────┐                │
│  │    Nginx (Port 8000)               │                │
│  │    + PHP-FPM 8.2.30                │                │
│  └────────────┬───────────────────────┘                │
│               │                                         │
│  ┌────────────▼───────────────────┐                    │
│  │    Symfony 6.4.30 LTS          │                    │
│  │    + API Platform 3.4.17       │                    │
│  │    + Doctrine ORM 2.20         │                    │
│  │    + JWT Authentication        │                    │
│  └────────────┬───────────────────┘                    │
│               │ PDO_OCI                                 │
│  ┌────────────▼───────────────────┐                    │
│  │  Oracle Database 21c Express   │                    │
│  │  Service: XEPDB1 (Port 1521)   │                    │
│  │  User: caprino_user            │                    │
│  └────────────────────────────────┘                    │
│                                                         │
│           DOCKER CONTAINERS                             │
└─────────────────────────────────────────────────────────┘
```

## 📦 Estructura del Proyecto

```
Proyecto-Caprino/
├── aplicacion-movil/          # App móvil con Capacitor (pendiente)
├── backend-symfony/           # API REST con Symfony + Oracle ✅
│   ├── src/
│   │   ├── Controller/        # Controladores API
│   │   ├── Entity/            # 7 entidades Doctrine
│   │   ├── Repository/        # Repositorios personalizados
│   │   ├── Service/           # Lógica de negocio
│   │   └── Validator/         # Validaciones zootécnicas
│   ├── config/                # Configuración Symfony
│   ├── Dockerfile            # Imagen Docker con PHP-FPM
│   ├── nginx.conf            # Configuración Nginx
│   └── README-USO.md         # 📖 Documentación completa
├── frontend-web/              # Aplicación React ✅
│   ├── src/
│   │   ├── componentes/       # 10 componentes React
│   │   ├── servicios/         # APIs y utilidades
│   │   ├── contextos/         # Context API
│   │   └── utilidades/        # Helpers
│   └── README.md
├── base-de-datos/             # Scripts SQL Oracle
│   ├── esquemas/              # Definición de tablas
│   ├── procedimientos/        # Triggers y funciones
│   └── vistas/                # Vistas de reportes
├── documentacion/             # Docs técnicas
│   ├── 01-arquitectura-del-sistema.md
│   ├── 02-reglas-de-negocio-zootecnicas.md
│   ├── 03-plan-de-implementacion.md
│   └── 04-guia-inicio-rapido.md
├── scripts/                   # Scripts de utilidad
│   └── start.sh              # 🚀 Script de inicio automático
└── docker-compose.dev.yml    # Configuración Docker Compose
```

## 🚀 Inicio Rápido

### Opción 1: Script Automático (Recomendado)

```bash
cd "/home/theglamcity/Downloads/Proyecto Caprino"
./scripts/start.sh
```

Este script:
- ✅ Inicia Oracle Database
- ✅ Configura el listener
- ✅ Inicia Symfony Backend
- ✅ Verifica que todo funcione
- ✅ Muestra el estado del sistema

### Opción 2: Manual

```bash
# 1. Iniciar Oracle
docker start caprino_oracle_dev
sleep 30

# 2. Recargar listener
docker exec caprino_oracle_dev lsnrctl reload

# 3. Iniciar Symfony
docker start caprino_symfony_dev
sleep 10

# 4. Verificar
curl http://localhost:8000/api
```

## 📡 Probar el Sistema

### Verificar Backend

```bash
# API Platform entrypoint
curl http://localhost:8000/api

# Listar animales
curl http://localhost:8000/api/animals

# Listar razas
curl http://localhost:8000/api/razas
```

### Iniciar Frontend

```bash
cd frontend-web
npm install  # Solo la primera vez
npm run dev
```

Abre http://localhost:5173 en tu navegador.

## 📚 Documentación Detallada

- **Backend:** Ver [backend-symfony/README-USO.md](backend-symfony/README-USO.md) para:
  - Comandos Docker completos
  - Endpoints de API disponibles
  - Comandos Doctrine
  - Solución de problemas
  - Configuración de Oracle

- **Arquitectura:** Ver [documentacion/01-arquitectura-del-sistema.md](documentacion/01-arquitectura-del-sistema.md)

- **Reglas de Negocio:** Ver [documentacion/02-reglas-de-negocio-zootecnicas.md](documentacion/02-reglas-de-negocio-zootecnicas.md)

- **Plan de Implementación:** Ver [documentacion/03-plan-de-implementacion.md](documentacion/03-plan-de-implementacion.md)

## 🔧 Tecnologías Utilizadas

### Backend
- **Symfony 6.4.30 LTS** - Framework PHP
- **API Platform 3.4.17** - API REST automática
- **Doctrine ORM 2.20** - ORM para PHP
- **Oracle Database 21c XE** - Base de datos empresarial
- **PDO_OCI** - Driver PHP para Oracle
- **Nginx + PHP-FPM** - Servidor web
- **Docker** - Contenedores

### Frontend Web
- **React 18** - Biblioteca UI
- **Vite 5** - Build tool
- **Tailwind CSS 3** - Framework CSS
- **Lucide React** - Iconos
- **React Router** - Navegación

### Móvil (Pendiente)
- **Capacitor** - Framework híbrido
- **Android/iOS** - Plataformas objetivo

## 🎯 Funcionalidades Principales

### Gestión de Animales
- ✅ Registro completo de cabras
- ✅ Seguimiento genealógico
- ✅ Control de peso y desarrollo
- ✅ Historial reproductivo
- ✅ Registro de producción de leche
- ✅ Historial veterinario

### Análisis y Reportes
- ⏳ Reportes de producción
- ⏳ Análisis genealógico
- ⏳ Indicadores zootécnicos
- ⏳ Gráficas y estadísticas

### Sistema
- ✅ API REST completa
- ⏳ Autenticación JWT
- ⏳ Roles y permisos
- ⏳ Backup automático
- ⏳ Notificaciones

## 🐛 Solución de Problemas Comunes

### Oracle no inicia
```bash
docker logs caprino_oracle_dev
docker restart caprino_oracle_dev
```

### Symfony da error 500
```bash
docker logs caprino_symfony_dev | tail -30
docker restart caprino_symfony_dev
```

### No conecta a la base de datos
```bash
# Verificar listener
docker exec caprino_oracle_dev lsnrctl services | grep XEPDB1

# Recargar si no aparece
docker exec caprino_oracle_dev lsnrctl reload
```

### Ver todos los logs
```bash
docker logs -f caprino_symfony_dev
docker logs -f caprino_oracle_dev
```

## 📊 Estado de las Tablas

Verificar tablas creadas:
```bash
docker exec caprino_oracle_dev bash -c \
  "echo 'SELECT table_name FROM user_tables ORDER BY table_name;' | \
   sqlplus -s caprino_user/CaprinoPass2025@XEPDB1"
```

Debería mostrar:
- ANIMAL
- GENEALOGIA
- PESAJE
- PRODUCCION_LECHE
- RAZA
- REPRODUCCION
- SALUD

## 🔐 Seguridad

⚠️ **IMPORTANTE:** Este es un entorno de desarrollo. Las contraseñas están en texto plano.

Para producción:
1. Usar variables de entorno
2. Usar Docker secrets
3. Configurar HTTPS
4. Implementar rate limiting
5. Configurar firewall

## 🚧 Próximos Pasos

1. ✅ ~~Backend funcional con Oracle~~
2. ✅ ~~Frontend React completado~~
3. ⏳ Conectar frontend con backend
4. ⏳ Implementar autenticación JWT
5. ⏳ Crear datos de prueba
6. ⏳ Desarrollar app móvil
7. ⏳ Tests unitarios e integración
8. ⏳ Configuración de producción
9. ⏳ CI/CD
10. ⏳ Documentación de API (OpenAPI)

## 👨‍💻 Desarrollo

### Detener servicios
```bash
docker stop caprino_symfony_dev caprino_oracle_dev
```

### Reconstruir backend (después de cambios)
```bash
cd backend-symfony
docker build --network host -t caprino-symfony:dev .
docker rm -f caprino_symfony_dev
docker run -d --name caprino_symfony_dev --network host caprino-symfony:dev
```

### Limpiar cache
```bash
docker exec caprino_symfony_dev rm -rf /app/var/cache/*
docker restart caprino_symfony_dev
```

## Fases de Implementación

### ✅ Fase 0: Análisis Zootécnico
Definición de procesos reales y requisitos del sector caprino - **COMPLETADO**

### ✅ Fase 1: Modelado de Datos
Diseño profesional de base de datos Oracle con integridad referencial - **COMPLETADO**
- 7 tablas creadas y validadas
- Secuencias automáticas configuradas

### ✅ Fase 2: Backend Symfony
Desarrollo de API REST con validaciones de negocio estrictas - **COMPLETADO**
- API Platform configurado
- Repositorios personalizados creados
- Validadores zootécnicos implementados

### ✅ Fase 3: Frontend Web
Panel administrativo con dashboards y reportes analíticos - **COMPLETADO**
- 10 componentes React funcionales
- Diseño responsivo con Tailwind CSS
- SelectPersonalizado implementado

### 🔄 Fase 4: Integración Frontend-Backend
Conexión de React con API Symfony - **EN PROGRESO**
- Servicios API por implementar
- Autenticación JWT pendiente

### ⏳ Fase 5: Aplicación Móvil
App de campo con funcionamiento offline para registro en corrales - **PENDIENTE**

### ⏳ Fase 6: Pruebas y Validación
Validación técnica y zootécnica con casos reales - **PENDIENTE**

### ⏳ Fase 7: Despliegue
Puesta en producción con configuración profesional - **PENDIENTE**

## 📄 Licencia

Este proyecto es para uso educativo y de desarrollo.

## 🆘 Soporte

Si encuentras problemas:
1. Revisa la documentación en [backend-symfony/README-USO.md](backend-symfony/README-USO.md)
2. Verifica los logs con `docker logs`
3. Ejecuta `./scripts/start.sh` para reiniciar todo
4. Consulta la sección de solución de problemas

---

**Sistema desarrollado con ❤️ para la gestión zootécnica caprina**

*Última actualización: 28 de diciembre de 2024*
