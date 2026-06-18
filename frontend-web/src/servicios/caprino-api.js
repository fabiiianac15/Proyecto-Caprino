// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Mock data flag - change to false when backend is ready
const USE_MOCK_DATA = false;

// Helper to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper to get headers with auth
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Helper function to make authenticated fetch
const apiFetch = async (url, options = {}) => {
  const { method = 'GET', headers: optionsHeaders = {}, ...restOptions } = options;

  const config = {
    method,
    ...restOptions,
    headers: {
      ...getHeaders(),
      ...optionsHeaders
    }
  };

  return fetch(url, config);
};

// Mock data for development
const MOCK_ANIMALS = [
  {
    id: 1,
    numeroIdentificacion: 'C001',
    nombre: 'Luna',
    fechaNacimiento: '2022-01-15',
    sexo: 'Hembra',
    idRaza: 1,
    nombreRaza: 'Saanen',
    pesoActual: 45.5,
    estadoGeneral: 'Sano',
    observaciones: 'Animal productivo, buena conformación'
  },
  {
    id: 2,
    numeroIdentificacion: 'C002',
    nombre: 'Estrella',
    fechaNacimiento: '2021-06-10',
    sexo: 'Hembra',
    idRaza: 2,
    nombreRaza: 'Alpina',
    pesoActual: 52.3,
    estadoGeneral: 'Sano',
    observaciones: 'Excelente producción lechera'
  },
  {
    id: 3,
    numeroIdentificacion: 'M001',
    nombre: 'Thor',
    fechaNacimiento: '2020-03-20',
    sexo: 'Macho',
    idRaza: 1,
    nombreRaza: 'Saanen',
    pesoActual: 75.0,
    estadoGeneral: 'Sano',
    observaciones: 'Semental, buena genética'
  }
];

const MOCK_RAZAS = [
  { id: 1, nombre: 'Saanen', descripcion: 'Raza suiza, alta producción lechera', activo: true },
  { id: 2, nombre: 'Alpina', descripcion: 'Raza versátil, buena adaptación', activo: true },
  { id: 3, nombre: 'Anglonubiana', descripcion: 'Raza de doble propósito', activo: true },
  { id: 4, nombre: 'Boer', descripcion: 'Raza cárnica', activo: true }
];

// Helper function to handle API errors
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(error.error || error.message || error.detail || `HTTP Error: ${response.status}`);
  }
  return response.json();
};

// Helper function for mock delay (simulate network)
const mockDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// ==================== ANIMALS API ====================

