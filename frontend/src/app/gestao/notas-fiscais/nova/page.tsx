"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { useQueryClient } from "@tanstack/react-query";
import { NFSE_HISTORICO_QUERY_KEY } from "@/app/gestao/notas-fiscais/page";
import {
  FileCheck,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  Hash,
  Search as SearchIcon,
  FileText,
  Calendar,
  RefreshCw,
  MapPin,
  Phone,
  DollarSign,
  Download,
  Trash2,
  Mail,
  Users as UsersIcon,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClientes } from "@/hooks/useClientes";
import { Cliente } from "@/types/api";
import { useBoletosPagosDoCliente } from "@/hooks/useBoletosPagosDoCliente";
import { Boleto } from "@/types/boleto";
import { toast } from "sonner";
import { PermissionWrapper } from "@/components/permissions";
import {
  PRESTADORES_CADASTRADOS,
  getPrestadorById,
  getPrestadorPorUF,
} from "@/config/prestadores";

// ========================================
// TIPOS
// ========================================
interface NfseFormData {
  codigoMunicipio: string;
  cnpjPrestador: string;
  inscricaoMunicipalPrestador: string;
  regimeApuracaoTributaria: string;
  razaoSocialPrestador: string;
  prestadorLogradouro: string;
  prestadorNumero: string;
  prestadorComplemento: string;
  prestadorBairro: string;
  prestadorUf: string;
  prestadorCep: string;
  prestadorEmail: string;
  prestadorTelefone: string;
  cpfCnpjTomador: string;
  razaoSocialTomador: string;
  tomadorLogradouro: string;
  tomadorNumero: string;
  tomadorComplemento: string;
  tomadorBairro: string;
  tomadorCodigoMunicipio: string;
  tomadorUf: string;
  tomadorCep: string;
  tomadorEmail: string;
  tomadorTelefone: string;
  tomadorMunicipio: string;
  descricaoServico: string;
  discriminacaoServico: string;
  valorServicos: string;
  valorDeducoes: string;
  valorPis: string;
  valorCofins: string;
  valorInss: string;
  valorIr: string;
  valorCsll: string;
  aliquotaIss: string;
  issRetido: string;
  codigoServico: string;
  codigoNBS: string;
  codigoTributacaoMunicipio: string;
  dataEmissao: string;
  dataCompetencia: string;
  informacoesComplementares: string;
  outrasInformacoes: string;
  informacoesFisco: string;
}

interface ApiResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
}

// ========================================
// CONSTANTES — fora do componente para evitar recriação
// ========================================
const UF_OPTIONS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const UF_MAP: Record<string, string> = {
  AC:"Acre",AL:"Alagoas",AP:"Amapá",AM:"Amazonas",BA:"Bahia",CE:"Ceará",
  DF:"Distrito Federal",ES:"Espírito Santo",GO:"Goiás",MA:"Maranhão",
  MT:"Mato Grosso",MS:"Mato Grosso do Sul",MG:"Minas Gerais",PA:"Pará",
  PB:"Paraíba",PR:"Paraná",PE:"Pernambuco",PI:"Piauí",RJ:"Rio de Janeiro",
  RN:"Rio Grande do Norte",RS:"Rio Grande do Sul",RO:"Rondônia",RR:"Roraima",
  SC:"Santa Catarina",SP:"São Paulo",SE:"Sergipe",TO:"Tocantins",
};

const MUNICIPIO_NOMES: Record<string, string> = {
  "3550308": "São Paulo",
  "3304557": "Rio de Janeiro",
};

const getMensagemPorCodigo = (codigo: string | number, sucesso: boolean): string => {
  const cod = String(codigo);
  if (sucesso) {
    switch (cod) {
      case "200": case "201": return "NFS-e emitida com sucesso!";
      case "202": return "NFS-e recebida para processamento.";
      default: return `NFS-e processada (código: ${cod}).`;
    }
  } else {
    switch (cod) {
      case "400": return "Dados inválidos. Verifique os campos obrigatórios.";
      case "401": return "Não autorizado. Verifique suas credenciais.";
      case "403": return "Acesso negado. Sem permissão para emitir NFS-e.";
      case "404": return "Serviço não encontrado. Verifique os dados.";
      case "409": return "Conflito de dados. NFS-e já pode existir.";
      case "422": return "Validação falhou. Verifique todos os campos.";
      case "429": return "Muitas tentativas. Aguarde e tente novamente.";
      case "500": return "Erro interno do servidor. Tente novamente mais tarde.";
      case "502": return "Serviço temporariamente indisponível.";
      case "503": return "Sistema em manutenção. Tente novamente depois.";
      case "504": return "Tempo esgotado. O servidor demorou a responder.";
      default: return `Erro ao emitir NFS-e (código: ${cod}).`;
    }
  }
};

const formatarErroAmigavel = (rawError: string | string[], def = "Erro desconhecido."): string => {
  if (!rawError) return def;
  const msg = Array.isArray(rawError) ? rawError.join(" | ") : String(rawError);
  return msg;
};

const getBrasiliaTimeStr = () => {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(new Date());
  const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
};

/**
 * Gera a discriminação pré-fixada no padrão:
 * "Prestação de serviços advocatícios no período de MM/AAAA"
 */
const gerarDiscriminacaoBoleto = (boleto: Boleto): string => {
  const dataRef = boleto.paymentDate || boleto.dataPagamento || boleto.settlementDate || boleto.dueDate;
  const data = new Date(dataRef);
  // Usa UTC para evitar problemas de fuso horário na conversão de string ISO
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  const ano = data.getUTCFullYear();
  return `Prestação de serviços advocatícios no período de ${mes}/${ano}`;
};

const getInitialState = (): NfseFormData => {
  const datetime = getBrasiliaTimeStr();
  return {
    codigoMunicipio: "3550308",
    cnpjPrestador: "",
    inscricaoMunicipalPrestador: "",
    regimeApuracaoTributaria: "6",
    razaoSocialPrestador: "",
    prestadorLogradouro: "",
    prestadorNumero: "",
    prestadorComplemento: "",
    prestadorBairro: "",
    prestadorUf: "SP",
    prestadorCep: "",
    prestadorEmail: "",
    prestadorTelefone: "",
    cpfCnpjTomador: "",
    razaoSocialTomador: "",
    tomadorLogradouro: "",
    tomadorNumero: "",
    tomadorComplemento: "",
    tomadorBairro: "",
    tomadorCodigoMunicipio: "3550308",
    tomadorUf: "",
    tomadorCep: "",
    tomadorEmail: "",
    tomadorTelefone: "",
    tomadorMunicipio: "",
    descricaoServico: "",
    discriminacaoServico: "",
    valorServicos: "",
    valorDeducoes: "",
    valorPis: "",
    valorCofins: "",
    valorInss: "",
    valorIr: "",
    valorCsll: "",
    aliquotaIss: "",
    issRetido: "2",
    codigoServico: "03220",
    codigoNBS: "",
    codigoTributacaoMunicipio: "",
    informacoesComplementares: "",
    outrasInformacoes: "",
    informacoesFisco: "",
    dataEmissao: datetime,
    dataCompetencia: datetime,
  };
};

// ========================================
// COMPONENTES AUXILIARES
// ========================================
const inputClass =
  "w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-neutral-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all";

const inputReadonlyClass =
  "w-full bg-neutral-900/50 border border-neutral-700 rounded-lg px-4 py-2.5 text-neutral-400 cursor-not-allowed select-none";

