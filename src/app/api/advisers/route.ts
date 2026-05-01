import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import advisersData from '@/data/mock/advisers.json';
import type { Adviser } from '@/types';
import { prisma } from '@/lib/prisma';

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

// Convert a SyncAdviser DB row to the Adviser shape the UI expects
function dbToAdviser(row: {
  id: string; adviserId: string; firstName: string; lastName: string; fullName: string;
  status: string; registrationDate: string; channel: string; currentLicenseeId: string;
  currentLicenseeName: string; currentFirmName: string; locationJson: string;
  qualificationsJson: string; productAuthsJson: string; workHistoryJson: string;
  yearsExperience: number; specialisationsJson: string; lastUpdated: string;
}): Adviser {
  return {
    id: row.id, adviserId: row.adviserId,
    firstName: row.firstName, lastName: row.lastName, fullName: row.fullName,
    status: row.status as Adviser['status'],
    registrationDate: row.registrationDate,
    channel: row.channel as Adviser['channel'],
    currentLicenseeId: row.currentLicenseeId,
    currentLicenseeName: row.currentLicenseeName,
    currentFirmName: row.currentFirmName,
    location: JSON.parse(row.locationJson),
    qualifications: JSON.parse(row.qualificationsJson),
    productAuthorities: JSON.parse(row.productAuthsJson),
    workHistory: JSON.parse(row.workHistoryJson),
    yearsExperience: row.yearsExperience,
    specialisations: JSON.parse(row.specialisationsJson),
    lastUpdated: row.lastUpdated,
  };
}

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const q = Query.safeParse(params);
  if (!q.success) return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });

  const { q: search, status, state, channel, licenseeId, sa4, productAuthority,
    specialisation, page, pageSize, sortBy, sortDir } = q.data;

  // Use live DB if synced data exists, otherwise fall back to mock JSON
  const dbCount = await prisma.syncAdviser.count().catch(() => 0);
  let data: Adviser[];
  let asAtDate = '2024-03-31';

  if (dbCount > 0) {
    const rows = await prisma.syncAdviser.findMany();
    data = rows.map(dbToAdviser);
    const latest = await prisma.syncLog.findFirst({
      where: { status: 'success' },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true },
    });
    if (latest?.completedAt) asAtDate = latest.completedAt.toISOString().substring(0, 10);
  } else {
    data = advisersData as Adviser[];
  }

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
  if (state)  data = data.filter(a => a.location.state === state);
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
    meta: { total, page, pageSize, source: 'ASIC Financial Adviser Register', asAtDate, generatedAt: new Date().toISOString() },
  });
}
