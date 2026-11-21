/**
 * Foto del animal guardada en el servidor (/uploads/animales/…). Si no tiene
 * foto o no carga (sin señal), se ve una cabeza de cabra sobre marfil: nunca
 * un recuadro roto.
 */
import { useState } from 'react';
import { origenServidor } from '@servicios/config';
import IconoCabra from './IconoCabra';

export const urlFoto = (animal) => {
  const f = animal?.fotoUrl;
  if (!f) return null;
  if (/^(https?:|data:)/i.test(f)) return f;
  return `${origenServidor()}${f.startsWith('/') ? '' : '/'}${f}`;
};

export default function FotoAnimal({ animal, className = 'w-16 h-16 rounded-xl', iconoClase = 'w-8 h-8', alt }) {
  const [fallo, setFallo] = useState(false);
  const src = urlFoto(animal);
  if (!src || fallo) {
    return (
      <span className={`bg-relleno text-salvia flex items-center justify-center shrink-0 overflow-hidden ${className}`} aria-hidden="true">
        <IconoCabra sexo={animal?.sexo} className={iconoClase} />
      </span>
    );
  }
  return (
    <img src={src} alt={alt ?? ''} loading="lazy" decoding="async" onError={() => setFallo(true)}
      className={`object-cover bg-relleno shrink-0 ${className}`} />
  );
}
