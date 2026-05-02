import Navbar from "@/components/shared/Navbar";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-100">
      <Navbar />
      <main className="flex items-center justify-center px-4 py-16">
        {children}
      </main>
    </div>
  );
}
