/**
 * Contexto de autenticación para manejar sesión de usuario con JWT
 */

import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const USE_MOCK_AUTH = false; // Autenticación real con backend

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Verificar si hay sesión guardada al cargar
  useEffect(() => {
    const tokenGuardado = localStorage.getItem('token');
    const usuarioGuardado = localStorage.getItem('usuario');

    if (tokenGuardado) {
      setToken(tokenGuardado);
      if (usuarioGuardado) {
        setUsuario(JSON.parse(usuarioGuardado));
      }
      if (!USE_MOCK_AUTH) {
        verificarToken(tokenGuardado);
      } else {
        setCargando(false);
      }
    } else {
      setCargando(false);
    }
  }, []);

  /**
   * Verifica si el token sigue siendo válido
   */
  const verificarToken = async (tokenVerificar) => {
    try {
      const response = await fetch(`${API_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${tokenVerificar}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsuario(data);
        localStorage.setItem('usuario', JSON.stringify(data));
      } else {
        // Token inválido (401/403): limpiar sesión
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        setToken(null);
        setUsuario(null);
      }
    } catch {
      // Error de red: mantener sesión con los datos cacheados, no desloguear
    } finally {
      setCargando(false);
    }
  };

  /**
   * Inicia sesión con credenciales
   */
  const iniciarSesion = async (email, password, recordar = false) => {
    setError(null);
    setCargando(true);

    try {
      // Modo MOCK para desarrollo sin backend
      if (USE_MOCK_AUTH) {
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Crear usuario mock
        const mockUser = {
          id: 1,
          email: email,
          nombre: email.split('@')[0],
          apellido: 'Usuario',
          roles: ['ROLE_USER']
        };
        
        const mockToken = 'mock_token_' + Date.now();
        
        setToken(mockToken);
        setUsuario(mockUser);
        
        if (recordar) {
          localStorage.setItem('token', mockToken);
          localStorage.setItem('usuario', JSON.stringify(mockUser));
        }
        
        setCargando(false);
        return { success: true };
      }

      // Código real para backend
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Credenciales inválidas');
      }

      const data = await response.json();

      // Lexik JWT solo devuelve {"token":"..."}, hay que pedir los datos del usuario
      setToken(data.token);
      localStorage.setItem('token', data.token);

      const meResponse = await fetch(`${API_URL}/me`, {
        headers: { 'Authorization': `Bearer ${data.token}` }
      });

      if (meResponse.ok) {
        const userData = await meResponse.json();
        setUsuario(userData);
        localStorage.setItem('usuario', JSON.stringify(userData));
      }

      return { success: true };
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setCargando(false);
    }
  };

  /**
   * Registra un nuevo usuario
   */
  const registrarse = async (datosUsuario) => {
    setError(null);
    setCargando(true);

    try {
      // Modo MOCK para desarrollo sin backend
      if (USE_MOCK_AUTH) {
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Después de "registrarse", iniciar sesión automáticamente
        setCargando(false);
        return await iniciarSesion(datosUsuario.email, datosUsuario.password, true);
      }

      // Código real para backend
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosUsuario)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar usuario');
      }

      // Si hay token (registro exitoso con auto-login), guardar sesión
      if (data.token && data.user) {
        setToken(data.token);
        setUsuario(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.user));
      }

      // Retornar éxito con datos del usuario
      return { 
        success: true, 
        message: data.message || 'Usuario registrado exitosamente',
        token: data.token,
        user: data.user
      };
    } catch (error) {
      console.error('Error al registrarse:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setCargando(false);
    }
  };

  /**
   * Cierra la sesión del usuario
   */
  const cerrarSesion = () => {
    setUsuario(null);
    setToken(null);
    setError(null);
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  };

  /**
   * Verifica si el usuario está autenticado
   */
  const estaAutenticado = () => {
    return usuario !== null && token !== null;
  };

  /**
   * Verifica si el usuario tiene un rol específico
   */
  const tieneRol = (rol) => {
    return usuario?.roles?.includes(rol) || false;
  };

  const valor = {
    usuario,
    token,
    cargando,
    error,
    iniciarSesion,
    registrarse,
    cerrarSesion,
    estaAutenticado,
    tieneRol
  };

  return (
    <AuthContext.Provider value={valor}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para usar el contexto de autenticación
 */
export const useAuth = () => {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return contexto;
};

export default AuthContext;
