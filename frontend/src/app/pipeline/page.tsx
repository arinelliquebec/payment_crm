"use client";

import React, { useState, useEffect } from "react";
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core";
import { useLeads, Lead } from "@/hooks/useLeads";
import { KanbanColumn } from "@/components/pipeline/KanbanColumn";
import { LeadCard } from "@/components/pipeline/LeadCard";
import { NovoLeadModal, NovoLeadData } from "@/components/pipeline/NovoLeadModal";
import { Plus, SlidersHorizontal, Search, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import MainLayout from "@/components/MainLayout";

const COLUMNS = [
  { id: "Novo", title: "Novo Lead", color: "#3b82f6" },
  { id: "Qualificado", title: "Qualificado", color: "#10b981" },
  { id: "Proposta", title: "Proposta Enviada", color: "#8b5cf6" },
  { id: "Negociacao", title: "Negociação", color: "#f59e0b" },
  { id: "Fechado", title: "Fechado", color: "#059669" },
  { id: "Perdido", title: "Perdido", color: "#ef4444" },
  { id: "Pausado", title: "Pausado", color: "#6b7280" },
];

export default function PipelinePage() {
  const { leads, loading, fetchLeads, createLead, updateLeadStatus, getPipelineStats } =
    useLeads();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isNovoLeadModalOpen, setIsNovoLeadModalOpen] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      await fetchLeads();
      const pipelineStats = await getPipelineStats();
      setStats(pipelineStats);
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      setError(error.message || "Erro ao carregar pipeline");
    }
  };

  const getLeadsByStatus = (status: string) => {
    return leads.filter((lead) => lead.status === status);
  };

  const handleNovoLead = async (data: NovoLeadData) => {
    try {
      await createLead(data);
      toast.success("Lead criado com sucesso!");
      await loadData();
    } catch (error: any) {
      console.error("Erro ao criar lead:", error);
      toast.error(error.response?.data?.message || "Erro ao criar lead");
      throw error;
    }
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const leadId = parseInt(active.id as string);
    const newStatus = over.id as string;

    const lead = leads.find((l) => l.id === leadId);
    if (lead && lead.status === newStatus) {
      setActiveId(null);
      return;
    }

    try {
      await updateLeadStatus(leadId, newStatus);
      toast.success("Status atualizado com sucesso!");
      await loadData();
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }

    setActiveId(null);
  };

  const activeLead = activeId
    ? leads.find((l) => l.id.toString() === activeId)
    : null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (error) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="text-red-400 text-xl mb-4">
            Erro ao carregar pipeline
          </div>
          <p className="text-neutral-400 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-amber-500 text-neutral-950 rounded-lg hover:bg-amber-400"
          >
            Tentar Novamente
          </button>
        </div>
      </MainLayout>
    );
  }

  if (loading && leads.length === 0) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-neutral-950 p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
              <TrendingUp className="w-6 h-6 text-neutral-950" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-50">
                Pipeline de Vendas
              </h1>
              <p className="text-neutral-400">
                Gerencie seus leads e oportunidades de negócio
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <p className="text-xs text-neutral-500 mb-1">Total de Leads</p>
              <p className="text-2xl font-bold text-neutral-50">
                {stats.totalLeads}
              </p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <p className="text-xs text-neutral-500 mb-1">Valor Total</p>
              <p className="text-2xl font-bold text-amber-400">
                {formatCurrency(stats.valorTotal)}
              </p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <p className="text-xs text-neutral-500 mb-1">Valor Previsto</p>
              <p className="text-2xl font-bold text-green-400">
                {formatCurrency(stats.valorPrevisto)}
              </p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <p className="text-xs text-neutral-500 mb-1">Taxa de Conversão</p>
              <p className="text-2xl font-bold text-blue-400">
                {stats.taxaConversao.toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setIsNovoLeadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-neutral-950 rounded-lg font-medium hover:bg-amber-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Lead
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-neutral-200 rounded-lg hover:bg-neutral-700 transition-colors">
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
          </button>
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Buscar leads..."
                className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                leads={getLeadsByStatus(column.id)}
                color={column.color}
                onLeadClick={setSelectedLead}
              />
            ))}
          </div>

          <DragOverlay>
            {activeLead ? (
              <LeadCard lead={activeLead} onClick={() => {}} isDragging />
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Modal Novo Lead */}
        <NovoLeadModal
          isOpen={isNovoLeadModalOpen}
          onClose={() => setIsNovoLeadModalOpen(false)}
          onSubmit={handleNovoLead}
        />
      </div>
    </MainLayout>
  );
}
