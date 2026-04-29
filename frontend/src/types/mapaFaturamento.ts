// types/mapaFaturamento.ts
export interface BoletoResumido {
  id: number;
  numeroContrato: string;
  numeroPasta?: string;
  nsuCode: string;
  valor: number;
  dataEmissao: string;
  dataVencimento: string;
  dataPagamento?: string;
  vencido: boolean;
}

export interface ClienteMapa {
  clienteId: number;
  nome: string;
  documento: string;
  totalBoletos: number;
  totalPagos: number;
  totalAPagar: number;
  valorTotalPago: number;
  valorTotalAPagar: number;
  boletosPagos: BoletoResumido[];
  boletosAPagar: BoletoResumido[];
}

export interface FilialMapa {
  filialId: number;
  filialNome: string;
  totalClientes: number;
  clientes: ClienteMapa[];
}

