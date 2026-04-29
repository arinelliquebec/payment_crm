import { useState, useEffect, useRef } from "react";
import { X, Copy, CheckCircle, AlertCircle } from "lucide-react";
import { consultarStatusBoleto, BoletoStatus } from "@/services/boletoService";
import { StatusBadge } from "./StatusBadge";
import { motion, AnimatePresence } from "framer-motion";

interface BoletoDetailsModalProps {
  boletoId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function BoletoDetailsModal({
  boletoId,
  isOpen,
  onClose,
}: BoletoDetailsModalProps) {
  const [status, setStatus] = useState<BoletoStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formatCurrency = (value?: number) => {
    if (typeof value !== "number") return "—";
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    });
  };

  const formatDate = (value?: string) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleDateString("pt-BR");
    } catch {
      return "—";
    }
  };

  useEffect(() => {
    if (isOpen && boletoId > 0) {
      carregarStatus();
    } else if (!isOpen) {
      // Limpar estado ao fechar o modal
      setStatus(null);
      setCopiedField(null);
    }
  }, [isOpen, boletoId]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const carregarStatus = async () => {
    if (!boletoId || boletoId <= 0) {
      console.warn("BoletoDetailsModal: boletoId inválido", boletoId);
      return;
    }

    setLoading(true);
    try {
      const statusAtual = await consultarStatusBoleto(boletoId);
      setStatus(statusAtual);
    } catch (error) {
      console.error("Erro ao carregar status:", error);
      alert("Erro ao carregar detalhes do boleto. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const copiarParaClipboard = (texto?: string, campo?: string) => {
    if (!texto) return;
    navigator.clipboard.writeText(texto);
    if (campo) {
      setCopiedField(campo);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const qrCodeImage = status?.qrCodePix
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
        status.qrCodePix
      )}`
    : status?.qrCodeUrl || null;

  const ultimaAtualizacao = status?.consultaRealizadaEm
    ? formatDate(status.consultaRealizadaEm)
    : formatDate(status?.entryDate);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 p-6 rounded-t-2xl flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              Detalhes do Boleto #{boletoId}
            </h2>
            <button
              onClick={onClose}
              className="text-neutral-950 hover:bg-black/20 rounded-full p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="text-6xl mb-4"
                >
                  ⏳
                </motion.div>
                <p className="text-neutral-400">Carregando detalhes...</p>
              </div>
            ) : status ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-neutral-950 border border-emerald-400/50 rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.45)] text-neutral-50">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">
                        Integração oficial Santander API
                      </p>
                      <div>
                        <h3 className="text-3xl font-semibold">
                          {status.payer?.name || `Boleto #${boletoId}`}
                        </h3>
                        <p className="text-sm text-emerald-200 mt-1">
                          {status.payer?.documentNumber ||
                            "Documento não informado"}
                        </p>
                      </div>
                      <p className="text-sm text-neutral-300 leading-relaxed max-w-2xl">
                        Todos os dados abaixo são consultados em tempo real
                        diretamente da Santander API em produção. Utilize este
                        QR Code ou os códigos oficiais para pagamento e
                        reconciliação segura.
                      </p>
                      <p className="text-xs text-emerald-200/80 uppercase">
                        Última atualização: {ultimaAtualizacao}
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 w-full lg:max-w-xs">
                      <StatusBadge
                        status={status.status}
                        statusDescription={status.statusDescription}
                        foiPago={status.foiPago}
                        paidValue={status.paidValue}
                        size="lg"
                      />
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <p className="text-xs uppercase tracking-wide text-neutral-400">
                          Valor nominal
                        </p>
                        <p className="text-2xl font-semibold text-white">
                          {formatCurrency(status.nominalValue)}
                        </p>
                        <p className="text-sm text-neutral-400 mt-2">
                          Vencimento: {formatDate(status.dueDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-8">
                    <InfoBadge label="NSU Code" value={status.nsuCode || "—"} />
                    <InfoBadge
                      label="Nosso Número"
                      value={status.bankNumber || "—"}
                    />
                    <InfoBadge
                      label="Convênio"
                      value={status.beneficiaryCode || "—"}
                    />
                    <InfoBadge
                      label="Client Number"
                      value={status.clientNumber || "—"}
                    />
                  </div>

                  <div className="mt-8 grid gap-8 lg:grid-cols-2">
                    <div className="bg-white rounded-3xl shadow-2xl p-6 flex flex-col items-center justify-center">
                      {qrCodeImage ? (
                        <>
                          <img
                            src={qrCodeImage}
                            alt="QR Code PIX Santander"
                            className="w-56 h-56"
                            loading="lazy"
                          />
                          {status.qrCodeUrl && (
                            <a
                              href={status.qrCodeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
                            >
                              Ver imagem oficial hospedada pela Santander
                            </a>
                          )}
                        </>
                      ) : (
                        <p className="text-neutral-600 text-center">
                          QR Code não disponível para este boleto
                        </p>
                      )}
                      <p className="text-sm text-neutral-500 mt-4 flex items-center gap-2">
                        <span role="img" aria-label="celular">
                          📱
                        </span>
                        Abra o app do seu banco e escaneie o QR Code para pagar
                      </p>
                    </div>
                    <div className="space-y-4">
                      <CopyableValue
                        label="Linha digitável"
                        value={status.digitableLine}
                        copyId="digitableLine"
                        onCopy={copiarParaClipboard}
                        isCopied={copiedField === "digitableLine"}
                      />
                      <CopyableValue
                        label="Código de barras"
                        value={status.barCode}
                        copyId="barCode"
                        onCopy={copiarParaClipboard}
                        isCopied={copiedField === "barCode"}
                      />
                      <CopyableValue
                        label="Código PIX (copia e cola)"
                        value={status.qrCodePix}
                        copyId="pixCode"
                        onCopy={copiarParaClipboard}
                        isCopied={copiedField === "pixCode"}
                        helperText="Cole diretamente no app do banco para pagar via PIX."
                      />
                      <CopyableValue
                        label="Link oficial do QR Code"
                        value={status.qrCodeUrl}
                        copyId="pixUrl"
                        onCopy={copiarParaClipboard}
                        isCopied={copiedField === "pixUrl"}
                        helperText="Imagem hospedada pela Santander API."
                      />
                      {status.barCode && (
                        <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4">
                          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                            Código do boleto (código de barras completo)
                          </p>
                          <p className="mt-3 font-mono text-sm text-neutral-100 break-all">
                            {status.barCode}
                          </p>
                        </div>
                      )}
                      {status.qrCodePix && (
                        <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4">
                          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                            Código PIX completo
                          </p>
                          <p className="mt-3 font-mono text-sm text-neutral-100 break-all max-h-32 overflow-y-auto pr-2">
                            {status.qrCodePix}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={carregarStatus}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-neutral-950 rounded-lg disabled:opacity-50 transition-all font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/40"
                >
                  Atualizar status direto da Santander API
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 mx-auto text-neutral-600 mb-4" />
                <p className="text-neutral-400 text-lg">
                  Nenhum dado disponível
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-neutral-800/50 p-4 rounded-b-2xl border-t border-neutral-700">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors font-semibold text-neutral-200 border border-neutral-600"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface CopyableValueProps {
  label: string;
  value?: string | number | null;
  copyId: string;
  onCopy: (value?: string, fieldId?: string) => void;
  isCopied: boolean;
  helperText?: string;
  mono?: boolean;
}

function CopyableValue({
  label,
  value,
  copyId,
  onCopy,
  isCopied,
  helperText,
  mono = true,
}: CopyableValueProps) {
  if (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return null;
  }

  const textValue = String(value);

  return (
    <div className="space-y-2">
      <p className="text-sm text-neutral-400 font-medium">{label}</p>
      <div className="flex items-center gap-3 bg-neutral-950/60 border border-neutral-800 rounded-xl p-3">
        <p
          className={`flex-1 break-all ${
            mono ? "font-mono text-sm" : "text-base font-semibold"
          } text-neutral-50`}
        >
          {textValue}
        </p>
        <button
          onClick={() => onCopy(textValue, copyId)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            isCopied
              ? "bg-emerald-600/20 text-emerald-300 border border-emerald-400/40"
              : "bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-amber-500/30"
          }`}
        >
          {isCopied ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copiar
            </>
          )}
        </button>
      </div>
      {helperText && <p className="text-xs text-neutral-500">{helperText}</p>}
    </div>
  );
}

interface InfoBadgeProps {
  label: string;
  value: string;
}

function InfoBadge({ label, value }: InfoBadgeProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">
        {label}
      </p>
      <p className="mt-2 font-mono text-lg text-white break-all">{value}</p>
    </div>
  );
}
