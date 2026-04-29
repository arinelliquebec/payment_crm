// src/app/cadastros/pessoa-fisica/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Users,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Briefcase,
  UserCheck,
  Handshake,
  Shield,
  Award,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";
import PessoaFisicaForm from "@/components/forms/PessoaFisicaForm";
import { Tooltip } from "@/components";
import { usePessoaFisica } from "@/hooks/usePessoaFisica";
import { usePessoaRoles } from "@/hooks/usePessoaRoles";
import {
  PessoaFisica,
  CreatePessoaFisicaDTO,
  UpdatePessoaFisicaDTO,
} from "@/types/api";
import { cn, truncateText, formatCPFDisplay } from "@/lib/utils";
import { useForm } from "@/contexts/FormContext";
import { PermissionWrapper } from "@/components/permissions";

function StatusBadge({
  status,
  isCompact = false,
}: {
  status: "ativo" | "inativo";
  isCompact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        isCompact
          ? "px-2 py-0.5 text-[9px] sm:text-[10px]"
          : "px-2.5 py-1 text-[10px] sm:text-xs",
        status === "ativo"
          ? "bg-green-500/20 text-green-400 border border-green-500/30"
          : "bg-red-500/20 text-red-400 border border-red-500/30"
      )}
    >
      {status === "ativo" ? (
        <CheckCircle
          className={
            isCompact ? "w-2.5 h-2.5 mr-1" : "w-3 h-3 mr-1"
          }
        />
      ) : (
        <XCircle
          className={
            isCompact ? "w-2.5 h-2.5 mr-1" : "w-3 h-3 mr-1"
          }
        />
      )}
      {status === "ativo" ? "Ativo" : "Inativo"}
    </span>
  );
}

function RoleBadge({
  role,
  isCompact = false,
}: {
  role: "cliente" | "consultor" | "parceiro" | "usuario";
  isCompact?: boolean;
}) {
  const configs = {
    cliente: {
      label: "Cliente",
      icon: Briefcase,
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    },
    consultor: {
      label: "Consultor",
      icon: UserCheck,
      color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    },
    parceiro: {
      label: "Parceiro",
      icon: Handshake,
      color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    },
    usuario: {
      label: "Usuário",
      icon: Shield,
      color: "bg-green-500/20 text-green-400 border-green-500/30",
    },
  };

  const config = configs[role];
  const Icon = config.icon;

  return (
    <Tooltip content={`Esta pessoa é ${config.label} no sistema`}>
      <span
        className={cn(
          "inline-flex items-center rounded-full font-medium border",
          isCompact
            ? "px-2 py-0.5 text-[9px] sm:text-[10px]"
            : "px-2.5 py-1 text-[10px] sm:text-xs",
          config.color
        )}
      >
        <Icon
          className={
            isCompact ? "w-2.5 h-2.5 mr-1" : "w-3 h-3 mr-1"
          }
        />
        {config.label}
      </span>
    </Tooltip>
  );
}

function AdvogadoBadge({ isCompact = false }: { isCompact?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-md border border-amber-500/30",
        isCompact
          ? "px-2 py-0.5 text-[9px] sm:text-[10px]"
          : "px-2.5 py-1 text-[10px] sm:text-xs"
      )}
    >
      <Award
        className={isCompact ? "w-2.5 h-2.5" : "w-3 h-3"}
      />
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

