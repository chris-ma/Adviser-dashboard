import { NextRequest, NextResponse } from 'next/server';
import advisersData from '@/data/mock/advisers.json';
import licenseesData from '@/data/mock/licensees.json';
import movementsData from '@/data/mock/movements.json';

function toCSV(rows: Record<string, any>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => {
      const v = r[h];
      const s = typeof v === 'object' ? JSON.stringify(v) : String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(','))
  ];
  return lines.join('\n');
}

export async function GET(req: NextRequest) {
  const entity = req.nextUrl.searchParams.get('entity') ?? 'advisers';
  const format = req.nextUrl.searchParams.get('format') ?? 'csv';

  const rawData = entity === 'advisers' ? advisersData
    : entity === 'licensees' ? licenseesData
    : movementsData;

  if (format === 'json') {
    return NextResponse.json(rawData);
  }

  // Flatten for CSV
  const flat = (rawData as any[]).map(r => {
    if (entity === 'advisers') {
      return {
        id: r.id, adviserId: r.adviserId, fullName: r.fullName, status: r.status,
        registrationDate: r.registrationDate, channel: r.channel,
        currentLicenseeName: r.currentLicenseeName, suburb: r.location?.suburb,
        state: r.location?.state, sa4Region: r.location?.sa4Region, yearsExperience: r.yearsExperience,
        specialisations: r.specialisations?.join('; '),
      };
    }
    if (entity === 'licensees') {
      return {
        id: r.id, afslNumber: r.afslNumber, name: r.name, parentGroup: r.parentGroup ?? '',
        status: r.status, channel: r.channel, tier: r.tier, adviserCount: r.adviserCount,
        headOfficeState: r.headOfficeState,
      };
    }
    return { id: r.id, adviserId: r.adviserId, adviserName: r.adviserName, eventType: r.eventType,
      fromLicenseeName: r.fromLicenseeName ?? '', toLicenseeName: r.toLicenseeName ?? '', eventDate: r.eventDate };
  });

  const csv = toCSV(flat);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${entity}-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
