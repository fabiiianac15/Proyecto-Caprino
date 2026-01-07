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
  
  console.log('=== API FETCH - URL:', url, 'Method:', config.method);
  
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
  { id: 3, nombre: 'Nubia', descripcion: 'Raza de doble propósito', activo: true },
  { id: 4, nombre: 'Boer', descripcion: 'Raza cárnica', activo: true }
];

// Helper function to handle API errors
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(error.message || `HTTP Error: ${response.status}`);
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
        data: data.data || data['hydra:member'] || [],
        total: data.total || data['hydra:totalItems'] || (data.data ? data.data.length : 0)
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
    console.log('=== CREATE ANIMAL - Datos originales:', animalData);
    
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
      // Transformar campos del formulario al formato del backend
      const dataTransformada = {
        codigoIdentificacion: animalData.identificacion || animalData.numeroIdentificacion || animalData.codigo,
        nombre: animalData.nombre,
        fechaNacimiento: animalData.fechaNacimiento,
        sexo: animalData.sexo,
        idRaza: animalData.razaId || animalData.idRaza,
        colorPelaje: animalData.colorPelaje,
        pesoNacimiento: animalData.pesoNacimiento,
        observaciones: animalData.observaciones,
        fotoUrl: animalData.foto || animalData.fotoUrl
      };
      
      console.log('=== CREATE ANIMAL - Datos transformados:', dataTransformada);
      console.log('=== CREATE ANIMAL - URL:', `${API_BASE_URL}/animales`);
      
      const response = await apiFetch(`${API_BASE_URL}/animales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataTransformada),
      });
      
      console.log('=== CREATE ANIMAL - Response status:', response.status);
      
      const result = await handleResponse(response);
      console.log('=== CREATE ANIMAL - Result:', result);
      
      return result.data || result;
    } catch (error) {
      console.error('=== CREATE ANIMAL - Error:', error);
      throw error;
    }
  },

  // Update animal
  update: async (id, animalData) => {
    console.log('=== UPDATE ANIMAL START - ID:', id);
    console.log('=== UPDATE ANIMAL - Datos originales:', animalData);
    
    if (USE_MOCK_DATA) {
      await mockDelay();
      const index = MOCK_ANIMALS.findIndex(a => a.id === parseInt(id));
      if (index === -1) throw new Error('Animal no encontrado');
      MOCK_ANIMALS[index] = { ...MOCK_ANIMALS[index], ...animalData };
      return MOCK_ANIMALS[index];
    }
    
    // Transformar los datos al formato esperado por el backend
    const dataTransformada = {
      codigoIdentificacion: animalData.identificacion || animalData.codigo,
      nombre: animalData.nombre,
      fechaNacimiento: animalData.fechaNacimiento,
      sexo: animalData.sexo,
      idRaza: animalData.razaId || animalData.idRaza,
      colorPelaje: animalData.colorPelaje || animalData.color,
      pesoNacimiento: animalData.pesoNacimiento,
      observaciones: animalData.observaciones,
      fotoUrl: animalData.fotoUrl || animalData.foto
    };
    
    console.log('=== UPDATE ANIMAL - Datos transformados:', dataTransformada);
    console.log('=== UPDATE ANIMAL - URL:', `${API_BASE_URL}/animales/${id}`);
    console.log('=== UPDATE ANIMAL - Opciones fetch:', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: 'JSON.stringify(dataTransformada)'
    });
    
    try {
      const response = await apiFetch(`${API_BASE_URL}/animales/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataTransformada),
      });
      
      console.log('=== UPDATE ANIMAL - Response status:', response.status);
      
      const result = await handleResponse(response);
      console.log('=== UPDATE ANIMAL - Result:', result);
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
        data: data.data || data['hydra:member'] || [],
        total: data.total || data['hydra:totalItems'] || (data.data ? data.data.length : 0)
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
        data: data.data || data['hydra:member'] || [],
        total: data.total || data['hydra:totalItems'] || (data.data ? data.data.length : 0)
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
        data: data.data || data['hydra:member'] || [],
        total: data.total || data['hydra:totalItems'] || (data.data ? data.data.length : 0)
      };
    } catch (error) {
      console.error('Error fetching active breeds:', error);
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
      const response = await apiFetch(`${API_BASE_URL}/produccion_leches?${params}`);
      const data = await handleResponse(response);
      return {
        data: data['hydra:member'] || [],
        total: data['hydra:totalItems'] || 0
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
      const response = await apiFetch(`${API_BASE_URL}/produccion_leches`, {
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
      const response = await apiFetch(`${API_BASE_URL}/reproduccions?${params}`);
      const data = await handleResponse(response);
      return {
        data: data['hydra:member'] || [],
        total: data['hydra:totalItems'] || 0
      };
    } catch (error) {
      console.error('Error fetching reproduction records:', error);
      throw error;
    }
  },

  // Create reproduction record
  create: async (reproduccionData) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { ...reproduccionData, id: Date.now() };
    }
    
    try {
      const response = await apiFetch(`${API_BASE_URL}/reproduccions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reproduccionData),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error creating reproduction record:', error);
      throw error;
    }
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
      const response = await apiFetch(`${API_BASE_URL}/saluds?${params}`);
      const data = await handleResponse(response);
      return {
        data: data['hydra:member'] || [],
        total: data['hydra:totalItems'] || 0
      };
    } catch (error) {
      console.error('Error fetching health records:', error);
      throw error;
    }
  },

  // Create health record
  create: async (saludData) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { ...saludData, id: Date.now() };
    }
    
    try {
      const response = await apiFetch(`${API_BASE_URL}/saluds`, {
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
      const response = await apiFetch(`${API_BASE_URL}/pesajes?${params}`);
      const data = await handleResponse(response);
      return {
        data: data['hydra:member'] || [],
        total: data['hydra:totalItems'] || 0
      };
    } catch (error) {
      console.error('Error fetching weight records:', error);
      throw error;
    }
  },

  // Create weight record
  create: async (pesajeData) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { ...pesajeData, id: Date.now() };
    }
    
    try {
      const response = await apiFetch(`${API_BASE_URL}/pesajes`, {
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
  API_CONFIG,
};
