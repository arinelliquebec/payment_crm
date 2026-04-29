/**
 * Contratos Page
 * Página principal de listagem de contratos
 */

"use client";

import { useState } from "react";
import { useContratos } from "../hooks/useContratos";
import { DataTable, LoadingState, EmptyState, Button } from "@/shared";

export default function ContratosPage() {
  const [filters] = useState({});
  const { data: contratos, isLoading, error, refetch } = useContratos(filters);

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Erro ao carregar contratos</p>
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

  if (!contratos || contratos.length === 0) {
    return (
      <EmptyState
        title="Nenhum contrato encontrado"
        description="Comece adicionando seu primeiro contrato"
      />
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Contratos</h1>
      <DataTable
        data={contratos}
        keyExtractor={(item) => item.id.toString()}
        columns={[
          { key: "id", label: "ID" },
          { key: "numero", label: "Número" },
          { key: "clienteId", label: "Cliente" },
        ]}
      />
    </div>
  );
}
