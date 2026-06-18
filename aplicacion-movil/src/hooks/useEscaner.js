/**
 * Hook de escáner de códigos (QR / código de barras de la chapeta).
 *
 * Usa @capacitor-community/barcode-scanner, que SOLO funciona en dispositivo
 * nativo. En el navegador (`npm run dev`) `disponible` es false y la pantalla
 * ofrece la entrada manual del código.
 */

import { useCallback, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export function useEscaner() {
  const [escaneando, setEscaneando] = useState(false);
  const disponible = Capacitor.isNativePlatform();

  /**
   * Abre la cámara y devuelve el contenido escaneado, o null si se cancela.
   * @returns {Promise<string|null>}
   */
  const escanear = useCallback(async () => {
    if (!disponible) {
      throw new Error('El escáner solo está disponible en el dispositivo móvil.');
    }

    // Import dinámico para no romper el bundle web (el plugin asume entorno nativo).
    const { BarcodeScanner } = await import('@capacitor-community/barcode-scanner');

    try {
      const permiso = await BarcodeScanner.checkPermission({ force: true });
      if (!permiso.granted) {
        throw new Error('Permiso de cámara denegado.');
      }

      setEscaneando(true);
      // El escáner es transparente: el body debe quedar visible.
      document.body.classList.add('escaner-activo');
      await BarcodeScanner.hideBackground();

      const resultado = await BarcodeScanner.startScan();
      return resultado?.hasContent ? resultado.content : null;
    } finally {
      setEscaneando(false);
      document.body.classList.remove('escaner-activo');
      BarcodeScanner.showBackground();
      BarcodeScanner.stopScan();
    }
  }, [disponible]);

  return { escanear, escaneando, disponible };
}
