"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Send, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Boleto } from "@/types/boleto";
import { enviarEmailBoleto } from "@/services/boletoService";

interface EnviarEmailModalProps {
  boleto: Boleto | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EnviarEmailModal({
  boleto,
  isOpen,
  onClose,
  onSuccess,
}: EnviarEmailModalProps) {
  const [emailPessoal, setEmailPessoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{
    sucesso: boolean;
    mensagem: string;
    emailDestino?: string | null;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!boleto) return;

    setLoading(true);
    setResultado(null);

    try {
      const response = await enviarEmailBoleto(
        boleto.id,
        emailPessoal.trim() || undefined
      );

      if (response.sucesso) {
        setResultado({
          sucesso: true,
          mensagem: "Email enviado com sucesso!",
          emailDestino: response.emailDestino,
        });
        onSuccess?.();
      } else {
        setResultado({
          sucesso: false,
          mensagem: response.erro || "Erro ao enviar email",
          emailDestino: response.emailDestino,
        });
      }
    } catch (error: any) {
      setResultado({
        sucesso: false,
        mensagem: error.message || "Erro ao enviar email",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmailPessoal("");
    setResultado(null);
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  if (!isOpen || !boleto) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-800 max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-400 to-amber-600 p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black/20 rounded-xl">
                <Mail className="w-5 h-5 text-neutral-950" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-950">
                  Enviar Boleto
                </h2>
                <p className="text-sm text-neutral-800">Boleto #{boleto.id}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-black/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-neutral-950" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Info do Boleto */}
            <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-neutral-400">Cliente</p>
                  <p className="font-medium text-neutral-200">
                    {boleto.payerName}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-400">Valor</p>
                  <p className="font-medium text-amber-400">
                    {formatCurrency(boleto.nominalValue)}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-400">Vencimento</p>
                  <p className="font-medium text-neutral-200">
                    {formatDate(boleto.dueDate)}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-400">NSU</p>
                  <p className="font-mono text-neutral-200">{boleto.nsuCode}</p>
                </div>
              </div>
            </div>

            {/* Resultado */}
            {resultado && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
                  resultado.sucesso
                    ? "bg-green-500/10 border border-green-500/30"
                    : "bg-red-500/10 border border-red-500/30"
                }`}
              >
                {resultado.sucesso ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p
                    className={`font-medium ${
                      resultado.sucesso ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {resultado.mensagem}
                  </p>
                  {resultado.emailDestino && (
                    <p
                      className={`text-sm mt-1 ${
                        resultado.sucesso
                          ? "text-green-300/70"
                          : "text-red-300/70"
                      }`}
                    >
                      Destino: {resultado.emailDestino}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Form */}
            {!resultado?.sucesso && (
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Email de destino (opcional)
                  </label>
                  <input
                    type="email"
                    value={emailPessoal}
                    onChange={(e) => setEmailPessoal(e.target.value)}
                    placeholder="Deixe vazio para usar o email cadastrado"
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 text-neutral-100 placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                    disabled={loading}
                  />
                  <p className="mt-2 text-xs text-neutral-500">
                    Se não informar, o email será enviado para o endereço
                    cadastrado do cliente.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 bg-neutral-800/50 border border-neutral-700 text-neutral-300 rounded-lg font-medium hover:bg-neutral-800/70 transition-colors"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-900 rounded-lg font-semibold hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Enviar Email
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Botão de fechar após sucesso */}
            {resultado?.sucesso && (
              <button
                onClick={handleClose}
                className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-900 rounded-lg font-semibold hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/20"
              >
                Fechar
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
