'use client';

import { Clock, Activity, MapPin } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import type { Cancha } from '@/src/mocks/data';

interface Props {
  cancha: Cancha;
}

export default function CanchaCard({ cancha }: Props) {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const handleReservar = () => {
    if (!cancha.disponible) return;
    if (isSignedIn) {
      router.push(`/complejos/${cancha.complejoId}/canchas/${cancha.id}/reservar`);
    } else {
      router.push('/sign-in');
    }
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 border border-[#ACC2AB]/30 flex flex-col">

      {/* Barra de disponibilidad */}
      <div className={`h-1.5 w-full ${cancha.disponible ? 'bg-green-500' : 'bg-red-400'}`} />

      <div className="p-6 flex flex-col gap-3 flex-1">

        {/* Nombre y badge de estado */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-[#061F03] text-base leading-tight">{cancha.nombre}</h3>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
              cancha.disponible
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-600'
            }`}
          >
            {cancha.disponible ? 'Disponible' : 'Ocupada'}
          </span>
        </div>

        {/* Deporte */}
        <div className="flex items-center gap-2 text-[#3B4F38] text-sm">
          <Activity className="w-4 h-4 shrink-0 text-[#7FB584]" />
          <span>{cancha.deporte}</span>
        </div>

        {/* Complejo */}
        <div className="flex items-center gap-2 text-[#3B4F38] text-sm">
          <MapPin className="w-4 h-4 shrink-0 text-[#7FB584]" />
          <span>{cancha.complejoNombre}</span>
        </div>

        {/* Horario */}
        <div className="flex items-center gap-2 text-[#3B4F38] text-sm">
          <Clock className="w-4 h-4 shrink-0 text-[#7FB584]" />
          <span>{cancha.horarioApertura} – {cancha.horarioCierre}</span>
        </div>

        {/* Botón reservar */}
        <button
          onClick={handleReservar}
          disabled={!cancha.disponible}
          className={`mt-auto w-full font-semibold py-2.5 rounded-xl text-sm transition-colors duration-200 ${
            cancha.disponible
              ? 'bg-[#3B4F38] text-white hover:bg-[#061F03] cursor-pointer'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {cancha.disponible ? 'Reservar' : 'No disponible'}
        </button>
      </div>
    </div>
  );
}
