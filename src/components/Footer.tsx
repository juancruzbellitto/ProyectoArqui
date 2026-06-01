// Footer con logo, links de navegación y copyright
import Link from 'next/link';
import { Trophy } from 'lucide-react';

const LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/complejos', label: 'Complejos' },
  { href: '/canchas', label: 'Canchas' },
  { href: '/contacto', label: 'Contacto' },
];

export default function Footer() {
  return (
    <footer className="bg-[#061F03] text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-8 mb-8">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#ACC2AB]" />
            <span className="font-bold text-xl">ComplejoSport</span>
          </div>

          {/* Links rápidos */}
          <nav className="flex flex-wrap justify-center sm:justify-end gap-6">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[#ACC2AB] hover:text-white text-sm transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-t border-[#3B4F38] pt-6 text-center">
          <p className="text-[#ACC2AB]/70 text-sm">
            © 2026 ComplejoSport. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
