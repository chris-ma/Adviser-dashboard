import { NextResponse } from 'next/server';
import psychoData from '@/data/mock/psychographics.json';

export async function GET() {
  return NextResponse.json({
    data: psychoData,
    meta: { source: 'Adviser Ratings / Investment Trends / Modelled', asAtDate: '2024-03-31', generatedAt: new Date().toISOString() },
  });
}
