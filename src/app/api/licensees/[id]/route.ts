import { NextRequest, NextResponse } from 'next/server';
import licenseesData from '@/data/mock/licensees.json';
import type { Licensee } from '@/types';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const licensee = (licenseesData as Licensee[]).find(l => l.id === params.id);
  if (!licensee) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({
    data: licensee,
    meta: { source: 'ASIC Financial Adviser Register', asAtDate: '2024-03-31', generatedAt: new Date().toISOString() },
  });
}
