import pandas as pd

def gerar_query_filiais():
    try:
        # Ler a planilha
        df = pd.read_excel(r"C:\Users\Mauro Benetti\Downloads\CPF E CNPJ - CLIENTES ARRIGHI.xlsx")
        
        print("=== DADOS DA PLANILHA ===")
        print(f"Total de registros: {len(df)}")
        print(f"Colunas: {list(df.columns)}")
        
        # Verificar filiais únicas na planilha
        filiais_unicas = df.iloc[:, 5].dropna().unique()  # Coluna F
        print(f"\nFiliais encontradas na planilha:")
        for filial in sorted(filiais_unicas):
            print(f"  - {filial}")
        
        # Mapeamento manual baseado nas filiais encontradas
        mapeamento = {
            'rio de janeiro': 'Rio de Janeiro - Copacabana',
            'são paulo': 'São Paulo - Centro',
            'belo horizonte': 'Belo Horizonte - Centro',
            'salvador': 'Salvador - Barra',
            'brasília': 'Brasília - Centro',
            'curitiba': 'Curitiba - Centro',
            'porto alegre': 'Porto Alegre - Centro',
            'fortaleza': 'Fortaleza - Centro',
            'recife': 'Recife - Centro',
            'manaus': 'Manaus - Centro'
        }
        
        # Gerar query SQL
        query = """-- Atualizar filiais dos clientes baseado na planilha
-- Pessoas Físicas
UPDATE c
SET c.Filial = 
    CASE """
        
        for filial_planilha, filial_sistema in mapeamento.items():
            query += f"\n        WHEN pf.Nome LIKE '%{filial_planilha}%' THEN '{filial_sistema}'"
        
        query += """
        ELSE 'São Paulo - Centro' -- Filial padrão
    END,
    c.DataAtualizacao = GETDATE()
FROM Clientes c
INNER JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
WHERE c.TipoPessoa = 'Fisica' AND c.Ativo = 1;

-- Pessoas Jurídicas
UPDATE c
SET c.Filial = 
    CASE """
        
        for filial_planilha, filial_sistema in mapeamento.items():
            query += f"\n        WHEN pj.RazaoSocial LIKE '%{filial_planilha}%' THEN '{filial_sistema}'"
        
        query += """
        ELSE 'São Paulo - Centro' -- Filial padrão
    END,
    c.DataAtualizacao = GETDATE()
FROM Clientes c
INNER JOIN PessoasJuridicas pj ON c.PessoaJuridicaId = pj.Id
WHERE c.TipoPessoa = 'Juridica' AND c.Ativo = 1;

-- Verificar resultado
SELECT '=== FILIAIS ATUALIZADAS ===' as Info;
SELECT 
    c.Filial,
    COUNT(*) as TotalClientes
FROM Clientes c
WHERE c.Ativo = 1
GROUP BY c.Filial
ORDER BY c.Filial;"""
        
        # Salvar query
        with open('atualizar_filiais_planilha.sql', 'w', encoding='utf-8') as f:
            f.write(query)
        
        print(f"\n✅ Query SQL gerada em 'atualizar_filiais_planilha.sql'")
        print(f"📊 Total de registros na planilha: {len(df)}")
        print(f"🏢 Filiais únicas encontradas: {len(filiais_unicas)}")
        
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    gerar_query_filiais()
