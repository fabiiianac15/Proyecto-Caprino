/**
 * Contexto de autenticación para manejar sesión de usuario
 */

import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

// Usuario de prueba para testear
const USUARIO_PRUEBA = {
  codigo: 'ADM001',
  nombre: 'Juan Pérez García',
  email: 'juan.perez@institucion.edu',
  rol: 'administrador',
  password: 'Admin123!'
};

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Verificar si hay sesión guardada al cargar
  useEffect(() => {
    const sesionGuardada = localStorage.getItem('usuario');
    const recordarme = localStorage.getItem('recordarme') === 'true';
    
    if (sesionGuardada && recordarme) {
      setUsuario(JSON.parse(sesionGuardada));
    }
    setCargando(false);
  }, []);

  /**
   * Inicia sesión con credenciales
   */
  const iniciarSesion = (email, password, recordar = false) => {
    // Validar contra usuario de prueba
    if (email === USUARIO_PRUEBA.email && password === USUARIO_PRUEBA.password) {
      const usuarioSesion = {
        codigo: USUARIO_PRUEBA.codigo,
        nombre: USUARIO_PRUEBA.nombre,
        email: USUARIO_PRUEBA.email,
        rol: USUARIO_PRUEBA.rol
      };
      
      setUsuario(usuarioSesion);
      
      if (recordar) {
        localStorage.setItem('usuario', JSON.stringify(usuarioSesion));
        localStorage.setItem('recordarme', 'true');
      } else {
        sessionStorage.setItem('usuario', JSON.stringify(usuarioSesion));
      }
      
      return { exito: true, mensaje: 'Inicio de sesión exitoso' };
    }
    
    return { exito: false, mensaje: 'Credenciales incorrectas' };
  };

  /**
   * Registra un nuevo usuario (simulado)
   */
  const registrarUsuario = (datos) => {
    // Por ahora solo simula el registro
    // Más adelante se conectará al backend
    console.log('Registro de usuario:', datos);
    
    // Simular registro exitoso
    return { 
      exito: true, 
      mensaje: 'Usuario registrado exitosamente. Ya puedes iniciar sesión.' 
    };
  };

  /**
   * Cierra la sesión actual
   */
  const cerrarSesion = () => {
    setUsuario(null);
    localStorage.removeItem('usuario');
    localStorage.removeItem('recordarme');
    sessionStorage.removeItem('usuario');
  };

  const value = {
    usuario,
    cargando,
    iniciarSesion,
    registrarUsuario,
    cerrarSesion,
    estaAutenticado: !!usuario
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
