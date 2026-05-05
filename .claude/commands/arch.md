# Command: /arch

Analise o código-fonte do projeto e gere/atualize a documentação de arquitetura em Structurizr DSL.

## Passos

1. Leia os arquivos principais: src/, services/, controllers/, models/ (ou equivalentes do projeto)
2. Identifique:
   - Pessoas/atores que usam o sistema
   - Sistemas externos com que o código se integra (APIs, bancos, filas)
   - Containers internos (APIs, workers, frontends, databases)
   - Relacionamentos e fluxo de dados
3. Gere o DSL Structurizr C4 cobrindo System Context e Container views
4. Use a ferramenta Structurizr MCP para VALIDAR o DSL gerado
5. Se válido, salve em docs/architecture.dsl
6. Exporte a System Context view para Mermaid e salve em docs/architecture.md
7. Reporte o que foi documentado e o que ficou de fora