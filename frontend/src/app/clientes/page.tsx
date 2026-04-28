// src/app/clientes/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  Loader2,
  UserPlus,
  TrendingUp,
  Clock,
  DollarSign,
  FileText,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";
import ClienteForm from "@/components/forms/ClienteForm";
import { Tooltip } from "@/components";
import { useClientes } from "@/hooks/useClientes";
import { Cliente, CreateClienteDTO, UpdateClienteDTO } from "@/types/api";
import { cn, truncateText } from "@/lib/utils";
import { useForm } from "@/contexts/FormContext";

function TipoClienteBadge({ tipo }: { tipo: "fisica" | "juridica" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        tipo === "fisica"
          ? "bg-blue-100 text-blue-800"
          : "bg-purple-100 text-purple-800"
      )}
    >
      {tipo === "fisica" ? (
        <>
          <Users className="w-3 h-3 mr-1" />
          Pessoa Física
        </>
      ) : (
        <>
          <Building2 className="w-3 h-3 mr-1" />
          Pessoa Jurídica
        </>
      )}
    </span>
  );
}

function StatusClienteBadge({
  status,
}: {
  status: "ativo" | "inativo" | "prospecto" | "arquivado";
}) {
  const statusConfig = {
    ativo: {
      bg: "bg-green-100",
      text: "text-green-800",
      icon: CheckCircle,
      label: "Ativo",
    },
    inativo: {
      bg: "bg-red-100",
      text: "text-red-800",
      icon: XCircle,
      label: "Inativo",
    },
    prospecto: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      icon: Clock,
      label: "Prospecto",
    },
    arquivado: {
      bg: "bg-gray-100",
      text: "text-gray-800",
      icon: FileText,
      label: "Arquivado",
    },
  };

  const config = statusConfig[status] || statusConfig.inativo; // Fallback para inativo se status for inválido
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.bg,
        config.text
      )}
    >
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </span>
  );
}

