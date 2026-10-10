import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contextos/AuthContext';
import {
  Users, Heart, Syringe, Milk, Weight,
  GitBranch, FileText, Bell, ArrowRight, Mountain, ShieldCheck, Ruler
} from 'lucide-react';

export const MODULOS = [
  { id: 'animales',        titulo: 'Mis Cabras',           descripcion: 'Registro completo de tu rebaño. Administra información de cada animal, su identificación y características.',              ruta: '/animales',       Icono: Users,     color: 'bg-emerald-500', colorCard: 'from-emerald-50 to-green-100',   imagen: '/img/ModuloCabras.svg',      ring: 'ring-emerald-200', btn: 'bg-emerald-600 hover:bg-emerald-700' },
  { id: 'reproduccion',   titulo: 'Reproducción',          descripcion: 'Control de montas, diagnósticos de gestación y seguimiento de partos. Programa los ciclos reproductivos del rebaño.',    ruta: '/reproduccion',   Icono: Heart,     color: 'bg-pink-500',    colorCard: 'from-pink-50 to-rose-100',       imagen: '/img/ModuloReproduccion.svg', ring: 'ring-pink-200',    btn: 'bg-pink-600 hover:bg-pink-700'   },
  { id: 'salud',          titulo: 'Salud y Vacunas',       descripcion: 'Calendario de vacunación, desparasitaciones y tratamientos médicos. Mantén al día la salud de tu rebaño.',               ruta: '/salud',          Icono: Syringe,   color: 'bg-blue-500',    colorCard: 'from-blue-50 to-cyan-100',       imagen: '/img/ModuloVacunas.svg',     ring: 'ring-blue-200',    btn: 'bg-blue-600 hover:bg-blue-700'   },
  { id: 'produccion',     titulo: 'Producción de Leche',   descripcion: 'Registro diario de litros producidos por cada cabra. Analiza tendencias y optimiza la producción del rebaño.',           ruta: '/produccion',     Icono: Milk,      color: 'bg-amber-500',   colorCard: 'from-amber-50 to-yellow-100',    imagen: '/img/ModuloLeche.svg',       ring: 'ring-amber-200',   btn: 'bg-amber-600 hover:bg-amber-700' },
  { id: 'peso',           titulo: 'Control de Peso',       descripcion: 'Seguimiento periódico del peso de cada animal. Monitorea el crecimiento y estado nutricional del rebaño.',               ruta: '/peso',           Icono: Weight,    color: 'bg-violet-500',  colorCard: 'from-violet-50 to-purple-100',   imagen: '/img/ModuloPeso.svg',        ring: 'ring-violet-200',  btn: 'bg-violet-600 hover:bg-violet-700' },
  { id: 'genealogia',     titulo: 'Genealogía',            descripcion: 'Árbol genealógico completo de cada animal. Previene consanguinidad y mejora la genética del rebaño con trazabilidad.',   ruta: '/genealogia',     Icono: GitBranch, color: 'bg-teal-500',    colorCard: 'from-teal-50 to-cyan-100',       imagen: '/img/ModuloGenealogia.svg',  ring: 'ring-teal-200',    btn: 'bg-teal-600 hover:bg-teal-700'   },
  { id: 'corrales',       titulo: 'Corrales y Lotes',      descripcion: 'Distribución del rebaño por corral y lote. Controla la capacidad, el tipo de corral (gestantes, ordeño) y el peso de los animales.', ruta: '/corrales',       Icono: Mountain,  color: 'bg-lime-600',    colorCard: 'from-lime-50 to-emerald-100',    imagen: '/img/ModuloCorrales.svg',    ring: 'ring-lime-200',    btn: 'bg-lime-600 hover:bg-lime-700'   },
  { id: 'bienestar',      titulo: 'Bienestar Animal',      descripcion: 'Evaluación del bienestar del hato según la metodología MEBA del ICA. Califica recursos, animal y gestión, y conoce qué falta para alcanzar el nivel Excelente.', ruta: '/bienestar',      Icono: ShieldCheck, color: 'bg-green-600',  colorCard: 'from-green-50 to-emerald-100',   imagen: '/img/ModuloBienestar.svg',   ring: 'ring-green-200',   btn: 'bg-green-600 hover:bg-green-700' },
  { id: 'clasificacion',  titulo: 'Clasificación Lineal',  descripcion: 'Evaluación fenotípica morfológica de cada animal (método ADGA). Califica apariencia, estructura, sistema mamario y patas, con fotos de evidencia para una selección más precisa.', ruta: '/clasificacion-lineal', Icono: Ruler, color: 'bg-rose-500', colorCard: 'from-rose-50 to-pink-100', imagen: '/img/ModuloClasificacion.svg', ring: 'ring-rose-200', btn: 'bg-rose-600 hover:bg-rose-700' },
  { id: 'reportes',       titulo: 'Reportes',              descripcion: 'Genera informes detallados con estadísticas completas. Exporta todos los registros con fecha, hora y responsable.',       ruta: '/reportes',       Icono: FileText,  color: 'bg-indigo-500',  colorCard: 'from-indigo-50 to-blue-100',     imagen: '/img/ModuloReportes.svg',    ring: 'ring-indigo-200',  btn: 'bg-indigo-600 hover:bg-indigo-700' },
  { id: 'notificaciones', titulo: 'Alertas',               descripcion: 'Recordatorios de vacunas pendientes, partos próximos y eventos importantes del rebaño en tiempo real.',                  ruta: '/notificaciones', Icono: Bell,      color: 'bg-orange-500',  colorCard: 'from-orange-50 to-amber-100',    imagen: '/img/ModuloAlertas.svg',     ring: 'ring-orange-200',  btn: 'bg-orange-600 hover:bg-orange-700' },
];

