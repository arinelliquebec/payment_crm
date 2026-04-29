"use client";

import React from "react";
import {
  GroupAccessGuard,
  ModuleAccessGuard,
  ValidGroupGuard,
  GroupInfo,
} from "@/components/guards";
import {
  useGroupAccess,
  useCanAccessScreen,
  useCanAccessModule,
  useAccessibleScreens,
  useAccessibleModules,
  useGroupCharacteristics,
} from "@/hooks/useGroupAccess";
import { TELAS, MODULOS } from "@/types/groupAccess";
import { Loader2, Shield, CheckCircle, XCircle } from "lucide-react";

/**
 * Exemplos de uso do sistema de grupos de acesso
 */
export const GroupAccessExamples: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Sistema de Grupos de Acesso - Exemplos
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GroupInfoExample />
          <GroupCharacteristicsExample />
          <ScreenAccessExample />
          <ModuleAccessExample />
          <AccessibleItemsExample />
        </div>
      </div>

      <GuardsExample />
      <NavigationExample />
    </div>
  );
};

/**
 * Exemplo de informações do grupo
 */
const GroupInfoExample: React.FC = () => {
  const { groupInfo, loading, error } = useGroupAccess();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Informações do Grupo</h2>
        <div className="flex items-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Informações do Grupo</h2>
        <div className="text-red-600">Erro: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Informações do Grupo</h2>
      <GroupInfo />
    </div>
  );
};

/**
 * Exemplo de características do grupo
 */
const GroupCharacteristicsExample: React.FC = () => {
  const { characteristics, loading } = useGroupCharacteristics();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Características do Grupo</h2>
        <div className="flex items-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Características do Grupo</h2>
      <div className="space-y-3">
        <div className="flex items-center">
          <span className="font-medium w-32">Grupo:</span>
          <span className="text-gray-900">{characteristics.groupName}</span>
        </div>
        <div className="flex items-center">
          <span className="font-medium w-32">Apenas Filial:</span>
          {characteristics.isFilialOnly ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
        </div>
        <div className="flex items-center">
          <span className="font-medium w-32">Somente Leitura:</span>
          {characteristics.isReadOnly ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
        </div>
        <div className="flex items-center">
          <span className="font-medium w-32">Ocultar Usuários:</span>
          {characteristics.shouldHideUsersTab ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
        </div>
        <div className="flex items-center">
          <span className="font-medium w-32">Grupo Válido:</span>
          {characteristics.hasValidGroup ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Exemplo de verificação de acesso a telas
 */
const ScreenAccessExample: React.FC = () => {
  const screens = [
    TELAS.PESSOAS_FISICAS,
    TELAS.PESSOAS_JURIDICAS,
    TELAS.CLIENTES,
    TELAS.CONTRATOS,
    TELAS.CONSULTORES,
    TELAS.USUARIOS,
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Acesso a Telas</h2>
      <div className="space-y-2">
        {screens.map((screen) => (
          <ScreenAccessItem key={screen} screenName={screen} />
        ))}
      </div>
    </div>
  );
};

const ScreenAccessItem: React.FC<{ screenName: string }> = ({ screenName }) => {
  const { canAccess, loading } = useCanAccessScreen(screenName);

  if (loading) {
    return (
      <div className="flex items-center justify-between p-2">
        <span className="text-sm">{screenName}</span>
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
      <span className="text-sm font-medium">{screenName}</span>
      {canAccess ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
    </div>
  );
};

/**
 * Exemplo de verificação de acesso a módulos
 */
const ModuleAccessExample: React.FC = () => {
  const modules = [
    MODULOS.PESSOA_FISICA,
    MODULOS.PESSOA_JURIDICA,
    MODULOS.CLIENTE,
    MODULOS.CONTRATO,
    MODULOS.CONSULTOR,
    MODULOS.USUARIO,
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Acesso a Módulos</h2>
      <div className="space-y-2">
        {modules.map((module) => (
          <ModuleAccessItem key={module} moduleName={module} />
        ))}
      </div>
    </div>
  );
};

const ModuleAccessItem: React.FC<{ moduleName: string }> = ({ moduleName }) => {
  const { canAccess, loading } = useCanAccessModule(moduleName);

  if (loading) {
    return (
      <div className="flex items-center justify-between p-2">
        <span className="text-sm">{moduleName}</span>
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
      <span className="text-sm font-medium">{moduleName}</span>
      {canAccess ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
    </div>
  );
};

/**
 * Exemplo de itens acessíveis
 */
const AccessibleItemsExample: React.FC = () => {
  const { screens, loading: screensLoading } = useAccessibleScreens();
  const { modules, loading: modulesLoading } = useAccessibleModules();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Itens Acessíveis</h2>

      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">
            Telas Acessíveis ({screens.length})
          </h3>
          {screensLoading ? (
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>Carregando...</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {screens.map((screen) => (
                <span
                  key={screen}
                  className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                >
                  {screen}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-medium mb-2">
            Módulos Acessíveis ({modules.length})
          </h3>
          {modulesLoading ? (
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>Carregando...</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {modules.map((module) => (
                <span
                  key={module}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {module}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Exemplo de uso dos guards
 */
const GuardsExample: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Exemplos de Guards</h2>

      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Guard de Tela - Usuários</h3>
          <GroupAccessGuard screenName={TELAS.USUARIOS}>
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800">
                ✅ Você tem acesso à tela de usuários!
              </p>
            </div>
          </GroupAccessGuard>
        </div>

        <div>
          <h3 className="font-medium mb-2">Guard de Módulo - Usuario</h3>
          <ModuleAccessGuard moduleName={MODULOS.USUARIO}>
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800">
                ✅ Você tem acesso ao módulo de usuários!
              </p>
            </div>
          </ModuleAccessGuard>
        </div>

        <div>
          <h3 className="font-medium mb-2">Guard de Grupo Válido</h3>
          <ValidGroupGuard>
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800">
                ✅ Você tem um grupo de acesso válido!
              </p>
            </div>
          </ValidGroupGuard>
        </div>
      </div>
    </div>
  );
};

/**
 * Exemplo de navegação baseada em grupos
 */
const NavigationExample: React.FC = () => {
  const { screens, loading } = useAccessibleScreens();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Navegação</h2>
        <div className="flex items-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span>Carregando navegação...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">
        Navegação Baseada em Grupos
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {screens.map((screen) => (
          <div
            key={screen}
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">
                {screen}
              </span>
            </div>
          </div>
        ))}
      </div>

      {screens.length === 0 && (
        <div className="text-center py-8">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            Nenhuma tela acessível encontrada para seu grupo de acesso.
          </p>
        </div>
      )}
    </div>
  );
};
