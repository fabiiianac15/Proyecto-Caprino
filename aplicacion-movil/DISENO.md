# Diseño de la app móvil

Basado en las Human Interface Guidelines de Apple (skill apple-design). La app es la libreta de campo del hato: registrar rápido en el corral, con una mano, a pleno sol y muchas veces sin señal.

## Colores (contraste medido, WCAG)

| Rol | Claro | Oscuro | Contraste |
|-----|-------|--------|-----------|
| Fondo agrupado | `#F2F2F7` | `#000000` | |
| Tarjeta / fila | `#FFFFFF` | `#1C1C1E` | |
| Texto principal | `#1C1C1E` | `#FFFFFF` | |
| Texto secundario | `#6E6E73` | `#AEAEB2` | 4,54:1 sobre fondo agrupado; 7,69:1 en oscuro |
| Acento (acciones) | `#1E7B45` | `#4ADE80` | blanco sobre acento 5,28:1 (el verde web `#16A34A` da 3,30:1 y no alcanza); texto `#0B1F12` sobre acento oscuro 9,89:1 |
| Crítico | `#C62828` | `#FF6B6B` | blanco 5,62:1 |
| Aviso | `#B45309` | `#FF9F0A` | 5,02:1 / 8,28:1 |
| Chapeta (firma) | `#F5C518` | `#F5C518` | texto `#1C1C1E` 10,44:1 |

Sin interruptor de tema propio: sigue al sistema (`dark-mode.md`).

## Tipografía

Fuente del sistema (`-apple-system`, Roboto en Android). Escala: título grande 34 bold, título 22 semibold, encabezado 17 semibold, cuerpo 17, subtítulo 15, nota 13, mínimo 12. Sin pesos light.

## Elemento de firma

La **chapeta**: cada código de animal se muestra como una chapeta de oreja amarilla con el código en negro monoespaciado, igual a las que se usan en el corral (doble chapeta nueva/vieja).

## Navegación

Barra de pestañas inferior con desenfoque (único lugar con efecto de vidrio, más la barra superior): **Inicio · Rebaño · Evaluar · Ajustes**. El badge de pendientes de sincronizar va en Inicio. El botón atrás de Android navega hacia atrás y en las pestañas raíz sale de la app.

## Pantallas

- Login con campo "Servidor" (URL configurable; por defecto la de `VITE_API_URL`).
- Inicio: estado de sincronización y acciones rápidas (Salud, Pesaje, Producción, FAMACHA).
- Rebaño: búsqueda, escáner QR, lista con chapetas; ficha del animal con acciones.
- Evaluar, con dos segmentos:
  - Bienestar (MEBA): datos de la visita, indicadores agrupados con criterios 100/55/20/0, conteo con stepper, fotos con la cámara, borrador local y envío.
  - Clasificación lineal: un rasgo por pantalla con su dibujo de referencia y tres opciones grandes, después las 6 fotos por vista y el resumen.
- Ajustes: cuenta, servidor con prueba de conexión, lo que falta por enviar y los datos guardados en el teléfono.

## Técnica

- Fotos en IndexedDB (no en localStorage), tomadas con `@capacitor/camera` a 1600 px y calidad 70.
- Catálogos de bienestar y lineal guardados para trabajar sin red; dibujos de lineal copiados a `public/img/lineal`.
- Las evaluaciones se guardan como borradores locales. Al enviar se crea la evaluación y luego se suben sus fotos una por una; el id remoto y cada foto subida se anotan para continuar donde quedó si se cae la señal.
- Android: `android:usesCleartextTraffic="true"` y permiso de cámara en el manifiesto; el servidor está en AWS y se llega por internet.
- APK con `compilar-apk.sh` (JDK 17 y Android SDK en `~/android-dev`). `preparar-android.sh` crea la carpeta `android/` con permisos e iconos.
