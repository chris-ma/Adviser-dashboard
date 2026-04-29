import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const Query = z.object({
  page:     z.coerce.number().default(1),
  pageSize: z.coerce.number().max(100).default(20),
  status:   z.string().optional(),
});

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const q = Query.safeParse(params);
  if (!q.success) return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });

  const { page, pageSize, status } = q.data;
  const where = status ? { status } : {};

  const [total, logs] = await Promise.all([
    prisma.syncLog.count({ where }),
    prisma.syncLog.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      skip:  (page - 1) * pageSize,
      take:  pageSize,
    }),
  ]);

  return NextResponse.json({
    data: logs,
    meta: { total, page, pageSize, generatedAt: new Date().toISOString() },
  });
}
