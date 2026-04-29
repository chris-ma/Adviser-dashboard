import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import advisersData from '@/data/mock/advisers.json';
import type { Adviser } from '@/types';

const Query = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  state: z.string().optional(),
  channel: z.string().optional(),
  licenseeId: z.string().optional(),
  sa4: z.string().optional(),
  productAuthority: z.string().optional(),
  specialisation: z.string().optional(),
  page: z.coerce.number().default(1),
  pageSize: z.coerce.number().max(100).default(25),
  sortBy: z.enum(['lastName', 'registrationDate', 'yearsExperience']).default('lastName'),
  sortDir: z.enum(['asc', 'desc']).default('asc'),
});

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const q = Query.safeParse(params);
  if (!q.success) return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });

  const { q: search, status, state, channel, licenseeId, sa4, productAuthority, specialisation,
    page, pageSize, sortBy, sortDir } = q.data;

  let data = advisersData as Adviser[];

  if (search) {
    const s = search.toLowerCase();
    data = data.filter(a =>
      a.fullName.toLowerCase().includes(s) ||
      a.currentLicenseeName.toLowerCase().includes(s) ||
      a.currentFirmName.toLowerCase().includes(s) ||
      a.adviserId.toLowerCase().includes(s)
    );
  }
  if (status) data = data.filter(a => a.status === status);
  if (state) data = data.filter(a => a.location.state === state);
  if (channel) data = data.filter(a => a.channel === channel);
  if (licenseeId) data = data.filter(a => a.currentLicenseeId === licenseeId);
  if (sa4) data = data.filter(a => a.location.sa4Code === sa4);
  if (productAuthority) data = data.filter(a =>
    a.productAuthorities.some(p => p.category === productAuthority)
  );
  if (specialisation) data = data.filter(a => a.specialisations.includes(specialisation));

  data.sort((a, b) => {
    const av: string | number = sortBy === 'lastName' ? a.lastName
      : sortBy === 'yearsExperience' ? a.yearsExperience
      : a.registrationDate;
    const bv: string | number = sortBy === 'lastName' ? b.lastName
      : sortBy === 'yearsExperience' ? b.yearsExperience
      : b.registrationDate;
    return sortDir === 'asc' ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1);
  });

  const total = data.length;
  const slice = data.slice((page - 1) * pageSize, page * pageSize);

  return NextResponse.json({
    data: slice,
    meta: { total, page, pageSize, source: 'ASIC Financial Adviser Register', asAtDate: '2024-03-31', generatedAt: new Date().toISOString() },
  });
}
