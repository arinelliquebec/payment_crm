"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavigationPermissions } from "@/hooks/usePermissions";
import {
  User,
  Building,
  Users,
  FileText,
  UserCheck,
  UserCog,
  Building2,
  Handshake,
  Receipt,
  Shield,
  Home,
  Settings,
} from "lucide-react";
import { NavigationLoading } from "./PermissionLoading";

/**
 * Componente de navegação com controle de permissões
 */
export const NavigationMenu: React.FC = () => {
  const { rotas, loading, error } = useNavigationPermissions();
  const pathname = usePathname();

  const getIcon = (iconName?: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      User: User,
      Building: Building,
      Users: Users,
      FileText: FileText,
      UserCheck: UserCheck,
      UserCog: UserCog,
      Building2: Building2,
      Handshake: Handshake,
      Receipt: Receipt,
      Shield: Shield,
      Home: Home,
      Settings: Settings,
    };

    const IconComponent = icons[iconName || ""] || Users;
    return <IconComponent className="h-5 w-5" />;
  };

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  if (loading) {
    return <NavigationLoading />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">
          Erro ao carregar menu de navegação
        </p>
      </div>
    );
  }

  return (
    <nav className="space-y-2">
      {/* Dashboard - sempre visível */}
      <Link
        href="/"
        className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive("/")
            ? "bg-blue-100 text-blue-700 border border-blue-200"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <Home className="h-5 w-5 mr-3" />
        Dashboard
      </Link>

      {/* Rotas com permissões */}
      {rotas.map((rota) => (
        <Link
          key={rota.path}
          href={rota.path}
          className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive(rota.path)
              ? "bg-blue-100 text-blue-700 border border-blue-200"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          {getIcon(rota.icon)}
          <span className="ml-3">{rota.label}</span>
        </Link>
      ))}

      {/* Configurações - sempre visível */}
      <Link
        href="/configuracoes"
        className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive("/configuracoes")
            ? "bg-blue-100 text-blue-700 border border-blue-200"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <Settings className="h-5 w-5 mr-3" />
        Configurações
      </Link>
    </nav>
  );
};

/**
 * Componente de breadcrumb com permissões
 */
interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  const getIcon = (iconName?: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      User: User,
      Building: Building,
      Users: Users,
      FileText: FileText,
      UserCheck: UserCheck,
      UserCog: UserCog,
      Building2: Building2,
      Handshake: Handshake,
      Receipt: Receipt,
      Shield: Shield,
      Home: Home,
    };

    const IconComponent = icons[iconName || ""] || Users;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {items.map((item, index) => (
          <li key={index} className="inline-flex items-center">
            {index > 0 && (
              <svg
                className="w-6 h-6 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                {item.icon && getIcon(item.icon)}
                <span className={item.icon ? "ml-1" : ""}>{item.label}</span>
              </Link>
            ) : (
              <span className="inline-flex items-center text-sm font-medium text-gray-500">
                {item.icon && getIcon(item.icon)}
                <span className={item.icon ? "ml-1" : ""}>{item.label}</span>
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

/**
 * Componente de menu mobile com permissões
 */
export const MobileNavigationMenu: React.FC = () => {
  const { rotas, loading } = useNavigationPermissions();
  const pathname = usePathname();

  const getIcon = (iconName?: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      User: User,
      Building: Building,
      Users: Users,
      FileText: FileText,
      UserCheck: UserCheck,
      UserCog: UserCog,
      Building2: Building2,
      Handshake: Handshake,
      Receipt: Receipt,
      Shield: Shield,
      Home: Home,
    };

    const IconComponent = icons[iconName || ""] || Users;
    return <IconComponent className="h-6 w-6" />;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Dashboard */}
      <Link
        href="/"
        className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
          pathname === "/"
            ? "border-blue-500 bg-blue-50 text-blue-700"
            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        <Home className="h-6 w-6 mb-2" />
        <span className="text-sm font-medium">Dashboard</span>
      </Link>

      {/* Rotas com permissões */}
      {rotas.map((rota) => (
        <Link
          key={rota.path}
          href={rota.path}
          className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
            pathname === rota.path || pathname.startsWith(rota.path + "/")
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
          }`}
        >
          {getIcon(rota.icon)}
          <span className="text-sm font-medium mt-2 text-center">
            {rota.label}
          </span>
        </Link>
      ))}
    </div>
  );
};
