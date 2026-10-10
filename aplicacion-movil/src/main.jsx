import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ProveedorAuth } from '@contextos/AuthContext';
import { ProveedorAvisos } from '@/ui/Avisos';
import App from './App';
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
