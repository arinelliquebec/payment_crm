/**
 * Clientes Page
 * Página principal de listagem de clientes
 */

"use client";

import { useState } from "react";
import { useClientes } from "../hooks/useClientes";
import { DataTable, LoadingState, EmptyState, Button } from "@/shared";
import { SearchInput } from "@/shared/components/forms";
import { ClienteFilters } from "../components/ClienteFilters";

export default function ClientesPage() {
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const {
    data: clientes,
    isLoading,
    error,
    refetch,
  } = useClientes({
    ...filters,
    search: searchTerm,
  });

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Erro ao carregar clientes: {error.message}
          </p>
          <Button onClick={() => refetch()} className="mt-2">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState size="lg" />;
  }

  if (!clientes || clientes.length === 0) {
    return (
      <EmptyState
        title="Nenhum cliente encontrado"
        description="Comece adicionando seu primeiro cliente"
        action={{
          label: "Adicionar Cliente",
          onClick: () => console.log("Add cliente"),
        }}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Clientes</h1>
          <p className="text-neutral-600">Gerencie seus clientes</p>
        </div>
        <Button variant="primary">+ Novo Cliente</Button>
      </div>

      {/* Search */}
      <SearchInput placeholder="Buscar clientes..." onSearch={setSearchTerm} />

      {/* Filters */}
      <ClienteFilters onFilterChange={setFilters} />

      {/* Table */}
      <div className="bg-white rounded-lg border border-neutral-200">
        <DataTable
          data={clientes}
          keyExtractor={(item) => item.id.toString()}
          columns={[
            { key: "id", label: "ID", sortable: true },
            { key: "nome", label: "Nome", sortable: true },
            { key: "email", label: "Email" },
            { key: "telefone", label: "Telefone" },
          ]}
        />
      </div>
    </div>
  );
}
