/**
 * Módulo Completo de Genealogía
 * Gestión integral del árbol genealógico y linaje del rebaño
 */

import React, { useState } from 'react';
import { 
  GitBranch, 
  Plus,
  Search,
  Eye,
  Edit,
  AlertCircle,
  User,
  X,
  Users,
  Heart,
  Baby,
  ArrowRight,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

const ModuloGenealogia = () => {
  const [vistaActual, setVistaActual] = useState('lista'); // 'lista', 'registro', 'arbol'
  const [registroEditar, setRegistroEditar] = useState(null);
  const [animalArbol, setAnimalArbol] = useState(null);

  const [registros, setRegistros] = useState([]);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    tipoRelacion: ''
  });

  /**
   * Obtiene el color del badge según el tipo de relación
   */
  const obtenerColorTipo = (tipo) => {
    const colores = {
      padre: 'bg-blue-100 text-blue-700',
      madre: 'bg-pink-100 text-pink-700',
      hijo: 'bg-green-100 text-green-700',
      abuelo: 'bg-purple-100 text-purple-700',
      hermano: 'bg-yellow-100 text-yellow-700'
    };
    return colores[tipo] || 'bg-gray-100 text-gray-700';
  };

  if (vistaActual === 'arbol') {
    return (
      <ArbolGenealogico 
        animal={animalArbol}
        onCerrar={() => {
          setVistaActual('lista');
          setAnimalArbol(null);
        }}
      />
    );
  }

  if (vistaActual === 'registro') {
    return (
      <FormularioGenealogia 
        registroEditar={registroEditar}
        onGuardar={(data) => {
          console.log('Guardar:', data);
          setVistaActual('lista');
          setRegistroEditar(null);
        }}
        onCancelar={() => {
          setVistaActual('lista');
          setRegistroEditar(null);
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Encabezado */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 flex items-center">
              <GitBranch className="w-8 h-8 mr-3 text-purple-600" />
              Genealogía y Linaje
            </h2>
            <p className="text-gray-600 mt-1">
              Registro y visualización del árbol genealógico del rebaño
            </p>
          </div>
          
          <button
            onClick={() => {
              setRegistroEditar(null);
              setVistaActual('registro');
            }}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Registrar Relación
          </button>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar animal por código o nombre..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div>
            <select
              value={filtros.tipoRelacion}
              onChange={(e) => setFiltros({ ...filtros, tipoRelacion: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todas las relaciones</option>
              <option value="padres">Padres</option>
              <option value="hijos">Hijos</option>
              <option value="hermanos">Hermanos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de registros genealógicos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {registros.map(registro => (
          <div key={registro.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden">
            {/* Header del registro */}
            <div className="px-6 py-4 bg-purple-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <GitBranch className="w-6 h-6 text-purple-600" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {registro.animal.codigo} - {registro.animal.nombre}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {registro.raza} - {registro.sexo === 'macho' ? 'Macho' : 'Hembra'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenido del registro */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Padres */}
                {(registro.padre || registro.madre) && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                      <Users className="w-4 h-4 mr-2 text-blue-600" />
                      Padres
                    </h4>
                    <div className="space-y-2">
                      {registro.padre && (
                        <div className="flex items-center text-sm">
                          <User className="w-4 h-4 mr-2 text-blue-600" />
                          <span className="font-medium text-gray-700">Padre:</span>
                          <span className="ml-2 text-gray-800">
                            {registro.padre.codigo} - {registro.padre.nombre}
                          </span>
                        </div>
                      )}
                      {registro.madre && (
                        <div className="flex items-center text-sm">
                          <Heart className="w-4 h-4 mr-2 text-pink-600" />
                          <span className="font-medium text-gray-700">Madre:</span>
                          <span className="ml-2 text-gray-800">
                            {registro.madre.codigo} - {registro.madre.nombre}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Abuelos */}
                {registro.abuelos && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                      <Users className="w-4 h-4 mr-2 text-purple-600" />
                      Abuelos
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {registro.abuelos.paterno && (
                        <div>
                          <p className="font-medium text-gray-600 text-xs mb-1">Paternos</p>
                          {registro.abuelos.paterno.padre && (
                            <p className="text-gray-800">♂ {registro.abuelos.paterno.padre}</p>
                          )}
                          {registro.abuelos.paterno.madre && (
                            <p className="text-gray-800">♀ {registro.abuelos.paterno.madre}</p>
                          )}
                        </div>
                      )}
                      {registro.abuelos.materno && (
                        <div>
                          <p className="font-medium text-gray-600 text-xs mb-1">Maternos</p>
                          {registro.abuelos.materno.padre && (
                            <p className="text-gray-800">♂ {registro.abuelos.materno.padre}</p>
                          )}
                          {registro.abuelos.materno.madre && (
                            <p className="text-gray-800">♀ {registro.abuelos.materno.madre}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Descendencia */}
                {registro.hijos && registro.hijos.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                      <Baby className="w-4 h-4 mr-2 text-green-600" />
                      Descendencia ({registro.hijos.length})
                    </h4>
                    <div className="space-y-1 text-sm">
                      {registro.hijos.slice(0, 3).map((hijo, index) => (
                        <div key={index} className="flex items-center text-gray-800">
                          <ChevronRight className="w-3 h-3 mr-1 text-green-600" />
                          {hijo}
                        </div>
                      ))}
                      {registro.hijos.length > 3 && (
                        <p className="text-gray-600 text-xs mt-2">
                          + {registro.hijos.length - 3} más
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Coeficiente de consanguinidad */}
                {registro.coeficienteConsanguinidad !== undefined && (
                  <div className={`rounded-lg p-3 ${
                    registro.coeficienteConsanguinidad > 12.5 ? 'bg-red-50 border border-red-200' :
                    registro.coeficienteConsanguinidad > 6.25 ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-green-50 border border-green-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Coef. Consanguinidad:</span>
                      <span className={`text-lg font-bold ${
                        registro.coeficienteConsanguinidad > 12.5 ? 'text-red-700' :
                        registro.coeficienteConsanguinidad > 6.25 ? 'text-yellow-700' :
                        'text-green-700'
                      }`}>
                        {registro.coeficienteConsanguinidad}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <button
                    onClick={() => {
                      setAnimalArbol(registro);
                      setVistaActual('arbol');
                    }}
                    className="flex-1 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-center"
                  >
                    <GitBranch className="w-4 h-4 mr-1" />
                    Ver Árbol
                  </button>
                  <button
                    onClick={() => {
                      setRegistroEditar(registro);
                      setVistaActual('registro');
                    }}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje cuando no hay datos */}
      {registros.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <GitBranch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">No hay registros genealógicos</p>
          <button
            onClick={() => {
              setRegistroEditar(null);
              setVistaActual('registro');
            }}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Registrar Primera Relación
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Componente de Formulario de Genealogía
 */
const FormularioGenealogia = ({ registroEditar, onGuardar, onCancelar }) => {
  const [formData, setFormData] = useState({
    // Animal principal
    animalId: registroEditar?.animal?.codigo || '',
    
    // Padres
    padreId: registroEditar?.padre?.codigo || '',
    madreId: registroEditar?.madre?.codigo || '',
    
    // Abuelos paternos
    abueloPaternoId: registroEditar?.abuelos?.paterno?.padre || '',
    abuelaPaternaId: registroEditar?.abuelos?.paterno?.madre || '',
    
    // Abuelos maternos
    abueloMaternoId: registroEditar?.abuelos?.materno?.padre || '',
    abuelaMaternaId: registroEditar?.abuelos?.materno?.madre || '',
    
    // Información adicional
    fechaNacimiento: registroEditar?.fechaNacimiento || '',
    numeroRegistroGenealogico: registroEditar?.numeroRegistroGenealogico || '',
    pureza: registroEditar?.pureza || '100',
    
    // Observaciones
    observaciones: registroEditar?.observaciones || ''
  });

  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [advertenciaConsanguinidad, setAdvertenciaConsanguinidad] = useState(false);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: null }));
    }

    // Verificar consanguinidad si se seleccionan padre y madre
    if ((name === 'padreId' || name === 'madreId') && formData.padreId && formData.madreId) {
      // Aquí iría la lógica de verificación
      setAdvertenciaConsanguinidad(formData.padreId === formData.madreId);
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.animalId) nuevosErrores.animalId = 'Debe ingresar el código del animal';
    if (!formData.padreId && !formData.madreId) {
      nuevosErrores.general = 'Debe registrar al menos un padre o madre';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setGuardando(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    onGuardar(formData);
    setGuardando(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {registroEditar ? 'Editar Registro Genealógico' : 'Registrar Genealogía'}
          </h2>
          <button onClick={onCancelar} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={manejarEnvio} className="space-y-6">
          {/* Animal Principal */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-purple-600" />
              Animal Principal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código del Animal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="animalId"
                  value={formData.animalId}
                  onChange={manejarCambio}
                  placeholder="CAB-001"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errores.animalId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  name="fechaNacimiento"
                  value={formData.fechaNacimiento}
                  onChange={manejarCambio}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pureza Racial (%)
                </label>
                <input
                  type="number"
                  name="pureza"
                  value={formData.pureza}
                  onChange={manejarCambio}
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Registro Genealógico
              </label>
              <input
                type="text"
                name="numeroRegistroGenealogico"
                value={formData.numeroRegistroGenealogico}
                onChange={manejarCambio}
                placeholder="Ej: GEN-2024-001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Padres */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Padres
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Padre (Macho Reproductor)
                </label>
                <input
                  type="text"
                  name="padreId"
                  value={formData.padreId}
                  onChange={manejarCambio}
                  placeholder="CAB-M-001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Madre (Hembra)
                </label>
                <input
                  type="text"
                  name="madreId"
                  value={formData.madreId}
                  onChange={manejarCambio}
                  placeholder="CAB-002"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            {advertenciaConsanguinidad && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                  <p className="text-sm text-red-700">
                    <strong>Advertencia:</strong> Se detectó una posible relación de consanguinidad. Verifique los datos ingresados.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Abuelos Paternos */}
          <div className="bg-indigo-50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-indigo-600" />
              Abuelos Paternos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Abuelo Paterno (Padre del Padre)
                </label>
                <input
                  type="text"
                  name="abueloPaternoId"
                  value={formData.abueloPaternoId}
                  onChange={manejarCambio}
                  placeholder="CAB-M-003"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Abuela Paterna (Madre del Padre)
                </label>
                <input
                  type="text"
                  name="abuelaPaternaId"
                  value={formData.abuelaPaternaId}
                  onChange={manejarCambio}
                  placeholder="CAB-004"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Abuelos Maternos */}
          <div className="bg-pink-50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-pink-600" />
              Abuelos Maternos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Abuelo Materno (Padre de la Madre)
                </label>
                <input
                  type="text"
                  name="abueloMaternoId"
                  value={formData.abueloMaternoId}
                  onChange={manejarCambio}
                  placeholder="CAB-M-005"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Abuela Materna (Madre de la Madre)
                </label>
                <input
                  type="text"
                  name="abuelaMaternaId"
                  value={formData.abuelaMaternaId}
                  onChange={manejarCambio}
                  placeholder="CAB-006"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={manejarCambio}
              rows="4"
              placeholder="Notas adicionales sobre el linaje, características heredadas, premios, etc..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {errores.general && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
              <p className="text-sm text-red-700">{errores.general}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onCancelar}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                'Guardar Registro'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Componente de Árbol Genealógico
 */
const ArbolGenealogico = ({ animal, onCerrar }) => {
  if (!animal) return null;

  // Componente para un nodo del árbol
  const NodoAnimal = ({ datos, nivel = 0, tipo = 'principal' }) => {
    const [expandido, setExpandido] = useState(nivel < 2);

    if (!datos) return null;

    const colorNodo = {
      principal: 'bg-purple-100 border-purple-400 text-purple-900',
      padre: 'bg-blue-100 border-blue-400 text-blue-900',
      madre: 'bg-pink-100 border-pink-400 text-pink-900',
      abuelo: 'bg-indigo-50 border-indigo-300 text-indigo-800',
      abuela: 'bg-rose-50 border-rose-300 text-rose-800'
    };

    return (
      <div className="flex flex-col items-center">
        <div 
          className={`border-2 rounded-lg p-4 ${colorNodo[tipo]} shadow-md hover:shadow-lg transition-shadow cursor-pointer min-w-[200px]`}
          onClick={() => setExpandido(!expandido)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              {tipo === 'padre' || tipo === 'abuelo' ? (
                <User className="w-5 h-5 mr-2" />
              ) : tipo === 'madre' || tipo === 'abuela' ? (
                <Heart className="w-5 h-5 mr-2" />
              ) : (
                <Baby className="w-5 h-5 mr-2" />
              )}
              <span className="font-bold">{datos.codigo}</span>
            </div>
            {(datos.padre || datos.madre) && (
              expandido ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            )}
          </div>
          <p className="text-sm font-semibold">{datos.nombre}</p>
          {datos.raza && <p className="text-xs mt-1 opacity-75">{datos.raza}</p>}
          {datos.fechaNacimiento && (
            <p className="text-xs mt-1 opacity-75">
              Nac: {new Date(datos.fechaNacimiento).getFullYear()}
            </p>
          )}
        </div>

        {expandido && (datos.padre || datos.madre) && (
          <div className="relative mt-8">
            {/* Línea vertical */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gray-400"></div>
            
            <div className="flex gap-8 mt-8">
              {/* Padre */}
              {datos.padre && (
                <div className="relative">
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gray-400"></div>
                  <div className="absolute bottom-full left-1/2 w-24 h-0.5 bg-gray-400"></div>
                  <NodoAnimal datos={datos.padre} nivel={nivel + 1} tipo={nivel === 0 ? 'padre' : 'abuelo'} />
                </div>
              )}

              {/* Madre */}
              {datos.madre && (
                <div className="relative">
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gray-400"></div>
                  <div className="absolute bottom-full right-1/2 w-24 h-0.5 bg-gray-400"></div>
                  <NodoAnimal datos={datos.madre} nivel={nivel + 1} tipo={nivel === 0 ? 'madre' : 'abuela'} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <GitBranch className="w-7 h-7 mr-3 text-purple-600" />
                Árbol Genealógico
              </h2>
              <p className="text-gray-600 mt-1">
                Linaje de {animal.animal.codigo} - {animal.animal.nombre}
              </p>
            </div>
            <button 
              onClick={onCerrar}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-5 h-5 inline mr-2" />
              Cerrar
            </button>
          </div>

          {/* Leyenda */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-3">Leyenda:</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-purple-100 border-2 border-purple-400 rounded mr-2"></div>
                <span>Animal Principal</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-100 border-2 border-blue-400 rounded mr-2"></div>
                <span>Padre</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-pink-100 border-2 border-pink-400 rounded mr-2"></div>
                <span>Madre</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-indigo-50 border-2 border-indigo-300 rounded mr-2"></div>
                <span>Abuelos</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Haz clic en cualquier nodo para expandir o contraer su línea genealógica
            </p>
          </div>

          {/* Árbol */}
          <div className="overflow-x-auto pb-8">
            <div className="flex justify-center min-w-max">
              <NodoAnimal 
                datos={{
                  codigo: animal.animal.codigo,
                  nombre: animal.animal.nombre,
                  raza: animal.raza,
                  fechaNacimiento: animal.fechaNacimiento,
                  padre: animal.padre ? {
                    codigo: animal.padre.codigo,
                    nombre: animal.padre.nombre,
                    raza: animal.padre.raza,
                    padre: animal.abuelos?.paterno?.padre ? {
                      codigo: 'ABP-P',
                      nombre: animal.abuelos.paterno.padre
                    } : null,
                    madre: animal.abuelos?.paterno?.madre ? {
                      codigo: 'ABP-M',
                      nombre: animal.abuelos.paterno.madre
                    } : null
                  } : null,
                  madre: animal.madre ? {
                    codigo: animal.madre.codigo,
                    nombre: animal.madre.nombre,
                    raza: animal.madre.raza,
                    padre: animal.abuelos?.materno?.padre ? {
                      codigo: 'ABM-P',
                      nombre: animal.abuelos.materno.padre
                    } : null,
                    madre: animal.abuelos?.materno?.madre ? {
                      codigo: 'ABM-M',
                      nombre: animal.abuelos.materno.madre
                    } : null
                  } : null
                }}
                nivel={0}
                tipo="principal"
              />
            </div>
          </div>

          {/* Información adicional */}
          {animal.coeficienteConsanguinidad !== undefined && (
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-bold text-gray-800 mb-2">Análisis Genético</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Coeficiente de Consanguinidad:</span>
                <span className={`text-lg font-bold ${
                  animal.coeficienteConsanguinidad > 12.5 ? 'text-red-700' :
                  animal.coeficienteConsanguinidad > 6.25 ? 'text-yellow-700' :
                  'text-green-700'
                }`}>
                  {animal.coeficienteConsanguinidad}%
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {animal.coeficienteConsanguinidad > 12.5 ? 
                  '⚠️ Alto nivel de consanguinidad. Se recomienda evitar cruces adicionales.' :
                  animal.coeficienteConsanguinidad > 6.25 ?
                  '⚠️ Nivel moderado de consanguinidad. Monitorear en futuros cruces.' :
                  '✓ Nivel aceptable de consanguinidad.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModuloGenealogia;
