import { useState } from "react";
import {
  consultarStatusBoleto,
  sincronizarBoleto,
  sincronizarTodosBoletos,
  BoletoStatus,
  SincronizacaoResultado,
} from "@/services/boletoService";

export function useBoletoStatus() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<BoletoStatus | null>(null);

  const verificarStatus = async (boletoId: number) => {
    setLoading(true);
    try {
      const statusAtual = await consultarStatusBoleto(boletoId);
      setStatus(statusAtual);

      // Mostrar notificação se foi pago (usar foiPago como fonte da verdade)
      if (statusAtual.foiPago === true) {
        alert(
          `✅ Boleto pago!\n\nValor: R$ ${statusAtual.paidValue?.toFixed(2)}`
        );
      } else if (statusAtual.status === "BAIXADO") {
        alert(`⚠️ Boleto baixado (não pago) - Expirou após 30 dias`);
      } else {
        alert(`Status: ${statusAtual.statusDescription}`);
      }

      return statusAtual;
    } catch (error: any) {
      console.error("Erro ao verificar status:", error);
      alert(error?.message || "Erro ao verificar status do boleto");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sincronizar = async (boletoId: number) => {
    setLoading(true);
    try {
      const boleto = await sincronizarBoleto(boletoId);

      // Mostrar notificação se foi pago (usar foiPago como fonte da verdade)
      if (boleto.foiPago === true) {
        alert(`🎉 Boleto #${boletoId} foi pago!`);
      } else if (boleto.status === "BAIXADO") {
        alert(`⚠️ Boleto #${boletoId} baixado (não pago) - Expirou após 30 dias`);
      } else {
        alert(`✅ Boleto #${boletoId} sincronizado com sucesso!`);
      }

      return boleto;
    } catch (error: any) {
      console.error("Erro ao sincronizar boleto:", error);
      alert(error?.message || `Erro ao sincronizar boleto #${boletoId}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    status,
    loading,
    verificarStatus,
    sincronizar,
    // Usar foiPago como fonte da verdade
    isPago: status?.foiPago === true,
  };
}

export function useSincronizacaoEmMassa() {
  const [syncing, setSyncing] = useState(false);
  const [resultado, setResultado] = useState<SincronizacaoResultado | null>(
    null
  );
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 });

  const sincronizarTodos = async (
    onProgressUpdate?: (atual: number, total: number) => void
  ) => {
    setSyncing(true);
    setResultado(null);

    try {
      const result = await sincronizarTodosBoletos();
      setResultado(result);

      // Notificar sobre boletos pagos (LIQUIDADO = certeza de pagamento)
      // BAIXADO pode ser pago ou expirado, precisa verificar foiPago no backend
      const boletosLiquidados = result.atualizados.filter(
        (item) => item.statusNovo === "LIQUIDADO"
      );
      const boletosBaixados = result.atualizados.filter(
        (item) => item.statusNovo === "BAIXADO"
      );

      // Mostrar resumo
      let message = `✅ Sincronização concluída!\n\n`;
      message += `Total: ${result.total}\n`;
      message += `Sucesso: ${result.sucesso}\n`;
      message += `Erros: ${result.erros}\n`;

      if (boletosLiquidados.length > 0) {
        message += `\n🎉 ${boletosLiquidados.length} boleto(s) pagos (código de barras)!`;
      }
      if (boletosBaixados.length > 0) {
        message += `\n📋 ${boletosBaixados.length} boleto(s) baixados (verifique se foram pagos via PIX ou expiraram)`;
      }

      if (result.erros > 0) {
        message += `\n\n⚠️ ${result.erros} boleto(s) com erro na sincronização`;
      }

      alert(message);

      return result;
    } catch (error: any) {
      console.error("Erro ao sincronizar todos os boletos:", error);
      alert(error?.message || "Erro ao sincronizar boletos em massa");
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  return {
    syncing,
    resultado,
    progresso,
    sincronizarTodos,
  };
}

