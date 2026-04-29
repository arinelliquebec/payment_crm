import { apiClient } from "@/lib/api";

export interface UserData {
  usuarioId: number;
  login: string;
  email: string;
  nome: string;
  grupoAcesso: string;
  grupoAcessoId: number;
  filialId?: number;
  filialNome?: string;
  consultorId?: number;
  tipoPessoa: string;
  ativo: boolean;
  ultimoAcesso?: string;
}

class UserService {
  /**
   * Busca dados atualizados do usuário logado
   */
  async getCurrentUserData(): Promise<UserData | null> {
    try {
      // Buscar dados do usuário através do endpoint de permissões
      const permissionsResponse = await apiClient.get(
        "/Permission/user-status"
      );

      if (permissionsResponse.error || !permissionsResponse.data) {
        console.error(
          "Erro ao buscar dados do usuário:",
          permissionsResponse.error
        );
        return null;
      }

      const permissionsData = permissionsResponse.data as any;

      // Buscar dados completos do usuário
      const userResponse = await apiClient.get(
        `/Usuario/${permissionsData.usuarioId}`
      );

      if (userResponse.error || !userResponse.data) {
        console.error(
          "Erro ao buscar dados completos do usuário:",
          userResponse.error
        );
        return null;
      }

      const userData = userResponse.data as any;

      // Combinar dados
      const combinedData: UserData = {
        usuarioId: userData.id,
        login: userData.login,
        email: userData.email,
        nome:
          userData.pessoaFisica?.nome ||
          userData.pessoaJuridica?.razaoSocial ||
          userData.login,
        grupoAcesso: permissionsData.grupo, // Usar grupo das permissões (mais confiável)
        grupoAcessoId: userData.grupoAcessoId,
        filialId: userData.filialId,
        filialNome: userData.filial?.nome,
        consultorId: userData.consultorId,
        tipoPessoa: userData.tipoPessoa,
        ativo: userData.ativo,
        ultimoAcesso: userData.ultimoAcesso,
      };

      return combinedData;
    } catch (error) {
      console.error("Erro no UserService.getCurrentUserData:", error);
      return null;
    }
  }
}

export const userService = new UserService();
