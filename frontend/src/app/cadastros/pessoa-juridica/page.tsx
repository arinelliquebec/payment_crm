// src/app/cadastros/pessoa-juridica/page.tsx
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Users,
  Building2,
  TrendingUp,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";
import PessoaJuridicaForm from "@/components/forms/PessoaJuridicaForm";
import { Tooltip } from "@/components";
import { usePessoaJuridica } from "@/hooks/usePessoaJuridica";
import { usePessoaFisica } from "@/hooks/usePessoaFisica";
import { PessoaJuridica, ResponsavelTecnicoOption } from "@/types/api";
import { cn, truncateText, formatCNPJDisplay } from "@/lib/utils";
import Link from "next/link";
import { useForm } from "@/contexts/FormContext";
import { TableSizeToggle } from "@/components/TableSizeToggle";
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
          ? "px-1 py-0.5 text-[8px] sm:text-[9px]"
          : "px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-xs",
        status === "ativo"
          ? "bg-green-500/20 text-green-400 border border-green-500/30"
          : "bg-red-500/20 text-red-400 border border-red-500/30"
      )}
    >
      {status === "ativo" ? (
        <CheckCircle
          className={
            isCompact ? "w-2 h-2 mr-0.5" : "w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5"
          }
        />
      ) : (
        <XCircle
          className={
            isCompact ? "w-2 h-2 mr-0.5" : "w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5"
          }
        />
      )}
      {status === "ativo" ? "Ativo" : "Inativo"}
    </span>
  );
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

