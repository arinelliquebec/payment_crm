"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Lead } from "@/hooks/useLeads";
import { LeadCard } from "./LeadCard";

interface SortableLeadCardProps {
  lead: Lead;
  onClick: () => void;
}

export const SortableLeadCard: React.FC<SortableLeadCardProps> = ({
  lead,
  onClick,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard lead={lead} onClick={onClick} isDragging={isDragging} />
    </div>
  );
};
