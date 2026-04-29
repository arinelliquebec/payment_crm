"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { ModuloType, AcaoType } from "@/types/permissions";
import { permissionService } from "@/services/permission.service";
import { PermissionButtonLoading } from "./PermissionLoading";

interface PermissionWrapperProps {
  modulo: ModuloType;
  acao: AcaoType;
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
  requireAll?: boolean; // Se true, requer todas as permissões listadas
  permissions?: Array<{ modulo: ModuloType; acao: AcaoType }>; // Para múltiplas permissões
}

/**
 * Componente wrapper para controle de acesso baseado em permissões
 */
export const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  modulo,
  acao,
  children,
  fallback = null,
  loading = <PermissionButtonLoading />,
  requireAll = false,
  permissions,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        setIsLoading(true);

        if (permissions && permissions.length > 0) {
          // Verificar múltiplas permissões
          const results = await Promise.all(
            permissions.map((p) =>
              permissionService.hasPermission(p.modulo, p.acao)
            )
          );

          if (requireAll) {
            // Requer todas as permissões
            setHasPermission(results.every((result) => result));
          } else {
            // Requer pelo menos uma permissão
            setHasPermission(results.some((result) => result));
          }
        } else {
          // Verificar permissão única
          const result = await permissionService.hasPermission(modulo, acao);
          setHasPermission(result);
        }
      } catch (error) {
        console.error("Erro ao verificar permissões:", error);
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPermissions();
  }, [modulo, acao, permissions, requireAll]);

  if (isLoading) {
    return <>{loading}</>;
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Componente para botões com controle de permissão
 */
interface PermissionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  modulo: ModuloType;
  acao: AcaoType;
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
  disabled?: boolean;
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({
  modulo,
  acao,
  children,
  fallback = null,
  loading,
  disabled = false,
  ...buttonProps
}) => {
  return (
    <PermissionWrapper
      modulo={modulo}
      acao={acao}
      fallback={fallback}
      loading={loading}
    >
      <button
        {...buttonProps}
        disabled={disabled}
        className={`${buttonProps.className || ""} ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {children}
      </button>
    </PermissionWrapper>
  );
};

/**
 * Componente para links com controle de permissão
 */
interface PermissionLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  modulo: ModuloType;
  acao: AcaoType;
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
}

export const PermissionLink: React.FC<PermissionLinkProps> = ({
  modulo,
  acao,
  children,
  fallback = null,
  loading,
  ...linkProps
}) => {
  return (
    <PermissionWrapper
      modulo={modulo}
      acao={acao}
      fallback={fallback}
      loading={loading}
    >
      <a {...linkProps}>{children}</a>
    </PermissionWrapper>
  );
};

/**
 * Componente para seções inteiras com controle de permissão
 */
interface PermissionSectionProps {
  modulo: ModuloType;
  acao: AcaoType;
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
  className?: string;
}

export const PermissionSection: React.FC<PermissionSectionProps> = ({
  modulo,
  acao,
  children,
  fallback = null,
  loading,
  className = "",
}) => {
  return (
    <PermissionWrapper
      modulo={modulo}
      acao={acao}
      fallback={fallback}
      loading={loading}
    >
      <div className={className}>{children}</div>
    </PermissionWrapper>
  );
};

/**
 * Componente para múltiplas permissões (OR logic)
 */
interface MultiplePermissionsWrapperProps {
  permissions: Array<{ modulo: ModuloType; acao: AcaoType }>;
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
  requireAll?: boolean; // Se true, usa AND logic
}

export const MultiplePermissionsWrapper: React.FC<
  MultiplePermissionsWrapperProps
> = ({
  permissions,
  children,
  fallback = null,
  loading,
  requireAll = false,
}) => {
  return (
    <PermissionWrapper
      modulo="Usuario" // Dummy value, não será usado
      acao="Visualizar" // Dummy value, não será usado
      permissions={permissions}
      requireAll={requireAll}
      fallback={fallback}
      loading={loading}
    >
      {children}
    </PermissionWrapper>
  );
};

/**
 * Hook para usar permissões em componentes funcionais
 */
export function usePermissionCheck(modulo: ModuloType, acao: AcaoType) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        setIsLoading(true);
        const result = await permissionService.hasPermission(modulo, acao);
        setHasPermission(result);
      } catch (error) {
        console.error("Erro ao verificar permissão:", error);
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPermission();
  }, [modulo, acao]);

  return { hasPermission, isLoading };
}
