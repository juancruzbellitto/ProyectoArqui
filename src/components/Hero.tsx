'use client';

// Sección hero principal: título, slogan y barra de búsqueda con filtros
import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';

const DEPORTES = [
  'Todos los deportes',
  'Fútbol 5',
  'Fútbol 7',
  'Pádel',
  'Tenis',
  'Básquet',
];

export default function Hero() {
  const [deporte, setDeporte] = useState('');
  const [ubicacion, setUbicacion] = useState('');

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: redirigir a /canchas?deporte=deporte&ubicacion=ubicacion
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#061F03] via-[#3B4F38] to-[#7FB584] flex items-center justify-center px-4 pt-16">
      <div className="text-center max-w-3xl mx-auto py-20">

        {/* Slogan pequeño */}
        <p className="text-[#ACC2AB] text-sm font-semibold uppercase tracking-widest mb-4">
          Reservá tu cancha, jugá sin complicaciones
        </p>

        {/* Título principal */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-5 leading-tight">
          Encontrá tu{' '}
          <span className="text-[#ACC2AB]">cancha ideal</span>
        </h1>

        {/* Subtítulo */}
        <p className="text-base sm:text-lg text-white/80 mb-10 max-w-xl mx-auto leading-relaxed">
          Reservá turnos en canchas deportivas de complejos cercanos, gestioná
          equipamiento y pagá online en segundos.
        </p>

        {/* Barra de búsqueda */}
        <form
          onSubmit={handleBuscar}
          className="bg-white rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-2xl max-w-2xl mx-auto"
        >
          {/* Selector de deporte */}
          <select
            value={deporte}
            onChange={(e) => setDeporte(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl text-[#061F03] bg-[#D7E6D3] text-sm focus:outline-none focus:ring-2 focus:ring-[#3B4F38]"
          >
            {DEPORTES.map((d) => (
              <option key={d} value={d === 'Todos los deportes' ? '' : d}>
                {d}
              </option>
            ))}
          </select>

          {/* Input de ubicación */}
          <div className="flex-1 flex items-center gap-2 bg-[#D7E6D3] rounded-xl px-4 py-3">
            <MapPin className="w-4 h-4 text-[#3B4F38] shrink-0" />
            <input
              type="text"
              placeholder="Ubicación o barrio"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              className="bg-transparent text-[#061F03] text-sm flex-1 focus:outline-none placeholder:text-[#3B4F38]/50"
            />
          </div>

          {/* Botón buscar */}
          <button
            type="submit"
            className="flex items-center justify-center gap-2 bg-[#3B4F38] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#061F03] transition-colors duration-200 shrink-0"
          >
            <Search className="w-4 h-4" />
            Buscar canchas
          </button>
        </form>
      </div>
    </section>
  );
}
