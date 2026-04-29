"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { apiClient } from "@/lib/api";
import {
  Percent,
  Search,
  Filter,
  Download,
  Users,
  Sparkles,
  UserCheck,
  Handshake,
  Briefcase,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowUpDown,
  Eye,
  Calendar,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  boletoPagoParaComissao,
  valorEfetivoPagoBoleto,
  parseFoiPagoApiValue,
  parsePaidValueApi,
  type Boleto,
} from "@/types/boleto";

// Tipos
interface Pessoa {
  id: number;
  idOriginal: number; // ID real no banco
  nome: string;
  slug: string; // Nome formatado para URL
  tipo: "consultor" | "parceiro" | "gestor";
  email?: string;
  telefone?: string;
  oab?: string;
  filial?: string;
  ativo: boolean;
  quantidadeContratos: number;
  contratosPagos: number;
  valorTotalPago: number;
  totalComissao: number;
  percentualComissao: number;
}

// Função para gerar slug a partir do nome
const gerarSlug = (nome: string): string => {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9\s-]/g, "") // Remove caracteres especiais
    .trim()
    .replace(/\s+/g, "-"); // Substitui espaços por hífens
};

// Função para garantir slugs únicos
const gerarSlugsUnicos = (
  pessoas: Array<{ nome: string; tipo: string; idOriginal: number }>
): Map<string, string> => {
  const slugMap = new Map<string, string>();
  const slugCount = new Map<string, number>();

  // Primeiro, conta quantas vezes cada slug base aparece por tipo
  pessoas.forEach((p) => {
    const slugBase = `${p.tipo}-${gerarSlug(p.nome)}`;
    slugCount.set(slugBase, (slugCount.get(slugBase) || 0) + 1);
  });

  // Agora, gera slugs únicos
  const slugUsado = new Map<string, number>();
  pessoas.forEach((p) => {
    const slugBase = `${p.tipo}-${gerarSlug(p.nome)}`;
    const key = `${p.tipo}-${p.idOriginal}`;

    if (slugCount.get(slugBase)! > 1) {
      // Há duplicatas, adicionar número
      const num = (slugUsado.get(slugBase) || 0) + 1;
      slugUsado.set(slugBase, num);
      slugMap.set(key, `${gerarSlug(p.nome)}-${num}`);
    } else {
      // Único, usar só o nome
      slugMap.set(key, gerarSlug(p.nome));
    }
  });

  return slugMap;
};

interface ContratoSimples {
  id: number;
  consultorId: number;
  parceiroId?: number;
  valorParcela: number; // Valor de cada parcela
  numeroParcelas: number; // Quantidade de parcelas
  comissaoParceiro: number; // Valor da comissão do parceiro definida no contrato
  situacao: string;
}

interface BoletoSimples {
  id: number;
  contratoId: number;
  nominalValue: number;
  paidValue?: number;
  status: string;
  /** undefined = API não enviou; não converter para false (quebrava o fallback por status). */
  foiPago?: boolean;
  dataPagamento?: string | null;
  paymentDate?: string | null;
  settlementDate?: string | null;
  entryDate?: string | null;
  dataAtualizacao?: string | null;
  dueDate?: string | null;
}

// Porcentagens de comissão fixas
const COMISSAO_CONSULTOR = 0.1; // 10%
const COMISSAO_GESTOR = 0.05; // 5%
// Parceiros: comissão vem do campo "comissao" de cada contrato (valor absoluto)

