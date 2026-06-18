/**
 * Contexto de autenticación de la app móvil.
 *
 * Expone el usuario actual y las funciones de login/logout. Escucha el evento
 * global 'sesion-expirada' (emitido por el interceptor de api.js ante un 401)
 * para cerrar sesión automáticamente.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  iniciarSesion as loginServicio,
  cerrarSesion as logoutServicio,
  obtenerUsuarioActual,
  estaAutenticado,
} from '@servicios/authAPI';

const AuthContext = createContext(null);

export function ProveedorAuth({ children }) {
  const [usuario, setUsuario] = useState(() => obtenerUsuarioActual());
  const [autenticado, setAutenticado] = useState(() => estaAutenticado());

  const login = useCallback(async (usuarioInput, password) => {
    const { usuario: datos } = await loginServicio(usuarioInput, password);
    setUsuario(datos);
    setAutenticado(true);
    return datos;
  }, []);

  const logout = useCallback(() => {
    logoutServicio();
    setUsuario(null);
    setAutenticado(false);
  }, []);

  useEffect(() => {
    const alExpirar = () => {
      setUsuario(null);
      setAutenticado(false);
    };
    window.addEventListener('sesion-expirada', alExpirar);
    return () => window.removeEventListener('sesion-expirada', alExpirar);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, autenticado, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <ProveedorAuth>');
  return ctx;
};
