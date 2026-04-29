# Fix: Routing Conflict in PessoaFisicaController

## Problem
The route `GET /api/PessoaFisica/{id}` was matching before `GET /api/PessoaFisica/buscar-por-cpf/{cpf}`, causing ASP.NET Core to try parsing "buscar-por-cpf" as an integer ID, resulting in:

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "id": ["The value 'buscar-por-cpf' is not valid."]
  }
}
```

## Solution
1. Reordered routes to put specific routes before generic ones
2. Added `:int` constraint to the ID route to ensure it only matches integer values

### Changes Made:
- Moved `[HttpGet("buscar-por-cpf/{cpf}")]` BEFORE `[HttpGet("{id}")]`
- Changed `[HttpGet("{id}")]` to `[HttpGet("{id:int}")]` to add type constraint

## Files Modified:
- `/backend/Controllers/PessoaFisicaController.cs`

## Testing:
```bash
# Test CPF search endpoint
curl -X GET "http://localhost:5101/api/PessoaFisica/buscar-por-cpf/14087425789"

# Test ID endpoint
curl -X GET "http://localhost:5101/api/PessoaFisica/1"
```

## Deployment:
After deploying this fix to production, the CPF search in "Novo Consultor" should work correctly.
