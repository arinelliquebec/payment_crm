// src/components/HistoricoConsultores.tsx
"use client";

import { motion } from "framer-motion";
import {
  Clock,
  User,
  Users,
  Calendar,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { HistoricoConsultor } from "@/types/api";
import { cn } from "@/lib/utils";

interface HistoricoConsultoresProps {
  historico: HistoricoConsultor[];
  loading?: boolean;
}

export default function HistoricoConsultores({
  historico,
  loading = false,
}: HistoricoConsultoresProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getClienteDisplayName = (cliente: any) => {
    if (cliente.tipoPessoa === "Fisica") {
      return cliente.pessoaFisica?.nome || "Nome não informado";
    } else {
      return (
        cliente.pessoaJuridica?.razaoSocial || "Razão social não informada"
      );
    }
  };

  const getConsultorDisplayName = (consultor: any) => {
    return consultor.pessoaFisica?.nome || "Nome não informado";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (historico.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-secondary-900 mb-2">
          Nenhum histórico encontrado
        </h3>
        <p className="text-secondary-600">
          Não há registros de atribuições de consultores.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-6">
        <Clock className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-secondary-900">
          Histórico de Atribuições
        </h3>
        <span className="text-sm text-secondary-500">
          ({historico.length} registros)
        </span>
      </div>

      <div className="space-y-4">
        {historico.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-secondary-200/50 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-secondary-400" />
                    <span className="font-medium text-secondary-900">
                      {getClienteDisplayName(item.cliente)}
                    </span>
                  </div>
                  <span className="text-secondary-400">→</span>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-secondary-400" />
                    <span className="font-medium text-secondary-900">
                      {getConsultorDisplayName(item.consultor)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-secondary-600">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Início: {formatDate(item.dataInicio)}</span>
                  </div>
                  {item.dataFim && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Fim: {formatDate(item.dataFim)}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>
                                              {item.consultor?.filial?.nome || "Filial não informada"}
                    </span>
                  </div>
                </div>

                {item.motivoTransferencia && (
                  <div className="mt-3 p-3 bg-secondary-50 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <FileText className="w-4 h-4 text-secondary-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-secondary-700 mb-1">
                          Motivo da Transferência:
                        </p>
                        <p className="text-sm text-secondary-600">
                          {item.motivoTransferencia}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="ml-4">
                {item.dataFim ? (
                  <div className="flex items-center space-x-1 text-red-600">
                    <XCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Finalizado</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Ativo</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
