# Guía de Inicio Rápido

Esta guía te ayudará a iniciar el sistema completo en menos de 5 minutos.

## Requisitos

- Docker y Docker Compose
- Node.js 18+
- Git

## Pasos de Instalación

### 1. Primera Vez - Construir Contenedores

Si acabas de clonar el repositorio:

```bash
cd "Proyecto Caprino"

# Construir imágenes Docker (solo primera vez)
docker-compose -f docker-compose.dev.yml up -d

# Esperar 2-3 minutos a que Oracle inicialice completamente
```

### 2. Iniciar el Sistema

Usa el script automatizado:

```bash
# Dar permisos (solo primera vez)
chmod +x start-all.sh stop-all.sh

# Iniciar todo el sistema
./start-all.sh
```

El script se encarga de:
- Iniciar Oracle Database (Puerto 1521)
- Registrar servicios de Oracle
- Iniciar Backend Symfony (Puerto 8000)
- Instalar dependencias npm (primera vez)
- Iniciar Frontend React (Puerto 5173)
- Verificar que todo funcione

### 3. Acceder a la Aplicación

Abre tu navegador:

- **Aplicación Web:** http://localhost:5173
- **API Backend:** http://localhost:8000/api
- **Documentación API:** http://localhost:8000/api/docs

### 4. Usar el Sistema

El frontend está configurado con **datos mock** para que puedas probar sin necesidad de conexión al backend:

1. Navega a "Mis Cabras" - verás 3 animales de ejemplo
2. Haz clic en "Registrar Nuevo Animal" - verás el formulario completo
3. Prueba los demás módulos (Producción, Reproducción, Salud, Peso)
4. Todos los datos son simulados y no requieren backend activo

### 5. Detener el Sistema

```bash
./stop-all.sh
```

## Solución de Problemas

### Puerto 5173 ya está en uso

```bash
# Matar proceso en puerto 5173
lsof -ti:5173 | xargs kill -9
```

### Oracle no inicia

```bash
# Reiniciar contenedor
docker restart caprino_oracle_dev

# Esperar 30 segundos
sleep 30
```

### Backend no responde

```bash
# Ver logs
docker logs caprino_symfony_dev

# Reiniciar
docker restart caprino_symfony_dev
```

### Frontend muestra pantalla blanca

```bash
cd frontend-web

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Reiniciar
npm run dev
```

## Comandos Útiles

### Ver logs del sistema

```bash
# Log de inicio
tail -f startup.log

# Log del frontend
tail -f frontend.log

# Logs de Docker
docker logs -f caprino_symfony_dev
docker logs -f caprino_oracle_dev
```

### Verificar servicios

```bash
# Ver contenedores activos
docker ps

# Ver puertos en uso
lsof -i :5173  # Frontend
lsof -i :8000  # Backend
lsof -i :1521  # Oracle
```

### Conectar a la base de datos

```bash
# Acceder a Oracle SQL*Plus
docker exec -it caprino_oracle_dev sqlplus caprino_user/CaprinoPass2025@XEPDB1

# Ver tablas
SELECT table_name FROM user_tables;

# Salir
EXIT;
```

### Acceder a Symfony

```bash
# Entrar al contenedor
docker exec -it caprino_symfony_dev bash

# Ver rutas disponibles
php bin/console debug:router

# Limpiar cache
php bin/console cache:clear

# Salir
exit
```

## Estructura Rápida

```
Proyecto Caprino/
├── start-all.sh          <- INICIAR TODO
├── stop-all.sh           <- DETENER TODO
├── backend-symfony/      <- API REST
├── frontend-web/         <- Aplicación React
├── base-de-datos/        <- Scripts SQL
└── documentacion/        <- Docs técnicos
```

## Modo de Desarrollo

### Trabajar solo en Frontend

```bash
cd frontend-web
npm run dev
```

Todos los datos son mock, no necesitas backend activo.

### Trabajar solo en Backend

```bash
# Iniciar solo contenedores
docker start caprino_oracle_dev caprino_symfony_dev

# Ver API
curl http://localhost:8000/api
```

### Cambiar de Mock a Backend Real

Edita `frontend-web/src/servicios/caprino-api.js`:

```javascript
// Cambiar esta línea:
const USE_MOCK_DATA = false;  // false para usar backend real
```

## Próximos Pasos

1. **Explorar la aplicación** - Navega por todos los módulos
2. **Revisar documentación** - Ver carpeta `documentacion/`
3. **Leer el resumen completo** - `RESUMEN_COMPLETO.md`
4. **Entender la arquitectura** - `documentacion/01-arquitectura-del-sistema.md`

## Estado Actual

- ✅ Frontend 100% funcional con datos mock
- ✅ Backend operativo (con limitación Oracle)
- ✅ 10 componentes React completos
- ✅ 7 módulos principales implementados
- ⏳ Autenticación JWT implementada (pendiente de probar)
- ⏳ Conexión persistente Oracle (bug conocido)

## Soporte

Para más información:
- Ver `RESUMEN_COMPLETO.md` - Estado completo del proyecto
- Ver `documentacion/` - Documentación técnica detallada
- Ver `README.md` - Información general

---

**Tiempo estimado de inicio:** 5 minutos  
**Última actualización:** Diciembre 2025
