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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-10 h-10 text-primary-600" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
          <h2 className="text-xl font-semibold text-neutral-800">
            CRM ARRIGHI
          </h2>
        </div>
        <p className="text-neutral-600">Carregando sistema...</p>
      </div>
    </div>
  );
}
