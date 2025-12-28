import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contextos/AuthContext';

/**
 * Componente para proteger rutas que requieren autenticación
 */
const RutaProtegida = ({ children }) => {
  const { estaAutenticado, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!estaAutenticado()) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RutaProtegida;
