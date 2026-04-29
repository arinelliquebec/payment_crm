"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNotificacoes, Notificacao } from "@/hooks/useNotificacoes";
import { NotificationToast } from "@/components/NotificationToast";
import { useRouter } from "next/navigation";

interface NotificationContextType {
  showNotification: (notification: Notificacao) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const { notificacoes } = useNotificacoes();
  const [currentNotification, setCurrentNotification] =
    useState<Notificacao | null>(null);
  const [previousNotifications, setPreviousNotifications] = useState<
    Notificacao[]
  >([]);
  const [notificationQueue, setNotificationQueue] = useState<Notificacao[]>([]);

  // Detectar novas notificações
  useEffect(() => {
    if (notificacoes.length === 0) return;

    // Primeira carga - não mostrar toast
    if (previousNotifications.length === 0) {
      setPreviousNotifications(notificacoes);
      return;
    }

    // Verificar se há novas notificações
    const newNotifications = notificacoes.filter(
      (notif) =>
        !previousNotifications.some((prev) => prev.id === notif.id) &&
        !notif.lida // Só mostrar não lidas
    );

    if (newNotifications.length > 0) {
      // Adicionar à fila
      setNotificationQueue((prev) => [...prev, ...newNotifications]);
    }

    setPreviousNotifications(notificacoes);
  }, [notificacoes, previousNotifications]);

  // Processar fila de notificações (uma por vez)
  useEffect(() => {
    if (notificationQueue.length > 0 && !currentNotification) {
      const [next, ...rest] = notificationQueue;
      setCurrentNotification(next);
      setNotificationQueue(rest);
    }
  }, [notificationQueue, currentNotification]);

  const showNotification = useCallback((notification: Notificacao) => {
    setNotificationQueue((prev) => [...prev, notification]);
  }, []);

  const handleCloseToast = () => {
    setCurrentNotification(null);
  };

  const handleViewNotification = (notification: Notificacao) => {
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <NotificationToast
        notification={currentNotification}
        onClose={handleCloseToast}
        onView={handleViewNotification}
      />
    </NotificationContext.Provider>
  );
};
