# Script para migrar PDFs de boletos existentes para Azure Blob Storage
# Este script chama o endpoint /pdf que automaticamente salva o PDF no Blob

$baseUrl = "https://arrighi-bk-bzfmgxavaxbyh5ej.brazilsouth-01.azurewebsites.net"
$endpoint = "/api/Boleto"
$headers = @{ "X-Usuario-Id" = "3" }

# Lista de IDs dos boletos a serem migrados (obtidos da query SQL)
$boletoIds = @(
    60, 67, 74, 76, 85, 86, 87, 88, 97, 102, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113,
    114, 115, 116, 117, 118, 121, 123, 136, 140, 141, 143, 146, 147, 148, 151, 152, 153, 156,
    157, 158, 163, 170, 171, 173, 174, 175, 179, 180, 183, 190, 192, 193, 194, 195, 198, 199,
    205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Migracao de PDFs de Boletos" -ForegroundColor Cyan
Write-Host "  Total: $($boletoIds.Count) boletos" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$sucessos = 0
$erros = 0
$total = $boletoIds.Count

foreach ($id in $boletoIds) {
    $url = "$baseUrl$endpoint/$id/pdf"
    $progresso = [math]::Round(($boletoIds.IndexOf($id) + 1) / $total * 100, 1)
    
    Write-Host "[$progresso%] Processando boleto #$id..." -NoNewline
    
    try {
        # Fazer requisicao GET para baixar o PDF (isso automaticamente salva no Blob)
        $response = Invoke-WebRequest -Uri $url -Method GET -Headers $headers -TimeoutSec 60 -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            Write-Host " OK (PDF salvo)" -ForegroundColor Green
            $sucessos++
        } else {
            Write-Host " AVISO: Status $($response.StatusCode)" -ForegroundColor Yellow
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 404) {
            Write-Host " NAO ENCONTRADO" -ForegroundColor Yellow
        } elseif ($statusCode -eq 500) {
            Write-Host " ERRO SERVIDOR" -ForegroundColor Red
        } else {
            Write-Host " ERRO: $($_.Exception.Message)" -ForegroundColor Red
        }
        $erros++
    }
    
    # Pequena pausa para nao sobrecarregar a API
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESULTADO FINAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Sucessos: $sucessos" -ForegroundColor Green
Write-Host "  Erros: $erros" -ForegroundColor $(if ($erros -gt 0) { "Red" } else { "Green" })
Write-Host "  Total processado: $total" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

