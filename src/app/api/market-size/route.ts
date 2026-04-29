import { NextResponse } from 'next/server';
import marketData from '@/data/mock/market-size.json';

export async function GET() {
  return NextResponse.json({
    data: marketData,
    meta: { source: 'IBISWorld FIN3340 / ASIC Financial Adviser Register', asAtDate: '2024-03-31', generatedAt: new Date().toISOString() },
  });
}
