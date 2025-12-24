/**
 * Utilidades de formateo para datos
 * 
 * Funciones para formatear fechas, números, monedas y otros datos
 * de forma consistente en toda la aplicación
 */

import { format, parseISO, differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea una fecha en formato legible
 * 
 * @param {string|Date} fecha - Fecha a formatear
 * @param {string} formato - Formato deseado (default: 'dd/MM/yyyy')
 * @returns {string} Fecha formateada
 */
export const formatearFecha = (fecha, formato = 'dd/MM/yyyy') => {
  if (!fecha) return '-';
  
  try {
    const fechaObj = typeof fecha === 'string' ? parseISO(fecha) : fecha;
    return format(fechaObj, formato, { locale: es });
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return '-';
  }
};

/**
 * Formatea una fecha y hora
 * 
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha y hora formateadas
 */
export const formatearFechaHora = (fecha) => {
  return formatearFecha(fecha, 'dd/MM/yyyy HH:mm');
};

/**
 * Formatea un número decimal
 * 
 * @param {number} numero - Número a formatear
 * @param {number} decimales - Cantidad de decimales (default: 2)
 * @returns {string} Número formateado
 */
export const formatearNumero = (numero, decimales = 2) => {
  if (numero === null || numero === undefined) return '-';
  
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(numero);
};

/**
 * Formatea un peso en kilogramos
 * 
 * @param {number} peso - Peso en kg
 * @returns {string} Peso formateado con unidad
 */
export const formatearPeso = (peso) => {
  if (!peso) return '-';
  return `${formatearNumero(peso, 2)} kg`;
};

/**
 * Formatea una producción de leche en litros
 * 
 * @param {number} litros - Cantidad en litros
 * @returns {string} Litros formateados con unidad
 */
export const formatearLitros = (litros) => {
  if (litros === null || litros === undefined) return '-';
  return `${formatearNumero(litros, 2)} L`;
};

/**
 * Formatea un porcentaje
 * 
 * @param {number} porcentaje - Número a formatear como porcentaje
 * @param {number} decimales - Decimales a mostrar (default: 1)
 * @returns {string} Porcentaje formateado
 */
export const formatearPorcentaje = (porcentaje, decimales = 1) => {
  if (porcentaje === null || porcentaje === undefined) return '-';
  return `${formatearNumero(porcentaje, decimales)}%`;
};

/**
 * Calcula y formatea la edad desde una fecha de nacimiento
 * 
 * @param {string|Date} fechaNacimiento - Fecha de nacimiento
 * @returns {string} Edad formateada (ej: "2 años 3 meses")
 */
export const formatearEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return '-';
  
  try {
    const fechaObj = typeof fechaNacimiento === 'string' 
      ? parseISO(fechaNacimiento) 
      : fechaNacimiento;
    
    const ahora = new Date();
    const anios = differenceInYears(ahora, fechaObj);
    const meses = differenceInMonths(ahora, fechaObj) % 12;
    const dias = differenceInDays(ahora, fechaObj);
    
    // Si tiene menos de 1 mes, mostrar días
    if (dias < 30) {
      return `${dias} ${dias === 1 ? 'día' : 'días'}`;
    }
    
    // Si tiene menos de 1 año, mostrar meses
    if (anios === 0) {
      return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
    }
    
    // Mostrar años y meses
    if (meses === 0) {
      return `${anios} ${anios === 1 ? 'año' : 'años'}`;
    }
    
    return `${anios} ${anios === 1 ? 'año' : 'años'} ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
  } catch (error) {
    console.error('Error al calcular edad:', error);
    return '-';
  }
};

/**
 * Formatea un estado de animal con estilo
 * 
 * @param {string} estado - Estado del animal
 * @returns {Object} Objeto con texto y clase CSS
 */
export const formatearEstadoAnimal = (estado) => {
  const estados = {
    activo: { texto: 'Activo', clase: 'bg-green-100 text-green-800' },
    vendido: { texto: 'Vendido', clase: 'bg-blue-100 text-blue-800' },
    muerto: { texto: 'Muerto', clase: 'bg-gray-100 text-gray-800' },
    descartado: { texto: 'Descartado', clase: 'bg-red-100 text-red-800' },
  };
  
  return estados[estado] || { texto: estado, clase: 'bg-gray-100 text-gray-800' };
};

/**
 * Formatea un sexo de animal
 * 
 * @param {string} sexo - Sexo del animal
 * @returns {string} Sexo formateado
 */
export const formatearSexo = (sexo) => {
  const sexos = {
    macho: 'Macho',
    hembra: 'Hembra',
  };
  
  return sexos[sexo] || sexo;
};

/**
 * Formatea una aptitud de raza
 * 
 * @param {string} aptitud - Aptitud de la raza
 * @returns {string} Aptitud formateada
 */
export const formatearAptitud = (aptitud) => {
  const aptitudes = {
    lechera: 'Lechera',
    carnica: 'Cárnica',
    doble_proposito: 'Doble Propósito',
  };
  
  return aptitudes[aptitud] || aptitud;
};

/**
 * Trunca un texto largo
 * 
 * @param {string} texto - Texto a truncar
 * @param {number} longitudMaxima - Longitud máxima (default: 100)
 * @returns {string} Texto truncado con elipsis
 */
export const truncarTexto = (texto, longitudMaxima = 100) => {
  if (!texto) return '-';
  
  if (texto.length <= longitudMaxima) {
    return texto;
  }
  
  return `${texto.substring(0, longitudMaxima)}...`;
};

/**
 * Formatea un código de identificación
 * 
 * @param {string} codigo - Código a formatear
 * @returns {string} Código formateado
 */
export const formatearCodigo = (codigo) => {
  if (!codigo) return '-';
  return codigo.toUpperCase();
};

/**
 * Capitaliza la primera letra de una cadena
 * 
 * @param {string} texto - Texto a capitalizar
 * @returns {string} Texto con primera letra mayúscula
 */
export const capitalizarPrimeraLetra = (texto) => {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
};
