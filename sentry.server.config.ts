// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
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
