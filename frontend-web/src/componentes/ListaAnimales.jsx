/**
 * Componente de lista de animales con búsqueda, filtros y acciones
 * Permite visualizar, filtrar y gestionar el inventario de animales
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Plus,
  Download,
  AlertCircle,
  User,
  Tag,
  Calendar,
  Weight,
  Heart
} from 'lucide-react';
import animalService from '../servicios/animalService';

const ListaAnimales = ({ onEditar, onNuevo }) => {
  const [animales, setAnimales] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const animalesPorPagina = 10;

  // Estados de filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    sexo: '',
    raza: '',
    estado: 'activo',
    edadMin: '',
    edadMax: ''
  });

  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [razas, setRazas] = useState([]);

  // Cargar datos iniciales
  useEffect(() => {
    cargarRazas();
  }, []);

  // Cargar animales cuando cambien los filtros o la página
  useEffect(() => {
    cargarAnimales();
  }, [filtros, paginaActual]);

  /**
   * Carga la lista de razas disponibles
   */
  const cargarRazas = async () => {
    try {
      const respuesta = await fetch('/api/razas');
      const datos = await respuesta.json();
      setRazas(datos);
    } catch (error) {
      console.error('Error al cargar razas:', error);
    }
  };

  /**
   * Carga los animales aplicando filtros y paginación
   */
  const cargarAnimales = async () => {
    setCargando(true);
    setError(null);
    
    try {
      // TODO: Reemplazar con llamada real a la API cuando esté lista
      const parametros = {
        ...filtros,
        pagina: paginaActual,
        limite: animalesPorPagina
      };

      const respuesta = await animalService.buscarAnimales(parametros);
      
      setAnimales(respuesta.data || []);
      setTotalPaginas(Math.ceil((respuesta.total || 0) / animalesPorPagina));
    } catch (error) {
      console.error('Error al cargar animales:', error);
      setError('Error al cargar la lista de animales. Intente nuevamente.');
      setAnimales([]);
    } finally {
      setCargando(false);
    }
  };

  /**
   * Maneja cambios en los campos de filtro
   */
  const manejarCambioFiltro = (evento) => {
    const { name, value } = evento.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
    setPaginaActual(1); // Resetear a primera página al filtrar
  };

  /**
   * Limpia todos los filtros
   */
  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      sexo: '',
      raza: '',
      estado: 'activo',
      edadMin: '',
      edadMax: ''
    });
    setPaginaActual(1);
  };

  /**
   * Calcula la edad en meses del animal
   */
  const calcularEdadMeses = (fechaNacimiento) => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    const meses = (hoy.getFullYear() - nacimiento.getFullYear()) * 12 + 
                  (hoy.getMonth() - nacimiento.getMonth());
    return meses;
  };

  /**
   * Formatea la edad para mostrarla
   */
  const formatearEdad = (fechaNacimiento) => {
    const meses = calcularEdadMeses(fechaNacimiento);
    const años = Math.floor(meses / 12);
    const mesesRestantes = meses % 12;
    
    if (años === 0) {
      return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
    }
    return `${años} ${años === 1 ? 'año' : 'años'} ${mesesRestantes > 0 ? `${mesesRestantes}m` : ''}`;
  };

  /**
   * Obtiene el color del badge según el estado
   */
  const obtenerColorEstado = (estado) => {
    const colores = {
      activo: 'bg-green-100 text-green-800',
      vendido: 'bg-blue-100 text-blue-800',
      muerto: 'bg-red-100 text-red-800',
      descartado: 'bg-gray-100 text-gray-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  /**
   * Exporta la lista de animales a CSV
   */
  const exportarCSV = () => {
    const encabezados = ['Identificación', 'Nombre', 'Sexo', 'Edad (meses)', 'Raza', 'Estado'];
    const filas = animales.map(animal => [
      animal.identificacion,
      animal.nombre || 'Sin nombre',
      animal.sexo === 'macho' ? 'Macho' : 'Hembra',
      calcularEdadMeses(animal.fechaNacimiento),
      animal.raza?.nombre || 'Sin raza',
      animal.estado
    ]);

    const csv = [
      encabezados.join(','),
      ...filas.map(fila => fila.map(campo => `"${campo}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `animales_${new Date().toISOString().split('T')[0]}.csv`;
    enlace.click();
  };

  /**
   * Confirma y elimina un animal
   */
  const confirmarEliminar = async (animal) => {
    if (!window.confirm(`¿Está seguro de eliminar el animal ${animal.identificacion}?`)) {
      return;
    }

    try {
      await animalService.eliminarAnimal(animal.id);
      cargarAnimales(); // Recargar lista
    } catch (error) {
      console.error('Error al eliminar animal:', error);
      alert('Error al eliminar el animal. Puede tener registros asociados.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Encabezado con búsqueda y acciones */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              Inventario de Animales
            </h2>
            <p className="text-gray-600 mt-1">
              {animales.length} {animales.length === 1 ? 'cabra registrada' : 'cabras registradas'}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </button>
            
            <button
              onClick={exportarCSV}
              disabled={animales.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </button>
            
            <button
              onClick={onNuevo}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Animal
            </button>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            name="busqueda"
            value={filtros.busqueda}
            onChange={manejarCambioFiltro}
            placeholder="Buscar por identificación o nombre..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Panel de filtros avanzados */}
      {mostrarFiltros && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtros Avanzados</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Filtro por sexo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sexo
              </label>
              <select
                name="sexo"
                value={filtros.sexo}
                onChange={manejarCambioFiltro}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Todos</option>
                <option value="macho">Macho</option>
                <option value="hembra">Hembra</option>
              </select>
            </div>

            {/* Filtro por estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                name="estado"
                value={filtros.estado}
                onChange={manejarCambioFiltro}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Todos</option>
                <option value="activo">Activo</option>
                <option value="vendido">Vendido</option>
                <option value="muerto">Muerto</option>
              </select>
            </div>

            {/* Botón limpiar */}
            <div className="flex items-end">
              <button
                onClick={limpiarFiltros}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid de tarjetas de animales */}
      {cargando ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={cargarAnimales}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : animales.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">No se encontraron animales con los filtros aplicados.</p>
          <button
            onClick={onNuevo}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Registrar Primera Cabra
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {animales.map(animal => (
            <div key={animal.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden">
              {/* Foto del animal */}
              <div className="h-48 bg-gradient-to-br from-green-100 to-green-50 relative overflow-hidden">
                {animal.foto ? (
                  <img 
                    src={animal.foto} 
                    alt={animal.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <User className="w-16 h-16" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${obtenerColorEstado(animal.estado)}`}>
                    {animal.estado.charAt(0).toUpperCase() + animal.estado.slice(1)}
                  </span>
                </div>
              </div>

              {/* Información del animal */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{animal.nombre}</h3>
                    <p className="text-sm text-gray-500 font-mono">{animal.codigo}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    animal.sexo === 'macho' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                  }`}>
                    {animal.sexo === 'macho' ? 'Macho' : 'Hembra'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Tag className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium">Raza:</span>
                    <span className="ml-2">{animal.raza}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium">Edad:</span>
                    <span className="ml-2">{formatearEdad(animal.fechaNacimiento)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Weight className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium">Peso:</span>
                    <span className="ml-2">{animal.pesoActual} kg</span>
                  </div>
                  {animal.estadoReproductivo && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Heart className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium">Estado:</span>
                      <span className="ml-2 capitalize">{animal.estadoReproductivo}</span>
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => onEditar(animal)}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </button>
                  <button
                    onClick={() => {/* Ver detalles */}}
                    className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </button>
                  <button
                    onClick={() => confirmarEliminar(animal)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListaAnimales;
