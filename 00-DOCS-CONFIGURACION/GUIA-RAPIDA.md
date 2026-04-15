cd# 📘 GUÍA RÁPIDA - Empezar el Proyecto

## 🎯 ¿POR DÓNDE EMPEZAR?

### Si es la PRIMERA VEZ

```
1. Abre Windows Explorer
2. Ve a: C:\Users\USUARIO\Downloads\Proyecto-Caprino\00-SCRIPTS-INSTALACION\
3. Ejecuta los scripts EN ORDEN:
   
   ✅ 01-VERIFICAR-REQUISITOS.bat
   ✅ 02-CONFIGURAR-ORACLE-ENV.bat (Como Administrador)
   ✅ 03-INSTALAR-OCI8.ps1
   ✅ 04-INSTALAR-DEPENDENCIAS-BACKEND.bat
   ✅ 05-INSTALAR-DEPENDENCIAS-FRONTEND.bat
   ✅ 06-INICIAR-ORACLE.ps1 (Como Administrador)
```

**Duración**: ~20 minutos (la mayoría es descargas)

---

### Si YA ESTÁ INSTALADO

```
Cada vez que quieras trabajar:

1. Terminal 1: 07-INICIAR-BACKEND.bat
2. Terminal 2: 08-INICIAR-FRONTEND.bat
3. Navegador: http://localhost:5173/
```

**¡Listo!** Frontend en puerto 5173, Backend en puerto 8000

---

## 📂 CARPETAS IMPORTANTES

```
Proyecto-Caprino/
├── 00-SCRIPTS-INSTALACION/          ← Scripts de instalación
│   ├── 01-VERIFICAR-REQUISITOS.*    ← Empieza aquí
│   ├── 02,03,04,05,06-...           ← Orden 02 a 06
│   └── 07,08-INICIAR-*.bat          ← Para trabajar
│
├── 00-DOCS-CONFIGURACION/           ← Documentación
│   ├── CONFIGURACION-COMPLETA.md    ← Detalles técnicos
│   └── SOLUCION-RAPIDA-GET-VS-POST.md ← Soluciona registro
│
├── backend-symfony/                 ← Backend PHP
│   ├── public/api.php               ← API principal
│   └── .env                         ← Configuración DB
│
├── frontend-web/                    ← Frontend React
│   ├── src/componentes/LoginRegistro.jsx
│   ├── vite.config.js
│   └── package.json
│
└── base-de-datos/                   ← Scripts SQL
    └── esquemas/01-tablas-principales.sql
```

---

## 🚀 INICIO DIARIO

### Paso 1: Oracle
```powershell
# Ejecutar como Administrador
powershell -ExecutionPolicy Bypass -File "06-INICIAR-ORACLE.ps1"
```
Esperar: "✅ Oracle está listo"

### Paso 2: Backend (Terminal 1)
```powershell
# Ejecutar en Terminal 1
07-INICIAR-BACKEND.bat
```
Esperar: "Listening on http://localhost:8000"

### Paso 3: Frontend (Terminal 2)
```powershell
# Ejecutar en Terminal 2 NUEVA
08-INICIAR-FRONTEND.bat
```
Esperar: "ready in XXX ms"

### Paso 4: Navegador
```
Abre: http://localhost:5173/
```

---

## 🔴 PROBLEMA: El Registro No Funciona

Si al presionar "Crear Cuenta" ves:
```
Error: {"error":"Método no permitido. Se requiere POST","received_method":"GET"}
```

**Solución Rápida** (5 minutos):
```
Lee: 00-DOCS-CONFIGURACION/SOLUCION-RAPIDA-GET-VS-POST.md
```

**Resumen**: Tu navegador Brave bloquea POST
- Opción A: Usa Chrome, Firefox o Edge
- Opción B: Deshabilita protecciones de Brave en localhost

---

## 📊 VERIFICAR QUE TODO FUNCIONA

### Test 1: Backend
```
Abre: http://localhost:8000/api/health
Deberías ver:
{
  "status": "ok",
  "database": "connected"
}
```

### Test 2: Frontend
```
Abre: http://localhost:5173/
Deberías ver:
- Formulario de login
- Botón "Registrarse"
```

### Test 3: Base de Datos
```
En PowerShell (Admin):
sqlplus C##caprino/CaprinoPass2025@127.0.0.1:1521/XEPDB1

SELECT COUNT(*) FROM USUARIO;
→ Debería mostrar número de usuarios
```

---

## 🆘 PROBLEMAS COMUNES

| Problema | Solución |
|----------|----------|
| "Puerto 8000 en uso" | Cierra otra instancia: `07-INICIAR-BACKEND.bat` |
| "Puerto 5173 en uso" | Cierra otra instancia: `08-INICIAR-FRONTEND.bat` |
| "No puedo conectar a Oracle" | Ejecuta: `06-INICIAR-ORACLE.ps1` |
| "Registro da error GET" | Lee: `SOLUCION-RAPIDA-GET-VS-POST.md` |
| "Composer error" | Ejecuta: `04-INSTALAR-DEPENDENCIAS-BACKEND.bat` |
| "npm error" | Ejecuta: `05-INSTALAR-DEPENDENCIAS-FRONTEND.bat` |

---

## 📞 ARCHIVOS CLAVE

### Backend
- **api.php** (336 líneas)
  - GET /api/health
  - GET /api/razas
  - GET /api/animales
  - POST /api/auth/register
  - POST /api/auth/login
  - POST /api/animales

### Frontend
- **LoginRegistro.jsx**
  - Formulario de login y registro
  - Maneja autenticación

- **AuthContext.jsx**
  - Gestiona tokens JWT
  - Guarda sesión en localStorage

---

## 🎓 PRÓXIMOS PASOS

Después de que el registro funcione:

1. **Implementar otros módulos**:
   - ModuloPeso.jsx (registro de pesos)
   - ModuloProduccion.jsx (producción de leche)
   - ModuloGenealogia.jsx (árbol genealógico)

2. **Mejorar seguridad**:
   - Cambiar JWT secret en producción
   - Restringir CORS a dominios específicos
   - Agregar rate limiting

3. **Agregar validaciones**:
   - Email verificado
   - Recuperar contraseña
   - 2FA

---

## 💾 Guardar Cambios

```
# Backend
cd backend-symfony
git add .
git commit -m "Cambios al API"

# Frontend
cd frontend-web
git add .
git commit -m "Cambios al contador de cabras"
```

---

## ⏱️ Cronograma Estimado

| Tarea | Tiempo |
|-------|--------|
| Instalación inicial | 20-30 min |
| Verificación | 5 min |
| Solucionar problema POST/GET | 5-10 min |
| Prueba de registro | 2 min |
| **Total** | **~45 min** |

---

🎉 **¡Proyecto listo para usar!**

Para más detalles, ve a `00-DOCS-CONFIGURACION/`