export const animalesAPI = {
  // Get all animals
  getAll: async () => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { data: MOCK_ANIMALS, total: MOCK_ANIMALS.length };
    }

    try {
      const response = await apiFetch(`${API_BASE_URL}/animales`, {
        headers: getHeaders()
      });
      const data = await handleResponse(response);
      return {
        data: data.data || [],
        total: data.total || (data.data ? data.data.length : 0)
      };
    } catch (error) {
      console.error('Error fetching animals:', error);
      throw error;
    }
  },

  // Get one animal by ID
  getById: async (id) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const animal = MOCK_ANIMALS.find(a => a.id === parseInt(id));
      if (!animal) throw new Error('Animal no encontrado');
      return animal;
    }

    try {
      const response = await apiFetch(`${API_BASE_URL}/animales/${id}`);
      return await handleResponse(response);
    } catch (error) {
      console.error(`Error fetching animal ${id}:`, error);
      throw error;
    }
  },

  // Create new animal
  create: async (animalData) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const newAnimal = {
        ...animalData,
        id: Math.max(...MOCK_ANIMALS.map(a => a.id)) + 1
      };
      MOCK_ANIMALS.push(newAnimal);
      return newAnimal;
    }

    try {
      const dataTransformada = {
        codigoIdentificacion: animalData.identificacion || animalData.numeroIdentificacion || animalData.codigo,
        chapetaNueva: animalData.chapetaNueva,
        chapetaVieja: animalData.chapetaVieja,
        nombre: animalData.nombre,
        fechaNacimiento: animalData.fechaNacimiento,
        sexo: animalData.sexo,
        idRaza: animalData.razaId || animalData.idRaza,
        colorPelaje: animalData.colorPelaje || animalData.color,
        pesoNacimiento: animalData.pesoNacimiento,
        observaciones: animalData.observaciones,
        fotoUrl: animalData.foto || animalData.fotoUrl,
        estado: animalData.estado,
        motivoEstado: animalData.motivoEstado,
        idCorral: animalData.idCorral,
      };

      const response = await apiFetch(`${API_BASE_URL}/animales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataTransformada),
      });

      const result = await handleResponse(response);
      return result.data || result;
    } catch (error) {
      console.error('Error creating animal:', error);
      throw error;
    }
  },

  // Update animal
  update: async (id, animalData) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const index = MOCK_ANIMALS.findIndex(a => a.id === parseInt(id));
      if (index === -1) throw new Error('Animal no encontrado');
      MOCK_ANIMALS[index] = { ...MOCK_ANIMALS[index], ...animalData };
      return MOCK_ANIMALS[index];
    }

    const dataTransformada = {
      codigoIdentificacion: animalData.identificacion || animalData.codigo,
      nombre: animalData.nombre,
      fechaNacimiento: animalData.fechaNacimiento,
      sexo: animalData.sexo,
      idRaza: animalData.razaId || animalData.idRaza,
      colorPelaje: animalData.colorPelaje || animalData.color,
      pesoNacimiento: animalData.pesoNacimiento,
      observaciones: animalData.observaciones,
      fotoUrl: animalData.fotoUrl || animalData.foto,
      estado: animalData.estado,
      motivoEstado: animalData.motivoEstado,
      idCorral: animalData.idCorral,
    };

    // Chapetas: solo enviarlas si vienen definidas (el backend las actualiza condicionalmente)
    if (animalData.chapetaNueva !== undefined) dataTransformada.chapetaNueva = animalData.chapetaNueva;
    if (animalData.chapetaVieja !== undefined) dataTransformada.chapetaVieja = animalData.chapetaVieja;

    try {
      const response = await apiFetch(`${API_BASE_URL}/animales/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataTransformada),
      });

      const result = await handleResponse(response);
      return result.data || result;
    } catch (error) {
      console.error(`Error updating animal ${id}:`, error);
      throw error;
    }
  },

  // Delete animal
  delete: async (id) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const index = MOCK_ANIMALS.findIndex(a => a.id === parseInt(id));
      if (index === -1) throw new Error('Animal no encontrado');
      MOCK_ANIMALS.splice(index, 1);
      return { success: true };
    }

    try {
      const response = await apiFetch(`${API_BASE_URL}/animales/${id}`, {
        method: 'DELETE',
      });
      if (response.status === 204) return { success: true };
      return await handleResponse(response);
    } catch (error) {
      console.error(`Error deleting animal ${id}:`, error);
      throw error;
    }
  },

  // Search animals
  search: async (filters) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      let filtered = [...MOCK_ANIMALS];

      if (filters.sexo) {
        filtered = filtered.filter(a => a.sexo === filters.sexo);
      }
      if (filters.idRaza) {
        filtered = filtered.filter(a => a.idRaza === parseInt(filters.idRaza));
      }
      if (filters.estadoGeneral) {
        filtered = filtered.filter(a => a.estadoGeneral === filters.estadoGeneral);
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(a =>
          a.numeroIdentificacion.toLowerCase().includes(searchLower) ||
          (a.nombre && a.nombre.toLowerCase().includes(searchLower))
        );
      }

      return { data: filtered, total: filtered.length };
    }

    try {
      const params = new URLSearchParams(filters);
      const response = await apiFetch(`${API_BASE_URL}/animales?${params}`);
      const data = await handleResponse(response);
      return {
        data: data.data || [],
        total: data.total || (data.data ? data.data.length : 0)
      };
    } catch (error) {
      console.error('Error searching animals:', error);
      throw error;
    }
  },
};

