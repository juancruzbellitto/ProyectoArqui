import { auth, currentUser } from '@clerk/nextjs/server';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';

export default async function PaginaReservas() {
  const { userId } = await auth();
  const usuario = await currentUser();

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-[#F4F8F3]">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold text-[#061F03] mb-2">Mis Reservas</h1>
          <p className="text-[#3B4F38] mb-8">
            Hola, {usuario?.firstName ?? 'usuario'}. Acá podés ver y gestionar tus turnos.
          </p>

          {/* Placeholder — reemplazar con query a Prisma filtrada por userId */}
          <div className="bg-white rounded-2xl border border-[#ACC2AB]/30 p-8 text-center text-[#3B4F38]">
            <p className="text-lg font-medium">Todavía no tenés reservas activas.</p>
            <p className="text-sm mt-2 text-[#7FB584]">clerk_user_id: {userId}</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
