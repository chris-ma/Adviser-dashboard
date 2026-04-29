import { NextRequest, NextResponse } from 'next/server';
import regData from '@/data/mock/regulatory.json';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const impact = searchParams.get('impact');
  const status = searchParams.get('status');
  const source = searchParams.get('source');
  const tag = searchParams.get('tag');

  let data = regData as any[];
  if (impact) data = data.filter(r => r.impact === impact);
  if (status) data = data.filter(r => r.status === status);
  if (source) data = data.filter(r => r.source === source);
  if (tag) data = data.filter(r => r.tags.includes(tag));

  return NextResponse.json({
    data,
    meta: { total: data.length, source: 'ASIC / Treasury / APRA / AFCA', asAtDate: '2024-03-31', generatedAt: new Date().toISOString() },
  });
}
