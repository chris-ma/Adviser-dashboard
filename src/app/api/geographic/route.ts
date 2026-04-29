import { NextRequest, NextResponse } from 'next/server';
import geoData from '@/data/mock/geographic.json';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const state    = searchParams.get('state');
  const metroOnly = searchParams.get('metroOnly') === 'true';

  const dbCount = await prisma.syncGeographic.count();
  let data: any[];
  let asAtDate = '2024-03-31';

  if (dbCount > 0) {
    const rows = await prisma.syncGeographic.findMany();
    data = rows.map(r => ({
      regionCode:        r.regionCode,
      regionName:        r.regionName,
      regionType:        r.regionType,
      state:             r.state,
      adviserCount:      r.adviserCount,
      practiceCount:     r.practiceCount,
      population:        r.population,
      advisersPerCapita: r.advisersPerCapita,
      whiteSpaceScore:   r.whiteSpaceScore,
      metroOrRegional:   r.metroOrRegional,
      coordinates:       JSON.parse(r.coordinatesJson),
    }));
    const latest = await prisma.syncLog.findFirst({
      where: { status: 'success' },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true },
    });
    if (latest?.completedAt) asAtDate = latest.completedAt.toISOString().substring(0, 10);
  } else {
    data = geoData as any[];
  }

  if (state) data = data.filter(r => r.state === state);
  if (metroOnly) data = data.filter(r => r.metroOrRegional === 'Metro');

  return NextResponse.json({
    data,
    meta: { total: data.length, source: 'ASIC Financial Adviser Register / ABS', asAtDate, generatedAt: new Date().toISOString() },
  });
}
