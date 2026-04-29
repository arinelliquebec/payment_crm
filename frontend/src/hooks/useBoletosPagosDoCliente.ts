import { useState, useCallback, useEffect, useRef } from "react";
import { Boleto, parseBoletosListResponse } from "@/types/boleto";
import { Cliente } from "@/types/api";
import { apiClient } from "@/lib/api";

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function useBoletosPagosDoCliente(selectedCliente: Cliente | null) {
  const [boletosPagos, setBoletosPagos] = useState<Boleto[]>([]);
  const [loadingBoletos, setLoadingBoletos] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const fetchCount = useRef(0);

  const clearBoletos = useCallback(() => {
    setBoletosPagos([]);
    setLoadingBoletos(false);
    setHasSearched(false);
    fetchCount.current += 1;
  }, []);

  useEffect(() => {
    if (!selectedCliente) {
      clearBoletos();
      return;
    }

    const isPJ = selectedCliente.tipo === "juridica" || selectedCliente.tipoPessoa === "Juridica";
    const rawNome = isPJ
      ? selectedCliente.razaoSocial || selectedCliente.pessoaJuridica?.razaoSocial || selectedCliente.nome
      : selectedCliente.nome || selectedCliente.pessoaFisica?.nome || selectedCliente.razaoSocial;

    if (!rawNome) {
      clearBoletos();
      return;
    }

    const nomeClienteNormalizado = normalize(rawNome);
    
    let isCurrent = true;
    const currentFetchId = ++fetchCount.current;
    
    setLoadingBoletos(true);
    setHasSearched(true);
    setBoletosPagos([]);

    const params = new URLSearchParams();
    params.append("clienteNome", rawNome);
    
    apiClient.get(`/Boleto?${params.toString()}`)
      .then((response: any) => {
        if (!isCurrent || currentFetchId !== fetchCount.current) return;
        
        if (response.error) {
          setLoadingBoletos(false);
          return;
        }

        const { boletos: clientBoletos } = parseBoletosListResponse(
          response.data,
        );
        const isPago = (b: Boleto) => b.foiPago === true || b.status === "LIQUIDADO";

        const pertenceAoCliente = (b: Boleto): boolean => {
          const nomeContrato = normalize(b.contrato?.clienteNome ?? "");
          const nomePagador  = normalize(b.payerName ?? "");
          return nomeContrato.includes(nomeClienteNormalizado) || nomePagador.includes(nomeClienteNormalizado);
        };

        const filtrados = clientBoletos.filter((b) => isPago(b) && pertenceAoCliente(b));

        setBoletosPagos(filtrados);
        setLoadingBoletos(false);
      })
      .catch(() => {
        if (!isCurrent || currentFetchId !== fetchCount.current) return;
        setLoadingBoletos(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedCliente, clearBoletos]);

  return { boletosPagos, loadingBoletos, hasSearched, clearBoletos };
}
