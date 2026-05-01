import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contextos/AuthContext';
import {
  Users, Heart, Syringe, Milk, Weight,
  GitBranch, FileText, Bell, ArrowRight
} from 'lucide-react';

const MODULOS = [
  { id: 'animales',        titulo: 'Mis Cabras',           descripcion: 'Registro completo de tu rebaño. Administra información de cada animal, su identificación y características.',              ruta: '/animales',       Icono: Users,     color: 'bg-emerald-500', colorCard: 'from-emerald-50 to-green-100',   imagen: '/img/ModuloCabras.png',      ring: 'ring-emerald-200', btn: 'bg-emerald-600 hover:bg-emerald-700' },
  { id: 'reproduccion',   titulo: 'Reproducción',          descripcion: 'Control de montas, diagnósticos de gestación y seguimiento de partos. Programa los ciclos reproductivos del rebaño.',    ruta: '/reproduccion',   Icono: Heart,     color: 'bg-pink-500',    colorCard: 'from-pink-50 to-rose-100',       imagen: '/img/Moduloreproduccion.png', ring: 'ring-pink-200',    btn: 'bg-pink-600 hover:bg-pink-700'   },
  { id: 'salud',          titulo: 'Salud y Vacunas',       descripcion: 'Calendario de vacunación, desparasitaciones y tratamientos médicos. Mantén al día la salud de tu rebaño.',               ruta: '/salud',          Icono: Syringe,   color: 'bg-blue-500',    colorCard: 'from-blue-50 to-cyan-100',       imagen: '/img/ModuloVacunas.png',     ring: 'ring-blue-200',    btn: 'bg-blue-600 hover:bg-blue-700'   },
  { id: 'produccion',     titulo: 'Producción de Leche',   descripcion: 'Registro diario de litros producidos por cada cabra. Analiza tendencias y optimiza la producción del rebaño.',           ruta: '/produccion',     Icono: Milk,      color: 'bg-amber-500',   colorCard: 'from-amber-50 to-yellow-100',    imagen: '/img/ModuloLeche.png',       ring: 'ring-amber-200',   btn: 'bg-amber-600 hover:bg-amber-700' },
  { id: 'peso',           titulo: 'Control de Peso',       descripcion: 'Seguimiento periódico del peso de cada animal. Monitorea el crecimiento y estado nutricional del rebaño.',               ruta: '/peso',           Icono: Weight,    color: 'bg-violet-500',  colorCard: 'from-violet-50 to-purple-100',   imagen: '/img/ModuloPeso.png',        ring: 'ring-violet-200',  btn: 'bg-violet-600 hover:bg-violet-700' },
  { id: 'genealogia',     titulo: 'Genealogía',            descripcion: 'Árbol genealógico completo de cada animal. Previene consanguinidad y mejora la genética del rebaño con trazabilidad.',   ruta: '/genealogia',     Icono: GitBranch, color: 'bg-teal-500',    colorCard: 'from-teal-50 to-cyan-100',       imagen: '/img/ModuloGenealogia.png',  ring: 'ring-teal-200',    btn: 'bg-teal-600 hover:bg-teal-700'   },
  { id: 'reportes',       titulo: 'Reportes',              descripcion: 'Genera informes detallados con estadísticas completas. Exporta todos los registros con fecha, hora y responsable.',       ruta: '/reportes',       Icono: FileText,  color: 'bg-indigo-500',  colorCard: 'from-indigo-50 to-blue-100',     imagen: '/img/ModuloReportes.png',    ring: 'ring-indigo-200',  btn: 'bg-indigo-600 hover:bg-indigo-700' },
  { id: 'notificaciones', titulo: 'Alertas',               descripcion: 'Recordatorios de vacunas pendientes, partos próximos y eventos importantes del rebaño en tiempo real.',                  ruta: '/notificaciones', Icono: Bell,      color: 'bg-orange-500',  colorCard: 'from-orange-50 to-amber-100',    imagen: '/img/ModuloAlertas.png',     ring: 'ring-orange-200',  btn: 'bg-orange-600 hover:bg-orange-700' },
];

const Dashboard = () => {
  const navigate    = useNavigate();
  const { usuario } = useAuth();

  const hora   = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
  const nombre = (usuario?.nombre || usuario?.nombre_completo || 'Usuario').split(' ')[0];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* ── Encabezado ── */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            {saludo}, <span className="text-green-600">{nombre}</span>
          </h1>
          <p className="text-gray-500 text-base">
            Selecciona el módulo que necesites gestionar
          </p>
        </div>

        {/* ── Tarjetas alternadas ── */}
        <div className="space-y-6">
          {MODULOS.map((m, i) => {
            const { Icono } = m;
            const esPar = i % 2 === 0;
            return (
              <div
                key={m.id}
                onClick={() => navigate(m.ruta)}
                className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70
                           overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1
                           transition-all duration-300"
              >
                <div className={`flex flex-col md:flex-row ${esPar ? '' : 'md:flex-row-reverse'} min-h-[240px]`}>

                  {/* Texto */}
                  <div className="flex-1 p-9 flex flex-col justify-center">
                    <div className={`inline-flex items-center justify-center w-14 h-14 ${m.color} ring-4 ${m.ring} rounded-2xl mb-5 shadow-md`}>
                      <Icono className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-green-700 transition-colors">
                      {m.titulo}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-md">
                      {m.descripcion}
                    </p>
                    <span className={`inline-flex items-center gap-2 px-5 py-2.5 ${m.btn} text-white text-sm font-semibold rounded-xl w-fit transition-colors shadow-sm`}>
                      Ir al módulo
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </span>
                  </div>

                  {/* Imagen */}
                  <div className={`flex-1 bg-gradient-to-br ${m.colorCard} flex items-center justify-center p-8 min-h-[220px] md:min-h-0`}>
                    <img
                      src={m.imagen}
                      alt={m.titulo}
                      className="w-full max-w-[260px] h-52 object-contain drop-shadow-lg
                                 group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-gray-400 text-xs mt-10">Sistema de Gestión Caprina · UFPSO</p>
      </div>
    </div>
  );
};

export default Dashboard;
