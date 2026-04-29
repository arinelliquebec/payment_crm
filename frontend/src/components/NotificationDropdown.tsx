"use client";

import React, { useEffect } from "react";
import {
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Button,
  Divider,
  Chip,
  useTheme,
  CircularProgress,
  Avatar,
} from "@mui/material";
import {
  Close,
  CheckCircle,
  AttachMoney,
  Warning,
  Description,
  Person,
  TrendingUp,
  Circle,
} from "@mui/icons-material";
import { useNotificacoes, Notificacao } from "@/hooks/useNotificacoes";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NotificationDropdownProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  open,
  anchorEl,
  onClose,
}) => {
  const theme = useTheme();
  const router = useRouter();
  const {
    notificacoes,
    loading,
    marcarComoLida,
    marcarTodasComoLidas,
    refresh,
  } = useNotificacoes();

  // Refresh quando abrir
  useEffect(() => {
    if (open) {
      refresh();
    }
  }, [open, refresh]);

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case "BoletoPago":
        return <AttachMoney sx={{ color: "#10b981" }} />;
      case "BoletoVencido":
        return <Warning sx={{ color: "#ef4444" }} />;
      case "ContratoAssinado":
        return <Description sx={{ color: "#3b82f6" }} />;
      case "ClienteNovo":
        return <Person sx={{ color: "#8b5cf6" }} />;
      case "MetaAtingida":
        return <TrendingUp sx={{ color: "#f59e0b" }} />;
      default:
        return <Circle sx={{ color: "#6b7280" }} />;
    }
  };

  const getNotificationColor = (prioridade: string) => {
    switch (prioridade) {
      case "Urgente":
        return "#ef4444";
      case "Alta":
        return "#f59e0b";
      case "Normal":
        return "#3b82f6";
      case "Baixa":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  const handleNotificationClick = async (notificacao: Notificacao) => {
    // Marcar como lida
    if (!notificacao.lida) {
      await marcarComoLida(notificacao.id);
    }

    // Redirecionar se tiver link
    if (notificacao.link) {
      router.push(notificacao.link);
    }

    onClose();
  };

  const handleMarcarTodasLidas = async () => {
    await marcarTodasComoLidas();
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
    } catch {
      return "Agora";
    }
  };

  // Garantir que notificacoes é sempre um array (proteção extra)
  const notificacoesArray = Array.isArray(notificacoes) ? notificacoes : [];

  // Mostrar apenas as 5 mais recentes
  const notificacoesRecentes = notificacoesArray.slice(0, 5);
  const temNaoLidas = notificacoesArray.some((n) => !n.lida);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      PaperProps={{
        sx: {
          width: 400,
          maxHeight: 600,
          mt: 1,
          background: theme.palette.background.paper,
          border: "1px solid rgba(255, 255, 255, 0.05)",
          borderRadius: 2,
          boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6" fontWeight="bold">
            Notificações
          </Typography>
          {temNaoLidas && (
            <Chip
              label={notificacoesArray.filter((n) => !n.lida).length}
              size="small"
              sx={{
                bgcolor: "#ef4444",
                color: "#fff",
                fontWeight: "bold",
                fontSize: "0.7rem",
                height: 20,
              }}
            />
          )}
        </Box>
        <Box display="flex" gap={0.5}>
          {temNaoLidas && (
            <IconButton
              size="small"
              onClick={handleMarcarTodasLidas}
              sx={{ color: "#10b981" }}
            >
              <CheckCircle fontSize="small" />
            </IconButton>
          )}
          <IconButton size="small" onClick={onClose}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      <Box
        sx={{
          maxHeight: 400,
          overflowY: "auto",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(255, 255, 255, 0.2)",
            borderRadius: "3px",
          },
        }}
      >
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            py={4}
          >
            <CircularProgress size={30} />
          </Box>
        ) : notificacoesRecentes.length === 0 ? (
          <Box py={4} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Nenhuma notificação
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notificacoesRecentes.map((notificacao, index) => (
              <React.Fragment key={notificacao.id}>
                <ListItem
                  disablePadding
                  sx={{
                    backgroundColor: notificacao.lida
                      ? "transparent"
                      : "rgba(59, 130, 246, 0.05)",
                    borderLeft: notificacao.lida
                      ? "none"
                      : `3px solid ${getNotificationColor(
                          notificacao.prioridade
                        )}`,
                  }}
                >
                  <ListItemButton
                    onClick={() => handleNotificationClick(notificacao)}
                    sx={{
                      py: 2,
                      px: 2,
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: notificacao.lida
                          ? "rgba(255, 255, 255, 0.05)"
                          : `${getNotificationColor(notificacao.prioridade)}20`,
                        width: 40,
                        height: 40,
                        mr: 2,
                      }}
                    >
                      {getNotificationIcon(notificacao.tipo)}
                    </Avatar>
                    <ListItemText
                      primary={
                        <Box
                          component="span"
                          display="flex"
                          justifyContent="space-between"
                          alignItems="flex-start"
                          mb={0.5}
                        >
                          <Typography
                            variant="body2"
                            component="span"
                            fontWeight={notificacao.lida ? "normal" : "bold"}
                            sx={{ flex: 1 }}
                          >
                            {notificacao.titulo}
                          </Typography>
                          {!notificacao.lida && (
                            <Circle
                              sx={{
                                fontSize: 8,
                                color: "#3b82f6",
                                ml: 1,
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box component="span" sx={{ display: "block" }}>
                          <Typography
                            variant="caption"
                            component="span"
                            color="text.secondary"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {notificacao.mensagem}
                          </Typography>
                          <Typography
                            variant="caption"
                            component="span"
                            color="text.secondary"
                            sx={{
                              fontSize: "0.65rem",
                              mt: 0.5,
                              display: "block",
                            }}
                          >
                            {formatTimeAgo(notificacao.dataCriacao)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
                {index < notificacoesRecentes.length - 1 && (
                  <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.05)" }} />
                )}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {/* Footer */}
      {notificacoesRecentes.length > 0 && (
        <Box
          sx={{
            p: 1.5,
            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
            textAlign: "center",
          }}
        >
          <Button
            fullWidth
            size="small"
            onClick={() => {
              router.push("/notificacoes");
              onClose();
            }}
            sx={{
              textTransform: "none",
              color: "#3b82f6",
              "&:hover": {
                backgroundColor: "rgba(59, 130, 246, 0.1)",
              },
            }}
          >
            Ver todas as notificações
          </Button>
        </Box>
      )}
    </Popover>
  );
};