export default function PessoaFisicaPage() {
  const {
    pessoas,
    loading,
    error,
    creating,
    updating,
    deleting,
    fetchPessoas,
    createPessoa,
    updatePessoa,
    deletePessoa,
    clearError,
  } = usePessoaFisica();
  const { rolesMap, loading: rolesLoading, getRoles } = usePessoaRoles();
  const router = useRouter();

  const { openForm, closeForm } = useForm();

  const [showForm, setShowForm] = useState(false);
  const [editingPessoa, setEditingPessoa] = useState<PessoaFisica | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null
  );
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Debounce do termo de busca para evitar buscas excessivas
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Buscar pessoas quando o termo debounced mudar
  useEffect(() => {
    if (debouncedSearchTerm) {
      // Busca com termo - limite maior para resultados filtrados
      fetchPessoas(debouncedSearchTerm, 200);
    } else {
      // Busca inicial sem termo - todas as pessoas (limite alto)
      fetchPessoas("", 1000);
    }
  }, [debouncedSearchTerm, fetchPessoas]);

  // Carregar inicial - todas as pessoas
  useEffect(() => {
    fetchPessoas("", 1000);
  }, []);

  // ✅ REMOVIDO FILTRO CLIENT-SIDE - Backend já filtra e ordena otimizadamente
  const filteredPessoas = pessoas;

  // Paginação
  const totalPages = Math.ceil(filteredPessoas.length / ITEMS_PER_PAGE);
  const paginatedPessoas = filteredPessoas.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Resetar para página 1 quando a busca mudar
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const handleCreateOrUpdate = async (
    data: CreatePessoaFisicaDTO | UpdatePessoaFisicaDTO
  ) => {
    if (editingPessoa) {
      return await updatePessoa(
        editingPessoa.id,
        data as UpdatePessoaFisicaDTO
      );
    } else {
      return await createPessoa(data as CreatePessoaFisicaDTO);
    }
  };

  const handleSelectPerson = (personId: number) => {
    setSelectedPersonId(selectedPersonId === personId ? null : personId);
  };

  const handleViewPerson = () => {
    if (selectedPersonId) {
      const person = pessoas.find((p) => p.id === selectedPersonId);
      if (person) {
        // Aqui você pode implementar a visualização detalhada
        alert(`Visualizando: ${person.nome}`);
      }
    }
  };

  const handleEditSelected = () => {
    if (selectedPersonId) {
      const person = pessoas.find((p) => p.id === selectedPersonId);
      if (person) {
        handleEdit(person);
      }
    }
  };

  const handleDeleteSelected = () => {
    if (selectedPersonId) {
      setShowDeleteConfirm(selectedPersonId);
    }
  };

  const handleEdit = (pessoa: PessoaFisica) => {
    setEditingPessoa(pessoa);
    setShowForm(true);
    openForm();
  };

  const handleDelete = async (id: number) => {
    const success = await deletePessoa(id);
    // Sempre fechar o modal, independente do resultado
    setShowDeleteConfirm(null);

    // Limpar seleção se a pessoa excluída era a selecionada
    if (selectedPersonId === id) {
      setSelectedPersonId(null);
    }

    // Se não foi bem-sucedido, o erro já foi definido no hook
    // e será exibido na interface
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPessoa(null);
    setSelectedPersonId(null);
    clearError();
    closeForm();
  };

  const handleOpenForm = () => {
    setShowForm(true);
    openForm();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  // Estatísticas calculadas
  const stats = {
    total: pessoas.length,
    ativos: pessoas.length, // Assumindo que todos estão ativos por enquanto
    novosEstemês: pessoas.filter((p) => {
      const cadastro = new Date(p.dataCadastro);
      const hoje = new Date();
      const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      return cadastro >= mesAtual;
    }).length,
  };

  return (
    <PermissionWrapper
      modulo="PessoaFisica"
      acao="Visualizar"
      fallback={
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-50 mb-2">
                Acesso Negado
              </h3>
              <p className="text-neutral-400">
                Você não tem permissão para acessar pessoas físicas.
              </p>
            </div>
          </div>
        </MainLayout>
      }
    >
      <MainLayout>
        <div className="space-y-4 sm:space-y-5 lg:space-y-6 w-full max-w-none">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 w-full"
          >
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
              <div className="p-1.5 sm:p-2 lg:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl text-white">
                <Users className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg lg:text-xl font-bold gradient-text">
                  Pessoas Físicas
                </h1>
                <p className="text-[10px] sm:text-xs text-neutral-300">
                  Gerenciar cadastros de pessoas físicas
                </p>
              </div>
            </div>

            <PermissionWrapper modulo="PessoaFisica" acao="Incluir">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOpenForm}
                className="btn-mobile flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 lg:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg sm:rounded-xl font-medium shadow-lg transition-all duration-200 text-[11px] sm:text-xs lg:text-sm"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                <span>Nova Pessoa</span>
              </motion.button>
            </PermissionWrapper>
          </motion.div>

          {/* Filtros e Busca */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl p-3 sm:p-4 lg:p-5 shadow-lg border border-neutral-800 w-full"
          >
            <div className="flex flex-col md:flex-row gap-2 sm:gap-3 lg:gap-4 w-full">
              <div className="flex-1 relative">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-amber-500 w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                <input
                  type="text"
                  placeholder="Buscar por nome, CPF ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-7 sm:pl-8 lg:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 lg:py-3 bg-neutral-800/50 border border-neutral-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-[11px] sm:text-xs lg:text-sm"
                />
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleViewPerson}
                  disabled={!selectedPersonId}
                    className="btn-mobile flex items-center justify-center space-x-2 px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 lg:py-3 bg-blue-500/20 hover:bg-blue-500/30 disabled:bg-neutral-800/50 disabled:text-neutral-600 text-blue-400 rounded-xl font-medium transition-all duration-200 border border-blue-500/30 disabled:border-neutral-700"
                  title="Visualizar pessoa selecionada"
                >
                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                  <span>Visualizar</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEditSelected}
                  disabled={!selectedPersonId}
                    className="btn-mobile flex items-center justify-center space-x-2 px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 lg:py-3 bg-orange-500/20 hover:bg-orange-500/30 disabled:bg-neutral-800/50 disabled:text-neutral-600 text-orange-400 rounded-xl font-medium transition-all duration-200 border border-orange-500/30 disabled:border-neutral-700"
                  title="Editar pessoa selecionada"
                >
                  <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                  <span>Editar</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDeleteSelected}
                  disabled={!selectedPersonId}
                    className="btn-mobile flex items-center justify-center space-x-2 px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 lg:py-3 bg-red-500/20 hover:bg-red-500/30 disabled:bg-neutral-800/50 disabled:text-neutral-600 text-red-400 rounded-xl font-medium transition-all duration-200 border border-red-500/30 disabled:border-neutral-700"
                  title="Excluir pessoa selecionada"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 w-full"
          >
            <div className="bg-neutral-900/95 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 shadow-lg border border-neutral-800 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] sm:text-xs lg:text-sm text-neutral-300 font-medium">
                    Total de Pessoas
                  </p>
                  <p className="text-base sm:text-lg lg:text-xl font-bold text-neutral-50">
                    {stats.total}
                  </p>
                </div>
                <div className="p-2 sm:p-2.5 lg:p-3 bg-blue-100 rounded-lg sm:rounded-xl">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-neutral-900/95 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 shadow-lg border border-neutral-800 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] sm:text-xs lg:text-sm text-neutral-300 font-medium">
                    Pessoas Ativas
                  </p>
                  <p className="text-base sm:text-lg lg:text-xl font-bold text-blue-600">
                    {stats.ativos}
                  </p>
                </div>
                <div className="p-2 sm:p-2.5 lg:p-3 bg-blue-100 rounded-lg sm:rounded-xl">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-neutral-900/95 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 shadow-lg border border-neutral-800 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] sm:text-xs lg:text-sm text-neutral-300 font-medium">
                    Novas este mês
                  </p>
                  <p className="text-base sm:text-lg lg:text-xl font-bold text-gold-600">
                    {stats.novosEstemês}
                  </p>
                </div>
                <div className="p-2 sm:p-2.5 lg:p-3 bg-gold-100 rounded-lg sm:rounded-xl">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-gold-600" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tabela ou Estados de Loading/Error */}
          {error && !loading ? (
            <ErrorMessage message={error} onRetry={fetchPessoas} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-neutral-900/95 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg border border-neutral-800 overflow-hidden w-full relative"
            >
              <div className="px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 border-b border-neutral-700/50">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-neutral-50">
                  Lista de Pessoas ({filteredPessoas.length} registros)
                </h3>
              </div>

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

              {filteredPessoas.length === 0 && !loading ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-neutral-50 mb-2">
                    {searchTerm
                      ? "Nenhum resultado encontrado"
                      : "Nenhuma pessoa cadastrada"}
                  </h3>
                  <p className="text-neutral-300">
                    {searchTerm
                      ? "Tente ajustar o termo de busca"
                      : "Clique em 'Nova Pessoa' para começar"}
                  </p>
                </div>
              ) : (
                <div className="w-full">
                  <div className="w-full overflow-auto max-h-[60vh] overflow-y-auto">
                    <div className="table-responsive table-container min-w-full">
                      <table
                        className="w-full min-w-[800px] sm:min-w-[1000px] lg:min-w-[1200px] xl:min-w-[1400px]"
                      >
                        <thead className="bg-neutral-900 sticky top-0 z-[5]">
                          <tr>
                            <th
                              className="px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 text-left font-medium text-neutral-400 uppercase tracking-wider text-[10px] sm:text-xs"
                            >
                              Pessoa
                            </th>
                            <th
                              className="px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 text-left font-medium text-neutral-400 uppercase tracking-wider hidden sm:table-cell text-[10px] sm:text-xs"
                            >
                              CPF
                            </th>
                            <th
                              className="px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 text-left font-medium text-neutral-400 uppercase tracking-wider hidden sm:table-cell text-[10px] sm:text-xs"
                            >
                              Contato
                            </th>
                            <th
                              className="px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 text-left font-medium text-neutral-400 uppercase tracking-wider hidden sm:table-cell text-[10px] sm:text-xs"
                            >
                              Status
                            </th>
                            <th
                              className="px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 text-left font-medium text-neutral-400 uppercase tracking-wider hidden sm:table-cell text-[10px] sm:text-xs"
                            >
                              Data Cadastro
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-200/50">
                          {paginatedPessoas.map((pessoa, index) => (
                            <motion.tr
                              key={pessoa.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 + index * 0.05 }}
                              onClick={() => handleSelectPerson(pessoa.id)}
                              onDoubleClick={() => {
                                setEditingPessoa(pessoa);
                                setShowForm(true);
                                openForm();
                              }}
                              className={`transition-colors duration-200 cursor-pointer ${
                                selectedPersonId === pessoa.id
                                  ? "bg-secondary-200 hover:bg-secondary-200 border-l-4 border-gold-500"
                                  : "hover:bg-neutral-800/25"
                              }`}
                            >
                              <td
                                className="px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 whitespace-nowrap"
                              >
                                <div
                                  className="flex items-center space-x-1.5 sm:space-x-2 max-w-[200px] sm:max-w-[250px] lg:max-w-[300px]"
                                >
                                  <div
                                    aria-hidden="true"
                                    className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7"
                                  >
                                    <span
                                      className="font-bold text-white text-[10px] sm:text-xs"
                                    >
                                      {pessoa.nome.charAt(0)}
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                      <div
                                        className="font-medium text-neutral-50 text-[11px] sm:text-xs lg:text-sm"
                                      >
                                        <Tooltip content={pessoa.nome}>
                                          <span className="cursor-help">
                                            {truncateText(
                                              pessoa.nome,
                                              25
                                            )}
                                          </span>
                                        </Tooltip>
                                      </div>
                                      {isAdvogado(pessoa.emailEmpresarial) && (
                                        <AdvogadoBadge />
                                      )}
                                    </div>

                                    {/* Tags de papéis no sistema */}
                                    {(() => {
                                      const roles = getRoles(pessoa.id);
                                      if (!roles) return null;

                                      return (
                                        <div className="flex flex-wrap gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
                                          {roles.isCliente && (
                                            <RoleBadge role="cliente" />
                                          )}
                                          {roles.isConsultor && (
                                            <RoleBadge role="consultor" />
                                          )}
                                          {roles.isParceiro && (
                                            <RoleBadge role="parceiro" />
                                          )}
                                          {roles.isUsuario && (
                                            <RoleBadge role="usuario" />
                                          )}
                                        </div>
                                      );
                                    })()}

                                    <div
                                      className="text-neutral-400 truncate hidden sm:block text-[10px] sm:text-xs"
                                    >
                                      {pessoa.emailEmpresarial}
                                    </div>
                                  </div>
                                </div>
                                {selectedPersonId === pessoa.id && (
                                  <div className="mt-1.5 sm:mt-2 inline-flex items-center gap-1 sm:gap-2 rounded-lg border border-neutral-700 bg-neutral-800/80 px-1.5 sm:px-2 py-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(pessoa);
                                      }}
                                      className="inline-flex items-center gap-1 rounded-md font-medium transition-colors px-2 py-1 text-[10px] sm:text-xs text-orange-300 hover:bg-orange-500/20"
                                      title="Editar pessoa"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                      <span>Editar</span>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDeleteConfirm(pessoa.id);
                                      }}
                                      className="inline-flex items-center gap-1 rounded-md font-medium transition-colors px-2 py-1 text-[10px] sm:text-xs text-red-300 hover:bg-red-500/20"
                                      title="Excluir pessoa"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Excluir</span>
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td
                                className="px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 whitespace-nowrap text-neutral-300 hidden sm:table-cell text-[10px] sm:text-xs lg:text-sm"
                              >
                                {formatCPFDisplay(pessoa.cpf)}
                              </td>
                              <td
                                className="px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 whitespace-nowrap hidden sm:table-cell"
                              >
                                <div
                                  className="text-neutral-50 text-[10px] sm:text-xs lg:text-sm"
                                >
                                  {pessoa.emailEmpresarial}
                                </div>
                                <div
                                  className="text-neutral-400 text-[10px] sm:text-xs lg:text-sm"
                                >
                                  {pessoa.telefone1}
                                </div>
                              </td>
                              <td
                                className="px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 whitespace-nowrap hidden sm:table-cell"
                              >
                                <StatusBadge
                                  status="ativo"
                                />
                              </td>
                              <td
                                className="px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 whitespace-nowrap text-neutral-300 hidden sm:table-cell text-[10px] sm:text-xs lg:text-sm"
                              >
                                {formatDate(pessoa.dataCadastro)}
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Paginação */}
              {filteredPessoas.length > 0 && (
                <div className="px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 bg-neutral-800/30 border-t border-neutral-700/50">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                    <div className="text-xs sm:text-sm text-neutral-400 text-center sm:text-left">
                      Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{" "}
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredPessoas.length)} de{" "}
                      {filteredPessoas.length} registros
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="btn-mobile px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-neutral-300 bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 hover:border-amber-500/50 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-neutral-800 disabled:hover:border-neutral-700"
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
                              className={`btn-mobile px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200 ${
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
                        className="btn-mobile px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-neutral-300 bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 hover:border-amber-500/50 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-neutral-800 disabled:hover:border-neutral-700"
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
                  <PessoaFisicaForm
                    initialData={editingPessoa}
                    onSubmit={handleCreateOrUpdate}
                    onCancel={handleCloseForm}
                    loading={creating || updating}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modal: Dados já cadastrados (CPF, E-mail, etc.) */}
          <AnimatePresence>
            {error &&
              (error.toLowerCase().includes("já cadastrado") ||
                error.toLowerCase().includes("já existe")) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={() => clearError()}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-neutral-900/95 backdrop-blur-xl rounded-xl sm:rounded-2xl p-6 max-w-md w-full shadow-xl border border-neutral-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-amber-100 rounded-full">
                        <AlertCircle className="w-6 h-6 text-amber-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-neutral-50">
                        {error.toLowerCase().includes("cpf")
                          ? "CPF já cadastrado"
                          : error.toLowerCase().includes("e-mail") ||
                            error.toLowerCase().includes("email")
                          ? "E-mail já cadastrado"
                          : "Dados já cadastrados"}
                      </h3>
                    </div>
                    <p className="text-neutral-200 mb-6">
                      {error.toLowerCase().includes("cpf")
                        ? "Já existe uma pessoa física cadastrada com este CPF. Você pode voltar à página anterior ou corrigir os dados no formulário."
                        : error.toLowerCase().includes("e-mail") ||
                          error.toLowerCase().includes("email")
                        ? "Já existe uma pessoa física cadastrada com este e-mail. Você pode voltar à página anterior ou corrigir os dados no formulário."
                        : "Já existem dados cadastrados com essas informações. Você pode voltar à página anterior ou corrigir os dados no formulário."}
                    </p>
                    <div className="flex justify-end gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          clearError();
                          setShowForm(false);
                          setEditingPessoa(null);
                          // Voltar para a listagem de pessoas físicas
                          router.push("/cadastros/pessoa-fisica");
                        }}
                        className="px-4 py-2 text-neutral-200 bg-secondary-100 hover:bg-secondary-200 rounded-lg font-medium transition-colors duration-200"
                      >
                        Voltar
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => clearError()}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors duration-200"
                      >
                        Corrigir dados
                      </motion.button>
                    </div>
                  </motion.div>
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
                onClick={() => setShowDeleteConfirm(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-neutral-900/95 rounded-xl sm:rounded-2xl p-6 max-w-md w-full shadow-xl"
                  onClick={(e) => e.stopPropagation()}
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
                    Tem certeza que deseja excluir esta pessoa física?
                    <br />
                    <strong className="text-secondary-800">
                      {pessoas.find((p) => p.id === showDeleteConfirm)?.nome}
                    </strong>
                    <br />
                    <span className="text-sm text-red-600 mt-2 block">
                      Esta ação não pode ser desfeita. A pessoa só poderá ser
                      excluída se não estiver vinculada a clientes, consultores,
                      usuários ou como responsável legal.
                    </span>
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
    </PermissionWrapper>
  );
}
