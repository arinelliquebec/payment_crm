"use client";

import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  useTheme,
  CircularProgress,
  Tooltip,
  IconButton,
  Collapse,
  Avatar,
  LinearProgress,
} from "@mui/material";
import {
  AutoAwesome,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Warning,
  Refresh,
  ExpandMore,
  ExpandLess,
  Psychology,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useAIDashboard } from "@/hooks/useAIForecast";

// Formatador de moeda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatCurrencyShort = (value: number) => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1)}K`;
  }
  return `R$ ${value.toFixed(0)}`;
};

// Componente de tendência
const TrendIndicator = ({ tendencia, variacao }: { tendencia: string; variacao: number }) => {
  const getTrendIcon = () => {
    switch (tendencia) {
      case "subindo":
        return <TrendingUp sx={{ fontSize: 16 }} />;
      case "caindo":
        return <TrendingDown sx={{ fontSize: 16 }} />;
      default:
        return <TrendingFlat sx={{ fontSize: 16 }} />;
    }
  };

  const getTrendColor = () => {
    switch (tendencia) {
      case "subindo":
        return "#10b981";
      case "caindo":
        return "#ef4444";
      default:
        return "#f59e0b";
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        color: getTrendColor(),
      }}
    >
      {getTrendIcon()}
      <Typography variant="caption" fontWeight="bold">
        {variacao > 0 ? "+" : ""}
        {variacao.toFixed(1)}%
      </Typography>
    </Box>
  );
};

// Indicador de nível de risco
const RiskLevelIndicator = ({ nivel, count }: { nivel: string; count: number }) => {
  const getColor = () => {
    switch (nivel) {
      case "critico":
        return "#ef4444";
      case "alto":
        return "#f97316";
      case "medio":
        return "#f59e0b";
      default:
        return "#10b981";
    }
  };

  return (
    <Tooltip title={`${count} clientes com risco ${nivel}`}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: getColor(),
          }}
        />
        <Typography variant="caption" color="text.secondary">
          {count}
        </Typography>
      </Box>
    </Tooltip>
  );
};

export const AIInsightsCard = () => {
  const theme = useTheme();
  const { previsao, tendencia, alertas, resumoRisco, loading, error, aiAvailable, refetch } = useAIDashboard();
  const [expanded, setExpanded] = useState(false);

  // Se o AI Service não está disponível, mostrar card informativo
  if (aiAvailable === false) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          height: "100%",
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(139, 92, 246, 0.05) 100%)`,
          border: "1px solid rgba(139, 92, 246, 0.2)",
          borderRadius: 3,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Psychology sx={{ color: "#8b5cf6", fontSize: 20 }} />
          <Typography variant="subtitle2" color="text.secondary">
            AI Insights
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Serviço de IA não disponível
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 1 }}>
          Configure o AI Service para previsões avançadas
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: "100%",
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(139, 92, 246, 0.08) 100%)`,
        border: "1px solid rgba(139, 92, 246, 0.2)",
        borderRadius: 3,
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 8px 25px rgba(139, 92, 246, 0.15)",
        },
      }}
    >
      {/* Efeito de brilho */}
      <Box
        sx={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
          opacity: 0.1,
          filter: "blur(40px)",
        }}
      />

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <AutoAwesome sx={{ color: "#8b5cf6", fontSize: 20 }} />
          <Typography variant="subtitle2" color="text.secondary">
            AI Insights
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Chip
            icon={<Psychology sx={{ fontSize: 12 }} />}
            label="IA"
            size="small"
            sx={{
              bgcolor: "rgba(139, 92, 246, 0.15)",
              color: "#8b5cf6",
              fontWeight: "bold",
              fontSize: "0.65rem",
              height: 20,
            }}
          />
          <IconButton size="small" onClick={refetch} disabled={loading}>
            <Refresh sx={{ fontSize: 16, color: loading ? "text.disabled" : "#8b5cf6" }} />
          </IconButton>
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" alignItems="center" justifyContent="center" py={4}>
          <CircularProgress size={24} sx={{ color: "#8b5cf6" }} />
        </Box>
      ) : error ? (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      ) : (
        <>
          {/* Previsão Principal */}
          {previsao && (
            <Box mb={2}>
              <Typography variant="caption" color="text.secondary">
                Previsão {previsao.mes}
              </Typography>
              <Box display="flex" alignItems="baseline" gap={1}>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{ color: "#8b5cf6" }}
                >
                  {formatCurrencyShort(previsao.valor_previsto)}
                </Typography>
                {tendencia && (
                  <TrendIndicator 
                    tendencia={tendencia.tendencia} 
                    variacao={tendencia.variacao_percentual} 
                  />
                )}
              </Box>
              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Confiança: {previsao.confianca_percentual}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={previsao.confianca_percentual}
                  sx={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    bgcolor: "rgba(139, 92, 246, 0.1)",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: previsao.confianca_percentual >= 70 ? "#10b981" : 
                               previsao.confianca_percentual >= 50 ? "#f59e0b" : "#ef4444",
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Alertas de Risco */}
          {alertas && alertas.total_alertas > 0 && (
            <Box
              sx={{
                p: 1.5,
                bgcolor: "rgba(239, 68, 68, 0.08)",
                borderRadius: 2,
                border: "1px solid rgba(239, 68, 68, 0.2)",
                mb: 2,
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Warning sx={{ fontSize: 16, color: "#ef4444" }} />
                <Typography variant="caption" fontWeight="bold" color="#ef4444">
                  {alertas.total_alertas} cliente{alertas.total_alertas > 1 ? "s" : ""} em alerta
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Valor em risco: {formatCurrency(alertas.valor_total_em_risco)}
              </Typography>
            </Box>
          )}

          {/* Distribuição de Risco (colapsável) */}
          <Box>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              onClick={() => setExpanded(!expanded)}
              sx={{ cursor: "pointer" }}
            >
              <Typography variant="caption" color="text.secondary">
                Distribuição de risco
              </Typography>
              {expanded ? (
                <ExpandLess sx={{ fontSize: 16, color: "text.secondary" }} />
              ) : (
                <ExpandMore sx={{ fontSize: 16, color: "text.secondary" }} />
              )}
            </Box>

            <Collapse in={expanded}>
              {resumoRisco && (
                <Box sx={{ mt: 1.5 }}>
                  <Box display="flex" gap={2} mb={1}>
                    <RiskLevelIndicator nivel="baixo" count={resumoRisco.distribuicao.baixo} />
                    <RiskLevelIndicator nivel="medio" count={resumoRisco.distribuicao.medio} />
                    <RiskLevelIndicator nivel="alto" count={resumoRisco.distribuicao.alto} />
                    <RiskLevelIndicator nivel="critico" count={resumoRisco.distribuicao.critico} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {resumoRisco.total_clientes_analisados} clientes analisados
                  </Typography>
                </Box>
              )}
            </Collapse>

            {/* Observações da previsão */}
            {!expanded && previsao && previsao.observacoes.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {previsao.observacoes[0]}
                </Typography>
              </Box>
            )}
          </Box>
        </>
      )}
    </Paper>
  );
};

export default AIInsightsCard;
