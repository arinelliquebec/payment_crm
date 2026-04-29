// hooks/useMapasFaturamento.ts
import { useState, useCallback } from "react";
import { useBoletos } from "./useBoletos";
import { FilialMapa, ClienteMapa, BoletoResumido } from "@/types/mapaFaturamento";

export function useMapasFaturamento() {
  const { boletos, loading: boletosLoading, fetchBoletos } = useBoletos();
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchMapas = useCallback(async () => {
    try {
      setError(null);
      await fetchBoletos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar mapas");
    }
  }, [fetchBoletos]);

  // Agrupar boletos por filial e cliente
  const filiais: FilialMapa[] = [];

  // Map para agrupar por filial
  const filiaisMap = new Map<string, Map<string, ClienteMapa>>();

  boletos.forEach((boleto) => {
    const filialNome = boleto.contrato?.clienteNome || "Sem Filial";
    const clienteNome = boleto.payerName || "Sem Nome";
    const clienteDoc = boleto.payerDocumentNumber || "Sem Documento";

    // Criar mapa de filial se não existir
    if (!filiaisMap.has(filialNome)) {
      filiaisMap.set(filialNome, new Map<string, ClienteMapa>());
    }

    const clientesMap = filiaisMap.get(filialNome)!;

    // Criar cliente se não existir
    if (!clientesMap.has(clienteDoc)) {
      clientesMap.set(clienteDoc, {
        clienteId: boleto.id, // Usar ID do boleto como proxy
        nome: clienteNome,
        documento: clienteDoc,
        totalBoletos: 0,
        totalPagos: 0,
        totalAPagar: 0,
        valorTotalPago: 0,
        valorTotalAPagar: 0,
        boletosPagos: [],
        boletosAPagar: [],
      });
    }

    const cliente = clientesMap.get(clienteDoc)!;

    // Verificar se está vencido
    // REGRA PRINCIPAL: Usar foiPago como fonte da verdade
    const foiPago = boleto.foiPago === true ||
      (boleto.foiPago === undefined && boleto.status === "LIQUIDADO");

    // Não considerar vencidos os boletos que já foram pagos ou cancelados
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(boleto.dueDate);
    vencimento.setHours(0, 0, 0, 0);
    // Se o boleto foi pago ou cancelado, não está vencido
    const vencido =
      !foiPago &&
      boleto.status !== "CANCELADO" &&
      hoje > vencimento;

    // Criar resumo do boleto
    const boletoResumido: BoletoResumido = {
      id: boleto.id,
      numeroContrato: boleto.contrato?.numeroContrato || "N/A",
      numeroPasta: undefined, // Campo não disponível em ContratoInfo
      nsuCode: boleto.nsuCode || "N/A",
      valor: boleto.nominalValue,
      dataEmissao: new Date(boleto.issueDate).toLocaleDateString("pt-BR"),
      dataVencimento: new Date(boleto.dueDate).toLocaleDateString("pt-BR"),
      dataPagamento: boleto.entryDate ? new Date(boleto.entryDate).toLocaleDateString("pt-BR") : undefined,
      vencido,
    };

    // Classificar boleto usando foiPago
    if (foiPago) {
      cliente.boletosPagos.push(boletoResumido);
      cliente.totalPagos++;
      cliente.valorTotalPago += boleto.nominalValue;
    } else {
      cliente.boletosAPagar.push(boletoResumido);
      cliente.totalAPagar++;
      cliente.valorTotalAPagar += boleto.nominalValue;
    }

    cliente.totalBoletos++;
  });

  // Converter maps para arrays
  let filialIdCounter = 1;
  filiaisMap.forEach((clientesMap, filialNome) => {
    const clientes = Array.from(clientesMap.values());

    filiais.push({
      filialId: filialIdCounter++,
      filialNome,
      totalClientes: clientes.length,
      clientes,
    });
  });

  return {
    filiais,
    loading: boletosLoading,
    error,
    fetchMapas,
    clearError,
  };
}