const Dashboard = () => {
  const navigate    = useNavigate();
  const { usuario } = useAuth();

  const hora   = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
  const nombre = (usuario?.nombre || usuario?.nombre_completo || 'Usuario').split(' ')[0];

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-6">
      <div className="max-w-5xl mx-auto">

        {/* ── Encabezado ── */}
        <header className="text-center mb-9">
          <h1 className="text-[34px] sm:text-[40px] leading-tight font-bold text-gray-900 tracking-tight">
            {saludo}, <span className="text-green-700">{nombre}</span>
          </h1>
          <p className="text-gray-500 text-base mt-1.5 max-w-xl mx-auto">
            Capriva transforma los datos de tu hato en decisiones productivas. Elige por dónde empezar.
          </p>
        </header>

        {/* ── Tarjetas alternadas, una por módulo ── */}
        <div className="space-y-5">
          {MODULOS.map((m, i) => {
            const { Icono } = m;
            const esPar = i % 2 === 0;
            return (
              <article
                key={m.id}
                role="link"
                tabIndex={0}
                onClick={() => navigate(m.ruta)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(m.ruta); } }}
                className="group bg-white rounded-3xl shadow-sm overflow-hidden cursor-pointer
                           hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className={`flex flex-col md:flex-row ${esPar ? '' : 'md:flex-row-reverse'} md:min-h-[230px]`}>

                  {/* Texto */}
                  <div className="flex-1 p-8 sm:p-9 flex flex-col justify-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 ${m.color} rounded-[14px] mb-4 shadow-sm`}>
                      <Icono className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
                      {m.titulo}
                    </h2>
                    <p className="text-gray-500 text-[15px] leading-relaxed mb-5 max-w-md">
                      {m.descripcion}
                    </p>
                    <span className={`inline-flex items-center gap-1.5 pl-4 pr-3 h-9 ${m.btn} text-white text-sm font-semibold rounded-full w-fit transition-colors`}>
                      Abrir
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                    </span>
                  </div>

                  {/* Ilustración sobre el tono del módulo */}
                  <div className={`flex-1 bg-gradient-to-br ${m.colorCard} flex items-center justify-center p-6 min-h-[200px] md:min-h-0`}>
                    <img
                      src={m.imagen}
                      alt=""
                      onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
                      className="w-full max-w-[340px] h-56 object-contain drop-shadow-md
                                 group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  </div>

                </div>
              </article>
            );
          })}
        </div>

        <p className="text-center text-gray-400 text-xs mt-10">Capriva · UFPSO</p>
      </div>
    </div>
  );
};

export default Dashboard;
