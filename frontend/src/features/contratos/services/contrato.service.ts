import { contratoRepository } from "./contrato.repository";
import {
  CreateContratoSchema,
  UpdateContratoSchema,
  type Contrato,
  type CreateContratoDTO,
  type UpdateContratoDTO,
  type ContratoFilters,
} from "../types/contrato.types";

export class ContratoService {
  async findAll(filters?: ContratoFilters): Promise<Contrato[]> {
    return contratoRepository.findAll(filters);
  }

  async findById(id: number): Promise<Contrato> {
    if (id <= 0) {
      throw new Error("ID inválido");
    }
    return contratoRepository.findById(id);
  }

  async findByCliente(clienteId: number): Promise<Contrato[]> {
    if (clienteId <= 0) {
      throw new Error("ID do cliente inválido");
    }
    return contratoRepository.findByCliente(clienteId);
  }

  async create(data: CreateContratoDTO): Promise<Contrato> {
    const validatedData = CreateContratoSchema.parse(data);

    // Validar datas
    const dataInicio = new Date(validatedData.dataInicio);
    if (validatedData.dataFim) {
      const dataFim = new Date(validatedData.dataFim);
      if (dataFim < dataInicio) {
        throw new Error("Data fim não pode ser anterior à data início");
      }
    }

    return contratoRepository.create(validatedData);
  }

  async update(id: number, data: UpdateContratoDTO): Promise<Contrato> {
    if (id <= 0) {
      throw new Error("ID inválido");
    }

    const validatedData = UpdateContratoSchema.parse(data);

    // Validar datas se ambas fornecidas
    if (validatedData.dataInicio && validatedData.dataFim) {
      const dataInicio = new Date(validatedData.dataInicio);
      const dataFim = new Date(validatedData.dataFim);
      if (dataFim < dataInicio) {
        throw new Error("Data fim não pode ser anterior à data início");
      }
    }

    return contratoRepository.update(id, validatedData);
  }

  async delete(id: number): Promise<void> {
    if (id <= 0) {
      throw new Error("ID inválido");
    }
    await contratoRepository.delete(id);
  }

  async mudarSituacao(id: number, situacao: string): Promise<Contrato> {
    return this.update(id, { situacao });
  }

  async suspender(id: number): Promise<Contrato> {
    return this.mudarSituacao(id, "Suspenso");
  }

  async reativar(id: number): Promise<Contrato> {
    return this.mudarSituacao(id, "Ativo");
  }

  async cancelar(id: number): Promise<Contrato> {
    return this.mudarSituacao(id, "Cancelado");
  }

  async concluir(id: number): Promise<Contrato> {
    return this.mudarSituacao(id, "Concluído");
  }
}

export const contratoService = new ContratoService();
