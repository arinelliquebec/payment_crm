// src/components/forms/ContratoForm.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Save,
  AlertCircle,
  FileText,
  Users,
  Calendar,
  MessageSquare,
  Loader2,
  FolderOpen,
  Briefcase,
  Target,
  Percent,
  DollarSign,
  CreditCard,
  Clock,
  Paperclip,
  AlertTriangle,
} from "lucide-react";
import { useForm } from "@/contexts/FormContext";
import ClientePickerModal from "@/components/ClientePickerModal";
import {
  Contrato,
  CreateContratoDTO,
  UpdateContratoDTO,
  Cliente,
  Consultor,
  Parceiro,
  SituacaoContratoOptions,
  SituacaoContrato,
  TipoServicoOptions,
} from "@/types/api";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useParceiros } from "@/hooks/useParceiros";

interface ContratoFormProps {
  contrato?: Contrato | null;
  clientes: Cliente[];
  consultores: Consultor[];
  contratos: Contrato[];
  onSubmit: (
    data: CreateContratoDTO | Partial<UpdateContratoDTO>
  ) => Promise<void>;
  onCancel: () => void;
  initialClienteId?: number;
}

export default function ContratoForm({
  contrato,
  clientes,
  consultores,
  contratos,
  onSubmit,
  onCancel,
  initialClienteId,
}: ContratoFormProps) {
  const { isFormOpen } = useForm();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ordenar consultores alfabeticamente por nome
  const consultoresOrdenados = [...consultores].sort((a, b) => {
    const nomeA = (a.pessoaFisica?.nome || a.nome || "").toLowerCase();
    const nomeB = (b.pessoaFisica?.nome || b.nome || "").toLowerCase();
    return nomeA.localeCompare(nomeB, "pt-BR");
  });

  // Função para obter estado inicial limpo
  const getInitialFormData = (): CreateContratoDTO => {
    // Definir data próximo contato como 3 dias no futuro por padrão
    const proximoContato = new Date();
    proximoContato.setDate(proximoContato.getDate() + 3);

    return {
      clienteId: initialClienteId || 0,
      consultorId: 0,
      parceiroId: undefined,
      situacao: "Leed" as SituacaoContrato,
      dataUltimoContato: new Date().toISOString().split("T")[0],
      dataProximoContato: proximoContato.toISOString().split("T")[0],
      valorDevido: 0,
      valorNegociado: undefined,
      observacoes: "",
      // Novos campos SEMPRE LIMPOS para novo contrato
      numeroPasta: "",
      dataFechamentoContrato: "",
      tipoServico: "",
      objetoContrato: "",
      comissao: undefined,
      valorEntrada: undefined,
      valorParcela: undefined,
      numeroParcelas: undefined,
      primeiroVencimento: "",
      anexoDocumento: "",
      pendencias: "",
    };
  };

  const [formData, setFormData] = useState<CreateContratoDTO>({
    ...getInitialFormData(),
    parceiroId: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showClientePicker, setShowClientePicker] = useState(false);
  const [hasParceiro, setHasParceiro] = useState(false);
  const [parcelasIndeterminadas, setParcelasIndeterminadas] = useState(false);

  // Usar hook de parceiros
  const {
    parceiros,
    loading: loadingParceiros,
    error: errorParceiros,
    fetchParceiros,
  } = useParceiros();
  // Estados controlados para inputs de moeda (permite digitação livre e parse no blur/submit)
  const [valorDevidoText, setValorDevidoText] = useState<string>("");
  const [valorNegociadoText, setValorNegociadoText] = useState<string>("");
  const [comissaoText, setComissaoText] = useState<string>("");
  const [valorEntradaText, setValorEntradaText] = useState<string>("");
  const [valorParcelaText, setValorParcelaText] = useState<string>("");
  // Estado para armazenar o nome do arquivo PDF (para exibição)
  const [nomeArquivoPDF, setNomeArquivoPDF] = useState<string>("");

  // Função para converter File para Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remover o prefixo "data:application/pdf;base64," se existir
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Função para resetar completamente o formulário
  const resetForm = () => {
    console.log("🔧 ContratoForm: Resetando formulário completamente");
    setFormData({ ...getInitialFormData(), parceiroId: undefined });
    setValorDevidoText("");
    setValorNegociadoText("");
    setComissaoText("");
    setValorEntradaText("");
    setValorParcelaText("");
    setNomeArquivoPDF("");
    setErrors({});
    setHasParceiro(false);
    setParcelasIndeterminadas(false);
  };

  // Resetar formulário quando o componente for montado sem contrato
  useEffect(() => {
    if (!contrato) {
      resetForm();
    }
  }, []); // Executar apenas uma vez na montagem

  useEffect(() => {
    if (contrato) {
      console.log("🔧 ContratoForm: Recebido contrato para edição:", contrato);

      // Log detalhado de cada campo para identificar nulls
      console.log("🔧 ContratoForm: Análise detalhada dos campos:", {
        id: contrato.id,
        clienteId: contrato.clienteId,
        consultorId: contrato.consultorId,
        situacao: contrato.situacao,
        dataUltimoContato: contrato.dataUltimoContato,
        dataProximoContato: contrato.dataProximoContato,
        valorDevido: contrato.valorDevido,
        valorNegociado: contrato.valorNegociado,
        observacoes: contrato.observacoes,
        numeroPasta: contrato.numeroPasta,
        dataFechamentoContrato: contrato.dataFechamentoContrato,
        tipoServico: contrato.tipoServico,
        objetoContrato: contrato.objetoContrato,
        comissao: contrato.comissao,
        valorEntrada: contrato.valorEntrada,
        valorParcela: contrato.valorParcela,
        numeroParcelas: contrato.numeroParcelas,
        primeiroVencimento: contrato.primeiroVencimento,
        pendencias: contrato.pendencias,
      });
      setFormData({
        clienteId: contrato.clienteId,
        consultorId: contrato.consultorId,
        parceiroId: contrato.parceiroId,
        situacao: contrato.situacao,
        dataUltimoContato: contrato.dataUltimoContato
          ? contrato.dataUltimoContato.split("T")[0]
          : new Date().toISOString().split("T")[0],
        dataProximoContato: contrato.dataProximoContato
          ? contrato.dataProximoContato.split("T")[0]
          : "",
        valorDevido: contrato.valorDevido,
        valorNegociado: contrato.valorNegociado,
        observacoes: contrato.observacoes || "",
        // Novos campos
        numeroPasta: contrato.numeroPasta || "",
        dataFechamentoContrato: contrato.dataFechamentoContrato
          ? contrato.dataFechamentoContrato.split("T")[0]
          : "",
        tipoServico: contrato.tipoServico || "",
        objetoContrato: contrato.objetoContrato || "",
        comissao: contrato.comissao,
        valorEntrada: contrato.valorEntrada,
        valorParcela: contrato.valorParcela,
        numeroParcelas: contrato.numeroParcelas,
        primeiroVencimento: contrato.primeiroVencimento
          ? contrato.primeiroVencimento.split("T")[0]
          : "",
        // Não definir anexoDocumento aqui - será preenchido apenas se houver novo arquivo selecionado
        anexoDocumento: "",
        pendencias: contrato.pendencias || "",
      });
      setHasParceiro(!!contrato.parceiroId);
      setParcelasIndeterminadas(
        !(contrato.numeroParcelas && contrato.numeroParcelas > 0)
      );
      const valorDevidoFormatted = formatCurrencyInput(contrato.valorDevido);
      const valorNegociadoFormatted = formatCurrencyInput(
        contrato.valorNegociado
      );
      const comissaoFormatted = formatCurrencyInput(contrato.comissao);
      const valorEntradaFormatted = formatCurrencyInput(contrato.valorEntrada);
      const valorParcelaFormatted = formatCurrencyInput(contrato.valorParcela);

      console.log("🔧 ContratoForm: Valores formatados:", {
        valorDevido: `${contrato.valorDevido} -> ${valorDevidoFormatted}`,
        valorNegociado: `${contrato.valorNegociado} -> ${valorNegociadoFormatted}`,
        comissao: `${contrato.comissao} -> ${comissaoFormatted}`,
        valorEntrada: `${contrato.valorEntrada} -> ${valorEntradaFormatted}`,
        valorParcela: `${contrato.valorParcela} -> ${valorParcelaFormatted}`,
      });

      setValorDevidoText(valorDevidoFormatted);
      setValorNegociadoText(valorNegociadoFormatted);
      setComissaoText(comissaoFormatted);
      setValorEntradaText(valorEntradaFormatted);
      setValorParcelaText(valorParcelaFormatted);

      // Se houver anexoDocumento existente (nome do arquivo), definir para exibição
      // Não definir no formData pois não temos o arquivo original em Base64
      // O backend manterá o arquivo existente se não enviarmos novo Base64
      if (contrato.anexoDocumento) {
        setNomeArquivoPDF(contrato.anexoDocumento);
      }

      console.log("🔧 ContratoForm: FormData definido:", {
        clienteId: contrato.clienteId,
        consultorId: contrato.consultorId,
        situacao: contrato.situacao,
        valorDevido: contrato.valorDevido,
        valorNegociado: contrato.valorNegociado,
        dataUltimoContato: contrato.dataUltimoContato,
        dataProximoContato: contrato.dataProximoContato,
        observacoes: contrato.observacoes,
        // Novos campos
        tipoServico: contrato.tipoServico,
        dataFechamentoContrato: contrato.dataFechamentoContrato,
        objetoContrato: contrato.objetoContrato,
        numeroPasta: contrato.numeroPasta,
        comissao: contrato.comissao,
        valorEntrada: contrato.valorEntrada,
        valorParcela: contrato.valorParcela,
        numeroParcelas: contrato.numeroParcelas,
        primeiroVencimento: contrato.primeiroVencimento,
        anexoDocumento: contrato.anexoDocumento,
        pendencias: contrato.pendencias,
      });

      console.log("🔧 ContratoForm: Estados de texto definidos:", {
        valorDevidoText: valorDevidoFormatted,
        valorNegociadoText: valorNegociadoFormatted,
        comissaoText: comissaoFormatted,
        valorEntradaText: valorEntradaFormatted,
        valorParcelaText: valorParcelaFormatted,
      });

      // Log específico dos campos mencionados pelo usuário
      console.log("🔧 ContratoForm: Campos específicos para edição:", {
        tipoServico: contrato.tipoServico,
        dataFechamentoContrato: contrato.dataFechamentoContrato,
        valorEntrada: contrato.valorEntrada,
        valorParcela: contrato.valorParcela,
        numeroParcelas: contrato.numeroParcelas,
        primeiroVencimento: contrato.primeiroVencimento,
        comissao: contrato.comissao,
        anexoDocumento: contrato.anexoDocumento,
        pendencias: contrato.pendencias,
      });

      console.log(
        "🔧 ContratoForm: Todos os campos do contrato recebido:",
        contrato
      );
    } else {
      // NOVO CONTRATO: Resetar TODOS os campos para valores em branco/padrão
      console.log(
        "🔧 ContratoForm: Configurando NOVO contrato - limpando todos os campos"
      );

      // Definir data próximo contato como 3 dias no futuro por padrão
      const proximoContato = new Date();
      proximoContato.setDate(proximoContato.getDate() + 3);

      // Resetar formData completamente para novo contrato
      setFormData({
        clienteId: initialClienteId || 0,
        consultorId: 0,
        situacao: "Leed" as SituacaoContrato,
        dataUltimoContato: new Date().toISOString().split("T")[0],
        dataProximoContato: proximoContato.toISOString().split("T")[0],
        valorDevido: 0,
        valorNegociado: undefined,
        observacoes: "",
        // Novos campos LIMPOS
        numeroPasta: "",
        dataFechamentoContrato: "",
        tipoServico: "",
        objetoContrato: "",
        comissao: undefined,
        valorEntrada: undefined,
        valorParcela: undefined,
        numeroParcelas: undefined,
        primeiroVencimento: "",
        anexoDocumento: "",
        pendencias: "",
      });

      // Limpar TODOS os textos de moeda para novo contrato
      setValorDevidoText("");
      setValorNegociadoText("");
      setComissaoText("");
      setValorEntradaText("");
      setValorParcelaText("");
      setNomeArquivoPDF("");
      setParcelasIndeterminadas(false);

      // Limpar erros
      setErrors({});

      console.log(
        "🔧 ContratoForm: Novo contrato configurado - todos os campos limpos"
      );
    }
  }, [contrato, initialClienteId]);

  // Debug: Monitorar mudanças nos valores
  useEffect(() => {
    console.log("🔧 ContratoForm: FormData atual:", {
      valorDevido: formData.valorDevido,
      valorNegociado: formData.valorNegociado,
      dataUltimoContato: formData.dataUltimoContato,
      dataProximoContato: formData.dataProximoContato,
      observacoes: formData.observacoes,
      tipoServico: formData.tipoServico,
      dataFechamentoContrato: formData.dataFechamentoContrato,
      objetoContrato: formData.objetoContrato,
      numeroPasta: formData.numeroPasta,
      comissao: formData.comissao,
      valorEntrada: formData.valorEntrada,
      valorParcela: formData.valorParcela,
      numeroParcelas: formData.numeroParcelas,
      primeiroVencimento: formData.primeiroVencimento,
      anexoDocumento: formData.anexoDocumento,
      pendencias: formData.pendencias,
    });
  }, [
    formData.valorDevido,
    formData.valorNegociado,
    formData.dataUltimoContato,
    formData.dataProximoContato,
    formData.observacoes,
    formData.tipoServico,
    formData.dataFechamentoContrato,
    formData.objetoContrato,
    formData.numeroPasta,
    formData.comissao,
    formData.valorEntrada,
    formData.valorParcela,
    formData.numeroParcelas,
    formData.primeiroVencimento,
    formData.anexoDocumento,
    formData.pendencias,
  ]);

  useEffect(() => {
    console.log("🔧 ContratoForm: Estados de texto atuais:", {
      valorDevidoText,
      valorNegociadoText,
      comissaoText,
      valorEntradaText,
      valorParcelaText,
    });
  }, [
    valorDevidoText,
    valorNegociadoText,
    comissaoText,
    valorEntradaText,
    valorParcelaText,
  ]);

  // Log dos parceiros para debug
  useEffect(() => {
    console.log("🔧 ContratoForm: Parceiros carregados:", parceiros.length);
    console.log("🔧 ContratoForm: Loading parceiros:", loadingParceiros);
    console.log("🔧 ContratoForm: Erro parceiros:", errorParceiros);
  }, [parceiros, loadingParceiros, errorParceiros]);

  // Pré-selecionar automaticamente o consultor ativo do cliente ou o primeiro disponível
  useEffect(() => {
    if (!contrato && formData.consultorId === 0 && consultores.length > 0) {
      // Se há um cliente selecionado, verificar se ele já tem consultor ativo
      if (formData.clienteId && formData.clienteId !== 0) {
        const contratosDoCliente = contratos.filter(
          (c) => c && c.clienteId === formData.clienteId && c.ativo
        );
        const consultorAtivoId = contratosDoCliente.find((contrato) => {
          if (!contrato || !contrato.consultorId) return false;
          const consultorDoContrato = consultores.find(
            (c) => c && c.id && Number(c.id) === Number(contrato.consultorId)
          );
          return consultorDoContrato && consultorDoContrato.ativo;
        })?.consultorId;

        if (consultorAtivoId) {
          setFormData((prev) => ({
            ...prev,
            consultorId: Number(consultorAtivoId),
          }));
          return;
        }
      }

      // Senão, pré-selecionar o primeiro consultor ativo disponível
      const consultorAtivo = consultores.find((c) => c && c.ativo);
      if (consultorAtivo && consultorAtivo.id) {
        setFormData((prev) => ({
          ...prev,
          consultorId: Number(consultorAtivo.id),
        }));
      }
    }
  }, [
    contrato,
    consultores,
    formData.consultorId,
    formData.clienteId,
    contratos,
  ]);

  // Manipular mudança do checkbox de parceiro
  const handleParceiroCheckboxChange = (checked: boolean) => {
    console.log("🔧 ContratoForm: Checkbox parceiro alterado:", checked);
    console.log("🔧 ContratoForm: Parceiros disponíveis:", parceiros.length);
    setHasParceiro(checked);
    if (!checked) {
      // Se desmarcar, limpar o parceiroId
      setFormData((prev) => ({ ...prev, parceiroId: undefined }));
    } else {
      // Se não há parceiros carregados, tentar buscar novamente
      if (parceiros.length === 0) {
        console.log("🔧 ContratoForm: Nenhum parceiro carregado, buscando...");
        fetchParceiros();
      }
    }
  };

  // Manipular seleção de parceiro
  const handleParceiroSelect = (parceiroId: number) => {
    setFormData((prev) => ({
      ...prev,
      parceiroId: parceiroId === 0 ? undefined : parceiroId,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Helper: validação de tamanho máximo para campos de texto
    const validateMaxLength = (
      field: string,
      value: string | undefined,
      max: number,
      label: string
    ) => {
      const len = value?.length ?? 0;
      if (len > max) {
        newErrors[
          field
        ] = `${label} deve ter no máximo ${max} caracteres. Atual: ${len}`;
      }
    };

    // Validar se arrays são válidos
    if (!clientes || !Array.isArray(clientes) || clientes.length === 0) {
      newErrors.general =
        "Nenhum cliente disponível. Por favor, cadastre um cliente primeiro.";
      setErrors(newErrors);
      return false;
    }

    if (
      !consultores ||
      !Array.isArray(consultores) ||
      consultores.length === 0
    ) {
      newErrors.general =
        "Nenhum consultor disponível. Por favor, cadastre um consultor primeiro.";
      setErrors(newErrors);
      return false;
    }

    if (!formData.clienteId || formData.clienteId === 0) {
      newErrors.clienteId = "Cliente é obrigatório";
    }

    if (!formData.consultorId || formData.consultorId === 0) {
      newErrors.consultorId = "Consultor é obrigatório";
    } else {
      // Converter ambos os IDs para números para garantir comparação correta
      const consultorIdNumero = Number(formData.consultorId);

      // Verificar se o consultor selecionado existe na lista
      const consultorSelecionado = consultores.find(
        (c) => c && c.id && Number(c.id) === consultorIdNumero
      );

      // Verificar se o consultor selecionado existe e está ativo
      if (!consultorSelecionado) {
        newErrors.consultorId =
          "Consultor selecionado não encontrado. Por favor, selecione outro consultor.";
      } else if (!consultorSelecionado.ativo) {
        newErrors.consultorId =
          "O consultor selecionado está inativo. Selecione um consultor ativo.";
      }
    }

    if (!formData.situacao) {
      newErrors.situacao = "Situação é obrigatória";
    }

    if (!contrato && !formData.dataUltimoContato) {
      newErrors.dataUltimoContato = "Data do último contato é obrigatória";
    }

    if (!contrato && !formData.dataProximoContato) {
      newErrors.dataProximoContato = "Data do próximo contato é obrigatória";
    } else if (formData.dataProximoContato) {
      const proximoContato = new Date(formData.dataProximoContato);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      // Em edição, permitir data passada para não bloquear contratos antigos/quitados.
      if (!contrato && proximoContato < hoje) {
        newErrors.dataProximoContato =
          "Data do próximo contato deve ser futura";
      }
    }

    // ✅ Validações de tamanho (prevenir erros 400/500 e guiar o usuário)
    validateMaxLength(
      "numeroPasta",
      formData.numeroPasta,
      100,
      "Número da pasta"
    );
    validateMaxLength(
      "tipoServico",
      formData.tipoServico,
      200,
      "Tipo de serviço"
    );
    validateMaxLength("observacoes", formData.observacoes, 1000, "Observações");
    validateMaxLength(
      "objetoContrato",
      formData.objetoContrato,
      1000,
      "Objeto do contrato"
    );
    validateMaxLength("pendencias", formData.pendencias, 2000, "Pendências");

    // ✅ Validações de datas (regra de negócio)
    if (formData.dataFechamentoContrato) {
      const fechamento = new Date(formData.dataFechamentoContrato);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      fechamento.setHours(0, 0, 0, 0);
      if (fechamento > hoje) {
        newErrors.dataFechamentoContrato =
          "A data de fechamento do contrato não pode estar no futuro";
      }
    }

    if (formData.primeiroVencimento && formData.dataFechamentoContrato) {
      const venc = new Date(formData.primeiroVencimento);
      const fechamento = new Date(formData.dataFechamentoContrato);
      venc.setHours(0, 0, 0, 0);
      fechamento.setHours(0, 0, 0, 0);
      if (venc < fechamento) {
        newErrors.primeiroVencimento =
          "A data do primeiro vencimento não pode ser anterior à data de fechamento";
      }
    }

    const parsedDevido = parseCurrencyInput(valorDevidoText || "0", true);
    const parsedNegociado = valorNegociadoText
      ? parseCurrencyInput(valorNegociadoText, true)
      : undefined;
    const parsedEntrada =
      valorEntradaText && valorEntradaText.trim() !== ""
        ? parseCurrencyInput(valorEntradaText, true)
        : undefined;
    const parsedParcela =
      valorParcelaText && valorParcelaText.trim() !== ""
        ? parseCurrencyInput(valorParcelaText, true)
        : undefined;

    // Validar se o parse foi bem-sucedido
    if (isNaN(parsedDevido) || parsedDevido <= 0) {
      newErrors.valorDevido = "Valor devido deve ser maior que zero";
    }

    if (parsedNegociado !== undefined) {
      if (isNaN(parsedNegociado)) {
        newErrors.valorNegociado = "Valor negociado inválido";
      } else if (parsedNegociado < 0) {
        newErrors.valorNegociado = "Valor negociado não pode ser negativo";
      } else if (
        !isNaN(parsedDevido) &&
        parsedDevido > 0 &&
        parsedNegociado > parsedDevido
      ) {
        newErrors.valorNegociado =
          "Valor negociado não pode ser maior que o valor devido";
      }
    }

    if (parsedEntrada !== undefined) {
      if (isNaN(parsedEntrada)) {
        newErrors.valorEntrada = "Valor de entrada inválido";
      } else if (parsedEntrada < 0) {
        newErrors.valorEntrada = "Valor de entrada não pode ser negativo";
      }
    }

    if (parsedParcela !== undefined) {
      if (isNaN(parsedParcela)) {
        newErrors.valorParcela = "Valor da parcela inválido";
      } else if (parsedParcela <= 0) {
        newErrors.valorParcela = "Valor da parcela deve ser maior que zero";
      }
    }

    // Número de parcelas (se preenchido e não indeterminado)
    if (
      formData.numeroParcelas !== undefined &&
      formData.numeroParcelas !== null
    ) {
      if (
        isNaN(Number(formData.numeroParcelas)) ||
        Number(formData.numeroParcelas) <= 0
      ) {
        newErrors.numeroParcelas = "Número de parcelas deve ser maior que zero";
      }
    }

    // Soma (parcelas + entrada) deve bater com o valor negociado quando todos os campos necessários estiverem presentes
    if (
      formData.numeroParcelas !== undefined &&
      formData.numeroParcelas !== null &&
      parsedParcela !== undefined &&
      parsedNegociado !== undefined &&
      !isNaN(parsedParcela) &&
      !isNaN(parsedNegociado) &&
      Number(formData.numeroParcelas) > 0
    ) {
      const totalParcelas = Number(formData.numeroParcelas) * parsedParcela;
      const entrada =
        parsedEntrada && !isNaN(parsedEntrada) ? parsedEntrada : 0;
      const total = totalParcelas + entrada;
      const diff = Math.abs(total - parsedNegociado);
      if (diff > 0.01) {
        newErrors.valorNegociado =
          "A soma das parcelas + entrada não corresponde ao valor negociado";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      // Sincronizar valores numéricos a partir dos textos antes de enviar
      // Validar valores antes de enviar
      const parsedDevido = parseCurrencyInput(valorDevidoText || "0", true);
      if (isNaN(parsedDevido) || parsedDevido <= 0) {
        setErrors({ valorDevido: "Valor devido deve ser maior que zero" });
        setSubmitting(false);
        return;
      }

      const payload: CreateContratoDTO = {
        ...formData,
        // Em edição, enviar undefined quando datas estiverem vazias para evitar erro de parse no backend.
        dataUltimoContato: formData.dataUltimoContato || undefined,
        dataProximoContato: formData.dataProximoContato || undefined,
        valorDevido: parsedDevido,
        valorNegociado:
          valorNegociadoText && valorNegociadoText.trim() !== ""
            ? (() => {
                const parsed = parseCurrencyInput(valorNegociadoText, true);
                return isNaN(parsed) ? undefined : parsed;
              })()
            : undefined,
        comissao:
          comissaoText && comissaoText.trim() !== ""
            ? (() => {
                const parsed = parseCurrencyInput(comissaoText, true);
                return isNaN(parsed) ? undefined : parsed;
              })()
            : undefined,
        valorEntrada:
          valorEntradaText && valorEntradaText.trim() !== ""
            ? (() => {
                const parsed = parseCurrencyInput(valorEntradaText, true);
                return isNaN(parsed) ? undefined : parsed;
              })()
            : undefined,
        valorParcela:
          valorParcelaText && valorParcelaText.trim() !== ""
            ? (() => {
                const parsed = parseCurrencyInput(valorParcelaText, true);
                return isNaN(parsed) ? undefined : parsed;
              })()
            : undefined,
        // Limpar campos opcionais vazios
        numeroPasta: formData.numeroPasta?.trim() || undefined,
        dataFechamentoContrato: formData.dataFechamentoContrato || undefined,
        tipoServico: formData.tipoServico?.trim() || undefined,
        objetoContrato: formData.objetoContrato?.trim() || undefined,
        primeiroVencimento: formData.primeiroVencimento || undefined,
        // Enviar anexoDocumento apenas se houver um novo arquivo selecionado (Base64)
        // Se não houver novo arquivo, não enviar (undefined) para manter o existente no backend
        anexoDocumento:
          nomeArquivoPDF && formData.anexoDocumento
            ? formData.anexoDocumento
            : undefined,
        pendencias: formData.pendencias?.trim() || undefined,
        observacoes: formData.observacoes?.trim() || undefined,
        numeroParcelas: formData.numeroParcelas || undefined,
      };
      await onSubmit(payload);
      onCancel();
    } catch (error: any) {
      console.error("🔧 ContratoForm: Erro ao salvar contrato:", error);

      const status: number | undefined =
        error?.response?.status ?? error?.status ?? undefined;

      // O hook/useContratos agora re-throw preservando response.data (mensagemUsuario/erros)
      let data = error?.response?.data ?? error?.data ?? undefined;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          // manter como string
        }
      }

      const mensagemUsuario =
        (data && typeof data === "object" && (data as any).mensagemUsuario) ||
        (data && typeof data === "object" && (data as any).mensagem) ||
        (data && typeof data === "object" && (data as any).message) ||
        (data && typeof data === "object" && (data as any).title) ||
        (typeof data === "string" ? data : undefined) ||
        error?.message ||
        "Erro ao salvar contrato";

      const normalizeCampo = (campo: string): string => {
        const last = (campo || "").split(".").pop()?.trim() || "";
        if (!last) return "";
        return last.charAt(0).toLowerCase() + last.slice(1);
      };

      const fieldErrors: Record<string, string> = {};
      const errosArray =
        (data && typeof data === "object" && (data as any).erros) || undefined;
      if (Array.isArray(errosArray)) {
        for (const e of errosArray) {
          const campo = typeof e?.campo === "string" ? e.campo : "";
          const msg =
            typeof e?.mensagem === "string" && e.mensagem.trim()
              ? e.mensagem
              : mensagemUsuario;
          const key = normalizeCampo(campo);
          if (key) fieldErrors[key] = msg;
        }
      }

      // Mensagens padrão para status comuns (quando o backend não enviou mensagemUsuario)
      let general = mensagemUsuario as string;
      if (status === 401) general = "Sessão expirada. Faça login novamente.";
      if (status === 403) general = "Você não tem permissão para esta ação.";
      if (status === 0) general = "Erro de conexão. Verifique sua internet.";

      console.error("🔧 ContratoForm: Erro processado:", {
        status,
        general,
        fieldErrors,
        rawData: data,
      });

      setErrors({
        ...fieldErrors,
        general,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Função para formatar valor monetário
  const formatCurrencyInput = (value: number | undefined) => {
    if (value === undefined || value === null) return "";
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Função para fazer parse do valor monetário
  const parseCurrencyInput = (
    value: string,
    allowNaN: boolean = false
  ): number => {
    if (!value || typeof value !== "string") return allowNaN ? NaN : 0;
    // Remove pontos e substitui vírgula por ponto
    const cleanValue = value.replace(/\./g, "").replace(",", ".").trim();
    if (!cleanValue) return allowNaN ? NaN : 0;
    const parsed = parseFloat(cleanValue);
    // Retornar NaN apenas se allowNaN for true (para validação), senão retornar 0
    return isNaN(parsed) ? (allowNaN ? NaN : 0) : parsed;
  };

  // Máscara amigável de moeda pt-BR durante digitação (milhares com ponto e decimais com vírgula)
  const maskCurrencyBR = (text: string): string => {
    if (!text) return "";
    // Retirar tudo que não for dígito ou vírgula
    const only = text.replace(/[^\d,]/g, "");
    const parts = only.split(",");
    const intDigits = parts[0].replace(/\D/g, "");
    const decDigits = (parts[1] || "").replace(/\D/g, "").slice(0, 2);
    if (!intDigits) return decDigits ? `,${decDigits}` : "";
    const intFormatted = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return parts.length > 1 ? `${intFormatted},${decDigits}` : intFormatted;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (name === "valorDevido") {
      setValorDevidoText(maskCurrencyBR(value));
      return;
    } else if (name === "valorNegociado") {
      setValorNegociadoText(maskCurrencyBR(value));
      return;
    } else if (name === "comissao") {
      setComissaoText(maskCurrencyBR(value));
      return;
    } else if (name === "valorEntrada") {
      setValorEntradaText(maskCurrencyBR(value));
      return;
    } else if (name === "valorParcela") {
      setValorParcelaText(maskCurrencyBR(value));
      return;
    } else if (type === "file" && name === "anexoDocumento") {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Validar se é PDF
        if (file.type !== "application/pdf") {
          setErrors((prev) => ({
            ...prev,
            anexoDocumento: "Apenas arquivos PDF são permitidos",
          }));
          return;
        }

        // Validar tamanho (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setErrors((prev) => ({
            ...prev,
            anexoDocumento: "Arquivo deve ter no máximo 10MB",
          }));
          return;
        }

        // Armazenar o nome do arquivo para exibição
        setNomeArquivoPDF(file.name);

        // Converter arquivo para Base64
        fileToBase64(file)
          .then((base64) => {
            setFormData((prev) => ({
              ...prev,
              anexoDocumento: base64,
            }));
            // Limpar erro se houver
            if (errors.anexoDocumento) {
              setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.anexoDocumento;
                return newErrors;
              });
            }
          })
          .catch((error) => {
            console.error("Erro ao converter arquivo para Base64:", error);
            setErrors((prev) => ({
              ...prev,
              anexoDocumento: "Erro ao processar arquivo. Tente novamente.",
            }));
          });
      }
      return;
    } else if (type === "number") {
      // No formulário de contrato, o único campo numérico é numeroParcelas.
      // Mantemos `undefined` quando vazio (para não enviar 0 ao backend).
      const parsed = value === "" ? undefined : Number(value);
      setFormData((prev) => ({
        ...prev,
        [name]:
          value === "" || parsed === undefined || isNaN(parsed)
            ? undefined
            : parsed,
      }));
    } else if (
      name === "consultorId" ||
      name === "clienteId" ||
      name === "parceiroId"
    ) {
      // Converter IDs de select para número
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" || value === "0" ? 0 : Number(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleCurrencyBlur = (
    field:
      | "valorDevido"
      | "valorNegociado"
      | "comissao"
      | "valorEntrada"
      | "valorParcela"
  ) => {
    if (field === "valorDevido") {
      const parsed = parseCurrencyInput(valorDevidoText || "0");
      setFormData((prev) => ({ ...prev, valorDevido: parsed }));
      setValorDevidoText(formatCurrencyInput(parsed));
    } else if (field === "valorNegociado") {
      if (!valorNegociadoText || valorNegociadoText.trim() === "") {
        setFormData((prev) => ({ ...prev, valorNegociado: undefined }));
        setValorNegociadoText("");
        return;
      }
      const parsed = parseCurrencyInput(valorNegociadoText);
      setFormData((prev) => ({ ...prev, valorNegociado: parsed }));
      setValorNegociadoText(formatCurrencyInput(parsed));
    } else if (field === "comissao") {
      if (!comissaoText || comissaoText.trim() === "") {
        setFormData((prev) => ({ ...prev, comissao: undefined }));
        setComissaoText("");
        return;
      }
      const parsed = parseCurrencyInput(comissaoText);
      setFormData((prev) => ({ ...prev, comissao: parsed }));
      setComissaoText(formatCurrencyInput(parsed));
    } else if (field === "valorEntrada") {
      if (!valorEntradaText || valorEntradaText.trim() === "") {
        setFormData((prev) => ({ ...prev, valorEntrada: undefined }));
        setValorEntradaText("");
        return;
      }
      const parsed = parseCurrencyInput(valorEntradaText);
      setFormData((prev) => ({ ...prev, valorEntrada: parsed }));
      setValorEntradaText(formatCurrencyInput(parsed));
    } else if (field === "valorParcela") {
      if (!valorParcelaText || valorParcelaText.trim() === "") {
        setFormData((prev) => ({ ...prev, valorParcela: undefined }));
        setValorParcelaText("");
        return;
      }
      const parsed = parseCurrencyInput(valorParcelaText);
      setFormData((prev) => ({ ...prev, valorParcela: parsed }));
      setValorParcelaText(formatCurrencyInput(parsed));
    }
  };

  const selectedCliente =
    clientes && Array.isArray(clientes)
      ? clientes.find((c) => c && c.id === formData.clienteId) || null
      : null;

  if (!mounted) return null;

  // Validar se há dados necessários antes de renderizar
  const hasRequiredData =
    clientes &&
    Array.isArray(clientes) &&
    clientes.length > 0 &&
    consultores &&
    Array.isArray(consultores) &&
    consultores.length > 0;

  const modalContent = (
    <AnimatePresence>
      {isFormOpen && hasRequiredData && (
        <>
          {/* Overlay */}
          <motion.div
            key="contrato-form-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999]"
            onClick={onCancel}
          />

          {/* Modal */}
          <motion.div
            key="contrato-form-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-[99999] p-4"
          >
            <div className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-800 w-full max-w-5xl max-h-[95vh] overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-neutral-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-lg shadow-amber-500/20">
                      <FileText className="w-5 h-5 text-neutral-900" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gradient-amber">
                        {contrato ? "Editar Contrato" : "Novo Contrato"}
                      </h2>
                      <p className="text-sm text-neutral-400">
                        {contrato
                          ? "Atualize as informações do contrato"
                          : "Preencha os dados para criar um novo contrato"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onCancel}
                    className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6">
                {/* Erro Geral */}
                {errors.general && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <p className="text-sm text-red-300 font-medium">
                        {errors.general}
                      </p>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-6 max-h-[calc(95vh-200px)] overflow-y-auto">
                  {/* Cliente e Consultor */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Cliente *
                      </label>
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setShowClientePicker(true)}
                          className={cn(
                            "w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-800/50 border rounded-lg text-sm text-neutral-100",
                            "hover:bg-neutral-800/50 transition-colors",
                            errors.clienteId
                              ? "border-red-500 bg-red-500/10"
                              : "border-neutral-700 hover:border-neutral-600"
                          )}
                        >
                          <Users className="w-4 h-4 text-neutral-500" />
                          {selectedCliente
                            ? selectedCliente.pessoaFisica?.nome ||
                              selectedCliente.pessoaJuridica?.razaoSocial
                            : "Selecionar cliente (duplo clique)"}
                        </button>
                        {selectedCliente && (
                          <div className="rounded-lg border border-green-500/30 p-4 bg-green-500/10 text-xs text-green-200">
                            <div className="space-y-3">
                              <div>
                                <span className="font-medium text-green-300">
                                  Email:{" "}
                                </span>
                                <span className="text-green-200">
                                  {selectedCliente.pessoaFisica
                                    ?.emailEmpresarial ||
                                    selectedCliente.pessoaJuridica?.email ||
                                    "—"}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-green-300">
                                  CPF/CNPJ:{" "}
                                </span>
                                <span className="text-green-200">
                                  {selectedCliente.pessoaFisica?.cpf ||
                                    selectedCliente.pessoaJuridica?.cnpj ||
                                    "—"}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-green-300">
                                  Telefones:{" "}
                                </span>
                                <div className="mt-1 space-y-1">
                                  {[
                                    selectedCliente.pessoaFisica?.telefone1 ||
                                      selectedCliente.pessoaJuridica?.telefone1,
                                    selectedCliente.pessoaFisica?.telefone2 ||
                                      selectedCliente.pessoaJuridica?.telefone2,
                                    (selectedCliente as any).telefone3 ||
                                      selectedCliente.pessoaJuridica?.telefone3,
                                    (selectedCliente as any).telefone4 ||
                                      selectedCliente.pessoaJuridica?.telefone4,
                                  ]
                                    .filter(Boolean)
                                    .map((telefone, index) => (
                                      <div
                                        key={index}
                                        className="text-green-200"
                                      >
                                        {telefone}
                                      </div>
                                    )) || (
                                    <span className="text-green-200">—</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      {errors.clienteId && (
                        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.clienteId}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Consultor *
                      </label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <select
                          name="consultorId"
                          value={formData.consultorId}
                          onChange={handleInputChange}
                          className={cn(
                            "w-full pl-12 pr-4 py-2.5 bg-neutral-800/50 border rounded-lg text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all",
                            errors.consultorId
                              ? "border-red-500 bg-red-500/10"
                              : "border-neutral-700",
                            "[&>option]:bg-neutral-900 [&>option]:text-neutral-200"
                          )}
                        >
                          <option value={0} className="text-neutral-500">
                            {consultoresOrdenados.length === 0
                              ? "Carregando consultores..."
                              : "Selecione um consultor"}
                          </option>
                          {consultoresOrdenados.map((consultor) => (
                            <option
                              key={consultor.id}
                              value={consultor.id}
                              disabled={!consultor.ativo}
                              className="bg-neutral-900 text-neutral-200"
                            >
                              {consultor.pessoaFisica?.nome || consultor.nome} -{" "}
                              {consultor.filial?.nome || "Filial não informada"}
                              {!consultor.ativo && " (INATIVO)"}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.consultorId && (
                        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.consultorId}
                        </p>
                      )}
                      {/* Mostrar consultor atual do cliente */}
                      {formData.clienteId &&
                        formData.clienteId !== 0 &&
                        !contrato &&
                        (() => {
                          const contratosDoCliente = contratos.filter(
                            (c) => c.clienteId === formData.clienteId && c.ativo
                          );
                          const consultorAtivo = contratosDoCliente.find(
                            (contrato) => {
                              const consultorDoContrato = consultores.find(
                                (c) => c.id === contrato.consultorId
                              );
                              return (
                                consultorDoContrato && consultorDoContrato.ativo
                              );
                            }
                          );

                          if (consultorAtivo) {
                            const consultor = consultores.find(
                              (c) => c.id === consultorAtivo.consultorId
                            );
                            return (
                              <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                <p className="text-xs text-amber-300 font-medium">
                                  ℹ️ Consultor atual:{" "}
                                  {consultor?.pessoaFisica?.nome ||
                                    consultor?.nome ||
                                    "Consultor"}
                                </p>
                                <p className="text-xs text-amber-400 mt-1">
                                  Este cliente já possui um consultor ativo.
                                  Novos contratos serão atribuídos ao mesmo
                                  consultor.
                                </p>
                              </div>
                            );
                          }
                          return null;
                        })()}
                    </div>

                    {/* Checkbox de Parceiro */}
                    <div className="mt-4">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasParceiro}
                          onChange={(e) =>
                            handleParceiroCheckboxChange(e.target.checked)
                          }
                          className="w-4 h-4 text-amber-500 bg-neutral-800 border-neutral-600 rounded focus:ring-amber-500 focus:ring-2"
                        />
                        <span className="text-sm font-medium text-neutral-300">
                          Há parceiro neste contrato?
                        </span>
                      </label>
                    </div>

                    {/* Seletor de Parceiro */}
                    {hasParceiro && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                          Parceiro
                        </label>
                        <div className="relative">
                          <select
                            value={formData.parceiroId || ""}
                            onChange={(e) =>
                              handleParceiroSelect(
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-lg text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all [&>option]:bg-neutral-900 [&>option]:text-neutral-200"
                          >
                            <option value="" className="text-neutral-500">
                              {loadingParceiros
                                ? "Carregando parceiros..."
                                : errorParceiros
                                ? "Erro ao carregar parceiros"
                                : parceiros.length === 0
                                ? "Nenhum parceiro cadastrado"
                                : "Selecione um parceiro"}
                            </option>
                            {parceiros.map((parceiro) => (
                              <option
                                key={parceiro.id}
                                value={parceiro.id}
                                className="bg-neutral-900 text-neutral-200"
                              >
                                {parceiro.pessoaFisica?.nome ||
                                  "Nome não informado"}{" "}
                                -{" "}
                                {parceiro.filial?.nome ||
                                  "Filial não informada"}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Situação e Dados Básicos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Situação *
                      </label>
                      <select
                        name="situacao"
                        value={formData.situacao}
                        onChange={handleInputChange}
                        className={cn(
                          "w-full px-4 py-2.5 bg-neutral-800/50 border rounded-lg text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all",
                          errors.situacao
                            ? "border-red-500 bg-red-500/10"
                            : "border-neutral-700",
                          "[&>option]:bg-neutral-900 [&>option]:text-neutral-200"
                        )}
                      >
                        {SituacaoContratoOptions.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                            className="bg-neutral-900 text-neutral-200"
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.situacao && (
                        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.situacao}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Número da Pasta
                      </label>
                      <div className="relative">
                        <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <input
                          type="text"
                          name="numeroPasta"
                          value={formData.numeroPasta}
                          onChange={handleInputChange}
                          maxLength={100}
                          className={cn(
                            "w-full pl-12 pr-4 py-2.5 bg-neutral-800/50 border rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all",
                            errors.numeroPasta
                              ? "border-red-500 bg-red-500/10"
                              : "border-neutral-700"
                          )}
                          placeholder="P-2025-001"
                        />
                      </div>
                      {errors.numeroPasta && (
                        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.numeroPasta}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tipo de Serviço e Data de Fechamento */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Tipo de Serviço
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <select
                          name="tipoServico"
                          value={formData.tipoServico}
                          onChange={handleInputChange}
                          className={cn(
                            "w-full pl-12 pr-4 py-2.5 bg-neutral-800/50 border rounded-lg text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all [&>option]:bg-neutral-900 [&>option]:text-neutral-200",
                            errors.tipoServico
                              ? "border-red-500 bg-red-500/10"
                              : "border-neutral-700"
                          )}
                        >
                          <option value="" className="text-neutral-500">
                            Selecione o tipo de serviço
                          </option>
                          {TipoServicoOptions.map((option) => (
                            <option
                              key={option.value}
                              value={option.value}
                              className="bg-neutral-900 text-neutral-200"
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.tipoServico && (
                        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.tipoServico}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Data de Fechamento do Contrato
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <input
                          type="date"
                          name="dataFechamentoContrato"
                          value={formData.dataFechamentoContrato}
                          onChange={handleInputChange}
                          className={cn(
                            "w-full pl-12 pr-4 py-2.5 bg-neutral-800/50 border rounded-lg text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all",
                            errors.dataFechamentoContrato
                              ? "border-red-500 bg-red-500/10"
                              : "border-neutral-700"
                          )}
                        />
                      </div>
                      {errors.dataFechamentoContrato && (
                        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.dataFechamentoContrato}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Objeto do Contrato */}
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-neutral-300 mb-2">
                      <span>Objeto do Contrato</span>
                      <span
                        className={`text-xs ${
                          formData.objetoContrato &&
                          formData.objetoContrato.length > 1000
                            ? "text-red-400 font-bold"
                            : formData.objetoContrato &&
                              formData.objetoContrato.length > 900
                            ? "text-orange-400"
                            : "text-neutral-400"
                        }`}
                      >
                        {formData.objetoContrato?.length || 0}/1000
                      </span>
                    </label>
                    <div className="relative">
                      <Target className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
                      <textarea
                        name="objetoContrato"
                        value={formData.objetoContrato}
                        onChange={handleInputChange}
                        rows={3}
                        maxLength={1000}
                        className={cn(
                          "w-full pl-12 pr-4 py-2.5 bg-neutral-800/50 border rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none",
                          errors.objetoContrato
                            ? "border-red-500 focus:ring-red-500/50 bg-red-500/10"
                            : "border-neutral-700 focus:ring-amber-500/50"
                        )}
                        placeholder="Descreva o objeto do contrato..."
                      />
                    </div>
                    {errors.objetoContrato && (
                      <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.objetoContrato}
                      </p>
                    )}
                  </div>

                  {/* Datas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Data Último Contato *
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <input
                          type="date"
                          name="dataUltimoContato"
                          value={formData.dataUltimoContato}
                          onChange={handleInputChange}
                          className={cn(
                            "w-full pl-12 pr-4 py-2.5 bg-neutral-800/50 border rounded-lg text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all",
                            errors.dataUltimoContato
                              ? "border-red-500 bg-red-500/10"
                              : "border-neutral-700"
                          )}
                        />
                      </div>
                      {errors.dataUltimoContato && (
                        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.dataUltimoContato}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Data Próximo Contato *
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <input
                          type="date"
                          name="dataProximoContato"
                          value={formData.dataProximoContato}
                          onChange={handleInputChange}
                          className={cn(
                            "w-full pl-12 pr-4 py-2.5 bg-neutral-800/50 border rounded-lg text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all",
                            errors.dataProximoContato
                              ? "border-red-500 bg-red-500/10"
                              : "border-neutral-700"
                          )}
                        />
                      </div>
                      {errors.dataProximoContato && (
                        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.dataProximoContato}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Valores Principais */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Valor Devido *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-500">
                          R$
                        </span>
                        <input
                          type="text"
                          name="valorDevido"
                          value={valorDevidoText}
                          onChange={handleInputChange}
                          onBlur={() => handleCurrencyBlur("valorDevido")}
                          className={cn(
                            "w-full pl-12 pr-4 py-2.5 bg-neutral-800/50 border rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all",
                            errors.valorDevido
                              ? "border-red-500 bg-red-500/10"
                              : "border-neutral-700"
                          )}
                          placeholder="0,00"
                        />
                      </div>
                      {errors.valorDevido && (
                        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.valorDevido}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Valor Negociado
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-500">
                          R$
                        </span>
                        <input
                          type="text"
                          name="valorNegociado"
                          value={valorNegociadoText}
                          onChange={handleInputChange}
                          onBlur={() => handleCurrencyBlur("valorNegociado")}
                          className={cn(
                            "w-full pl-12 pr-4 py-2.5 bg-neutral-800/50 border rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all",
                            errors.valorNegociado
                              ? "border-red-500 bg-red-500/10"
                              : "border-neutral-700"
                          )}
                          placeholder="0,00"
                        />
                      </div>
                      {errors.valorNegociado && (
                        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.valorNegociado}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Dados de Pagamento */}
                  <div className="border-t border-neutral-800 pt-6">
                    <h4 className="text-lg font-semibold text-neutral-100 mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-amber-400" />
                      Dados de Pagamento
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                          Valor de Entrada
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-500">
                            R$
                          </span>
                          <input
                            type="text"
                            name="valorEntrada"
                            value={valorEntradaText}
                            onChange={handleInputChange}
                            onBlur={() => handleCurrencyBlur("valorEntrada")}
                            className={cn(
                              "w-full pl-12 pr-4 py-2.5 bg-neutral-800/50 border rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all",
                              errors.valorEntrada
                                ? "border-red-500 bg-red-500/10"
                                : "border-neutral-700"
                            )}
                            placeholder="0,00"
                          />
                        </div>
                        {errors.valorEntrada && (
                          <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.valorEntrada}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                          Valor da Parcela
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-500">
                            R$
                          </span>
                          <input
                            type="text"
                            name="valorParcela"
                            value={valorParcelaText}
                            onChange={handleInputChange}
                            onBlur={() => handleCurrencyBlur("valorParcela")}
                            className={cn(
                              "w-full pl-12 pr-4 py-2.5 bg-neutral-800/50 border rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all",
                              errors.valorParcela
                                ? "border-red-500 bg-red-500/10"
                                : "border-neutral-700"
                            )}
                            placeholder="0,00"
                          />
                        </div>
                        {errors.valorParcela && (
                          <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.valorParcela}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                          Número de Parcelas
                        </label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                          <input
                            type="number"
                            name="numeroParcelas"
                            value={formData.numeroParcelas || ""}
                            onChange={handleInputChange}
                            disabled={parcelasIndeterminadas}
                            className={cn(
                              "w-full pl-12 pr-4 py-2.5 bg-neutral-800/50 border rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed",
                              errors.numeroParcelas
                                ? "border-red-500 bg-red-500/10"
                                : "border-neutral-700"
                            )}
                            placeholder="12"
                            min="1"
                          />
                        </div>
                        <div className="mt-2">
                          <label className="flex items-center gap-2 text-xs font-medium text-neutral-300 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={parcelasIndeterminadas}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setParcelasIndeterminadas(checked);
                                if (checked) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    numeroParcelas: undefined,
                                  }));
                                }
                              }}
                              className="w-4 h-4 text-amber-500 bg-neutral-800 border-neutral-600 rounded focus:ring-amber-500 focus:ring-2"
                            />
                            Indeterminado
                          </label>
                        </div>
                        {errors.numeroParcelas && (
                          <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.numeroParcelas}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                          Primeiro Vencimento
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                          <input
                            type="date"
                            name="primeiroVencimento"
                            value={formData.primeiroVencimento}
                            onChange={handleInputChange}
                            className={cn(
                              "w-full pl-12 pr-4 py-2.5 bg-neutral-800/50 border rounded-lg text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all",
                              errors.primeiroVencimento
                                ? "border-red-500 bg-red-500/10"
                                : "border-neutral-700"
                            )}
                          />
                        </div>
                        {errors.primeiroVencimento && (
                          <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.primeiroVencimento}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                          Comissão (%)
                        </label>
                        <div className="relative">
                          <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                          <input
                            type="text"
                            name="comissao"
                            value={comissaoText}
                            onChange={handleInputChange}
                            onBlur={() => handleCurrencyBlur("comissao")}
                            className={cn(
                              "w-full pl-12 pr-4 py-2.5 bg-neutral-800/50 border rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all",
                              errors.comissao
                                ? "border-red-500 bg-red-500/10"
                                : "border-neutral-700"
                            )}
                            placeholder="15,00"
                          />
                        </div>
                        {errors.comissao && (
                          <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.comissao}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Outros Campos */}
                  <div className="border-t border-neutral-800 pt-6">
                    <h4 className="text-lg font-semibold text-neutral-100 mb-4 flex items-center gap-2">
                      <Paperclip className="w-5 h-5 text-amber-400" />
                      Outros Campos
                    </h4>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                          Anexo de Documento (PDF)
                        </label>
                        <div className="relative">
                          <Paperclip className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 z-30" />
                          <div className="relative overflow-visible">
                            <input
                              type="file"
                              name="anexoDocumento"
                              accept=".pdf"
                              onChange={handleInputChange}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 hover:cursor-pointer"
                              id="anexoDocumento"
                            />
                            <div
                              className={cn(
                                "w-full pl-12 pr-4 py-2.5 bg-neutral-800/50 border rounded-lg text-sm text-neutral-100 flex items-center justify-between",
                                errors.anexoDocumento
                                  ? "border-red-500 bg-red-500/10"
                                  : "border-neutral-700"
                              )}
                            >
                              <span className="text-neutral-400">
                                {nomeArquivoPDF || "Nenhum arquivo escolhido"}
                              </span>
                              <span className="text-amber-400 font-medium text-xs bg-amber-500/20 px-3 py-1 rounded border border-amber-500/30">
                                Escolher Arquivo
                              </span>
                            </div>
                          </div>
                        </div>
                        {errors.anexoDocumento && (
                          <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.anexoDocumento}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-neutral-400">
                          Selecione um arquivo PDF para anexar ao contrato (máx.
                          10MB)
                        </p>
                      </div>

                      <div>
                        <label className="flex items-center justify-between text-sm font-medium text-neutral-300 mb-2">
                          <span>Pendências</span>
                          <span
                            className={`text-xs ${
                              formData.pendencias &&
                              formData.pendencias.length > 2000
                                ? "text-red-400 font-bold"
                                : formData.pendencias &&
                                  formData.pendencias.length > 1900
                                ? "text-orange-400"
                                : "text-neutral-400"
                            }`}
                          >
                            {formData.pendencias?.length || 0}/2000
                          </span>
                        </label>
                        <div className="relative">
                          <AlertTriangle className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
                          <textarea
                            name="pendencias"
                            value={formData.pendencias}
                            onChange={handleInputChange}
                            rows={3}
                            maxLength={2000}
                            className={cn(
                              "w-full pl-12 pr-4 py-2.5 bg-neutral-800/50 border rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none",
                              errors.pendencias
                                ? "border-red-500 focus:ring-red-500/50 bg-red-500/10"
                                : "border-neutral-700 focus:ring-amber-500/50"
                            )}
                            placeholder="Descreva pendências existentes..."
                          />
                        </div>
                        {errors.pendencias && (
                          <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.pendencias}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Observações */}
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-neutral-300 mb-2">
                      <span>Observações</span>
                      <span
                        className={`text-xs ${
                          formData.observacoes &&
                          formData.observacoes.length > 1000
                            ? "text-red-400 font-bold"
                            : formData.observacoes &&
                              formData.observacoes.length > 900
                            ? "text-orange-400"
                            : "text-neutral-400"
                        }`}
                      >
                        {formData.observacoes?.length || 0}/1000
                      </span>
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
                      <textarea
                        name="observacoes"
                        value={formData.observacoes}
                        onChange={handleInputChange}
                        rows={4}
                        maxLength={1000}
                        className={`w-full pl-12 pr-4 py-2.5 bg-neutral-800/50 border ${
                          errors.observacoes
                            ? "border-red-500"
                            : "border-neutral-700"
                        } rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 ${
                          errors.observacoes
                            ? "focus:ring-red-500/50"
                            : "focus:ring-amber-500/50"
                        } focus:border-transparent transition-all resize-none`}
                        placeholder="Adicione observações sobre o contrato..."
                      />
                    </div>
                    {errors.observacoes && (
                      <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.observacoes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 mt-6 pt-6 pb-20 border-t border-neutral-800">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onCancel}
                    className="px-4 py-2 text-neutral-300 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 rounded-lg font-medium transition-colors"
                    disabled={submitting}
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={submitting}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/30"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {contrato ? "Atualizar" : "Criar"} Contrato
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>

          {/* Seleção de Cliente */}
          <ClientePickerModal
            isOpen={showClientePicker}
            clientes={clientes}
            onClose={() => setShowClientePicker(false)}
            onSelect={(cliente) => {
              setFormData((prev) => ({ ...prev, clienteId: cliente.id }));
              setShowClientePicker(false);
              // limpar erro de cliente se havia
              if (errors.clienteId) {
                setErrors((prev) => {
                  const e = { ...prev };
                  delete e.clienteId;
                  return e;
                });
              }
            }}
          />
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
