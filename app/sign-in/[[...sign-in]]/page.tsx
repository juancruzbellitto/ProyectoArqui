import { SignIn } from '@clerk/nextjs';

export default function PaginaSignIn() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#D7E6D3] px-4">
      <SignIn />
    </main>
  );
}
