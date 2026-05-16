// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn:
    process.env.SENTRY_DSN ??
    "https://32c3c9dfbc67b60eac082185072cd9a7@o4510299875377152.ingest.us.sentry.io/4511399585906688",

  tracesSampleRate: 1,
  enableLogs: true,
  sendDefaultPii: true,
});
