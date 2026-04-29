"use client";

import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Cliente } from "@/types/api";
import { X, Search, Users, Building2, Phone, Mail, IdCard } from "lucide-react";
import { cn, formatDocumentoDisplay } from "@/lib/utils";

interface ClientePickerModalProps {
  isOpen: boolean;
  clientes: Cliente[];
  onClose: () => void;
  onSelect: (cliente: Cliente) => void;
}

export default function ClientePickerModal({
  isOpen,
  clientes,
  onClose,
  onSelect,
}: ClientePickerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clientes;
    return clientes.filter((c) => {
      const nome = c.pessoaFisica?.nome || c.pessoaJuridica?.razaoSocial || "";
      const email =
        c.pessoaFisica?.emailEmpresarial || c.pessoaJuridica?.email || "";
      const cpf = c.pessoaFisica?.cpf || "";
      const cnpj = c.pessoaJuridica?.cnpj || "";
      const f1 = c.pessoaFisica?.telefone1 || c.pessoaJuridica?.telefone1 || "";
      const f2 = c.pessoaFisica?.telefone2 || c.pessoaJuridica?.telefone2 || "";
      const f3 = (c as any).telefone3 || c.pessoaJuridica?.telefone3 || "";
      const f4 = (c as any).telefone4 || c.pessoaJuridica?.telefone4 || "";
      return (
        nome.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term) ||
        cpf.includes(term) ||
        cnpj.includes(term) ||
        f1.includes(term) ||
        f2.includes(term) ||
        f3.includes(term) ||
        f4.includes(term)
      );
    });
  }, [clientes, search]);

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="cliente-picker-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999]"
            onClick={onClose}
          />
          <motion.div
            key="cliente-picker-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-[99999] p-4"
          >
            <div className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-800 w-full max-w-6xl max-h-[90vh] overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-lg shadow-amber-500/20">
                    <Users className="w-5 h-5 text-neutral-950" />
                  </div>
                  <h2 className="text-xl font-bold text-gradient-amber">
                    Selecionar Cliente
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 border-b border-neutral-800">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nome, email, CPF/CNPJ ou telefone..."
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="p-4 overflow-auto max-h-[calc(90vh-170px)]">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-amber-500 border-b border-neutral-800">
                      <th className="py-3 pr-4 font-medium text-xs uppercase tracking-wider">Nome/Razão Social</th>
                      <th className="py-3 pr-4 font-medium text-xs uppercase tracking-wider">Tipo</th>
                      <th className="py-3 pr-4 font-medium text-xs uppercase tracking-wider">CPF/CNPJ</th>
                      <th className="py-3 pr-4 font-medium text-xs uppercase tracking-wider">Email</th>
                      <th className="py-3 pr-4 font-medium text-xs uppercase tracking-wider">Telefones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => {
                      const nome =
                        c.pessoaFisica?.nome ||
                        c.pessoaJuridica?.razaoSocial ||
                        "—";
                      const tipo =
                        c.tipoPessoa === "Fisica" ? "Física" : "Jurídica";
                      const doc =
                        formatDocumentoDisplay(c.pessoaFisica?.cpf || c.pessoaJuridica?.cnpj) || "—";
                      const email =
                        c.pessoaFisica?.emailEmpresarial ||
                        c.pessoaJuridica?.email ||
                        "—";
                      const tels = [
                        c.pessoaFisica?.telefone1 ||
                          c.pessoaJuridica?.telefone1,
                        c.pessoaFisica?.telefone2 ||
                          c.pessoaJuridica?.telefone2,
                        (c as any).telefone3 || c.pessoaJuridica?.telefone3,
                        (c as any).telefone4 || c.pessoaJuridica?.telefone4,
                      ]
                        .filter(Boolean)
                        .join(" · ");
                      return (
                        <tr
                          key={c.id}
                          onDoubleClick={() => onSelect(c)}
                          className={cn(
                            "border-b border-neutral-800 hover:bg-neutral-800/50 cursor-pointer transition-colors group"
                          )}
                        >
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              {c.tipoPessoa === "Fisica" ? (
                                <IdCard className="w-4 h-4 text-amber-500" />
                              ) : (
                                <Building2 className="w-4 h-4 text-amber-500" />
                              )}
                              <span className="font-medium text-neutral-50 group-hover:text-amber-400 transition-colors">
                                {nome}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-neutral-300">{tipo}</td>
                          <td className="py-3 pr-4 text-neutral-300">{doc}</td>
                          <td className="py-3 pr-4 text-neutral-300">{email}</td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2 text-neutral-400">
                              <Phone className="w-4 h-4" />
                              <span>{tels || "—"}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center"
                        >
                          <Users className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                          <p className="text-neutral-400 font-medium">Nenhum cliente encontrado</p>
                          <p className="text-neutral-500 text-xs mt-1">Tente ajustar sua busca</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
