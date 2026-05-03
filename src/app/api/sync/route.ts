/**
 * POST /api/sync  — trigger a full ASIC register sync
 *   Requires: Authorization: Bearer <SYNC_SECRET>
 *   Body option A (JSON):      { csvUrl?: string }   override download URL
 *   Body option B (FormData):  csv=<File>            upload CSV directly
 *
 * GET  /api/sync  — return the latest sync log entry
 */

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import { prisma } from '@/lib/prisma';
import { runSync } from '@/lib/sync/sync-runner';

// Allow up to 10 MB uploads (ASIC CSV is ~3-5 MB).
export const maxDuration = 300;

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.SYNC_SECRET;
  if (!secret) return true;
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

  const contentType = req.headers.get('content-type') ?? '';
  if (contentType.includes('multipart/form-data')) {
    // CSV file uploaded directly from the admin page.
    const formData = await req.formData();
    const file = formData.get('csv') as File | null;
    if (file && file.size > 0) {
      const text = await file.text();
      const tmpPath = '/tmp/asic-register-upload.csv';
      fs.writeFileSync(tmpPath, text, 'utf-8');
      csvOverride = tmpPath;
    }
  } else {
    const body = await req.json().catch(() => ({}));
    csvOverride = body?.csvUrl as string | undefined;
  }

  // Prevent concurrent syncs.
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
