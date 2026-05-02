"use client";

import React, { useState, useMemo } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  useTheme,
  Chip,
  Avatar,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbar,
} from "@mui/x-data-grid";
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  People,
  Assignment,
  MoreVert,
  Notifications,
  Search,
  FilterList,
  Circle,
  AccessTime,
  LocationOn,
  Close,
  PersonOutline,
  EmailOutlined,
  CalendarToday,
  MonitorHeart,
  Storage,
  Cloud,
  Payment,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Refresh,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useEstatisticas } from "@/hooks/useEstatisticas";
import { useClientes } from "@/hooks/useClientes";
import { useSessoesAtivas } from "@/hooks/useSessoesAtivas";
import { useRiscoInadimplencia } from "@/hooks/useRiscoInadimplencia";
import { useHealthStatus } from "@/hooks/useHealthStatus";
import { useAuth } from "@/contexts/AuthContext";
import { RiscoInadimplenciaModal } from "./RiscoInadimplenciaModal";
import { AIInsightsCard } from "./AIInsightsCard";

// --- Styled Components (using sx prop for better performance in MUI v5+) ---

const StatCard = ({
  title,
  value,
  trend,
  trendValue,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  trend: "up" | "down" | "neutral";
  trendValue: string;
  icon: React.ReactNode;
  color: string;
}) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: "100%",
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: 3,
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: color,
          opacity: 0.1,
          filter: "blur(30px)",
        }}
      />
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
            {value}
          </Typography>
          <Box display="flex" alignItems="center" gap={0.5}>
            {trend === "up" ? (
              <TrendingUp sx={{ color: "success.main", fontSize: 16 }} />
            ) : trend === "down" ? (
              <TrendingDown sx={{ color: "error.main", fontSize: 16 }} />
            ) : null}
            <Typography
              variant="caption"
              color={
                trend === "up"
                  ? "success.main"
                  : trend === "down"
                  ? "error.main"
                  : "text.secondary"
              }
              fontWeight="bold"
            >
              {trendValue}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              vs. mês anterior
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            background: `rgba(${
              color === "#3b82f6"
                ? "59, 130, 246"
                : color === "#eab308"
                ? "234, 179, 8"
                : "16, 185, 129"
            }, 0.1)`,
            color: color,
            display: "flex",
          }}
        >
          {icon}
        </Box>
      </Box>
    </Paper>
  );
};

const SessoesAtivasModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  // Buscar todos os usuários (online e offline)
  const { sessoes: todasSessoes, loading } = useSessoesAtivas(true);

  // Separar online e offline
  const sessoesOnline = todasSessoes.filter((s) => s.estaOnline);
  const sessoesOffline = todasSessoes.filter((s) => !s.estaOnline);

  // Filtrar baseado na aba selecionada
  const sessoesFiltradas =
    tabValue === 0
      ? todasSessoes
      : tabValue === 1
      ? sessoesOnline
      : sessoesOffline;

  // Função para parsear data do backend (já vem em horário de Brasília)
  const parseBackendDate = (dateString: string | null): Date | null => {
    if (!dateString) return null;
    try {
      // O backend envia datas em horário de Brasília (UTC-3)
      // Se a data não tem timezone info, adicionar o offset de Brasília
      let dateStr = dateString;
      if (!dateStr.includes('Z') && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
        dateStr = dateString + '-03:00';
      }
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    const data = parseBackendDate(dateString);
    if (!data) return "Data inválida";
    
    // Formatar no timezone de Brasília
    return data.toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTempoRelativo = (dateString: string | null) => {
    if (!dateString) return "Nunca";

    const data = parseBackendDate(dateString);
    if (!data) return "Data inválida";
    
    const agora = new Date();
    const diffMs = agora.getTime() - data.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins <= 1) return "Agora";
    if (diffMins < 60) return `${diffMins}m atrás`;

    const diffHoras = Math.floor(diffMins / 60);
    if (diffHoras < 24) return `${diffHoras}h atrás`;

    const diffDias = Math.floor(diffHoras / 24);
    if (diffDias === 1) return "1 dia atrás";
    if (diffDias < 7) return `${diffDias} dias atrás`;
    
    const diffSemanas = Math.floor(diffDias / 7);
    if (diffSemanas < 4) return `${diffSemanas} semana${diffSemanas > 1 ? 's' : ''} atrás`;
    
    const diffMeses = Math.floor(diffDias / 30);
    return `${diffMeses} ${diffMeses > 1 ? 'meses' : 'mês'} atrás`;
  };

  const getPaginaNome = (paginaAtual: string) => {
    if (!paginaAtual) return "Dashboard";

    const paginas: Record<string, string> = {
      "/dashboard": "Dashboard",
      "/clientes": "Clientes",
      "/contratos": "Contratos",
      "/boletos": "Boletos",
      "/usuarios": "Usuários",
      "/cadastros/pessoa-fisica": "Pessoas Físicas",
      "/cadastros/pessoa-juridica": "Pessoas Jurídicas",
      "/consultores": "Consultores",
      "/parceiros": "Parceiros",
      "/gestao/historico-cliente": "Histórico de Clientes",
      "/dashboard/financeiro": "Financeiro",
      "/dashboard/financeiro/mapas-faturamento": "Mapas de Faturamento",
    };

    return paginas[paginaAtual] || paginaAtual.split("/").pop() || "CRM";
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          background: theme.palette.background.paper,
          border: "1px solid rgba(255, 255, 255, 0.05)",
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          pb: 2,
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              background: "rgba(16, 185, 129, 0.1)",
              display: "flex",
            }}
          >
            <People sx={{ color: "#10b981" }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Usuários do Sistema
            </Typography>
            <Box display="flex" gap={2} alignItems="center">
              <Typography variant="caption" color="#10b981" fontWeight="bold">
                {sessoesOnline.length} online
              </Typography>
              <Typography variant="caption" color="text.secondary">
                •
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {sessoesOffline.length} offline
              </Typography>
              <Typography variant="caption" color="text.secondary">
                •
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {todasSessoes.length} total
              </Typography>
            </Box>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      {/* Abas de filtro */}
      <Box
        sx={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          px: 3,
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: "medium",
              minHeight: 48,
            },
          }}
        >
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2">Todos</Typography>
                <Chip
                  label={todasSessoes.length}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.7rem",
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                  }}
                />
              </Box>
            }
          />
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2">Online</Typography>
                <Chip
                  label={sessoesOnline.length}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.7rem",
                    bgcolor: "rgba(16, 185, 129, 0.2)",
                    color: "#10b981",
                  }}
                />
              </Box>
            }
          />
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2">Offline</Typography>
                <Chip
                  label={sessoesOffline.length}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.7rem",
                    bgcolor: "rgba(255, 255, 255, 0.05)",
                    color: "text.secondary",
                  }}
                />
              </Box>
            }
          />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    background: theme.palette.background.paper,
                    fontWeight: "bold",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  Usuário
                </TableCell>
                <TableCell
                  sx={{
                    background: theme.palette.background.paper,
                    fontWeight: "bold",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  Email
                </TableCell>
                <TableCell
                  sx={{
                    background: theme.palette.background.paper,
                    fontWeight: "bold",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  Perfil
                </TableCell>
                <TableCell
                  sx={{
                    background: theme.palette.background.paper,
                    fontWeight: "bold",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  Página Atual
                </TableCell>
                <TableCell
                  sx={{
                    background: theme.palette.background.paper,
                    fontWeight: "bold",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  Último Acesso
                </TableCell>
                <TableCell
                  sx={{
                    background: theme.palette.background.paper,
                    fontWeight: "bold",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  Tempo Online
                </TableCell>
                <TableCell
                  sx={{
                    background: theme.palette.background.paper,
                    fontWeight: "bold",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{ py: 4, color: "text.secondary" }}
                  >
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : sessoesFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{ py: 4, color: "text.secondary" }}
                  >
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                sessoesFiltradas.map((sessao, index) => (
                  <TableRow
                    key={sessao.id || index}
                    sx={{
                      "&:hover": {
                        background: "rgba(255, 255, 255, 0.02)",
                      },
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: "#10b981",
                            fontSize: "0.875rem",
                          }}
                        >
                          {(sessao.nomeUsuario || "U").charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" fontWeight="medium">
                          {sessao.nomeUsuario || "Usuário"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <EmailOutlined
                          sx={{ fontSize: 14, color: "text.secondary" }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {sessao.email || "N/A"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={sessao.perfil || "Usuário"}
                        size="small"
                        sx={{
                          bgcolor: "rgba(59, 130, 246, 0.1)",
                          color: "#3b82f6",
                          fontWeight: "medium",
                          fontSize: "0.75rem",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <LocationOn
                          sx={{ fontSize: 14, color: "text.secondary" }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {getPaginaNome(sessao.paginaAtual || "")}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {formatDateTime(sessao.ultimoAcesso)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          {formatTempoRelativo(sessao.ultimoAcesso)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <AccessTime sx={{ fontSize: 14, color: "#10b981" }} />
                        <Typography
                          variant="body2"
                          color="#10b981"
                          fontWeight="bold"
                        >
                          {sessao.tempoOnline || "Agora"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<Circle sx={{ fontSize: 8 }} />}
                        label={sessao.estaOnline ? "Online" : "Offline"}
                        size="small"
                        sx={{
                          bgcolor: sessao.estaOnline
                            ? "rgba(16, 185, 129, 0.1)"
                            : "rgba(239, 68, 68, 0.1)",
                          color: sessao.estaOnline ? "#10b981" : "#ef4444",
                          fontWeight: "bold",
                          fontSize: "0.7rem",
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
};

const SessoesAtivasCard = () => {
  const theme = useTheme();
  const { sessoes, loading } = useSessoesAtivas(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Nota: O hook useSessoesAtivas já faz auto-refresh a cada 30 segundos internamente

  const formatTempoOnline = (tempoOnline: string) => {
    if (!tempoOnline) return "Agora";

    // Extrair números do formato "Xh Ym" ou "Ym" ou "Xh"
    const horasMatch = tempoOnline.match(/(\d+)h/);
    const minutosMatch = tempoOnline.match(/(\d+)m/);

    const horas = horasMatch ? parseInt(horasMatch[1]) : 0;
    const minutos = minutosMatch ? parseInt(minutosMatch[1]) : 0;

    if (horas > 0) {
      return minutos > 0 ? `${horas}h ${minutos}m` : `${horas}h`;
    }
    return minutos > 0 ? `${minutos}m` : "Agora";
  };

  const formatUltimoAcesso = (dataString: string) => {
    if (!dataString) return "Nunca";

    const data = new Date(dataString);
    const agora = new Date();
    const diffMs = agora.getTime() - data.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins}m atrás`;

    const diffHoras = Math.floor(diffMins / 60);
    if (diffHoras < 24) return `${diffHoras}h atrás`;

    const diffDias = Math.floor(diffHoras / 24);
    return `${diffDias}d atrás`;
  };

  const getPaginaNome = (paginaAtual: string) => {
    if (!paginaAtual) return "Dashboard";

    const paginas: Record<string, string> = {
      "/dashboard": "Dashboard",
      "/clientes": "Clientes",
      "/contratos": "Contratos",
      "/boletos": "Boletos",
      "/usuarios": "Usuários",
      "/cadastros/pessoa-fisica": "Pessoas Físicas",
      "/cadastros/pessoa-juridica": "Pessoas Jurídicas",
      "/consultores": "Consultores",
      "/parceiros": "Parceiros",
      "/gestao/historico-cliente": "Histórico de Clientes",
      "/dashboard/financeiro": "Financeiro",
      "/dashboard/financeiro/mapas-faturamento": "Mapas de Faturamento",
    };

    return paginas[paginaAtual] || paginaAtual.split("/").pop() || "CRM";
  };

  return (
    <>
      <Paper
        elevation={0}
        onClick={() => setModalOpen(true)}
        sx={{
          p: 3,
          height: "100%",
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
          border: "1px solid rgba(255, 255, 255, 0.05)",
          borderRadius: 3,
          position: "relative",
          overflow: "hidden",
          cursor: "pointer",
          transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
          "&:hover": {
            transform: "translateY(-5px)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: "#10b981",
            opacity: 0.1,
            filter: "blur(30px)",
          }}
        />
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box sx={{ width: "100%" }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="subtitle2" color="text.secondary">
                Sessões Ativas
              </Typography>
              <Chip
                icon={<Circle sx={{ fontSize: 8, color: "#10b981" }} />}
                label={loading ? "..." : `${sessoes.length} online`}
                size="small"
                sx={{
                  bgcolor: "rgba(16, 185, 129, 0.1)",
                  color: "#10b981",
                  fontWeight: "bold",
                  fontSize: "0.7rem",
                }}
              />
            </Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>
              {loading ? "..." : sessoes.length}
            </Typography>

            {/* Lista de usuários online */}
            <Box
              sx={{
                maxHeight: 200,
                overflowY: "auto",
                "&::-webkit-scrollbar": {
                  width: "4px",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: "rgba(255, 255, 255, 0.2)",
                  borderRadius: "4px",
                },
              }}
            >
              {sessoes.slice(0, 5).map((sessao, index) => (
                <Tooltip
                  key={sessao.id || index}
                  title={
                    <Box>
                      <Typography variant="caption" display="block">
                        <strong>Email:</strong> {sessao.email || "N/A"}
                      </Typography>
                      <Typography variant="caption" display="block">
                        <strong>IP:</strong> {sessao.enderecoIP || "N/A"}
                      </Typography>
                      <Typography variant="caption" display="block">
                        <strong>Perfil:</strong> {sessao.perfil || "N/A"}
                      </Typography>
                      <Typography variant="caption" display="block">
                        <strong>Último acesso:</strong>{" "}
                        {formatUltimoAcesso(sessao.ultimoAcesso || "")}
                      </Typography>
                    </Box>
                  }
                  arrow
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      py: 1,
                      borderBottom:
                        index < sessoes.slice(0, 5).length - 1
                          ? "1px solid rgba(255, 255, 255, 0.05)"
                          : "none",
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        bgcolor: "#10b981",
                        fontSize: "0.7rem",
                      }}
                    >
                      {(sessao.nomeUsuario || "U").charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="caption"
                        fontWeight="bold"
                        sx={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {sessao.nomeUsuario || "Usuário"}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <LocationOn
                          sx={{ fontSize: 10, color: "text.secondary" }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontSize="0.65rem"
                        >
                          {getPaginaNome(sessao.paginaAtual || "")}
                        </Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <AccessTime sx={{ fontSize: 10, color: "#10b981" }} />
                      <Typography
                        variant="caption"
                        color="#10b981"
                        fontSize="0.65rem"
                        fontWeight="bold"
                      >
                        {formatTempoOnline(sessao.tempoOnline || "")}
                      </Typography>
                    </Box>
                  </Box>
                </Tooltip>
              ))}
              {sessoes.length === 0 && !loading && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", textAlign: "center", py: 2 }}
                >
                  Nenhum usuário online
                </Typography>
              )}
              {sessoes.length > 5 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", textAlign: "center", py: 1 }}
                >
                  +{sessoes.length - 5} usuários online
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      <SessoesAtivasModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};

// Card de Risco de Inadimplência
const RiscoInadimplenciaCard = () => {
  const theme = useTheme();
  const { resumo, loading } = useRiscoInadimplencia();
  const [modalOpen, setModalOpen] = useState(false);

  const getRiskColor = (nivel: string) => {
    switch (nivel) {
      case "Alto":
        return "#ef4444";
      case "Médio":
        return "#f59e0b";
      case "Baixo":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  return (
    <>
      <Paper
        elevation={0}
        onClick={() => setModalOpen(true)}
        sx={{
          p: 3,
          height: "100%",
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
          border: "1px solid rgba(255, 255, 255, 0.05)",
          borderRadius: 3,
          position: "relative",
          overflow: "hidden",
          cursor: "pointer",
          transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
          "&:hover": {
            transform: "translateY(-5px)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: "#ef4444",
            opacity: 0.1,
            filter: "blur(30px)",
          }}
        />
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box sx={{ width: "100%" }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="subtitle2" color="text.secondary">
                Risco Inadimplência
              </Typography>
              <Chip
                label={
                  loading
                    ? "..."
                    : `${resumo?.clientesAltoRisco || 0} alto risco`
                }
                size="small"
                sx={{
                  bgcolor: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  fontWeight: "bold",
                  fontSize: "0.7rem",
                }}
              />
            </Box>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{ mb: 2, color: "#ef4444" }}
            >
              {loading ? "..." : resumo?.clientesAltoRisco || 0}
            </Typography>

            {/* Resumo de risco */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Circle sx={{ fontSize: 8, color: "#ef4444" }} />
                  <Typography variant="caption" color="text.secondary">
                    Alto Risco
                  </Typography>
                </Box>
                <Typography variant="caption" fontWeight="bold" color="#ef4444">
                  {resumo?.clientesAltoRisco || 0}
                </Typography>
              </Box>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Circle sx={{ fontSize: 8, color: "#f59e0b" }} />
                  <Typography variant="caption" color="text.secondary">
                    Médio Risco
                  </Typography>
                </Box>
                <Typography variant="caption" fontWeight="bold" color="#f59e0b">
                  {resumo?.clientesMedioRisco || 0}
                </Typography>
              </Box>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Circle sx={{ fontSize: 8, color: "#10b981" }} />
                  <Typography variant="caption" color="text.secondary">
                    Baixo Risco
                  </Typography>
                </Box>
                <Typography variant="caption" fontWeight="bold" color="#10b981">
                  {resumo?.clientesBaixoRisco || 0}
                </Typography>
              </Box>
              {resumo?.valorTotalEmRisco && resumo.valorTotalEmRisco > 0 && (
                <Box
                  sx={{
                    mt: 1,
                    pt: 1,
                    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Valor em risco:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" color="#ef4444">
                    R${" "}
                    {resumo.valorTotalEmRisco.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      <RiscoInadimplenciaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};

// Card de Health Status (Saúde do Sistema)
const HealthStatusCard = () => {
  const theme = useTheme();
  const { health, loading, refetch } = useHealthStatus(30000);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Healthy":
        return "#10b981";
      case "Degraded":
        return "#f59e0b";
      case "Unhealthy":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Healthy":
        return <CheckCircle sx={{ fontSize: 16, color: "#10b981" }} />;
      case "Degraded":
        return <Warning sx={{ fontSize: 16, color: "#f59e0b" }} />;
      case "Unhealthy":
        return <ErrorIcon sx={{ fontSize: 16, color: "#ef4444" }} />;
      default:
        return <Circle sx={{ fontSize: 16, color: "#6b7280" }} />;
    }
  };

  const getServiceIcon = (name: string) => {
    if (name.includes("sql") || name.includes("database")) {
      return <Storage sx={{ fontSize: 14, color: "text.secondary" }} />;
    }
    if (name.includes("santander") || name.includes("payment")) {
      return <Payment sx={{ fontSize: 14, color: "text.secondary" }} />;
    }
    if (name.includes("azure") || name.includes("storage") || name.includes("cloud")) {
      return <Cloud sx={{ fontSize: 14, color: "text.secondary" }} />;
    }
    return <MonitorHeart sx={{ fontSize: 14, color: "text.secondary" }} />;
  };

  const getServiceName = (name: string) => {
    const names: Record<string, string> = {
      postgresql: "PostgreSQL",
      santander_api: "API Santander",
      azure_storage: "Azure Storage",
      backend: "Backend",
    };
    return names[name] || name;
  };

  const healthyCount = health?.checks?.filter((c) => c.status === "Healthy").length || 0;
  const totalCount = health?.checks?.length || 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: "100%",
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: 3,
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: health?.status ? getStatusColor(health.status) : "#6b7280",
          opacity: 0.1,
          filter: "blur(30px)",
        }}
      />
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Box sx={{ width: "100%" }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="subtitle2" color="text.secondary">
              Saúde do Sistema
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); refetch(); }}
                sx={{
                  p: 0.5,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                <Refresh sx={{ fontSize: 14, color: 'text.secondary' }} />
              </IconButton>
              <Chip
                icon={health?.status ? getStatusIcon(health.status) : undefined}
                label={loading ? "..." : health?.status || "Offline"}
                size="small"
                sx={{
                  bgcolor: `rgba(${
                    health?.status === "Healthy"
                      ? "16, 185, 129"
                      : health?.status === "Degraded"
                      ? "245, 158, 11"
                      : "239, 68, 68"
                  }, 0.1)`,
                  color: health?.status ? getStatusColor(health.status) : "#ef4444",
                  fontWeight: "bold",
                  fontSize: "0.7rem",
                }}
              />
            </Box>
          </Box>

          <Box display="flex" alignItems="baseline" gap={1} mb={2}>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{ color: health?.status ? getStatusColor(health.status) : "#ef4444" }}
            >
              {loading ? "..." : `${healthyCount}/${totalCount}`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              serviços OK
            </Typography>
          </Box>

          {/* Lista de serviços */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {loading ? (
              <Typography variant="caption" color="text.secondary">
                Verificando serviços...
              </Typography>
            ) : health?.checks?.length ? (
              health.checks.map((check, index) => (
                <Tooltip
                  key={check.name}
                  title={
                    <Box>
                      <Typography variant="caption" display="block">
                        <strong>Status:</strong> {check.status}
                      </Typography>
                      <Typography variant="caption" display="block">
                        <strong>Tempo:</strong> {check.duration}
                      </Typography>
                      <Typography variant="caption" display="block">
                        {check.description}
                      </Typography>
                      {check.exception && (
                        <Typography variant="caption" display="block" color="error">
                          <strong>Erro:</strong> {check.exception}
                        </Typography>
                      )}
                    </Box>
                  }
                  arrow
                  placement="left"
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      py: 0.5,
                      borderBottom:
                        index < health.checks.length - 1
                          ? "1px solid rgba(255, 255, 255, 0.05)"
                          : "none",
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      {getServiceIcon(check.name)}
                      <Typography variant="caption" color="text.secondary">
                        {getServiceName(check.name)}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      {getStatusIcon(check.status)}
                      <Typography
                        variant="caption"
                        fontWeight="bold"
                        sx={{ color: getStatusColor(check.status), fontSize: "0.65rem" }}
                      >
                        {check.duration}
                      </Typography>
                    </Box>
                  </Box>
                </Tooltip>
              ))
            ) : (
              <Typography variant="caption" color="error">
                Serviços indisponíveis
              </Typography>
            )}
          </Box>

          {/* Última atualização */}
          {health?.timestamp && (
            <Box
              sx={{
                mt: 1.5,
                pt: 1,
                borderTop: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
                Atualizado: {new Date(health.timestamp).toLocaleTimeString("pt-BR")}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default function DashboardMUI() {
  const theme = useTheme();
  const { receita, loading: statsLoading } = useEstatisticas();
  const { clientes, loading: clientesLoading } = useClientes();
  const { permissoes } = useAuth();
  const crescimentoReceita = receita?.crescimentoMes ?? 0;
  const tendenciaReceita: "up" | "down" | "neutral" =
    crescimentoReceita > 0 ? "up" : crescimentoReceita < 0 ? "down" : "neutral";
  const crescimentoReceitaLabel = `${crescimentoReceita > 0 ? "+" : ""}${crescimentoReceita.toLocaleString(
    "pt-BR",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  )}%`;
  const grupoNormalizado = (permissoes?.grupo || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  const podeVerReceitaMes =
    grupoNormalizado === "administrador" ||
    grupoNormalizado === "gestor de filial" ||
    grupoNormalizado === "financeiro" ||
    grupoNormalizado === "faturamento" ||
    grupoNormalizado === "cobranca e financeiro" ||
    grupoNormalizado === "cobranca/financeiro";

  // Verificar se o usuário é administrador
  const isAdmin = useMemo(() => {
    return permissoes?.grupo?.toLowerCase() === "administrador";
  }, [permissoes]);

  // Mock Data for DataGrid
  const rows = useMemo(() => {
    return clientes.slice(0, 10).map((cliente) => ({
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email,
      status: cliente.status || "Ativo",
      valor: `R$ ${(Math.random() * 5000 + 1000).toFixed(2)}`,
      progresso: Math.floor(Math.random() * 100),
    }));
  }, [clientes]);

  const columns: GridColDef[] = [
    { field: "nome", headerName: "Cliente", width: 200 },
    { field: "email", headerName: "Email", width: 250 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === "Ativo" ? "success" : "default"}
          variant="outlined"
          sx={{ borderRadius: 1 }}
        />
      ),
    },
    {
      field: "valor",
      headerName: "Valor Contrato",
      width: 150,
    },
    {
      field: "progresso",
      headerName: "Progresso",
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ width: "100%", display: "flex", alignItems: "center" }}>
          <Box sx={{ width: "100%", mr: 1 }}>
            <LinearProgress
              variant="determinate"
              value={params.value as number}
              sx={{
                height: 6,
                borderRadius: 5,
                backgroundColor: theme.palette.action.hover,
                "& .MuiLinearProgress-bar": {
                  borderRadius: 5,
                  backgroundImage:
                    "linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)",
                },
              }}
            />
          </Box>
          <Box sx={{ minWidth: 35 }}>
            <Typography variant="body2" color="text.secondary">{`${Math.round(
              params.value as number
            )}%`}</Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "",
      width: 50,
      renderCell: () => (
        <IconButton size="small">
          <MoreVert />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ flexGrow: 1, p: 0 }}>
      {/* Header Section */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
        component={motion.div}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box>
          <Typography variant="h4" fontWeight="800" gutterBottom>
            Dashboard
            <Box component="span" sx={{ color: "primary.main" }}>
              .
            </Box>
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Visão geral do desempenho do seu escritório.
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            sx={{ borderColor: "rgba(255,255,255,0.1)" }}
          >
            Filtros
          </Button>
          <Button
            variant="contained"
            startIcon={<Assignment />}
            sx={{
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              boxShadow: "0 4px 14px 0 rgba(59, 130, 246, 0.4)",
            }}
          >
            Novo Relatório
          </Button>
        </Box>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ height: "100%" }}
          >
            {podeVerReceitaMes ? (
              <StatCard
                title="Receita Total do Mês"
                value={`R$ ${receita?.receitaMesAtual?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "0"}`}
                trend={tendenciaReceita}
                trendValue={crescimentoReceitaLabel}
                icon={<AttachMoney />}
                color="#10b981"
              />
            ) : (
              <StatCard
                title="Receita Total do Mês"
                value="Restrito"
                trend="neutral"
                trendValue="Sem permissão"
                icon={<AttachMoney />}
                color="#10b981"
              />
            )}
          </motion.div>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ height: "100%" }}
          >
            <StatCard
              title="Clientes Ativos"
              value={clientes.length}
              trend="up"
              trendValue="+5.2%"
              icon={<People />}
              color="#3b82f6"
            />
          </motion.div>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ height: "100%" }}
          >
            <StatCard
              title="Novos Contratos"
              value="24"
              trend="down"
              trendValue="-2.4%"
              icon={<Assignment />}
              color="#eab308"
            />
          </motion.div>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ height: "100%" }}
          >
            {isAdmin ? (
              <SessoesAtivasCard />
            ) : (
              <StatCard
                title="Taxa de Conversão"
                value="3.2%"
                trend="up"
                trendValue="+0.8%"
                icon={<TrendingUp />}
                color="#8b5cf6"
              />
            )}
          </motion.div>
        </Grid>
        {/* Card de Risco de Inadimplência */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ height: "100%" }}
          >
            <RiscoInadimplenciaCard />
          </motion.div>
        </Grid>
        {/* Card de AI Insights */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            style={{ height: "100%" }}
          >
            <AIInsightsCard />
          </motion.div>
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Data Grid Section */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper
            elevation={0}
            sx={{
              p: 0,
              height: 500,
              background: theme.palette.background.paper,
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <Box p={3} borderBottom="1px solid rgba(255, 255, 255, 0.05)">
              <Typography variant="h6" fontWeight="bold">
                Clientes Recentes
              </Typography>
            </Box>
            <DataGrid
              rows={rows}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 5 },
                },
              }}
              pageSizeOptions={[5, 10]}
              checkboxSelection
              disableRowSelectionOnClick
              sx={{
                border: "none",
                "& .MuiDataGrid-cell:focus": {
                  outline: "none",
                },
              }}
            />
          </Paper>
        </Grid>

        {/* Side Panel / Activity Feed */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: 500,
              background: theme.palette.background.paper,
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: 3,
            }}
          >
            <Typography variant="h6" fontWeight="bold" mb={3}>
              Atividades Recentes
            </Typography>
            <Box display="flex" flexDirection="column" gap={3}>
              {[1, 2, 3, 4].map((item) => (
                <Box key={item} display="flex" gap={2}>
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      width: 40,
                      height: 40,
                    }}
                  >
                    A
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Novo contrato assinado
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cliente Arrighi Advogados assinou o contrato de
                      prestação...
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      mt={0.5}
                      display="block"
                    >
                      Há 2 horas
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
