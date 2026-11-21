/**
 * Cabeza de cabra en el mismo estilo de línea que Lucide (que no trae cabra).
 * `sexo="macho"` dibuja cuernos más grandes y barba.
 */
export default function IconoCabra({ sexo = 'hembra', className = 'w-6 h-6', strokeWidth = 1.8 }) {
  const macho = sexo === 'macho';
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden="true">
      {macho ? (
        <>
          <path d="M8.6 6.6C7.4 3.6 4.6 2.4 2.6 3.4c1.6.4 2.8 1.6 3.2 3.4" />
          <path d="M15.4 6.6c1.2-3 4-4.2 6-3.2-1.6.4-2.8 1.6-3.2 3.4" />
        </>
      ) : (
        <>
          <path d="M8.5 6.6C8 4.6 6.8 3.3 5.2 2.9" />
          <path d="M15.5 6.6c.5-2 1.7-3.3 3.3-3.7" />
        </>
      )}
      <path d="M7.7 8.7 3.3 7.9c.6 1.8 2 2.9 4.1 3.1" />
      <path d="m16.3 8.7 4.4-.8c-.6 1.8-2 2.9-4.1 3.1" />
      <path d="M8 7.6c1-1.2 2.4-1.8 4-1.8s3 .6 4 1.8l.4 5.2c0 3.6-2.2 6.8-4.4 7.8-2.2-1-4.4-4.2-4.4-7.8Z" />
      <circle cx="10.2" cy="11.2" r=".7" fill="currentColor" stroke="none" />
      <circle cx="13.8" cy="11.2" r=".7" fill="currentColor" stroke="none" />
      <path d="M11 17.2h2" />
      {macho && <path d="m11 20.3 1 2.4 1-2.4" />}
    </svg>
  );
}
