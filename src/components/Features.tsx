// Sección "¿Qué es ComplejoSport?" con cards de funcionalidades principales
import { CalendarDays, Clock, CreditCard, Package } from 'lucide-react';
import type { ComponentType } from 'react';

interface Feature {
  Icono: ComponentType<{ className?: string }>;
  titulo: string;
  descripcion: string;
}

const FEATURES: Feature[] = [
  {
    Icono: CalendarDays,
    titulo: 'Reserva online en segundos',
    descripcion:
      'Elegí tu cancha, seleccioná el horario y confirmá tu reserva desde cualquier dispositivo.',
  },
  {
    Icono: Clock,
    titulo: 'Disponibilidad en tiempo real',
    descripcion:
      'Consultá qué canchas están libres en el momento y reservá sin necesidad de llamar.',
  },
  {
    Icono: CreditCard,
    titulo: 'Pagos seguros con Mercado Pago',
    descripcion:
      'Pagá tu turno de forma segura y recibís una confirmación por mail al instante.',
  },
  {
    Icono: Package,
    titulo: 'Solicitá equipamiento',
    descripcion:
      'Pedí pelotas, pecheras y más al momento de reservar, según el stock disponible.',
  },
];

export default function Features() {
  return (
    <section className="bg-[#D7E6D3] py-20 px-4">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#061F03] mb-4">
            ¿Qué es ComplejoSport?
          </h2>
          <p className="text-[#3B4F38] text-lg max-w-2xl mx-auto leading-relaxed">
            Una plataforma para reservar turnos en canchas deportivas, gestionar
            equipamiento, ver disponibilidad en tiempo real y pagar online.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map(({ Icono, titulo, descripcion }) => (
            <div
              key={titulo}
              className="bg-white rounded-2xl p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              <div className="bg-[#3B4F38] p-4 rounded-full mb-4">
                <Icono className="w-6 h-6 text-[#ACC2AB]" />
              </div>
              <h3 className="font-semibold text-[#061F03] mb-2 text-sm">{titulo}</h3>
              <p className="text-sm text-[#3B4F38]/80 leading-relaxed">{descripcion}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
