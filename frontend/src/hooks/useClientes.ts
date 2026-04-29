// src/hooks/useClientes.ts
import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import { retryOperation } from "@/hooks/useRetry";
import { Cliente, CreateClienteDTO, UpdateClienteDTO } from "@/types/api";
import { useAtividadeContext } from "@/contexts/AtividadeContext";
import { useAuth } from "@/contexts/AuthContext";

interface UseClientesState {
  clientes: Cliente[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

/**
 * Converte tipoPessoa da API para `tipo` usado no front.
 * A comparação estrita `=== "Fisica"` falhava com "fisica", enums numéricos serializados, etc.,
 * classificando PF incorretamente como PJ.
 */
function normalizeClienteTipo(cliente: {
  tipoPessoa?: string;
  pessoaFisicaId?: number;
  pessoaJuridicaId?: number;
  pessoaFisica?: { cpf?: string } | null;
  pessoaJuridica?: { cnpj?: string } | null;
}): "fisica" | "juridica" {
  const raw = String(cliente?.tipoPessoa ?? "").trim().toLowerCase();
  if (
    raw === "fisica" ||
    raw === "pf" ||
    raw === "pessoa física" ||
    raw === "pessoa fisica" ||
    raw === "pessoafisica"
  ) {
    return "fisica";
  }
  if (
    raw === "juridica" ||
    raw === "pj" ||
    raw === "pessoa jurídica" ||
    raw === "pessoa juridica" ||
    raw === "pessoajuridica"
  ) {
    return "juridica";
  }
  const cnpj = String(cliente?.pessoaJuridica?.cnpj ?? "").replace(/\D/g, "");
  const cpf = String(cliente?.pessoaFisica?.cpf ?? "").replace(/\D/g, "");
  if (cnpj.length === 14 && cpf.length !== 11) return "juridica";
  if (cpf.length === 11 && cnpj.length !== 14) return "fisica";
  if (cliente?.pessoaFisicaId && !cliente?.pessoaJuridicaId) return "fisica";
  if (cliente?.pessoaJuridicaId && !cliente?.pessoaFisicaId) return "juridica";
  return "juridica";
}

export function useClientes() {
  const [state, setState] = useState<UseClientesState>({
    clientes: [],
    loading: false,
    error: null,
    creating: false,
    updating: false,
    deleting: false,
  });

  const { adicionarAtividade } = useAtividadeContext();
  const { user } = useAuth();

  const fetchClientes = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      // Usar retry para buscar clientes com resiliência
      const response = await retryOperation(() => apiClient.get("/Cliente"), {
        maxAttempts: 3,
        delay: 1000,
        backoff: true,
        onRetry: (attempt, error) => {
          console.warn(
            `Tentativa ${attempt} de buscar clientes falhou:`,
            error
          );
        },
      });

      // Buscar dados das filiais para mapear os nomes
      let filiais: any[] = [];
      try {
        const filiaisResponse = await apiClient.get("/Filial");
        filiais = (filiaisResponse.data as any[]) || [];
      } catch (filiaisError) {
        console.warn("Erro ao buscar filiais:", filiaisError);
      }

      // Transformar os dados para o formato esperado pelo frontend
      // Com proteção contra dados malformados
      const clientesTransformados = (response.data as any[])
        .map((cliente: any) => {
          try {
            return {
              ...cliente,
              tipo: normalizeClienteTipo(cliente),
              nome: cliente.pessoaFisica?.nome || "Nome não informado",
              razaoSocial: cliente.pessoaJuridica?.razaoSocial || "",
              email:
                cliente.pessoaFisica?.emailEmpresarial ||
                cliente.pessoaJuridica?.email ||
                "",
              // EmailPessoal do cliente (sincronizado com PessoaFisica)
              emailPessoal: cliente.emailPessoal || cliente.pessoaFisica?.emailPessoal || "",
              cpf: cliente.pessoaFisica?.cpf || "",
              cnpj: cliente.pessoaJuridica?.cnpj || "",
              telefone1:
                cliente.pessoaFisica?.telefone1 ||
                cliente.pessoaJuridica?.telefone1 ||
                "",
              telefone2:
                cliente.pessoaFisica?.telefone2 ||
                cliente.pessoaJuridica?.telefone2 ||
                "",
              segmento: cliente.status || "N/A",
              status: cliente.status?.toLowerCase() || "ativo",
              valorContrato: cliente.valorContrato || 0,
              filial: (() => {
                if (cliente.filialNavigation?.nome)
                  return cliente.filialNavigation.nome;
                if (cliente.filial) return cliente.filial;
                if (cliente.filialId) {
                  const filial = filiais.find((f) => f.id === cliente.filialId);
                  return filial?.nome || "Não informada";
                }
                return "Não informada";
              })(),
            };
          } catch (error) {
            console.error("Erro ao transformar cliente:", cliente, error);
            return null;
          }
        })
        .filter(
          (cliente): cliente is NonNullable<typeof cliente> => cliente !== null
        );
      setState((prev) => ({
        ...prev,
        clientes: clientesTransformados as Cliente[],
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.response?.data?.message || "Erro ao carregar clientes",
        loading: false,
      }));
    }
  }, []);

  const createCliente = useCallback(
    async (data: CreateClienteDTO) => {
      setState((prev) => ({ ...prev, creating: true, error: null }));
      try {
        const response = await apiClient.post("/Cliente", data);

        // Transformar os dados retornados como em fetchClientes
        const novoCliente = response.data as any;
        const clienteTransformado = {
          ...novoCliente,
          tipo: normalizeClienteTipo(novoCliente),
          nome: novoCliente.pessoaFisica?.nome,
          razaoSocial: novoCliente.pessoaJuridica?.razaoSocial || "",
          email:
            novoCliente.pessoaFisica?.emailEmpresarial ||
            novoCliente.pessoaJuridica?.email,
          emailPessoal: novoCliente.emailPessoal || novoCliente.pessoaFisica?.emailPessoal || "",
          cpf: novoCliente.pessoaFisica?.cpf,
          cnpj: novoCliente.pessoaJuridica?.cnpj,
          telefone1:
            novoCliente.pessoaFisica?.telefone1 ||
            novoCliente.pessoaJuridica?.telefone1,
          telefone2:
            novoCliente.pessoaFisica?.telefone2 ||
            novoCliente.pessoaJuridica?.telefone2,
          segmento: novoCliente.status, // Usando status como segmento temporariamente
          status: novoCliente.status?.toLowerCase() || "ativo", // Converter para minúsculas para o StatusBadge
          valorContrato: novoCliente.valorContrato || 0,
          filial:
            novoCliente.filialNavigation?.nome ||
            novoCliente.filial ||
            "Não informada",
        };

        setState((prev) => ({
          ...prev,
          clientes: [...prev.clientes, clienteTransformado as Cliente],
          creating: false,
        }));

        // Registrar atividade
        const nomeCliente =
          clienteTransformado.nome ||
          clienteTransformado.razaoSocial ||
          "Cliente";
        adicionarAtividade(
          user?.nome || user?.login || "Usuário",
          `Cadastrou novo cliente: ${nomeCliente}`,
          "success",
          `Tipo: ${
            clienteTransformado.tipo === "fisica"
              ? "Pessoa Física"
              : "Pessoa Jurídica"
          }`,
          "Clientes"
        );

        return true;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Erro ao criar cliente";

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          creating: false,
        }));

        // Se for erro de duplicata, lançar exceção para o formulário tratar
        if (
          errorMessage.includes(
            "Já existe um cliente cadastrado para esta pessoa"
          )
        ) {
          throw new Error(errorMessage);
        }

        return false;
      }
    },
    [adicionarAtividade]
  );

  const updateCliente = useCallback(
    async (id: number, data: UpdateClienteDTO) => {
      setState((prev) => ({ ...prev, updating: true, error: null }));
      try {
        // Mapear campos do frontend para o formato do backend
        // Determinar o tipo de pessoa para mapeamento correto
        const tipoPessoa = data.tipoPessoa || (data.tipo === "fisica" ? "Fisica" : "Juridica");
        const isPessoaFisica = tipoPessoa === "Fisica" || data.tipo === "fisica";

        // Capitalizar status (ativo -> Ativo, inativo -> Inativo, etc.)
        const statusCapitalizado = data.status
          ? data.status.charAt(0).toUpperCase() + data.status.slice(1).toLowerCase()
          : "Ativo";

        const backendData = {
          tipoPessoa,
          pessoaId: data.pessoaId,
          filialId: data.filialId || undefined,
          status: statusCapitalizado,
          observacoes: data.observacoes,
          emailPessoal: data.emailPessoal,
          // Campos para Pessoa Física
          nome: isPessoaFisica ? data.nome : undefined,
          emailEmpresarial: isPessoaFisica ? data.email : undefined,
          telefone1: data.telefone1,
          telefone2: data.telefone2,
          // Campos para Pessoa Jurídica
          razaoSocial: !isPessoaFisica ? data.razaoSocial : undefined,
          email: !isPessoaFisica ? data.email : undefined,
          telefone3: data.telefone3,
          telefone4: data.telefone4,
        };

        const response = await apiClient.put(`/Cliente/${id}`, backendData);

        // Transformar os dados retornados como em fetchClientes
        const clienteAtualizado = response.data as any;
        const clienteTransformado = {
          ...clienteAtualizado,
          tipo: normalizeClienteTipo(clienteAtualizado),
          nome: clienteAtualizado.pessoaFisica?.nome,
          razaoSocial: clienteAtualizado.pessoaJuridica?.razaoSocial || "",
          email:
            clienteAtualizado.pessoaFisica?.emailEmpresarial ||
            clienteAtualizado.pessoaJuridica?.email,
          emailPessoal: clienteAtualizado.emailPessoal || clienteAtualizado.pessoaFisica?.emailPessoal || "",
          cpf: clienteAtualizado.pessoaFisica?.cpf,
          cnpj: clienteAtualizado.pessoaJuridica?.cnpj,
          telefone1:
            clienteAtualizado.pessoaFisica?.telefone1 ||
            clienteAtualizado.pessoaJuridica?.telefone1,
          telefone2:
            clienteAtualizado.pessoaFisica?.telefone2 ||
            clienteAtualizado.pessoaJuridica?.telefone2,
          segmento: clienteAtualizado.status, // Usando status como segmento temporariamente
          status: clienteAtualizado.status?.toLowerCase() || "ativo", // Converter para minúsculas para o StatusBadge
          valorContrato: clienteAtualizado.valorContrato || 0,
        };

        setState((prev) => ({
          ...prev,
          clientes: prev.clientes.map((c) =>
            c.id === id ? (clienteTransformado as Cliente) : c
          ),
          updating: false,
        }));

        // Registrar atividade
        const nomeCliente =
          clienteTransformado.nome ||
          clienteTransformado.razaoSocial ||
          "Cliente";
        adicionarAtividade(
          user?.nome || user?.login || "Usuário",
          `Atualizou cliente: ${nomeCliente}`,
          "info",
          `Valor do contrato: R$ ${
            clienteTransformado.valorContrato?.toLocaleString() || "0"
          }`,
          "Clientes"
        );

        return true;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: error.response?.data?.message || "Erro ao atualizar cliente",
          updating: false,
        }));
        return false;
      }
    },
    [adicionarAtividade]
  );

  const deleteCliente = useCallback(
    async (id: number) => {
      setState((prev) => ({ ...prev, deleting: true, error: null }));
      try {
        // Encontrar o cliente antes de deletar para registrar a atividade
        const clienteParaDeletar = state.clientes.find((c) => c.id === id);

        // Fazer a requisição de exclusão com headers para evitar cache
        await apiClient.delete(`/Cliente/${id}`, {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        // Recarregar a lista após deletar para garantir sincronização
        try {
          await fetchClientes();
          console.log(
            "✅ Lista de clientes recarregada com sucesso após exclusão"
          );
        } catch (fetchError) {
          console.error("❌ Erro ao recarregar lista de clientes:", fetchError);
          setState((prev) => ({
            ...prev,
            error: "Cliente excluído, mas erro ao atualizar lista",
            deleting: false,
          }));
          return false;
        }

        // Registrar atividade
        if (clienteParaDeletar) {
          const nomeCliente =
            clienteParaDeletar.nome ||
            clienteParaDeletar.razaoSocial ||
            "Cliente";
          adicionarAtividade(
            user?.nome || user?.login || "Usuário",
            `Excluiu cliente: ${nomeCliente}`,
            "warning",
            `Tipo: ${
              clienteParaDeletar.tipo === "fisica"
                ? "Pessoa Física"
                : "Pessoa Jurídica"
            }`,
            "Clientes"
          );
        }

        return true;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: error.response?.data?.message || "Erro ao excluir cliente",
          deleting: false,
        }));
        return false;
      }
    },
    [state.clientes, adicionarAtividade, fetchClientes]
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  return {
    ...state,
    fetchClientes,
    createCliente,
    updateCliente,
    deleteCliente,
    clearError,
  };
}
