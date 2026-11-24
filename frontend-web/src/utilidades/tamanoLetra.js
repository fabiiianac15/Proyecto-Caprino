// Tamaño de letra de todo el sistema. Tailwind trabaja en rem, así que al
// cambiar el tamaño de la raíz crecen textos, botones y campos a la vez.
const CLAVE = 'capriva.letra';
export const TAMANOS = [
  { valor: 'normal', etiqueta: 'A', titulo: 'Letra normal' },
  { valor: 'grande', etiqueta: 'A+', titulo: 'Letra grande' },
  { valor: 'muy-grande', etiqueta: 'A++', titulo: 'Letra muy grande' },
];

export const leerLetra = () => localStorage.getItem(CLAVE) || 'grande';

export const aplicarLetra = (valor = leerLetra()) => {
  document.documentElement.dataset.letra = valor;
  localStorage.setItem(CLAVE, valor);
  window.dispatchEvent(new CustomEvent('capriva:letra', { detail: valor }));
};
