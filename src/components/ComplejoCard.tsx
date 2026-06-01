// Card de un complejo deportivo: nombre, dirección, cantidad de canchas y deportes
import Link from 'next/link';
import { MapPin, Layers } from 'lucide-react';
import type { Complejo } from '@/src/mocks/data';

interface Props {
  complejo: Complejo;
}

export default function ComplejoCard({ complejo }: Props) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 border border-[#ACC2AB]/30 flex flex-col">

      {/* Header con nombre */}
      <div className="bg-[#3B4F38] px-6 py-4">
        <h3 className="text-white font-bold text-lg leading-tight">{complejo.nombre}</h3>
      </div>

      <div className="p-6 flex flex-col gap-3 flex-1">

        {/* Dirección */}
        <div className="flex items-start gap-2 text-[#3B4F38] text-sm">
          <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#7FB584]" />
          <span>{complejo.direccion}</span>
        </div>

        {/* Canchas disponibles */}
        <div className="flex items-center gap-2 text-[#3B4F38] text-sm">
          <Layers className="w-4 h-4 shrink-0 text-[#7FB584]" />
          <span>{complejo.canchasDisponibles} canchas disponibles</span>
        </div>

        {/* Badges de deportes */}
        <div className="flex flex-wrap gap-2 mt-1">
          {complejo.deportes.map((deporte) => (
            <span
              key={deporte}
              className="bg-[#ACC2AB] text-[#061F03] text-xs font-medium px-3 py-1 rounded-full"
            >
              {deporte}
            </span>
          ))}
        </div>

        {/* Botón */}
        <Link
          href={`/complejos/${complejo.id}`}
          className="mt-auto w-full block text-center bg-[#7FB584] text-[#061F03] font-semibold py-2.5 rounded-xl hover:bg-[#3B4F38] hover:text-white transition-colors duration-200 text-sm"
        >
          Ver canchas
        </Link>
      </div>
    </div>
  );
}
