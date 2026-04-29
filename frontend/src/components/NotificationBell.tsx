"use client";

import React, { useState } from "react";
import { IconButton, Badge, Box, useTheme, Tooltip } from "@mui/material";
import { Notifications } from "@mui/icons-material";
import { useNotificacoes } from "@/hooks/useNotificacoes";
import { NotificationDropdown } from "./NotificationDropdown";

export const NotificationBell = () => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { countNaoLidas } = useNotificacoes();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <Box>
      <Tooltip title="Notificações">
        <IconButton
          onClick={handleClick}
          sx={{
            color: theme.palette.text.primary,
            position: "relative",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.05)",
            },
          }}
        >
          <Badge
            badgeContent={countNaoLidas}
            color="error"
            max={99}
            sx={{
              "& .MuiBadge-badge": {
                backgroundColor: "#ef4444",
                color: "#fff",
                fontWeight: "bold",
                fontSize: "0.7rem",
                minWidth: "18px",
                height: "18px",
                padding: "0 4px",
                animation: countNaoLidas > 0 ? "pulse 2s infinite" : "none",
                "@keyframes pulse": {
                  "0%, 100%": {
                    opacity: 1,
                  },
                  "50%": {
                    opacity: 0.7,
                  },
                },
              },
            }}
          >
            <Notifications
              sx={{
                fontSize: 24,
                color: countNaoLidas > 0 ? "#3b82f6" : "inherit",
                transition: "color 0.3s ease",
              }}
            />
          </Badge>
        </IconButton>
      </Tooltip>

      <NotificationDropdown
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
      />
    </Box>
  );
};
