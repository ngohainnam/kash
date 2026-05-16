import { NextResponse } from "next/server";

/**
 * GET /api/sentry-test
 *
 * Intentionally throws an unhandled error to verify that Sentry captures
 * runtime errors from the Next.js backend.
 *
 * ⚠️  Remove or restrict this route once Sentry integration is confirmed.
 *
 * Usage:
 *   curl https://<your-domain>/api/sentry-test
 *
 * Expected result:
 *   - HTTP 500 response
 *   - A new error event appears in the Sentry dashboard within ~30 seconds
 */
export async function GET(): Promise<NextResponse> {
  throw new Error(
    "Sentry test: intentional error from GET /api/sentry-test — safe to ignore"
  );
}
