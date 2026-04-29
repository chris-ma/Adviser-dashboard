import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import movementsData from '@/data/mock/movements.json';
import type { MovementEvent } from '@/types';

const Query = z.object({
  adviserId: z.string().optional(),
  licenseeId: z.string().optional(),
  eventType: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  page: z.coerce.number().default(1),
  pageSize: z.coerce.number().max(200).default(50),
});

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const q = Query.safeParse(params);
  if (!q.success) return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });

  const { adviserId, licenseeId, eventType, fromDate, toDate, page, pageSize } = q.data;

  let data = movementsData as MovementEvent[];

  if (adviserId) data = data.filter(m => m.adviserId === adviserId);
  if (licenseeId) data = data.filter(m => m.fromLicenseeId === licenseeId || m.toLicenseeId === licenseeId);
  if (eventType) data = data.filter(m => m.eventType === eventType);
  if (fromDate) data = data.filter(m => m.eventDate >= fromDate);
  if (toDate) data = data.filter(m => m.eventDate <= toDate);

  const total = data.length;
  return NextResponse.json({
    data: data.slice((page - 1) * pageSize, page * pageSize),
    meta: { total, page, pageSize, source: 'ASIC Financial Adviser Register', asAtDate: '2024-03-31', generatedAt: new Date().toISOString() },
  });
}
