// src/app/parceiros/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  Loader2,
  Scale,
  Award,
  Phone,
  Mail,
  CheckCircle,
  Building,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";
import ParceiroForm from "@/components/forms/ParceiroForm";
import { Tooltip } from "@/components";
import { useParceiros } from "@/hooks/useParceiros";
import { Parceiro } from "@/types/api";
import { cn, truncateText } from "@/lib/utils";
import { useForm } from "@/contexts/FormContext";

function StatusBadge({ ativo }: { ativo: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        ativo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      )}
    >
      {ativo ? "Ativo" : "Inativo"}
    </span>
  );
}

function AdvogadoBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-md">
      <Award className="w-3 h-3" />
      Advogado
    </span>
  );
}

function isAdvogado(email: string | undefined): boolean {
  return email?.toLowerCase().endsWith("@arrighiadvogados.com.br") || false;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
    </div>
  );
}

function ErrorMessage({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"
    >
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-red-900 mb-2">
        Erro ao carregar dados
      </h3>
      <p className="text-red-700 mb-4">{message}</p>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
      >
        Tentar novamente
      </motion.button>
    </motion.div>
  );
}

export default function ParceirosPage() {
  const {
    parceiros,
    loading,
    error,
    creating,
    updating,
    deleting,
    fetchParceiros,
    createParceiro,
    updateParceiro,
    deleteParceiro,
    clearError,
  } = useParceiros();

  const { openForm, closeForm } = useForm();

  const [showForm, setShowForm] = useState(false);
  const [editingParceiro, setEditingParceiro] = useState<Parceiro | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFilial, setFilterFilial] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedParceiroId, setSelectedParceiroId] = useState<number | null>(
    null
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Filtrar e ordenar parceiros
  const filteredParceiros = parceiros
    .filter((parceiro: Parceiro) => {
      const matchesSearch =
        parceiro.pessoaFisica?.nome
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        parceiro.oab?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parceiro.pessoaFisica?.emailEmpresarial
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        parceiro.pessoaFisica?.emailPessoal
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesFilial =
        !filterFilial || parceiro.filial?.nome?.includes(filterFilial);

      const matchesStatus =
        !filterStatus ||
        (filterStatus === "ativo" && parceiro.ativo) ||
        (filterStatus === "inativo" && !parceiro.ativo);

      return matchesSearch && matchesFilial && matchesStatus;
    })
    .sort((a, b) => {
      const nomeA = a.pessoaFisica?.nome?.toLowerCase() || "";
      const nomeB = b.pessoaFisica?.nome?.toLowerCase() || "";
      return nomeA.localeCompare(nomeB, "pt-BR");
    });

  const totalPages = Math.ceil(filteredParceiros.length / ITEMS_PER_PAGE);
  const paginatedParceiros = filteredParceiros.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterFilial, filterStatus]);

  const handleCreateOrUpdate = async (
    data: any
  ): Promise<{ success: boolean; error?: string }> => {
    setFormError(null);
    try {
      if (editingParceiro) {
        await updateParceiro(editingParceiro.id, data);
      } else {
        await createParceiro(data);
      }
      return { success: true };
    } catch (error: any) {
      console.error("Erro ao salvar parceiro:", error);
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        "Erro ao salvar parceiro. Tente novamente.";
      setFormError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const handleEdit = (parceiro: Parceiro) => {
    setEditingParceiro(parceiro);
    setShowForm(true);
    openForm();
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteParceiro(id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Erro ao deletar parceiro:", error);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingParceiro(null);
    setFormError(null);
    clearError();
    closeForm();
  };

  const handleOpenForm = () => {
    setShowForm(true);
    openForm();
  };

  const handleSelectParceiro = (id: number) => {
    setSelectedParceiroId((prev) => (prev === id ? null : id));
  };

  const handleViewParceiro = () => {
    if (selectedParceiroId) {
      const p = parceiros.find((x: Parceiro) => x.id === selectedParceiroId);
      if (p) {
        alert(`Visualizando: ${p.pessoaFisica?.nome || "(sem nome)"}`);
      }
    }
  };

  const handleEditSelected = () => {
    if (selectedParceiroId) {
      const p = parceiros.find((x: Parceiro) => x.id === selectedParceiroId);
      if (p) handleEdit(p);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedParceiroId) {
      setShowDeleteConfirm(selectedParceiroId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  // Estatísticas
  const stats = {
    total: parceiros.length,
    ativos: parceiros.filter((p: Parceiro) => p.ativo).length,
    comOAB: parceiros.filter((p: Parceiro) => p.oab).length,
    filiais: [
      ...new Set(parceiros.map((p: Parceiro) => p.filial?.nome)),
    ].filter(Boolean).length,
  };

  // Lista de filiais únicas
  const filiais = [
    ...new Set(parceiros.map((p: Parceiro) => p.filial?.nome)),
  ].filter(Boolean);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white">
              <Scale className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Parceiros</h1>
              <p className="text-sm text-neutral-300">
                Gerenciar parceiros e responsáveis técnicos
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenForm}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-medium shadow-lg transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Parceiro</span>
          </motion.button>
        </motion.div>

        {/* Filtros e Busca */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-neutral-800"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nome, OAB ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
              />
              {selectedParceiroId && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="bg-accent-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                </div>
              )}
            </div>

            <select
              value={filterFilial}
              onChange={(e) => setFilterFilial(e.target.value)}
              className="px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Todas as filiais</option>
              {filiais.map((filial: string) => (
                <option key={filial} value={filial}>
                  {filial}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>

            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleViewParceiro}
                disabled={!selectedParceiroId}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-secondary-100 hover:bg-secondary-200 disabled:bg-neutral-800/50 disabled:text-amber-500 text-neutral-200 rounded-xl font-medium transition-all duration-200"
                title="Visualizar parceiro selecionado"
              >
                <Eye className="w-4 h-4" />
                <span>Visualizar</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEditSelected}
                disabled={!selectedParceiroId}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-accent-100 hover:bg-accent-200 disabled:bg-neutral-800/50 disabled:text-amber-500 text-accent-700 rounded-xl font-medium transition-all duration-200"
                title="Editar parceiro selecionado"
              >
                <Edit className="w-4 h-4" />
                <span>Editar</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDeleteSelected}
                disabled={!selectedParceiroId}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-100 hover:bg-red-200 disabled:bg-neutral-800/50 disabled:text-amber-500 text-red-700 rounded-xl font-medium transition-all duration-200"
                title="Excluir parceiro selecionado"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Estatísticas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <div className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl p-4 shadow-sm border border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-300 text-sm font-medium">
                  Total de Parceiros
                </p>
                <p className="text-2xl font-bold text-neutral-50">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Scale className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl p-4 shadow-sm border border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-300 text-sm font-medium">
                  Parceiros Ativos
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.ativos}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl p-4 shadow-sm border border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-300 text-sm font-medium">Com OAB</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.comOAB}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl p-4 shadow-sm border border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-300 text-sm font-medium">Filiais</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.filiais}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <Building className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Lista ou Grid de Parceiros */}
        {error && !loading ? (
          <ErrorMessage message={error} onRetry={fetchParceiros} />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-sm border border-neutral-800 overflow-hidden relative"
          >
            {/* Loading overlay centralizado */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm"
                >
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                    <span className="text-sm text-neutral-300">Carregando...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-50">
                Lista de Parceiros ({filteredParceiros.length} registros)
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    viewMode === "list"
                      ? "bg-amber-500/20 text-amber-400"
                      : "text-amber-500 hover:text-neutral-300"
                  )}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    viewMode === "grid"
                      ? "bg-amber-500/20 text-amber-400"
                      : "text-amber-500 hover:text-neutral-300"
                  )}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {filteredParceiros.length === 0 && !loading ? (
              <div className="text-center py-12">
                <Scale className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-50 mb-2">
                  {searchTerm || filterFilial || filterStatus
                    ? "Nenhum resultado encontrado"
                    : "Nenhum parceiro cadastrado"}
                </h3>
                <p className="text-neutral-300">
                  {searchTerm || filterFilial || filterStatus
                    ? "Tente ajustar os filtros de busca"
                    : "Clique em 'Novo Parceiro' para começar"}
                </p>
              </div>
            ) : viewMode === "list" ? (
              <div className="overflow-auto max-h-[60vh] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-neutral-900 sticky top-0 z-[5]">
                    <tr>
                      <th className="px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                        Parceiro
                      </th>
                      <th className="px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                        OAB
                      </th>
                      <th className="px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                        CPF
                      </th>
                      <th className="px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                        Filial
                      </th>
                      <th className="px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                        Contato
                      </th>
                      <th className="px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                        Cadastro
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-200/50">
                    {paginatedParceiros.map(
                      (parceiro: Parceiro, index: number) => (
                        <motion.tr
                          key={parceiro.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 * index }}
                          onClick={() => handleSelectParceiro(parceiro.id)}
                          onDoubleClick={() => {
                            setEditingParceiro(parceiro);
                            setShowForm(true);
                            openForm();
                          }}
                          className={cn(
                            "transition-colors duration-200 cursor-pointer",
                            selectedParceiroId === parceiro.id
                              ? "bg-secondary-200 hover:bg-secondary-200 border-l-4 border-accent-500"
                              : "hover:bg-neutral-800/25"
                          )}
                        >
                          <td className="px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-white">
                                  {(parceiro.pessoaFisica?.nome || "N").charAt(
                                    0
                                  )}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium text-neutral-50">
                                    <Tooltip
                                      content={
                                        parceiro.pessoaFisica?.nome ||
                                        "Nome não informado"
                                      }
                                    >
                                      <span className="cursor-help">
                                        {truncateText(
                                          parceiro.pessoaFisica?.nome ||
                                            "Nome não informado",
                                          20
                                        )}
                                      </span>
                                    </Tooltip>
                                  </div>
                                  {isAdvogado(
                                    parceiro.email ||
                                      parceiro.pessoaFisica?.emailEmpresarial
                                  ) && <AdvogadoBadge />}
                                </div>
                                <div className="text-sm text-neutral-400">
                                  {parceiro.email ||
                                    parceiro.pessoaFisica?.emailEmpresarial ||
                                    "N/A"}
                                </div>
                              </div>
                            </div>
                            {selectedParceiroId === parceiro.id && (
                              <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800/80 px-2 py-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(parceiro);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-colors"
                                  title="Editar parceiro"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDeleteConfirm(parceiro.id);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-300 hover:bg-red-500/20 transition-colors"
                                  title="Excluir parceiro"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Excluir</span>
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 whitespace-nowrap text-sm text-neutral-300">
                            {parceiro.oab || "N/A"}
                          </td>
                          <td className="px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 whitespace-nowrap text-sm text-neutral-300">
                            {parceiro.pessoaFisica?.cpf || "N/A"}
                          </td>
                          <td className="px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 whitespace-nowrap text-sm text-neutral-300">
                            {parceiro.filial?.nome || "N/A"}
                          </td>
                          <td className="px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 whitespace-nowrap">
                            <div className="text-sm text-neutral-50">
                              {parceiro.telefone ||
                                parceiro.pessoaFisica?.telefone1 ||
                                "N/A"}
                            </div>
                          </td>
                          <td className="px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 whitespace-nowrap">
                            <StatusBadge ativo={parceiro.ativo} />
                          </td>
                          <td className="px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 whitespace-nowrap text-sm text-neutral-300">
                            {formatDate(parceiro.dataCadastro)}
                          </td>
                        </motion.tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {paginatedParceiros.map((parceiro: Parceiro, index: number) => (
                  <motion.div
                    key={parceiro.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * index }}
                    className="bg-neutral-900/95 backdrop-blur-xl rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 border border-neutral-800"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold text-white">
                            {(parceiro.pessoaFisica?.nome || "N").charAt(0)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-lg font-semibold text-neutral-50">
                              <Tooltip
                                content={
                                  parceiro.pessoaFisica?.nome ||
                                  "Nome não informado"
                                }
                              >
                                <span className="cursor-help">
                                  {truncateText(
                                    parceiro.pessoaFisica?.nome ||
                                      "Nome não informado",
                                    25
                                  )}
                                </span>
                              </Tooltip>
                            </h4>
                            {isAdvogado(
                              parceiro.email ||
                                parceiro.pessoaFisica?.emailEmpresarial
                            ) && (
                              <div className="mt-1">
                                <AdvogadoBadge />
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-neutral-400">
                            {parceiro.oab || "Sem OAB"}
                          </p>
                        </div>
                      </div>
                      <StatusBadge ativo={parceiro.ativo} />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-neutral-300">
                        <Mail className="w-4 h-4 mr-2" />
                        {parceiro.email ||
                          parceiro.pessoaFisica?.emailEmpresarial ||
                          "N/A"}
                      </div>
                      <div className="flex items-center text-sm text-neutral-300">
                        <Phone className="w-4 h-4 mr-2" />
                        {parceiro.telefone ||
                          parceiro.pessoaFisica?.telefone1 ||
                          "N/A"}
                      </div>
                      <div className="flex items-center text-sm text-neutral-300">
                        <Building className="w-4 h-4 mr-2" />
                        {parceiro.filial?.nome || "Filial não informada"}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-neutral-700">
                      <div className="text-xs text-neutral-400">
                        Cadastrado em {formatDate(parceiro.dataCadastro)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

              {/* Paginação */}
              {filteredParceiros.length > 0 && (
                <div className="px-6 py-4 bg-neutral-800/30 border-t border-neutral-700/50">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                    <div className="text-xs sm:text-sm text-neutral-400 text-center sm:text-left">
                      Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{" "}
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredParceiros.length)} de{" "}
                      {filteredParceiros.length} registros
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-neutral-300 bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 hover:border-amber-500/50 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-neutral-800 disabled:hover:border-neutral-700"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </motion.button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          if (totalPages <= 7) return true;
                          if (page === 1 || page === totalPages) return true;
                          if (Math.abs(page - currentPage) <= 1) return true;
                          if (page === currentPage - 2 || page === currentPage + 2) return true;
                          return false;
                        })
                        .reduce<(number | "ellipsis")[]>((acc, page, idx, arr) => {
                          if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                            acc.push("ellipsis");
                          }
                          acc.push(page);
                          return acc;
                        }, [])
                        .map((item, idx) =>
                          item === "ellipsis" ? (
                            <span
                              key={`ellipsis-${idx}`}
                              className="px-1 sm:px-2 text-neutral-500 text-xs"
                            >
                              ...
                            </span>
                          ) : (
                            <motion.button
                              key={item}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setCurrentPage(item)}
                              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200 ${
                                currentPage === item
                                  ? "text-white bg-amber-500 border border-transparent hover:bg-amber-600"
                                  : "text-neutral-300 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 hover:border-amber-500/50"
                              }`}
                            >
                              {item}
                            </motion.button>
                          )
                        )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-neutral-300 bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 hover:border-amber-500/50 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-neutral-800 disabled:hover:border-neutral-700"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
        )}

        {/* Formulário Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-4xl max-h-screen overflow-y-auto">
                <ParceiroForm
                  initialData={editingParceiro}
                  onSubmit={handleCreateOrUpdate}
                  onCancel={handleCloseForm}
                  onBackToList={handleCloseForm}
                  loading={creating || updating}
                  externalError={formError}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Confirmação de Exclusão */}
        <AnimatePresence>
          {showDeleteConfirm !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full shadow-xl"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-50">
                    Confirmar Exclusão
                  </h3>
                </div>
                <p className="text-neutral-300 mb-6">
                  Tem certeza que deseja excluir este parceiro? Esta ação não
                  pode ser desfeita.
                </p>
                <div className="flex justify-end space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 text-neutral-200 bg-secondary-100 hover:bg-secondary-200 rounded-lg font-medium transition-colors duration-200"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDelete(showDeleteConfirm)}
                    disabled={deleting}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                  >
                    {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{deleting ? "Excluindo..." : "Excluir"}</span>
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}
