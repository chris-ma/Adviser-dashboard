import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import licenseesData from '@/data/mock/licensees.json';
import type { Licensee } from '@/types';
import { prisma } from '@/lib/prisma';

const Query = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  state: z.string().optional(),
  channel: z.string().optional(),
  tier: z.string().optional(),
  minAdvisers: z.coerce.number().optional(),
  maxAdvisers: z.coerce.number().optional(),
  page: z.coerce.number().default(1),
  pageSize: z.coerce.number().max(100).default(25),
  sortBy: z.enum(['name', 'adviserCount', 'registrationDate']).default('adviserCount'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

function dbToLicensee(row: {
  id: string; afslNumber: string; name: string; tradingName: string | null;
  parentGroup: string | null; abn: string; registrationDate: string; status: string;
  headOfficeState: string; headOfficePostcode: string; adviserCount: number;
  practiceCount: number; channel: string; tier: string; productsJson: string;
  historyJson: string; website: string | null;
}): Licensee {
  return {
    id: row.id, afslNumber: row.afslNumber, name: row.name,
    tradingName: row.tradingName ?? undefined,
    parentGroup: row.parentGroup ?? undefined,
    abn: row.abn, registrationDate: row.registrationDate,
    status: row.status as Licensee['status'],
    headOfficeState: row.headOfficeState as Licensee['headOfficeState'],
    headOfficePostcode: row.headOfficePostcode,
    adviserCount: row.adviserCount, practiceCount: row.practiceCount,
    channel: row.channel as Licensee['channel'],
    tier: row.tier as Licensee['tier'],
    products: JSON.parse(row.productsJson),
    adviserCountHistory: JSON.parse(row.historyJson),
    website: row.website ?? undefined,
  };
}

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const q = Query.safeParse(params);
  if (!q.success) return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });

  const { q: search, status, state, channel, tier, minAdvisers, maxAdvisers,
    page, pageSize, sortBy, sortDir } = q.data;

  const dbCount = await prisma.syncLicensee.count();
  let data: Licensee[];
  let asAtDate = '2024-03-31';

  if (dbCount > 0) {
    const rows = await prisma.syncLicensee.findMany();
    data = rows.map(dbToLicensee);
    const latest = await prisma.syncLog.findFirst({
      where: { status: 'success' },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true },
    });
    if (latest?.completedAt) asAtDate = latest.completedAt.toISOString().substring(0, 10);
  } else {
    data = licenseesData as Licensee[];
  }

  if (search) {
    const s = search.toLowerCase();
    data = data.filter(l =>
      l.name.toLowerCase().includes(s) ||
      l.afslNumber.includes(s) ||
      (l.parentGroup?.toLowerCase().includes(s))
    );
  }
  if (status) data = data.filter(l => l.status === status);
  if (state)  data = data.filter(l => l.headOfficeState === state);
  if (channel) data = data.filter(l => l.channel === channel);
  if (tier)   data = data.filter(l => l.tier === tier);
  if (minAdvisers !== undefined) data = data.filter(l => l.adviserCount >= minAdvisers!);
  if (maxAdvisers !== undefined) data = data.filter(l => l.adviserCount <= maxAdvisers!);

  data.sort((a, b) => {
    const av = sortBy === 'name' ? a.name : sortBy === 'adviserCount' ? a.adviserCount : a.registrationDate;
    const bv = sortBy === 'name' ? b.name : sortBy === 'adviserCount' ? b.adviserCount : b.registrationDate;
    return sortDir === 'asc' ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1);
  });

  const total = data.length;
  return NextResponse.json({
    data: data.slice((page - 1) * pageSize, page * pageSize),
    meta: { total, page, pageSize, source: 'ASIC Financial Adviser Register', asAtDate, generatedAt: new Date().toISOString() },
  });
}
