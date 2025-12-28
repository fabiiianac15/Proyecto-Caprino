# 🔐 Guía Completa - Autenticación JWT Implementada

## ✅ Paso 2 Completado: Autenticación JWT

Se ha implementado un sistema completo de autenticación JWT entre backend Symfony y frontend React.

---

## 📦 Componentes Implementados

### Backend (Symfony)

#### 1. ✅ JWT Keypair Generado
```bash
docker exec caprino_symfony_dev php bin/console lexik:jwt:generate-keypair
```
- Claves creadas en `/app/config/jwt/`
- Passphrase configurada en `.env`

#### 2. ✅ Entidad User Creada
**Ubicación:** `backend-symfony/src/Entity/User.php`
- Implementa `UserInterface` y `PasswordAuthenticatedUserInterface`
- Campos: id, email, roles, password, nombre, apellido, telefono, activo, fechaRegistro
- API Platform configurado con permisos

#### 3. ✅ UserRepository
**Ubicación:** `backend-symfony/src/Repository/UserRepository.php`
- Métodos: `findByEmail()`, `findActivos()`, `upgradePassword()`
- Implementa `PasswordUpgraderInterface`

#### 4. ✅ AuthController
**Ubicación:** `backend-symfony/src/Controller/AuthController.php`
- `POST /api/register` - Registro de usuarios
- `GET /api/me` - Información del usuario autenticado
- Validaciones y hashing de contraseñas

#### 5. ✅ Security.yaml Configurado
**Ubicación:** `backend-symfony/config/packages/security.yaml`
- Firewalls: login, register, api, main
- JWT authentication en `/api`
- Públicas: `/api/login`, `/api/register`
- Protegidas: Todo `/api/*`

#### 6. ✅ Rutas JWT
**Ubicación:** `backend-symfony/config/routes/lexik_jwt.yaml`
- `POST /api/login_check` - Endpoint de login

---

### Frontend (React)

#### 1. ✅ AuthContext Actualizado
**Ubicación:** `frontend-web/src/contextos/AuthContext.jsx`

**Funciones:**
- `iniciarSesion(email, password, recordar)` - Login con JWT
- `registrarse(datosUsuario)` - Registro de nuevo usuario
- `cerrarSesion()` - Logout y limpieza
- `estaAutenticado()` - Verificar si está logueado
- `tieneRol(rol)` - Verificar permisos
- `verificarToken(token)` - Validar token con backend

**Estados:**
- `usuario` - Datos del usuario autenticado
- `token` - JWT token
- `cargando` - Estado de carga
- `error` - Mensajes de error

**Almacenamiento:**
- Token en `localStorage.getItem('token')`
- Usuario en `localStorage.getItem('usuario')`

#### 2. ✅ LoginRegistro Actualizado
**Ubicación:** `frontend-web/src/componentes/LoginRegistro.jsx`

**Cambios:**
- Conectado a endpoints reales de backend
- Formulario de registro adaptado (nombre, apellido, email, teléfono, password)
- Manejo de errores del servidor
- Redirección automática después de login exitoso

#### 3. ✅ RutaProtegida Componente
**Ubicación:** `frontend-web/src/componentes/RutaProtegida.jsx`

Componente HOC para proteger rutas privadas:
```jsx
<RutaProtegida>
  <Dashboard />
</RutaProtegida>
```

Redirige a `/login` si no está autenticado.

#### 4. ✅ API Service con Auth
**Ubicación:** `frontend-web/src/servicios/caprino-api.js`

**Funciones agregadas:**
- `getAuthToken()` - Obtiene token del localStorage
- `getHeaders()` - Headers con Authorization Bearer
- `apiFetch(url, options)` - Fetch wrapper con auth automático

**Actualización:** Todos los endpoints ahora incluyen el token JWT en headers.

#### 5. ✅ App.jsx con Rutas Protegidas
**Ubicación:** `frontend-web/src/App.jsx`

Todas las rutas envueltas en `<RutaProtegida>`:
- `/` - Dashboard
- `/animales` - Lista de animales
- `/produccion` - Módulo de producción
- `/reproduccion` - Módulo de reproducción
- `/salud` - Módulo de salud
- `/peso` - Control de peso
- `/genealogia` - Genealogía
- `/reportes` - Reportes
- `/notificaciones` - Notificaciones

**Ruta pública:**
- `/login` - Login y registro

---

## 🧪 Flujo de Autenticación

### 1. Registro de Usuario

**Frontend:**
```javascript
const datos = {
  nombre: 'Juan',
  apellido: 'Pérez',
  email: 'juan@example.com',
  telefono: '+52123456789',
  password: 'MiPassword123!'
};

const resultado = await registrarse(datos);
// { success: true/false, error?: string }
```

**Backend:**
```
POST /api/register
Body: { nombre, apellido, email, telefono, password }
Response: { message: "Usuario registrado exitosamente", user: {...} }
```

### 2. Inicio de Sesión

**Frontend:**
```javascript
const resultado = await iniciarSesion(
  'juan@example.com',
  'MiPassword123!',
  true  // recordar sesión
);
```

