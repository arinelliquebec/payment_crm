"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cliente } from "@/types/api";
import { X, Search, Users, Building2, Phone, Mail, IdCard } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clientes;
    return clientes.filter((c) => {
      const nome = c.pessoaFisica?.nome || c.pessoaJuridica?.razaoSocial || "";
      const email = c.pessoaFisica?.email || c.pessoaJuridica?.email || "";
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="cliente-picker-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999]"
            onClick={onClose}
          />
          <motion.div
            key="cliente-picker-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Selecionar Cliente
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="p-4 border-b border-neutral-200">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nome, email, CPF/CNPJ ou telefone..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="p-4 overflow-auto max-h-[calc(90vh-170px)]">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-neutral-600 border-b">
                      <th className="py-2 pr-4">Nome/Razão Social</th>
                      <th className="py-2 pr-4">Tipo</th>
                      <th className="py-2 pr-4">CPF/CNPJ</th>
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4">Telefones</th>
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
                        c.pessoaFisica?.cpf || c.pessoaJuridica?.cnpj || "—";
                      const email =
                        c.pessoaFisica?.email || c.pessoaJuridica?.email || "—";
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
                            "border-b hover:bg-primary-50/50 cursor-pointer"
                          )}
                        >
                          <td className="py-2 pr-4">
                            <div className="flex items-center gap-2">
                              {c.tipoPessoa === "Fisica" ? (
                                <IdCard className="w-4 h-4 text-primary-600" />
                              ) : (
                                <Building2 className="w-4 h-4 text-primary-600" />
                              )}
                              <span className="font-medium text-neutral-900">
                                {nome}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 pr-4">{tipo}</td>
                          <td className="py-2 pr-4">{doc}</td>
                          <td className="py-2 pr-4">{email}</td>
                          <td className="py-2 pr-4">
                            <div className="flex items-center gap-2 text-neutral-700">
                              <Phone className="w-4 h-4 text-neutral-400" />
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
                          className="py-8 text-center text-neutral-500"
                        >
                          Nenhum cliente encontrado
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
}
