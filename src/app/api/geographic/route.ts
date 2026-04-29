import { NextRequest, NextResponse } from 'next/server';
import geoData from '@/data/mock/geographic.json';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const state = searchParams.get('state');
  const metroOnly = searchParams.get('metroOnly') === 'true';

  let data = geoData as any[];
  if (state) data = data.filter(r => r.state === state);
  if (metroOnly) data = data.filter(r => r.metroOrRegional === 'Metro');

  return NextResponse.json({
    data,
    meta: { total: data.length, source: 'ASIC Financial Adviser Register / ABS', asAtDate: '2024-03-31', generatedAt: new Date().toISOString() },
  });
}
