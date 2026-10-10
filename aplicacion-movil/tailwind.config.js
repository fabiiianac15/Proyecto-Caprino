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
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'Roboto', '"Helvetica Neue"', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', '"SF Mono"', '"Roboto Mono"', 'Menlo', 'monospace'],
      },
      borderRadius: { lista: '14px' },
    },
  },
  plugins: [],
};
