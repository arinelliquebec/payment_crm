/**
 * Normaliza BASE para o prefixo `/api` do ASP.NET (ex.: `POST …/api/Auth/login`).
 * Aceita `BACKEND_URL` sem sufixo (`http://host:5101`).
 */
export function withBackendApiPath(base: string): string {
  const trimmed = base.trim().replace(/\/+$/, "");
  if (trimmed.toLowerCase().endsWith("/api")) return trimmed;
  return `${trimmed}/api`;
}

/**
 * Retorna a URL base do backend .NET para uso exclusivo em route handlers
 * server-side (Node.js). Route handlers não podem usar URLs relativas nem
 * cookies de browser, por isso chamam o .NET diretamente.
 */
export function getServerBackendUrl(): string {
  const raw =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5101";
  return withBackendApiPath(raw);
}
