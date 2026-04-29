"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  ChevronDown,
  Plus,
  Minus,
  Mail,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Gavel,
  Info,
  RefreshCw,
  FastForward,
  FileText,
  Loader2,
} from "lucide-react";
import { formatDocumentoDisplay } from "@/lib/utils";
import {
  CreateBoletoResponse,
  EmailEnvioInfo,
  ProtestType,
  TipoBoletoManual,
  ParcelaDisponivelDTO,
  ParcelasDisponiveisResponse,
  ParcelaSelecionadaDTO,
} from "@/types/boleto";

interface ContratoCompleto {
  id: number;
  numeroContrato: string;
  valorNegociado?: number;
  valorDevido?: number;
  valorEntrada?: number;
  valorParcela?: number;
  numeroParcelas?: number;
  cliente?: {
    pessoaFisica?: {
      nome?: string;
      cpf?: string;
    };
    pessoaJuridica?: {
      razaoSocial?: string;
      cnpj?: string;
    };
  };
}

interface ContratoDisplay {
  id: number;
  numeroContrato: string;
  clienteNome: string;
  clienteDocumento: string;
  valorNegociado?: number;
  valorParcela?: number;
}

interface NovoBoletoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NovoBoletoModal({
  isOpen,
  onClose,
  onSuccess,
}: NovoBoletoModalProps) {
  const [contratosRaw, setContratosRaw] = useState<ContratoCompleto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContrato, setSelectedContrato] =
    useState<ContratoDisplay | null>(null);
  const [showContratoDropdown, setShowContratoDropdown] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailInfo, setEmailInfo] = useState<EmailEnvioInfo | null>(null);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [createdBoletoId, setCreatedBoletoId] = useState<number | null>(null);

  // Form fields
  const [valorNominal, setValorNominal] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [dataVencimentoDisplay, setDataVencimentoDisplay] = useState("");
  const [dataVencimentoError, setDataVencimentoError] = useState("");
  const [clientNumber, setClientNumber] = useState("");

  // Data mínima (hoje)
  const hoje = new Date().toISOString().split("T")[0];

  const handleDataVencimentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
    let masked = digits.substring(0, 2);
    if (digits.length >= 3) masked += "/" + digits.substring(2, 4);
    if (digits.length >= 5) masked += "/" + digits.substring(4, 8);
    setDataVencimentoDisplay(masked);

    if (digits.length === 8) {
      const iso = `${digits.substring(4, 8)}-${digits.substring(2, 4)}-${digits.substring(0, 2)}`;
      setDataVencimento(iso);
      if (iso < hoje) {
        setDataVencimentoError("A data de vencimento não pode ser no passado");
      } else {
        setDataVencimentoError("");
      }
    } else {
      setDataVencimento("");
      setDataVencimentoError("");
    }
  };

  // Tipo de boleto manual (novo)
  const [tipoBoletoManual, setTipoBoletoManual] =
    useState<TipoBoletoManual>("AVULSO");
  const [parcelasDisponiveis, setParcelasDisponiveis] =
    useState<ParcelasDisponiveisResponse | null>(null);
  const [parcelasSelecionadas, setParcelasSelecionadas] = useState<
    ParcelaDisponivelDTO[]
  >([]);
  const [loadingParcelas, setLoadingParcelas] = useState(false);
  const [valorManual, setValorManual] = useState(false); // Toggle para valor manual

  // Advanced fields
  const [finePercentage, setFinePercentage] = useState("");
  const [interestPercentage, setInterestPercentage] = useState("");
  const [messages, setMessages] = useState<string[]>([""]);

  // Protest fields
  const [habilitarProtesto, setHabilitarProtesto] = useState(false);
  const [protestType, setProtestType] = useState<ProtestType>("DIAS_UTEIS");
  const [protestQuantityDays, setProtestQuantityDays] = useState<number>(3);

  useEffect(() => {
    if (isOpen) {
      fetchContratos();
    }
  }, [isOpen]);

  // Buscar parcelas disponíveis quando selecionar contrato e tipo
  useEffect(() => {
    if (
      selectedContrato &&
      (tipoBoletoManual === "RENEGOCIACAO" || tipoBoletoManual === "ANTECIPACAO")
    ) {
      fetchParcelasDisponiveis(selectedContrato.id);
    } else {
      setParcelasDisponiveis(null);
      setParcelasSelecionadas([]);
    }
  }, [selectedContrato, tipoBoletoManual]);

  // Atualizar valor quando parcelas são selecionadas (apenas se não for valor manual)
  useEffect(() => {
    if (parcelasSelecionadas.length > 0 && !valorManual) {
      const valorTotal = parcelasSelecionadas.reduce(
        (sum, p) => sum + p.valorOriginal,
        0
      );
      setValorNominal(valorTotal.toFixed(2));
    }
  }, [parcelasSelecionadas, valorManual]);

  // Calcular valor total das parcelas selecionadas
  const valorTotalParcelas = useMemo(() => {
    return parcelasSelecionadas.reduce((sum, p) => sum + p.valorOriginal, 0);
  }, [parcelasSelecionadas]);

  const fetchContratos = async () => {
    try {
      const token = localStorage.getItem("token");
      const usuarioId = localStorage.getItem("usuarioId");

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api"
        }/Contrato`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Usuario-Id": usuarioId || "1",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setContratosRaw(data);
      }
    } catch (error) {
      console.error("Erro ao buscar contratos:", error);
    }
  };

  const fetchParcelasDisponiveis = async (contratoId: number) => {
    setLoadingParcelas(true);
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api"
        }/Boleto/contrato/${contratoId}/parcelas-disponiveis`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data: ParcelasDisponiveisResponse = await response.json();
        setParcelasDisponiveis(data);
      } else {
        console.error("Erro ao buscar parcelas disponíveis");
        setParcelasDisponiveis(null);
      }
    } catch (error) {
      console.error("Erro ao buscar parcelas disponíveis:", error);
      setParcelasDisponiveis(null);
    } finally {
      setLoadingParcelas(false);
    }
  };

  // Transformar contratos raw em formato de exibição
  const contratos: ContratoDisplay[] = contratosRaw.map((c) => {
    const clienteNome =
      c.cliente?.pessoaFisica?.nome ||
      c.cliente?.pessoaJuridica?.razaoSocial ||
      "Cliente não identificado";

    const clienteDocumento =
      formatDocumentoDisplay(
        c.cliente?.pessoaFisica?.cpf || c.cliente?.pessoaJuridica?.cnpj
      ) || "Sem documento";

    let valorTotal = c.valorNegociado || c.valorDevido;

    if (!valorTotal && c.valorEntrada && c.valorParcela && c.numeroParcelas) {
      valorTotal = c.valorEntrada + c.valorParcela * c.numeroParcelas;
    } else if (!valorTotal && c.valorParcela && c.numeroParcelas) {
      valorTotal = c.valorParcela * c.numeroParcelas;
    }

    return {
      id: c.id,
      numeroContrato: c.numeroContrato || `CONT-${c.id}`,
      clienteNome,
      clienteDocumento,
      valorNegociado: valorTotal,
      valorParcela: c.valorParcela,
    };
  });

  const filteredContratos = contratos.filter((c) => {
    const search = searchTerm.toLowerCase().replace(/[^\w]/g, "");
    const numeroContrato = c?.numeroContrato?.toLowerCase() || "";
    const clienteNome = c?.clienteNome?.toLowerCase() || "";
    const clienteDocumento = (c?.clienteDocumento || "").replace(/[^\w]/g, "");

    return (
      numeroContrato.includes(searchTerm.toLowerCase()) ||
      clienteNome.includes(searchTerm.toLowerCase()) ||
      clienteDocumento.includes(search)
    );
  });

  // Parcelas a exibir baseado no tipo selecionado
  const parcelasParaExibir = useMemo(() => {
    if (!parcelasDisponiveis) return [];
    if (tipoBoletoManual === "RENEGOCIACAO") {
      return parcelasDisponiveis.parcelasRenegociacao;
    }
    if (tipoBoletoManual === "ANTECIPACAO") {
      return parcelasDisponiveis.parcelasAntecipacao;
    }
    return [];
  }, [parcelasDisponiveis, tipoBoletoManual]);

  const handleToggleParcela = (parcela: ParcelaDisponivelDTO) => {
    const isSelected = parcelasSelecionadas.some(
      (p) => p.numeroParcela === parcela.numeroParcela
    );
    if (isSelected) {
      setParcelasSelecionadas(
        parcelasSelecionadas.filter(
          (p) => p.numeroParcela !== parcela.numeroParcela
        )
      );
    } else {
      setParcelasSelecionadas([...parcelasSelecionadas, parcela]);
    }
  };

  const handleSelectAll = () => {
    if (parcelasSelecionadas.length === parcelasParaExibir.length) {
      setParcelasSelecionadas([]);
    } else {
      setParcelasSelecionadas([...parcelasParaExibir]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedContrato) {
      setError("Selecione um contrato");
      return;
    }

    if (!valorNominal || !dataVencimento) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    // Validar data de vencimento não pode ser no passado
    if (dataVencimento < hoje) {
      setError("A data de vencimento não pode ser no passado");
      setDataVencimentoError("A data de vencimento não pode ser no passado");
      return;
    }

    // Validar seleção de parcelas para renegociação/antecipação
    if (
      (tipoBoletoManual === "RENEGOCIACAO" ||
        tipoBoletoManual === "ANTECIPACAO") &&
      parcelasSelecionadas.length === 0
    ) {
      setError(
        `Selecione pelo menos uma parcela para ${
          tipoBoletoManual === "RENEGOCIACAO" ? "renegociar" : "antecipar"
        }`
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const payload: any = {
        contratoId: selectedContrato.id,
        nominalValue: parseFloat(valorNominal.replace(",", ".")),
        dueDate: dataVencimento,
        tipoBoletoManual: tipoBoletoManual,
      };

      // Adicionar parcelas selecionadas se não for avulso
      if (
        tipoBoletoManual !== "AVULSO" &&
        parcelasSelecionadas.length > 0
      ) {
        payload.parcelasSelecionadas = parcelasSelecionadas.map((p) => ({
          boletoId: p.boletoId,
          numeroParcela: p.numeroParcela,
          valorOriginal: p.valorOriginal,
          vencimentoOriginal: p.vencimentoOriginal,
        }));
      }

      if (clientNumber) payload.clientNumber = clientNumber;
      if (finePercentage) payload.finePercentage = parseFloat(finePercentage);
      if (interestPercentage)
        payload.interestPercentage = parseFloat(interestPercentage);

      const validMessages = messages.filter((m) => m.trim());
      if (validMessages.length > 0) payload.messages = validMessages;

      if (
        habilitarProtesto &&
        protestType &&
        protestType !== "SEM_PROTESTO" &&
        protestType !== "NAO_PROTESTAR"
      ) {
        payload.protestType = protestType;
        payload.protestQuantityDays = protestQuantityDays;
      }

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api"
        }/Boleto`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const data: CreateBoletoResponse = await response.json();
        setCreatedBoletoId(data.boleto?.id || null);
        setEmailInfo(data.email || null);
        setShowSuccessScreen(true);
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.mensagem || "Erro ao criar boleto");
      }
    } catch (error) {
      console.error("Erro ao criar boleto:", error);
      setError("Erro ao criar boleto. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedContrato(null);
    setSearchTerm("");
    setValorNominal("");
    setDataVencimento("");
    setDataVencimentoError("");
    setClientNumber("");
    setFinePercentage("");
    setInterestPercentage("");
    setMessages([""]);
    setShowAdvanced(false);
    setHabilitarProtesto(false);
    setProtestType("DIAS_UTEIS");
    setProtestQuantityDays(3);
    setError("");
    setEmailInfo(null);
    setShowSuccessScreen(false);
    setCreatedBoletoId(null);
    setTipoBoletoManual("AVULSO");
    setParcelasDisponiveis(null);
    setParcelasSelecionadas([]);
    setValorManual(false);
    onClose();
  };

  const renderEmailFeedback = () => {
    if (!emailInfo) return null;

    if (emailInfo.enviado === true) {
      return (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
          <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-400">
              Email enviado com sucesso!
            </p>
            <p className="text-sm text-green-300/80">
              Boleto enviado para: {emailInfo.destino}
            </p>
          </div>
        </div>
      );
    }

    if (emailInfo.enviado === false && !emailInfo.destino && emailInfo.erro) {
      return (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-400">
              Cliente sem email cadastrado
            </p>
            <p className="text-sm text-amber-300/80">
              O boleto foi gerado, mas não foi possível enviar por email.
              Atualize o cadastro do cliente para envio automático.
            </p>
          </div>
        </div>
      );
    }

    if (emailInfo.enviado === false && emailInfo.erro) {
      return (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-400">Erro ao enviar email</p>
            <p className="text-sm text-red-300/80">{emailInfo.erro}</p>
            {emailInfo.destino && (
              <p className="text-sm text-red-300/60 mt-1">
                Destino: {emailInfo.destino}
              </p>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  const addMessage = () => {
    if (messages.length < 5) {
      setMessages([...messages, ""]);
    }
  };

  const removeMessage = (index: number) => {
    setMessages(messages.filter((_, i) => i !== index));
  };

  const updateMessage = (index: number, value: string) => {
    const newMessages = [...messages];
    newMessages[index] = value;
    setMessages(newMessages);
  };

  const getTipoLabel = (tipo: TipoBoletoManual) => {
    switch (tipo) {
      case "RENEGOCIACAO":
        return "Renegociação";
      case "ANTECIPACAO":
        return "Antecipação";
      case "AVULSO":
        return "Avulso";
    }
  };

  // Estado para verificar se está no cliente (para Portal)
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-amber-400 to-amber-600 p-6 rounded-t-2xl flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold text-neutral-950">
                Novo Boleto
              </h2>
              <p className="text-sm text-neutral-800 mt-1">
                Criar boleto de renegociação, antecipação ou avulso
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-black/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-neutral-950" />
            </button>
          </div>

          {/* Tela de Sucesso */}
          {showSuccessScreen ? (
            <div className="p-6 space-y-6">
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-100 mb-2">
                  Boleto Criado com Sucesso!
                </h3>
                {createdBoletoId && (
                  <p className="text-neutral-400">Boleto #{createdBoletoId}</p>
                )}
                <p className="text-sm text-amber-400 mt-2">
                  Tipo: {getTipoLabel(tipoBoletoManual)}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-amber-400" />
                  Status do Envio por Email
                </h4>
                {renderEmailFeedback()}
                {emailInfo === null && (
                  <div className="flex items-center gap-3 p-4 bg-neutral-800/50 border border-neutral-700 rounded-xl">
                    <Mail className="w-6 h-6 text-neutral-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-neutral-400">
                        Envio automático desabilitado
                      </p>
                      <p className="text-sm text-neutral-500">
                        O envio automático de email está desabilitado nas
                        configurações.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-neutral-700">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-900 rounded-lg font-semibold hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/20"
                >
                  Fechar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Tipo de Boleto Manual */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-100 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  Tipo de Boleto
                </h3>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipoBoletoManual("RENEGOCIACAO")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      tipoBoletoManual === "RENEGOCIACAO"
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-neutral-700 bg-neutral-800/30 hover:border-neutral-600"
                    }`}
                  >
                    <RefreshCw
                      className={`w-6 h-6 mx-auto mb-2 ${
                        tipoBoletoManual === "RENEGOCIACAO"
                          ? "text-amber-400"
                          : "text-neutral-400"
                      }`}
                    />
                    <p
                      className={`font-medium text-sm ${
                        tipoBoletoManual === "RENEGOCIACAO"
                          ? "text-amber-400"
                          : "text-neutral-300"
                      }`}
                    >
                      Renegociação
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Parcelas em atraso
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoBoletoManual("ANTECIPACAO")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      tipoBoletoManual === "ANTECIPACAO"
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-neutral-700 bg-neutral-800/30 hover:border-neutral-600"
                    }`}
                  >
                    <FastForward
                      className={`w-6 h-6 mx-auto mb-2 ${
                        tipoBoletoManual === "ANTECIPACAO"
                          ? "text-blue-400"
                          : "text-neutral-400"
                      }`}
                    />
                    <p
                      className={`font-medium text-sm ${
                        tipoBoletoManual === "ANTECIPACAO"
                          ? "text-blue-400"
                          : "text-neutral-300"
                      }`}
                    >
                      Antecipação
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Parcelas futuras
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoBoletoManual("AVULSO")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      tipoBoletoManual === "AVULSO"
                        ? "border-green-500 bg-green-500/10"
                        : "border-neutral-700 bg-neutral-800/30 hover:border-neutral-600"
                    }`}
                  >
                    <FileText
                      className={`w-6 h-6 mx-auto mb-2 ${
                        tipoBoletoManual === "AVULSO"
                          ? "text-green-400"
                          : "text-neutral-400"
                      }`}
                    />
                    <p
                      className={`font-medium text-sm ${
                        tipoBoletoManual === "AVULSO"
                          ? "text-green-400"
                          : "text-neutral-300"
                      }`}
                    >
                      Avulso
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Acordo especial
                    </p>
                  </button>
                </div>
              </div>

              {/* Informações Obrigatórias */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-100 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  Informações do Boleto
                </h3>

                {/* Contrato */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Contrato *{" "}
                    <span className="text-neutral-500 font-normal">
                      (busque por número, cliente ou CPF/CNPJ)
                    </span>
                  </label>
                  <div className="relative">
                    <div
                      onClick={() =>
                        setShowContratoDropdown(!showContratoDropdown)
                      }
                      className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 cursor-pointer flex items-center justify-between hover:bg-neutral-800/70 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-neutral-500" />
                        <span
                          className={
                            selectedContrato
                              ? "text-neutral-100"
                              : "text-neutral-500"
                          }
                        >
                          {selectedContrato
                            ? `${selectedContrato.numeroContrato} - ${selectedContrato.clienteNome}`
                            : "Digite para buscar..."}
                        </span>
                      </div>
                      <ChevronDown className="w-5 h-5 text-neutral-500" />
                    </div>

                    {showContratoDropdown && (
                      <div className="absolute z-10 w-full mt-2 bg-neutral-900/95 backdrop-blur-xl border border-neutral-700 rounded-lg shadow-2xl shadow-black/50 max-h-60 overflow-y-auto">
                        <div className="p-2">
                          <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700 text-neutral-100 placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredContratos.map((contrato) => (
                            <div
                              key={contrato.id}
                              onClick={() => {
                                setSelectedContrato(contrato);
                                setShowContratoDropdown(false);
                                setSearchTerm("");
                                setParcelasSelecionadas([]);
                                if (
                                  tipoBoletoManual === "AVULSO" &&
                                  contrato.valorParcela !== undefined &&
                                  contrato.valorParcela !== null
                                ) {
                                  setValorNominal(
                                    contrato.valorParcela.toFixed(2)
                                  );
                                } else {
                                  setValorNominal("");
                                }
                              }}
                              className="px-4 py-3 hover:bg-neutral-800/50 cursor-pointer border-b border-neutral-800 last:border-0 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-neutral-100">
                                    {contrato.numeroContrato}
                                  </p>
                                  <p className="text-sm text-neutral-400">
                                    {contrato.clienteNome}
                                  </p>
                                  <p className="text-xs text-neutral-500">
                                    {contrato.clienteDocumento}
                                  </p>
                                </div>
                                {contrato.valorNegociado && (
                                  <div className="ml-3 text-right">
                                    <p className="text-xs text-neutral-500">
                                      Valor Total
                                    </p>
                                    <p className="text-sm font-semibold text-amber-400">
                                      {new Intl.NumberFormat("pt-BR", {
                                        style: "currency",
                                        currency: "BRL",
                                      }).format(contrato.valorNegociado)}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {filteredContratos.length === 0 && (
                            <p className="px-4 py-3 text-neutral-500 text-center">
                              Nenhum contrato encontrado
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Seleção de Parcelas (para Renegociação/Antecipação) */}
                {selectedContrato &&
                  (tipoBoletoManual === "RENEGOCIACAO" ||
                    tipoBoletoManual === "ANTECIPACAO") && (
                    <div className="mb-4 p-4 bg-neutral-800/30 border border-neutral-700/50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                          {tipoBoletoManual === "RENEGOCIACAO" ? (
                            <>
                              <RefreshCw className="w-4 h-4 text-amber-400" />
                              Parcelas para Renegociar
                            </>
                          ) : (
                            <>
                              <FastForward className="w-4 h-4 text-blue-400" />
                              Parcelas para Antecipar
                            </>
                          )}
                        </h4>
                        {parcelasParaExibir.length > 0 && (
                          <button
                            type="button"
                            onClick={handleSelectAll}
                            className="text-xs text-amber-400 hover:text-amber-300"
                          >
                            {parcelasSelecionadas.length ===
                            parcelasParaExibir.length
                              ? "Desmarcar todas"
                              : "Selecionar todas"}
                          </button>
                        )}
                      </div>

                      {loadingParcelas ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                          <span className="ml-2 text-neutral-400">
                            Carregando parcelas...
                          </span>
                        </div>
                      ) : parcelasParaExibir.length === 0 ? (
                        <div className="text-center py-6">
                          <p className="text-neutral-500">
                            {tipoBoletoManual === "RENEGOCIACAO"
                              ? "Nenhuma parcela em atraso encontrada"
                              : "Nenhuma parcela futura disponível"}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {parcelasParaExibir.map((parcela) => {
                            const isSelected = parcelasSelecionadas.some(
                              (p) => p.numeroParcela === parcela.numeroParcela
                            );
                            return (
                              <label
                                key={parcela.numeroParcela}
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                  isSelected
                                    ? "bg-amber-500/10 border border-amber-500/30"
                                    : "bg-neutral-800/30 border border-neutral-700/30 hover:bg-neutral-800/50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleParcela(parcela)}
                                  className="w-4 h-4 rounded border-neutral-600 text-amber-500 focus:ring-amber-500/50"
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-neutral-200">
                                    Parcela {parcela.numeroParcela}
                                  </p>
                                  <p className="text-xs text-neutral-500">
                                    Venc:{" "}
                                    {new Date(
                                      parcela.vencimentoOriginal
                                    ).toLocaleDateString("pt-BR")}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-amber-400">
                                    {new Intl.NumberFormat("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    }).format(parcela.valorOriginal)}
                                  </p>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded ${
                                      parcela.status === "BAIXADO_NAO_PAGO"
                                        ? "bg-red-500/20 text-red-400"
                                        : "bg-blue-500/20 text-blue-400"
                                    }`}
                                  >
                                    {parcela.status === "BAIXADO_NAO_PAGO"
                                      ? "Em atraso"
                                      : "Futura"}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {parcelasSelecionadas.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-neutral-700/50 flex items-center justify-between">
                          <span className="text-sm text-neutral-400">
                            {parcelasSelecionadas.length} parcela(s) selecionada(s)
                          </span>
                          <span className="text-sm font-semibold text-amber-400">
                            Total:{" "}
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(
                              parcelasSelecionadas.reduce(
                                (sum, p) => sum + p.valorOriginal,
                                0
                              )
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                {/* Toggle para valor manual (quando há parcelas selecionadas) */}
                {parcelasSelecionadas.length > 0 && (
                  <div 
                    className="flex items-center justify-between p-3 bg-neutral-800/30 border border-neutral-700/50 rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-amber-400" />
                      <span className="text-sm text-neutral-300">
                        Valor automático:{" "}
                        <strong className="text-amber-400">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(valorTotalParcelas)}
                        </strong>
                      </span>
                    </div>
                    <label 
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs text-neutral-400">
                        {valorManual ? "Valor manual" : "Valor automático"}
                      </span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={valorManual}
                          onChange={(e) => {
                            e.stopPropagation();
                            setValorManual(e.target.checked);
                            if (!e.target.checked) {
                              // Voltar ao valor automático
                              setValorNominal(valorTotalParcelas.toFixed(2));
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="sr-only"
                        />
                        <div
                          className={`w-9 h-5 rounded-full transition-colors ${
                            valorManual ? "bg-amber-500" : "bg-neutral-600"
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                              valorManual ? "translate-x-4" : "translate-x-0"
                            }`}
                          ></div>
                        </div>
                      </div>
                    </label>
                  </div>
                )}

                {/* Valor e Data */}
                <div className="grid grid-cols-2 gap-4" onClick={(e) => e.stopPropagation()}>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Valor do Boleto (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={valorNominal}
                      onChange={(e) => setValorNominal(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      placeholder="0,00"
                      disabled={parcelasSelecionadas.length > 0 && !valorManual}
                      className={`w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 text-neutral-100 placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 ${
                        parcelasSelecionadas.length > 0 && !valorManual
                          ? "opacity-60 cursor-not-allowed"
                          : ""
                      }`}
                      required
                    />
                    {parcelasSelecionadas.length > 0 && valorManual && (
                      <p className="mt-1 text-xs text-amber-400">
                        ✓ Valor das parcelas:{" "}
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(valorTotalParcelas)}
                        {" - Você pode aplicar descontos"}
                      </p>
                    )}
                    {parcelasSelecionadas.length > 0 && !valorManual && (
                      <p className="mt-1 text-xs text-neutral-500">
                        Ative &quot;Valor manual&quot; para editar
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Data de Vencimento *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={dataVencimentoDisplay}
                      onChange={handleDataVencimentoChange}
                      placeholder="DD/MM/AAAA"
                      maxLength={10}
                      className={`w-full px-4 py-3 bg-neutral-800/50 border text-neutral-100 placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 ${
                        dataVencimentoError
                          ? "border-red-500"
                          : "border-neutral-700"
                      }`}
                      required
                    />
                    {dataVencimentoError && (
                      <p className="mt-1 text-xs text-red-400">
                        {dataVencimentoError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Seu Número */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Seu Número (Opcional)
                  </label>
                  <input
                    type="text"
                    value={clientNumber}
                    onChange={(e) => setClientNumber(e.target.value)}
                    placeholder="Número de referência do cliente"
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 text-neutral-100 placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                  />
                </div>
              </div>

              {/* Opções Avançadas */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium transition-colors"
                >
                  <Plus
                    className={`w-5 h-5 transition-transform ${
                      showAdvanced ? "rotate-45" : ""
                    }`}
                  />
                  Mostrar opções avançadas
                </button>

                {showAdvanced && (
                  <div className="mt-4 space-y-4 p-4 bg-neutral-800/30 border border-neutral-700/50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                          Multa (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={finePercentage}
                          onChange={(e) => setFinePercentage(e.target.value)}
                          placeholder="2.00"
                          className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 text-neutral-100 placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                          Juros (% ao mês)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={interestPercentage}
                          onChange={(e) =>
                            setInterestPercentage(e.target.value)
                          }
                          placeholder="1.00"
                          className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 text-neutral-100 placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                        />
                      </div>
                    </div>

                    {/* Configurações de Protesto */}
                    <div className="border-t border-neutral-700/50 pt-4 mt-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Gavel className="w-5 h-5 text-amber-400" />
                        <h4 className="text-sm font-semibold text-neutral-200">
                          Configurações de Protesto
                        </h4>
                      </div>

                      <div className="mb-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={habilitarProtesto}
                              onChange={(e) =>
                                setHabilitarProtesto(e.target.checked)
                              }
                              className="sr-only"
                            />
                            <div
                              className={`w-11 h-6 rounded-full transition-colors ${
                                habilitarProtesto
                                  ? "bg-amber-500"
                                  : "bg-neutral-600"
                              }`}
                            >
                              <div
                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
                                  habilitarProtesto
                                    ? "translate-x-5"
                                    : "translate-x-0"
                                }`}
                              ></div>
                            </div>
                          </div>
                          <span className="text-sm text-neutral-300 group-hover:text-neutral-100 transition-colors">
                            Habilitar protesto automático
                          </span>
                        </label>
                      </div>

                      {habilitarProtesto && (
                        <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Tipo de Contagem
                              </label>
                              <select
                                value={protestType}
                                onChange={(e) =>
                                  setProtestType(e.target.value as ProtestType)
                                }
                                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 text-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 appearance-none cursor-pointer"
                              >
                                <option value="DIAS_UTEIS">Dias Úteis</option>
                                <option value="DIAS_CORRIDOS">
                                  Dias Corridos
                                </option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Dias para Protestar
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={99}
                                value={protestQuantityDays}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (value >= 1 && value <= 99) {
                                    setProtestQuantityDays(value);
                                  }
                                }}
                                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 text-neutral-100 placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                              />
                            </div>
                          </div>

                          <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                            <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-200/90">
                              O boleto será enviado automaticamente para
                              protesto em cartório após{" "}
                              <strong>{protestQuantityDays}</strong>{" "}
                              {protestType === "DIAS_UTEIS"
                                ? "dias úteis"
                                : "dias corridos"}{" "}
                              do vencimento, caso não seja pago.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Mensagens */}
                    <div className="border-t border-neutral-700/50 pt-4 mt-4">
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Mensagens no Boleto
                      </label>
                      {messages.map((msg, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={msg}
                            onChange={(e) =>
                              updateMessage(index, e.target.value)
                            }
                            placeholder={`Mensagem ${index + 1}`}
                            maxLength={80}
                            className="flex-1 px-4 py-2 bg-neutral-800/50 border border-neutral-700 text-neutral-100 placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                          />
                          {messages.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMessage(index)}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Minus className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                      {messages.length < 5 && (
                        <button
                          type="button"
                          onClick={addMessage}
                          className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          + Adicionar mensagem
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-neutral-700">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 bg-neutral-800/50 border border-neutral-700 text-neutral-300 rounded-lg font-medium hover:bg-neutral-800/70 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-900 rounded-lg font-semibold hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Criando..." : "Criar Boleto"}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  // Usar Portal para renderizar no body (evita problemas de z-index com stacking context)
  if (mounted && typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
