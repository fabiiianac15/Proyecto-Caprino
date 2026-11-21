#!/usr/bin/env bash
# Crea el proyecto Android (la carpeta android/ no se sube al repositorio) y le
# aplica lo que la app necesita: permiso de cámara, tráfico http hacia el
# servidor, e iconos. compilar-apk.sh lo llama si falta android/.
set -e
cd "$(dirname "$0")"

[ -d android ] || npx cap add android

R=android/app/src/main/res
python3 - <<'PY'
p = 'android/app/src/main/AndroidManifest.xml'
s = open(p).read()
if 'usesCleartextTraffic' not in s:
    s = s.replace('<application', '<application\n        android:usesCleartextTraffic="true"', 1)
if 'android.permission.CAMERA' not in s:
    s = s.replace(
        '<uses-permission android:name="android.permission.INTERNET" />',
        '<uses-permission android:name="android.permission.INTERNET" />\n'
        '    <uses-permission android:name="android.permission.CAMERA" />\n'
        '    <uses-feature android:name="android.hardware.camera" android:required="false" />')
open(p, 'w').write(s)
PY
sed -i 's/#FFFFFF/#244B3A/' $R/values/ic_launcher_background.xml

# Iconos y pantalla de inicio a partir de assets/ (necesita ImageMagick)
if command -v magick >/dev/null; then
  for d in "mdpi 48 108" "hdpi 72 162" "xhdpi 96 216" "xxhdpi 144 324" "xxxhdpi 192 432"; do
    set -- $d; h=$(($2 / 2))
    magick assets/icon-only.png -resize ${2}x${2} -depth 8 $R/mipmap-$1/ic_launcher.png
    magick assets/icon-only.png -resize ${2}x${2} -depth 8 \( -size ${2}x${2} xc:black -fill white -draw "circle $h,$h $h,0" \) \
      -alpha off -compose CopyOpacity -composite $R/mipmap-$1/ic_launcher_round.png
    magick assets/icon-foreground.png -resize ${3}x${3} $R/mipmap-$1/ic_launcher_foreground.png
  done
  for f in $(find $R -name "splash.png"); do
    sz=$(magick identify -format "%wx%h" "$f")
    magick assets/splash.png -resize "${sz}^" -gravity center -extent "$sz" -depth 8 "$f"
  done
else
  echo "Aviso: sin ImageMagick quedan los iconos por defecto de Capacitor."
fi
echo "Proyecto Android listo."