// ==================== BREEDS API ====================

export const razasAPI = {
  // Get all breeds
  getAll: async () => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { data: MOCK_RAZAS, total: MOCK_RAZAS.length };
    }

    try {
      const response = await apiFetch(`${API_BASE_URL}/razas`);
      const data = await handleResponse(response);
      return {
        data: data.data || [],
        total: data.total || (data.data ? data.data.length : 0)
      };
    } catch (error) {
      console.error('Error fetching breeds:', error);
      throw error;
    }
  },

  // Get active breeds only
  getActivas: async () => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const activas = MOCK_RAZAS.filter(r => r.activo);
      return { data: activas, total: activas.length };
    }

    try {
      const response = await apiFetch(`${API_BASE_URL}/razas?activo=true`);
      const data = await handleResponse(response);
      return {
        data: data.data || [],
        total: data.total || (data.data ? data.data.length : 0)
      };
    } catch (error) {
      console.error('Error fetching active breeds:', error);
      throw error;
    }
  },
};

// ==================== GENEALOGY API ====================

export const genealogiaAPI = {
  getByAnimal: async (animalId) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/genealogia/${animalId}`);
      return await handleResponse(response);
    } catch (error) {
      console.error(`Error fetching genealogy for animal ${animalId}:`, error);
      throw error;
    }
  },
};

// ==================== PRODUCTION API ====================

export const produccionAPI = {
  // Get production records
  getAll: async (filters = {}) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { data: [], total: 0 };
    }

    try {
      const params = new URLSearchParams(filters);
      const response = await apiFetch(`${API_BASE_URL}/produccion?${params}`);
      const data = await handleResponse(response);
      return {
        data: data.data || [],
        total: data.total || 0
      };
    } catch (error) {
      console.error('Error fetching production records:', error);
      throw error;
    }
  },

  // Create production record
  create: async (produccionData) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { ...produccionData, id: Date.now() };
    }

    try {
      const response = await apiFetch(`${API_BASE_URL}/produccion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(produccionData),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error creating production record:', error);
      throw error;
    }
  },

  // Get production records by animal
  getByAnimal: async (animalId) => {
    return produccionAPI.getAll({ animal: animalId });
  },

  // Delete production record
  delete: async (id) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { success: true };
    }

    try {
      const response = await apiFetch(`${API_BASE_URL}/produccion/${id}`, {
        method: 'DELETE',
      });
      if (response.status === 204) return { success: true };
      return await handleResponse(response);
    } catch (error) {
      console.error(`Error deleting production record ${id}:`, error);
      throw error;
    }
  },
};

// ==================== REPRODUCTION API ====================

