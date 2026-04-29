export interface PrestadorConfig {
  id: string;
  label: string;
  codigoMunicipio: string;
  cnpj: string;
  inscricaoMunicipal: string;
  regimeApuracaoTributaria: string;
  razaoSocial: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  uf: string;
  cep: string;
  email: string;
  telefone: string;
  codigoServico?: string;
  codigoNBS?: string;
  codigoTributacaoMunicipio?: string;
  descricaoServico?: string;
  issRetido?: string;
  aliquotaIss?: string;
}

export const PRESTADORES_CADASTRADOS: PrestadorConfig[] = [
  {
    id: "arrighi_rj",
    label: "ARRIGHI ADVOGADOS E ASSOCIADOS (RJ)",
    codigoMunicipio: "3304557",
    cnpj: "09039684000100",
    inscricaoMunicipal: "01199595",
    regimeApuracaoTributaria: "6",
    razaoSocial: "ARRIGHI ADVOGADOS E ASSOCIADOS",
    logradouro: "RUA MEXICO",
    numero: "41",
    complemento: "SALA 1401",
    bairro: "CENTRO",
    uf: "RJ",
    cep: "20031144",
    email: "fiscal.rj2@fradema.com.br",
    telefone: "2122170600",
    codigoServico: "171401",
    codigoTributacaoMunicipio: "001",
    descricaoServico: "Serviço Advocatícios",
    issRetido: "2",
  },
  {
    id: "arrighi_sp",
    label: "ARRIGHI ADVOGADOS E ASSOCIADOS (SP)",
    codigoMunicipio: "3550308",
    cnpj: "09039684000371",
    inscricaoMunicipal: "65171179",
    regimeApuracaoTributaria: "6",
    razaoSocial: "ARRIGHI ADVOGADOS E ASSOCIADOS",
    logradouro: "R IRAUNA",
    numero: "405",
    complemento: "CA",
    bairro: "JARDIM NOVO MUNDO",
    uf: "SP",
    cep: "04518060",
    email: "fiscal.rj2@fradema.com.br",
    telefone: "2122170600",
    codigoServico: "03220",
    codigoTributacaoMunicipio: "03220",
    descricaoServico: "Serviços Advocaticios",
    issRetido: "1",
    aliquotaIss: "5",
  },
];

export function getPrestadorById(id: string): PrestadorConfig | undefined {
  return PRESTADORES_CADASTRADOS.find((p) => p.id === id);
}

export function getPrestadorPorUF(uf: string): PrestadorConfig | undefined {
  return PRESTADORES_CADASTRADOS.find((p) => p.uf === uf);
}
