import { apiClient, API_ENDPOINTS } from "@/core/api";
import type {
  Cliente,
  CreateClienteDTO,
  UpdateClienteDTO,
  ClienteFilters,
} from "../types/cliente.types";

/**
 * Repository para operações de Cliente
 * Responsável apenas pela comunicação com a API
 */
export class ClienteRepository {
  /**
   * Buscar todos os clientes com filtros opcionais
   */
  async findAll(filters?: ClienteFilters): Promise<Cliente[]> {
    const response = await apiClient.get<Cliente[]>(
      API_ENDPOINTS.CLIENTES.BASE
    );

    if (response.error) {
      throw new Error(response.error);
    }

    let clientes = response.data || [];

    // Aplicar filtros client-side se necessário
    if (filters) {
      clientes = this.applyFilters(clientes, filters);
    }

    return clientes;
  }

  /**
   * Buscar cliente por ID
   */
  async findById(id: number): Promise<Cliente> {
    const response = await apiClient.get<Cliente>(
      API_ENDPOINTS.CLIENTES.BY_ID(id)
    );

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data) {
      throw new Error(`Cliente ${id} não encontrado`);
    }

    return response.data;
  }

  /**
   * Criar novo cliente
   */
  async create(data: CreateClienteDTO): Promise<Cliente> {
    const response = await apiClient.post<Cliente>(
      API_ENDPOINTS.CLIENTES.BASE,
      data
    );

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data) {
      throw new Error("Erro ao criar cliente");
    }

    return response.data;
  }

  /**
   * Atualizar cliente existente
   */
  async update(id: number, data: UpdateClienteDTO): Promise<Cliente> {
    const response = await apiClient.put<Cliente>(
      API_ENDPOINTS.CLIENTES.BY_ID(id),
      data
    );

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data) {
      throw new Error("Erro ao atualizar cliente");
    }

    return response.data;
  }

  /**
   * Deletar cliente
   */
  async delete(id: number): Promise<void> {
    const response = await apiClient.delete(API_ENDPOINTS.CLIENTES.BY_ID(id));

    if (response.error) {
      throw new Error(response.error);
    }
  }

  /**
   * Buscar histórico do cliente
   */
  async findHistorico(id: number): Promise<any[]> {
    const response = await apiClient.get<any[]>(
      API_ENDPOINTS.CLIENTES.HISTORICO(id)
    );

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data || [];
  }

  /**
   * Aplicar filtros client-side
   */
  private applyFilters(
    clientes: Cliente[],
    filters: ClienteFilters
  ): Cliente[] {
    return clientes.filter((cliente) => {
      if (filters.tipoPessoa && cliente.tipoPessoa !== filters.tipoPessoa) {
        return false;
      }

      if (filters.situacao && cliente.situacao !== filters.situacao) {
        return false;
      }

      if (filters.consultorId && cliente.consultorId !== filters.consultorId) {
        return false;
      }

      if (filters.filialId && cliente.filialId !== filters.filialId) {
        return false;
      }

      if (filters.ativo !== undefined && cliente.ativo !== filters.ativo) {
        return false;
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const nome =
          cliente.pessoaFisica?.nome ||
          cliente.pessoaJuridica?.razaoSocial ||
          "";
        if (!nome.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }
}

// Singleton instance
export const clienteRepository = new ClienteRepository();
