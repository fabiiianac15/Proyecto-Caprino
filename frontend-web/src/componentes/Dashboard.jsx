import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Heart, 
  Syringe,
  Milk, 
  Weight,
  GitBranch,
  FileText,
  Bell
} from 'lucide-react';

/**
 * Componente Dashboard Principal - Estilo Cards de Módulos
 * 
 * Dashboard principal con tarjetas ilustradas para cada módulo del sistema
 */
const Dashboard = () => {
  const navigate = useNavigate();

  // Configuración de módulos
  const modulos = [
    {
      id: 'animales',
      titulo: 'Mis Cabras',
      descripcion: 'Registro completo de tu rebaño. Administra información de cada animal, su identificación y características.',
      ruta: '/animales',
      icono: Users,
      color: 'bg-green-500',
      imagen: '/img/ModuloCabras.png',
      colorCard: 'from-green-50 to-emerald-50'
    },
    {
      id: 'reproduccion',
      titulo: 'Reproducción y Montas',
      descripcion: 'Control de celos, montas, apareamientos y seguimiento de gestación. Programa los partos esperados.',
      ruta: '/reproduccion',
      icono: Heart,
      color: 'bg-pink-500',
      imagen: '/img/Moduloreproduccion.png',
      colorCard: 'from-pink-50 to-rose-50'
    },
    {
      id: 'salud',
      titulo: 'Salud y Vacunas',
      descripcion: 'Calendario de vacunación, desparasitaciones y tratamientos médicos. Mantén al día la salud de tu rebaño.',
      ruta: '/salud',
      icono: Syringe,
      color: 'bg-blue-500',
      imagen: '/img/ModuloVacunas.png',
      colorCard: 'from-blue-50 to-cyan-50'
    },
    {
      id: 'produccion',
      titulo: 'Producción de Leche',
      descripcion: 'Registro diario de litros producidos por cada cabra. Analiza tendencias y optimiza la producción.',
      ruta: '/produccion',
      icono: Milk,
      color: 'bg-amber-500',
      imagen: '/img/ModuloLeche.png',
      colorCard: 'from-amber-50 to-yellow-50'
    },
    {
      id: 'peso',
      titulo: 'Control de Peso',
      descripcion: 'Seguimiento periódico del peso de cada animal. Monitorea el crecimiento y estado nutricional.',
      ruta: '/peso',
      icono: Weight,
      color: 'bg-purple-500',
      imagen: '/img/ModuloPeso.png',
      colorCard: 'from-purple-50 to-violet-50'
    },
    {
      id: 'genealogia',
      titulo: 'Genealogía',
      descripcion: 'Árbol genealógico completo de cada animal. Previene consanguinidad y mejora la genética del rebaño.',
      ruta: '/genealogia',
      icono: GitBranch,
      color: 'bg-teal-500',
      imagen: '/img/ModuloGenealogia.png',
      colorCard: 'from-teal-50 to-cyan-50'
    },
    {
      id: 'reportes',
      titulo: 'Reportes y Estadísticas',
      descripcion: 'Genera reportes detallados en PDF y Excel. Exporta todos los registros con fecha, hora y responsable.',
      ruta: '/reportes',
      icono: FileText,
      color: 'bg-indigo-500',
      imagen: '/img/ModuloReportes.png',
      colorCard: 'from-indigo-50 to-blue-50'
    },
    {
      id: 'notificaciones',
      titulo: 'Alertas y Notificaciones',
      descripcion: 'Recordatorios de vacunas pendientes, partos próximos y eventos importantes del rebaño.',
      ruta: '/notificaciones',
      icono: Bell,
      color: 'bg-orange-500',
      imagen: '/img/ModuloAlertas.png',
      colorCard: 'from-orange-50 to-amber-50'
    }
  ];

  const TarjetaModulo = ({ modulo, index }) => {
    const esParImpar = index % 2 === 0;
    const Icono = modulo.icono;

    return (
      <div 
        className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1"
        onClick={() => navigate(modulo.ruta)}
      >
        <div className={`flex flex-col md:flex-row ${esParImpar ? '' : 'md:flex-row-reverse'} h-full`}>
          {/* Contenido de texto */}
          <div className="flex-1 p-8 flex flex-col justify-center">
            <div className={`inline-flex items-center justify-center w-14 h-14 ${modulo.color} rounded-xl mb-4`}>
              <Icono className="w-7 h-7 text-white" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              {modulo.titulo}
            </h3>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              {modulo.descripcion}
            </p>
            
            <button 
              className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors w-fit"
            >
              Ir al módulo
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Imagen ilustrativa */}
          <div className={`flex-1 bg-gradient-to-br ${modulo.colorCard} p-8 flex items-center justify-center min-h-[280px]`}>
            <img 
              src={modulo.imagen} 
              alt={modulo.titulo}
              className="w-full h-full object-contain rounded-2xl"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Sistema de Gestión Caprina
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Gestiona todo sobre tu rebaño en un solo lugar. Selecciona el módulo que necesites.
          </p>
        </div>

        {/* Grid de tarjetas de módulos */}
        <div className="space-y-6">
          {modulos.map((modulo, index) => (
            <TarjetaModulo 
              key={modulo.id} 
              modulo={modulo} 
              index={index}
            />
          ))}
        </div>

        {/* Footer informativo */}
        <div className="mt-12 text-center text-gray-600">
          <p className="text-sm">
            Haz clic en cualquier módulo para comenzar a gestionar tu rebaño
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
