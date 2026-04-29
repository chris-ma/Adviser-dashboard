/**
 * POST /api/sync  — trigger a full ASIC register sync
 *   Requires: Authorization: Bearer <SYNC_SECRET>
 *   Optional body: { csvUrl?: string }  to override the ASIC CSV source
 *
 * GET  /api/sync  — return the latest sync log entry
 *
 * Crontab (run every Wednesday 06:00 AEST, i.e. 20:00 UTC Tuesday):
 *   0 20 * * 2  curl -s -X POST http://localhost:3000/api/sync \
 *                    -H "Authorization: Bearer $SYNC_SECRET" \
 *                    -H "Content-Type: application/json"
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runSync } from '@/lib/sync/sync-runner';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.SYNC_SECRET;
  if (!secret) return true; // allow if no secret configured (dev mode)
  const header = req.headers.get('authorization') ?? '';
  return header === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

  const latest = await prisma.syncLog.findFirst({
    orderBy: { startedAt: 'desc' },
  });

  return NextResponse.json({
    data: latest ?? null,
    meta: { generatedAt: new Date().toISOString() },
  });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

  let csvOverride: string | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    csvOverride = body?.csvUrl as string | undefined;
  } catch { /* no body */ }

  // Prevent concurrent syncs
  const running = await prisma.syncLog.findFirst({
    where: { status: 'running' },
    orderBy: { startedAt: 'desc' },
  });
  if (running) {
    return NextResponse.json(
      { error: 'Sync already in progress', logId: running.id },
      { status: 409 },
    );
  }

  try {
    const result = await runSync(csvOverride);
    return NextResponse.json({
      data: result,
      meta: { generatedAt: new Date().toISOString() },
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 },
    );
  }
}
