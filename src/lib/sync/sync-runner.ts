/**
 * Orchestrates the full ASIC data sync pipeline:
 *   1. Fetch ASIC CSV (or accept pre-parsed rows for testing)
 *   2. Upsert advisers into SyncAdviser
 *   3. Detect and insert movement events into SyncMovement
 *   4. Derive licensee records from adviser data, upsert SyncLicensee
 *   5. Recompute geographic aggregations, upsert SyncGeographic
 *   6. Write a SyncLog entry for auditing
 */

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { fetchAsicCsv, type AsicRow } from './asic-fetcher';
import { detectMovements, type AdviserSnapshot } from './movement-detector';
import { aggregateGeographic } from './geo-aggregator';
import {
  SA4_REGIONS, SUBURB_POSTCODES, METRO_SA4_CODES,
  LICENSEE_GROUPS, PRODUCT_CATEGORIES,
} from '@/data/generators/constants';

export interface SyncResult {
  advisersAdded:    number;
  advisersUpdated:  number;
  licenseesAdded:   number;
  licenseesUpdated: number;
  movementsAdded:   number;
  asAtDate:         string;
  logId:            string;
}

// ── Postcode → SA4 lookup ────────────────────────────────────────────────────
const postcodeLookup = new Map(SUBURB_POSTCODES.map(e => [e.postcode, e]));

function resolveLocation(postcode: string, stateHint: string) {
  const entry = postcodeLookup.get(postcode);
  return {
    postcode,
    suburb:    entry?.suburb  ?? '',
    state:     entry?.state   ?? stateHint,
    sa4Region: SA4_REGIONS.find(r => r.code === entry?.sa4Code)?.name ?? '',
    sa4Code:   entry?.sa4Code ?? '',
    isMetro:   METRO_SA4_CODES.includes(entry?.sa4Code ?? ''),
  };
}

// ── Licensee tier from adviser count ─────────────────────────────────────────
function computeTier(adviserCount: number): string {
  if (adviserCount >= 200) return 'Top 20';
  if (adviserCount >= 50)  return 'Mid-tier';
  if (adviserCount >= 5)   return 'Boutique';
  return 'Self-licensed';
}

// ── Infer channel from licensee name / known groups ──────────────────────────
function inferChannel(licenseeName: string): string {
  const n = licenseeName.toLowerCase();
  const known = LICENSEE_GROUPS.find(
    g => g.name.toLowerCase().includes(n.slice(0, 15)) || n.includes(g.parent?.toLowerCase() ?? '____'),
  );
  if (known) {
    if (['AMP','AIA','MLC','NAB','ANZ','CBA','Westpac'].some(b => known.parent?.includes(b))) return 'Aligned';
    if (known.tier === 'Self-licensed') return 'Direct';
  }
  if (['amp','mlc','aia','nab','anz','cba','westpac','bt financial','colonial'].some(k => n.includes(k)))
    return 'Aligned';
  if (['institutional','macquarie','morgan'].some(k => n.includes(k))) return 'Institutional';
  return 'Independent';
}

// ── Years experience from registration date ───────────────────────────────────
function yearsFromDate(isoDate: string): number {
  try {
    const reg   = new Date(isoDate).getFullYear();
    const now   = new Date().getFullYear();
    return Math.max(0, now - reg);
  } catch { return 0; }
}

// ── Qualify product authority entries from raw string ────────────────────────
function parseProductCategories(raw: string) {
  if (!raw) return [];
  const cats = raw.split(',').map(s => s.trim()).filter(Boolean);
  return cats.map(cat => ({
    id:          randomUUID(),
    category:    PRODUCT_CATEGORIES.find(p => p.toLowerCase().includes(cat.toLowerCase())) ?? cat,
    grantedBy:   'ASIC',
    grantedDate: '2020-01-01',
    status:      'Current' as const,
  }));
}

// ── Main sync function ────────────────────────────────────────────────────────

