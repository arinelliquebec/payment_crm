import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";

export interface PessoaRoles {
  pessoaFisicaId: number;
  isCliente: boolean;
  isConsultor: boolean;
  isParceiro: boolean;
  isUsuario: boolean;
}

export function usePessoaRoles() {
  const [rolesMap, setRolesMap] = useState<Map<number, PessoaRoles>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllRoles();
  }, []);

  const fetchAllRoles = async () => {
    try {
      setLoading(true);

      // Buscar todas as entidades em paralelo
      const [clientes, consultores, parceiros, usuarios] = await Promise.all([
        apiClient.get("/Cliente").catch(() => ({ data: [] })),
        apiClient.get("/Consultor").catch(() => ({ data: [] })),
        apiClient.get("/Parceiro").catch(() => ({ data: [] })),
        apiClient.get("/Usuario").catch(() => ({ data: [] })),
      ]);

      // Criar mapa de roles
      const map = new Map<number, PessoaRoles>();

      // Processar clientes
      if (clientes.data && Array.isArray(clientes.data)) {
        clientes.data.forEach((cliente: any) => {
          if (cliente.pessoaFisicaId) {
            const existing = map.get(cliente.pessoaFisicaId) || {
              pessoaFisicaId: cliente.pessoaFisicaId,
              isCliente: false,
              isConsultor: false,
              isParceiro: false,
              isUsuario: false,
            };
            existing.isCliente = true;
            map.set(cliente.pessoaFisicaId, existing);
          }
        });
      }

      // Processar consultores
      if (consultores.data && Array.isArray(consultores.data)) {
        consultores.data.forEach((consultor: any) => {
          if (consultor.pessoaFisicaId) {
            const existing = map.get(consultor.pessoaFisicaId) || {
              pessoaFisicaId: consultor.pessoaFisicaId,
              isCliente: false,
              isConsultor: false,
              isParceiro: false,
              isUsuario: false,
            };
            existing.isConsultor = true;
            map.set(consultor.pessoaFisicaId, existing);
          }
        });
      }

      // Processar parceiros
      if (parceiros.data && Array.isArray(parceiros.data)) {
        parceiros.data.forEach((parceiro: any) => {
          if (parceiro.pessoaFisicaId) {
            const existing = map.get(parceiro.pessoaFisicaId) || {
              pessoaFisicaId: parceiro.pessoaFisicaId,
              isCliente: false,
              isConsultor: false,
              isParceiro: false,
              isUsuario: false,
            };
            existing.isParceiro = true;
            map.set(parceiro.pessoaFisicaId, existing);
          }
        });
      }

      // Processar usuários
      if (usuarios.data && Array.isArray(usuarios.data)) {
        usuarios.data.forEach((usuario: any) => {
          if (usuario.pessoaFisicaId) {
            const existing = map.get(usuario.pessoaFisicaId) || {
              pessoaFisicaId: usuario.pessoaFisicaId,
              isCliente: false,
              isConsultor: false,
              isParceiro: false,
              isUsuario: false,
            };
            existing.isUsuario = true;
            map.set(usuario.pessoaFisicaId, existing);
          }
        });
      }

      setRolesMap(map);
    } catch (error) {
      console.error("Erro ao buscar roles:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoles = (pessoaFisicaId: number): PessoaRoles | undefined => {
    return rolesMap.get(pessoaFisicaId);
  };

  const hasAnyRole = (pessoaFisicaId: number): boolean => {
    const roles = rolesMap.get(pessoaFisicaId);
    return roles
      ? roles.isCliente || roles.isConsultor || roles.isParceiro || roles.isUsuario
      : false;
  };

  return {
    rolesMap,
    loading,
    getRoles,
    hasAnyRole,
    refresh: fetchAllRoles,
  };
}

