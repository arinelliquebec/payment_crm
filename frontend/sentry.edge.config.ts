import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Define sample rate
  tracesSampleRate: 1.0,

  // Environment configuration
  environment: process.env.NODE_ENV,

  // Enable debug in development
  debug: process.env.NODE_ENV === "development",
});




