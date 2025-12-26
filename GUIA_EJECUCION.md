# Guía para Probar la Aplicación Web

## 📋 Requisitos Previos

Antes de ejecutar la aplicación, asegúrate de tener instalado:

1. **Node.js** (versión 18 o superior)
   - Verifica: `node --version`
   - Descarga: https://nodejs.org/

2. **npm** (viene con Node.js)
   - Verifica: `npm --version`

## 🚀 Pasos para Ejecutar el Frontend

### 1. Navega a la carpeta del frontend

```bash
cd "/home/theglamcity/Downloads/Proyecto Caprino/frontend-web"
```

### 2. Instala las dependencias

```bash
npm install
```

Este comando instalará todas las bibliotecas necesarias:
- React y React Router
- Tailwind CSS para estilos
- Lucide React para iconos
- React Query para manejo de datos
- Recharts para gráficos
- Axios para peticiones HTTP

### 3. Inicia el servidor de desarrollo

```bash
npm run dev
```

La aplicación se abrirá automáticamente en tu navegador en:
**http://localhost:5173**

### 4. ¡Explora la aplicación!

Podrás ver:
- ✅ **Dashboard** - Panel principal con estadísticas
- ✅ **Módulo de Animales** - Lista y registro de animales
- ✅ **Módulo de Producción** - Registro de producción de leche
- ✅ **Módulo de Reproducción** - Gestión de servicios, diagnósticos y partos
- ✅ **Notificaciones** - Alertas del sistema
- ⏳ **Módulo de Salud** - En desarrollo

## ⚠️ Importante

### El Backend NO está funcionando aún

La aplicación web se verá y funcionará, PERO:
- ❌ **No se conectará a una base de datos real**
- ❌ **No podrás guardar datos**
- ❌ **Las peticiones a la API fallarán**

Esto es normal porque **aún no hemos configurado el backend Symfony**.

### Lo que SÍ podrás ver:

✅ Toda la interfaz de usuario
✅ Todos los formularios
✅ La navegación entre páginas
✅ El diseño responsive (móvil y desktop)
✅ Las validaciones del frontend
✅ Los componentes y estilos

### Lo que NO funcionará:

❌ Cargar datos desde el servidor
❌ Guardar registros
❌ Ver animales existentes
❌ Generar reportes con datos reales

## 📱 Vista Previa Sin Backend

Si quieres probar con datos de prueba (simulados), puedes:

1. Ver el diseño y navegación
2. Probar los formularios (aunque no se guarden)
3. Ver las validaciones de campos
4. Revisar que todo se vea bien visualmente

## 🔧 Próximos Pasos para Tener Todo Funcionando

Para tener la aplicación completamente funcional necesitas:

### 1. **Configurar Oracle Database**
   - Instalar Oracle 19c o usar Oracle XE (Express Edition)
   - Ejecutar los scripts SQL de la carpeta `base-de-datos/`

### 2. **Configurar el Backend Symfony**
   - Instalar PHP 8.2+
   - Instalar Composer
   - Configurar la conexión a Oracle
   - Instalar dependencias de Symfony

### 3. **Conectar Frontend con Backend**
   - El archivo `.env` ya está configurado para conectar a `http://localhost:8000/api`

## 🐳 Alternativa: Usar Docker (Recomendado)

Si tienes Docker instalado, es mucho más fácil:

```bash
# Desde la raíz del proyecto
docker-compose up
```

Esto iniciará:
- Oracle Database
- Backend Symfony
- Frontend React

Pero necesitas tener Docker y Docker Compose instalados.

## 📞 Comandos Útiles

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Previsualizar la versión de producción
npm run preview

# Verificar errores de código
npm run lint

# Corregir errores automáticamente
npm run lint:fix
```

## 🎨 Tecnologías Usadas en el Frontend

- **React 18** - Biblioteca de interfaces
- **Vite 5** - Build tool ultrarrápido
- **Tailwind CSS 3** - Framework de estilos
- **React Router 6** - Navegación entre páginas
- **React Query** - Gestión de estado del servidor
- **Lucide React** - Iconos modernos
- **Recharts** - Gráficos y visualizaciones
- **Axios** - Cliente HTTP

## ✅ Resumen

**Para solo ver la interfaz:**
```bash
cd "/home/theglamcity/Downloads/Proyecto Caprino/frontend-web"
npm install
npm run dev
```

**Para tener todo funcionando completo:**
Necesitas también configurar Oracle + Symfony (backend)

¡La aplicación web ya está lista para ejecutarse visualmente! 🎉