const labelClass = "block text-sm font-medium text-neutral-300 mb-1.5";

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string }> = ({
  icon, title, subtitle,
}) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30">
      <span className="text-amber-500">{icon}</span>
    </div>
    <div>
      <h3 className="text-lg font-semibold text-neutral-200">{title}</h3>
      {subtitle && <p className="text-sm text-neutral-400">{subtitle}</p>}
    </div>
  </div>
);

const SubSectionTitle: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2 mt-6 mb-4 pt-4 border-t border-neutral-800">
    <span className="text-amber-500">{icon}</span>
    <h4 className="text-base font-medium text-neutral-300">{title}</h4>
  </div>
);

/** Badge "Automático" reutilizável */
const AutoBadge = () => (
  <span className="ml-auto text-[10px] text-neutral-500 border border-neutral-700 px-1.5 py-0.5 rounded shrink-0">
    Automático
  </span>
);

/** Campo readonly com ícone de cadeado abaixo */
const LockedFieldNote = () => (
  <p className="text-[10px] text-amber-500/60 mt-1 flex items-center gap-1">
    <Lock size={10} />
    Preenchido automaticamente pelo cadastro do cliente
  </p>
);

// ========================================
// HELPERS
// ========================================
const getClienteUF = (cliente: Cliente): string =>
  (cliente.pessoaJuridica?.endereco?.estado || cliente.pessoaFisica?.endereco?.estado || "")
    .trim()
    .toUpperCase();

const getPrestadorUFParaCliente = (clienteUF: string): "RJ" | "SP" =>
  clienteUF === "RJ" ? "RJ" : "SP";

const getUFByCep = (cep: string): "RJ" | "SP" | null => {
  const n = parseInt(cep.replace(/\D/g, "").slice(0, 5), 10);
  if (isNaN(n)) return null;
  if (n >= 20000 && n <= 28999) return "RJ";
  if (n >= 1000 && n <= 19999) return "SP";
  return null;
};

const formatCNPJ = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

const formatCpfCnpj = (value: string): string => {
  const d = value.replace(/\D/g, "");
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14);
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18);
};

