"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Lead } from "@/hooks/useLeads";
import { SortableLeadCard } from "./SortableLeadCard";

interface KanbanColumnProps {
  id: string;
  title: string;
  leads: Lead[];
  color: string;
  onLeadClick: (lead: Lead) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  leads,
  color,
  onLeadClick,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  const totalValue = leads.reduce((sum, lead) => sum + lead.valorEstimado, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="flex flex-col h-full min-w-[320px] max-w-[320px]">
      {/* Header */}
      <div
        className={`p-4 rounded-t-xl border-b-2`}
        style={{
          backgroundColor: `${color}10`,
          borderColor: color,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-neutral-50">{title}</h3>
          <span
            className="px-2 py-1 rounded-full text-xs font-bold"
            style={{
              backgroundColor: `${color}20`,
              color: color,
            }}
          >
            {leads.length}
          </span>
        </div>
        <p className="text-xs font-medium text-neutral-400">
          {formatCurrency(totalValue)}
        </p>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-3 space-y-3 overflow-y-auto bg-neutral-950/50 rounded-b-xl transition-colors ${
          isOver ? "bg-amber-500/10 ring-2 ring-amber-500/50" : ""
        }`}
        style={{
          minHeight: "400px",
          maxHeight: "calc(100vh - 300px)",
        }}
      >
        <SortableContext
          items={leads.map((l) => l.id.toString())}
          strategy={verticalListSortingStrategy}
        >
          {leads.map((lead) => (
            <SortableLeadCard
              key={lead.id}
              lead={lead}
              onClick={() => onLeadClick(lead)}
            />
          ))}
        </SortableContext>

        {leads.length === 0 && (
          <div className="flex items-center justify-center h-32 text-neutral-600 text-sm">
            Nenhum lead
          </div>
        )}
      </div>
    </div>
  );
};
