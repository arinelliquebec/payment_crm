import pandas as pd
import re

def processar_planilha_filiais():
    # Caminho da planilha
    caminho_planilha = r"C:\Users\Mauro Benetti\Downloads\CPF E CNPJ - CLIENTES ARRIGHI.xlsx"
    
    try:
        # Ler a planilha
        df = pd.read_excel(caminho_planilha)
        
        print("=== DADOS DA PLANILHA ===")
        print(f"Total de registros: {len(df)}")
        print(f"Colunas: {list(df.columns)}")
        
        # Mapeamento de filiais da planilha para o padrão do sistema
        mapeamento_filiais = {
            'rio de janeiro': 'Rio de Janeiro - Copacabana',
            'são paulo': 'São Paulo - Centro',
            'belo horizonte': 'Belo Horizonte - Centro',
            'salvador': 'Salvador - Barra',
            'brasília': 'Brasília - Centro',
            'curitiba': 'Curitiba - Centro',
            'porto alegre': 'Porto Alegre - Centro',
            'fortaleza': 'Fortaleza - Centro',
            'recife': 'Recife - Centro',
            'manaus': 'Manaus - Centro',
            'goiânia': 'Goiânia - Centro',
            'campo grande': 'Campo Grande - Centro',
            'maceió': 'Maceió - Centro',
            'natal': 'Natal - Centro',
            'joão pessoa': 'João Pessoa - Centro',
            'teresina': 'Teresina - Centro',
            'são luís': 'São Luís - Centro',
            'palmas': 'Palmas - Centro',
            'aracaju': 'Aracaju - Centro',
            'vitória': 'Vitória - Centro',
            'florianópolis': 'Florianópolis - Centro',
            'cuiabá': 'Cuiabá - Centro',
            'porto velho': 'Porto Velho - Centro',
            'rio branco': 'Rio Branco - Centro',
            'boavista': 'Boa Vista - Centro',
            'macapá': 'Macapá - Centro'
        }
        
        # Processar dados
        resultados = []
        filiais_nao_mapeadas = set()
        
        for index, row in df.iterrows():
            try:
                nome = str(row.iloc[0]).strip().lower() if pd.notna(row.iloc[0]) else ''  # Coluna A
                cpf_cnpj = str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else ''      # Coluna B
                filial_planilha = str(row.iloc[5]).strip().lower() if pd.notna(row.iloc[5]) else ''  # Coluna F
                
                # Encontrar filial mapeada
                filial_mapeada = None
                for filial_planilha_key, filial_sistema in mapeamento_filiais.items():
                    if filial_planilha_key in filial_planilha:
                        filial_mapeada = filial_sistema
                        break
                
                if not filial_mapeada and filial_planilha:
                    filiais_nao_mapeadas.add(filial_planilha)
                    filial_mapeada = 'São Paulo - Centro'  # Filial padrão
                
                resultados.append({
                    'nome': nome,
                    'cpf_cnpj': cpf_cnpj,
                    'filial_planilha': filial_planilha,
                    'filial_sistema': filial_mapeada
                })
            except Exception as e:
                print(f"Erro ao processar linha {index}: {e}")
                continue
        
        # Gerar query SQL
        print("\n=== GERANDO QUERY SQL ===")
        
        # Query para pessoas físicas (CPF)
        query_pf = """-- Atualizar filiais de Pessoas Físicas baseado na planilha
UPDATE c
SET c.Filial = 
    CASE """
        
        for filial_planilha_key, filial_sistema in mapeamento_filiais.items():
            query_pf += f"\n        WHEN pf.Nome LIKE '%{filial_planilha_key}%' THEN '{filial_sistema}'"
        
        query_pf += """
        ELSE 'São Paulo - Centro' -- Filial padrão
    END,
    c.DataAtualizacao = GETDATE()
FROM Clientes c
INNER JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
WHERE c.TipoPessoa = 'Fisica' AND c.Ativo = 1;"""
        
        # Query para pessoas jurídicas (CNPJ)
        query_pj = """-- Atualizar filiais de Pessoas Jurídicas baseado na planilha
UPDATE c
SET c.Filial = 
    CASE """
        
        for filial_planilha_key, filial_sistema in mapeamento_filiais.items():
            query_pj += f"\n        WHEN pj.RazaoSocial LIKE '%{filial_planilha_key}%' THEN '{filial_sistema}'"
        
        query_pj += """
        ELSE 'São Paulo - Centro' -- Filial padrão
    END,
    c.DataAtualizacao = GETDATE()
FROM Clientes c
INNER JOIN PessoasJuridicas pj ON c.PessoaJuridicaId = pj.Id
WHERE c.TipoPessoa = 'Juridica' AND c.Ativo = 1;"""
        
        # Salvar queries em arquivo
        with open('atualizar_filiais_planilha.sql', 'w', encoding='utf-8') as f:
            f.write("-- Query gerada automaticamente baseada na planilha\n")
            f.write("-- Arquivo: CPF E CNPJ - CLIENTES ARRIGHI.xlsx\n\n")
            f.write(query_pf)
            f.write("\n\n")
            f.write(query_pj)
            f.write("\n\n-- Verificar resultado\n")
            f.write("SELECT '=== FILIAIS ATUALIZADAS ===' as Info;\n")
            f.write("SELECT \n")
            f.write("    c.Filial,\n")
            f.write("    COUNT(*) as TotalClientes\n")
            f.write("FROM Clientes c\n")
            f.write("WHERE c.Ativo = 1\n")
            f.write("GROUP BY c.Filial\n")
            f.write("ORDER BY c.Filial;")
        
        print("✅ Query SQL gerada em 'atualizar_filiais_planilha.sql'")
        
        # Estatísticas
        print(f"\n=== ESTATÍSTICAS ===")
        print(f"Total de registros processados: {len(resultados)}")
        print(f"Filiais não mapeadas encontradas: {len(filiais_nao_mapeadas)}")
        
        if filiais_nao_mapeadas:
            print(f"Filiais não mapeadas: {sorted(filiais_nao_mapeadas)}")
        
        # Contar por filial
        contagem_filiais = {}
        for r in resultados:
            filial = r['filial_sistema']
            contagem_filiais[filial] = contagem_filiais.get(filial, 0) + 1
        
        print(f"\nDistribuição por filial:")
        for filial, count in sorted(contagem_filiais.items()):
            print(f"  {filial}: {count} clientes")
            
    except Exception as e:
        print(f"❌ Erro ao processar planilha: {e}")

if __name__ == "__main__":
    processar_planilha_filiais()
