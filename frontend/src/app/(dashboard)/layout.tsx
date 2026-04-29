/**
 * Dashboard Layout
 * Layout para páginas protegidas do dashboard
 */

"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { LoadingState } from "@/shared";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <LoadingState size="lg" />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-neutral-900 border-r border-neutral-800">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-neutral-200">
            <h1 className="text-xl font-bold text-primary-600">CRM Arrighi</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            <NavLink href="/dashboard" icon="📊">
              Dashboard
            </NavLink>
            <NavLink href="/dashboard/clientes" icon="👥">
              Clientes
            </NavLink>
            <NavLink href="/dashboard/contratos" icon="📄">
              Contratos
            </NavLink>
            <NavLink href="/dashboard/usuarios" icon="👤">
              Usuários
            </NavLink>
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-semibold">
                  {user.nome?.charAt(0) || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {user.nome}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="pl-64">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2 text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium">{children}</span>
    </Link>
  );
}
