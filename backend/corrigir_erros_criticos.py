#!/usr/bin/env python3
"""
Script para corrigir erros críticos no backend do CRM Arrighi
- Substitui DateTime.Now por DateTime.UtcNow
- Substitui Console.WriteLine por _logger.LogDebug (condicional)
"""

import os
import re
from pathlib import Path

# Configurações
BACKEND_DIR = Path(__file__).parent
CONTROLLERS_DIR = BACKEND_DIR / "Controllers"
BACKUP_SUFFIX = ".backup_critical"

# Contadores
stats = {
    "files_processed": 0,
    "datetime_fixed": 0,
    "console_fixed": 0,
    "errors": 0
}

def backup_file(filepath):
    """Cria backup do arquivo"""
    backup_path = str(filepath) + BACKUP_SUFFIX
    if not os.path.exists(backup_path):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✅ Backup criado: {backup_path}")

def fix_datetime_now(content):
    """Substitui DateTime.Now por DateTime.UtcNow"""
    count = content.count("DateTime.Now")
    if count > 0:
        content = content.replace("DateTime.Now", "DateTime.UtcNow")
        stats["datetime_fixed"] += count
    return content, count

def add_logger_if_needed(content):
    """Adiciona campo _logger se não existir e houver Console.WriteLine"""
    if "Console.WriteLine" not in content:
        return content, False

    if "_logger" in content or "ILogger" in content:
        return content, False  # Já tem logger

    # Verificar se é um controller
    if "public class" not in content or "Controller" not in content:
        return content, False

    # Extrair nome da classe
    class_match = re.search(r'public class (\w+)', content)
    if not class_match:
        return content, False

    class_name = class_match.group(1)

    # Verificar se já tem campo readonly
    has_readonly = re.search(r'private readonly \w+ ', content)
    if not has_readonly:
        return content, False

    # Adicionar using Microsoft.Extensions.Logging se não existir
    if "using Microsoft.Extensions.Logging;" not in content:
        # Adicionar após outros usings
        using_match = re.search(r'(using [^;]+;)\n+namespace', content)
        if using_match:
            last_using = using_match.group(1)
            content = content.replace(
                last_using,
                last_using + "\nusing Microsoft.Extensions.Logging;"
            )

    # Adicionar campo _logger
    field_pattern = r'(private readonly \w+ \w+;)'
    field_match = re.search(field_pattern, content)
    if field_match:
        last_field = field_match.group(1)
        content = content.replace(
            last_field,
            last_field + f"\n        private readonly ILogger<{class_name}> _logger;"
        )

    # Adicionar parâmetro no construtor
    constructor_pattern = rf'public {class_name}\(([^)]*)\)'
    constructor_match = re.search(constructor_pattern, content)
    if constructor_match:
        params = constructor_match.group(1)
        if params.strip():
            new_params = params + f", ILogger<{class_name}> logger"
        else:
            new_params = f"ILogger<{class_name}> logger"

        old_constructor = constructor_match.group(0)
        new_constructor = f"public {class_name}({new_params})"
        content = content.replace(old_constructor, new_constructor)

        # Adicionar atribuição no corpo do construtor
        constructor_body_pattern = rf'public {class_name}\([^)]*\)\s*\{{'
        constructor_body_match = re.search(constructor_body_pattern, content)
        if constructor_body_match:
            # Encontrar próxima linha após {
            insert_pos = constructor_body_match.end()
            # Adicionar atribuição
            content = content[:insert_pos] + "\n            _logger = logger;" + content[insert_pos:]

    return content, True

def fix_console_writeline(content):
    """Envolve Console.WriteLine em #if DEBUG (não substitui por logger para manter compatibilidade)"""
    if "Console.WriteLine" not in content:
        return content, 0

    count = content.count("Console.WriteLine")

    # Padrão: capturar linhas com Console.WriteLine
    pattern = r'^(\s*)(Console\.WriteLine\([^)]*\);)$'

    lines = content.split('\n')
    new_lines = []
    i = 0

    while i < len(lines):
        line = lines[i]
        match = re.match(pattern, line)

        if match:
            indent = match.group(1)
            console_line = match.group(2)

            # Adicionar #if DEBUG antes
            new_lines.append(f"{indent}#if DEBUG")
            new_lines.append(line)
            new_lines.append(f"{indent}#endif")
            stats["console_fixed"] += 1
        else:
            new_lines.append(line)

        i += 1

    return '\n'.join(new_lines), count

def process_file(filepath):
    """Processa um arquivo"""
    try:
        print(f"\n📄 Processando: {filepath.name}")

        # Ler conteúdo
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Criar backup
        backup_file(filepath)

        # Aplicar correções
        content, datetime_count = fix_datetime_now(content)
        if datetime_count > 0:
            print(f"  ✅ {datetime_count} DateTime.Now → DateTime.UtcNow")

        # Adicionar logger se necessário
        # content, logger_added = add_logger_if_needed(content)
        # if logger_added:
        #     print(f"  ✅ Logger adicionado ao controller")

        # Comentar Console.WriteLine (não fazer nada por enquanto - muito invasivo)
        # content, console_count = fix_console_writeline(content)
        # if console_count > 0:
        #     print(f"  ✅ {console_count} Console.WriteLine envoltos em #if DEBUG")

        # Salvar se houve mudanças
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  💾 Arquivo salvo")
            stats["files_processed"] += 1
        else:
            print(f"  ℹ️  Nenhuma mudança necessária")

    except Exception as e:
        print(f"  ❌ Erro: {e}")
        stats["errors"] += 1

def main():
    """Função principal"""
    print("🔧 Corrigindo erros críticos no backend...")
    print(f"📁 Diretório: {CONTROLLERS_DIR}")
    print("=" * 60)

    # Processar arquivos .cs (exceto backups)
    cs_files = [
        f for f in CONTROLLERS_DIR.glob("*.cs")
        if not f.name.endswith(".backup") and not f.name.endswith(".bak")
    ]

    print(f"\n📊 Encontrados {len(cs_files)} arquivos .cs")

    for filepath in sorted(cs_files):
        process_file(filepath)

    # Estatísticas finais
    print("\n" + "=" * 60)
    print("📊 ESTATÍSTICAS FINAIS:")
    print(f"  ✅ Arquivos processados: {stats['files_processed']}")
    print(f"  🔧 DateTime.Now corrigidos: {stats['datetime_fixed']}")
    print(f"  📝 Console.WriteLine tratados: {stats['console_fixed']}")
    print(f"  ❌ Erros: {stats['errors']}")
    print("=" * 60)

    if stats['errors'] == 0:
        print("\n✅ Correções concluídas com sucesso!")
    else:
        print(f"\n⚠️  Concluído com {stats['errors']} erro(s)")

if __name__ == "__main__":
    main()