**Backend:**
```
POST /api/login_check
Body: { username: "juan@example.com", password: "..." }
Response: { token: "eyJ0eXAiOiJKV1QiLCJhbGc..." }
```

### 3. Peticiones Autenticadas

Todas las peticiones a `/api/*` incluyen:
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### 4. Verificación de Usuario

**Frontend:**
```javascript
GET /api/me
Headers: { Authorization: "Bearer ..." }
Response: { id, email, nombre, apellido, roles, ... }
```

### 5. Cierre de Sesión

```javascript
cerrarSesion();
// Limpia: token, usuario, localStorage
```

---

## 🔒 Seguridad Implementada

### Backend
- ✅ Passwords hasheados con `bcrypt` (costo auto)
- ✅ JWT firmado con clave privada RSA
- ✅ Tokens con TTL de 1 hora
- ✅ Endpoints públicos: solo `/login` y `/register`
- ✅ Validación de email único
- ✅ Validaciones de entidad con Symfony Validator

### Frontend
- ✅ Token almacenado en localStorage
- ✅ Verificación automática al cargar app
- ✅ Rutas protegidas con redirect
- ✅ Token enviado en cada petición API
- ✅ Limpieza de sesión al cerrar

---

## 🚨 Limitación Actual: Bug Doctrine-Oracle

**Problema:** Doctrine no puede conectarse a Oracle debido al bug de parsing de SERVICE_NAME.

**Estado de la base de datos:**
- ❌ Tabla `USUARIOS` no creada aún (Doctrine no puede ejecutar migrations)
- ✅ Script SQL preparado: `base-de-datos/esquemas/04-tabla-usuarios.sql`

**Workaround:**
1. Crear tabla manualmente cuando Oracle funcione
2. O cambiar a PostgreSQL para desarrollo

**Crear tabla manualmente:**
```bash
docker exec -it caprino_oracle_dev bash
sqlplus caprino_user/CaprinoPass2025@XEPDB1
@/docker-entrypoint-initdb.d/esquemas/04-tabla-usuarios.sql
```

---

## 📝 Próximos Pasos

### Opción A: Resolver Oracle y Probar Auth
1. Solucionar bug Doctrine-Oracle (cambiar a PostgreSQL o custom driver)
2. Crear tabla USUARIOS
3. Registrar usuario de prueba
4. Probar login completo end-to-end

### Opción B: Continuar con Mock
1. Modificar `USE_MOCK_DATA = true` en caprino-api.js
2. Usar auth mock en AuthContext
3. Continuar desarrollo de features

### Opción C: Agregar Más Funcionalidades
1. Refresh tokens
2. Recuperación de contraseña
3. Cambio de contraseña
4. Roles y permisos avanzados
5. Sesiones múltiples
6. Auditoría de accesos

---

## 🎯 Estado Final

| Componente | Estado | Notas |
|-----------|--------|-------|
| JWT Keypair | ✅ Generado | Claves en config/jwt/ |
| Entity User | ✅ Creado | Con roles y timestamps |
| AuthController | ✅ Completo | Register + Me endpoints |
| Security.yaml | ✅ Configurado | JWT + Firewalls |
| AuthContext | ✅ Actualizado | Login/Register/Logout |
| LoginRegistro | ✅ Adaptado | Conectado a backend real |
| RutaProtegida | ✅ Creado | HOC para rutas privadas |
| API Service | ✅ Auth Headers | Token en todas las peticiones |
| App Routing | ✅ Protegido | Todas las rutas con auth |
| Tabla Usuarios | ⏳ Pendiente | Esperando fix Oracle |

---

## 🧪 Cómo Probar (cuando Oracle funcione)

### 1. Registrar usuario:
```bash
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@test.com",
    "password": "Test123!"
  }'
```

### 2. Hacer login:
```bash
curl -X POST http://localhost:8000/api/login_check \
  -H "Content-Type: application/json" \
  -d '{
    "username": "juan@test.com",
    "password": "Test123!"
  }'
```

### 3. Usar token:
```bash
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."

curl http://localhost:8000/api/me \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Probar en frontend:
1. Abrir http://localhost:5173/login
2. Registrar nuevo usuario
3. Hacer login
4. Navegar a módulos (debe estar autenticado)
5. Cerrar sesión
6. Intentar acceder a `/animales` (debe redirigir a login)

---

## 📚 Documentación Relacionada

- [Lexik JWT Bundle](https://github.com/lexik/LexikJWTAuthenticationBundle)
- [Symfony Security](https://symfony.com/doc/current/security.html)
- [API Platform Security](https://api-platform.com/docs/core/security/)
- [React Context API](https://react.dev/learn/passing-data-deeply-with-context)
- [React Router Protected Routes](https://reactrouter.com/en/main/start/tutorial#protected-routes)

---

**✅ Autenticación JWT: 100% Implementada**  
**⏳ Esperando: Resolución de bug Doctrine-Oracle para pruebas completas**  
**🎯 Siguiente: Paso 3 - Resolver Oracle o continuar con otras features**
