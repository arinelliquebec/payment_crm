/**
 * ClienteFilters Component
 * Filtros para listagem de clientes
 */

"use client";

import { useState } from "react";
import { FilterPanel, Input, Select } from "@/shared/components/forms";

interface ClienteFiltersProps {
  onFilterChange: (filters: any) => void;
}

export function ClienteFilters({ onFilterChange }: ClienteFiltersProps) {
  const [filters, setFilters] = useState({
    nome: "",
    email: "",
    tipoPessoa: "",
    situacao: "",
    ativo: "",
  });

  const handleApply = () => {
    const activeFilters = Object.entries(filters).reduce(
      (acc, [key, value]) => {
        if (value) acc[key] = value;
        return acc;
      },
      {} as any
    );

    onFilterChange(activeFilters);
  };

  const handleClear = () => {
    setFilters({
      nome: "",
      email: "",
      tipoPessoa: "",
      situacao: "",
      ativo: "",
    });
    onFilterChange({});
  };

  return (
    <FilterPanel onApply={handleApply} onClear={handleClear}>
      <Input
        label="Nome"
        placeholder="Buscar por nome..."
        value={filters.nome}
        onChange={(e) => setFilters({ ...filters, nome: e.target.value })}
      />

      <Input
        label="Email"
        type="email"
        placeholder="Buscar por email..."
        value={filters.email}
        onChange={(e) => setFilters({ ...filters, email: e.target.value })}
      />

      <Select
        label="Tipo de Pessoa"
        placeholder="Selecione..."
        value={filters.tipoPessoa}
        onChange={(e) => setFilters({ ...filters, tipoPessoa: e.target.value })}
        options={[
          { value: "Fisica", label: "Pessoa Física" },
          { value: "Juridica", label: "Pessoa Jurídica" },
        ]}
      />

      <Select
        label="Situação"
        placeholder="Selecione..."
        value={filters.situacao}
        onChange={(e) => setFilters({ ...filters, situacao: e.target.value })}
        options={[
          { value: "Ativo", label: "Ativo" },
          { value: "Inativo", label: "Inativo" },
          { value: "Pendente", label: "Pendente" },
        ]}
      />

      <Select
        label="Status"
        placeholder="Selecione..."
        value={filters.ativo}
        onChange={(e) => setFilters({ ...filters, ativo: e.target.value })}
        options={[
          { value: "true", label: "Ativo" },
          { value: "false", label: "Inativo" },
        ]}
      />
    </FilterPanel>
  );
}
