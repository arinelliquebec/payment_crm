interface StatusBadgeProps {
  status: string;
  statusDescription?: string;
  foiPago?: boolean;
  paidValue?: number;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({
  status,
  statusDescription,
  foiPago,
  paidValue,
  size = "md",
}: StatusBadgeProps) {
  const getStatusConfig = (status: string, foiPago?: boolean, paidValue?: number) => {
    // REGRA PRINCIPAL: Usar foiPago como fonte da verdade
    // foiPago === true → Boleto foi pago
    // foiPago === false ou undefined → Verificar status para texto específico

    // 1. Verificar se foi pago usando o campo foiPago
    if (foiPago === true) {
      return {
        color: "bg-green-500/20 text-green-400 border-green-500/30",
        text: "Pago",
        icon: "✓",
      };
    }

    // 2. Se não foi pago (foiPago === false ou undefined), verificar o status
    switch (status.toUpperCase()) {
      case "BAIXADO":
        // BAIXADO sem foiPago = Expirado após 30 dias sem pagamento
        return {
          color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
          text: "Não Pago",
        };
      case "LIQUIDADO":
        // LIQUIDADO sem foiPago = Caso raro, mas mostrar como pago
        return {
          color: "bg-green-500/20 text-green-400 border-green-500/30",
          text: "Pago",
          icon: "✓",
        };
      case "ATIVO":
      case "REGISTRADO":
        return {
          color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
          text: "Aguardando",
          icon: "⏳",
        };
      case "VENCIDO":
        return {
          color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
          text: "Vencido",
        };
      case "CANCELADO":
        return {
          color: "bg-red-500/20 text-red-400 border-red-500/30",
          text: "Cancelado",
          icon: "✕",
        };
      case "PENDENTE":
        return {
          color: "bg-neutral-700 text-neutral-300 border-neutral-600",
          text: "Pendente",
          icon: "⏸",
        };
      case "ERRO":
        return {
          color: "bg-pink-500/20 text-pink-400 border-pink-500/30",
          text: "Erro",
          icon: "❌",
        };
      default:
        return {
          color: "bg-neutral-700 text-neutral-300 border-neutral-600",
          text: status || "Desconhecido",
          icon: null,
        };
    }
  };

  const config = getStatusConfig(status, foiPago, paidValue);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium border ${config.color} ${sizeClasses[size]}`}
      title={statusDescription || config.text}
    >
      {config.text}
    </span>
  );
}
