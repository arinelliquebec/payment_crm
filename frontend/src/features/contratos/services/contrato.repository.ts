import { apiClient, API_ENDPOINTS } from "@/core/api";
import type {
  Contrato,
  CreateContratoDTO,
  UpdateContratoDTO,
  ContratoFilters,
} from "../types/contrato.types";

export class ContratoRepository {
  async findAll(filters?: ContratoFilters): Promise<Contrato[]> {
    const response = await apiClient.get<Contrato[]>(
      API_ENDPOINTS.CONTRATOS.BASE
    );

    if (response.error) {
      throw new Error(response.error);
    }

    let contratos = response.data || [];

    if (filters) {
      contratos = this.applyFilters(contratos, filters);
    }

    return contratos;
  }

  async findById(id: number): Promise<Contrato> {
    const response = await apiClient.get<Contrato>(
      API_ENDPOINTS.CONTRATOS.BY_ID(id)
    );

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data) {
      throw new Error(`Contrato ${id} não encontrado`);
    }

    return response.data;
  }

  async findByCliente(clienteId: number): Promise<Contrato[]> {
    const response = await apiClient.get<Contrato[]>(
      API_ENDPOINTS.CONTRATOS.BY_CLIENTE(clienteId)
    );

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data || [];
  }

  async create(data: CreateContratoDTO): Promise<Contrato> {
    const response = await apiClient.post<Contrato>(
      API_ENDPOINTS.CONTRATOS.BASE,
      data
    );

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data) {
      throw new Error("Erro ao criar contrato");
    }

    return response.data;
  }

  async update(id: number, data: UpdateContratoDTO): Promise<Contrato> {
    const response = await apiClient.put<Contrato>(
      API_ENDPOINTS.CONTRATOS.BY_ID(id),
      data
    );

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data) {
      throw new Error("Erro ao atualizar contrato");
    }

    return response.data;
  }

  async delete(id: number): Promise<void> {
    const response = await apiClient.delete(API_ENDPOINTS.CONTRATOS.BY_ID(id));

    if (response.error) {
      throw new Error(response.error);
    }
  }

  private applyFilters(
    contratos: Contrato[],
    filters: ContratoFilters
  ): Contrato[] {
    return contratos.filter((contrato) => {
      if (filters.clienteId && contrato.clienteId !== filters.clienteId) {
        return false;
      }

      if (filters.consultorId && contrato.consultorId !== filters.consultorId) {
        return false;
      }

      if (filters.filialId && contrato.filialId !== filters.filialId) {
        return false;
      }

      if (filters.situacao && contrato.situacao !== filters.situacao) {
        return false;
      }

      if (filters.ativo !== undefined && contrato.ativo !== filters.ativo) {
        return false;
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!contrato.numeroContrato.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }
}

export const contratoRepository = new ContratoRepository();
