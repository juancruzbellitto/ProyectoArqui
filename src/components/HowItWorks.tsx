// Sección de los 3 pasos para usar ComplejoSport
import { Search, CreditCard, Trophy, ChevronRight } from 'lucide-react';
import type { ComponentType } from 'react';

interface Paso {
  numero: string;
  Icono: ComponentType<{ className?: string }>;
  titulo: string;
  descripcion: string;
}

const PASOS: Paso[] = [
  {
    numero: '01',
    Icono: Search,
    titulo: 'Buscá una cancha',
    descripcion:
      'Filtrá por deporte, ubicación y horario para encontrar la cancha que mejor se adapte a vos.',
  },
  {
    numero: '02',
    Icono: CreditCard,
    titulo: 'Reservá y pagá online',
    descripcion:
      'Confirmá tu reserva y pagá de forma segura con Mercado Pago. Recibís confirmación por mail.',
  },
  {
    numero: '03',
    Icono: Trophy,
    titulo: 'Presentate y jugá',
    descripcion:
      'Llegá al complejo con tu reserva confirmada y disfrutá del partido sin trámites.',
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-white py-20 px-4">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#061F03] mb-4">
            ¿Cómo funciona?
          </h2>
          <p className="text-[#3B4F38] text-lg">
            Tres pasos simples para reservar tu cancha.
          </p>
        </div>

        {/* Pasos: horizontal en desktop con flechas, vertical en mobile */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-6 md:gap-0">
          {PASOS.map((paso, i) => (
            <div key={paso.numero} className="flex flex-col md:flex-row items-center md:items-start">

              {/* Contenido del paso */}
              <div className="flex flex-col items-center text-center max-w-xs px-4">
                <div className="relative mb-5">
                  <div className="w-20 h-20 bg-[#3B4F38] rounded-full flex items-center justify-center shadow-lg">
                    <paso.Icono className="w-9 h-9 text-[#ACC2AB]" />
                  </div>
                  <span className="absolute -top-2 -right-2 bg-[#7FB584] text-[#061F03] text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center">
                    {paso.numero}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#061F03] mb-2">{paso.titulo}</h3>
                <p className="text-sm text-[#3B4F38]/80 leading-relaxed">{paso.descripcion}</p>
              </div>

              {/* Flecha conectora entre pasos (solo desktop) */}
              {i < PASOS.length - 1 && (
                <div className="hidden md:flex items-center justify-center mt-10 px-2">
                  <ChevronRight className="w-6 h-6 text-[#ACC2AB]" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