export default function PessoaJuridicaPage() {
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
  } = usePessoaJuridica();

  const { pessoas: pessoasFisicas } = usePessoaFisica();

  const { openForm, closeForm } = useForm();

  const [showForm, setShowForm] = useState(false);
  const [editingPessoa, setEditingPessoa] = useState<PessoaJuridica | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null
  );
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(
    null
  );
  const [responsaveisTecnicos, setResponsaveisTecnicos] = useState<
    ResponsavelTecnicoOption[]
  >([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterResponsavel, setFilterResponsavel] = useState("");
  const tableRef = useRef<HTMLDivElement>(null);
  const [isTableCompact, setIsTableCompact] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Carregar responsáveis técnicos
  useEffect(() => {
    if (pessoasFisicas && pessoasFisicas.length > 0) {
      // Mapear pessoas físicas para o formato ResponsavelTecnicoOption
      const responsaveis = pessoasFisicas.map((pessoa) => ({
        id: pessoa.id,
        nome: pessoa.nome,
        cpf: pessoa.cpf,
        email: pessoa.emailEmpresarial || pessoa.emailPessoal || "",
        sexo: pessoa.sexo || "",
        dataNascimento: pessoa.dataNascimento || "",
        estadoCivil: pessoa.estadoCivil || "",
        telefone1: pessoa.telefone1 || "",
        telefone2: pessoa.telefone2,
        enderecoId: pessoa.enderecoId || 0,
        endereco: pessoa.endereco || {
          id: 0,
          logradouro: "",
          numero: "",
          complemento: "",
          bairro: "",
          cidade: "",
          estado: "",
          cep: "",
          dataCadastro: new Date().toISOString(),
        },
      }));
      setResponsaveisTecnicos(responsaveis);
    }
  }, [pessoasFisicas]);

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // This useEffect is no longer needed as the three-dot menu state is removed.
      // Keeping it for now in case it's re-introduced or if there's a different
      // logic for closing menus in the future.
      // if (openMenuId !== null) {
      //   setOpenMenuId(null);
      // }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []); // Removed openMenuId from dependency array

  // Limpar seleção e resetar página quando a busca mudar
  useEffect(() => {
    setSelectedCompanyId(null);
    setCurrentPage(1);
  }, [searchTerm]);

  // Normalizar CNPJ removendo formatação para busca
  const normalizeCNPJ = (cnpj: string) => cnpj.replace(/[.\-\/]/g, "");

  // Filtrar pessoas por termo de busca e ordenar alfabeticamente
  const filteredPessoas = pessoas
    .filter((pessoa) => {
      const searchLower = searchTerm.toLowerCase();
      const searchNormalized = normalizeCNPJ(searchTerm);
      const cnpjNormalized = normalizeCNPJ(pessoa.cnpj);

      return (
        pessoa.razaoSocial.toLowerCase().includes(searchLower) ||
        pessoa.cnpj.includes(searchTerm) ||
        cnpjNormalized.includes(searchNormalized) ||
        pessoa.email.toLowerCase().includes(searchLower) ||
        (pessoa.nomeFantasia &&
          pessoa.nomeFantasia.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => a.razaoSocial.localeCompare(b.razaoSocial, "pt-BR"));

  // Paginação
  const totalPages = Math.ceil(filteredPessoas.length / ITEMS_PER_PAGE);
  const paginatedPessoas = filteredPessoas.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleCreateOrUpdate = async (data: any) => {
    if (editingPessoa) {
      return await updatePessoa(editingPessoa.id, data);
    } else {
      return await createPessoa(data);
    }
  };

  const handleEdit = (pessoa: PessoaJuridica) => {
    setEditingPessoa(pessoa);
    setShowForm(true);
    openForm();
  };

  const handleDelete = async (id: number) => {
    const success = await deletePessoa(id);
    if (success) {
      setShowDeleteConfirm(null);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPessoa(null);
    clearError();
    closeForm();
  };

  const handleSelectCompany = (companyId: number) => {
    setSelectedCompanyId(selectedCompanyId === companyId ? null : companyId);
  };

  const handleViewCompany = () => {
    if (selectedCompanyId) {
      const company = pessoas.find((p) => p.id === selectedCompanyId);
      if (company) {
        // Aqui você pode implementar a visualização detalhada
        alert(`Visualizando: ${company.razaoSocial}`);
      }
    }
  };

  const handleEditSelected = () => {
    if (selectedCompanyId) {
      const company = pessoas.find((p) => p.id === selectedCompanyId);
      if (company) {
        handleEdit(company);
      }
    }
  };

  const handleDeleteSelected = () => {
    if (selectedCompanyId) {
      setShowDeleteConfirm(selectedCompanyId);
    }
  };

  const handleOpenForm = () => {
    if (responsaveisTecnicos.length === 0) {
      alert(
        "É necessário cadastrar pelo menos uma pessoa física como responsável técnico antes de criar uma pessoa jurídica."
      );
      return;
    }
    setShowForm(true);
    openForm();
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
      modulo="PessoaJuridica"
      acao="Visualizar"
      fallback={
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-50 mb-2">
                Acesso Negado
              </h3>
              <p className="text-neutral-400">
                Você não tem permissão para acessar pessoas jurídicas.
              </p>
            </div>
          </div>
        </MainLayout>
      }
    >
      <MainLayout>
        <div className="space-y-4 sm:space-y-5 lg:space-y-6 w-full max-w-none -mx-2.5 sm:-mx-2.5 lg:-mx-2.5 px-2.5 sm:px-2.5 lg:px-2.5">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 w-full"
          >
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
              <div className="p-1.5 sm:p-2 lg:p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl text-white">
                <Building2 className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg lg:text-xl font-bold gradient-text">
                  Pessoas Jurídicas
                </h1>
                <p className="text-[10px] sm:text-xs text-neutral-300">
                  Gerenciar cadastros de empresas e organizações
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOpenForm}
              className="btn-mobile flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 lg:py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg sm:rounded-xl font-medium shadow-lg transition-all duration-200 text-[11px] sm:text-xs lg:text-sm"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
              <span>Nova Empresa</span>
            </motion.button>
          </motion.div>

          {/* Aviso se não há responsáveis técnicos */}
          {responsaveisTecnicos.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 border border-amber-200 rounded-xl p-4"
            >
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <p className="text-amber-800">
                  <strong>Atenção:</strong> É necessário ter pelo menos uma
                  pessoa física cadastrada para ser responsável técnico antes de
                  criar pessoas jurídicas.{" "}
                  <Link
                    href="/cadastros/pessoa-fisica"
                    className="underline hover:no-underline font-medium"
                  >
                    Cadastrar pessoa física
                  </Link>
                </p>
              </div>
            </motion.div>
          )}

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
                  placeholder="Buscar por razão social, CNPJ ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-7 sm:pl-8 lg:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 lg:py-3 bg-neutral-800/50 border border-neutral-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-[11px] sm:text-xs lg:text-sm"
                />
                {selectedCompanyId && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <div className="bg-accent-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                      <span className="text-xs font-bold">✓</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleViewCompany}
                  disabled={!selectedCompanyId}
                  className="btn-mobile flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 lg:py-3 bg-secondary-100 hover:bg-secondary-200 disabled:bg-neutral-800/50 disabled:text-amber-500 text-neutral-200 rounded-lg sm:rounded-xl font-medium transition-all duration-200 text-[11px] sm:text-xs lg:text-sm"
                  title="Visualizar empresa selecionada"
                >
                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                  <span>Visualizar</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEditSelected}
                  disabled={!selectedCompanyId}
                  className="btn-mobile flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 lg:py-3 bg-accent-100 hover:bg-accent-200 disabled:bg-neutral-800/50 disabled:text-amber-500 text-accent-700 rounded-lg sm:rounded-xl font-medium transition-all duration-200 text-[11px] sm:text-xs lg:text-sm"
                  title="Editar empresa selecionada"
                >
                  <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                  <span>Editar</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDeleteSelected}
                  disabled={!selectedCompanyId}
                  className="btn-mobile flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 lg:py-3 bg-red-100 hover:bg-red-200 disabled:bg-neutral-800/50 disabled:text-amber-500 text-red-700 rounded-lg sm:rounded-xl font-medium transition-all duration-200 text-[11px] sm:text-xs lg:text-sm"
                  title="Excluir empresa selecionada"
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
                    Total de Empresas
                  </p>
                  <p className="text-base sm:text-lg lg:text-xl font-bold text-neutral-50">
                    {stats.total}
                  </p>
                </div>
                <div className="p-2 sm:p-2.5 lg:p-3 bg-green-100 rounded-lg sm:rounded-xl">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-neutral-900/95 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 shadow-lg border border-neutral-800 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] sm:text-xs lg:text-sm text-neutral-300 font-medium">
                    Empresas Ativas
                  </p>
                  <p className="text-base sm:text-lg lg:text-xl font-bold text-green-600">
                    {stats.ativos}
                  </p>
                </div>
                <div className="p-2 sm:p-2.5 lg:p-3 bg-green-100 rounded-lg sm:rounded-xl">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-neutral-900/95 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 shadow-lg border border-neutral-800 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] sm:text-xs lg:text-sm text-neutral-300 font-medium">
                    Novas este mês
                  </p>
                  <p className="text-base sm:text-lg lg:text-xl font-bold text-accent-600">
                    {stats.novosEstemês}
                  </p>
                </div>
                <div className="p-2 sm:p-2.5 lg:p-3 bg-accent-100 rounded-lg sm:rounded-xl">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-accent-600" />
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
                  Lista de Empresas ({filteredPessoas.length} registros)
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
                  <Building2 className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-neutral-50 mb-2">
                    {searchTerm
                      ? "Nenhum resultado encontrado"
                      : "Nenhuma empresa cadastrada"}
                  </h3>
                  <p className="text-neutral-300">
                    {searchTerm
                      ? "Tente ajustar o termo de busca"
                      : responsaveisTecnicos.length === 0
                      ? "Cadastre primeiro uma pessoa física como responsável técnico"
                      : "Clique em 'Nova Empresa' para começar"}
                  </p>
                </div>
              ) : (
                <div className="w-full">
                  {/* Controles da tabela */}
                  <div className="flex items-center justify-end mb-3">
                    <TableSizeToggle
                      isCompact={isTableCompact}
                      onToggle={() => setIsTableCompact(!isTableCompact)}
                      pageId="pessoa-juridica"
                    />
                  </div>

                  <div className="w-full overflow-auto max-h-[60vh] overflow-y-auto">
                    <div
                      ref={tableRef}
                      className="table-responsive table-container min-w-full relative"
                    >
                      <table
                        className={`w-full min-w-[800px] sm:min-w-[1000px] lg:min-w-[1200px] xl:min-w-[1400px] ${
                          isTableCompact ? "table-compact" : ""
                        }`}
                      >
                        <thead className="bg-neutral-900 sticky top-0 z-[5]">
                          <tr>
                            <th
                              className={`px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 text-left font-medium text-neutral-400 uppercase tracking-wider ${
                                isTableCompact
                                  ? "text-[9px] sm:text-[10px]"
                                  : "text-[10px] sm:text-xs"
                              }`}
                            >
                              Empresa
                            </th>
                            <th
                              className={`px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 text-left font-medium text-neutral-400 uppercase tracking-wider hidden sm:table-cell ${
                                isTableCompact
                                  ? "text-[9px] sm:text-[10px]"
                                  : "text-[10px] sm:text-xs"
                              }`}
                            >
                              CNPJ
                            </th>
                            <th
                              className={`px-1.5 sm:px-2 lg:px-3 pr-0 sm:pr-0 lg:pr-0 py-1.5 sm:py-2 lg:py-2.5 text-left font-medium text-neutral-400 uppercase tracking-wider hidden sm:table-cell ${
                                isTableCompact
                                  ? "text-[9px] sm:text-[10px]"
                                  : "text-[10px] sm:text-xs"
                              }`}
                            >
                              Responsável Técnico
                            </th>
                            <th
                              className={`px-1.5 sm:px-2 lg:px-3 pr-0 sm:pr-0 lg:pr-0 -mr-5 py-1.5 sm:py-2 lg:py-2.5 text-left font-medium text-neutral-400 uppercase tracking-wider hidden sm:table-cell ${
                                isTableCompact
                                  ? "text-[9px] sm:text-[10px]"
                                  : "text-[10px] sm:text-xs"
                              }`}
                            >
                              Contato
                            </th>
                            <th
                              className={`px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 mr-5 -ml-10 text-left font-medium text-neutral-400 uppercase tracking-wider hidden sm:table-cell ${
                                isTableCompact
                                  ? "text-[9px] sm:text-[10px]"
                                  : "text-[10px] sm:text-xs"
                              }`}
                            >
                              Status
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
                              onClick={() => handleSelectCompany(pessoa.id)}
                              onDoubleClick={() => {
                                setEditingPessoa(pessoa);
                                setShowForm(true);
                                openForm();
                              }}
                              className={`transition-colors duration-200 cursor-pointer ${
                                selectedCompanyId === pessoa.id
                                  ? "bg-secondary-200 hover:bg-secondary-200 border-l-4 border-accent-500"
                                  : "hover:bg-neutral-800/25"
                              }`}
                            >
                              <td
                                className={`px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 whitespace-nowrap ${
                                  isTableCompact ? "py-1 sm:py-1.5" : ""
                                }`}
                              >
                                <div
                                  className={`flex items-center space-x-1.5 sm:space-x-2 max-w-[200px] sm:max-w-[250px] lg:max-w-[300px] ${
                                    isTableCompact
                                      ? "max-w-[150px] sm:max-w-[180px] lg:max-w-[200px]"
                                      : ""
                                  }`}
                                >
                                  <div
                                    className={`bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 ${
                                      isTableCompact
                                        ? "w-4 h-4 sm:w-5 sm:h-5"
                                        : "w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7"
                                    }`}
                                  >
                                    <span
                                      className={`font-bold text-white ${
                                        isTableCompact
                                          ? "text-[9px] sm:text-[10px]"
                                          : "text-[10px] sm:text-xs"
                                      }`}
                                    >
                                      {pessoa.razaoSocial.charAt(0)}
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div
                                      className={`font-medium text-neutral-50 ${
                                        isTableCompact
                                          ? "text-[10px] sm:text-[11px]"
                                          : "text-[11px] sm:text-xs lg:text-sm"
                                      }`}
                                    >
                                      <Tooltip content={pessoa.razaoSocial}>
                                        <span className="cursor-help">
                                          {truncateText(
                                            pessoa.razaoSocial,
                                            isTableCompact ? 40 : 25
                                          )}
                                        </span>
                                      </Tooltip>
                                    </div>
                                    {pessoa.nomeFantasia && (
                                      <div
                                        className={`text-neutral-400 truncate hidden sm:block ${
                                          isTableCompact
                                            ? "text-[9px] sm:text-[10px]"
                                            : "text-[10px] sm:text-xs"
                                        }`}
                                        title={pessoa.nomeFantasia}
                                      >
                                        {pessoa.nomeFantasia}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {selectedCompanyId === pessoa.id && (
                                  <div className="mt-1.5 sm:mt-2 inline-flex items-center gap-1 sm:gap-2 rounded-lg border border-neutral-700 bg-neutral-800/80 px-1.5 sm:px-2 py-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(pessoa);
                                      }}
                                      className={cn(
                                        "inline-flex items-center gap-1 rounded-md font-medium transition-colors",
                                        isTableCompact
                                          ? "px-1.5 py-0.5 text-[9px] sm:text-[10px] text-amber-300 hover:bg-amber-500/20"
                                          : "px-2 py-1 text-[10px] sm:text-xs text-amber-300 hover:bg-amber-500/20"
                                      )}
                                      title="Editar empresa"
                                    >
                                      <Edit className={isTableCompact ? "w-2.5 h-2.5" : "w-3.5 h-3.5"} />
                                      <span>Editar</span>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDeleteConfirm(pessoa.id);
                                      }}
                                      className={cn(
                                        "inline-flex items-center gap-1 rounded-md font-medium transition-colors",
                                        isTableCompact
                                          ? "px-1.5 py-0.5 text-[9px] sm:text-[10px] text-red-300 hover:bg-red-500/20"
                                          : "px-2 py-1 text-[10px] sm:text-xs text-red-300 hover:bg-red-500/20"
                                      )}
                                      title="Excluir empresa"
                                    >
                                      <Trash2 className={isTableCompact ? "w-2.5 h-2.5" : "w-3.5 h-3.5"} />
                                      <span>Excluir</span>
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td
                                className={`px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 whitespace-nowrap text-neutral-300 hidden sm:table-cell ${
                                  isTableCompact
                                    ? "text-[9px] sm:text-[10px] py-1 sm:py-1.5"
                                    : "text-[10px] sm:text-xs lg:text-sm"
                                }`}
                              >
                                {formatCNPJDisplay(pessoa.cnpj)}
                              </td>
                              <td
                                className={`px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 whitespace-nowrap hidden sm:table-cell ${
                                  isTableCompact ? "py-1 sm:py-1.5" : ""
                                }`}
                              >
                                <div
                                  className={`text-neutral-50 ${
                                    isTableCompact
                                      ? "text-[9px] sm:text-[10px]"
                                      : "text-[10px] sm:text-xs lg:text-sm"
                                  }`}
                                >
                                  {pessoa.responsavelTecnico?.nome || "N/A"}
                                </div>
                                <div
                                  className={`text-neutral-400 ${
                                    isTableCompact
                                      ? "text-[9px] sm:text-[10px]"
                                      : "text-[10px] sm:text-xs lg:text-sm"
                                  }`}
                                >
                                  {pessoa.responsavelTecnico?.cpf || ""}
                                </div>
                              </td>
                              <td
                                className={`px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 whitespace-nowrap hidden sm:table-cell ${
                                  isTableCompact ? "py-1 sm:py-1.5" : ""
                                }`}
                              >
                                <div
                                  className={`text-neutral-50 ${
                                    isTableCompact
                                      ? "text-[9px] sm:text-[10px]"
                                      : "text-[10px] sm:text-xs lg:text-sm"
                                  }`}
                                >
                                  {pessoa.email}
                                </div>
                                <div
                                  className={`text-neutral-400 ${
                                    isTableCompact
                                      ? "text-[9px] sm:text-[10px]"
                                      : "text-[10px] sm:text-xs lg:text-sm"
                                  }`}
                                >
                                  {pessoa.telefone1}
                                </div>
                              </td>
                              <td
                                className={`px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 mr-5 -ml-10 whitespace-nowrap hidden sm:table-cell ${
                                  isTableCompact ? "py-1 sm:py-1.5" : ""
                                }`}
                              >
                                <StatusBadge
                                  status="ativo"
                                  isCompact={isTableCompact}
                                />
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
                  <PessoaJuridicaForm
                    initialData={editingPessoa}
                    responsaveisTecnicos={responsaveisTecnicos}
                    onSubmit={handleCreateOrUpdate}
                    onCancel={handleCloseForm}
                    loading={creating || updating}
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
                  className="bg-neutral-900/95 rounded-2xl p-6 max-w-md w-full shadow-xl"
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
                    Tem certeza que deseja excluir esta empresa? Esta ação não
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
    </PermissionWrapper>
  );
}
