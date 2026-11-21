/** @type {import('tailwindcss').Config} */
// Los colores son roles (no valores fijos): cambian solos entre modo claro y
// oscuro mediante las variables CSS definidas en src/index.css.
const rol = (v) => `rgb(var(--${v}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        fondo: rol('fondo'),
        tarjeta: rol('tarjeta'),
        elevado: rol('elevado'),
        texto: rol('texto'),
        secundario: rol('secundario'),
        terciario: rol('terciario'),
        separador: rol('separador'),
        relleno: rol('relleno'),
        acento: rol('acento'),
        'sobre-acento': rol('sobre-acento'),
        critico: rol('critico'),
        aviso: rol('aviso'),
        chapeta: rol('chapeta'),
        marca: rol('marca'),
        'sobre-marca': rol('sobre-marca'),
        salvia: rol('salvia'),
        ocre: rol('ocre'),
        exito: rol('exito'),
        info: rol('info'),
      },
      fontFamily: {
        // Fuentes incluidas en la app (@fontsource): funcionan sin internet
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
        titulo: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', '"SF Mono"', '"Roboto Mono"', 'Menlo', 'monospace'],
      },
      borderRadius: { lista: '16px' },
    },
  },
  plugins: [],
};
