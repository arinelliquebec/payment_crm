-- Script para criar grupos de acesso e permissões do sistema CRM Arrighi
-- Executar após as migrations estarem aplicadas

-- Limpar dados existentes (se houver)
DELETE FROM PermissoesGrupos;
DELETE FROM Permissoes;
DELETE FROM GruposAcesso;

-- Resetar identity columns
DBCC CHECKIDENT ('GruposAcesso', RESEED, 0);
DBCC CHECKIDENT ('Permissoes', RESEED, 0);
DBCC CHECKIDENT ('PermissoesGrupos', RESEED, 0);

-- 1. CRIAR GRUPOS DE ACESSO
INSERT INTO GruposAcesso (Nome, Descricao, Ativo, DataCadastro) VALUES
('Usuario', 'Usuário sem grupo de acesso - não tem permissões até ser alocado em um grupo', 1, GETDATE()),
('Administrador', 'Acesso total ao sistema', 1, GETDATE()),
('Consultores', 'Acesso a pessoa física/jurídica total, clientes da mesma filial e sem contrato', 1, GETDATE()),
('Administrativo de Filial', 'Apenas visualização de consultores, clientes e contratos da sua filial', 1, GETDATE()),
('Gestor de Filial', 'Edita, inclui e exclui em todo o sistema porém somente na sua filial', 1, GETDATE()),
('Cobrança e Financeiro', 'Acesso total para visualizar todo o sistema (aba usuários oculta)', 1, GETDATE()),
('Faturamento', 'Acesso similar ao administrador exceto módulo de usuários', 1, GETDATE());

-- 2. CRIAR PERMISSÕES DO SISTEMA
INSERT INTO Permissoes (Nome, Descricao, Modulo, Acao, Ativo, DataCadastro) VALUES
-- Módulo PessoaFisica
('PessoaFisica_Visualizar', 'Visualizar pessoas físicas', 'PessoaFisica', 'Visualizar', 1, GETDATE()),
('PessoaFisica_Incluir', 'Incluir pessoas físicas', 'PessoaFisica', 'Incluir', 1, GETDATE()),
('PessoaFisica_Editar', 'Editar pessoas físicas', 'PessoaFisica', 'Editar', 1, GETDATE()),
('PessoaFisica_Excluir', 'Excluir pessoas físicas', 'PessoaFisica', 'Excluir', 1, GETDATE()),

-- Módulo PessoaJuridica
('PessoaJuridica_Visualizar', 'Visualizar pessoas jurídicas', 'PessoaJuridica', 'Visualizar', 1, GETDATE()),
('PessoaJuridica_Incluir', 'Incluir pessoas jurídicas', 'PessoaJuridica', 'Incluir', 1, GETDATE()),
('PessoaJuridica_Editar', 'Editar pessoas jurídicas', 'PessoaJuridica', 'Editar', 1, GETDATE()),
('PessoaJuridica_Excluir', 'Excluir pessoas jurídicas', 'PessoaJuridica', 'Excluir', 1, GETDATE()),

-- Módulo Cliente
('Cliente_Visualizar', 'Visualizar clientes', 'Cliente', 'Visualizar', 1, GETDATE()),
('Cliente_Incluir', 'Incluir clientes', 'Cliente', 'Incluir', 1, GETDATE()),
('Cliente_Editar', 'Editar clientes', 'Cliente', 'Editar', 1, GETDATE()),
('Cliente_Excluir', 'Excluir clientes', 'Cliente', 'Excluir', 1, GETDATE()),

-- Módulo Contrato
('Contrato_Visualizar', 'Visualizar contratos', 'Contrato', 'Visualizar', 1, GETDATE()),
('Contrato_Incluir', 'Incluir contratos', 'Contrato', 'Incluir', 1, GETDATE()),
('Contrato_Editar', 'Editar contratos', 'Contrato', 'Editar', 1, GETDATE()),
('Contrato_Excluir', 'Excluir contratos', 'Contrato', 'Excluir', 1, GETDATE()),

-- Módulo Consultor
('Consultor_Visualizar', 'Visualizar consultores', 'Consultor', 'Visualizar', 1, GETDATE()),
('Consultor_Incluir', 'Incluir consultores', 'Consultor', 'Incluir', 1, GETDATE()),
('Consultor_Editar', 'Editar consultores', 'Consultor', 'Editar', 1, GETDATE()),
('Consultor_Excluir', 'Excluir consultores', 'Consultor', 'Excluir', 1, GETDATE()),

-- Módulo Usuario
('Usuario_Visualizar', 'Visualizar usuários', 'Usuario', 'Visualizar', 1, GETDATE()),
('Usuario_Incluir', 'Incluir usuários', 'Usuario', 'Incluir', 1, GETDATE()),
('Usuario_Editar', 'Editar usuários', 'Usuario', 'Editar', 1, GETDATE()),
('Usuario_Excluir', 'Excluir usuários', 'Usuario', 'Excluir', 1, GETDATE()),

-- Módulo Filial
('Filial_Visualizar', 'Visualizar filiais', 'Filial', 'Visualizar', 1, GETDATE()),
('Filial_Incluir', 'Incluir filiais', 'Filial', 'Incluir', 1, GETDATE()),
('Filial_Editar', 'Editar filiais', 'Filial', 'Editar', 1, GETDATE()),
('Filial_Excluir', 'Excluir filiais', 'Filial', 'Excluir', 1, GETDATE()),