export default function ComissoesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<
    "todos" | "consultor" | "parceiro" | "gestor"
  >("todos");
  const [ordenacao, setOrdenacao] = useState<
    "alfabetica" | "comissao-desc" | "comissao-asc"
  >("alfabetica");
  const [filialFiltro, setFilialFiltro] = useState<string>("todas");
  /** Por padrão oculta quem está com comissão zerada; "todos" inclui zerados. */
  const [filtroComissao, setFiltroComissao] = useState<"com-valor" | "todos">(
    "com-valor"
  );
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatNumberForCsv = (value: number) =>
    Number(value || 0)
      .toFixed(2)
      .replace(".", ",");

  const escapeCsvValue = (value: string | number | null | undefined) => {
    const stringValue = String(value ?? "");
    if (
      stringValue.includes(";") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const escapeHtml = (value: string | number | null | undefined) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  // Buscar dados
  const fetchDados = async () => {
    setLoading(true);
    setError(null);

    try {
      const pessoasLista: Pessoa[] = [];
      let contratos: ContratoSimples[] = [];
      let boletos: BoletoSimples[] = [];

      // Buscar contratos - situação "Cliente" ou "Contrato Assinado"
      const contratosRes = await apiClient.get("/Contrato");
      if (contratosRes.data && Array.isArray(contratosRes.data)) {
        const situacoesComissao = ["cliente", "contrato assinado", "quitado"];
        contratos = contratosRes.data
          .filter((c: any) =>
            situacoesComissao.includes(c.situacao?.toLowerCase().trim() || "")
          )
          .map((c: any) => ({
            id: c.id,
            consultorId: c.consultorId,
            parceiroId: c.parceiroId,
            valorParcela: c.valorParcela || 0,
            numeroParcelas: c.numeroParcelas || 1,
            comissaoParceiro: c.comissao || 0,
            situacao: c.situacao || "",
          }));
      }

      // Buscar boletos para calcular parcelas liquidadas
      const boletosRes = await apiClient.get("/Boleto");
      if (boletosRes.data && Array.isArray(boletosRes.data)) {
        boletos = boletosRes.data.map((b: any) => ({
          id: b.id,
          contratoId: b.contratoId,
          nominalValue: b.nominalValue || 0,
          paidValue: parsePaidValueApi(b.paidValue),
          status: b.status || "",
          foiPago: parseFoiPagoApiValue(b.foiPago),
          dataPagamento: b.dataPagamento ?? null,
          paymentDate: b.paymentDate ?? null,
          settlementDate: b.settlementDate ?? null,
          entryDate: b.entryDate ?? null,
          dataAtualizacao: b.dataAtualizacao ?? null,
          dueDate: b.dueDate ?? null,
        }));
      }

      // Comissão: apenas boletos com foiPago === true (regra estrita; ver boletoPagoParaComissao)
      const isBoletoPago = (boleto: BoletoSimples): boolean =>
        boletoPagoParaComissao(boleto as unknown as Boleto);

      // Datas só de pagamento/liquidação (entryDate é cadastro/registro — não usar no período)
      const getDataPagamento = (boleto: BoletoSimples): string | null => {
        return (
          boleto.dataPagamento ||
          boleto.paymentDate ||
          boleto.settlementDate ||
          null
        );
      };

      // Normaliza para comparação de data sem timezone (YYYY-MM-DD)
      const toDateOnly = (value: string): string => {
        const [datePart] = value.split("T");
        return datePart;
      };

      // Função para verificar se o boleto está dentro do período selecionado
      const boletoNoPeriodo = (boleto: BoletoSimples): boolean => {
        if (!dataInicio && !dataFim) return true;

        const dataRef = getDataPagamento(boleto);
        if (!dataRef) return false;

        const dataPag = toDateOnly(dataRef);

        if (dataInicio) {
          if (dataPag < dataInicio) return false;
        }

        if (dataFim) {
          if (dataPag > dataFim) return false;
        }

        return true;
      };

      // Função para calcular valor liquidado por contrato (considerando período)
      const getValorLiquidadoPorContrato = (contratoId: number) => {
        return boletos
          .filter(
            (b) =>
              b.contratoId === contratoId &&
              isBoletoPago(b) &&
              boletoNoPeriodo(b)
          )
          .reduce(
            (sum, b) =>
              sum + valorEfetivoPagoBoleto(b as unknown as Boleto),
            0
          );
      };

      // Função para contar boletos liquidados por contrato (considerando período)
      const getBoletosLiquidadosPorContrato = (contratoId: number) => {
        return boletos.filter(
          (b) =>
            b.contratoId === contratoId &&
            isBoletoPago(b) &&
            boletoNoPeriodo(b)
        ).length;
      };

      // Função para calcular contratos e comissão por consultor (10% sobre parcelas liquidadas)
      const calcularDadosConsultor = (consultorId: number) => {
        const contratosDoConsultor = contratos.filter(
          (c) => c.consultorId === consultorId
        );
        // Soma dos valores de boletos liquidados de todos os contratos do consultor
        let valorTotalLiquidado = 0;
        let totalBoletosLiquidados = 0;
        contratosDoConsultor.forEach((c) => {
          valorTotalLiquidado += getValorLiquidadoPorContrato(c.id);
          totalBoletosLiquidados += getBoletosLiquidadosPorContrato(c.id);
        });
        return {
          quantidade: contratosDoConsultor.length,
          contratosPagos: totalBoletosLiquidados, // Agora é quantidade de boletos liquidados
          valorTotalPago: valorTotalLiquidado,
          comissao: valorTotalLiquidado * COMISSAO_CONSULTOR, // 10% sobre valor liquidado
        };
      };

      // Função para calcular contratos e comissão por parceiro
      const calcularDadosParceiro = (parceiroId: number) => {
        const contratosDoParceiro = contratos.filter(
          (c) => c.parceiroId === parceiroId
        );
        // Soma dos valores de boletos liquidados de todos os contratos do parceiro
        let valorTotalLiquidado = 0;
        let totalBoletosLiquidados = 0;
        contratosDoParceiro.forEach((c) => {
          valorTotalLiquidado += getValorLiquidadoPorContrato(c.id);
          totalBoletosLiquidados += getBoletosLiquidadosPorContrato(c.id);
        });
        // Comissão do parceiro: soma dos valores de comissão definidos em contratos que têm boletos liquidados
        const comissaoTotal = contratosDoParceiro
          .filter((c) => getBoletosLiquidadosPorContrato(c.id) > 0)
          .reduce((sum, c) => sum + c.comissaoParceiro, 0);
        return {
          quantidade: contratosDoParceiro.length,
          contratosPagos: totalBoletosLiquidados,
          valorTotalPago: valorTotalLiquidado,
          comissao: comissaoTotal,
        };
      };

      // Primeiro, buscar consultores para criar mapa de filial
      const consultoresRes = await apiClient.get("/Consultor");
      const consultoresData = consultoresRes.data || [];

      // Criar mapa de consultorId -> filialNome
      const consultorFilialMap = new Map<number, string>();
      if (Array.isArray(consultoresData)) {
        consultoresData.forEach((c: any) => {
          if (c.filial?.nome) {
            consultorFilialMap.set(c.id, c.filial.nome);
          }
        });
      }

      // Função para calcular comissão por gestor (5% do total liquidado da filial)
      const calcularDadosGestor = (filialNome: string | undefined) => {
        if (!filialNome)
          return {
            quantidade: 0,
            contratosPagos: 0,
            valorTotalPago: 0,
            comissao: 0,
          };

        // Buscar todos os consultores da mesma filial
        const consultoresDaFilial: number[] = [];
        consultorFilialMap.forEach((filial, consultorId) => {
          if (filial === filialNome) {
            consultoresDaFilial.push(consultorId);
          }
        });

        // Buscar todos os contratos dos consultores da filial
        const contratosDaFilial = contratos.filter((c) =>
          consultoresDaFilial.includes(c.consultorId)
        );

        // Calcular valor total liquidado da filial
        let valorTotalLiquidado = 0;
        let totalBoletosLiquidados = 0;
        contratosDaFilial.forEach((c) => {
          valorTotalLiquidado += getValorLiquidadoPorContrato(c.id);
          totalBoletosLiquidados += getBoletosLiquidadosPorContrato(c.id);
        });

        return {
          quantidade: contratosDaFilial.length,
          contratosPagos: totalBoletosLiquidados,
          valorTotalPago: valorTotalLiquidado,
          comissao: valorTotalLiquidado * COMISSAO_GESTOR, // 5% sobre total da filial
        };
      };

      // Coletar dados das pessoas para gerar slugs únicos
      const pessoasParaSlug: Array<{
        nome: string;
        tipo: string;
        idOriginal: number;
      }> = [];

      // Adicionar consultores (já buscados anteriormente)
      if (Array.isArray(consultoresData)) {
        consultoresData.forEach((c: any) => {
          pessoasParaSlug.push({
            nome: c.pessoaFisica?.nome || `Consultor #${c.id}`,
            tipo: "consultor",
            idOriginal: c.id,
          });
        });
      }

      // Buscar parceiros
      const parceirosRes = await apiClient.get("/Parceiro");
      const parceirosData = parceirosRes.data || [];
      if (Array.isArray(parceirosData)) {
        parceirosData.forEach((p: any) => {
          pessoasParaSlug.push({
            nome: p.pessoaFisica?.nome || `Parceiro #${p.id}`,
            tipo: "parceiro",
            idOriginal: p.id,
          });
        });
      }

      // Buscar gestores
      const usuariosRes = await apiClient.get("/Usuario");
      const usuariosData = usuariosRes.data || [];
      const gestoresData = Array.isArray(usuariosData)
        ? usuariosData.filter(
            (u: any) =>
              u.grupoAcesso?.nome?.toLowerCase().includes("gestor") ||
              u.grupoAcesso?.nome?.toLowerCase().includes("gerente")
          )
        : [];
      gestoresData.forEach((u: any) => {
        pessoasParaSlug.push({
          nome: u.nome || u.login || `Gestor #${u.id}`,
          tipo: "gestor",
          idOriginal: u.id,
        });
      });

      // Gerar slugs únicos
      const slugMap = gerarSlugsUnicos(pessoasParaSlug);

      // Agora criar a lista de pessoas com slugs
      if (Array.isArray(consultoresData)) {
        consultoresData.forEach((c: any) => {
          const dados = calcularDadosConsultor(c.id);
          const nome = c.pessoaFisica?.nome || `Consultor #${c.id}`;
          pessoasLista.push({
            id: c.id,
            idOriginal: c.id,
            nome,
            slug: slugMap.get(`consultor-${c.id}`) || gerarSlug(nome),
            tipo: "consultor",
            email:
              c.pessoaFisica?.emailEmpresarial || c.pessoaFisica?.emailPessoal,
            telefone: c.pessoaFisica?.telefone1,
            oab: c.oab,
            filial: c.filial?.nome,
            ativo: c.ativo ?? true,
            quantidadeContratos: dados.quantidade,
            contratosPagos: dados.contratosPagos,
            valorTotalPago: dados.valorTotalPago,
            totalComissao: dados.comissao,
            percentualComissao: COMISSAO_CONSULTOR * 100, // 10%
          });
        });
      }

      if (Array.isArray(parceirosData)) {
        parceirosData.forEach((p: any) => {
          const dados = calcularDadosParceiro(p.id);
          const nome = p.pessoaFisica?.nome || `Parceiro #${p.id}`;
          // Calcular percentual real baseado no valor pago e comissão
          const percentualReal =
            dados.valorTotalPago > 0
              ? (dados.comissao / dados.valorTotalPago) * 100
              : 0;
          pessoasLista.push({
            id: p.id + 10000, // Offset para evitar conflito de IDs
            idOriginal: p.id,
            nome,
            slug: slugMap.get(`parceiro-${p.id}`) || gerarSlug(nome),
            tipo: "parceiro",
            email:
              p.pessoaFisica?.emailEmpresarial || p.pessoaFisica?.emailPessoal,
            telefone: p.pessoaFisica?.telefone1,
            filial: p.filial?.nome,
            ativo: p.ativo ?? true,
            quantidadeContratos: dados.quantidade,
            contratosPagos: dados.contratosPagos,
            valorTotalPago: dados.valorTotalPago,
            totalComissao: dados.comissao,
            percentualComissao: percentualReal, // % calculado do contrato
          });
        });
      }

      gestoresData.forEach((u: any) => {
        const dados = calcularDadosGestor(u.filial?.nome);
        const nome = u.nome || u.login || `Gestor #${u.id}`;
        pessoasLista.push({
          id: u.id + 20000, // Offset para evitar conflito de IDs
          idOriginal: u.id,
          nome,
          slug: slugMap.get(`gestor-${u.id}`) || gerarSlug(nome),
          tipo: "gestor",
          email: u.email,
          filial: u.filial?.nome,
          ativo: u.ativo ?? true,
          quantidadeContratos: dados.quantidade,
          contratosPagos: dados.contratosPagos,
          valorTotalPago: dados.valorTotalPago,
          totalComissao: dados.comissao,
          percentualComissao: COMISSAO_GESTOR * 100, // 5%
        });
      });

      setPessoas(pessoasLista);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      setError("Erro ao carregar dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataInicio, dataFim]);

  useEffect(() => {
    if (!exportMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setExportMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [exportMenuOpen]);

  // Extrair filiais únicas para o filtro
  const filiaisUnicas = useMemo(() => {
    const filiais = pessoas
      .map((p) => p.filial)
      .filter((f): f is string => !!f && f.trim() !== "");
    return [...new Set(filiais)].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [pessoas]);

  // Filtrar e ordenar pessoas
  const pessoasFiltradas = useMemo(() => {
    return pessoas
      .filter((p) => {
        // Filtro por tipo
        if (tipoFiltro !== "todos" && p.tipo !== tipoFiltro) return false;

        // Filtro por filial
        if (filialFiltro !== "todas" && p.filial !== filialFiltro) return false;

        // Comissão: padrão só quem tem valor; opção "todos" mostra também zerados
        if (filtroComissao === "com-valor" && p.totalComissao <= 0) {
          return false;
        }

        // Filtro por busca
        if (searchTerm) {
          const termo = searchTerm.toLowerCase();
          return (
            p.nome.toLowerCase().includes(termo) ||
            p.email?.toLowerCase().includes(termo) ||
            p.oab?.toLowerCase().includes(termo) ||
            p.filial?.toLowerCase().includes(termo)
          );
        }
        return true;
      })
      .sort((a, b) => {
        switch (ordenacao) {
          case "comissao-desc":
            return b.totalComissao - a.totalComissao; // Maior para menor
          case "comissao-asc":
            return a.totalComissao - b.totalComissao; // Menor para maior
          default:
            return a.nome.localeCompare(b.nome, "pt-BR"); // Alfabética
        }
      });
  }, [pessoas, tipoFiltro, filialFiltro, filtroComissao, searchTerm, ordenacao]);

  /** Quantos registros batem em tipo, filial e busca (ignora filtro de comissão). */
  const totalComFiltrosExcetoComissao = useMemo(() => {
    return pessoas.filter((p) => {
      if (tipoFiltro !== "todos" && p.tipo !== tipoFiltro) return false;
      if (filialFiltro !== "todas" && p.filial !== filialFiltro) return false;
      if (searchTerm) {
        const termo = searchTerm.toLowerCase();
        return (
          p.nome.toLowerCase().includes(termo) ||
          p.email?.toLowerCase().includes(termo) ||
          p.oab?.toLowerCase().includes(termo) ||
          p.filial?.toLowerCase().includes(termo)
        );
      }
      return true;
    }).length;
  }, [pessoas, tipoFiltro, filialFiltro, searchTerm]);

  const totalPages = Math.ceil(pessoasFiltradas.length / ITEMS_PER_PAGE);
  const paginatedPessoas = pessoasFiltradas.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [tipoFiltro, filialFiltro, filtroComissao, searchTerm, ordenacao]);

  // Estatísticas
  const stats = useMemo(
    () => ({
      total: pessoas.length,
      consultores: pessoas.filter((p) => p.tipo === "consultor").length,
      parceiros: pessoas.filter((p) => p.tipo === "parceiro").length,
      gestores: pessoas.filter((p) => p.tipo === "gestor").length,
    }),
    [pessoas]
  );

  // Calcular parceiro com maior comissão
  const parceiroMaiorComissao = useMemo(() => {
    const parceiros = pessoas.filter((p) => p.tipo === "parceiro");
    if (parceiros.length === 0) return null;
    return parceiros.reduce((max, p) =>
      p.totalComissao > max.totalComissao ? p : max
    );
  }, [pessoas]);

  // Calcular parceiro com mais contratos
  const parceiroMaisContratos = useMemo(() => {
    const parceiros = pessoas.filter((p) => p.tipo === "parceiro");
    if (parceiros.length === 0) return null;
    return parceiros.reduce((max, p) =>
      p.quantidadeContratos > max.quantidadeContratos ? p : max
    );
  }, [pessoas]);

  // Resumo da filial selecionada (para mostrar total e comissão do gestor)
  const resumoFilial = useMemo(() => {
    if (filialFiltro === "todas") return null;

    // Buscar todas as pessoas da filial selecionada
    const pessoasDaFilial = pessoas.filter((p) => p.filial === filialFiltro);

    // Buscar o gestor da filial
    const gestorDaFilial = pessoasDaFilial.find((p) => p.tipo === "gestor");

    // Calcular total liquidado da filial (soma dos consultores)
    const consultoresDaFilial = pessoasDaFilial.filter(
      (p) => p.tipo === "consultor"
    );
    const totalLiquidadoFilial = consultoresDaFilial.reduce(
      (sum, c) => sum + c.valorTotalPago,
      0
    );

    // Calcular comissão do gestor (5% do total da filial)
    const comissaoGestor = totalLiquidadoFilial * 0.05;

    // Contar contratos e parcelas liquidadas da filial
    const totalContratos = consultoresDaFilial.reduce(
      (sum, c) => sum + c.quantidadeContratos,
      0
    );
    const totalParcelasLiquidadas = consultoresDaFilial.reduce(
      (sum, c) => sum + c.contratosPagos,
      0
    );

    return {
      filial: filialFiltro,
      gestorNome: gestorDaFilial?.nome || "Gestor Filial",
      gestorEmail: gestorDaFilial?.email,
      totalLiquidado: totalLiquidadoFilial,
      comissaoGestor,
      totalContratos,
      totalParcelasLiquidadas,
      totalConsultores: consultoresDaFilial.length,
    };
  }, [filialFiltro, pessoas]);

  const handleExportarCsv = () => {
    setExportMenuOpen(false);
    if (pessoasFiltradas.length === 0) return;

    const headers = [
      "Nome",
      "Tipo",
      "Filial",
      "Email",
      "Contratos",
      "Parcelas Liquidadas",
      "Valor Liquidado",
      "Percentual Comissao",
      "Comissao Total",
    ];

    const rows = pessoasFiltradas.map((pessoa) => [
      pessoa.nome,
      pessoa.tipo === "consultor"
        ? "Consultor"
        : pessoa.tipo === "parceiro"
        ? "Parceiro"
        : "Gestor",
      pessoa.filial || "-",
      pessoa.email || "-",
      pessoa.quantidadeContratos,
      pessoa.contratosPagos,
      formatNumberForCsv(pessoa.valorTotalPago),
      `${pessoa.percentualComissao.toFixed(1).replace(".", ",")}%`,
      formatNumberForCsv(pessoa.totalComissao),
    ]);

    const csvContent = [
      headers.map(escapeCsvValue).join(";"),
      ...rows.map((row) => row.map(escapeCsvValue).join(";")),
    ].join("\n");

    const dataAtual = new Date().toISOString().split("T")[0];
    const filename = `comissoes_${dataAtual}.csv`;
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportarWord = () => {
    setExportMenuOpen(false);
    if (pessoasFiltradas.length === 0) return;

    const dataAtual = new Date().toLocaleString("pt-BR");
    const linhasTabela = pessoasFiltradas
      .map(
        (pessoa) => `
        <tr>
          <td>${escapeHtml(pessoa.nome)}</td>
          <td>${escapeHtml(
            pessoa.tipo === "consultor"
              ? "Consultor"
              : pessoa.tipo === "parceiro"
              ? "Parceiro"
              : "Gestor"
          )}</td>
          <td>${escapeHtml(pessoa.filial || "-")}</td>
          <td>${escapeHtml(pessoa.email || "-")}</td>
          <td>${escapeHtml(pessoa.quantidadeContratos)}</td>
          <td>${escapeHtml(pessoa.contratosPagos)}</td>
          <td>${escapeHtml(formatCurrency(pessoa.valorTotalPago))}</td>
          <td>${escapeHtml(
            `${pessoa.percentualComissao.toFixed(1).replace(".", ",")}%`
          )}</td>
          <td>${escapeHtml(formatCurrency(pessoa.totalComissao))}</td>
        </tr>
      `
      )
      .join("");

    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Relatório de Comissões</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; }
            h1 { margin: 0 0 8px 0; }
            .meta { color: #555; margin-bottom: 16px; font-size: 12px; }
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>Relatório de Comissões</h1>
          <p class="meta">Gerado em: ${escapeHtml(dataAtual)}</p>
          <p class="meta">
            Filtros: Tipo ${escapeHtml(tipoFiltro)} | Filial ${escapeHtml(
      filialFiltro
    )} | Comissão ${escapeHtml(
      filtroComissao === "com-valor" ? "só com valor" : "todos (incl. zerados)"
    )} | Período ${escapeHtml(dataInicio || "início")} até ${escapeHtml(
      dataFim || "atual"
    )}
          </p>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Filial</th>
                <th>Email</th>
                <th>Contratos</th>
                <th>Parcelas Liquidadas</th>
                <th>Valor Liquidado</th>
                <th>% Comissão</th>
                <th>Comissão Total</th>
              </tr>
            </thead>
            <tbody>
              ${linhasTabela}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const filename = `comissoes_${new Date().toISOString().split("T")[0]}.doc`;
    const blob = new Blob(["\uFEFF" + htmlContent], {
      type: "application/msword;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Configuração das tags
  const getTipoConfig = (tipo: Pessoa["tipo"]) => {
    switch (tipo) {
      case "consultor":
        return {
          label: "Consultor",
          icon: UserCheck,
          bgColor: "bg-blue-500/20",
          borderColor: "border-blue-500/30",
          textColor: "text-blue-400",
        };
      case "parceiro":
        return {
          label: "Parceiro",
          icon: Handshake,
          bgColor: "bg-purple-500/20",
          borderColor: "border-purple-500/30",
          textColor: "text-purple-400",
        };
      case "gestor":
        return {
          label: "Gestor",
          icon: Briefcase,
          bgColor: "bg-amber-500/20",
          borderColor: "border-amber-500/30",
          textColor: "text-amber-400",
        };
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg shadow-amber-500/30">
                  <Percent className="w-8 h-8 text-neutral-950" />
                </div>
                <h1 className="text-4xl font-bold text-gradient-amber">
                  Comissões
                </h1>
                <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
              <p className="text-neutral-400 ml-14">
                Gerencie as comissões de consultores, gestores e parceiros
              </p>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchDados}
                className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl transition-all duration-300"
              >
                <RefreshCw
                  className={cn(
                    "w-5 h-5 text-neutral-300",
                    loading && "animate-spin"
                  )}
                />
                <span className="font-medium text-neutral-200">Atualizar</span>
              </motion.button>
              <div className="relative" ref={exportMenuRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setExportMenuOpen((prev) => !prev)}
                  disabled={loading || pessoasFiltradas.length === 0}
                  className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-5 h-5 text-neutral-300" />
                  <span className="font-medium text-neutral-200">Exportar</span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-neutral-400 transition-transform",
                      exportMenuOpen && "rotate-180"
                    )}
                  />
                </motion.button>

                {exportMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 mt-2 w-44 bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl overflow-hidden z-20"
                  >
                    <button
                      onClick={handleExportarCsv}
                      className="w-full text-left px-4 py-2.5 text-sm text-neutral-200 hover:bg-neutral-800 transition-colors"
                    >
                      Exportar em CSV
                    </button>
                    <button
                      onClick={handleExportarWord}
                      className="w-full text-left px-4 py-2.5 text-sm text-neutral-200 hover:bg-neutral-800 transition-colors border-t border-neutral-800"
                    >
                      Exportar em Word
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Total",
                value: stats.total,
                icon: Users,
                color: "amber",
              },
              {
                label: "Consultores",
                value: stats.consultores,
                icon: UserCheck,
                color: "blue",
              },
              {
                label: "Parceiros",
                value: stats.parceiros,
                icon: Handshake,
                color: "purple",
                extraInfo: parceiroMaiorComissao || parceiroMaisContratos ? {
                  maiorComissao: parceiroMaiorComissao ? {
                    nome: parceiroMaiorComissao.nome,
                    valor: formatCurrency(parceiroMaiorComissao.totalComissao)
                  } : null,
                  maisContratos: parceiroMaisContratos ? {
                    nome: parceiroMaisContratos.nome,
                    valor: parceiroMaisContratos.quantidadeContratos
                  } : null
                } : null
              },
              {
                label: "Gestores",
                value: stats.gestores,
                icon: Briefcase,
                color: "amber",
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-neutral-900/95 backdrop-blur-xl p-6 rounded-xl border border-neutral-800 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/10 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30">
                    <stat.icon className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
                <p className="text-neutral-400 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-neutral-50">
                  {stat.value}
                </p>
                {stat.extraInfo && (
                  <div className="mt-3 space-y-2">
                    {stat.extraInfo.maiorComissao && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-500">Maior comissão:</span>
                        <span className="text-purple-400 font-medium">
                          {stat.extraInfo.maiorComissao.nome}
                        </span>
                      </div>
                    )}
                    {stat.extraInfo.maisContratos && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-500">Mais contratos:</span>
                        <span className="text-purple-400 font-medium">
                          {stat.extraInfo.maisContratos.nome}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Filtros */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl border border-neutral-800 shadow-xl p-6 mb-8"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Busca */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email, OAB ou filial..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-neutral-100 placeholder-neutral-500"
                />
              </div>

              {/* Filtro de Tipo */}
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-neutral-400" />
                <select
                  value={tipoFiltro}
                  onChange={(e) => setTipoFiltro(e.target.value as any)}
                  className="px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-200"
                >
                  <option value="todos">Todos os Tipos</option>
                  <option value="consultor">Consultores</option>
                  <option value="parceiro">Parceiros</option>
                  <option value="gestor">Gestores</option>
                </select>
              </div>

              {/* Ordenação */}
              <div className="flex items-center gap-3">
                <ArrowUpDown className="w-5 h-5 text-neutral-400" />
                <select
                  value={ordenacao}
                  onChange={(e) => setOrdenacao(e.target.value as any)}
                  className="px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-200"
                >
                  <option value="alfabetica">A-Z (Alfabética)</option>
                  <option value="comissao-desc">Maior Comissão</option>
                  <option value="comissao-asc">Menor Comissão</option>
                </select>
              </div>
            </div>

            {/* Filtro de Data e Filial */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4 pt-4 border-t border-neutral-800">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-neutral-400" />
                <span className="text-sm text-neutral-400">Período:</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-neutral-500">De:</label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-200 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-neutral-500">Até:</label>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-200 text-sm"
                  />
                </div>
                {(dataInicio || dataFim) && (
                  <button
                    onClick={() => {
                      setDataInicio("");
                      setDataFim("");
                    }}
                    className="px-3 py-2 text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors"
                  >
                    Limpar datas
                  </button>
                )}

                {/* Separador */}
                <div className="hidden sm:block w-px h-8 bg-neutral-700 mx-2" />

                {/* Filtro de Filial */}
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-neutral-400" />
                  <select
                    value={filialFiltro}
                    onChange={(e) => setFilialFiltro(e.target.value)}
                    className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-200 text-sm"
                  >
                    <option value="todas">Todas as Filiais</option>
                    {filiaisUnicas.map((filial) => (
                      <option key={filial} value={filial}>
                        {filial}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-neutral-400" />
                  <select
                    value={filtroComissao}
                    onChange={(e) =>
                      setFiltroComissao(e.target.value as "com-valor" | "todos")
                    }
                    className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-200 text-sm min-w-[11rem]"
                    title="Filtrar por valor de comissão"
                  >
                    <option value="com-valor">Comissões</option>
                    <option value="todos">Todos (Parceiros e Consultores)</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card de Resumo da Filial (quando uma filial é selecionada) */}
          {resumoFilial && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 backdrop-blur-xl rounded-2xl border border-amber-500/30 shadow-xl p-6 mb-8"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* Info do Gestor */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30 rounded-full flex items-center justify-center">
                    <Briefcase className="w-7 h-7 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-neutral-100">
                        {resumoFilial.gestorNome}
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 border border-amber-500/30 text-amber-400">
                        <Briefcase className="w-3 h-3" />
                        Gestor
                      </span>
                    </div>
                    <p className="text-neutral-400 text-sm">
                      Filial:{" "}
                      <span className="text-amber-400 font-medium">
                        {resumoFilial.filial}
                      </span>
                    </p>
                    {resumoFilial.gestorEmail && (
                      <p className="text-neutral-500 text-xs">
                        {resumoFilial.gestorEmail}
                      </p>
                    )}
                  </div>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-700">
                    <p className="text-neutral-500 text-xs mb-1">Consultores</p>
                    <p className="text-2xl font-bold text-neutral-100">
                      {resumoFilial.totalConsultores}
                    </p>
                  </div>
                  <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-700">
                    <p className="text-neutral-500 text-xs mb-1">Contratos</p>
                    <p className="text-2xl font-bold text-neutral-100">
                      {resumoFilial.totalContratos}
                    </p>
                  </div>
                  <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-700">
                    <p className="text-neutral-500 text-xs mb-1">
                      Total Liquidado
                    </p>
                    <p className="text-xl font-bold text-green-400">
                      {formatCurrency(resumoFilial.totalLiquidado)}
                    </p>
                  </div>
                  <div className="bg-amber-500/20 p-4 rounded-xl border border-amber-500/30">
                    <p className="text-amber-400/70 text-xs mb-1">
                      Comissão 5%
                    </p>
                    <p className="text-2xl font-bold text-amber-400">
                      {formatCurrency(resumoFilial.comissaoGestor)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tabela de Pessoas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-neutral-900 rounded-2xl border border-neutral-800 shadow-xl overflow-hidden relative"
          >
            {/* Loading overlay */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm"
                >
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                    <span className="text-sm text-neutral-300">Carregando...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {error ? (
              <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                <p className="text-neutral-400 mb-4">{error}</p>
                <button
                  onClick={fetchDados}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-lg font-medium transition-colors"
                >
                  Tentar Novamente
                </button>
              </div>
            ) : pessoasFiltradas.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Users className="w-12 h-12 text-neutral-600 mb-4" />
                <p className="text-neutral-400 text-center max-w-md">
                  {pessoas.length === 0
                    ? "Nenhum registro cadastrado"
                    : filtroComissao === "com-valor" &&
                      pessoasFiltradas.length === 0 &&
                      totalComFiltrosExcetoComissao > 0
                    ? "Nenhum registro com comissão para os filtros atuais. Selecione \"Todos (incl. zerados)\" ao lado de Filial para listar quem está com comissão zerada."
                    : "Nenhum resultado encontrado"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex max-h-[60vh] min-h-0 min-w-[760px] flex-col overflow-hidden">
                  {/* Scroll só no corpo; cabeçalho e total ficam fixos (total fora do scroll vertical) */}
                  <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
                    <table className="w-full table-fixed">
                      <colgroup>
                        <col style={{ width: "30%" }} />
                        <col style={{ width: "14%" }} />
                        <col style={{ width: "8%" }} />
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "18%" }} />
                        <col style={{ width: "6%" }} />
                        <col style={{ width: "14%" }} />
                      </colgroup>
                      <thead className="sticky top-0 z-20">
                        <tr className="border-b border-neutral-700 shadow-md [&_th]:bg-neutral-800">
                          <th className="bg-neutral-800 text-left px-6 py-4 text-sm font-semibold text-neutral-300">
                            Nome
                          </th>
                          <th className="bg-neutral-800 text-left px-6 py-4 text-sm font-semibold text-neutral-300">
                            Filial
                          </th>
                          <th className="bg-neutral-800 text-center px-6 py-4 text-sm font-semibold text-neutral-300">
                            Contratos
                          </th>
                          <th className="bg-neutral-800 text-center px-6 py-4 text-sm font-semibold text-neutral-300">
                            Parcelas Liq.
                          </th>
                          <th className="bg-neutral-800 text-right px-6 py-4 text-sm font-semibold text-neutral-300">
                            Valor Liquidado
                          </th>
                          <th className="bg-neutral-800 text-center px-6 py-4 text-sm font-semibold text-neutral-300">
                            %
                          </th>
                          <th className="bg-neutral-800 text-right px-6 py-4 text-sm font-semibold text-neutral-300">
                            Comissão
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800">
                    {paginatedPessoas.map((pessoa, index) => {
                      const tipoConfig = getTipoConfig(pessoa.tipo);
                      const TipoIcon = tipoConfig.icon;

                      return (
                        <motion.tr
                          key={`${pessoa.tipo}-${pessoa.id}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-neutral-800/30 transition-colors"
                        >
                          {/* Nome */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {/* Avatar com inicial */}
                              <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-amber-400 font-bold">
                                  {pessoa.nome.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-neutral-100">
                                    {pessoa.nome}
                                  </span>
                                  {/* Tag do tipo */}
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
                                      tipoConfig.bgColor,
                                      tipoConfig.borderColor,
                                      tipoConfig.textColor
                                    )}
                                  >
                                    <TipoIcon className="w-3 h-3" />
                                    {tipoConfig.label}
                                  </span>
                                  {/* Botão Detalhes */}
                                  <button
                                    onClick={() =>
                                      router.push(
                                        `/gestao/comissoes/${pessoa.tipo}/${pessoa.slug}`
                                      )
                                    }
                                    className="inline-flex items-center gap-1 px-2 py-1 ml-2 bg-neutral-800/50 hover:bg-amber-500/20 border border-neutral-700 hover:border-amber-500/30 text-neutral-400 hover:text-amber-400 rounded-lg text-xs font-medium transition-all"
                                  >
                                    <Eye className="w-3 h-3" />
                                    Detalhes
                                  </button>
                                </div>
                                {pessoa.email && (
                                  <p className="text-xs text-neutral-500 mt-0.5">
                                    {pessoa.email}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Filial */}
                          <td className="px-6 py-4">
                            <span className="text-neutral-400">
                              {pessoa.filial || "-"}
                            </span>
                          </td>

                          {/* Quantidade de Contratos */}
                          <td className="px-6 py-4 text-center">
                            <span className="text-neutral-400 text-sm">
                              {pessoa.quantidadeContratos}
                            </span>
                          </td>

                          {/* Contratos Pagos */}
                          <td className="px-6 py-4 text-center">
                            <span
                              className={cn(
                                "inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-full text-sm font-medium",
                                pessoa.contratosPagos > 0
                                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                  : "bg-neutral-700/50 text-neutral-500"
                              )}
                            >
                              {pessoa.contratosPagos}
                            </span>
                          </td>

                          {/* Valor Total Pago */}
                          <td className="px-6 py-4 text-right">
                            <span className="text-neutral-300 text-sm">
                              {formatCurrency(pessoa.valorTotalPago)}
                            </span>
                          </td>

                          {/* Percentual */}
                          <td className="px-6 py-4 text-center">
                            <span
                              className={cn(
                                "inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold",
                                pessoa.tipo === "consultor"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : pessoa.tipo === "gestor"
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-purple-500/20 text-purple-400"
                              )}
                            >
                              {pessoa.tipo === "parceiro"
                                ? pessoa.percentualComissao > 0
                                  ? `${pessoa.percentualComissao.toFixed(1)}%`
                                  : "Var."
                                : `${pessoa.percentualComissao}%`}
                            </span>
                          </td>

                          {/* Comissão */}
                          <td className="px-6 py-4 text-right">
                            <span
                              className={cn(
                                "font-semibold",
                                pessoa.totalComissao > 0
                                  ? "text-green-400"
                                  : "text-neutral-500"
                              )}
                            >
                              {formatCurrency(pessoa.totalComissao)}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                      </tbody>
                    </table>
                  </div>

                  {/* Total fora do scroll vertical: permanece fixo acima da paginação */}
                  <div
                    className={cn(
                      "shrink-0 shadow-[0_-8px_24px_rgba(0,0,0,0.35)]",
                      resumoFilial
                        ? "border-t border-blue-600/50 bg-blue-950"
                        : "border-t border-neutral-700 bg-neutral-800"
                    )}
                  >
                    <table className="w-full table-fixed">
                      <colgroup>
                        <col style={{ width: "30%" }} />
                        <col style={{ width: "14%" }} />
                        <col style={{ width: "8%" }} />
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "18%" }} />
                        <col style={{ width: "6%" }} />
                        <col style={{ width: "14%" }} />
                      </colgroup>
                      <tbody>
                        <tr>
                          <td className="px-6 py-4 align-middle">
                            <div className="flex min-w-0 items-center gap-3">
                              {resumoFilial ? (
                                <>
                                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-blue-600/20">
                                    <Briefcase className="h-5 w-5 text-blue-400" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-semibold text-blue-100">
                                      {resumoFilial.gestorNome}
                                    </span>
                                    <p className="text-xs text-blue-300/70">
                                      Total Filial {resumoFilial.filial}
                                    </p>
                                  </div>
                                </>
                              ) : (
                                <span className="font-semibold text-neutral-200">
                                  Total
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4" />
                          <td className="px-6 py-4 text-center">
                            <span className="font-medium text-neutral-300">
                              {resumoFilial
                                ? resumoFilial.totalContratos
                                : pessoasFiltradas.reduce(
                                    (sum, p) => sum + p.quantidadeContratos,
                                    0
                                  )}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex min-w-[32px] items-center justify-center rounded-full border border-green-500/30 bg-green-500/20 px-2 py-1 text-sm font-bold text-green-400">
                              {resumoFilial
                                ? resumoFilial.totalParcelasLiquidadas
                                : pessoasFiltradas.reduce(
                                    (sum, p) => sum + p.contratosPagos,
                                    0
                                  )}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-semibold text-neutral-200">
                              {formatCurrency(
                                resumoFilial
                                  ? resumoFilial.totalLiquidado
                                  : pessoasFiltradas.reduce(
                                      (sum, p) => sum + p.valorTotalPago,
                                      0
                                    )
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-medium text-amber-400">
                              {resumoFilial ? "5%" : "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-lg font-bold text-amber-400">
                              {formatCurrency(
                                resumoFilial
                                  ? resumoFilial.comissaoGestor
                                  : pessoasFiltradas.reduce(
                                      (sum, p) => sum + p.totalComissao,
                                      0
                                    )
                              )}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Paginação */}
            {pessoasFiltradas.length > 0 && (
              <div className="px-6 py-4 bg-neutral-800/30 border-t border-neutral-800">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                  <div className="text-xs sm:text-sm text-neutral-500 text-center sm:text-left">
                    Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                    {Math.min(currentPage * ITEMS_PER_PAGE, pessoasFiltradas.length)} de {pessoasFiltradas.length} de <span className="text-neutral-300">{pessoas.length}</span> registros
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-neutral-300 bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 hover:border-amber-500/50 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-neutral-800 disabled:hover:border-neutral-700"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </motion.button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        if (totalPages <= 7) return true;
                        if (page === 1 || page === totalPages) return true;
                        if (Math.abs(page - currentPage) <= 1) return true;
                        if (page === currentPage - 2 || page === currentPage + 2) return true;
                        return false;
                      })
                      .reduce<(number | "ellipsis")[]>((acc, page, idx, arr) => {
                        if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                          acc.push("ellipsis");
                        }
                        acc.push(page);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        item === "ellipsis" ? (
                          <span key={`ellipsis-${idx}`} className="px-1 sm:px-2 text-neutral-500 text-xs">
                            ...
                          </span>
                        ) : (
                          <motion.button
                            key={item}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setCurrentPage(item)}
                            className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200 ${
                              currentPage === item
                                ? "text-white bg-amber-500 border border-transparent hover:bg-amber-600"
                                : "text-neutral-300 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 hover:border-amber-500/50"
                            }`}
                          >
                            {item}
                          </motion.button>
                        )
                      )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-neutral-300 bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 hover:border-amber-500/50 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-neutral-800 disabled:hover:border-neutral-700"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
