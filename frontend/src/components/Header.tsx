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
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const menuItems: MenuGroup[] = [
  {
    label: "Cadastros",
    items: [
      {
        label: "Pessoa Física",
        href: "/cadastros/pessoa-fisica",
        icon: <Users className="w-4 h-4" />,
      },
      {
        label: "Pessoa Jurídica",
        href: "/cadastros/pessoa-juridica",
        icon: <Building2 className="w-4 h-4" />,
      },
      {
        label: "Consultores",
        href: "/consultores",
        icon: <UserCheck className="w-4 h-4" />,
      },
      {
        label: "Parceiros",
        href: "/parceiros",
        icon: <Scale className="w-4 h-4" />,
      },
      {
        label: "Clientes",
        href: "/clientes",
        icon: <Users className="w-4 h-4 text-gold-500" />,
      },
    ],
  },
  {
    label: "Gestão",
    items: [
      {
        label: "Usuários",
        href: "/usuarios",
        icon: <UserCheck className="w-4 h-4" />,
        badge: "3",
      },
    ],
  },
];

export default function Header() {
  const { user, logout } = useAuth();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleDropdownToggle = (label: string) => {
    setActiveDropdown(activeDropdown === label ? null : label);
  };

  return (
    <header className="relative z-50 bg-white border-b border-neutral-200/60">
      {/* Top bar - Linha dourada premium */}
      <div className="h-1 bg-gradient-to-r from-primary-500 via-gold-500 to-primary-500" />

      {/* Main header */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo Section */}
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-3 group">
                <motion.div whileHover={{ rotate: 10 }} className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl blur-md opacity-50 group-hover:opacity-70 transition-opacity" />
                  <div className="relative p-2.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                    <Scale className="w-6 h-6 text-white" />
                  </div>
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold text-neutral-900">
                    Arrighi
                  </h1>
                  <p className="text-xs text-neutral-500 font-medium -mt-0.5">
                    ENTERPRISE CRM
                  </p>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-1">
                <Link
                  href="/"
                  className="px-4 py-2 text-sm font-medium text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                >
                  Dashboard
                </Link>

                <Link
                  href="/contratos"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                >
                  <FileText className="w-4 h-4 text-primary-600" />
                  <span>Contratos</span>
                </Link>

                {menuItems.map((group) => (
                  <div key={group.label} className="relative">
                    <button
                      onClick={() => handleDropdownToggle(group.label)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                        activeDropdown === group.label
                          ? "text-primary-600 bg-primary-50"
                          : "text-neutral-700 hover:text-primary-600 hover:bg-primary-50"
                      )}
                    >
                      <span>{group.label}</span>
                      <ChevronDown
                        className={cn(
                          "w-3.5 h-3.5 transition-transform",
                          activeDropdown === group.label && "rotate-180"
                        )}
                      />
                    </button>

                    {/* Premium Dropdown */}
                    <AnimatePresence>
                      {activeDropdown === group.label && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-neutral-200/60 overflow-hidden z-50"
                        >
                          <div className="bg-gradient-to-r from-primary-50 to-gold-50 p-3 border-b border-neutral-200/60">
                            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                              {group.label}
                            </p>
                          </div>
                          <div className="p-2">
                            {group.items.map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => {
                                  console.log(
                                    "Clicando em:",
                                    item.label,
                                    "href:",
                                    item.href
                                  );
                                  setActiveDropdown(null);
                                }}
                                className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-primary-50 transition-all duration-200 group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-neutral-100 rounded-lg group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                                    {item.icon}
                                  </div>
                                  <span className="text-sm font-medium text-neutral-700 group-hover:text-primary-600">
                                    {item.label}
                                  </span>
                                </div>
                                {item.badge && (
                                  <span className="px-2 py-0.5 bg-gold-500 text-white text-xs font-bold rounded-full">
                                    {item.badge}
                                  </span>
                                )}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    className="pl-10 pr-4 py-2 w-64 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Notifications */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5 text-neutral-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-gold-500 rounded-full animate-pulse" />
              </motion.button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-lg transition-colors"
                >
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-semibold text-neutral-900">
                      {user?.nome || "Usuário"}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {user?.grupoAcesso || "Usuário"}
                    </p>
                  </div>
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold">
                        {user?.nome ? user.nome.charAt(0).toUpperCase() : "U"}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  </div>
                </button>

                {/* User Dropdown */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-neutral-200/60 overflow-hidden z-50"
                    >
                      <div className="p-4 bg-gradient-to-r from-primary-50 to-gold-50 border-b border-neutral-200/60">
                        <p className="text-sm font-semibold text-neutral-900">
                          {user?.nome || "Usuário"}
                        </p>
                        <p className="text-xs text-neutral-600">
                          {user?.email || "usuario@email.com"}
                        </p>
                      </div>
                      <div className="p-2">
                        <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors">
                          <Settings className="w-4 h-4" />
                          Configurações
                        </button>
                        <button
                          onClick={logout}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sair
                        </button>
                      </div>
                    </motion.div>
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
              <Link
                href="/contratos"
                className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
              >
                <FileText className="w-4 h-4 text-primary-600" />
                <span>Contratos</span>
              </Link>
              {menuItems.map((group) => (
                <div key={group.label} className="space-y-1">
                  <p className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase">
                    {group.label}
                  </p>
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        console.log(
                          "Mobile - Clicando em:",
                          item.label,
                          "href:",
                          item.href
                        );
                      }}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto px-2 py-0.5 bg-gold-500 text-white text-xs font-bold rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
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