function SegmentoBadge({ segmento }: { segmento: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800">
      {segmento}
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

export default function ClientesPage() {
  const {
    clientes,
    loading,
    error,
    creating,
    updating,
    deleting,
    fetchClientes,
    createCliente,
    updateCliente,
    deleteCliente,
    clearError,
  } = useClientes();

  const { openForm, closeForm } = useForm();

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSegmento, setFilterSegmento] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedTab, setSelectedTab] = useState<
    "todos" | "fisica" | "juridica"
  >("todos");
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(
    null
  );

  // Filtrar clientes
  const filteredClientes = clientes.filter((cliente: Cliente) => {
    // Verificar se o cliente existe
    if (!cliente) return false;

    const nome = cliente.nome || "";
    const razaoSocial = cliente.razaoSocial || "";
    const email = cliente.email || "";
    const cpf = cliente.cpf || "";
    const cnpj = cliente.cnpj || "";

    const matchesSearch =
      nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cpf.includes(searchTerm) ||
      cnpj.includes(searchTerm);

    const matchesTipo = !filterTipo || cliente.tipo === filterTipo;
    const matchesStatus = !filterStatus || cliente.status === filterStatus;
    const matchesSegmento =
      !filterSegmento || cliente.segmento === filterSegmento;
    const matchesTab =
      selectedTab === "todos" ||
      (selectedTab === "fisica" && cliente.tipo === "fisica") ||
      (selectedTab === "juridica" && cliente.tipo === "juridica");

    return (
      matchesSearch &&
      matchesTipo &&
      matchesStatus &&
      matchesSegmento &&
      matchesTab
    );
  });

  const handleCreateOrUpdate = async (
    data: CreateClienteDTO | UpdateClienteDTO
  ) => {
    if (editingCliente) {
      return await updateCliente(editingCliente.id, data as UpdateClienteDTO);
    } else {
      return await createCliente(data as CreateClienteDTO);
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setShowForm(true);
    openForm();
  };

  const handleDelete = async (id: number) => {
    const success = await deleteCliente(id);
    if (success) {
      setShowDeleteConfirm(null);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCliente(null);
    clearError();
    closeForm();
  };

  const handleOpenForm = () => {
    setShowForm(true);
    openForm();
  };

  const handleSelectCliente = (clienteId: number) => {
    setSelectedClienteId(selectedClienteId === clienteId ? null : clienteId);
  };

  const handleViewSelected = () => {
    if (selectedClienteId) {
      const cliente = clientes.find((c: Cliente) => c.id === selectedClienteId);
      if (cliente) {
        // Implementar visualização do cliente
        console.log("Visualizar cliente:", cliente);
      }
    }
  };

  const handleEditSelected = () => {
    if (selectedClienteId) {
      const cliente = clientes.find((c: Cliente) => c.id === selectedClienteId);
      if (cliente) {
        handleEdit(cliente);
      }
    }
  };

  const handleDeleteSelected = () => {
    if (selectedClienteId) {
      setShowDeleteConfirm(selectedClienteId);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Estatísticas baseadas nos clientes do banco de dados
  const stats = {
    total: clientes.length,
    ativos: clientes.filter((c: Cliente) => c.status === "ativo").length,
    pessoasFisicas: clientes.filter((c: Cliente) => c.tipo === "fisica").length,
    pessoasJuridicas: clientes.filter((c: Cliente) => c.tipo === "juridica")
      .length,
    novosEsteMes: clientes.filter((c: Cliente) => {
      const cadastro = new Date(c.dataCadastro);
      const hoje = new Date();
      const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      return cadastro >= mesAtual;
    }).length,
    receitaTotal: clientes.reduce(
      (acc: number, c: Cliente) => acc + (c.valorContrato || 0),
      0
    ),
  };

  // Lista de segmentos únicos
  const segmentos = [
    ...new Set(clientes.map((c: Cliente) => c.segmento).filter(Boolean)),
  ];

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
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white">
              <UserPlus className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Clientes</h1>
              <p className="text-sm text-secondary-600">
                Gerenciar clientes pessoas físicas e jurídicas
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenForm}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl font-medium shadow-lg transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Cliente</span>
          </motion.button>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-sm border border-secondary-200/50"
        >
          <div className="flex space-x-1">
            <button
              onClick={() => setSelectedTab("todos")}
              className={cn(
                "flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                selectedTab === "todos"
                  ? "bg-primary-100 text-primary-700"
                  : "text-secondary-600 hover:bg-secondary-50"
              )}
            >
              <Users className="w-5 h-5" />
              <span>Todos ({stats.total})</span>
            </button>
            <button
              onClick={() => setSelectedTab("fisica")}
              className={cn(
                "flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                selectedTab === "fisica"
                  ? "bg-primary-100 text-primary-700"
                  : "text-secondary-600 hover:bg-secondary-50"
              )}
            >
              <Users className="w-5 h-5" />
              <span>Pessoa Física ({stats.pessoasFisicas})</span>
            </button>
            <button
              onClick={() => setSelectedTab("juridica")}
              className={cn(
                "flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                selectedTab === "juridica"
                  ? "bg-primary-100 text-primary-700"
                  : "text-secondary-600 hover:bg-secondary-50"
              )}
            >
              <Building2 className="w-5 h-5" />
              <span>Pessoa Jurídica ({stats.pessoasJuridicas})</span>
            </button>
          </div>
        </motion.div>

        {/* Busca e Ações */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-secondary-200/50"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nome, CPF/CNPJ ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              />
              {selectedClienteId && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="bg-accent-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                </div>
              )}
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="prospecto">Prospecto</option>
              <option value="arquivado">Arquivado</option>
            </select>

            <select
              value={filterSegmento}
              onChange={(e) => setFilterSegmento(e.target.value)}
              className="px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Todos os segmentos</option>
              {segmentos.map((seg: string | undefined) => (
                <option key={seg} value={seg}>
                  {seg}
                </option>
              ))}
            </select>

            <div className="flex space-x-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleViewSelected}
                disabled={!selectedClienteId}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-100 hover:bg-blue-200 disabled:bg-secondary-50 disabled:text-secondary-400 text-blue-700 rounded-xl font-medium transition-all duration-200"
                title="Visualizar cliente selecionado"
              >
                <Eye className="w-4 h-4" />
                <span>Visualizar</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEditSelected}
                disabled={!selectedClienteId}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-100 hover:bg-green-200 disabled:bg-secondary-50 disabled:text-secondary-400 text-green-700 rounded-xl font-medium transition-all duration-200"
                title="Editar cliente selecionado"
              >
                <Edit className="w-4 h-4" />
                <span>Editar</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDeleteSelected}
                disabled={!selectedClienteId}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-100 hover:bg-red-200 disabled:bg-secondary-50 disabled:text-secondary-400 text-red-700 rounded-xl font-medium transition-all duration-200"
                title="Excluir cliente selecionado"
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
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-secondary-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-sm font-medium">
                  Total de Clientes
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.total}
                </p>
                <p className="text-xs text-secondary-500 mt-1">
                  +{stats.novosEsteMes} este mês
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-secondary-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-sm font-medium">
                  Clientes Ativos
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.ativos}
                </p>
                <p className="text-xs text-secondary-500 mt-1">
                  {Math.round((stats.ativos / stats.total) * 100)}% do total
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-secondary-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-sm font-medium">
                  Taxa de Crescimento
                </p>
                <p className="text-2xl font-bold text-purple-600">+12%</p>
                <p className="text-xs text-secondary-500 mt-1">
                  Comparado ao mês anterior
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-secondary-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-sm font-medium">
                  Valor Total Contratos
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(stats.receitaTotal)}
                </p>
                <p className="text-xs text-secondary-500 mt-1">
                  Contratos ativos
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Lista ou Grid de Clientes */}
        {error ? (
          <ErrorMessage message={error} onRetry={fetchClientes} />
        ) : loading ? (
          <LoadingSpinner />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-secondary-200/50 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-secondary-200/50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-secondary-900">
                Lista de Clientes ({filteredClientes.length} registros)
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    viewMode === "list"
                      ? "bg-primary-100 text-primary-600"
                      : "text-secondary-400 hover:text-secondary-600"
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
                      ? "bg-primary-100 text-primary-600"
                      : "text-secondary-400 hover:text-secondary-600"
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

            {filteredClientes.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  {searchTerm || filterStatus || filterSegmento
                    ? "Nenhum resultado encontrado"
                    : "Nenhum cliente cadastrado"}
                </h3>
                <p className="text-secondary-600">
                  {searchTerm || filterStatus || filterSegmento
                    ? "Tente ajustar os filtros de busca"
                    : "Clique em 'Novo Cliente' para começar"}
                </p>
              </div>
            ) : viewMode === "list" ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary-50/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Documento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Contato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Segmento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Filial
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-200/50">
                    {filteredClientes.map((cliente: Cliente, index: number) => (
                      <motion.tr
                        key={cliente.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * index }}
                        onClick={() => handleSelectCliente(cliente.id)}
                        onDoubleClick={() => {
                          setEditingCliente(cliente);
                          setShowForm(true);
                          openForm();
                        }}
                        className={cn(
                          "transition-colors duration-200 cursor-pointer",
                          selectedClienteId === cliente.id
                            ? "bg-secondary-200 hover:bg-secondary-200 border-l-4 border-accent-500"
                            : "hover:bg-secondary-50/50"
                        )}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-white">
                                {(
                                  cliente.nome ||
                                  cliente.razaoSocial ||
                                  ""
                                ).charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-secondary-900">
                                <Tooltip
                                  content={
                                    cliente.nome || cliente.razaoSocial || ""
                                  }
                                >
                                  <span className="cursor-help">
                                    {truncateText(
                                      cliente.nome || cliente.razaoSocial || "",
                                      20
                                    )}
                                  </span>
                                </Tooltip>
                              </div>
                              <div className="text-sm text-secondary-500">
                                {cliente.email || "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <TipoClienteBadge tipo={cliente.tipo || "fisica"} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                          {cliente.cpf || cliente.cnpj}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-secondary-900">
                            {cliente.telefone1 || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {cliente.segmento && (
                            <SegmentoBadge segmento={cliente.segmento} />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusClienteBadge
                            status={
                              (cliente.status as
                                | "ativo"
                                | "inativo"
                                | "prospecto"
                                | "arquivado") || "ativo"
                            }
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                          {cliente.filial?.nome || "Não informada"}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {filteredClientes.map((cliente: Cliente, index: number) => (
                  <motion.div
                    key={cliente.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * index }}
                    onClick={() => handleSelectCliente(cliente.id)}
                    className={cn(
                      "bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 border border-secondary-200/50 cursor-pointer",
                      selectedClienteId === cliente.id
                        ? "border-accent-500 bg-accent-50"
                        : ""
                    )}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold text-white">
                            {(cliente.nome || cliente.razaoSocial || "").charAt(
                              0
                            )}
                          </span>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-lg font-semibold text-secondary-900">
                            <Tooltip
                              content={
                                cliente.nome || cliente.razaoSocial || ""
                              }
                            >
                              <span className="cursor-help">
                                {truncateText(
                                  cliente.nome || cliente.razaoSocial || "",
                                  25
                                )}
                              </span>
                            </Tooltip>
                          </h4>
                          <TipoClienteBadge tipo={cliente.tipo || "fisica"} />
                        </div>
                      </div>
                      <StatusClienteBadge
                        status={
                          (cliente.status as
                            | "ativo"
                            | "inativo"
                            | "prospecto"
                            | "arquivado") || "ativo"
                        }
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-secondary-600">
                        <Mail className="w-4 h-4 mr-2" />
                        {cliente.email || "N/A"}
                      </div>
                      <div className="flex items-center text-sm text-secondary-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {cliente.telefone1 || "N/A"}
                      </div>
                      <div className="flex items-center text-sm text-secondary-600">
                        {cliente.tipo === "fisica" ? (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            CPF: {cliente.cpf}
                          </>
                        ) : (
                          <>
                            <Building2 className="w-4 h-4 mr-2" />
                            CNPJ: {cliente.cnpj}
                          </>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-secondary-600">
                        <Building2 className="w-4 h-4 mr-2" />
                        Filial: {cliente.filial?.nome || "Não informada"}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-secondary-200">
                      {cliente.segmento && (
                        <div className="mb-3">
                          <SegmentoBadge segmento={cliente.segmento} />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
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
                <ClienteForm
                  initialData={editingCliente}
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
                className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
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
                  Tem certeza que deseja excluir este cliente? Esta ação não
                  pode ser desfeita e todos os dados relacionados serão
                  perdidos.
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
