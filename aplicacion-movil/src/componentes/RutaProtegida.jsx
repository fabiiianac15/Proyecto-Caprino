/**
 * Envuelve las rutas que requieren sesión. Si no hay usuario autenticado,
 * redirige a /login.
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '@contextos/AuthContext';

export default function RutaProtegida({ children }) {
  const { autenticado } = useAuth();
  if (!autenticado) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