export const reproduccionAPI = {
  // Get reproduction records
  getAll: async (filters = {}) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { data: [], total: 0 };
    }

    try {
      const params = new URLSearchParams(filters);
      const response = await apiFetch(`${API_BASE_URL}/reproduccion?${params}`);
      const data = await handleResponse(response);
      return {
        data: data.data || [],
        total: data.total || 0
      };
    } catch (error) {
      console.error('Error fetching reproduction records:', error);
      throw error;
    }
  },

  // Create reproduction record (monta/servicio)
  create: async (reproduccionData) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { ...reproduccionData, id: Date.now() };
    }
    const response = await apiFetch(`${API_BASE_URL}/reproduccion`, {
      method: 'POST',
      body: JSON.stringify(reproduccionData),
    });
    return await handleResponse(response);
  },

  // Get reproduction records by animal (as hembra)
  getByAnimal: async (animalId) => {
    return reproduccionAPI.getAll({ animal: animalId });
  },

  // Update reproduction record (diagnóstico)
  update: async (id, datos) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { success: true };
    }
    const response = await apiFetch(`${API_BASE_URL}/reproduccion/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
    return await handleResponse(response);
  },

  // Registrar parto: actualiza el ciclo y crea las crías automáticamente
  registrarParto: async (id, datos) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { success: true, crias: [] };
    }
    const response = await apiFetch(`${API_BASE_URL}/reproduccion/${id}/parto`, {
      method: 'POST',
      body: JSON.stringify(datos),
    });
    return await handleResponse(response);
  },
};

// ==================== HEALTH API ====================

export const saludAPI = {
  // Get health records
  getAll: async (filters = {}) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { data: [], total: 0 };
    }

    try {
      const params = new URLSearchParams(filters);
      const response = await apiFetch(`${API_BASE_URL}/salud?${params}`);
      const data = await handleResponse(response);
      return {
        data: data.data || [],
        total: data.total || 0
      };
    } catch (error) {
      console.error('Error fetching health records:', error);
      throw error;
    }
  },

  // Get health records by animal
  getByAnimal: async (animalId) => {
    return saludAPI.getAll({ animal: animalId });
  },

  // Create health record
  create: async (saludData) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { ...saludData, id: Date.now() };
    }

    try {
      const response = await apiFetch(`${API_BASE_URL}/salud`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saludData),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error creating health record:', error);
      throw error;
    }
  },
};

// ==================== WEIGHT API ====================

export const pesajeAPI = {
  // Get weight records
  getAll: async (filters = {}) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { data: [], total: 0 };
    }

    try {
      const params = new URLSearchParams(filters);
      const response = await apiFetch(`${API_BASE_URL}/pesaje?${params}`);
      const data = await handleResponse(response);
      return {
        data: data.data || [],
        total: data.total || 0
      };
    } catch (error) {
      console.error('Error fetching weight records:', error);
      throw error;
    }
  },

  // Get weight records by animal
  getByAnimal: async (animalId) => {
    return pesajeAPI.getAll({ animal: animalId });
  },

  // Create weight record
  create: async (pesajeData) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { ...pesajeData, id: Date.now() };
    }

    try {
      const response = await apiFetch(`${API_BASE_URL}/pesaje`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pesajeData),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error creating weight record:', error);
      throw error;
    }
  },
};

// ==================== FAMACHA API ====================

export const famachaAPI = {
  getAll: async () => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/famacha`);
      const data = await handleResponse(response);
      return { data: data.data || [], total: data.total || 0 };
    } catch (error) {
      console.error('Error fetching famacha records:', error);
      throw error;
    }
  },

  getByAnimal: async (animalId) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/famacha?idAnimal=${animalId}`);
      const data = await handleResponse(response);
      return { data: data.data || [] };
    } catch (error) {
      console.error('Error fetching famacha by animal:', error);
      throw error;
    }
  },

  create: async (datos) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/famacha`, {
        method: 'POST',
        body: JSON.stringify(datos),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error creating famacha record:', error);
      throw error;
    }
  },

  update: async (id, datos) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/famacha/${id}`, {
        method: 'PUT',
        body: JSON.stringify(datos),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error updating famacha record:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/famacha/${id}`, {
        method: 'DELETE',
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error deleting famacha record:', error);
      throw error;
    }
  },
};

// ==================== NOTIFICACIONES API ====================

