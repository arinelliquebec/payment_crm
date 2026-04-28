// src/app/cadastros/pessoa-fisica/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import MainLayout from "@/components/MainLayout";
import PessoaFisicaForm from "@/components/forms/PessoaFisicaForm";
import { Tooltip } from "@/components";
import { usePessoaFisica } from "@/hooks/usePessoaFisica";
import {
  PessoaFisica,
  CreatePessoaFisicaDTO,
  UpdatePessoaFisicaDTO,
} from "@/types/api";
import { cn, truncateText } from "@/lib/utils";
import { useForm } from "@/contexts/FormContext";
import { TableNavigation } from "@/components/TableNavigation";
import { TableSizeToggle } from "@/components/TableSizeToggle";

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
          ? "bg-green-100 text-green-800 border border-green-200"
          : "bg-red-100 text-red-800 border border-red-200"
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
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
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

  const { openForm, closeForm } = useForm();

  const [showForm, setShowForm] = useState(false);
  const [editingPessoa, setEditingPessoa] = useState<PessoaFisica | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null
  );
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const [isTableCompact, setIsTableCompact] = useState(false);

  // Filtrar pessoas por termo de busca e ordenar alfabeticamente
  const filteredPessoas = pessoas
    .filter(
      (pessoa) =>
        pessoa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pessoa.cpf.includes(searchTerm) ||
        pessoa.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

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

  const handleScrollLeft = () => {
    if (tableRef.current) {
      tableRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (tableRef.current) {
      tableRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const checkScrollPosition = () => {
    if (tableRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tableRef.current;
      const hasHorizontalScroll = scrollWidth > clientWidth;

      setCanScrollLeft(hasHorizontalScroll && scrollLeft > 0);
      setCanScrollRight(
        hasHorizontalScroll && scrollLeft < scrollWidth - clientWidth - 1
      );
    }
  };

  useEffect(() => {
    const tableElement = tableRef.current;
    if (tableElement) {
      tableElement.addEventListener("scroll", checkScrollPosition);
      // Verificar posição inicial
      setTimeout(checkScrollPosition, 100);

      return () => {
        tableElement.removeEventListener("scroll", checkScrollPosition);
      };
    }
  }, [pessoas]);

  return (
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
              <p className="text-[10px] sm:text-xs text-secondary-600">
                Gerenciar cadastros de pessoas físicas
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenForm}
            className="btn-mobile flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 lg:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg sm:rounded-xl font-medium shadow-lg transition-all duration-200 text-[11px] sm:text-xs lg:text-sm"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
            <span>Nova Pessoa</span>
          </motion.button>
        </motion.div>

        {/* Filtros e Busca */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm border border-secondary-200/50 w-full"
        >
          <div className="flex flex-col md:flex-row gap-2 sm:gap-3 lg:gap-4 w-full">
            <div className="flex-1 relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
              <input
                type="text"
                placeholder="Buscar por nome, CPF ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 sm:pl-8 lg:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 lg:py-3 bg-secondary-50 border border-secondary-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-[11px] sm:text-xs lg:text-sm"
              />
              {selectedPersonId && (
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
                onClick={handleViewPerson}
                disabled={!selectedPersonId}
                className="btn-mobile flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 lg:py-3 bg-secondary-100 hover:bg-secondary-200 disabled:bg-secondary-50 disabled:text-secondary-400 text-secondary-700 rounded-lg sm:rounded-xl font-medium transition-all duration-200 text-[11px] sm:text-xs lg:text-sm"
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
                className="btn-mobile flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 lg:py-3 bg-accent-100 hover:bg-accent-200 disabled:bg-secondary-50 disabled:text-secondary-400 text-accent-700 rounded-lg sm:rounded-xl font-medium transition-all duration-200 text-[11px] sm:text-xs lg:text-sm"
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
                className="btn-mobile flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 lg:py-3 bg-red-100 hover:bg-red-200 disabled:bg-secondary-50 disabled:text-secondary-400 text-red-700 rounded-lg sm:rounded-xl font-medium transition-all duration-200 text-[11px] sm:text-xs lg:text-sm"
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
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm border border-secondary-200/50 w-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] sm:text-xs lg:text-sm text-secondary-600 font-medium">
                  Total de Pessoas
                </p>
                <p className="text-base sm:text-lg lg:text-xl font-bold text-secondary-900">
                  {stats.total}
                </p>
              </div>
              <div className="p-2 sm:p-2.5 lg:p-3 bg-blue-100 rounded-lg sm:rounded-xl">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm border border-secondary-200/50 w-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] sm:text-xs lg:text-sm text-secondary-600 font-medium">
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

          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm border border-secondary-200/50 w-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] sm:text-xs lg:text-sm text-secondary-600 font-medium">
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
        {error ? (
          <ErrorMessage message={error} onRetry={fetchPessoas} />
        ) : loading ? (
          <LoadingSpinner />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-sm border border-secondary-200/50 overflow-hidden w-full"
          >
            <div className="px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 border-b border-secondary-200/50">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-secondary-900">
                Lista de Pessoas ({filteredPessoas.length} registros)
              </h3>
            </div>

            {filteredPessoas.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  {searchTerm
                    ? "Nenhum resultado encontrado"
                    : "Nenhuma pessoa cadastrada"}
                </h3>
                <p className="text-secondary-600">
                  {searchTerm
                    ? "Tente ajustar o termo de busca"
                    : "Clique em 'Nova Pessoa' para começar"}
                </p>
              </div>
            ) : (
              <div className="w-full">
                {/* Controles da tabela */}
                <div className="flex items-center justify-end mb-3">
                  <TableSizeToggle
                    isCompact={isTableCompact}
                    onToggle={() => setIsTableCompact(!isTableCompact)}
                    pageId="pessoa-fisica"
                  />
                </div>

                <div className="w-full overflow-x-auto">
                  <div
                    ref={tableRef}
                    className="table-responsive table-container overflow-x-auto min-w-full"
                  >
                    <table
                      className={`w-full min-w-[1200px] sm:min-w-[1300px] lg:min-w-[1400px] xl:min-w-[1500px] ${
                        isTableCompact ? "table-compact" : ""
                      }`}
                    >
                      <thead className="bg-secondary-50/50">
                        <tr>
                          <th
                            className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-left font-medium text-secondary-500 uppercase tracking-wider ${
                              isTableCompact
                                ? "text-[9px] sm:text-[10px]"
                                : "text-[10px] sm:text-xs"
                            }`}
                          >
                            Pessoa
                          </th>
                          <th
                            className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-left font-medium text-secondary-500 uppercase tracking-wider hidden sm:table-cell ${
                              isTableCompact
                                ? "text-[9px] sm:text-[10px]"
                                : "text-[10px] sm:text-xs"
                            }`}
                          >
                            CPF
                          </th>
                          <th
                            className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-left font-medium text-secondary-500 uppercase tracking-wider hidden sm:table-cell ${
                              isTableCompact
                                ? "text-[9px] sm:text-[10px]"
                                : "text-[10px] sm:text-xs"
                            }`}
                          >
                            Contato
                          </th>
                          <th
                            className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-left font-medium text-secondary-500 uppercase tracking-wider hidden sm:table-cell ${
                              isTableCompact
                                ? "text-[9px] sm:text-[10px]"
                                : "text-[10px] sm:text-xs"
                            }`}
                          >
                            Status
                          </th>
                          <th
                            className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-left font-medium text-secondary-500 uppercase tracking-wider hidden sm:table-cell ${
                              isTableCompact
                                ? "text-[9px] sm:text-[10px]"
                                : "text-[10px] sm:text-xs"
                            }`}
                          >
                            Data Cadastro
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-secondary-200/50">
                        {filteredPessoas.map((pessoa, index) => (
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
                                ? "bg-secondary-200 hover:bg-secondary-200 border-l-4 border-accent-500"
                                : "hover:bg-secondary-50/50"
                            }`}
                          >
                            <td
                              className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 whitespace-nowrap ${
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
                                  className={`bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 ${
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
                                    {pessoa.nome.charAt(0)}
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div
                                    className={`font-medium text-secondary-900 ${
                                      isTableCompact
                                        ? "text-[10px] sm:text-[11px]"
                                        : "text-[11px] sm:text-xs lg:text-sm"
                                    }`}
                                  >
                                    <Tooltip content={pessoa.nome}>
                                      <span className="cursor-help">
                                        {truncateText(
                                          pessoa.nome,
                                          isTableCompact ? 40 : 25
                                        )}
                                      </span>
                                    </Tooltip>
                                  </div>
                                  <div
                                    className={`text-secondary-500 truncate hidden sm:block ${
                                      isTableCompact
                                        ? "text-[9px] sm:text-[10px]"
                                        : "text-[10px] sm:text-xs"
                                    }`}
                                  >
                                    {pessoa.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td
                              className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 whitespace-nowrap text-secondary-600 hidden sm:table-cell ${
                                isTableCompact
                                  ? "text-[9px] sm:text-[10px] py-1 sm:py-1.5"
                                  : "text-[10px] sm:text-xs lg:text-sm"
                              }`}
                            >
                              {pessoa.cpf}
                            </td>
                            <td
                              className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 whitespace-nowrap hidden sm:table-cell ${
                                isTableCompact ? "py-1 sm:py-1.5" : ""
                              }`}
                            >
                              <div
                                className={`text-secondary-900 ${
                                  isTableCompact
                                    ? "text-[9px] sm:text-[10px]"
                                    : "text-[10px] sm:text-xs lg:text-sm"
                                }`}
                              >
                                {pessoa.email}
                              </div>
                              <div
                                className={`text-secondary-500 ${
                                  isTableCompact
                                    ? "text-[9px] sm:text-[10px]"
                                    : "text-[10px] sm:text-xs lg:text-sm"
                                }`}
                              >
                                {pessoa.telefone1}
                              </div>
                            </td>
                            <td
                              className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 whitespace-nowrap hidden sm:table-cell ${
                                isTableCompact ? "py-1 sm:py-1.5" : ""
                              }`}
                            >
                              <StatusBadge
                                status="ativo"
                                isCompact={isTableCompact}
                              />
                            </td>
                            <td
                              className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 whitespace-nowrap text-secondary-600 hidden sm:table-cell ${
                                isTableCompact
                                  ? "text-[9px] sm:text-[10px] py-1 sm:py-1.5"
                                  : "text-[10px] sm:text-xs lg:text-sm"
                              }`}
                            >
                              {formatDate(pessoa.dataCadastro)}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <TableNavigation
                    onScrollLeft={handleScrollLeft}
                    onScrollRight={handleScrollRight}
                    canScrollLeft={canScrollLeft}
                    canScrollRight={canScrollRight}
                    pageId="pessoa-fisica"
                  />
                </div>
              </div>
            )}

            {/* Paginação */}
            {filteredPessoas.length > 0 && (
              <div className="px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 bg-secondary-50/30 border-t border-secondary-200/50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                  <div className="text-xs sm:text-sm text-secondary-500 text-center sm:text-left">
                    Mostrando {filteredPessoas.length} de {pessoas.length}{" "}
                    registros
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-mobile px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors duration-200"
                    >
                      Anterior
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-mobile px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 transition-colors duration-200"
                    >
                      Próximo
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
                className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-900">
                    Confirmar Exclusão
                  </h3>
                </div>
                <p className="text-secondary-600 mb-6">
                  Tem certeza que deseja excluir esta pessoa? Esta ação não pode
                  ser desfeita.
                </p>
                <div className="flex justify-end space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 text-secondary-700 bg-secondary-100 hover:bg-secondary-200 rounded-lg font-medium transition-colors duration-200"
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
