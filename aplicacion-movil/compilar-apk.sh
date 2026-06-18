#!/usr/bin/env bash
#
# Compila el APK de depuración de la app móvil Caprino.
#
# Usa el JDK 17 portátil y el Android SDK instalados en ~/android-dev
# (no toca el Java/SDK del sistema). Genera el web build, lo sincroniza
# con el proyecto Android y produce el APK, copiándolo a la raíz de
# aplicacion-movil/ como "Gestion-Caprino.apk".
#
# Uso:
#   ./compilar-apk.sh
#
# IMPORTANTE: la URL del backend se toma de aplicacion-movil/.env
# (VITE_API_URL) en el momento de compilar. Si cambias la URL, vuelve
# a ejecutar este script.

set -e
cd "$(dirname "$0")"

# --- Toolchain local (aislado del sistema) ---
export JAVA_HOME="$(ls -d "$HOME"/android-dev/jdk-17* | head -1)"
export ANDROID_SDK_ROOT="$HOME/android-dev/sdk"
export ANDROID_HOME="$ANDROID_SDK_ROOT"
export PATH="$JAVA_HOME/bin:$PATH"

echo "==> JDK:  $JAVA_HOME"
echo "==> SDK:  $ANDROID_SDK_ROOT"
echo "==> API:  $(grep VITE_API_URL .env 2>/dev/null || echo '(.env no encontrado)')"
echo

echo "==> 1/4 Compilando el frontend (vite build)..."
npm run build

echo "==> 2/4 Sincronizando con Android (cap sync)..."
npx cap sync android

echo "==> 3/4 Compilando APK (gradle assembleDebug)..."
( cd android && ./gradlew assembleDebug --no-daemon )

echo "==> 4/4 Copiando APK..."
cp android/app/build/outputs/apk/debug/app-debug.apk ./Gestion-Caprino.apk

echo
echo "✅ APK listo: $(pwd)/Gestion-Caprino.apk"
echo "   Pásalo al celular e instálalo (permite 'orígenes desconocidos')."
