/**
 * Validaciones de datos del frontend
 * 
 * Funciones de validación para formularios y datos de entrada
 */

/**
 * Valida un número de identificación de animal
 * 
 * @param {string} identificacion - Identificación a validar
 * @returns {Object} { valido: boolean, mensaje: string }
 */
export const validarIdentificacion = (identificacion) => {
  if (!identificacion || identificacion.trim() === '') {
    return { valido: false, mensaje: 'La identificación es requerida' };
  }
  
  if (identificacion.length < 3) {
    return { valido: false, mensaje: 'La identificación debe tener al menos 3 caracteres' };
  }
  
  const regex = /^[A-Z0-9-]+$/i;
  if (!regex.test(identificacion)) {
    return { valido: false, mensaje: 'Solo se permiten letras, números y guiones' };
  }
  
  return { valido: true, mensaje: '' };
};

/**
 * Valida un peso
 * 
 * @param {number} peso - Peso en kg
 * @param {number} min - Peso mínimo
 * @param {number} max - Peso máximo
 * @returns {Object} { valido: boolean, mensaje: string }
 */
export const validarPeso = (peso, min = 0.5, max = 200) => {
  if (peso === null || peso === undefined || peso === '') {
    return { valido: false, mensaje: 'El peso es requerido' };
  }
  
  const pesoNum = Number(peso);
  
  if (isNaN(pesoNum)) {
    return { valido: false, mensaje: 'El peso debe ser un número válido' };
  }
  
  if (pesoNum < min) {
    return { valido: false, mensaje: `El peso mínimo es ${min} kg` };
  }
  
  if (pesoNum > max) {
    return { valido: false, mensaje: `El peso máximo es ${max} kg` };
  }
  
  return { valido: true, mensaje: '' };
};

/**
 * Valida producción de leche
 * 
 * @param {number} litros - Litros producidos
 * @returns {Object} { valido: boolean, mensaje: string }
 */
export const validarProduccionLeche = (litros) => {
  if (litros === null || litros === undefined || litros === '') {
    return { valido: false, mensaje: 'La producción es requerida' };
  }
  
  const litrosNum = Number(litros);
  
  if (isNaN(litrosNum)) {
    return { valido: false, mensaje: 'La producción debe ser un número válido' };
  }
  
  if (litrosNum < 0.1) {
    return { valido: false, mensaje: 'La producción mínima es 0.1 litros' };
  }
  
  if (litrosNum > 15) {
    return { valido: false, mensaje: 'La producción máxima es 15 litros por ordeño' };
  }
  
  return { valido: true, mensaje: '' };
};

/**
 * Valida temperatura corporal
 * 
 * @param {number} temperatura - Temperatura en °C
 * @returns {Object} { valido: boolean, mensaje: string }
 */
export const validarTemperatura = (temperatura) => {
  if (!temperatura) {
    return { valido: true, mensaje: '' }; // Opcional
  }
  
  const temp = Number(temperatura);
  
  if (isNaN(temp)) {
    return { valido: false, mensaje: 'La temperatura debe ser un número válido' };
  }
  
  if (temp < 35.0) {
    return { valido: false, mensaje: 'La temperatura mínima es 35°C' };
  }
  
  if (temp > 42.0) {
    return { valido: false, mensaje: 'La temperatura máxima es 42°C' };
  }
  
  return { valido: true, mensaje: '' };
};

/**
 * Valida una fecha
 * 
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {boolean} permitirFuturo - Si permite fechas futuras
 * @returns {Object} { valido: boolean, mensaje: string }
 */
export const validarFecha = (fecha, permitirFuturo = false) => {
  if (!fecha) {
    return { valido: false, mensaje: 'La fecha es requerida' };
  }
  
  const date = new Date(fecha);
  
  if (isNaN(date.getTime())) {
    return { valido: false, mensaje: 'Fecha inválida' };
  }
  
  if (!permitirFuturo) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (date > hoy) {
      return { valido: false, mensaje: 'La fecha no puede ser futura' };
    }
  }
  
  return { valido: true, mensaje: '' };
};

/**
 * Valida un email
 * 
 * @param {string} email - Email a validar
 * @returns {Object} { valido: boolean, mensaje: string }
 */
export const validarEmail = (email) => {
  if (!email) {
    return { valido: false, mensaje: 'El email es requerido' };
  }
  
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!regex.test(email)) {
    return { valido: false, mensaje: 'Email inválido' };
  }
  
  return { valido: true, mensaje: '' };
};

/**
 * Valida condición corporal (escala 1-5)
 * 
 * @param {number} condicion - Condición corporal
 * @returns {Object} { valido: boolean, mensaje: string }
 */
export const validarCondicionCorporal = (condicion) => {
  if (!condicion) {
    return { valido: true, mensaje: '' }; // Opcional
  }
  
  const cond = Number(condicion);
  
  if (isNaN(cond)) {
    return { valido: false, mensaje: 'La condición corporal debe ser un número' };
  }
  
  if (cond < 1 || cond > 5) {
    return { valido: false, mensaje: 'La condición corporal debe estar entre 1 y 5' };
  }
  
  return { valido: true, mensaje: '' };
};

/**
 * Valida porcentaje
 * 
 * @param {number} porcentaje - Porcentaje a validar
 * @param {number} min - Mínimo permitido
 * @param {number} max - Máximo permitido
 * @returns {Object} { valido: boolean, mensaje: string }
 */
export const validarPorcentaje = (porcentaje, min = 0, max = 100) => {
  if (!porcentaje && porcentaje !== 0) {
    return { valido: true, mensaje: '' }; // Opcional
  }
  
  const porc = Number(porcentaje);
  
  if (isNaN(porc)) {
    return { valido: false, mensaje: 'El porcentaje debe ser un número' };
  }
  
  if (porc < min || porc > max) {
    return { valido: false, mensaje: `El porcentaje debe estar entre ${min}% y ${max}%` };
  }
  
  return { valido: true, mensaje: '' };
};

/**
 * Valida formulario completo
 * 
 * @param {Object} datos - Objeto con los datos del formulario
 * @param {Object} validaciones - Objeto con funciones de validación por campo
 * @returns {Object} { valido: boolean, errores: Object }
 */
export const validarFormulario = (datos, validaciones) => {
  const errores = {};
  let valido = true;
  
  Object.keys(validaciones).forEach(campo => {
    const resultado = validaciones[campo](datos[campo]);
    if (!resultado.valido) {
      errores[campo] = resultado.mensaje;
      valido = false;
    }
  });
  
  return { valido, errores };
};
