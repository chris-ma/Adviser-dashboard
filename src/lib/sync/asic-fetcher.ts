/**
 * Downloads and parses the ASIC Financial Adviser Register CSV from data.gov.au.
 *
 * Column names are normalised to handle minor schema changes ASIC has made over the years.
 * The stable data.gov.au page: https://data.gov.au/data/dataset/asic-financial-adviser
 *
 * Crontab example (run every Wednesday at 06:00 AEST):
 *   0 6 * * 3  curl -s -X POST http://localhost:3000/api/sync \
 *                   -H "Authorization: Bearer $SYNC_SECRET" >> /var/log/asic-sync.log 2>&1
 */

import { z } from 'zod';
import * as fs from 'fs';

// ── Default CSV source ────────────────────────────────────────────────────────
// Updated weekly by ASIC; override with ASIC_CSV_URL env var or ASIC_CSV_LOCAL_PATH
const ASIC_CSV_DEFAULT_URL =
  process.env.ASIC_CSV_URL ??
  'https://data.gov.au/data/dataset/asic-financial-adviser/resource/a8bdde0b-4b3b-421b-8f24-40d4b7b5d1b5/download/asic-financial-advisers-register.csv';

// ── Zod schema for a single parsed row ───────────────────────────────────────
export const AsicRowSchema = z.object({
  adviserId: z.string().min(1),
  givenNames: z.string(),
  familyName: z.string(),
  status: z.string(),
  registrationDate: z.string(),
  afslNumber: z.string(),
  licenseeName: z.string(),
  state: z.string(),
  postcode: z.string(),
  qualifications: z.string(),   // raw comma-separated string
  productCategories: z.string(), // raw comma-separated string
});

export type AsicRow = z.infer<typeof AsicRowSchema>;

// ── Column name aliases (ASIC has renamed columns occasionally) ───────────────
const COL = {
  adviserId:        ['ADV_NUMBER', 'ADVISER_NUMBER', 'ADV_ID'],
  givenNames:       ['ADV_GIVEN_NAMES', 'ADV_GIVEN_NAME', 'GIVEN_NAMES', 'FIRST_NAME'],
  familyName:       ['ADV_FAMILY_NAME', 'ADV_SURNAME', 'FAMILY_NAME', 'LAST_NAME'],
  status:           ['ADV_STATUS', 'STATUS', 'REGISTRATION_STATUS'],
  registrationDate: ['ADV_REGISTRATION_DATE', 'REGISTRATION_DATE', 'REG_DATE'],
  afslNumber:       ['LICENSEE_AFS_LICENSEE_NUMBER', 'LICENSEE_AFSL', 'AFSL_NUMBER', 'AFS_LICENSEE_NO'],
  licenseeName:     ['LICENSEE_NAME', 'AFS_LICENSEE_NAME', 'LICENSEE'],
  state:            ['ADV_WORK_STATE', 'ADV_STATE', 'STATE', 'STATE_CODE'],
  postcode:         ['ADV_WORK_POSTCODE', 'ADV_POSTCODE', 'POSTCODE', 'POST_CODE'],
  qualifications:   ['ADV_QUALIFICATIONS', 'QUALIFICATIONS', 'QUAL'],
  productCategories:['PRODUCT_CATEGORIES', 'ADV_PRODUCT_CATEGORIES', 'PRODUCTS'],
} as const;

/** Resolve the first matching column header from an alias list. */
function resolveCol(headers: string[], aliases: readonly string[]): number {
  for (const alias of aliases) {
    const idx = headers.findIndex(h => h.trim().toUpperCase() === alias.toUpperCase());
    if (idx !== -1) return idx;
  }
  return -1;
}

// ── Minimal RFC 4180 CSV parser (no external deps) ───────────────────────────
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuote = false;
  const n = text.length;

  for (let i = 0; i < n; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inQuote) {
      if (c === '"' && next === '"') { field += '"'; i++; }
      else if (c === '"')            { inQuote = false; }
      else                           { field += c; }
    } else {
      if (c === '"')                 { inQuote = true; }
      else if (c === ',')            { row.push(field); field = ''; }
      else if (c === '\n' || (c === '\r' && next === '\n')) {
        if (c === '\r') i++;
        row.push(field); field = '';
        if (row.some(f => f !== '')) rows.push(row);
        row = [];
      } else                         { field += c; }
    }
  }
  if (field || row.length) { row.push(field); if (row.some(f => f !== '')) rows.push(row); }

  return rows;
}

// ── Parse ASIC CSV text → AsicRow[] ─────────────────────────────────────────
export function parseAsicCsv(csvText: string): AsicRow[] {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim().toUpperCase());

  const idx = {
    adviserId:        resolveCol(headers, COL.adviserId),
    givenNames:       resolveCol(headers, COL.givenNames),
    familyName:       resolveCol(headers, COL.familyName),
    status:           resolveCol(headers, COL.status),
    registrationDate: resolveCol(headers, COL.registrationDate),
    afslNumber:       resolveCol(headers, COL.afslNumber),
    licenseeName:     resolveCol(headers, COL.licenseeName),
    state:            resolveCol(headers, COL.state),
    postcode:         resolveCol(headers, COL.postcode),
    qualifications:   resolveCol(headers, COL.qualifications),
    productCategories:resolveCol(headers, COL.productCategories),
  };

  const get = (row: string[], i: number) => (i === -1 ? '' : (row[i] ?? '').trim());

  const parsed: AsicRow[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const raw = {
      adviserId:        get(row, idx.adviserId),
      givenNames:       get(row, idx.givenNames),
      familyName:       get(row, idx.familyName),
      status:           normaliseStatus(get(row, idx.status)),
      registrationDate: normaliseDate(get(row, idx.registrationDate)),
      afslNumber:       get(row, idx.afslNumber),
      licenseeName:     get(row, idx.licenseeName),
      state:            get(row, idx.state).toUpperCase(),
      postcode:         get(row, idx.postcode),
      qualifications:   get(row, idx.qualifications),
      productCategories:get(row, idx.productCategories),
    };
    const result = AsicRowSchema.safeParse(raw);
    if (result.success) parsed.push(result.data);
  }

  return parsed;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normaliseStatus(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (s.includes('active'))         return 'Active';
  if (s.includes('suspend'))        return 'Suspended';
  if (s.includes('cancel'))         return 'Cancelled';
  if (s.includes('laps'))           return 'Lapsed';
  return raw.trim() || 'Active';
}

/** DD/MM/YYYY or YYYY-MM-DD → YYYY-MM-DD */
function normaliseDate(raw: string): string {
  if (!raw) return new Date().toISOString().substring(0, 10);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.substring(0, 10);
  const parts = raw.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return raw;
}

// ── Fetch from URL or local file ─────────────────────────────────────────────

export async function fetchAsicCsv(override?: string): Promise<AsicRow[]> {
  const src = override ?? process.env.ASIC_CSV_LOCAL_PATH ?? ASIC_CSV_DEFAULT_URL;

  let text: string;
  if (!src.startsWith('http')) {
    text = fs.readFileSync(src, 'utf-8');
  } else {
    const res = await fetch(src, {
      headers: { 'User-Agent': 'AdviserDashboard/1.0 data@example.com' },
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) throw new Error(`ASIC CSV fetch failed: ${res.status} ${res.statusText}`);
    text = await res.text();
  }

  return parseAsicCsv(text);
}
