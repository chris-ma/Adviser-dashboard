import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import licenseesData from '@/data/mock/licensees.json';
import type { Licensee } from '@/types';

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

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const q = Query.safeParse(params);
  if (!q.success) return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });

  const { q: search, status, state, channel, tier, minAdvisers, maxAdvisers, page, pageSize, sortBy, sortDir } = q.data;

  let data = licenseesData as Licensee[];

  if (search) {
    const s = search.toLowerCase();
    data = data.filter(l => l.name.toLowerCase().includes(s) || l.afslNumber.includes(s) || (l.parentGroup?.toLowerCase().includes(s)));
  }
  if (status) data = data.filter(l => l.status === status);
  if (state) data = data.filter(l => l.headOfficeState === state);
  if (channel) data = data.filter(l => l.channel === channel);
  if (tier) data = data.filter(l => l.tier === tier);
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
    meta: { total, page, pageSize, source: 'ASIC Financial Adviser Register', asAtDate: '2024-03-31', generatedAt: new Date().toISOString() },
  });
}
