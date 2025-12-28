# Backend Symfony - Sistema de Gestión Zootécnica Caprina

## ✅ Estado Actual

**¡Sistema completamente funcional!**

- ✅ Symfony 6.4.30 LTS
- ✅ PHP 8.2.30 con PHP-FPM
- ✅ Nginx como reverse proxy
- ✅ Oracle Database 21c Express Edition
- ✅ PDO_OCI conectado exitosamente
- ✅ Doctrine ORM con 7 tablas creadas
- ✅ API Platform 3.4.17 funcionando

## 📋 Configuración Actual

### Base de Datos Oracle

- **Host:** 192.168.101.20
- **Puerto:** 1521
- **Servicio:** XEPDB1
- **Usuario:** caprino_user
- **Contraseña:** CaprinoPass2025
- **Charset:** AL32UTF8

### Tablas Creadas

1. **ANIMAL** - Gestión de animales
2. **RAZA** - Catálogo de razas
3. **GENEALOGIA** - Árbol genealógico
4. **REPRODUCCION** - Control reproductivo
5. **PRODUCCION_LECHE** - Registro de producción
6. **PESAJE** - Control de peso
7. **SALUD** - Historial veterinario

## 🚀 Comandos para Uso Diario

### Iniciar Servicios

```bash
# 1. Iniciar Oracle Database
cd "/home/theglamcity/Downloads/Proyecto Caprino"
docker start caprino_oracle_dev

# Esperar 30 segundos para que Oracle inicie completamente
sleep 30

# 2. Iniciar Symfony Backend
docker start caprino_symfony_dev

# Esperar 5 segundos
sleep 5
```

### Ver Logs

```bash
# Logs de Symfony
docker logs caprino_symfony_dev

# Logs de Oracle
docker logs caprino_oracle_dev

# Logs en tiempo real
docker logs -f caprino_symfony_dev
```

### Reiniciar Servicios

```bash
# Reiniciar Symfony (si hiciste cambios)
docker restart caprino_symfony_dev

# Reiniciar Oracle
docker restart caprino_oracle_dev
```

### Detener Servicios

```bash
# Detener ambos contenedores
docker stop caprino_symfony_dev caprino_oracle_dev
```

## 🔧 Reconstruir si Cambias Código

Si modificas código de Symfony (entidades, controladores, etc.):

```bash
cd "/home/theglamcity/Downloads/Proyecto Caprino/backend-symfony"

# Reconstruir imagen
docker build --network host -t caprino-symfony:dev .

# Recrear contenedor
docker rm -f caprino_symfony_dev
docker run -d --name caprino_symfony_dev --network host caprino-symfony:dev
```

## 📡 Endpoints de API

### Base URL
```
http://localhost:8000
```

### Endpoints Principales

#### Entrypoint de API Platform
```bash
curl http://localhost:8000/api
```

#### Animales
```bash
# Listar todos
curl http://localhost:8000/api/animals

# Ver uno específico
curl http://localhost:8000/api/animals/1

# Crear (requiere autenticación)
curl -X POST http://localhost:8000/api/animals \
  -H "Content-Type: application/json" \
  -d '{
    "codigoIdentificacion": "CAB-001",
    "nombre": "Canela",
    "sexo": "hembra",
    "fechaNacimiento": "2023-03-15",
    "idRaza": 1
  }'
```

#### Razas
```bash
curl http://localhost:8000/api/razas
```

#### Producción de Leche
```bash
curl http://localhost:8000/api/produccion_leches
```

#### Pesajes
```bash
curl http://localhost:8000/api/pesajes
```

#### Salud
```bash
curl http://localhost:8000/api/saluds
```

#### Reproducción
```bash
curl http://localhost:8000/api/reproduccions
```

#### Genealogía
```bash
curl http://localhost:8000/api/genealogias
```

## 🛠️ Comandos Doctrine Útiles

### Dentro del Contenedor

```bash
# Entrar al contenedor
docker exec -it caprino_symfony_dev bash

# Validar esquema
php bin/console doctrine:schema:validate

# Ver estado de migraciones
php bin/console doctrine:migrations:status

# Ejecutar consulta SQL
php bin/console dbal:run-sql "SELECT COUNT(*) FROM ANIMAL"

# Limpiar cache
php bin/console cache:clear
```

### Crear Nueva Migración

```bash
docker exec caprino_symfony_dev php bin/console make:migration
docker exec caprino_symfony_dev php bin/console doctrine:migrations:migrate
```

