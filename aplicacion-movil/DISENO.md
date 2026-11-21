# Diseño de la app móvil

Basado en las Human Interface Guidelines de Apple (skill apple-design). La app es la libreta de campo del hato: registrar rápido en el corral, con una mano, a pleno sol y muchas veces sin señal.

## Dirección visual: Nature Tech (rediseño de noviembre de 2026)

Sigue `documentacion/Capriva_Guia_Redisenio_UI_UX.pdf`. Archivo de Figma con variables, estilos de texto,
componentes y las pantallas de referencia: «Capriva — Rediseño app móvil (Nature Tech)».

### Colores (contraste medido, WCAG)

| Rol | Claro | Oscuro | Uso / contraste |
|-----|-------|--------|-----------------|
| Fondo | `#F6F4ED` fondo cálido | `#141815` | |
| Tarjeta | `#FFFFFF` | `#1F2521` | radio 16 px, sombra verde suave |
| Texto | `#343A35` carbón | `#ECE9E0` | 10,9:1 sobre el fondo |
| Texto secundario | `#5E655E` | `#ACB2A6` | 5,6:1 sobre el fondo |
| Marca (encabezados) | `#244B3A` verde bosque | `#1B362A` | texto blanco 10:1 |
| Acento (botones, selección) | `#244B3A` | `#8CBA92` | en oscuro el verde bosque no se lee: se usa salvia claro con texto oscuro |
| Marfil (rellenos) | `#E8E4D8` | `#2C342E` | |
| Salvia / Ocre | `#78966B` / `#D7A85C` | | ocre = chapeta, texto carbón 5,4:1 |
| Éxito / Aviso / Crítico / Info | `#2E7D4F` / `#8A5A10` / `#B3261E` / `#1D5FA8` | versiones claras | fondo del mismo color al 15 % |

Regla: el verde bosque se reserva para los encabezados; textos, botones y selección usan el rol
`acento`, que se aclara en modo oscuro. El tema sigue al del teléfono.

### Tipografía

Manrope (títulos, cifras) e Inter (texto, formularios), incluidas en la app con `@fontsource`
(funcionan sin internet). Escala: título 30 bold, cifra 32 extrabold, título de pantalla 22,
sección 17 semibold, cuerpo 16, subtítulo 14, nota 13.

### Estados

Etiqueta `ui/Estado.jsx`: siempre ícono + texto (Conectado, Sin conexión, Pendiente, Error, Info).
"Guardado en el teléfono" y "enviado" se distinguen siempre.

## Elemento de firma

La **chapeta**: cada código de animal se muestra como una chapeta de oreja ocre con el código en carbón. Si la cabra no tiene nombre, solo se ve la chapeta, igual a las que se usan en el corral (doble chapeta nueva/vieja).

## Navegación

Barra de pestañas inferior blanca con la pestaña activa en una píldora verde: **Inicio · Rebaño · Evaluar · Ajustes**. El badge de pendientes de sincronizar va en Inicio. El botón atrás de Android navega hacia atrás y en las pestañas raíz sale de la app.

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
