import { clienteRepository } from "./cliente.repository";
import {
  CreateClienteSchema,
  UpdateClienteSchema,
  type Cliente,
  type CreateClienteDTO,
  type UpdateClienteDTO,
  type ClienteFilters,
} from "../types/cliente.types";

/**
 * Service Layer para Cliente
 * Responsável por validações, transformações e lógica de negócio
 */
export class ClienteService {
  /**
   * Buscar todos os clientes
   */
  async findAll(filters?: ClienteFilters): Promise<Cliente[]> {
    return clienteRepository.findAll(filters);
  }

  /**
   * Buscar cliente por ID
   */
  async findById(id: number): Promise<Cliente> {
    if (id <= 0) {
      throw new Error("ID inválido");
    }

    return clienteRepository.findById(id);
  }

  /**
   * Criar novo cliente
   */
  async create(data: CreateClienteDTO): Promise<Cliente> {
    // Validar dados
    const validatedData = CreateClienteSchema.parse(data);

    // Validar que tem pessoa física OU jurídica
    if (!validatedData.pessoaFisicaId && !validatedData.pessoaJuridicaId) {
      throw new Error(
        "Cliente deve estar vinculado a uma Pessoa Física ou Jurídica"
      );
    }

    // Validar que não tem ambos
    if (validatedData.pessoaFisicaId && validatedData.pessoaJuridicaId) {
      throw new Error(
        "Cliente não pode estar vinculado a Pessoa Física E Jurídica ao mesmo tempo"
      );
    }

    // Validar consistência do tipoPessoa
    if (
      validatedData.tipoPessoa === "Fisica" &&
      !validatedData.pessoaFisicaId
    ) {
      throw new Error("Tipo Pessoa Física requer pessoaFisicaId");
    }

    if (
      validatedData.tipoPessoa === "Juridica" &&
      !validatedData.pessoaJuridicaId
    ) {
      throw new Error("Tipo Pessoa Jurídica requer pessoaJuridicaId");
    }

    // Criar cliente
    const cliente = await clienteRepository.create(validatedData);

    // TODO: Log de atividade
    // await this.logActivity("cliente_criado", cliente.id);

    return cliente;
  }

  /**
   * Atualizar cliente
   */
  async update(id: number, data: UpdateClienteDTO): Promise<Cliente> {
    if (id <= 0) {
      throw new Error("ID inválido");
    }

    // Validar dados
    const validatedData = UpdateClienteSchema.parse(data);

    // Buscar cliente atual para validações
    const clienteAtual = await clienteRepository.findById(id);

    // Se está mudando tipo de pessoa, validar
    if (
      validatedData.tipoPessoa &&
      validatedData.tipoPessoa !== clienteAtual.tipoPessoa
    ) {
      if (
        validatedData.tipoPessoa === "Fisica" &&
        !validatedData.pessoaFisicaId
      ) {
        throw new Error(
          "Ao mudar para Pessoa Física, pessoaFisicaId é obrigatório"
        );
      }
      if (
        validatedData.tipoPessoa === "Juridica" &&
        !validatedData.pessoaJuridicaId
      ) {
        throw new Error(
          "Ao mudar para Pessoa Jurídica, pessoaJuridicaId é obrigatório"
        );
      }
    }

    // Atualizar cliente
    const cliente = await clienteRepository.update(id, validatedData);

    // TODO: Log de atividade
    // await this.logActivity("cliente_atualizado", cliente.id);

    return cliente;
  }

  /**
   * Deletar cliente
   */
  async delete(id: number): Promise<void> {
    if (id <= 0) {
      throw new Error("ID inválido");
    }

    // Verificar se cliente existe
    await clienteRepository.findById(id);

    // TODO: Verificar se tem contratos ativos
    // const contratos = await contratoRepository.findByCliente(id);
    // if (contratos.some(c => c.ativo)) {
    //   throw new Error("Não é possível excluir cliente com contratos ativos");
    // }

    await clienteRepository.delete(id);

    // TODO: Log de atividade
    // await this.logActivity("cliente_excluido", id);
  }

  /**
   * Buscar histórico do cliente
   */
  async findHistorico(id: number): Promise<any[]> {
    if (id <= 0) {
      throw new Error("ID inválido");
    }

    return clienteRepository.findHistorico(id);
  }

  /**
   * Inativar cliente (soft delete)
   */
  async inativar(id: number): Promise<Cliente> {
    return this.update(id, { ativo: false });
  }

  /**
   * Reativar cliente
   */
  async reativar(id: number): Promise<Cliente> {
    return this.update(id, { ativo: true });
  }

  /**
   * Mudar situação do cliente
   */
  async mudarSituacao(id: number, situacao: string): Promise<Cliente> {
    return this.update(id, { situacao });
  }

  /**
   * Atribuir consultor ao cliente
   */
  async atribuirConsultor(id: number, consultorId: number): Promise<Cliente> {
    return this.update(id, { consultorId });
  }

  /**
   * Log de atividade (placeholder)
   */
  private async logActivity(action: string, clienteId: number): Promise<void> {
    // TODO: Implementar log de atividade
    console.log(`[LOG] ${action} - Cliente ${clienteId}`);
  }
}

// Singleton instance
export const clienteService = new ClienteService();
