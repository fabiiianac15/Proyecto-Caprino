import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ProveedorAuth } from '@contextos/AuthContext';
import { ProveedorAvisos } from '@/ui/Avisos';
import App from './App';
// Tipografías de la guía (solo alfabeto latino para que el APK pese poco)
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/manrope/latin-700.css';
import '@fontsource/manrope/latin-800.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProveedorAvisos>
        <ProveedorAuth>
          <App />
        </ProveedorAuth>
      </ProveedorAvisos>
    </BrowserRouter>
  </React.StrictMode>
);
