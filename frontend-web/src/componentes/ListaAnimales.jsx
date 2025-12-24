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
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import animalService from '../servicios/animalService';

const ListaAnimales = ({ onEditar, onNuevo }) => {
  const [animales, setAnimales] = useState([]);
  const [cargando, setCargando] = useState(true);
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
      const parametros = {
        ...filtros,
        pagina: paginaActual,
        limite: animalesPorPagina
      };

      const respuesta = await animalService.buscarAnimales(parametros);
      
      setAnimales(respuesta.data);
      setTotalPaginas(Math.ceil(respuesta.total / animalesPorPagina));
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
    <div className="bg-white rounded-lg shadow-md">
      {/* Encabezado con búsqueda y acciones */}
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Inventario de Animales
          </h2>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </button>
            
            <button
              onClick={exportarCSV}
              disabled={animales.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </button>
            
            <button
              onClick={onNuevo}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Animal
            </button>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              name="busqueda"
              value={filtros.busqueda}
              onChange={manejarCambioFiltro}
              placeholder="Buscar por identificación o nombre..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Panel de filtros avanzados */}
        {mostrarFiltros && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              
              {/* Filtro por sexo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sexo
                </label>
                <select
                  name="sexo"
                  value={filtros.sexo}
                  onChange={manejarCambioFiltro}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="macho">Macho</option>
                  <option value="hembra">Hembra</option>
                </select>
              </div>

              {/* Filtro por raza */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raza
                </label>
                <select
                  name="raza"
                  value={filtros.raza}
                  onChange={manejarCambioFiltro}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas</option>
                  {razas.map(raza => (
                    <option key={raza.id} value={raza.id}>
                      {raza.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  name="estado"
                  value={filtros.estado}
                  onChange={manejarCambioFiltro}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="activo">Activo</option>
                  <option value="vendido">Vendido</option>
                  <option value="muerto">Muerto</option>
                  <option value="descartado">Descartado</option>
                </select>
              </div>

              {/* Filtro por edad mínima */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Edad Min (meses)
                </label>
                <input
                  type="number"
                  name="edadMin"
                  value={filtros.edadMin}
                  onChange={manejarCambioFiltro}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filtro por edad máxima */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Edad Max (meses)
                </label>
                <input
                  type="number"
                  name="edadMax"
                  value={filtros.edadMax}
                  onChange={manejarCambioFiltro}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={limpiarFiltros}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de animales */}
      <div className="overflow-x-auto">
        {cargando ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
            <button
              onClick={cargarAnimales}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        ) : animales.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No se encontraron animales con los filtros aplicados.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Identificación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sexo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Edad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Raza
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {animales.map((animal) => (
                <tr key={animal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {animal.identificacion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {animal.nombre || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {animal.sexo === 'macho' ? 'Macho' : 'Hembra'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatearEdad(animal.fechaNacimiento)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {animal.raza?.nombre || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${obtenerColorEstado(animal.estado)}`}>
                      {animal.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEditar(animal)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => confirmarEliminar(animal)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {!cargando && animales.length > 0 && (
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Página {paginaActual} de {totalPaginas}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
              disabled={paginaActual === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
            <button
              onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
              disabled={paginaActual === totalPaginas}
              className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaAnimales;
