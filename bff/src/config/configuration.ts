const DEFAULT_DEV_JWT_SECRET = 'dev-secret-change-in-production';

function requireUrl(value: string, name: string): string {
  try {
    new URL(value);
    return value;
  } catch {
    throw new Error(
      `[BFF config] ${name} must be a valid URL. Received: "${value}"`,
    );
  }
}

function resolveJwtSecret(nodeEnv: string): string {
  const raw = process.env.JWT_SECRET;

  if (nodeEnv === 'production') {
    if (!raw || raw.trim() === '' || raw === DEFAULT_DEV_JWT_SECRET) {
      throw new Error(
        '[BFF config] JWT_SECRET is required in production and must not use the development default.',
      );
    }
    if (raw.length < 32) {
      throw new Error(
        '[BFF config] JWT_SECRET must be at least 32 characters in production.',
      );
    }
    return raw;
  }

  return raw && raw.trim() !== '' ? raw : DEFAULT_DEV_JWT_SECRET;
}

export default () => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const dotnetBackendUrl = requireUrl(
    process.env.DOTNET_BACKEND_URL ?? 'http://localhost:5101',
    'DOTNET_BACKEND_URL',
  );

  return {
    port: parseInt(process.env.PORT ?? '3001', 10),
    nodeEnv,

    dotnetBackendUrl,

    jwt: {
      secret: resolveJwtSecret(nodeEnv),
      expiry: process.env.JWT_EXPIRY ?? '8h',
    },

    cookie: {
      domain: process.env.COOKIE_DOMAIN ?? 'localhost',
      secure: nodeEnv === 'production',
      sameSite: (nodeEnv === 'production' ? 'strict' : 'lax') as
        | 'strict'
        | 'lax'
        | 'none',
    },

    frontendOrigins: (
      process.env.FRONTEND_ORIGIN ??
      'http://localhost:3000,http://localhost:3001'
    )
      .split(',')
      .map((o) => o.trim())
      .filter((o) => o.length > 0),
  };
};
