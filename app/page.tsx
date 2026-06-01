import Navbar from '@/src/components/Navbar';
import Hero from '@/src/components/Hero';
import Features from '@/src/components/Features';
import ComplejoCard from '@/src/components/ComplejoCard';
import CanchaCard from '@/src/components/CanchaCard';
import HowItWorks from '@/src/components/HowItWorks';
import Footer from '@/src/components/Footer';
import { complejos, canchas } from '@/src/mocks/data';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>

        <Hero />
        <Features />

        {/* Sección: complejos disponibles */}
        <section className="bg-white py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#061F03] mb-4">
                Explorá nuestros complejos
              </h2>
              <p className="text-[#3B4F38] text-lg">
                Encontrá el complejo más cercano. No necesitás registrarte para verlos.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {complejos.map((complejo) => (
                <ComplejoCard key={complejo.id} complejo={complejo} />
              ))}
            </div>
          </div>
        </section>

        {/* Sección: canchas destacadas */}
        <section className="bg-[#D7E6D3] py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#061F03] mb-4">
                Canchas destacadas
              </h2>
              <p className="text-[#3B4F38] text-lg">
                Elegí la cancha que mejor se adapte a tu deporte y horario.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {canchas.map((cancha) => (
                <CanchaCard key={cancha.id} cancha={cancha} />
              ))}
            </div>
          </div>
        </section>

        <HowItWorks />

      </main>
      <Footer />
    </>
  );
}
