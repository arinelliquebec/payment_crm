-- Script para inserir apenas as permissões de PessoaJuridica
-- Executar apenas esta seção se necessário

INSERT INTO Permissoes (Nome, Descricao, Modulo, Acao, Ativo, DataCadastro) VALUES
-- Módulo PessoaJuridica
('PessoaJuridica_Visualizar', 'Visualizar pessoas jurídicas', 'PessoaJuridica', 'Visualizar', 1, GETDATE()),
('PessoaJuridica_Incluir', 'Incluir pessoas jurídicas', 'PessoaJuridica', 'Incluir', 1, GETDATE()),
('PessoaJuridica_Editar', 'Editar pessoas jurídicas', 'PessoaJuridica', 'Editar', 1, GETDATE()),
('PessoaJuridica_Excluir', 'Excluir pessoas jurídicas', 'PessoaJuridica', 'Excluir', 1, GETDATE());
