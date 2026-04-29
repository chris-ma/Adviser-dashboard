import { NextRequest, NextResponse } from 'next/server';
import advisersData from '@/data/mock/advisers.json';
import type { Adviser } from '@/types';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const adviser = (advisersData as Adviser[]).find(a => a.id === params.id);
  if (!adviser) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({
    data: adviser,
    meta: { source: 'ASIC Financial Adviser Register', asAtDate: '2024-03-31', generatedAt: new Date().toISOString() },
  });
}
