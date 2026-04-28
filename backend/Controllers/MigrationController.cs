using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;

namespace CrmArrighi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MigrationController : ControllerBase
    {
        private readonly CrmArrighiContext _context;

        public MigrationController(CrmArrighiContext context)
        {
            _context = context;
        }

        // GET: api/Migration/add-email-telefone-parceiros
        [HttpGet("add-email-telefone-parceiros")]
        public async Task<IActionResult> AddEmailAndTelefoneToParceiros()
        {
            try
            {
                if (_context.Database.IsNpgsql())
                {
                    await _context.Database.ExecuteSqlRawAsync(
                        @"ALTER TABLE ""Parceiros"" ADD COLUMN IF NOT EXISTS ""Email"" character varying(100) NULL");
                    await _context.Database.ExecuteSqlRawAsync(
                        @"ALTER TABLE ""Parceiros"" ADD COLUMN IF NOT EXISTS ""Telefone"" character varying(20) NULL");

                    return Ok(new
                    {
                        message = "Campos Email e Telefone verificados/adicionados com sucesso",
                        emailExists = true,
                        telefoneExists = true
                    });
                }

                // Verificar se os campos Email e Telefone existem
                var emailExists = await _context.Database.ExecuteSqlRawAsync(@"
                    SELECT COUNT(*) FROM sys.columns 
                    WHERE object_id = OBJECT_ID('Parceiros') AND name = 'Email'
                ");

                var telefoneExists = await _context.Database.ExecuteSqlRawAsync(@"
                    SELECT COUNT(*) FROM sys.columns 
                    WHERE object_id = OBJECT_ID('Parceiros') AND name = 'Telefone'
                ");

                var result = new
                {
                    message = "Verificação concluída",
                    emailExists = emailExists > 0,
                    telefoneExists = telefoneExists > 0
                };

                // Se os campos não existem, adicionar
                if (emailExists == 0)
                {
                    await _context.Database.ExecuteSqlRawAsync("ALTER TABLE [Parceiros] ADD [Email] NVARCHAR(100) NULL");
                    result = new
                    {
                        message = "Campo Email adicionado com sucesso",
                        emailExists = true,
                        telefoneExists = telefoneExists > 0
                    };
                }

                if (telefoneExists == 0)
                {
                    await _context.Database.ExecuteSqlRawAsync("ALTER TABLE [Parceiros] ADD [Telefone] NVARCHAR(20) NULL");
                    result = new
                    {
                        message = "Campos Email e Telefone adicionados com sucesso",
                        emailExists = emailExists > 0 || true,
                        telefoneExists = true
                    };
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro ao atualizar tabela: {ex.Message}");
            }
        }
    }
}
