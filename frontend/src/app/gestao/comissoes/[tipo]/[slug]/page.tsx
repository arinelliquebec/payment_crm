"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { apiClient } from "@/lib/api";
import {
  ArrowLeft,
  Percent,
  FileText,
  Sparkles,
  Loader2,
  AlertCircle,
  UserCheck,
  Handshake,
  Briefcase,
  CheckCircle,
  Clock,
  X,
  Eye,
  User,
  Calendar,
  DollarSign,
  Hash,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  boletoPagoParaComissao,
  valorEfetivoPagoBoleto,
  type Boleto,
} from "@/types/boleto";

// Porcentagens de comissão fixas
const COMISSAO_CONSULTOR = 0.1; // 10%
const COMISSAO_GESTOR = 0.05; // 5%

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

// Função para comparar slug com nome (com ou sem número)
const slugMatchesNome = (slug: string, nome: string): boolean => {
  const nomeSlug = gerarSlug(nome);
  // Verifica match exato ou match com número no final
  if (slug === nomeSlug) return true;
  // Verifica se o slug é nomeSlug-N (com número)
  const matchWithNumber = slug.match(/^(.+)-(\d+)$/);
  if (matchWithNumber) {
    return matchWithNumber[1] === nomeSlug;
  }
  return false;
};

interface Contrato {
  id: number;
  clienteNome: string;
  valorParcela: number;
  numeroParcelas: number;
  situacao: string;
  dataCadastro: string;
  boletosLiquidados: number;
  valorLiquidado: number;
}

interface ContratoDetalhes {
  id: number;
  clienteNome: string;
  clienteCpfCnpj: string;
  clienteEmail: string;
  clienteTelefone: string;
  consultorNome: string;
  parceiroNome: string;
  valorNegociado: number;
  valorParcela: number;
  numeroParcelas: number;
  situacao: string;
  dataCadastro: string;
  dataAssinatura: string;
  observacao: string;
  filialNome: string;
  boletosLiquidados: number;
  valorLiquidado: number;
  comissao: number;
}

interface PessoaDetalhes {
  id: number;
  nome: string;
  tipo: "consultor" | "parceiro" | "gestor";
  email?: string;
  filial?: string;
  contratos: Contrato[];
  totalContratos: number;
  totalBoletosLiquidados: number;
  valorTotalLiquidado: number;
  comissaoTotal: number;
  percentualComissao: number;
}

