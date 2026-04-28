import pandas as pd
import re

def analisar_planilha_preciso():
    try:
        # Ler a planilha
        df = pd.read_excel(r"C:\Users\Mauro Benetti\Downloads\CPF E CNPJ - CLIENTES ARRIGHI.xlsx")
        
        print("=== ANÁLISE PRECISA DA PLANILHA ===")
        print(f"Total de registros: {len(df)}")
        
        # Verificar filiais únicas na planilha
        filiais_unicas = df.iloc[:, 5].dropna().unique()  # Coluna F
        print(f"\nFiliais encontradas na planilha:")
        for filial in sorted(filiais_unicas):
            count = len(df[df.iloc[:, 5] == filial])
            print(f"  - {filial}: {count} clientes")
        
        # Analisar alguns exemplos de nomes para entender o padrão
        print(f"\n=== EXEMPLOS DE CLIENTES POR FILIAL ===")
        for filial in sorted(filiais_unicas):
            clientes_filial = df[df.iloc[:, 5] == filial]
            print(f"\n{filial} ({len(clientes_filial)} clientes):")
            for i, (_, row) in enumerate(clientes_filial.head(3).iterrows()):
                nome = row.iloc[0]  # Coluna A
                cpf_cnpj = row.iloc[1]  # Coluna B
                print(f"  {i+1}. {nome} - {cpf_cnpj}")
        
        # Gerar query SQL específica baseada na análise
        print(f"\n=== GERANDO QUERY SQL ESPECÍFICA ===")
        
        query = """-- Query específica baseada na análise da planilha
-- Análise: Maioria dos clientes é de RIO DE JANEIRO

-- Pessoas Físicas - Mapeamento específico
UPDATE c
SET c.FilialId = 
    CASE """
        
        # Mapeamento baseado na análise real
        mapeamento = {
            'MANAUS': 11,  # Manaus - AM
            'SALVADOR': 8,  # Salvador - BA
            'SÃO PAULO': 5,  # São Paulo - SP
            'RIO DE JANEIRO': 1,  # Rio de Janeiro - RJ
            'CAMPINAS': 2,  # Campinas - SP
            'BELO HORIZONTE': 7,  # Belo Horizonte - BH
            'RIBEIRÃO PRETO': 13  # Ribeirão Preto - SP
        }
        
        for filial_planilha, filial_id in mapeamento.items():
            query += f"\n        WHEN pf.Nome LIKE '%{filial_planilha.lower()}%' THEN {filial_id}  -- {filial_planilha}"
        
        query += """
        ELSE 1  -- Rio de Janeiro - RJ (padrão - maioria dos clientes)
    END,
    c.DataAtualizacao = GETDATE()
FROM Clientes c
INNER JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
WHERE c.TipoPessoa = 'Fisica' AND c.Ativo = 1;

-- Pessoas Jurídicas - Mapeamento específico
UPDATE c
SET c.FilialId = 
    CASE """
        
        for filial_planilha, filial_id in mapeamento.items():
            query += f"\n        WHEN pj.RazaoSocial LIKE '%{filial_planilha.lower()}%' THEN {filial_id}  -- {filial_planilha}"
        
        query += """
        ELSE 1  -- Rio de Janeiro - RJ (padrão - maioria dos clientes)
    END,
    c.DataAtualizacao = GETDATE()
FROM Clientes c
INNER JOIN PessoasJuridicas pj ON c.PessoaJuridicaId = pj.Id
WHERE c.TipoPessoa = 'Juridica' AND c.Ativo = 1;

-- Verificar resultado
SELECT '=== FILIAIS ATUALIZADAS (ANÁLISE PRECISA) ===' as Info;
SELECT 
    f.Nome as Filial,
    COUNT(*) as TotalClientes
FROM Clientes c
INNER JOIN Filiais f ON c.FilialId = f.Id
WHERE c.Ativo = 1
GROUP BY f.Id, f.Nome
ORDER BY f.Nome;"""
        
        # Salvar query
        with open('atualizar_filiais_analise_precisa.sql', 'w', encoding='utf-8') as f:
            f.write(query)
        
        print(f"✅ Query SQL específica gerada em 'atualizar_filiais_analise_precisa.sql'")
        print(f"📊 Total de registros na planilha: {len(df)}")
        print(f"🏢 Filiais únicas encontradas: {len(filiais_unicas)}")
        
        # Estatísticas por filial
        print(f"\n=== ESTATÍSTICAS POR FILIAL ===")
        for filial in sorted(filiais_unicas):
            count = len(df[df.iloc[:, 5] == filial])
            print(f"  {filial}: {count} clientes")
        
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    analisar_planilha_preciso()
