// Tamaño de letra de la app: escala las clases t-* (ver index.css).
const CLAVE = 'capriva.letra';
export const TAMANOS = [
  { valor: 'normal', etiqueta: 'Normal' },
  { valor: 'grande', etiqueta: 'Grande' },
  { valor: 'muy-grande', etiqueta: 'Muy grande' },
];
export const leerLetra = () => localStorage.getItem(CLAVE) || 'grande';
export const aplicarLetra = (valor = leerLetra()) => {
  document.documentElement.dataset.letra = valor;
  localStorage.setItem(CLAVE, valor);
};