export const notificacionesAPI = {
  getAll: async () => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/notificaciones`);
      const data = await handleResponse(response);
      return { data: data.data || [], total: data.total || 0 };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },
};

// ==================== CORRALES API ====================

export const corralesAPI = {
  getAll: async () => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/corrales`);
      const data = await handleResponse(response);
      return { data: data.data || [], total: data.total || (data.data ? data.data.length : 0) };
    } catch (error) {
      console.error('Error fetching corrales:', error);
      throw error;
    }
  },

  create: async (datos) => {
    const response = await apiFetch(`${API_BASE_URL}/corrales`, {
      method: 'POST',
      body: JSON.stringify(datos),
    });
    return await handleResponse(response);
  },

  update: async (id, datos) => {
    const response = await apiFetch(`${API_BASE_URL}/corrales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
    return await handleResponse(response);
  },

  delete: async (id) => {
    const response = await apiFetch(`${API_BASE_URL}/corrales/${id}`, {
      method: 'DELETE',
    });
    return await handleResponse(response);
  },
};

// ==================== BIENESTAR ANIMAL API (MEBA) ====================

export const bienestarAPI = {
  getCatalogo: async (especie = 'CAPRINO') => {
    const response = await apiFetch(`${API_BASE_URL}/bienestar/catalogo?especie=${especie}`);
    const data = await handleResponse(response);
    return data.data || [];
  },

  getAll: async () => {
    const response = await apiFetch(`${API_BASE_URL}/bienestar`);
    const data = await handleResponse(response);
    return { data: data.data || [], total: data.total || 0 };
  },

  getById: async (id) => {
    const response = await apiFetch(`${API_BASE_URL}/bienestar/${id}`);
    const data = await handleResponse(response);
    return data.data;
  },

  getSugerencias: async () => {
    const response = await apiFetch(`${API_BASE_URL}/bienestar/sugerencias`);
    const data = await handleResponse(response);
    return data.data || {};
  },

  create: async (datos) => {
    const response = await apiFetch(`${API_BASE_URL}/bienestar`, {
      method: 'POST',
      body: JSON.stringify(datos),
    });
    return await handleResponse(response);
  },

  delete: async (id) => {
    const response = await apiFetch(`${API_BASE_URL}/bienestar/${id}`, { method: 'DELETE' });
    return await handleResponse(response);
  },
};

// ==================== CLASIFICACIÓN LINEAL FENOTÍPICA API ====================

export const clasificacionLinealAPI = {
  getCatalogo: async () => {
    const response = await apiFetch(`${API_BASE_URL}/clasificacion-lineal/catalogo`);
    const data = await handleResponse(response);
    return data.data || [];
  },

  getByAnimal: async (idAnimal) => {
    const response = await apiFetch(`${API_BASE_URL}/clasificacion-lineal?idAnimal=${idAnimal}`);
    const data = await handleResponse(response);
    return { data: data.data || [] };
  },

  getAll: async () => {
    const response = await apiFetch(`${API_BASE_URL}/clasificacion-lineal`);
    const data = await handleResponse(response);
    return { data: data.data || [], total: data.total || 0 };
  },

  getById: async (id) => {
    const response = await apiFetch(`${API_BASE_URL}/clasificacion-lineal/${id}`);
    const data = await handleResponse(response);
    return data.data;
  },

  create: async (datos) => {
    const response = await apiFetch(`${API_BASE_URL}/clasificacion-lineal`, {
      method: 'POST',
      body: JSON.stringify(datos),
    });
    return await handleResponse(response);
  },

  // Subida multipart: NO usar apiFetch (forzaría Content-Type JSON).
  subirFoto: async (id, file, tipoVista, descripcion = '') => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('tipoVista', tipoVista);
    if (descripcion) fd.append('descripcion', descripcion);
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/clasificacion-lineal/${id}/foto`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    return await handleResponse(response);
  },

  // URL absoluta de una foto (incluye token para que el backend la sirva).
  urlFoto: (idFoto) => `${API_BASE_URL}/clasificacion-lineal/foto/${idFoto}`,

  delete: async (id) => {
    const response = await apiFetch(`${API_BASE_URL}/clasificacion-lineal/${id}`, { method: 'DELETE' });
    return await handleResponse(response);
  },
};

// Export configuration
export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  useMockData: USE_MOCK_DATA,
};

export default {
  animalesAPI,
  razasAPI,
  produccionAPI,
  reproduccionAPI,
  saludAPI,
  pesajeAPI,
  corralesAPI,
  API_CONFIG,
};
