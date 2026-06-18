/**
 * Punto de entrada de la app móvil.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ProveedorAuth } from '@contextos/AuthContext';
import { ProveedorToast } from '@componentes/comunes/Toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProveedorToast>
        <ProveedorAuth>
          <App />
        </ProveedorAuth>
      </ProveedorToast>
    </BrowserRouter>
  </React.StrictMode>
);
