import { SignUp } from '@clerk/nextjs';

export default function PaginaSignUp() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#D7E6D3] px-4">
      <SignUp />
    </main>
  );
}
