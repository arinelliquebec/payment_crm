export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  dotnetBackendUrl: process.env.DOTNET_BACKEND_URL ?? 'http://localhost:5101',

  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    expiry: process.env.JWT_EXPIRY ?? '8h',
  },

  cookie: {
    domain: process.env.COOKIE_DOMAIN ?? 'localhost',
    secure: (process.env.NODE_ENV ?? 'development') === 'production',
    sameSite: ((process.env.NODE_ENV ?? 'development') === 'production'
      ? 'strict'
      : 'lax') as 'strict' | 'lax' | 'none',
  },

  frontendOrigins: (
    process.env.FRONTEND_ORIGIN ??
    'http://localhost:3000,http://localhost:3001'
  )
    .split(',')
    .map((o) => o.trim()),
});