export default function ComissaoDetalhesPage({
  params,
}: {
  params: Promise<{ tipo: string; slug: string }>;
}) {
  const { tipo, slug } = use(params);
  const router = useRouter();
  const [pessoa, setPessoa] = useState<PessoaDetalhes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para o modal de detalhes do contrato
  const [contratoSelecionado, setContratoSelecionado] =
    useState<ContratoDetalhes | null>(null);
  const [loadingContrato, setLoadingContrato] = useState(false);
  const [showContratoModal, setShowContratoModal] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("pt-BR");
    } catch {
      return "-";
    }
  };

  // Função para buscar detalhes do contrato
  const handleVerContrato = async (contratoId: number) => {
    setLoadingContrato(true);
    setShowContratoModal(true);

    try {
      // Buscar dados do contrato
      const contratoRes = await apiClient.get(`/Contrato/${contratoId}`);
      const c: any = contratoRes.data;

      // Buscar boletos do contrato
      const boletosRes = await apiClient.get("/Boleto");
      const boletos = Array.isArray(boletosRes.data) ? boletosRes.data : [];
      const boletosDoContrato = boletos.filter(
        (b: any) => b.contratoId === contratoId
      );
      const boletosLiquidados = boletosDoContrato.filter((b: any) =>
        boletoPagoParaComissao(b as Boleto)
      );
      const valorLiquidado = boletosLiquidados.reduce(
        (sum: number, b: any) =>
          sum + valorEfetivoPagoBoleto(b as Boleto),
        0
      );

      setContratoSelecionado({
        id: c.id,
        clienteNome:
          c.cliente?.pessoaFisica?.nome ||
          c.cliente?.pessoaJuridica?.razaoSocial ||
          "Cliente não informado",
        clienteCpfCnpj:
          c.cliente?.pessoaFisica?.cpf ||
          c.cliente?.pessoaJuridica?.cnpj ||
          "-",
        clienteEmail:
          c.cliente?.pessoaFisica?.emailPessoal ||
          c.cliente?.pessoaJuridica?.email ||
          "-",
        clienteTelefone:
          c.cliente?.pessoaFisica?.telefone1 ||
          c.cliente?.pessoaJuridica?.telefone ||
          "-",
        consultorNome:
          c.consultor?.pessoaFisica?.nome || "Consultor não informado",
        parceiroNome: c.parceiro?.pessoaFisica?.nome || "-",
        valorNegociado: c.valorNegociado || 0,
        valorParcela: c.valorParcela || 0,
        numeroParcelas: c.numeroParcelas || 1,
        situacao: c.situacao || "-",
        dataCadastro: c.dataCadastro,
        dataAssinatura: c.dataAssinatura,
        observacao: c.observacao || "-",
        filialNome: c.filial?.nome || "-",
        boletosLiquidados: boletosLiquidados.length,
        valorLiquidado,
        comissao: c.comissao || 0,
      });
    } catch (err) {
      console.error("Erro ao buscar contrato:", err);
      setContratoSelecionado(null);
    } finally {
      setLoadingContrato(false);
    }
  };

  const closeContratoModal = () => {
    setShowContratoModal(false);
    setContratoSelecionado(null);
  };

  const getTipoConfig = (tipo: string) => {
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
      default:
        return {
          label: tipo,
          icon: UserCheck,
          bgColor: "bg-neutral-500/20",
          borderColor: "border-neutral-500/30",
          textColor: "text-neutral-400",
        };
    }
  };

  useEffect(() => {
    const fetchDados = async () => {
      setLoading(true);
      setError(null);

      try {
        let pessoaData: any = null;
        let pessoaId: number | null = null;
        let contratos: any[] = [];

        // Extrair número do slug se houver (para casos de duplicata)
        const slugMatch = slug.match(/^(.+)-(\d+)$/);
        const slugBase = slugMatch ? slugMatch[1] : slug;
        const slugNumber = slugMatch ? parseInt(slugMatch[2]) : null;

        // Buscar dados da pessoa baseado no tipo e slug
        if (tipo === "consultor") {
          const res = await apiClient.get("/Consultor");
          if (res.data && Array.isArray(res.data)) {
            // Encontrar todos os consultores que correspondem ao slug base
            const matches = res.data.filter((c: any) => {
              const nome = c.pessoaFisica?.nome || `Consultor #${c.id}`;
              return slugMatchesNome(slug, nome);
            });

            if (matches.length > 0) {
              // Se tem número no slug, pegar o correspondente
              const matchIndex = slugNumber ? slugNumber - 1 : 0;
              const match = matches[matchIndex] || matches[0];
              pessoaId = match.id;
              pessoaData = {
                id: match.id,
                nome: match.pessoaFisica?.nome || `Consultor #${match.id}`,
                email: match.pessoaFisica?.emailEmpresarial,
                filial: match.filial?.nome,
              };
            }
          }
        } else if (tipo === "parceiro") {
          const res = await apiClient.get("/Parceiro");
          if (res.data && Array.isArray(res.data)) {
            const matches = res.data.filter((p: any) => {
              const nome = p.pessoaFisica?.nome || `Parceiro #${p.id}`;
              return slugMatchesNome(slug, nome);
            });

            if (matches.length > 0) {
              const matchIndex = slugNumber ? slugNumber - 1 : 0;
              const match = matches[matchIndex] || matches[0];
              pessoaId = match.id;
              pessoaData = {
                id: match.id,
                nome: match.pessoaFisica?.nome || `Parceiro #${match.id}`,
                email: match.pessoaFisica?.emailEmpresarial,
                filial: match.filial?.nome,
              };
            }
          }
        } else if (tipo === "gestor") {
          const res = await apiClient.get("/Usuario");
          if (res.data && Array.isArray(res.data)) {
            const gestores = res.data.filter(
              (u: any) =>
                u.grupoAcesso?.nome?.toLowerCase().includes("gestor") ||
                u.grupoAcesso?.nome?.toLowerCase().includes("gerente")
            );
            const matches = gestores.filter((u: any) => {
              const nome = u.nome || u.login || `Gestor #${u.id}`;
              return slugMatchesNome(slug, nome);
            });

            if (matches.length > 0) {
              const matchIndex = slugNumber ? slugNumber - 1 : 0;
              const match = matches[matchIndex] || matches[0];
              pessoaId = match.id;
              pessoaData = {
                id: match.id,
                nome: match.nome || match.login || `Gestor #${match.id}`,
                email: match.email,
                filial: match.filial?.nome,
              };
            }
          }
        }

        if (!pessoaData || pessoaId === null) {
          throw new Error("Pessoa não encontrada");
        }

        // Buscar contratos - apenas situação "Cliente"
        const contratosRes = await apiClient.get("/Contrato");
        if (contratosRes.data && Array.isArray(contratosRes.data)) {
          // Primeiro filtra por situação "Cliente"
          const contratosCliente = contratosRes.data.filter(
            (c: any) => c.situacao?.toLowerCase().trim() === "cliente"
          );

          if (tipo === "consultor") {
            contratos = contratosCliente.filter(
              (c: any) => c.consultorId === pessoaId
            );
          } else if (tipo === "parceiro") {
            contratos = contratosCliente.filter(
              (c: any) => c.parceiroId === pessoaId
            );
          }
        }

        // Buscar boletos
        const boletosRes = await apiClient.get("/Boleto");
        const boletos: any[] = Array.isArray(boletosRes.data)
          ? boletosRes.data
          : [];

        // Processar contratos com informações de boletos
        const contratosProcessados: Contrato[] = contratos.map((c: any) => {
          const boletosDoContrato = boletos.filter(
            (b: any) => b.contratoId === c.id
          );
          const boletosLiquidados = boletosDoContrato.filter((b: any) =>
            boletoPagoParaComissao(b as Boleto)
          );
          const valorLiquidado = boletosLiquidados.reduce(
            (sum: number, b: any) =>
              sum + valorEfetivoPagoBoleto(b as Boleto),
            0
          );

          return {
            id: c.id,
            clienteNome:
              c.cliente?.pessoaFisica?.nome ||
              c.cliente?.pessoaJuridica?.razaoSocial ||
              `Cliente #${c.clienteId}`,
            valorParcela: c.valorParcela || 0,
            numeroParcelas: c.numeroParcelas || 1,
            situacao: c.situacao || "",
            dataCadastro: c.dataCadastro,
            boletosLiquidados: boletosLiquidados.length,
            valorLiquidado,
          };
        });

        // Calcular totais
        const totalBoletosLiquidados = contratosProcessados.reduce(
          (sum, c) => sum + c.boletosLiquidados,
          0
        );
        const valorTotalLiquidado = contratosProcessados.reduce(
          (sum, c) => sum + c.valorLiquidado,
          0
        );

        // Calcular comissão baseado no tipo
        let comissaoTotal = 0;
        let percentualComissao = 0;

        if (tipo === "consultor") {
          comissaoTotal = valorTotalLiquidado * COMISSAO_CONSULTOR;
          percentualComissao = COMISSAO_CONSULTOR * 100;
        } else if (tipo === "gestor") {
          comissaoTotal = valorTotalLiquidado * COMISSAO_GESTOR;
          percentualComissao = COMISSAO_GESTOR * 100;
        } else if (tipo === "parceiro") {
          // Parceiro: soma das comissões definidas nos contratos com boletos liquidados
          comissaoTotal = contratos
            .filter((c: any) => {
              const temLiquidado = boletos.some(
                (b: any) =>
                  b.contratoId === c.id && boletoPagoParaComissao(b as Boleto)
              );
              return temLiquidado;
            })
            .reduce((sum: number, c: any) => sum + (c.comissao || 0), 0);
          percentualComissao =
            valorTotalLiquidado > 0
              ? (comissaoTotal / valorTotalLiquidado) * 100
              : 0;
        }

        setPessoa({
          id: pessoaData.id,
          nome: pessoaData.nome,
          tipo: tipo as "consultor" | "parceiro" | "gestor",
          email: pessoaData.email,
          filial: pessoaData.filial,
          contratos: contratosProcessados,
          totalContratos: contratosProcessados.length,
          totalBoletosLiquidados,
          valorTotalLiquidado,
          comissaoTotal,
          percentualComissao,
        });
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
        setError("Erro ao carregar dados. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchDados();
  }, [tipo, slug]);

  const tipoConfig = getTipoConfig(tipo);
  const TipoIcon = tipoConfig.icon;

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
                <button
                  onClick={() => router.push("/gestao/comissoes")}
                  className="p-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-amber-500/30 rounded-lg transition-all"
                >
                  <ArrowLeft className="w-5 h-5 text-neutral-400 hover:text-amber-400" />
                </button>
                <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg shadow-amber-500/30">
                  <Percent className="w-8 h-8 text-neutral-950" />
                </div>
                <h1 className="text-4xl font-bold text-gradient-amber">
                  Detalhes de Comissão
                </h1>
                <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
              <p className="text-neutral-400 ml-24">
                Visualize os contratos e comissões detalhadas
              </p>
            </div>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <span className="ml-3 text-neutral-400">Carregando...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
              <p className="text-neutral-400 mb-4">{error}</p>
              <button
                onClick={() => router.push("/gestao/comissoes")}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-lg font-medium transition-colors"
              >
                Voltar
              </button>
            </div>
          ) : pessoa ? (
            <>
              {/* Card da Pessoa */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl border border-neutral-800 shadow-xl p-6 mb-8"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30 rounded-full flex items-center justify-center">
                    <span className="text-amber-400 font-bold text-2xl">
                      {pessoa.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-neutral-100">
                        {pessoa.nome}
                      </h2>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border",
                          tipoConfig.bgColor,
                          tipoConfig.borderColor,
                          tipoConfig.textColor
                        )}
                      >
                        <TipoIcon className="w-4 h-4" />
                        {tipoConfig.label}
                      </span>
                    </div>
                    {pessoa.email && (
                      <p className="text-neutral-500">{pessoa.email}</p>
                    )}
                    {pessoa.filial && (
                      <p className="text-neutral-600 text-sm">
                        Filial: {pessoa.filial}
                      </p>
                    )}
                  </div>
                </div>

                {/* Resumo */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                  <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700">
                    <p className="text-neutral-500 text-sm">Contratos</p>
                    <p className="text-2xl font-bold text-neutral-100">
                      {pessoa.totalContratos}
                    </p>
                  </div>
                  <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700">
                    <p className="text-neutral-500 text-sm">Parcelas Liq.</p>
                    <p className="text-2xl font-bold text-green-400">
                      {pessoa.totalBoletosLiquidados}
                    </p>
                  </div>
                  <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700">
                    <p className="text-neutral-500 text-sm">Valor Liquidado</p>
                    <p className="text-2xl font-bold text-neutral-100">
                      {formatCurrency(pessoa.valorTotalLiquidado)}
                    </p>
                  </div>
                  <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700">
                    <p className="text-neutral-500 text-sm">% Comissão</p>
                    <p className="text-2xl font-bold text-amber-400">
                      {pessoa.percentualComissao.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/30">
                    <p className="text-amber-400/70 text-sm">Comissão Total</p>
                    <p className="text-2xl font-bold text-amber-400">
                      {formatCurrency(pessoa.comissaoTotal)}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Tabela de Contratos */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl border border-neutral-800 shadow-xl overflow-hidden"
              >
                <div className="p-6 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-amber-400" />
                    <h3 className="text-xl font-semibold text-neutral-100">
                      Contratos ({pessoa.contratos.length})
                    </h3>
                  </div>
                </div>

                {pessoa.contratos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <FileText className="w-12 h-12 text-neutral-600 mb-4" />
                    <p className="text-neutral-400">
                      Nenhum contrato encontrado
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-neutral-800/50 border-b border-neutral-700">
                          <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-300">
                            ID
                          </th>
                          <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-300">
                            Cliente
                          </th>
                          <th className="text-right px-6 py-4 text-sm font-semibold text-neutral-300">
                            Valor Parcela
                          </th>
                          <th className="text-center px-6 py-4 text-sm font-semibold text-neutral-300">
                            Nº Parcelas
                          </th>
                          <th className="text-right px-6 py-4 text-sm font-semibold text-neutral-300">
                            Valor Total
                          </th>
                          <th className="text-center px-6 py-4 text-sm font-semibold text-neutral-300">
                            Parcelas Liq.
                          </th>
                          <th className="text-right px-6 py-4 text-sm font-semibold text-neutral-300">
                            Valor Liquidado
                          </th>
                          <th className="text-center px-6 py-4 text-sm font-semibold text-neutral-300">
                            Situação
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800">
                        {pessoa.contratos.map((contrato) => (
                          <tr
                            key={contrato.id}
                            onClick={() => handleVerContrato(contrato.id)}
                            className="hover:bg-amber-500/10 hover:border-amber-500/30 transition-colors cursor-pointer group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-neutral-400 font-mono text-sm">
                                  #{contrato.id}
                                </span>
                                <Eye className="w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-neutral-100">
                                {contrato.clienteNome}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-neutral-300">
                                {formatCurrency(contrato.valorParcela)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-neutral-400">
                                {contrato.numeroParcelas}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-neutral-300 font-medium">
                                {formatCurrency(
                                  contrato.valorParcela *
                                    contrato.numeroParcelas
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={cn(
                                  "inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-full text-sm font-medium",
                                  contrato.boletosLiquidados > 0
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : "bg-neutral-700/50 text-neutral-500"
                                )}
                              >
                                {contrato.boletosLiquidados}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span
                                className={cn(
                                  "font-semibold",
                                  contrato.valorLiquidado > 0
                                    ? "text-green-400"
                                    : "text-neutral-500"
                                )}
                              >
                                {formatCurrency(contrato.valorLiquidado)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                                  contrato.situacao
                                    .toLowerCase()
                                    .includes("quitado")
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : contrato.situacao
                                        .toLowerCase()
                                        .includes("assinado")
                                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                    : "bg-neutral-700/50 text-neutral-400"
                                )}
                              >
                                {contrato.situacao
                                  .toLowerCase()
                                  .includes("quitado") ? (
                                  <CheckCircle className="w-3 h-3" />
                                ) : (
                                  <Clock className="w-3 h-3" />
                                )}
                                {contrato.situacao}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {/* Totais */}
                      <tfoot>
                        <tr className="bg-neutral-800/70 border-t border-neutral-700">
                          <td
                            colSpan={4}
                            className="px-6 py-4 font-semibold text-neutral-200"
                          >
                            Total
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-neutral-200">
                            {formatCurrency(
                              pessoa.contratos.reduce(
                                (sum, c) =>
                                  sum + c.valorParcela * c.numeroParcelas,
                                0
                              )
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-full text-sm font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                              {pessoa.totalBoletosLiquidados}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-amber-400">
                            {formatCurrency(pessoa.valorTotalLiquidado)}
                          </td>
                          <td className="px-6 py-4"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </motion.div>
            </>
          ) : null}
        </div>
      </div>

      {/* Modal de Detalhes do Contrato */}
      {showContratoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeContratoModal}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden mx-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
                  <FileText className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-100">
                    Detalhes do Contrato
                  </h2>
                  {contratoSelecionado && (
                    <p className="text-sm text-neutral-400">
                      #{contratoSelecionado.id}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={closeContratoModal}
                className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-neutral-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {loadingContrato ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                  <span className="ml-3 text-neutral-400">
                    Carregando detalhes...
                  </span>
                </div>
              ) : contratoSelecionado ? (
                <div className="space-y-6">
                  {/* Cliente */}
                  <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-5 h-5 text-blue-400" />
                      <h3 className="font-semibold text-neutral-200">
                        Cliente
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">Nome</p>
                        <p className="text-neutral-200">
                          {contratoSelecionado.clienteNome}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">
                          CPF/CNPJ
                        </p>
                        <p className="text-neutral-200 font-mono">
                          {contratoSelecionado.clienteCpfCnpj}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">Email</p>
                        <p className="text-neutral-200">
                          {contratoSelecionado.clienteEmail}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">
                          Telefone
                        </p>
                        <p className="text-neutral-200">
                          {contratoSelecionado.clienteTelefone}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Valores */}
                  <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <h3 className="font-semibold text-neutral-200">
                        Valores
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">
                          Valor Negociado
                        </p>
                        <p className="text-lg font-bold text-neutral-100">
                          {formatCurrency(contratoSelecionado.valorNegociado)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">
                          Valor Parcela
                        </p>
                        <p className="text-lg font-bold text-neutral-100">
                          {formatCurrency(contratoSelecionado.valorParcela)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">
                          Nº Parcelas
                        </p>
                        <p className="text-lg font-bold text-neutral-100">
                          {contratoSelecionado.numeroParcelas}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">
                          Valor Total
                        </p>
                        <p className="text-lg font-bold text-neutral-100">
                          {formatCurrency(
                            contratoSelecionado.valorParcela *
                              contratoSelecionado.numeroParcelas
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Pagamento */}
                  <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-amber-400" />
                      <h3 className="font-semibold text-neutral-200">
                        Pagamentos
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">
                          Parcelas Liquidadas
                        </p>
                        <p className="text-2xl font-bold text-green-400">
                          {contratoSelecionado.boletosLiquidados}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">
                          Valor Liquidado
                        </p>
                        <p className="text-2xl font-bold text-green-400">
                          {formatCurrency(contratoSelecionado.valorLiquidado)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">
                          Comissão do Contrato
                        </p>
                        <p className="text-2xl font-bold text-amber-400">
                          {formatCurrency(contratoSelecionado.comissao)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Informações Adicionais */}
                  <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700">
                    <div className="flex items-center gap-2 mb-3">
                      <Hash className="w-5 h-5 text-purple-400" />
                      <h3 className="font-semibold text-neutral-200">
                        Informações Adicionais
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">
                          Consultor
                        </p>
                        <p className="text-neutral-200">
                          {contratoSelecionado.consultorNome}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">
                          Parceiro
                        </p>
                        <p className="text-neutral-200">
                          {contratoSelecionado.parceiroNome}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">Filial</p>
                        <p className="text-neutral-200">
                          {contratoSelecionado.filialNome}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">
                          Situação
                        </p>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                            contratoSelecionado.situacao
                              .toLowerCase()
                              .includes("cliente")
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-neutral-700/50 text-neutral-400"
                          )}
                        >
                          {contratoSelecionado.situacao}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Datas */}
                  <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-5 h-5 text-cyan-400" />
                      <h3 className="font-semibold text-neutral-200">Datas</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">
                          Data Cadastro
                        </p>
                        <p className="text-neutral-200">
                          {formatDate(contratoSelecionado.dataCadastro)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">
                          Data Assinatura
                        </p>
                        <p className="text-neutral-200">
                          {formatDate(contratoSelecionado.dataAssinatura)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Observação */}
                  {contratoSelecionado.observacao &&
                    contratoSelecionado.observacao !== "-" && (
                      <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-5 h-5 text-neutral-400" />
                          <h3 className="font-semibold text-neutral-200">
                            Observação
                          </h3>
                        </div>
                        <p className="text-neutral-300 text-sm whitespace-pre-wrap">
                          {contratoSelecionado.observacao}
                        </p>
                      </div>
                    )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                  <p className="text-neutral-400">
                    Erro ao carregar detalhes do contrato
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end p-4 border-t border-neutral-800">
              <button
                onClick={closeContratoModal}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </MainLayout>
  );
}
