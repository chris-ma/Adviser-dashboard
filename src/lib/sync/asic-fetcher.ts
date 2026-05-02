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
import * as https from 'https';
import * as http from 'http';

// ── Default CSV source ────────────────────────────────────────────────────────
// The CKAN package API is used to discover the current CSV URL dynamically,
// so this survives ASIC changing their resource IDs (which they do periodically).
// Dataset: https://data.gov.au/data/dataset/f2b7c2c1-f4ef-4ae9-aba5-45c19e4d3038
const CKAN_PACKAGE_API =
  'https://data.gov.au/api/3/action/package_show?id=f2b7c2c1-f4ef-4ae9-aba5-45c19e4d3038';

// Fallback: direct CKAN download proxy for resource 691ff9ed (Financial Advisers Dataset - Current)
// CKAN's /download/ endpoint redirects to the actual file (S3/CDN).
const ASIC_CSV_FALLBACK_URL =
  'https://data.gov.au/data/dataset/f2b7c2c1-f4ef-4ae9-aba5-45c19e4d3038/resource/691ff9ed-b601-481d-8283-88127dbbc869/download/financial-advisers-register.csv';

/**
 * Downloads a URL using Node.js native https/http, manually following up to
 * `maxRedirects` redirects. Bypasses Next.js's patched global fetch entirely,
 * which is unreliable for cross-origin redirect chains in serverless environments.
 */
function fetchWithRedirects(url: string, maxRedirects = 10): Promise<string> {
  return new Promise((resolve, reject) => {
    let redirectsLeft = maxRedirects;

    function request(currentUrl: string) {
      const lib = currentUrl.startsWith('https') ? https : http;
      lib.get(currentUrl, {
        headers: { 'User-Agent': 'AdviserDashboard/1.0 data@example.com' },
        timeout: 120_000,
      }, (res) => {
        const { statusCode, statusMessage, headers } = res;
        // Follow redirects (301, 302, 303, 307, 308)
        if (statusCode && statusCode >= 300 && statusCode < 400) {
          const location = headers.location;
          if (!location) {
            res.resume();
            return reject(new Error(`ASIC CSV fetch got ${statusCode} with no Location header (url: ${currentUrl})`));
          }
          if (redirectsLeft-- <= 0) return reject(new Error(`Too many redirects from ${url}`));
          const next = new URL(location, currentUrl).toString();
          res.resume();
          return request(next);
        }
        if (!statusCode || statusCode < 200 || statusCode >= 300) {
          return reject(new Error(`ASIC CSV fetch failed: ${statusCode} ${statusMessage} (url: ${currentUrl})`));
        }
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
        res.on('error', reject);
      }).on('error', reject).on('timeout', () => reject(new Error('ASIC CSV fetch timed out')));
    }

    request(url);
  });
}

/** Resolve the current CSV download URL via the CKAN package API (uses native https). */
async function resolveCsvUrl(): Promise<string> {
  try {
    const text = await fetchWithRedirects(CKAN_PACKAGE_API);
    const json = JSON.parse(text) as { result?: { resources?: Array<{ url: string; format: string; name: string }> } };
    const resources = json.result?.resources ?? [];
    const csv = resources.find(r =>
      r.format?.toUpperCase() === 'CSV' ||
      r.url?.toLowerCase().endsWith('.csv') ||
      r.name?.toLowerCase().includes('adviser')
    );
    return csv?.url ?? ASIC_CSV_FALLBACK_URL;
  } catch {
    return ASIC_CSV_FALLBACK_URL;
  }
}

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
  // Local file path takes highest priority (useful for testing).
  const localPath = process.env.ASIC_CSV_LOCAL_PATH;
  if (!override && localPath && !localPath.startsWith('http')) {
    return parseAsicCsv(fs.readFileSync(localPath, 'utf-8'));
  }

  // Use the explicit override, env URL, or dynamically discover via CKAN API.
  const src = override
    ?? (process.env.ASIC_CSV_URL?.startsWith('http') ? process.env.ASIC_CSV_URL : null)
    ?? await resolveCsvUrl();

  // Use native https (not Next.js's patched fetch) to reliably follow redirects.
  const text = await fetchWithRedirects(src);
  return parseAsicCsv(text);
}