## 🔍 Solución de Problemas

### Error: "Could not find driver"

Si ves este error, verifica que PDO_OCI esté activo:

```bash
docker exec caprino_symfony_dev php -m | grep PDO_OCI
```

Debería mostrar: `PDO_OCI`

### Error: "ORA-12514: TNS:listener does not currently know of service"

Esto significa que Oracle no está listo o el listener no tiene XEPDB1 registrado:

```bash
# Verificar servicios registrados
docker exec caprino_oracle_dev lsnrctl services | grep XEPDB1
```

Si no aparece XEPDB1, ejecuta:

```bash
docker exec caprino_oracle_dev lsnrctl reload
```

### Error 502 Bad Gateway

PHP-FPM no está corriendo o crasheó:

```bash
# Ver logs
docker logs caprino_symfony_dev | tail -20

# Reiniciar contenedor
docker restart caprino_symfony_dev
```

### Conectividad Oracle

Prueba la conexión desde PHP:

```bash
docker exec caprino_symfony_dev php -r '
try {
    $pdo = new PDO("oci:dbname=//192.168.101.20:1521/XEPDB1", "caprino_user", "CaprinoPass2025");
    echo "✓ Conexión exitosa\n";
} catch(PDOException $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}'
```

## 🔐 Seguridad - Próximos Pasos

1. **Implementar JWT Authentication:**
   ```bash
   docker exec caprino_symfony_dev php bin/console lexik:jwt:generate-keypair
   ```

2. **Crear usuarios:**
   ```bash
   docker exec caprino_symfony_dev php bin/console make:user
   ```

3. **Proteger endpoints** editando `config/packages/security.yaml`

## 🎨 Conectar Frontend React

En tu proyecto React (`frontend-web`), actualiza la URL del API:

```javascript
// src/servicios/api.js
const API_URL = 'http://localhost:8000';

export const getAnimales = async () => {
  const response = await fetch(`${API_URL}/api/animals`);
  return response.json();
};

export const createAnimal = async (data) => {
  const response = await fetch(`${API_URL}/api/animals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
};
```

## 📊 Verificar que Todo Funciona

```bash
# 1. Verificar que Symfony responde
curl -I http://localhost:8000/api

# Debería devolver: HTTP/1.1 200 OK

# 2. Verificar que Oracle tiene las tablas
docker exec caprino_oracle_dev bash -c \
  "echo 'SELECT table_name FROM user_tables ORDER BY table_name;' | \
   sqlplus -s caprino_user/CaprinoPass2025@XEPDB1"

# Debería mostrar las 7 tablas

# 3. Probar endpoint de animales
curl http://localhost:8000/api/animals

# Debería devolver JSON con estructura de API Platform
```

## 📝 Notas Importantes

### Arquitectura Usada

- **OCI8 deshabilitado** - Causaba Segmentation Faults
- **PDO_OCI activo** - Driver estable para Oracle
- **PHP-FPM + Nginx** - Arquitectura de producción
- **Supervisor** - Gestiona ambos procesos

### IP Hardcodeada

La IP `192.168.101.20` está en:
- `backend-symfony/.env`
- `backend-symfony/config/packages/doctrine.yaml`

Si tu IP cambia, actualiza estos archivos y reconstruye la imagen.

### Contraseñas

**IMPORTANTE:** Las contraseñas están en texto plano para desarrollo. En producción:

1. Usa variables de entorno
2. Usa secrets de Docker
3. Usa un gestor de contraseñas
4. Nunca subas contraseñas a Git

## 🎯 Siguientes Pasos Recomendados

1. ✅ **Backend funcionando** - ¡Completado!
2. 🔄 **Crear datos de prueba** - Insertar razas y animales de ejemplo
3. 🎨 **Conectar frontend** - Hacer que React llame al API
4. 🔐 **Implementar autenticación** - JWT + usuarios
5. 📱 **Aplicación móvil** - Capacitor ya está configurado
6. 🧪 **Tests** - Crear tests unitarios y de integración
7. 📦 **Producción** - Configurar para despliegue real

## 🆘 Soporte

Si algo no funciona:

1. Revisa los logs
2. Verifica que Oracle esté corriendo
3. Verifica conectividad de red
4. Revisa la sección de Solución de Problemas
5. Busca el error específico en la documentación de Symfony/Oracle

---

**¡Sistema listo para desarrollo! 🚀**
