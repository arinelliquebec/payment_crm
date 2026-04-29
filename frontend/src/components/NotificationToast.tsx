"use client";

import React, { useEffect, useState } from "react";
import {
  Snackbar,
  Alert,
  AlertTitle,
  Box,
  IconButton,
  Slide,
  useTheme,
} from "@mui/material";
import {
  Close,
  AttachMoney,
  Warning,
  Description,
  Person,
  TrendingUp,
} from "@mui/icons-material";
import { Notificacao } from "@/hooks/useNotificacoes";

interface NotificationToastProps {
  notification: Notificacao | null;
  onClose: () => void;
  onView?: (notification: Notificacao) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onView,
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (notification) {
      setOpen(true);

      // Tocar som de notificação (opcional)
      try {
        const audio = new Audio("/notification-sound.mp3");
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Ignorar erro se não conseguir tocar
        });
      } catch {
        // Ignorar erro de áudio
      }
    }
  }, [notification]);

  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
    setTimeout(onClose, 300); // Aguardar animação de saída
  };

  const handleView = () => {
    if (notification && onView) {
      onView(notification);
    }
    handleClose();
  };

  if (!notification) return null;

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case "BoletoPago":
        return <AttachMoney />;
      case "BoletoVencido":
        return <Warning />;
      case "ContratoAssinado":
        return <Description />;
      case "ClienteNovo":
        return <Person />;
      case "MetaAtingida":
        return <TrendingUp />;
      default:
        return null;
    }
  };

  const getSeverity = (
    prioridade: string
  ): "success" | "error" | "warning" | "info" => {
    switch (prioridade) {
      case "Urgente":
        return "error";
      case "Alta":
        return "warning";
      case "Normal":
        return "info";
      case "Baixa":
        return "info";
      default:
        return "info";
    }
  };

  const getColor = (tipo: string) => {
    switch (tipo) {
      case "BoletoPago":
        return "success";
      case "BoletoVencido":
        return "error";
      case "ContratoAssinado":
        return "info";
      case "ClienteNovo":
        return "info";
      case "MetaAtingida":
        return "warning";
      default:
        return "info";
    }
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      TransitionComponent={Slide}
      sx={{
        mt: 8, // Espaço do header
        "& .MuiSnackbar-root": {
          top: "80px !important",
        },
      }}
    >
      <Alert
        severity={getSeverity(notification.prioridade)}
        variant="filled"
        icon={getIcon(notification.tipo)}
        onClose={handleClose}
        sx={{
          width: "100%",
          minWidth: 350,
          maxWidth: 450,
          backgroundColor:
            getColor(notification.tipo) === "success"
              ? "#10b981"
              : getColor(notification.tipo) === "error"
              ? "#ef4444"
              : getColor(notification.tipo) === "warning"
              ? "#f59e0b"
              : "#3b82f6",
          color: "#fff",
          boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          "& .MuiAlert-icon": {
            color: "#fff",
          },
          "& .MuiAlert-message": {
            width: "100%",
          },
        }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
          >
            <Close fontSize="small" />
          </IconButton>
        }
      >
        <AlertTitle sx={{ fontWeight: "bold", fontSize: "0.95rem" }}>
          {notification.titulo}
        </AlertTitle>
        <Box sx={{ fontSize: "0.85rem", mb: 1 }}>{notification.mensagem}</Box>
        {notification.link && (
          <Box
            component="span"
            onClick={handleView}
            sx={{
              fontSize: "0.8rem",
              textDecoration: "underline",
              cursor: "pointer",
              display: "inline-block",
              mt: 0.5,
              "&:hover": {
                opacity: 0.8,
              },
            }}
          >
            Ver detalhes →
          </Box>
        )}
      </Alert>
    </Snackbar>
  );
};
