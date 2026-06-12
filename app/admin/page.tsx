import { auth, currentUser } from '@clerk/nextjs/server';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';

export default async function PaginaDashboard() {
  const { userId } = await auth();
  const usuario = await currentUser();

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-[#F4F8F3]">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold text-[#061F03] mb-2">Panel de Administración</h1>
          <p className="text-[#3B4F38] mb-8">
            Bienvenido, {usuario?.firstName ?? 'administrador'}.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <TarjetaDashboard titulo="Complejos" descripcion="Gestioná tus complejos deportivos" href="/admin/complejos" />
            <TarjetaDashboard titulo="Canchas" descripcion="Administrá el estado de las canchas" href="/admin/complejos" />
            <TarjetaDashboard titulo="Inventario" descripcion="Controlá el equipamiento disponible" href="/admin/complejos" />
          </div>

          {/* Placeholder — reemplazar con query a Prisma validando rol */}
          <p className="mt-8 text-xs text-[#7FB584]">clerk_user_id: {userId}</p>
        </div>
      </main>
      <Footer />
    </>
  );
}

function TarjetaDashboard({ titulo, descripcion, href }: { titulo: string; descripcion: string; href: string }) {
  return (
    <a
      href={href}
      className="bg-white rounded-2xl border border-[#ACC2AB]/30 p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200 block"
    >
      <h2 className="font-bold text-[#061F03] text-lg mb-1">{titulo}</h2>
      <p className="text-sm text-[#3B4F38]">{descripcion}</p>
    </a>
  );
}
