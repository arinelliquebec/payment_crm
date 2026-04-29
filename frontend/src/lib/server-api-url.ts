/**
 * Retorna a URL base do backend .NET para uso exclusivo em route handlers
 * server-side (Node.js). Route handlers não podem usar URLs relativas nem
 * cookies de browser, por isso chamam o .NET diretamente.
 */
export function getServerBackendUrl(): string {
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5101/api"
  );
}
