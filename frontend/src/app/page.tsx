"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Building2 } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Sempre redirecionar para login - a página de login já verifica se o usuário está autenticado
    router.push("/login");
  }, [router]);

  // Mostrar loading enquanto redireciona
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDuration: '4s' }} />
      </div>

      <div className="text-center relative z-10">
        <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
          <Building2 className="w-10 h-10 text-neutral-950" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
          <h2 className="text-xl font-semibold text-gradient-amber">
            CRM ARRIGHI
          </h2>
        </div>
        <p className="text-neutral-400">Carregando sistema...</p>
      </div>
    </div>
  );
}
