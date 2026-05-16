import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/health
 *
 * Health check endpoint consumed by the Jenkins monitoring stage.
 * Returns HTTP 200 when the application and database are reachable,
 * HTTP 503 when any dependency is unhealthy.
 */
export async function GET() {
    const start = Date.now()
    const checks: Record<string, { status: 'ok' | 'error'; latencyMs?: number; detail?: string }> = {}

    // ── Database connectivity check ──────────────────────────────────────────
    try {
        await prisma.$queryRaw`SELECT 1`
        checks.database = { status: 'ok', latencyMs: Date.now() - start }
    } catch (err) {
        checks.database = {
            status: 'error',
            detail: err instanceof Error ? err.message : 'unknown database error',
        }
    }

    const allOk = Object.values(checks).every((c) => c.status === 'ok')
    const httpStatus = allOk ? 200 : 503

    return NextResponse.json(
        {
            status: allOk ? 'ok' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            checks,
        },
        { status: httpStatus }
    )
}
