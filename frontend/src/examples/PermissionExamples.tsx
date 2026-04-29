"use client";

import React from "react";
import {
  PermissionWrapper,
  PermissionButton,
  PermissionLink,
  PermissionSection,
  MultiplePermissionsWrapper,
  UserStatus,
  UserGroupBadge,
  NavigationMenu,
  PermissionErrorWrapper,
  AuthDebug,
  AuthStatus,
} from "@/components/permissions";
import { useAuth } from "@/contexts/AuthContext";
import { useCrudPermissions } from "@/hooks/usePermissions";
import { MODULOS, ACÕES } from "@/types/permissions";
import { Plus, Edit, Trash2, Eye, User, Building, Users } from "lucide-react";

/**
 * Exemplos de uso do sistema de permissões
 */
export const PermissionExamples: React.FC = () => {
  const { hasPermission, permissoes } = useAuth();
  const { canView, canCreate, canEdit, canDelete, isReadOnly } =
    useCrudPermissions(MODULOS.CLIENTE);

  return (
    <PermissionErrorWrapper>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Sistema de Permissões - Exemplos de Uso
          </h1>

          {/* Debug de Autenticação */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Debug de Autenticação
            </h2>
            <AuthDebug />
            <div className="mt-4">
              <AuthStatus />
            </div>
          </section>

          {/* Status do Usuário */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Status do Usuário
            </h2>
            <UserStatus />
          </section>

          {/* Navegação com Permissões */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Menu de Navegação
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <NavigationMenu />
            </div>
          </section>

          {/* Exemplos de Botões com Permissões */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Botões com Controle de Acesso
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Botão de Criar Cliente */}
              <PermissionButton
                modulo={MODULOS.CLIENTE}
                acao={ACÕES.INCLUIR}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                fallback={
                  <div className="flex items-center justify-center px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed">
                    <Plus className="h-4 w-4 mr-2" />
                    Sem Permissão
                  </div>
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </PermissionButton>

              {/* Botão de Editar Cliente */}
              <PermissionButton
                modulo={MODULOS.CLIENTE}
                acao={ACÕES.EDITAR}
                className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                fallback={
                  <div className="flex items-center justify-center px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed">
                    <Edit className="h-4 w-4 mr-2" />
                    Sem Permissão
                  </div>
                }
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Cliente
              </PermissionButton>

              {/* Botão de Excluir Cliente */}
              <PermissionButton
                modulo={MODULOS.CLIENTE}
                acao={ACÕES.EXCLUIR}
                className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                fallback={
                  <div className="flex items-center justify-center px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Sem Permissão
                  </div>
                }
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Cliente
              </PermissionButton>

              {/* Botão de Visualizar Cliente */}
              <PermissionButton
                modulo={MODULOS.CLIENTE}
                acao={ACÕES.VISUALIZAR}
                className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                fallback={
                  <div className="flex items-center justify-center px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed">
                    <Eye className="h-4 w-4 mr-2" />
                    Sem Permissão
                  </div>
                }
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Cliente
              </PermissionButton>
            </div>
          </section>

          {/* Exemplos de Links com Permissões */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Links com Controle de Acesso
            </h2>
            <div className="space-y-2">
              <PermissionLink
                modulo={MODULOS.PESSOA_FISICA}
                acao={ACÕES.VISUALIZAR}
                href="/pessoas-fisicas"
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                fallback={
                  <span className="flex items-center text-gray-400 cursor-not-allowed">
                    <User className="h-4 w-4 mr-2" />
                    Pessoas Físicas (Sem Acesso)
                  </span>
                }
              >
                <User className="h-4 w-4 mr-2" />
                Pessoas Físicas
              </PermissionLink>

              <PermissionLink
                modulo={MODULOS.PESSOA_JURIDICA}
                acao={ACÕES.VISUALIZAR}
                href="/pessoas-juridicas"
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                fallback={
                  <span className="flex items-center text-gray-400 cursor-not-allowed">
                    <Building className="h-4 w-4 mr-2" />
                    Pessoas Jurídicas (Sem Acesso)
                  </span>
                }
              >
                <Building className="h-4 w-4 mr-2" />
                Pessoas Jurídicas
              </PermissionLink>

              <PermissionLink
                modulo={MODULOS.CLIENTE}
                acao={ACÕES.VISUALIZAR}
                href="/clientes"
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                fallback={
                  <span className="flex items-center text-gray-400 cursor-not-allowed">
                    <Users className="h-4 w-4 mr-2" />
                    Clientes (Sem Acesso)
                  </span>
                }
              >
                <Users className="h-4 w-4 mr-2" />
                Clientes
              </PermissionLink>
            </div>
          </section>

          {/* Exemplos de Seções com Permissões */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Seções com Controle de Acesso
            </h2>

            <PermissionSection
              modulo={MODULOS.USUARIO}
              acao={ACÕES.VISUALIZAR}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4"
              fallback={
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500">
                  <p>Você não tem permissão para visualizar usuários.</p>
                </div>
              }
            >
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Gerenciamento de Usuários
              </h3>
              <p className="text-blue-700">
                Esta seção só é visível para usuários com permissão de
                visualizar usuários.
              </p>
              <div className="mt-4 space-x-2">
                <PermissionButton
                  modulo={MODULOS.USUARIO}
                  acao={ACÕES.INCLUIR}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Novo Usuário
                </PermissionButton>
                <PermissionButton
                  modulo={MODULOS.USUARIO}
                  acao={ACÕES.EDITAR}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Editar Usuário
                </PermissionButton>
              </div>
            </PermissionSection>
          </section>

          {/* Exemplos de Múltiplas Permissões */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Múltiplas Permissões
            </h2>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <MultiplePermissionsWrapper
                permissions={[
                  { modulo: MODULOS.CLIENTE, acao: ACÕES.VISUALIZAR },
                  { modulo: MODULOS.CONTRATO, acao: ACÕES.VISUALIZAR },
                ]}
                fallback={
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500">
                    <p>
                      Você precisa de permissão para visualizar clientes OU
                      contratos.
                    </p>
                  </div>
                }
              >
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Relatórios de Vendas
                </h3>
                <p className="text-green-700">
                  Esta seção é visível se você tem permissão para visualizar
                  clientes ou contratos.
                </p>
              </MultiplePermissionsWrapper>
            </div>

            <div className="mt-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <MultiplePermissionsWrapper
                  permissions={[
                    { modulo: MODULOS.USUARIO, acao: ACÕES.VISUALIZAR },
                    { modulo: MODULOS.GRUPO_ACESSO, acao: ACÕES.VISUALIZAR },
                  ]}
                  requireAll={true}
                  fallback={
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500">
                      <p>
                        Você precisa de permissão para visualizar usuários E
                        grupos de acesso.
                      </p>
                    </div>
                  }
                >
                  <h3 className="text-lg font-semibold text-purple-800 mb-2">
                    Administração Completa
                  </h3>
                  <p className="text-purple-700">
                    Esta seção só é visível se você tem permissão para
                    visualizar usuários E grupos de acesso.
                  </p>
                </MultiplePermissionsWrapper>
              </div>
            </div>
          </section>

          {/* Exemplos de Hooks */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Uso de Hooks
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Permissões CRUD para Clientes
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center">
                  <span
                    className={`w-3 h-3 rounded-full mr-2 ${
                      canView ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></span>
                  Visualizar: {canView ? "Sim" : "Não"}
                </div>
                <div className="flex items-center">
                  <span
                    className={`w-3 h-3 rounded-full mr-2 ${
                      canCreate ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></span>
                  Criar: {canCreate ? "Sim" : "Não"}
                </div>
                <div className="flex items-center">
                  <span
                    className={`w-3 h-3 rounded-full mr-2 ${
                      canEdit ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></span>
                  Editar: {canEdit ? "Sim" : "Não"}
                </div>
                <div className="flex items-center">
                  <span
                    className={`w-3 h-3 rounded-full mr-2 ${
                      canDelete ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></span>
                  Excluir: {canDelete ? "Sim" : "Não"}
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Apenas Leitura: {isReadOnly ? "Sim" : "Não"}
              </div>
            </div>
          </section>

          {/* Exemplos de Contexto de Autenticação */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Contexto de Autenticação
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Verificação Direta de Permissões
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  Cliente - Visualizar:{" "}
                  {hasPermission(MODULOS.CLIENTE, ACÕES.VISUALIZAR)
                    ? "✅"
                    : "❌"}
                </div>
                <div>
                  Cliente - Criar:{" "}
                  {hasPermission(MODULOS.CLIENTE, ACÕES.INCLUIR) ? "✅" : "❌"}
                </div>
                <div>
                  Usuário - Visualizar:{" "}
                  {hasPermission(MODULOS.USUARIO, ACÕES.VISUALIZAR)
                    ? "✅"
                    : "❌"}
                </div>
                <div>
                  Grupo Acesso - Visualizar:{" "}
                  {hasPermission(MODULOS.GRUPO_ACESSO, ACÕES.VISUALIZAR)
                    ? "✅"
                    : "❌"}
                </div>
              </div>
            </div>
          </section>

          {/* Informações do Usuário */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Informações do Usuário
            </h2>
            <div className="flex items-center space-x-4">
              <UserGroupBadge />
              {permissoes?.filial && (
                <div className="text-sm text-gray-600">
                  Filial: {permissoes.filial}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </PermissionErrorWrapper>
  );
};