-- Módulo Parceiro
('Parceiro_Visualizar', 'Visualizar parceiros', 'Parceiro', 'Visualizar', 1, GETDATE()),
('Parceiro_Incluir', 'Incluir parceiros', 'Parceiro', 'Incluir', 1, GETDATE()),
('Parceiro_Editar', 'Editar parceiros', 'Parceiro', 'Editar', 1, GETDATE()),
('Parceiro_Excluir', 'Excluir parceiros', 'Parceiro', 'Excluir', 1, GETDATE()),

-- Módulo Boleto
('Boleto_Visualizar', 'Visualizar boletos', 'Boleto', 'Visualizar', 1, GETDATE()),
('Boleto_Incluir', 'Incluir boletos', 'Boleto', 'Incluir', 1, GETDATE()),
('Boleto_Editar', 'Editar boletos', 'Boleto', 'Editar', 1, GETDATE()),
('Boleto_Excluir', 'Excluir boletos', 'Boleto', 'Excluir', 1, GETDATE()),

-- Módulo GrupoAcesso
('GrupoAcesso_Visualizar', 'Visualizar grupos de acesso', 'GrupoAcesso', 'Visualizar', 1, GETDATE()),
('GrupoAcesso_Incluir', 'Incluir grupos de acesso', 'GrupoAcesso', 'Incluir', 1, GETDATE()),
('GrupoAcesso_Editar', 'Editar grupos de acesso', 'GrupoAcesso', 'Editar', 1, GETDATE()),
('GrupoAcesso_Excluir', 'Excluir grupos de acesso', 'GrupoAcesso', 'Excluir', 1, GETDATE());

-- 3. ATRIBUIR PERMISSÕES AOS GRUPOS

-- GRUPO 1: Usuario (sem permissões)
-- Não recebe nenhuma permissão

-- GRUPO 2: Administrador (acesso total)
INSERT INTO PermissoesGrupos (GrupoAcessoId, PermissaoId, ApenasProprios, ApenasFilial, ApenasLeitura, IncluirSituacoesEspecificas, SituacoesEspecificas, DataCadastro)
SELECT 2, Id, 0, 0, 0, 0, NULL, GETDATE() FROM Permissoes;

-- GRUPO 3: Consultores
-- PessoaFisica e PessoaJuridica - acesso total
INSERT INTO PermissoesGrupos (GrupoAcessoId, PermissaoId, ApenasProprios, ApenasFilial, ApenasLeitura, IncluirSituacoesEspecificas, SituacoesEspecificas, DataCadastro)
SELECT 3, Id, 0, 0, 0, 0, NULL, GETDATE() FROM Permissoes WHERE Modulo IN ('PessoaFisica', 'PessoaJuridica');

-- Cliente - apenas da mesma filial e sem contrato (ou com situações específicas)
INSERT INTO PermissoesGrupos (GrupoAcessoId, PermissaoId, ApenasProprios, ApenasFilial, ApenasLeitura, IncluirSituacoesEspecificas, SituacoesEspecificas, DataCadastro)
SELECT 3, Id, 0, 1, 0, 1, '["Sem interesse", "Não encontrado"]', GETDATE() FROM Permissoes WHERE Modulo = 'Cliente';

-- GRUPO 4: Administrativo de Filial (apenas visualização da sua filial)
INSERT INTO PermissoesGrupos (GrupoAcessoId, PermissaoId, ApenasProprios, ApenasFilial, ApenasLeitura, IncluirSituacoesEspecificas, SituacoesEspecificas, DataCadastro)
SELECT 4, Id, 0, 1, 1, 0, NULL, GETDATE() FROM Permissoes WHERE Modulo IN ('Consultor', 'Cliente', 'Contrato') AND Acao = 'Visualizar';

-- GRUPO 5: Gestor de Filial (acesso total apenas na sua filial)
INSERT INTO PermissoesGrupos (GrupoAcessoId, PermissaoId, ApenasProprios, ApenasFilial, ApenasLeitura, IncluirSituacoesEspecificas, SituacoesEspecificas, DataCadastro)
SELECT 5, Id, 0, 1, 0, 0, NULL, GETDATE() FROM Permissoes WHERE Modulo IN ('PessoaFisica', 'PessoaJuridica', 'Cliente', 'Contrato', 'Consultor', 'Parceiro', 'Boleto');

-- GRUPO 6: Cobrança e Financeiro (acesso total exceto usuários)
INSERT INTO PermissoesGrupos (GrupoAcessoId, PermissaoId, ApenasProprios, ApenasFilial, ApenasLeitura, IncluirSituacoesEspecificas, SituacoesEspecificas, DataCadastro)
SELECT 6, Id, 0, 0, 0, 0, NULL, GETDATE() FROM Permissoes WHERE Modulo != 'Usuario';

-- GRUPO 7: Faturamento (acesso total exceto usuários)
INSERT INTO PermissoesGrupos (GrupoAcessoId, PermissaoId, ApenasProprios, ApenasFilial, ApenasLeitura, IncluirSituacoesEspecificas, SituacoesEspecificas, DataCadastro)
SELECT 7, Id, 0, 0, 0, 0, NULL, GETDATE() FROM Permissoes WHERE Modulo != 'Usuario';

-- Verificar os dados inseridos
SELECT 'GRUPOS CRIADOS:' as Info;
SELECT Id, Nome, Descricao FROM GruposAcesso ORDER BY Id;

SELECT 'PERMISSÕES CRIADAS:' as Info;
SELECT COUNT(*) as TotalPermissoes FROM Permissoes;

SELECT 'PERMISSÕES POR GRUPO:' as Info;
SELECT 
    g.Nome as Grupo,
    COUNT(pg.Id) as TotalPermissoes
FROM GruposAcesso g
LEFT JOIN PermissoesGrupos pg ON g.Id = pg.GrupoAcessoId
GROUP BY g.Id, g.Nome
ORDER BY g.Id;
