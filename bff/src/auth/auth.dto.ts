export class LoginDto {
  login: string;
  senha: string;
}

export interface DotnetLoginResponse {
  usuarioId: number;
  login: string;
  email: string;
  nome: string;
  grupoAcesso: string;
  grupoAcessoId: number;
  filialId: number;
  filialNome: string;
  consultorId: number | null;
  tipoPessoa: string;
  ativo: boolean;
  ultimoAcesso: string;
  ultimoAcessoAnterior: string | null;
}

export interface BffUserPayload {
  sub: number;
  login: string;
  nome: string;
  email: string;
  grupoAcesso: string;
  grupoAcessoId: number;
  filialId: number;
  filialNome: string;
  consultorId: number | null;
  tipoPessoa: string;
  iat?: number;
  exp?: number;
}
