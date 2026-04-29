/**
 * ClienteForm Component
 * Formulário de criação/edição de cliente
 */

"use client";

import { useState } from "react";
import { Input, Select, Button } from "@/shared";
import type { CreateClienteDTO } from "../types/cliente.types";

// Tipo estendido para o formulário incluir dados de PF/PJ
interface ClienteFormData extends Partial<CreateClienteDTO> {
  // Pessoa Física
  nome?: string;
  cpf?: string;
  rg?: string;
  // Pessoa Jurídica
  razaoSocial?: string;
  nomeFantasia?: string;
  cnpj?: string;
  inscricaoEstadual?: string;
  // Contato
  email?: string;
  telefone?: string;
}

interface ClienteFormProps {
  initialData?: Partial<ClienteFormData>;
  onSubmit: (data: ClienteFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ClienteForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: ClienteFormProps) {
  const [formData, setFormData] = useState<ClienteFormData>({
    tipoPessoa: "Fisica",
    situacao: "Ativo",
    ativo: true,
    ...initialData,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Tipo de Pessoa"
          required
          value={formData.tipoPessoa}
          onChange={(e) => updateField("tipoPessoa", e.target.value)}
          options={[
            { value: "Fisica", label: "Pessoa Física" },
            { value: "Juridica", label: "Pessoa Jurídica" },
          ]}
        />

        <Select
          label="Situação"
          required
          value={formData.situacao}
          onChange={(e) => updateField("situacao", e.target.value)}
          options={[
            { value: "Ativo", label: "Ativo" },
            { value: "Inativo", label: "Inativo" },
            { value: "Pendente", label: "Pendente" },
          ]}
        />
      </div>

      {formData.tipoPessoa === "Fisica" ? (
        <>
          <Input
            label="Nome Completo"
            required
            value={formData.nome || ""}
            onChange={(e) => updateField("nome", e.target.value)}
            placeholder="Digite o nome completo"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="CPF"
              required
              value={formData.cpf || ""}
              onChange={(e) => updateField("cpf", e.target.value)}
              placeholder="000.000.000-00"
            />

            <Input
              label="RG"
              value={formData.rg || ""}
              onChange={(e) => updateField("rg", e.target.value)}
              placeholder="00.000.000-0"
            />
          </div>
        </>
      ) : (
        <>
          <Input
            label="Razão Social"
            required
            value={formData.razaoSocial || ""}
            onChange={(e) => updateField("razaoSocial", e.target.value)}
            placeholder="Digite a razão social"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="CNPJ"
              required
              value={formData.cnpj || ""}
              onChange={(e) => updateField("cnpj", e.target.value)}
              placeholder="00.000.000/0000-00"
            />

            <Input
              label="Inscrição Estadual"
              value={formData.inscricaoEstadual || ""}
              onChange={(e) => updateField("inscricaoEstadual", e.target.value)}
              placeholder="000.000.000.000"
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Email"
          type="email"
          required
          value={formData.email || ""}
          onChange={(e) => updateField("email", e.target.value)}
          placeholder="email@exemplo.com"
        />

        <Input
          label="Telefone"
          value={formData.telefone || ""}
          onChange={(e) => updateField("telefone", e.target.value)}
          placeholder="(00) 00000-0000"
        />
      </div>

      <div className="flex gap-3 pt-4 border-t border-neutral-200">
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="flex-1"
        >
          {initialData ? "Atualizar" : "Criar"} Cliente
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
