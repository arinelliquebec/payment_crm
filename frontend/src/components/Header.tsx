"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Users,
  Building2,
  UserCheck,
  Scale,
  Bell,
  Search,
  Settings,
  LogOut,
  Menu,
  X as CloseIcon,
  FileText,
  CreditCard,
  TrendingUp,
  History,
  Shield,
  Percent,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigationFilter } from "@/hooks/useNavigationFilter";
import { NotificationBell } from "./NotificationBell";

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  requiredModule?: string;
  requiredAction?: string;
  external?: boolean;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
  requiredGroup?: string[];
  hiddenForGroups?: string[];
}

const menuItems: MenuGroup[] = [
  {
    label: "Cadastros",
    hiddenForGroups: ["Usuario", "Usuário"], // Ocultar para grupo Usuario
    items: [
      {
        label: "Pessoa Física",
        href: "/cadastros/pessoa-fisica",
        icon: <Users className="w-4 h-4" />,
        requiredModule: "PessoaFisica",
        requiredAction: "Visualizar",
      },
      {
        label: "Pessoa Jurídica",
        href: "/cadastros/pessoa-juridica",
        icon: <Building2 className="w-4 h-4" />,
        requiredModule: "PessoaJuridica",
        requiredAction: "Visualizar",
      },
      {
        label: "Consultores",
        href: "/consultores",
        icon: <UserCheck className="w-4 h-4" />,
        requiredModule: "Consultor",
        requiredAction: "Visualizar",
      },
      {
        label: "Parceiros",
        href: "/parceiros",
        icon: <Scale className="w-4 h-4" />,
        requiredModule: "Parceiro",
        requiredAction: "Visualizar",
      },
      {
        label: "Clientes",
        href: "/clientes",
        icon: <Users className="w-4 h-4 text-amber-500" />,
        requiredModule: "Cliente",
        requiredAction: "Visualizar",
      },
    ],
  },
  {
    label: "Gestão",
    hiddenForGroups: ["Usuario", "Usuário"], // Ocultar para grupo Usuario
    items: [
      {
        label: "Contratos",
        href: "/contratos",
        icon: <FileText className="w-4 h-4" />,
        requiredModule: "Contrato",
        requiredAction: "Visualizar",
      },
      {
        label: "Usuários",
        href: "/usuarios",
        icon: <UserCheck className="w-4 h-4" />,
        badge: "3",
        requiredModule: "Usuario",
        requiredAction: "Visualizar",
      },
      {
        label: "Pipeline de Vendas",
        href: "/pipeline",
        icon: <TrendingUp className="w-4 h-4 text-amber-500" />,
        // requiredModule: "Lead",
        // requiredAction: "Visualizar",
      },
      {
        label: "Histórico do Cliente",
        href: "/gestao/historico-cliente",
        icon: <History className="w-4 h-4" />,
        requiredModule: "Cliente",
        requiredAction: "Visualizar",
      },
      {
        label: "Comissões",
        href: "/gestao/comissoes",
        icon: <Percent className="w-4 h-4" />,
        requiredModule: "Contrato",
        requiredAction: "Visualizar",
      },
      {
        label: "Notas Fiscais",
        href: "/gestao/notas-fiscais",
        icon: <FileText className="w-4 h-4" />,
        // requiredModule: "NotaFiscal", // Define o que é: regra de acesso
        // requiredAction: "Visualizar", //Define o que pode ser feito: regra de acesso
      },
    ],
  },
  {
    label: "Financeiro",
    hiddenForGroups: ["Usuario", "Usuário"], // Ocultar para grupo Usuario
    items: [
      {
        label: "Boletos",
        href: "/boletos",
        icon: <CreditCard className="w-4 h-4" />,
        requiredModule: "Boleto",
        requiredAction: "Visualizar",
      },
      {
        label: "Dashboard Financeiro",
        href: "/dashboard/financeiro",
        icon: <TrendingUp className="w-4 h-4" />,
        requiredModule: "Boleto",
        requiredAction: "Visualizar",
      },
      {
        label: "Mapas de Faturamento",
        href: "/dashboard/financeiro/mapas-faturamento",
        icon: <FileText className="w-4 h-4" />,
        requiredModule: "Boleto",
        requiredAction: "Visualizar",
      },
    ],
  },
  {
    label: "Portal",
    items: [
      {
        label: "Portal do Cliente",
        href: "https://www.portal.arrighicrm.com",
        icon: <Shield className="w-4 h-4 text-amber-500" />,
        external: true,
      },
    ],
  },
];

