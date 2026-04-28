// src/components/ClienteDetalhes.tsx
"use client";

import { motion } from "framer-motion";
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Users,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Cliente, HistoricoConsultor } from "@/types/api";
import { cn } from "@/lib/utils";

interface ClienteDetalhesProps {
  cliente: Cliente;
  historico?: HistoricoConsultor[];
  onClose: () => void;
}

export default function ClienteDetalhes({
  cliente,
  historico = [],
  onClose,
}: ClienteDetalhesProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getClienteDisplayName = () => {
    if (cliente.tipoPessoa === "Fisica") {
      return cliente.pessoaFisica?.nome || "Nome não informado";
    } else {
      return cliente.pessoaJuridica?.razaoSocial || "Razão social não informada";
    }
  };

  const getConsultorAtual = () => {
    const historicoAtivo = historico.find(h => !h.dataFim);
    return historicoAtivo?.consultor;
  };

  const getStatusBadge = () => {
    const status = cliente.status?.toLowerCase();
    if (status === "ativo") {
      return (
        <div className="flex items-center space-x-1 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Ativo</span>
        </div>
      );
    } else if (status === "inativo") {
      return (
        <div className="flex items-center space-x-1 text-red-600">
          <XCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Inativo</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-1 text-yellow-600">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">{cliente.status || "Não definido"}</span>
        </div>
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              {cliente.tipoPessoa === "Fisica" ? (
                <User className="w-6 h-6 text-green-600" />
              ) : (
                <Building2 className="w-6 h-6 text-green-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-secondary-900">
                Detalhes do Cliente
              </h2>
              <p className="text-sm text-secondary-600">
                {getClienteDisplayName()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-secondary-400 hover:text-secondary-600 rounded-lg transition-colors duration-200"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                  Informações Básicas
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    {cliente.tipoPessoa === "Fisica" ? (
                      <User className="w-4 h-4 text-secondary-400" />
                    ) : (
                      <Building2 className="w-4 h-4 text-secondary-400" />
                    )}
                    <span className="text-sm text-secondary-600">
                      Tipo: {cliente.tipoPessoa === "Fisica" ? "Pessoa Física" : "Pessoa Jurídica"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-secondary-400" />
                    <span className="text-sm text-secondary-600">
                      {cliente.pessoaFisica?.email || cliente.pessoaJuridica?.email}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-secondary-400" />
                    <span className="text-sm text-secondary-600">
                      {cliente.pessoaFisica?.telefone1 || cliente.pessoaJuridica?.telefone1}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-secondary-400" />
                    <span className="text-sm text-secondary-600">
                      Cliente desde: {formatDate(cliente.dataCadastro)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-secondary-400" />
                    <span className="text-sm text-secondary-600">
                      Filial: {cliente.filial?.nome || "Não informada"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                  Status e Documentos
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-secondary-400" />
                    <span className="text-sm text-secondary-600">
                      Status: {getStatusBadge()}
                    </span>
                  </div>
                  {cliente.tipoPessoa === "Fisica" ? (
                    <div className="flex items-center space-x-3">
                      <FileText className="w-4 h-4 text-secondary-400" />
                      <span className="text-sm text-secondary-600">
                        CPF: {cliente.pessoaFisica?.cpf}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <FileText className="w-4 h-4 text-secondary-400" />
                      <span className="text-sm text-secondary-600">
                        CNPJ: {cliente.pessoaJuridica?.cnpj}
                      </span>
                    </div>
                  )}
                  {cliente.pessoaJuridica?.nomeFantasia && (
                    <div className="flex items-center space-x-3">
                      <Building2 className="w-4 h-4 text-secondary-400" />
                      <span className="text-sm text-secondary-600">
                        Nome Fantasia: {cliente.pessoaJuridica.nomeFantasia}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Consultor Atual */}
          {getConsultorAtual() && (
            <div className="border-t border-secondary-200 pt-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Consultor Atual
              </h3>
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">
                      {getConsultorAtual()?.pessoaFisica?.nome}
                    </p>
                    <p className="text-sm text-blue-700">
                      {getConsultorAtual()?.filial?.nome || "Não informada"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Observações */}
          {cliente.observacoes && (
            <div className="border-t border-secondary-200 pt-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Observações
              </h3>
              <div className="bg-secondary-50 rounded-xl p-4">
                <p className="text-secondary-700">{cliente.observacoes}</p>
              </div>
            </div>
          )}

          {/* Histórico de Consultores */}
          {historico.length > 0 && (
            <div className="border-t border-secondary-200 pt-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Histórico de Consultores
              </h3>
              <div className="space-y-3">
                {historico.map((item) => (
                  <div
                    key={item.id}
                    className="bg-secondary-50 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-secondary-900">
                          {item.consultor?.pessoaFisica?.nome}
                        </p>
                        <p className="text-sm text-secondary-600">
                          {formatDate(item.dataInicio)} - {item.dataFim ? formatDate(item.dataFim) : "Atual"}
                        </p>
                      </div>
                      {!item.dataFim && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">Ativo</span>
                        </div>
                      )}
                    </div>
                    {item.motivoTransferencia && (
                      <p className="text-sm text-secondary-600 mt-2">
                        Motivo: {item.motivoTransferencia}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