export async function runSync(csvOverride?: string): Promise<SyncResult> {
  const asAtDate = new Date().toISOString().substring(0, 10);

  const log = await prisma.syncLog.create({
    data: { status: 'running', source: csvOverride ? 'local-file' : 'asic-csv' },
  });

  let rows: AsicRow[];
  try {
    rows = await fetchAsicCsv(csvOverride);
  } catch (err) {
    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: 'error',
        completedAt: new Date(),
        errorMessage: String(err),
      },
    });
    throw err;
  }

  // ── 1. Snapshot current DB state for movement detection ──────────────────
  const existingAdvisers = await prisma.syncAdviser.findMany({
    select: { adviserId: true, fullName: true, status: true,
              currentLicenseeId: true, currentLicenseeName: true },
  });

  const previousSnap: AdviserSnapshot[] = existingAdvisers.map(a => ({
    adviserId:          a.adviserId,
    fullName:           a.fullName,
    status:             a.status,
    currentLicenseeId:  a.currentLicenseeId,
    currentLicenseeName:a.currentLicenseeName,
  }));

  // ── 2. Build licensee aggregation from incoming rows ─────────────────────
  const licenseeMap = new Map<string, {
    afslNumber: string; name: string; state: string; postcode: string; advisers: string[];
  }>();

  for (const row of rows) {
    if (!row.afslNumber) continue;
    if (!licenseeMap.has(row.afslNumber)) {
      licenseeMap.set(row.afslNumber, {
        afslNumber: row.afslNumber,
        name:       row.licenseeName,
        state:      row.state,
        postcode:   row.postcode,
        advisers:   [],
      });
    }
    licenseeMap.get(row.afslNumber)!.advisers.push(row.adviserId);
  }

  // ── 3. Upsert advisers ───────────────────────────────────────────────────
  let advisersAdded = 0, advisersUpdated = 0;

  for (const row of rows) {
    const firstName   = row.givenNames.trim();
    const lastName    = row.familyName.trim();
    const fullName    = `${firstName} ${lastName}`.trim();
    const location    = resolveLocation(row.postcode, row.state);
    const afslNumber  = row.afslNumber;
    const licenseeRec = licenseeMap.get(afslNumber);
    const years       = yearsFromDate(row.registrationDate);

    const data = {
      firstName,
      lastName,
      fullName,
      status:              row.status,
      registrationDate:    row.registrationDate,
      channel:             inferChannel(row.licenseeName),
      currentLicenseeId:   afslNumber,          // AFSL is stable unique key for licensees
      currentLicenseeName: row.licenseeName,
      currentFirmName:     row.licenseeName,
      locationJson:        JSON.stringify(location),
      qualificationsJson:  JSON.stringify([]),  // raw quals field not structured enough; kept for manual enrichment
      productAuthsJson:    JSON.stringify(parseProductCategories(row.productCategories)),
      workHistoryJson:     JSON.stringify([]),
      yearsExperience:     years,
      specialisationsJson: JSON.stringify([]),
      lastUpdated:         asAtDate,
    };

    const existing = await prisma.syncAdviser.findUnique({ where: { adviserId: row.adviserId } });
    if (existing) {
      await prisma.syncAdviser.update({ where: { adviserId: row.adviserId }, data });
      advisersUpdated++;
    } else {
      await prisma.syncAdviser.create({ data: { id: randomUUID(), adviserId: row.adviserId, ...data } });
      advisersAdded++;
    }
  }

  // ── 4. Detect and store movement events ──────────────────────────────────
  const newSnap: AdviserSnapshot[] = rows.map(row => ({
    adviserId:           row.adviserId,
    fullName:            `${row.givenNames} ${row.familyName}`.trim(),
    status:              row.status,
    currentLicenseeId:   row.afslNumber,
    currentLicenseeName: row.licenseeName,
  }));

  const detected = detectMovements(previousSnap, newSnap, asAtDate);
  let movementsAdded = 0;

  for (const mv of detected) {
    await prisma.syncMovement.create({ data: mv });
    movementsAdded++;
  }

  // ── 5. Upsert licensees ──────────────────────────────────────────────────
  let licenseesAdded = 0, licenseesUpdated = 0;

  for (const [afslNumber, lic] of Array.from(licenseeMap)) {
    const adviserCount  = lic.advisers.length;
    const practiceCount = Math.max(1, Math.round(adviserCount / 3));

    // Load existing history to append new data point
    const existing = await prisma.syncLicensee.findUnique({ where: { afslNumber } });
    let history: Array<{ date: string; count: number }> = [];
    if (existing) {
      try { history = JSON.parse(existing.historyJson); } catch { history = []; }
    }
    // Add today's count if not already recorded
    if (!history.some(h => h.date === asAtDate)) {
      history.push({ date: asAtDate, count: adviserCount });
      // Keep last 24 data points (2 years of monthly/fortnightly syncs)
      if (history.length > 24) history = history.slice(-24);
    }

    const data = {
      name:              lic.name,
      abn:               '',
      registrationDate:  '2000-01-01',
      status:            'Current',
      headOfficeState:   lic.state,
      headOfficePostcode:lic.postcode,
      adviserCount,
      practiceCount,
      channel:           inferChannel(lic.name),
      tier:              computeTier(adviserCount),
      productsJson:      JSON.stringify([]),
      historyJson:       JSON.stringify(history),
    };

    if (existing) {
      await prisma.syncLicensee.update({ where: { afslNumber }, data });
      licenseesUpdated++;
    } else {
      await prisma.syncLicensee.create({ data: { id: randomUUID(), afslNumber, ...data } });
      licenseesAdded++;
    }
  }

  // ── 6. Recompute geographic aggregations ─────────────────────────────────
  const geoInput = rows.map(r => ({
    locationPostcode: r.postcode,
    currentLicenseeId: r.afslNumber,
  }));
  const geoData = aggregateGeographic(geoInput);

  for (const geo of geoData) {
    await prisma.syncGeographic.upsert({
      where:  { regionCode: geo.regionCode },
      update: { ...geo },
      create: { ...geo },
    });
  }

  // ── 7. Complete sync log ──────────────────────────────────────────────────
  await prisma.syncLog.update({
    where: { id: log.id },
    data: {
      status:         'success',
      completedAt:    new Date(),
      advisersAdded,
      advisersUpdated,
      licenseesAdded,
      licenseesUpdated,
      movementsAdded,
      notes:          `Processed ${rows.length} ASIC register rows`,
    },
  });

  return {
    advisersAdded, advisersUpdated,
    licenseesAdded, licenseesUpdated,
    movementsAdded,
    asAtDate,
    logId: log.id,
  };
}
