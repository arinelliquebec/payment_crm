import { useState } from "react";
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useSincronizacaoEmMassa } from "@/hooks/useBoletoStatus";
import { motion, AnimatePresence } from "framer-motion";

interface SincronizarTodosButtonProps {
  onSincronizacaoConcluida?: () => void;
}

export function SincronizarTodosButton({
  onSincronizacaoConcluida,
}: SincronizarTodosButtonProps) {
  const { syncing, resultado, sincronizarTodos } = useSincronizacaoEmMassa();
  const [showResults, setShowResults] = useState(false);

  const handleSincronizar = async () => {
    setShowResults(false);
    try {
      await sincronizarTodos();
      setShowResults(true);
      onSincronizacaoConcluida?.();
    } catch (error) {
      console.error("Erro na sincronização:", error);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleSincronizar}
        disabled={syncing}
        className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
      >
        <RefreshCw className={`w-5 h-5 ${syncing ? "animate-spin" : ""}`} />
        {syncing ? (
          <>Sincronizando todos os boletos...</>
        ) : (
          <>Sincronizar Todos os Boletos</>
        )}
      </button>

      <AnimatePresence>
        {resultado && showResults && !syncing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-lg shadow-lg p-6 border border-gray-200"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">
                📊 Resultado da Sincronização
              </h3>
              <button
                onClick={() => setShowResults(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Resumo em Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-3xl font-bold text-blue-700">
                  {resultado.total}
                </p>
                <p className="text-sm text-blue-600 font-medium">Total</p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="text-3xl font-bold text-green-700">
                  {resultado.sucesso}
                </p>
                <p className="text-sm text-green-600 font-medium">Sucesso</p>
              </div>

              <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
                <XCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                <p className="text-3xl font-bold text-red-700">
                  {resultado.erros}
                </p>
                <p className="text-sm text-red-600 font-medium">Erros</p>
              </div>
            </div>

            {/* Boletos Atualizados */}
            {resultado.atualizados.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Boletos Atualizados ({resultado.atualizados.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {resultado.atualizados.map((item) => (
                    <motion.div
                      key={item.boletoId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-green-800">
                            Boleto #{item.boletoId}
                          </span>
                          <span className="text-green-600 ml-2">
                            (NSU: {item.nsuCode})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs">
                            {item.statusAnterior}
                          </span>
                          <span>→</span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              item.statusNovo === "LIQUIDADO"
                                ? "bg-green-600 text-white"
                                : item.statusNovo === "BAIXADO"
                                ? "bg-orange-500 text-white"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {item.statusNovo}
                          </span>
                        </div>
                      </div>
                      {item.statusNovo === "LIQUIDADO" && (
                        <div className="mt-2 text-green-700 font-medium">
                          🎉 Boleto pago (código de barras)!
                        </div>
                      )}
                      {item.statusNovo === "BAIXADO" && (
                        <div className="mt-2 text-orange-700 font-medium">
                          ⚠️ Boleto baixado - Verifique se foi pago (PIX) ou expirado
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Erros */}
            {resultado.erros_Lista.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Erros ({resultado.erros_Lista.length})
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {resultado.erros_Lista.map((item) => (
                    <motion.div
                      key={item.boletoId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm"
                    >
                      <div className="font-semibold text-red-800">
                        Boleto #{item.boletoId}
                        <span className="text-red-600 ml-2 font-normal">
                          (NSU: {item.nsuCode})
                        </span>
                      </div>
                      <div className="text-red-700 mt-1">{item.erro}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

