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
    
    if (tokenGuardado && usuarioGuardado) {
      setToken(tokenGuardado);
      setUsuario(JSON.parse(usuarioGuardado));
      
      if (!USE_MOCK_AUTH) {
        // Verificar token con el servidor solo si no es mock
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
      } else {
        // Token inválido o backend no disponible, limpiar sesión
        console.warn('Token inválido o backend no disponible');
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        setToken(null);
        setUsuario(null);
      }
    } catch (error) {
      console.warn('Error verificando token (backend posiblemente no disponible):', error.message);
      // No limpiar sesión en error de red, solo en respuesta 401
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
      const response = await fetch(`${API_URL}/login_check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Credenciales inválidas');
      }

      const data = await response.json();
      
      // Guardar token
      setToken(data.token);
      if (recordar) {
        localStorage.setItem('token', data.token);
      }

      // Obtener datos del usuario
      const userResponse = await fetch(`${API_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${data.token}`
        }
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUsuario(userData);
        
        if (recordar) {
          localStorage.setItem('usuario', JSON.stringify(userData));
        }

        return { success: true };
      } else {
        throw new Error('Error al obtener datos del usuario');
      }
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
      const response = await fetch(`${API_URL}/register`, {
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

      // Después de registrarse, iniciar sesión automáticamente
      return await iniciarSesion(datosUsuario.email, datosUsuario.password, true);
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