export default function Header() {
  const { user, logout, permissoes } = useAuth();
  const { filterMenuGroups, isUsuarioGroup, userGroup } = useNavigationFilter();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filtrar menus baseado no grupo do usuário
  const filteredMenuItems = filterMenuGroups(menuItems);

  const handleDropdownToggle = (label: string) => {
    setActiveDropdown(activeDropdown === label ? null : label);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-950 border-b border-neutral-800">
      {/* Top bar - Linha dourada premium */}
      <div className="h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

      {/* Main header */}
      <div className="bg-neutral-950/95 backdrop-blur-xl shadow-lg shadow-black/20 relative z-50">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo Section */}
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-4 group">
                <motion.div whileHover={{ rotate: 10 }} className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl blur-md opacity-50 group-hover:opacity-70 transition-opacity" />
                  <div className="relative p-2.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg shadow-amber-500/30">
                    <Scale className="w-8 h-8 text-neutral-950" />
                  </div>
                </motion.div>
                <div>
                  <h1 className="text-3xl font-bold text-gradient-amber">
                    Arrighi
                  </h1>
                  <p className="text-base text-neutral-400 font-medium -mt-0.5">
                    CRM JURÍDICO
                  </p>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-1">
                <Link
                  href="/"
                  className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-amber-400 hover:bg-neutral-800/50 rounded-lg transition-all duration-200"
                >
                  Dashboard
                </Link>

                {/* Indicador para grupo Usuario */}
                {isUsuarioGroup && (
                  <div className="px-3 py-1 text-xs font-medium text-orange-400 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                    Acesso Limitado
                  </div>
                )}

                {filteredMenuItems.map((group) => (
                  <div key={group.label} className="relative">
                    <button
                      onClick={() => handleDropdownToggle(group.label)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative z-10",
                        activeDropdown === group.label
                          ? "text-amber-400 bg-neutral-800/50"
                          : "text-neutral-300 hover:text-amber-400 hover:bg-neutral-800/50",
                      )}
                    >
                      <span>{group.label}</span>
                      <ChevronDown
                        className={cn(
                          "w-3.5 h-3.5 transition-transform",
                          activeDropdown === group.label && "rotate-180",
                        )}
                      />
                    </button>

                    {/* Premium Dropdown */}
                    <AnimatePresence>
                      {activeDropdown === group.label && (
                        <>
                          {/* Backdrop para fechar dropdown ao clicar fora */}
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setActiveDropdown(null)}
                          />

                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 mt-2 w-64 bg-neutral-900 rounded-xl shadow-2xl border border-neutral-800 overflow-hidden z-[100]"
                          >
                            <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 p-3 border-b border-neutral-800">
                              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                                {group.label}
                              </p>
                            </div>
                            <div className="p-2">
                              {group.items.map((item) => {
                                const linkContent = (
                                  <>
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-neutral-800 rounded-lg group-hover:bg-amber-500/20 group-hover:text-amber-400 transition-colors">
                                        {item.icon}
                                      </div>
                                      <span className="text-sm font-medium text-neutral-300 group-hover:text-amber-400">
                                        {item.label}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {item.badge && (
                                        <span className="px-2 py-0.5 bg-amber-500 text-neutral-950 text-xs font-bold rounded-full">
                                          {item.badge}
                                        </span>
                                      )}
                                      {item.external && (
                                        <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-amber-400" />
                                      )}
                                    </div>
                                  </>
                                );

                                const linkClass =
                                  "flex items-center justify-between px-4 py-3 rounded-lg hover:bg-neutral-800/50 transition-all duration-200 group block";

                                return item.external ? (
                                  <a
                                    key={item.href}
                                    href={item.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setActiveDropdown(null)}
                                    className={linkClass}
                                  >
                                    {linkContent}
                                  </a>
                                ) : (
                                  <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => {
                                      console.log(
                                        "Clicando em:",
                                        item.label,
                                        "href:",
                                        item.href,
                                      );
                                      setActiveDropdown(null);
                                    }}
                                    className={linkClass}
                                  >
                                    {linkContent}
                                  </Link>
                                );
                              })}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </nav>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Search Bar - Desktop */}
              <div className="hidden lg:flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    className="pl-10 pr-4 py-2 w-64 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Notifications */}
              <NotificationBell />

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 p-2 hover:bg-neutral-900 rounded-lg transition-colors"
                >
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-semibold text-neutral-50">
                      {user?.nome || "Usuário"}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {user?.grupoAcesso || "Usuário"}
                    </p>
                  </div>
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/30">
                      <span className="text-neutral-950 font-bold">
                        {user?.nome ? user.nome.charAt(0).toUpperCase() : "U"}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-neutral-950 rounded-full" />
                  </div>
                </button>

                {/* User Dropdown */}
                <AnimatePresence>
                  {showUserMenu && (
                    <>
                      {/* Backdrop para fechar ao clicar fora */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowUserMenu(false)}
                      />

                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-56 bg-neutral-900 rounded-xl shadow-2xl border border-neutral-800 overflow-hidden z-[100]"
                      >
                        <div className="p-4 bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-b border-neutral-800">
                          <p className="text-sm font-semibold text-neutral-50">
                            {user?.nome || "Usuário"}
                          </p>
                          <p className="text-xs text-neutral-400">
                            {user?.email || "usuario@email.com"}
                          </p>
                          <div className="mt-2">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${(() => {
                                const grupo =
                                  permissoes?.grupo || user?.grupoAcesso || "";
                                switch (grupo.toLowerCase()) {
                                  case "administrador":
                                    return "bg-red-500/20 text-red-400 border border-red-500/30";
                                  case "faturamento":
                                    return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
                                  case "gestor de filial":
                                    return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
                                  case "consultores":
                                    return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
                                  case "cobrança e financeiro":
                                  case "cobrança/financeiro":
                                    return "bg-green-500/20 text-green-400 border border-green-500/30";
                                  case "administrativo de filial":
                                    return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
                                  case "usuario":
                                  case "usuário":
                                    return "bg-neutral-700 text-neutral-300 border border-neutral-600";
                                  default:
                                    return "bg-neutral-700 text-neutral-300 border border-neutral-600";
                                }
                              })()}`}
                            >
                              {permissoes?.grupo ||
                                user?.grupoAcesso ||
                                "Carregando..."}
                            </span>
                          </div>
                        </div>
                        <div className="p-2">
                          <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors">
                            <Settings className="w-4 h-4" />
                            Configurações
                          </button>
                          <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sair
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-neutral-50 rounded-lg"
              >
                {mobileMenuOpen ? (
                  <CloseIcon className="w-6 h-6 text-neutral-600" />
                ) : (
                  <Menu className="w-6 h-6 text-neutral-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-neutral-200/60"
          >
            <div className="px-4 py-4 space-y-2">
              <Link
                href="/"
                className="block px-4 py-2 text-sm font-medium text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
              >
                Dashboard
              </Link>
              {filteredMenuItems.map((group) => (
                <div key={group.label} className="space-y-1">
                  <p className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase">
                    {group.label}
                  </p>
                  {group.items.map((item) => {
                    const mobileClass =
                      "flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg";
                    const mobileContent = (
                      <>
                        {item.icon}
                        <span>{item.label}</span>
                        {item.external && (
                          <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                        )}
                        {item.badge && (
                          <span className="ml-auto px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    );

                    return item.external ? (
                      <a
                        key={item.href}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={mobileClass}
                      >
                        {mobileContent}
                      </a>
                    ) : (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => {
                          console.log(
                            "Mobile - Clicando em:",
                            item.label,
                            "href:",
                            item.href,
                          );
                        }}
                        className={mobileClass}
                      >
                        {mobileContent}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay */}
      <AnimatePresence>
        {(activeDropdown || showNotifications || showUserMenu) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30"
            onClick={() => {
              setActiveDropdown(null);
              setShowNotifications(false);
              setShowUserMenu(false);
            }}
          />
        )}
      </AnimatePresence>
    </header>
  );
}
