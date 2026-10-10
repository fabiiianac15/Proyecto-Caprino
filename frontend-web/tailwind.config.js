/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta de colores para el sistema
        primario: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        secundario: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        neutro: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      // Grises neutros del sistema. El 400 y el 500 se oscurecieron para que el
      // texto secundario pequeño cumpla 4,5:1 sobre blanco (#76767C da 4,5:1).
      gray: {
        50: '#f9f9fb',
        100: '#f2f2f7',
        200: '#e5e5ea',
        300: '#d1d1d6',
        400: '#76767c',
        500: '#636366',
        600: '#48484a',
        700: '#3a3a3c',
        800: '#2c2c2e',
        900: '#1d1d1f',
      },
      fontFamily: {
        // Tipografía del sistema: San Francisco en Apple, Segoe en Windows, Roboto en Android
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Segoe UI Variable Text"', '"Segoe UI"', 'Roboto', 'Inter', 'system-ui', 'sans-serif'],
      },
      // Sombras suaves en dos capas: un borde casi invisible y una difusa
      boxShadow: {
        sm: '0 0 0 0.5px rgb(0 0 0 / 0.05), 0 1px 2px rgb(0 0 0 / 0.04)',
        DEFAULT: '0 0 0 0.5px rgb(0 0 0 / 0.05), 0 2px 6px rgb(0 0 0 / 0.05)',
        md: '0 0 0 0.5px rgb(0 0 0 / 0.05), 0 4px 14px rgb(0 0 0 / 0.07)',
        lg: '0 0 0 0.5px rgb(0 0 0 / 0.05), 0 10px 28px rgb(0 0 0 / 0.09)',
        xl: '0 0 0 0.5px rgb(0 0 0 / 0.06), 0 18px 44px rgb(0 0 0 / 0.12)',
        '2xl': '0 0 0 0.5px rgb(0 0 0 / 0.06), 0 28px 70px rgb(0 0 0 / 0.20)',
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      // Radios más amplios y progresivos (controles 10, tarjetas 14-20, hojas 26)
      borderRadius: {
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
        xl: '14px',
        '2xl': '20px',
        '3xl': '26px',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