// ========================================
// COMPONENTE PRINCIPAL
// ========================================
export default function EmissaoNotaFiscalPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<NfseFormData>(getInitialState());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [canDownload, setCanDownload] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [discriminacaoEditada, setDiscriminacaoEditada] = useState(false);
  const [boletosSelecionados, setBoletosSelecionados] = useState<Set<number>>(new Set());

  // ── Clientes ──
  const { clientes } = useClientes();
  const [showClientePicker, setShowClientePicker] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [clientePickerSearch, setClientePickerSearch] = useState("");
  const [clientePickerPage, setClientePickerPage] = useState(1);
  const clientePickerPageSize = 5;

  // ── Boletos ──
  const { boletosPagos, loadingBoletos, hasSearched, clearBoletos } = useBoletosPagosDoCliente(selectedCliente);

  const getClienteDisplay = useCallback((c: Cliente) => {
    const tp = String(c.tipoPessoa ?? "").trim().toLowerCase();
    const isFisicaExplicit =
      c.tipo === "fisica" ||
      tp === "fisica" ||
      tp === "pf" ||
      tp === "pessoa física" ||
      tp === "pessoa fisica" ||
      tp === "pessoafisica";
    const isJuridicaExplicit =
      c.tipo === "juridica" ||
      tp === "juridica" ||
      tp === "pj" ||
      tp === "pessoa jurídica" ||
      tp === "pessoa juridica" ||
      tp === "pessoajuridica";
    const cnpjDigits = String(c.cnpj || c.pessoaJuridica?.cnpj || "").replace(/\D/g, "");
    const hasCnpjValido = cnpjDigits.length === 14;
    // PF explícito nunca é tratado como PJ (evita falso positivo por razão social fantasma no spread)
    const isJuridica = isFisicaExplicit ? false : isJuridicaExplicit || hasCnpjValido;

    const nome = (
      isJuridica
        ? c.razaoSocial || c.pessoaJuridica?.razaoSocial || c.nome
        : c.nome || c.pessoaFisica?.nome || c.razaoSocial
    ) || c.nome || c.razaoSocial || c.pessoaJuridica?.razaoSocial || c.pessoaFisica?.nome || "";

    const tipo: "fisica" | "juridica" = isJuridica ? "juridica" : "fisica";

    const doc =
      (isJuridica ? c.cnpj || c.pessoaJuridica?.cnpj : c.cpf || c.pessoaFisica?.cpf) || "";
    
    const email = c.email || c.pessoaFisica?.emailEmpresarial || c.pessoaJuridica?.email || "";
    const tels = [
      c.telefone1 || c.pessoaFisica?.telefone1 || c.pessoaJuridica?.telefone1,
      c.telefone2 || c.pessoaFisica?.telefone2 || c.pessoaJuridica?.telefone2,
    ].filter(Boolean).join(" · ");
    const uf = (c.pessoaJuridica?.endereco?.estado || c.pessoaFisica?.endereco?.estado || "")
      .trim().toUpperCase();
    return { nome, tipo, doc, email, tels, uf };
  }, []);

  // ── Handlers de Seleção de Boletos ──
  const handleToggleBoleto = useCallback((boleto: Boleto) => {
    setBoletosSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(boleto.id)) {
        next.delete(boleto.id);
      } else {
        next.add(boleto.id);
      }
      return next;
    });
  }, []);

  const handleToggleTodosBoletos = useCallback(() => {
    const todosSelecionados = boletosPagos.length > 0 && boletosPagos.every((b) => boletosSelecionados.has(b.id));

    if (todosSelecionados) {
      setBoletosSelecionados(new Set());
    } else {
      setBoletosSelecionados(new Set(boletosPagos.map((b) => b.id)));
    }
  }, [boletosPagos, boletosSelecionados]);

  // Efeito reativo para sincronizar total e descrição com a seleção
  useEffect(() => {
    if (boletosSelecionados.size === 0) {
      // Se desmarcou tudo, limpa os campos se não foram preenchidos manualmente
      setFormData((prev) => ({
        ...prev,
        valorServicos: "",
        ...(!discriminacaoEditada && { discriminacaoServico: "" })
      }));
      return;
    }

    const selecionados = boletosPagos.filter((b) => boletosSelecionados.has(b.id));
    const total = selecionados.reduce((acc, b) => acc + (b.paidValue || b.nominalValue || 0), 0);
    const formatted = total.toFixed(2).replace(".", ",");

    // Deriva a discriminação baseada na seleção
    let novaDiscriminacao = undefined;
    if (!discriminacaoEditada) {
      if (selecionados.length === 1) {
        novaDiscriminacao = gerarDiscriminacaoBoleto(selecionados[0]);
      } else if (selecionados.length > 1) {
        const periodos = selecionados
          .map((b) => {
            const dataRef = b.paymentDate || b.dataPagamento || b.settlementDate || b.dueDate;
            const d = new Date(dataRef);
            return `${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
          })
          .sort() // Ordena por data (simplificado)
          .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicatas de período
        
        novaDiscriminacao = `Prestação de serviços advocatícios nos períodos de ${periodos.join(", ")}`;
      }
    }

    setFormData((prev) => ({
      ...prev,
      valorServicos: formatted,
      ...(novaDiscriminacao !== undefined && { discriminacaoServico: novaDiscriminacao })
    }));
  }, [boletosSelecionados, boletosPagos, discriminacaoEditada]);

  const filteredClientes = useMemo(() => {
    const term = clientePickerSearch.trim().toLowerCase();
    if (!term) return clientes;

    // Normaliza removendo pontuação para comparar doc sem máscara
    const termDigits = term.replace(/\D/g, "");

    return clientes.filter((c) => {
      // Coleta todos os candidatos de nome, sem depender de isJuridica
      const nomes = [
        c.nome,
        c.razaoSocial,
        c.pessoaJuridica?.razaoSocial,
        c.pessoaFisica?.nome,
      ].filter(Boolean).map((s) => s!.toLowerCase());

      // Coleta todos os docs possíveis
      const docs = [
        c.cnpj,
        c.cpf,
        c.pessoaJuridica?.cnpj,
        c.pessoaFisica?.cpf,
      ].filter(Boolean);

      // Compara doc com e sem máscara
      const docMatch = docs.some((doc) => {
        const docLower = doc!.toLowerCase();
        const docDigits = doc!.replace(/\D/g, "");
        return (
          docLower.includes(term) ||
          (termDigits.length >= 3 && docDigits.includes(termDigits))
        );
      });

      const email = (
        c.email ||
        c.pessoaFisica?.emailEmpresarial ||
        c.pessoaJuridica?.email ||
        ""
      ).toLowerCase();

      const tels = [
        c.telefone1, c.telefone2,
        c.pessoaFisica?.telefone1, c.pessoaFisica?.telefone2,
        c.pessoaJuridica?.telefone1, c.pessoaJuridica?.telefone2,
      ].filter(Boolean).join(" ");

      return (
        nomes.some((n) => n.includes(term)) ||
        docMatch ||
        email.includes(term) ||
        tels.includes(term)
      );
    });
  }, [clientes, clientePickerSearch]);

  const totalClientePages = Math.max(1, Math.ceil(filteredClientes.length / clientePickerPageSize));
  const currentClientePage = Math.min(clientePickerPage, totalClientePages);
  const paginatedClientes = useMemo(() => {
    const start = (currentClientePage - 1) * clientePickerPageSize;
    return filteredClientes.slice(start, start + clientePickerPageSize);
  }, [filteredClientes, currentClientePage]);

  const lookupCep = useCallback(async (cep: string, prefix: "prestador" | "tomador") => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await resp.json();
      if (data.erro) return;
      if (prefix === "prestador") {
        setFormData((prev) => ({
          ...prev,
          prestadorLogradouro: data.logradouro || prev.prestadorLogradouro,
          prestadorBairro: data.bairro || prev.prestadorBairro,
          prestadorUf: data.uf || prev.prestadorUf,
          codigoMunicipio: data.ibge || prev.codigoMunicipio,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          tomadorLogradouro: data.logradouro || prev.tomadorLogradouro,
          tomadorBairro: data.bairro || prev.tomadorBairro,
          tomadorUf: data.uf || prev.tomadorUf,
          tomadorCodigoMunicipio: data.ibge || prev.tomadorCodigoMunicipio,
          tomadorMunicipio: data.localidade || prev.tomadorMunicipio,
        }));
      }
    } catch {
      // ignora erro ViaCEP
    }
  }, []);

  const handleSelectCliente = async (cliente: Cliente) => {
    const clienteUF = getClienteUF(cliente);
    const tomadorCep = (
      cliente.pessoaJuridica?.endereco?.cep || cliente.pessoaFisica?.endereco?.cep || ""
    ).replace(/\D/g, "");
    const ufByCep = getUFByCep(tomadorCep);

    const ufFinal = (() => {
      if (!clienteUF && !ufByCep) return null;
      if (clienteUF && ufByCep && ufByCep !== clienteUF) {
        console.warn(`[Prestador] UF do cadastro "${clienteUF}" diverge do CEP → usando "${ufByCep}".`);
        return ufByCep;
      }
      return clienteUF || ufByCep;
    })();

    if (!ufFinal) {
      toast.error("Não foi possível determinar o estado do cliente. Verifique UF e CEP no cadastro.");
      return;
    }

    const prestadorUF = getPrestadorUFParaCliente(ufFinal);
    const prestador = getPrestadorPorUF(prestadorUF);

    if (!prestador) {
      toast.error(`Prestador não encontrado para a UF "${prestadorUF}". Contate o suporte.`);
      return;
    }

    setSelectedCliente(cliente);
    setShowClientePicker(false);
    setClientePickerSearch("");
    setClientePickerPage(1);
    setBoletosSelecionados(new Set());

    const isPJ = cliente.tipo === "juridica";
    const prevIsPJ = selectedCliente?.tipo === "juridica";
    const tipoMudou = selectedCliente != null && prevIsPJ !== isPJ;

    const docDigits = isPJ
      ? String(cliente.cnpj || cliente.pessoaJuridica?.cnpj || "").replace(/\D/g, "")
      : String(cliente.cpf || cliente.pessoaFisica?.cpf || "").replace(/\D/g, "");

    const nome = isPJ
      ? cliente.razaoSocial || cliente.pessoaJuridica?.razaoSocial || cliente.nome
      : cliente.nome || cliente.pessoaFisica?.nome || cliente.razaoSocial;

    const tomadorEmail =
      cliente.email ||
      cliente.pessoaFisica?.emailEmpresarial ||
      cliente.pessoaJuridica?.email ||
      "";

    const tomadorTelefone =
      cliente.telefone1 ||
      cliente.pessoaFisica?.telefone1 ||
      cliente.pessoaJuridica?.telefone1 ||
      "";

    const tomadorCidade =
      cliente.pessoaJuridica?.endereco?.cidade || cliente.pessoaFisica?.endereco?.cidade || "";

    setFormData((prev) => ({
      ...(tipoMudou ? {
        ...prev,
        valorServicos: "",
        discriminacaoServico: "",
        valorDeducoes: getInitialState().valorDeducoes,
        valorInss: getInitialState().valorInss,
        valorPis: getInitialState().valorPis,
        valorCofins: getInitialState().valorCofins,
        valorCsll: getInitialState().valorCsll,
        valorIr: getInitialState().valorIr,
      } : prev),
      codigoMunicipio: prestador.codigoMunicipio,
      cnpjPrestador: prestador.cnpj,
      inscricaoMunicipalPrestador: prestador.inscricaoMunicipal,
      regimeApuracaoTributaria: prestador.regimeApuracaoTributaria,
      razaoSocialPrestador: prestador.razaoSocial,
      prestadorLogradouro: prestador.logradouro,
      prestadorNumero: prestador.numero,
      prestadorComplemento: prestador.complemento,
      prestadorBairro: prestador.bairro,
      prestadorUf: prestador.uf,
      prestadorCep: prestador.cep,
      prestadorEmail: prestador.email,
      prestadorTelefone: prestador.telefone,
      codigoServico: prestador.codigoServico || "",
      codigoNBS: prestador.codigoNBS || prev.codigoNBS || "",
      codigoTributacaoMunicipio: prestador.codigoTributacaoMunicipio || prev.codigoTributacaoMunicipio,
      descricaoServico: prestador.descricaoServico || prev.descricaoServico,
      issRetido: prestador.issRetido || prev.issRetido,
      aliquotaIss: prestador.aliquotaIss || prev.aliquotaIss,
      cpfCnpjTomador: docDigits ? formatCpfCnpj(docDigits) : "",
      razaoSocialTomador: nome || "",
      tomadorMunicipio: tomadorCidade,
      tomadorLogradouro:
        cliente.pessoaJuridica?.endereco?.logradouro || cliente.pessoaFisica?.endereco?.logradouro || "",
      tomadorNumero:
        cliente.pessoaJuridica?.endereco?.numero || cliente.pessoaFisica?.endereco?.numero || "",
      tomadorComplemento:
        cliente.pessoaJuridica?.endereco?.complemento || cliente.pessoaFisica?.endereco?.complemento || "",
      tomadorBairro:
        cliente.pessoaJuridica?.endereco?.bairro || cliente.pessoaFisica?.endereco?.bairro || "",
      tomadorUf: clienteUF,
      tomadorCep: tomadorCep,
      tomadorEmail: tomadorEmail,
      tomadorTelefone: tomadorTelefone,
      tomadorCodigoMunicipio: prev.tomadorCodigoMunicipio,
      // Atualiza datas automaticamente ao selecionar cliente
      dataEmissao: getBrasiliaTimeStr(),
      dataCompetencia: getBrasiliaTimeStr(),
    }));

    try {
      if (tomadorCep.length === 8) await lookupCep(tomadorCep, "tomador");
    } catch {
      // ignora erro ViaCEP
    }

    toast.success(`${nome} selecionado — emitindo pela filial ${prestadorUF}.`, { duration: 4000 });
  };

  const clearSelectedCliente = () => {
    setSelectedCliente(null);
    const initial = getInitialState();
    setFormData((prev) => ({
      ...prev,
      cpfCnpjTomador: "",
      razaoSocialTomador: "",
      tomadorLogradouro: "",
      tomadorNumero: "",
      tomadorComplemento: "",
      tomadorBairro: "",
      tomadorUf: initial.tomadorUf,
      tomadorCep: "",
      tomadorEmail: "",
      tomadorTelefone: "",
      tomadorMunicipio: "",
      tomadorCodigoMunicipio: initial.tomadorCodigoMunicipio,
      valorPis: initial.valorPis,
      valorCofins: initial.valorCofins,
      valorCsll: initial.valorCsll,
      valorIr: initial.valorIr,
    }));
    setDiscriminacaoEditada(false);
    setBoletosSelecionados(new Set());
    clearBoletos();
  };

  const openClientePicker = () => {
    setClientePickerSearch("");
    setClientePickerPage(1);
    setShowClientePicker(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    if (name === "discriminacaoServico") {
      setDiscriminacaoEditada(true);
    }
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked ? "1" : "2",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCNPJChange = (fieldName: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = fieldName === "cnpjPrestador" ? formatCNPJ(raw) : formatCpfCnpj(raw);
    setFormData((prev) => ({ ...prev, [fieldName]: formatted }));
  };

  const handlePrestadorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prestadorId = e.target.value;
    if (!prestadorId) return;
    const prestador = getPrestadorById(prestadorId);
    if (!prestador) return;
    setFormData((prev) => ({
      ...prev,
      codigoMunicipio: prestador.codigoMunicipio,
      cnpjPrestador: prestador.cnpj,
      inscricaoMunicipalPrestador: prestador.inscricaoMunicipal,
      regimeApuracaoTributaria: prestador.regimeApuracaoTributaria,
      razaoSocialPrestador: prestador.razaoSocial,
      prestadorLogradouro: prestador.logradouro,
      prestadorNumero: prestador.numero,
      prestadorComplemento: prestador.complemento,
      prestadorBairro: prestador.bairro,
      prestadorUf: prestador.uf,
      prestadorCep: prestador.cep,
      prestadorEmail: prestador.email,
      prestadorTelefone: prestador.telefone,
      codigoServico: prestador.codigoServico || "",
      codigoNBS: prestador.codigoNBS || prev.codigoNBS || "",
      codigoTributacaoMunicipio: prestador.codigoTributacaoMunicipio || "",
      descricaoServico: prestador.descricaoServico || "",
      issRetido: prestador.issRetido || prev.issRetido,
      aliquotaIss: prestador.aliquotaIss || prev.aliquotaIss,
    }));
  };

  const handleCepBlur = (prefix: "prestador" | "tomador") => () => {
    const cepField = prefix === "prestador" ? "prestadorCep" : "tomadorCep";
    lookupCep(formData[cepField], prefix);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResponse(null);
    setCanDownload(false);
    setResponse({ success: true, message: "Aguarde enquanto processamos os dados..." });

    try {
      const res = await fetch("/api/nfse/emitir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (res.ok) {
        await queryClient.invalidateQueries({
          queryKey: NFSE_HISTORICO_QUERY_KEY(),
        });
        const codigo = json.codigo || json.status || 200;
        setResponse({ success: true, data: json, message: getMensagemPorCodigo(codigo, true) });
        setTimeout(() => setCanDownload(true), 2000);
      } else {
        const details = json.details || {};
        let rawError = "Ocorreu um erro ao processar sua solicitação.";
        if (details.erros?.length > 0) rawError = details.erros.join("\n");
        else if (details.mensagem) rawError = details.mensagem;
        else if (json.error) rawError = json.error;
        else rawError = getMensagemPorCodigo(json.codigo || json.status || res.status, false);

        setResponse({ success: false, error: formatarErroAmigavel(rawError), data: json });
      }
    } catch {
      setResponse({ success: false, error: "Erro de conexão com o servidor. A API pode estar desligada." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    setDownloadError(null);
    const emissaoData = (response?.data as Record<string, unknown>)?.data ?? response?.data ?? {};
    const notaFiscal = (emissaoData as Record<string, unknown>)?.notaFiscal ?? emissaoData;
    const chaveAcesso =
      (notaFiscal as Record<string, unknown>)?.chaveAcesso ??
      (notaFiscal as Record<string, unknown>)?.ChaveAcesso ??
      (emissaoData as Record<string, unknown>)?.chaveAcesso ??
      (emissaoData as Record<string, unknown>)?.ChaveAcesso ?? "";

    if (!chaveAcesso) {
      setDownloadError("Chave de acesso não encontrada na resposta de emissão.");
      setDownloadingPdf(false);
      return;
    }

    try {
      const res = await fetch("/api/nfse/danfse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chaveAcesso, cnpj: formData.cnpjPrestador }),
      });
      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/pdf") || contentType.includes("application/octet-stream")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `DANFSe_${chaveAcesso}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }
      const json = await res.json();
      setDownloadError(json.error || "Erro ao baixar o DANFSe.");
    } catch (err: unknown) {
      setDownloadError(err instanceof Error ? err.message : "Erro de conexão ao baixar o DANFSe.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Contador de caracteres combinado (corrigido)
  const totalCharsComplementares =
    (formData.outrasInformacoes || "").length + (formData.informacoesFisco || "").length;

  // Nome amigável do município atual
  const municipioNome = MUNICIPIO_NOMES[formData.codigoMunicipio] ?? `Cód. ${formData.codigoMunicipio}`;

  return (
    <PermissionWrapper modulo="Cliente" acao="Incluir">
      <MainLayout>
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent flex items-center gap-3">
                <FileCheck className="w-8 h-8 text-amber-500" />
                Emissão de NFS-e
              </h1>
              <p className="text-neutral-400 mt-1">
                Nota Fiscal de Serviços Eletrônica — integração com API Nacional
              </p>
            </div>
          </div>

          {/* Info Banner */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
          >
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-amber-400">
              A emissão da NFS-e será processada pela API Nacional de NFS-e.
              Certifique-se de que todos os dados estão corretos antes de enviar.
              A nota emitida não poderá ser cancelada sem o número do RPS gerado.
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ===== MUNICÍPIO DE INCIDÊNCIA E IBGE (Oculto) ===== */}
            <input type="hidden" name="codigoMunicipio" value={formData.codigoMunicipio} />

            {/* ===== DADOS DO PRESTADOR ===== */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm">
              <SectionTitle
                icon={<Building2 size={20} />}
                title="Dados do Prestador"
                subtitle="Selecione um prestador cadastrado ou preencha manualmente"
              />

              <div className="mb-6">
                <label className={labelClass} htmlFor="prestadorSelecionado">
                  Prestador Cadastrado
                </label>
                <select
                  id="prestadorSelecionado"
                  onChange={handlePrestadorSelect}
                  className={inputClass}
                  defaultValue=""
                >
                  <option value="">— Selecione um prestador ou preencha manualmente —</option>
                  {PRESTADORES_CADASTRADOS.map((p) => (
                    <option key={p.id} value={p.id} className="bg-neutral-900">
                      {p.label} ({p.cnpj})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass} htmlFor="dataEmissao">
                    Data e Hora de Geração (Emissão) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="dataEmissao"
                    name="dataEmissao"
                    type="datetime-local"
                    value={formData.dataEmissao}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="dataCompetencia">
                    Data de Competência <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="dataCompetencia"
                    name="dataCompetencia"
                    type="datetime-local"
                    value={formData.dataCompetencia}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="cnpjPrestador">
                    CNPJ do Prestador <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="cnpjPrestador"
                    name="cnpjPrestador"
                    type="text"
                    value={formData.cnpjPrestador}
                    onChange={handleCNPJChange("cnpjPrestador")}
                    placeholder="00.000.000/0000-00"
                    className={inputClass}
                    required
                    maxLength={18}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="inscricaoMunicipalPrestador">
                    Inscrição Municipal <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="inscricaoMunicipalPrestador"
                    name="inscricaoMunicipalPrestador"
                    type="text"
                    value={formData.inscricaoMunicipalPrestador}
                    onChange={handleChange}
                    placeholder="Ex: 12345678"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="razaoSocialPrestador">
                    Razão Social <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="razaoSocialPrestador"
                    name="razaoSocialPrestador"
                    type="text"
                    value={formData.razaoSocialPrestador}
                    onChange={handleChange}
                    placeholder="Nome da empresa prestadora"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="regimeApuracaoTributaria">
                    Regime de Apuração Tributária
                  </label>
                  <select
                    id="regimeApuracaoTributaria"
                    name="regimeApuracaoTributaria"
                    value={formData.regimeApuracaoTributaria}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="1">1 — Simples Nacional</option>
                    <option value="2">2 — Simples Nacional - Excesso</option>
                    <option value="3">3 — Regime Normal - Lucro Presumido</option>
                    <option value="4">4 — Regime Normal - Lucro Real</option>
                    <option value="5">5 — ME/EPP</option>
                    <option value="6">6 — Outro</option>
                  </select>
                </div>
              </div>

              <SubSectionTitle icon={<MapPin size={18} />} title="Endereço do Prestador" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="prestadorLogradouro">Logradouro</label>
                  <input id="prestadorLogradouro" name="prestadorLogradouro" type="text"
                    value={formData.prestadorLogradouro} onChange={handleChange}
                    placeholder="Rua, Avenida, etc." className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="prestadorNumero">Número</label>
                  <input id="prestadorNumero" name="prestadorNumero" type="text"
                    value={formData.prestadorNumero} onChange={handleChange}
                    placeholder="Nº" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="prestadorComplemento">Complemento</label>
                  <input id="prestadorComplemento" name="prestadorComplemento" type="text"
                    value={formData.prestadorComplemento} onChange={handleChange}
                    placeholder="Sala, Andar..." className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="prestadorBairro">Bairro</label>
                  <input id="prestadorBairro" name="prestadorBairro" type="text"
                    value={formData.prestadorBairro} onChange={handleChange}
                    placeholder="Bairro" className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass} htmlFor="prestadorUf">UF</label>
                    <select id="prestadorUf" name="prestadorUf" value={formData.prestadorUf}
                      onChange={handleChange} className={inputClass}>
                      {UF_OPTIONS.map((uf) => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="prestadorCep">CEP</label>
                    <input id="prestadorCep" name="prestadorCep" type="text"
                      value={formData.prestadorCep} onChange={handleChange}
                      onBlur={handleCepBlur("prestador")} placeholder="00000000"
                      className={inputClass} maxLength={8} />
                  </div>
                </div>
              </div>

              <SubSectionTitle icon={<Phone size={18} />} title="Contato do Prestador" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass} htmlFor="prestadorEmail">
                    E-mail <span className="text-red-500">*</span>
                  </label>
                  <input id="prestadorEmail" name="prestadorEmail" type="email"
                    value={formData.prestadorEmail} onChange={handleChange}
                    required placeholder="email@empresa.com" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="prestadorTelefone">Telefone</label>
                  <input id="prestadorTelefone" name="prestadorTelefone" type="text"
                    value={formData.prestadorTelefone} onChange={handleChange}
                    placeholder="1133334444" className={inputClass} maxLength={11} />
                </div>
              </div>
            </div>

            {/* ===== DADOS DO TOMADOR ===== */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <SectionTitle
                  icon={<UsersIcon size={20} />}
                  title="Dados do Tomador"
                  subtitle="Selecione o cliente contratante"
                />
                {!selectedCliente && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={openClientePicker}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-neutral-950 rounded-lg text-sm font-bold shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-600"
                  >
                    <SearchIcon size={16} />
                    Selecionar Cliente
                  </motion.button>
                )}
              </div>

              {selectedCliente ? (
                (() => {
                  const sel = getClienteDisplay(selectedCliente);
                  return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative p-4 bg-neutral-800/40 border border-amber-500/20 rounded-xl flex flex-col md:flex-row items-start md:items-center gap-4 group mb-6"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <span className="text-lg font-bold text-neutral-950">
                      {(sel.nome || "C").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-neutral-100 truncate">
                        {sel.nome || "—"}
                      </h4>
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider",
                        sel.tipo === "juridica"
                          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                      )}>
                        {sel.tipo === "juridica" ? "PJ" : "PF"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                        <Hash size={12} className="text-amber-500" />
                        <span>{sel.doc ? formatCpfCnpj(sel.doc.replace(/\D/g, "")) : "—"}</span>
                      </div>
                      {sel.email && (
                        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                          <Mail size={12} className="text-amber-500" />
                          <span className="truncate max-w-[200px]">{sel.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button type="button" onClick={openClientePicker}
                      className="p-2 text-neutral-400 hover:text-amber-500 hover:bg-neutral-700/50 rounded-lg transition-all" title="Trocar cliente">
                      <RefreshCw size={18} />
                    </button>
                    <button type="button" onClick={clearSelectedCliente}
                      className="p-2 text-neutral-400 hover:text-red-500 hover:bg-neutral-700/50 rounded-lg transition-all" title="Remover cliente">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
                  );
                })()
              ) : (
                <div
                  onClick={openClientePicker}
                  className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-neutral-800 rounded-xl hover:bg-neutral-800/20 hover:border-amber-500/30 cursor-pointer transition-all group mb-6"
                >
                  <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UsersIcon size={24} className="text-neutral-500 group-hover:text-amber-500" />
                  </div>
                  <p className="text-neutral-400 font-medium">Nenhum cliente selecionado</p>
                  <p className="text-xs text-neutral-500 mt-1">Clique para buscar na sua base de clientes</p>
                </div>
              )}

              {/* Dados do tomador — travados quando cliente selecionado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>CPF / CNPJ</label>
                  <input
                    name="cpfCnpjTomador"
                    type="text"
                    value={formData.cpfCnpjTomador}
                    onChange={selectedCliente ? undefined : handleCNPJChange("cpfCnpjTomador")}
                    readOnly={!!selectedCliente}
                    placeholder="000.000.000-00"
                    className={selectedCliente ? inputReadonlyClass : inputClass}
                  />
                  {selectedCliente && <LockedFieldNote />}
                </div>
                <div>
                  <label className={labelClass}>Razão Social / Nome</label>
                  <input
                    name="razaoSocialTomador"
                    type="text"
                    value={formData.razaoSocialTomador}
                    onChange={selectedCliente ? undefined : handleChange}
                    readOnly={!!selectedCliente}
                    placeholder="Nome do tomador"
                    className={selectedCliente ? inputReadonlyClass : inputClass}
                  />
                  {selectedCliente && <LockedFieldNote />}
                </div>
              </div>

              <SubSectionTitle icon={<MapPin size={18} />} title="Endereço do Tomador" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Logradouro</label>
                  <input name="tomadorLogradouro" type="text"
                    value={formData.tomadorLogradouro}
                    onChange={selectedCliente ? undefined : handleChange}
                    readOnly={!!selectedCliente}
                    placeholder="Rua, Avenida, etc."
                    className={selectedCliente ? inputReadonlyClass : inputClass} />
                  {selectedCliente && <LockedFieldNote />}
                </div>
                <div>
                  <label className={labelClass}>Número</label>
                  <input name="tomadorNumero" type="text"
                    value={formData.tomadorNumero}
                    onChange={selectedCliente ? undefined : handleChange}
                    readOnly={!!selectedCliente}
                    placeholder="Nº"
                    className={selectedCliente ? inputReadonlyClass : inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Complemento</label>
                  <input name="tomadorComplemento" type="text"
                    value={formData.tomadorComplemento}
                    onChange={selectedCliente ? undefined : handleChange}
                    readOnly={!!selectedCliente}
                    placeholder="Sala, Andar..."
                    className={selectedCliente ? inputReadonlyClass : inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Bairro</label>
                  <input name="tomadorBairro" type="text"
                    value={formData.tomadorBairro}
                    onChange={selectedCliente ? undefined : handleChange}
                    readOnly={!!selectedCliente}
                    placeholder="Bairro"
                    className={selectedCliente ? inputReadonlyClass : inputClass} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>UF</label>
                    {selectedCliente ? (
                      <>
                        <input type="text" value={formData.tomadorUf} readOnly
                          className={inputReadonlyClass} />
                        <LockedFieldNote />
                      </>
                    ) : (
                      <select name="tomadorUf" value={formData.tomadorUf}
                        onChange={handleChange} className={inputClass}>
                        <option value="">—</option>
                        {UF_OPTIONS.map((uf) => (
                          <option key={`t-${uf}`} value={uf}>{uf}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>CEP</label>
                    <input name="tomadorCep" type="text"
                      value={formData.tomadorCep}
                      onChange={selectedCliente ? undefined : handleChange}
                      onBlur={selectedCliente ? undefined : handleCepBlur("tomador")}
                      readOnly={!!selectedCliente}
                      placeholder="00000000"
                      className={selectedCliente ? inputReadonlyClass : inputClass}
                      maxLength={9} />
                  </div>
                  <div>
                    <label className={labelClass}>Cód. IBGE</label>
                    <input name="tomadorCodigoMunicipio" type="text"
                      value={formData.tomadorCodigoMunicipio}
                      onChange={selectedCliente ? undefined : handleChange}
                      readOnly={!!selectedCliente}
                      placeholder="0000000"
                      className={selectedCliente ? inputReadonlyClass : inputClass}
                      maxLength={7} />
                  </div>
                </div>
              </div>

              <SubSectionTitle icon={<Phone size={18} />} title="Contato do Tomador" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>
                    E-mail <span className="text-red-500">*</span>
                  </label>
                  <input name="tomadorEmail" type="email"
                    value={formData.tomadorEmail}
                    onChange={selectedCliente ? undefined : handleChange}
                    readOnly={!!selectedCliente}
                    required placeholder="cliente@email.com"
                    className={selectedCliente ? inputReadonlyClass : inputClass} />
                  {selectedCliente && <LockedFieldNote />}
                </div>
                <div>
                  <label className={labelClass}>
                    Telefone <span className="text-red-500">*</span>
                  </label>
                  <input name="tomadorTelefone" type="text"
                    value={formData.tomadorTelefone}
                    onChange={selectedCliente ? undefined : handleChange}
                    readOnly={!!selectedCliente}
                    required placeholder="1199998888"
                    className={selectedCliente ? inputReadonlyClass : inputClass}
                    maxLength={11} />
                  {selectedCliente && <LockedFieldNote />}
                </div>
              </div>
            </div>

            {/* ===== DADOS DO SERVIÇO ===== */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm">
              <SectionTitle
                icon={<FileText size={20} />}
                title="Dados do Serviço"
                subtitle="Descrição, valores e tributos do serviço prestado"
              />
              <div className="space-y-6">
                <div>
                  <label className={labelClass} htmlFor="descricaoServico">
                    Tipo de Serviço <span className="text-red-500">*</span>
                  </label>
                  <input id="descricaoServico" name="descricaoServico" type="text"
                    value={formData.descricaoServico} onChange={handleChange}
                    placeholder="Ex: Desenvolvimento de sistemas"
                    className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass} htmlFor="discriminacaoServico">
                    Descrição do Serviço <span className="text-red-500">*</span>
                    {formData.discriminacaoServico.startsWith("Prestação de serviços advocatícios") && (
                      <span className="ml-2 text-[10px] text-emerald-500 border border-emerald-500/30 px-1.5 py-0.5 rounded animate-pulse">
                        Preenchido pelo boleto
                      </span>
                    )}
                  </label>
                  <textarea id="discriminacaoServico" name="discriminacaoServico"
                    value={formData.discriminacaoServico} onChange={handleChange}
                    placeholder="Descreva detalhadamente o serviço prestado..."
                    className={`${inputClass} resize-none`} rows={3} required />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                  <div>
                    <label className={labelClass} htmlFor="codigoServico">
                      Código do Serviço (LC116) <span className="text-red-500">*</span>
                    </label>
                    <input id="codigoServico" name="codigoServico" type="text"
                      value={formData.codigoServico} onChange={handleChange}
                      placeholder="Ex: 041703" className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="codigoNBS">Código NBS</label>
                    <input id="codigoNBS" name="codigoNBS" type="text"
                      value={formData.codigoNBS} onChange={handleChange}
                      placeholder="Ex: 123456789" className={inputClass}
                      maxLength={9} minLength={9} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="codigoTributacaoMunicipio">
                      Cód. Tributação Município
                    </label>
                    <input id="codigoTributacaoMunicipio" name="codigoTributacaoMunicipio" type="text"
                      value={formData.codigoTributacaoMunicipio} onChange={handleChange}
                      placeholder="Ex: 001" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="issRetido">ISS Retido</label>
                    <select id="issRetido" name="issRetido"
                      value={formData.issRetido} onChange={handleChange} className={inputClass}>
                      <option value="1">1 — Sim</option>
                      <option value="2">2 — Não</option>
                    </select>
                  </div>
                </div>

                <SubSectionTitle icon={<DollarSign size={18} />} title="Valores" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {/* Valor Serviços — com boletos */}
                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="valorServicos">
                      Valor Serviços (R$) <span className="text-red-500">*</span>
                    </label>

                    {/* Lista scrollável de boletos pagos */}
                    {selectedCliente && (
                      <div className="mb-3">
                        {loadingBoletos ? (
                          <p className="text-xs text-amber-500 mb-1.5 flex items-center gap-1.5">
                            <Loader2 size={12} className="animate-spin" />
                            Buscando boletos pagos do cliente...
                          </p>
                        ) : hasSearched && boletosPagos.length === 0 ? (
                          <p className="text-xs text-neutral-500 mb-1.5 flex items-center gap-1.5">
                            <AlertCircle size={12} />
                            Nenhum boleto pago encontrado para este cliente.
                          </p>
                        ) : boletosPagos.length > 0 ? (
                          <>
                            {/* Header da lista de boletos */}
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-neutral-500 flex items-center gap-1">
                                <CheckCircle2 size={11} className="text-emerald-500" />
                                {boletosPagos.length} boleto{boletosPagos.length > 1 ? "s" : ""} pago{boletosPagos.length > 1 ? "s" : ""}
                                {boletosSelecionados.size > 0 && (
                                  <span className="ml-1 text-emerald-400 font-semibold">
                                    · {boletosSelecionados.size} selecionado{boletosSelecionados.size > 1 ? "s" : ""}
                                  </span>
                                )}
                              </p>
                              {boletosPagos.length > 1 && (
                                <button
                                  type="button"
                                  onClick={handleToggleTodosBoletos}
                                  className="text-[10px] font-semibold text-amber-500 hover:text-amber-400 border border-amber-500/30 hover:border-amber-400/50 px-2 py-0.5 rounded transition-all"
                                >
                                  {boletosPagos.every((b) => boletosSelecionados.has(b.id))
                                    ? "Desmarcar todos"
                                    : "Selecionar todos"}
                                </button>
                              )}
                            </div>

                            {/* Resumo do total quando múltiplos selecionados */}
                            {boletosSelecionados.size > 1 && (() => {
                              const total = boletosPagos
                                .filter((b) => boletosSelecionados.has(b.id))
                                .reduce((acc, b) => acc + (b.paidValue || b.nominalValue || 0), 0);
                              return (
                                <div className="mb-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-between">
                                  <span className="text-xs text-amber-400 font-medium font-mono uppercase tracking-tighter">Total Selecionado:</span>
                                  <span className="text-sm font-bold text-amber-400">
                                    R$ {total.toFixed(2).replace(".", ",")}
                                  </span>
                                </div>
                              );
                            })()}

                            <div className="max-h-[165px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
                              {boletosPagos.map((b) => {
                                const val = b.paidValue || b.nominalValue;
                                const formatted = val.toFixed(2).replace(".", ",");
                                const isSelected = boletosSelecionados.has(b.id);
                                const description = (b as any).description as string | undefined;
                                
                                return (
                                  <button
                                    key={b.id}
                                    type="button"
                                    onClick={() => handleToggleBoleto(b)}
                                    className={cn(
                                      "w-full text-left px-3 py-2 rounded-lg border transition-all text-xs",
                                      isSelected
                                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200"
                                        : "bg-neutral-800/30 border-neutral-700/50 text-neutral-300 hover:bg-emerald-950/20 hover:border-emerald-800/60",
                                    )}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        {/* Checkbox visual */}
                                        <div className={cn(
                                          "w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-all",
                                          isSelected
                                            ? "bg-emerald-500 border-emerald-500"
                                            : "border-neutral-600 bg-neutral-800",
                                        )}>
                                          {isSelected && (
                                            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                                              <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                          )}
                                        </div>
                                        <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/30">
                                          PAGO
                                        </span>
                                        <span className="font-mono text-neutral-300">
                                          Boleto #{b.id}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-neutral-500">
                                          Venc: {new Date(b.dueDate).toLocaleDateString("pt-BR")}
                                        </span>
                                        <span className={cn(
                                          "font-bold",
                                          isSelected ? "text-emerald-400" : "text-neutral-400",
                                        )}>
                                          R$ {formatted}
                                        </span>
                                      </div>
                                    </div>
                                    {description && (
                                      <p className="text-[10px] text-neutral-500 mt-0.5 truncate pl-5">
                                        {description}
                                      </p>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                            {boletosPagos.length > 3 && (
                              <p className="text-[10px] text-neutral-600 mt-1.5 text-center">
                                Role para ver mais boletos
                              </p>
                            )}
                          </>
                        ) : null}
                      </div>
                    )}

                    <input
                      id="valorServicos"
                      name="valorServicos"
                      type="text"
                      value={formData.valorServicos}
                      onChange={handleChange}
                      placeholder="100,00"
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="aliquotaIss">Alíquota ISS</label>
                    <input id="aliquotaIss" name="aliquotaIss" type="text"
                      value={formData.aliquotaIss} onChange={handleChange}
                      placeholder="0,00" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="valorDeducoes">Deduções (R$)</label>
                    <input id="valorDeducoes" name="valorDeducoes" type="text"
                      value={formData.valorDeducoes} onChange={handleChange}
                      placeholder="0,00" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="valorPis">PIS (R$)</label>
                    <input id="valorPis" name="valorPis" type="text"
                      value={formData.valorPis} onChange={handleChange}
                      placeholder="0,00" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="valorCofins">COFINS (R$)</label>
                    <input id="valorCofins" name="valorCofins" type="text"
                      value={formData.valorCofins} onChange={handleChange}
                      placeholder="0,00" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="valorInss">INSS (R$)</label>
                    <input id="valorInss" name="valorInss" type="text"
                      value={formData.valorInss} onChange={handleChange}
                      placeholder="0,00" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="valorIr">IR (R$)</label>
                    <input id="valorIr" name="valorIr" type="text"
                      value={formData.valorIr} onChange={handleChange}
                      placeholder="0,00" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="valorCsll">CSLL (R$)</label>
                    <input id="valorCsll" name="valorCsll" type="text"
                      value={formData.valorCsll} onChange={handleChange}
                      placeholder="0,00" className={inputClass} />
                  </div>
                </div>
              </div>
            </div>

            {/* ===== INFORMAÇÕES COMPLEMENTARES ===== */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm">
              <SectionTitle
                icon={<FileText size={20} />}
                title="Informações Complementares"
                subtitle="Dados adicionais para a NFS-e"
              />
              <div className="space-y-6">
                <div>
                  <label className={labelClass} htmlFor="outrasInformacoes">
                    Outras Informações
                    <span className="text-neutral-500 text-xs ml-2">
                      ({totalCharsComplementares}/2000 caracteres totais)
                    </span>
                  </label>
                  <textarea
                    id="outrasInformacoes"
                    name="outrasInformacoes"
                    value={formData.outrasInformacoes}
                    onChange={handleChange}
                    maxLength={2000}
                    placeholder="Informações adicionais (opcional)"
                    className={cn(
                      `${inputClass} resize-none`,
                      validationErrors.outrasInformacoes ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "",
                    )}
                    rows={3}
                  />
                  {validationErrors.outrasInformacoes && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <XCircle size={12} />{validationErrors.outrasInformacoes}
                    </p>
                  )}
                  {totalCharsComplementares > 1990 && (
                    <p className="text-amber-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />Próximo do limite máximo de caracteres
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClass} htmlFor="informacoesFisco">
                    Informações ao Fisco
                  </label>
                  <textarea
                    id="informacoesFisco"
                    name="informacoesFisco"
                    value={formData.informacoesFisco}
                    onChange={handleChange}
                    maxLength={2000}
                    placeholder="Informações destinadas ao Fisco (opcional)"
                    className={cn(
                      `${inputClass} resize-none`,
                      validationErrors.informacoesFisco ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "",
                    )}
                    rows={3}
                  />
                  {validationErrors.informacoesFisco && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <XCircle size={12} />{validationErrors.informacoesFisco}
                    </p>
                  )}
                  {formData.informacoesFisco.length > 1990 && (
                    <p className="text-amber-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />Próximo do limite máximo de caracteres
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                className="px-6 py-2.5 text-sm font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-all"
                onClick={() => { setFormData(getInitialState()); setSelectedCliente(null); clearBoletos(); }}
              >
                Limpar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "px-8 py-2.5 flex items-center gap-2 text-sm font-bold text-neutral-950 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all",
                  isSubmitting && "opacity-75 cursor-not-allowed",
                )}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-neutral-950/30 border-t-neutral-950 rounded-full animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Emitir NFSe
                  </>
                )}
              </button>
            </div>

            {/* Response Banner */}
            <AnimatePresence>
              {response && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "rounded-xl border p-5",
                    isSubmitting
                      ? "bg-amber-500/10 border-amber-500/20"
                      : response.success
                      ? canDownload
                        ? "bg-emerald-500/10 border-emerald-500/20"
                        : "bg-amber-500/10 border-amber-500/20"
                      : "bg-red-500/10 border-red-500/20",
                  )}
                >
                  <div className="flex items-start gap-4">
                    {isSubmitting ? (
                      <Loader2 className="text-amber-500 mt-1 shrink-0 animate-spin" size={22} />
                    ) : response.success ? (
                      <CheckCircle2
                        className={cn(canDownload ? "text-emerald-500" : "text-amber-500", "mt-1 shrink-0")}
                        size={22}
                      />
                    ) : (
                      <XCircle className="text-red-500 mt-1 shrink-0" size={22} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-semibold text-sm",
                        isSubmitting ? "text-amber-400"
                          : response.success ? canDownload ? "text-emerald-400" : "text-amber-400"
                          : "text-red-400",
                      )}>
                        {isSubmitting ? "Gerando / Processando" : response.success ? "NFS-e Gerada" : "Falha"}
                      </p>
                      <p className={cn(
                        "text-xs mt-1",
                        isSubmitting ? "text-amber-500"
                          : response.success ? canDownload ? "text-emerald-500" : "text-amber-500"
                          : "text-red-500",
                      )}>
                        {response.success && !isSubmitting && !canDownload
                          ? "Emitindo o PDF DANFSe da Nota..."
                          : response.message || response.error}
                      </p>
                      {response.success && canDownload && !isSubmitting && (
                        <div className="mt-4 flex gap-3">
                          <button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={downloadingPdf}
                            className="flex items-center gap-2 py-2 px-4 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-semibold rounded-lg transition-colors border border-emerald-500/30 disabled:opacity-50"
                          >
                            {downloadingPdf ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Download size={14} />
                            )}
                            {downloadingPdf ? "Baixando PDF..." : "Baixar DANFSe (PDF)"}
                          </button>
                        </div>
                      )}
                      {downloadError && (
                        <div className="mt-3 flex items-center gap-2 text-red-400 text-xs bg-red-950/50 p-2 rounded border border-red-900/50">
                          <AlertCircle size={14} />
                          <span>{downloadError}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* ===== MODAL CLIENTE PICKER ===== */}
        <AnimatePresence>
          {showClientePicker && (
            <>
              <motion.div
                key="tomador-picker-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999]"
                onClick={() => setShowClientePicker(false)}
              />
              <motion.div
                key="tomador-picker-modal"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 flex items-center justify-center z-[99999] p-4"
              >
                <div className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-800 w-full max-w-6xl max-h-[90vh] overflow-hidden">
                  <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-lg shadow-amber-500/20">
                        <UsersIcon className="w-5 h-5 text-neutral-950" />
                      </div>
                      <h2 className="text-xl font-bold text-neutral-100">Selecionar Cliente</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowClientePicker(false)}
                      className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-4 border-b border-neutral-800">
                    <div className="relative max-w-md">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                      <input
                        type="text"
                        value={clientePickerSearch}
                        onChange={(e) => { setClientePickerSearch(e.target.value); setClientePickerPage(1); }}
                        placeholder="Buscar por nome, email, CPF/CNPJ ou telefone..."
                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between gap-3">
                    <div className="text-xs text-neutral-400">
                      Exibindo {filteredClientes.length === 0 ? 0 : (currentClientePage - 1) * clientePickerPageSize + 1}–
                      {Math.min(currentClientePage * clientePickerPageSize, filteredClientes.length)} de {filteredClientes.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button"
                        onClick={() => setClientePickerPage((p) => Math.max(1, p - 1))}
                        disabled={currentClientePage <= 1}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-800 bg-neutral-800/40 text-neutral-300 hover:bg-neutral-800/70 disabled:opacity-50 disabled:cursor-not-allowed">
                        Anterior
                      </button>
                      <span className="text-xs text-neutral-400 min-w-[88px] text-center">
                        Página {currentClientePage} / {totalClientePages}
                      </span>
                      <button type="button"
                        onClick={() => setClientePickerPage((p) => Math.min(totalClientePages, p + 1))}
                        disabled={currentClientePage >= totalClientePages}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-800 bg-neutral-800/40 text-neutral-300 hover:bg-neutral-800/70 disabled:opacity-50 disabled:cursor-not-allowed">
                        Próxima
                      </button>
                    </div>
                  </div>

                  <div className="p-4 overflow-auto max-h-[calc(90vh-220px)]">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-amber-500 border-b border-neutral-800">
                          <th className="py-3 pr-4 font-medium text-xs uppercase tracking-wider">Nome/Razão Social</th>
                          <th className="py-3 pr-4 font-medium text-xs uppercase tracking-wider">Tipo</th>
                          <th className="py-3 pr-4 font-medium text-xs uppercase tracking-wider">UF</th>
                          <th className="py-3 pr-4 font-medium text-xs uppercase tracking-wider">CPF/CNPJ</th>
                          <th className="py-3 pr-4 font-medium text-xs uppercase tracking-wider">Email</th>
                          <th className="py-3 pr-4 font-medium text-xs uppercase tracking-wider">Telefones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedClientes.map((c) => {
                          const d = getClienteDisplay(c);
                          return (
                            <tr
                              key={c.id}
                              onDoubleClick={() => {
                                handleSelectCliente(c).catch((err) => {
                                  console.error(err);
                                  toast.error("Erro ao selecionar cliente. Tente novamente.");
                                });
                              }}
                              className="border-b border-neutral-800 hover:bg-neutral-800/50 cursor-pointer transition-colors group"
                            >
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-2">
                                  {d.tipo === "fisica" ? (
                                    <FileText className="w-4 h-4 text-amber-500" />
                                  ) : (
                                    <Building2 className="w-4 h-4 text-amber-500" />
                                  )}
                                  <span className="font-medium text-neutral-50 group-hover:text-amber-400 transition-colors">
                                    {d.nome || "—"}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 pr-4 text-neutral-300">
                                {d.tipo === "fisica" ? "Física" : "Jurídica"}
                              </td>
                              <td className="py-3 pr-4">
                                <span className={cn(
                                  "text-[11px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider",
                                  d.uf === "RJ" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : d.uf === "SP" ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    : d.uf ? "bg-neutral-700/50 text-neutral-300 border-neutral-600"
                                    : "bg-red-500/10 text-red-400 border-red-500/20",
                                )}>
                                  {d.uf || "S/UF"}
                                </span>
                              </td>
                              <td className="py-3 pr-4 text-neutral-300">{d.doc || "—"}</td>
                              <td className="py-3 pr-4 text-neutral-300">{d.email || "—"}</td>
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-2 text-neutral-400">
                                  <Phone className="w-4 h-4" />
                                  <span>{d.tels || "—"}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {paginatedClientes.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-12 text-center">
                              <UsersIcon className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                              <p className="text-neutral-400 font-medium">Nenhum cliente encontrado</p>
                              <p className="text-neutral-500 text-xs mt-1">Tente ajustar sua busca</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </MainLayout>
    </PermissionWrapper>
  );
}
