// src/app/usuarios/page.tsx
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
  User,
  Building2,
  AlertCircle,
  Loader2,
  Calendar,
  CheckCircle,
  XCircle,
  Shield,
  UserCheck,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";
import UsuarioForm from "@/components/forms/UsuarioForm";
import { useUsuario } from "@/hooks/useUsuario";
import { Usuario, PessoaFisicaOption, PessoaJuridicaOption } from "@/types/api";
import { cn } from "@/lib/utils";
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

function TipoPessoaBadge({
  tipo,
  isCompact = false,
}: {
  tipo: string;
  isCompact?: boolean;
}) {
  const getTipoColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case "fisica":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "juridica":
        return "bg-purple-100 text-purple-800 border border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        isCompact
          ? "px-1 py-0.5 text-[8px] sm:text-[9px]"
          : "px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-xs",
        getTipoColor(tipo)
      )}
    >
      <UserCheck
        className={
          isCompact ? "w-2 h-2 mr-0.5" : "w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5"
        }
      />
      {tipo === "fisica" ? "Física" : tipo === "juridica" ? "Jurídica" : tipo}
    </span>
  );
}

function GrupoAcessoBadge({
  grupo,
  isCompact = false,
}: {
  grupo: string;
  isCompact?: boolean;
}) {
  const getGrupoColor = (grupo: string) => {
    switch (grupo.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800 border border-red-200";
      case "gerente":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "usuario":
        return "bg-green-100 text-green-800 border border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        isCompact
          ? "px-1 py-0.5 text-[8px] sm:text-[9px]"
          : "px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-xs",
        getGrupoColor(grupo)
      )}
    >
      <Shield
        className={
          isCompact ? "w-2 h-2 mr-0.5" : "w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5"
        }
      />
      {grupo}
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

export default function UsuariosPage() {
  const {
    usuarios,
    loading,
    error,
    creating,
    updating,
    deleting,
    fetchUsuarios,
    fetchPessoasFisicas,
    fetchPessoasJuridicas,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    clearError,
  } = useUsuario();

  const { openForm, closeForm } = useForm();

  const [showForm, setShowForm] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrupo, setFilterGrupo] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null
  );
  const [pessoasFisicas, setPessoasFisicas] = useState<PessoaFisicaOption[]>(
    []
  );
  const [pessoasJuridicas, setPessoasJuridicas] = useState<
    PessoaJuridicaOption[]
  >([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const [isTableCompact, setIsTableCompact] = useState(false);

  // Carregar dados auxiliares
  useEffect(() => {
    const loadAuxData = async () => {
      const [pf, pj] = await Promise.all([
        fetchPessoasFisicas(),
        fetchPessoasJuridicas(),
      ]);
      setPessoasFisicas(pf);
      setPessoasJuridicas(pj);
    };
    loadAuxData();
  }, [fetchPessoasFisicas, fetchPessoasJuridicas]);

  // Filtrar usuários
  const filteredUsuarios = usuarios.filter((usuario) => {
    const matchesSearch =
      usuario.login.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (usuario.pessoaFisica &&
        usuario.pessoaFisica.nome
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (usuario.pessoaJuridica &&
        usuario.pessoaJuridica.razaoSocial
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    const matchesGrupo = !filterGrupo || usuario.grupoAcesso === filterGrupo;
    const matchesTipo = !filterTipo || usuario.tipoPessoa === filterTipo;
    const matchesStatus =
      !filterStatus ||
      (filterStatus === "ativo" ? usuario.ativo : !usuario.ativo);

    return matchesSearch && matchesGrupo && matchesTipo && matchesStatus;
  });

  const handleCreateOrUpdate = async (data: any) => {
    if (editingUsuario) {
      return await updateUsuario(editingUsuario.id, data);
    } else {
      return await createUsuario(data);
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setShowForm(true);
    openForm();
  };

  const handleDelete = async (id: number) => {
    const success = await deleteUsuario(id);
    if (success) {
      setShowDeleteConfirm(null);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUsuario(null);
    clearError();
    closeForm();
  };

  const handleOpenForm = () => {
    if (pessoasFisicas.length === 0 && pessoasJuridicas.length === 0) {
      alert(
        "É necessário cadastrar pelo menos uma pessoa física ou jurídica antes de criar um usuário."
      );
      return;
    }
    setShowForm(true);
    openForm();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  // Estatísticas calculadas
  const stats = {
    total: usuarios.length,
    ativos: usuarios.filter((u) => u.ativo).length,
    inativos: usuarios.filter((u) => !u.ativo).length,
    administradores: usuarios.filter((u) => u.grupoAcesso === "Administrador")
      .length,
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
  }, [usuarios]);

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
            <div className="p-1.5 sm:p-2 lg:p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl text-white">
              <UserCheck className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg lg:text-xl font-bold gradient-text">
                Usuários
              </h1>
              <p className="text-[10px] sm:text-xs text-secondary-600">
                Gerenciar usuários do sistema
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenForm}
            className="btn-mobile flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 lg:py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg sm:rounded-xl font-medium shadow-lg transition-all duration-200 text-[11px] sm:text-xs lg:text-sm"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
            <span>Novo Usuário</span>
          </motion.button>
        </motion.div>

        {/* Aviso se não há pessoas cadastradas */}
        {pessoasFisicas.length === 0 && pessoasJuridicas.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 rounded-xl p-4"
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800 text-[11px] sm:text-xs">
                <strong>Atenção:</strong> É necessário ter pelo menos uma pessoa
                física ou jurídica cadastrada para criar usuários.
              </p>
            </div>
          </motion.div>
        )}

        {/* Filtros e Busca */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm border border-secondary-200/50 w-full"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 w-full">
            <div className="sm:col-span-2 relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
              <input
                type="text"
                placeholder="Buscar por login, email ou pessoa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 sm:pl-8 lg:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 lg:py-3 bg-secondary-50 border border-secondary-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-[11px] sm:text-xs lg:text-sm"
              />
            </div>

            <select
              value={filterGrupo}
              onChange={(e) => setFilterGrupo(e.target.value)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 lg:py-3 bg-secondary-50 border border-secondary-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-[11px] sm:text-xs lg:text-sm"
            >
              <option value="">Todos os grupos</option>
              <option value="Administrador">Administrador</option>
              <option value="Usuario">Usuário</option>
              <option value="Visualizador">Visualizador</option>
            </select>

            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 lg:py-3 bg-secondary-50 border border-secondary-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-[11px] sm:text-xs lg:text-sm"
            >
              <option value="">Todos os tipos</option>
              <option value="Fisica">Pessoa Física</option>
              <option value="Juridica">Pessoa Jurídica</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 lg:py-3 bg-secondary-50 border border-secondary-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-[11px] sm:text-xs lg:text-sm"
            >
              <option value="">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </motion.div>

        {/* Estatísticas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2.5 sm:p-3 lg:p-4 shadow-sm border border-secondary-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-xs sm:text-sm font-medium">
                  Total de Usuários
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-secondary-900">
                  {stats.total}
                </p>
              </div>
              <div className="p-1.5 sm:p-2 lg:p-3 bg-purple-100 rounded-lg sm:rounded-xl">
                <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2.5 sm:p-3 lg:p-4 shadow-sm border border-secondary-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-xs sm:text-sm font-medium">
                  Usuários Ativos
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                  {stats.ativos}
                </p>
              </div>
              <div className="p-1.5 sm:p-2 lg:p-3 bg-green-100 rounded-lg sm:rounded-xl">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2.5 sm:p-3 lg:p-4 shadow-sm border border-secondary-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-xs sm:text-sm font-medium">
                  Usuários Inativos
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">
                  {stats.inativos}
                </p>
              </div>
              <div className="p-1.5 sm:p-2 lg:p-3 bg-red-100 rounded-lg sm:rounded-xl">
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2.5 sm:p-3 lg:p-4 shadow-sm border border-secondary-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-xs sm:text-sm font-medium">
                  Administradores
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">
                  {stats.administradores}
                </p>
              </div>
              <div className="p-1.5 sm:p-2 lg:p-3 bg-orange-100 rounded-lg sm:rounded-xl">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabela ou Estados de Loading/Error */}
        {error ? (
          <ErrorMessage message={error} onRetry={fetchUsuarios} />
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
                Lista de Usuários ({filteredUsuarios.length} registros)
              </h3>
            </div>

            {filteredUsuarios.length === 0 ? (
              <div className="text-center py-12">
                <UserCheck className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  {searchTerm || filterGrupo || filterTipo || filterStatus
                    ? "Nenhum resultado encontrado"
                    : "Nenhum usuário cadastrado"}
                </h3>
                <p className="text-secondary-600">
                  {searchTerm || filterGrupo || filterTipo || filterStatus
                    ? "Tente ajustar os filtros de busca"
                    : pessoasFisicas.length === 0 &&
                      pessoasJuridicas.length === 0
                    ? "Cadastre primeiro uma pessoa física ou jurídica"
                    : "Clique em 'Novo Usuário' para começar"}
                </p>
              </div>
            ) : (
              <div className="w-full">
                {/* Controles da tabela */}
                <div className="flex items-center justify-end mb-3">
                  <TableSizeToggle
                    isCompact={isTableCompact}
                    onToggle={() => setIsTableCompact(!isTableCompact)}
                    pageId="usuarios"
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
                            Usuário
                          </th>
                          <th
                            className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-left font-medium text-secondary-500 uppercase tracking-wider hidden sm:table-cell ${
                              isTableCompact
                                ? "text-[9px] sm:text-[10px]"
                                : "text-[10px] sm:text-xs"
                            }`}
                          >
                            Pessoa Vinculada
                          </th>
                          <th
                            className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-left font-medium text-secondary-500 uppercase tracking-wider hidden sm:table-cell ${
                              isTableCompact
                                ? "text-[9px] sm:text-[10px]"
                                : "text-[10px] sm:text-xs"
                            }`}
                          >
                            Grupo de Acesso
                          </th>
                          <th
                            className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-left font-medium text-secondary-500 uppercase tracking-wider hidden sm:table-cell ${
                              isTableCompact
                                ? "text-[9px] sm:text-[10px]"
                                : "text-[10px] sm:text-xs"
                            }`}
                          >
                            Tipo
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
                            Último Acesso
                          </th>
                          <th
                            className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-right font-medium text-secondary-500 uppercase tracking-wider ${
                              isTableCompact
                                ? "text-[9px] sm:text-[10px]"
                                : "text-[10px] sm:text-xs"
                            }`}
                          >
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-secondary-200/50">
                        {filteredUsuarios.map((usuario, index) => (
                          <motion.tr
                            key={usuario.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + index * 0.05 }}
                            onDoubleClick={() => {
                              setEditingUsuario(usuario);
                              setShowForm(true);
                              openForm();
                            }}
                            className="hover:bg-secondary-50/50 transition-colors duration-200 cursor-pointer"
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
                                  className={`bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 ${
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
                                    {usuario.login.charAt(0)}
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div
                                    className={`font-medium text-secondary-900 truncate ${
                                      isTableCompact
                                        ? "text-[10px] sm:text-[11px]"
                                        : "text-[11px] sm:text-xs lg:text-sm"
                                    }`}
                                  >
                                    {usuario.login}
                                  </div>
                                  <div
                                    className={`text-secondary-500 truncate hidden sm:block ${
                                      isTableCompact
                                        ? "text-[9px] sm:text-[10px]"
                                        : "text-[10px] sm:text-xs"
                                    }`}
                                  >
                                    {usuario.email}
                                  </div>
                                </div>
                              </div>
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
                                {usuario.pessoaFisica
                                  ? usuario.pessoaFisica.nome
                                  : usuario.pessoaJuridica
                                  ? usuario.pessoaJuridica.razaoSocial
                                  : "N/A"}
                              </div>
                              <div
                                className={`text-secondary-500 ${
                                  isTableCompact
                                    ? "text-[9px] sm:text-[10px]"
                                    : "text-[10px] sm:text-xs lg:text-sm"
                                }`}
                              >
                                {usuario.pessoaFisica
                                  ? usuario.pessoaFisica.cpf
                                  : usuario.pessoaJuridica
                                  ? usuario.pessoaJuridica.cnpj
                                  : "N/A"}
                              </div>
                            </td>
                            <td
                              className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 whitespace-nowrap hidden sm:table-cell ${
                                isTableCompact ? "py-1 sm:py-1.5" : ""
                              }`}
                            >
                              <GrupoAcessoBadge
                                grupo={usuario.grupoAcesso}
                                isCompact={isTableCompact}
                              />
                            </td>
                            <td
                              className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 whitespace-nowrap hidden sm:table-cell ${
                                isTableCompact ? "py-1 sm:py-1.5" : ""
                              }`}
                            >
                              <TipoPessoaBadge
                                tipo={usuario.tipoPessoa}
                                isCompact={isTableCompact}
                              />
                            </td>
                            <td
                              className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 whitespace-nowrap hidden sm:table-cell ${
                                isTableCompact ? "py-1 sm:py-1.5" : ""
                              }`}
                            >
                              <StatusBadge
                                status={usuario.ativo ? "ativo" : "inativo"}
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
                              {usuario.ultimoAcesso
                                ? formatDateTime(usuario.ultimoAcesso)
                                : "Nunca acessou"}
                            </td>
                            <td
                              className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 whitespace-nowrap text-right ${
                                isTableCompact ? "py-1 sm:py-1.5" : ""
                              }`}
                            >
                              <div className="flex items-center justify-end space-x-0.5 sm:space-x-1">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="p-1 sm:p-1.5 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                                  title="Visualizar"
                                >
                                  <Eye
                                    className={
                                      isTableCompact
                                        ? "w-2 h-2 sm:w-2.5 sm:h-2.5"
                                        : "w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5"
                                    }
                                  />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleEdit(usuario)}
                                  className="p-1 sm:p-1.5 text-secondary-400 hover:text-accent-600 transition-colors duration-200"
                                  title="Editar"
                                >
                                  <Edit
                                    className={
                                      isTableCompact
                                        ? "w-2 h-2 sm:w-2.5 sm:h-2.5"
                                        : "w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5"
                                    }
                                  />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() =>
                                    setShowDeleteConfirm(usuario.id)
                                  }
                                  className="p-1 sm:p-1.5 text-secondary-400 hover:text-red-600 transition-colors duration-200"
                                  title="Excluir"
                                >
                                  <Trash2
                                    className={
                                      isTableCompact
                                        ? "w-2 h-2 sm:w-2.5 sm:h-2.5"
                                        : "w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5"
                                    }
                                  />
                                </motion.button>
                              </div>
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
                    pageId="usuarios"
                  />
                </div>
              </div>
            )}

            {/* Paginação */}
            {filteredUsuarios.length > 0 && (
              <div className="px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 bg-secondary-50/30 border-t border-secondary-200/50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                  <div className="text-xs sm:text-sm text-secondary-500 text-center sm:text-left">
                    Mostrando {filteredUsuarios.length} de {usuarios.length}{" "}
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
                <UsuarioForm
                  initialData={editingUsuario}
                  pessoasFisicas={pessoasFisicas}
                  pessoasJuridicas={pessoasJuridicas}
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
                  Tem certeza que deseja excluir este usuário? Esta ação não
                  pode ser desfeita.
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
