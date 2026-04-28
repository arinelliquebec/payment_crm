using Microsoft.AspNetCore.Mvc;

namespace CrmArrighi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TestController : ControllerBase
    {
        [HttpGet("migration")]
        public IActionResult TestMigration()
        {
            return Ok(new { message = "Migration endpoint working", timestamp = DateTime.Now });
        }
    }
}