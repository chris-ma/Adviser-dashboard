import { faker } from '@faker-js/faker';
import * as fs from 'fs';
import * as path from 'path';
import {
  PRODUCT_CATEGORIES, QUALIFICATIONS, INSTITUTIONS, SA4_REGIONS,
  METRO_SA4_CODES, SUBURB_POSTCODES, LICENSEE_GROUPS, SPECIALISATIONS,
  ROLES, STATE_DISTRIBUTION, CHANNEL_DISTRIBUTION
} from './constants';

faker.seed(42);

function weightedPick<T>(items: Array<{ weight: number } & T>): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = faker.number.float({ min: 0, max: total });
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

function randomDate(start: Date, end: Date): string {
  return faker.date.between({ from: start, to: end }).toISOString().split('T')[0];
}

// --- Generate Licensees ---
const licensees = LICENSEE_GROUPS.map((lg, i) => {
  const baseCount = lg.tier === 'Top 20' ? faker.number.int({ min: 80, max: 400 })
    : lg.tier === 'Mid-tier' ? faker.number.int({ min: 20, max: 80 })
    : lg.tier === 'Boutique' ? faker.number.int({ min: 5, max: 25 })
    : faker.number.int({ min: 1, max: 8 });

  const stateEntry = weightedPick(STATE_DISTRIBUTION as Array<{ state: string; weight: number }>);
  const suburbsForState = SUBURB_POSTCODES.filter(s => s.state === stateEntry.state);
  const loc = faker.helpers.arrayElement(suburbsForState.length ? suburbsForState : SUBURB_POSTCODES);

  const channelEntry = lg.tier === 'Top 20' ? 'Aligned'
    : lg.tier === 'Self-licensed' ? 'Independent'
    : weightedPick(CHANNEL_DISTRIBUTION as Array<{ channel: string; weight: number }>).channel;

  // Build adviser count history 2018–2024
  const adviserCountHistory: Array<{ date: string; count: number }> = [];
  let count = Math.round(baseCount * faker.number.float({ min: 1.1, max: 1.5 }));
  for (let year = 2018; year <= 2024; year++) {
    const delta = faker.number.int({ min: -15, max: 10 });
    count = Math.max(1, count + delta);
    adviserCountHistory.push({ date: `${year}-06-30`, count });
  }
  const finalCount = adviserCountHistory[adviserCountHistory.length - 1].count;

  return {
    id: `lic_${String(i + 1).padStart(3, '0')}`,
    afslNumber: lg.afsl,
    name: lg.name,
    tradingName: lg.parent ? `${lg.parent} Financial Planning` : undefined,
    parentGroup: lg.parent ?? undefined,
    abn: faker.string.numeric(11),
    acn: faker.string.numeric(9),
    registrationDate: randomDate(new Date('1999-01-01'), new Date('2015-01-01')),
    status: 'Current',
    headOfficeState: loc.state,
    headOfficePostcode: loc.postcode,
    adviserCount: finalCount,
    practiceCount: Math.max(1, Math.round(finalCount / faker.number.float({ min: 1.5, max: 3.5 }))),
    channel: channelEntry,
    fum: lg.tier === 'Top 20' ? faker.number.int({ min: 5000, max: 80000 })
      : lg.tier === 'Mid-tier' ? faker.number.int({ min: 500, max: 5000 })
      : faker.number.int({ min: 50, max: 500 }),
    revenueEstimate: lg.tier === 'Top 20' ? faker.number.int({ min: 50, max: 800 })
      : lg.tier === 'Mid-tier' ? faker.number.int({ min: 5, max: 50 })
      : faker.number.int({ min: 1, max: 10 }),
    tier: lg.tier,
    products: faker.helpers.arrayElements(PRODUCT_CATEGORIES, { min: 3, max: 8 }),
    website: `https://www.${lg.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)}.com.au`,
    adviserCountHistory,
    description: `${lg.name} is ${lg.parent ? `part of the ${lg.parent} group and ` : ''}a ${lg.tier.toLowerCase()} Australian Financial Services licensee providing financial planning and advice services.`,
  };
});

// --- Generate Advisers ---
const advisers = [];
for (let i = 0; i < 500; i++) {
  const stateEntry = weightedPick(STATE_DISTRIBUTION as Array<{ state: string; weight: number }>);
  const suburbsForState = SUBURB_POSTCODES.filter(s => s.state === stateEntry.state);
  const loc = faker.helpers.arrayElement(suburbsForState.length ? suburbsForState : SUBURB_POSTCODES);
  const sa4 = SA4_REGIONS.find(r => r.code === loc.sa4Code) ?? SA4_REGIONS[0];

  const channelEntry = weightedPick(CHANNEL_DISTRIBUTION as Array<{ channel: string; weight: number }>).channel;

  // Pick licensees matching channel
  const matchingLicensees = licensees.filter(l =>
    channelEntry === 'Aligned' ? ['Top 20', 'Mid-tier'].includes(l.tier)
    : channelEntry === 'Independent' ? ['Boutique', 'Self-licensed', 'Mid-tier'].includes(l.tier)
    : channelEntry === 'Institutional' ? l.tier === 'Top 20'
    : true
  );
  const primaryLicensee = faker.helpers.arrayElement(matchingLicensees.length ? matchingLicensees : licensees);

  const regYear = faker.number.int({ min: 2002, max: 2022 });
  const regDate = randomDate(new Date(`${regYear}-01-01`), new Date(`${regYear}-12-31`));
  const yearsExp = new Date().getFullYear() - regYear;

  const statusRoll = faker.number.float({ min: 0, max: 1 });
  const status = statusRoll < 0.88 ? 'Active' : statusRoll < 0.93 ? 'Suspended' : statusRoll < 0.97 ? 'Cancelled' : 'Lapsed';

  const numQuals = faker.number.int({ min: 1, max: 3 });
  const quals = faker.helpers.arrayElements(QUALIFICATIONS, numQuals).map((q, qi) => ({
    id: `qual_${i}_${qi}`,
    code: q.code,
    name: q.name,
    institution: faker.helpers.arrayElement(INSTITUTIONS),
    yearCompleted: faker.number.int({ min: regYear - 2, max: regYear + 2 }),
  }));

  const numAuth = faker.number.int({ min: 2, max: 7 });
  const auths = faker.helpers.arrayElements(PRODUCT_CATEGORIES, numAuth).map((cat, ai) => ({
    id: `auth_${i}_${ai}`,
    category: cat,
    grantedBy: primaryLicensee.name,
    grantedDate: regDate,
    status: status === 'Cancelled' ? 'Removed' : 'Current',
  }));

  // Work history
  const numJobs = faker.number.int({ min: 1, max: 4 });
  const workHistory = [];
  let histDate = new Date(regDate);
  for (let j = 0; j < numJobs; j++) {
    const isLast = j === numJobs - 1;
    const histLic = j === numJobs - 1 ? primaryLicensee : faker.helpers.arrayElement(licensees);
    const startDate = histDate.toISOString().split('T')[0];
    const endDate = isLast ? undefined : randomDate(histDate, new Date(histDate.getTime() + 4 * 365 * 86400000));
    workHistory.push({
      id: `wh_${i}_${j}`,
      firmName: histLic.tradingName ?? histLic.name,
      licenseeName: histLic.name,
      licenseeAFSL: histLic.afslNumber,
      role: faker.helpers.arrayElement(ROLES),
      startDate,
      endDate,
      isCurrentRole: isLast,
    });
    if (endDate) histDate = new Date(endDate);
  }

  const specs = faker.helpers.arrayElements(SPECIALISATIONS, { min: 1, max: 4 });

  advisers.push({
    id: `adv_${String(i + 1).padStart(4, '0')}`,
    adviserId: `ADV${faker.string.numeric(6)}`,
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    get fullName() { return `${this.firstName} ${this.lastName}`; },
    status,
    registrationDate: regDate,
    channel: channelEntry,
    currentLicenseeId: primaryLicensee.id,
    currentLicenseeName: primaryLicensee.name,
    currentFirmName: primaryLicensee.tradingName ?? primaryLicensee.name,
    location: {
      postcode: loc.postcode,
      suburb: loc.suburb,
      state: loc.state,
      sa4Region: sa4.name,
      sa4Code: sa4.code,
      isMetro: METRO_SA4_CODES.includes(sa4.code),
    },
    qualifications: quals,
    productAuthorities: auths,
    workHistory,
    yearsExperience: yearsExp,
    specialisations: specs,
    lastUpdated: randomDate(new Date('2024-01-01'), new Date('2024-03-31')),
  });
}

// Resolve fullName
const advisersResolved = advisers.map(a => ({ ...a, fullName: `${a.firstName} ${a.lastName}` }));

// --- Generate Movements ---
const movements = [];
let movId = 0;
// Wave events (post-RC adviser transfers between licensees)
const waves = [
  { from: licensees[0].id, to: licensees[8].id, year: 2020, count: 18 },
  { from: licensees[1].id, to: licensees[9].id, year: 2021, count: 14 },
  { from: licensees[2].id, to: licensees[10].id, year: 2021, count: 22 },
  { from: licensees[5].id, to: licensees[7].id, year: 2022, count: 12 },
];
for (const wave of waves) {
  const waveAdvisers = faker.helpers.arrayElements(advisersResolved, wave.count);
  for (const adv of waveAdvisers) {
    movements.push({
      id: `mov_${String(++movId).padStart(4, '0')}`,
      adviserId: adv.id,
      adviserName: adv.fullName,
      eventType: 'Transfer',
      fromLicenseeId: wave.from,
      fromLicenseeName: licensees.find(l => l.id === wave.from)?.name ?? '',
      toLicenseeId: wave.to,
      toLicenseeName: licensees.find(l => l.id === wave.to)?.name ?? '',
      eventDate: randomDate(new Date(`${wave.year}-01-01`), new Date(`${wave.year}-12-31`)),
      effectiveDate: randomDate(new Date(`${wave.year}-01-01`), new Date(`${wave.year}-12-31`)),
      source: 'ASIC Register',
      notes: 'Part of post-Royal Commission licence consolidation',
    });
  }
}

// Random individual movements
const movTypes = [
  { type: 'Transfer', weight: 40 },
  { type: 'Join', weight: 25 },
  { type: 'Exit', weight: 20 },
  { type: 'Suspension', weight: 8 },
  { type: 'Reinstatement', weight: 5 },
  { type: 'Cancellation', weight: 2 },
];
while (movements.length < 1000) {
  const adv = faker.helpers.arrayElement(advisersResolved);
  const movType = weightedPick(movTypes as Array<{ type: string; weight: number }>).type;
  const year = faker.number.int({ min: 2020, max: 2024 });
  const quarter = faker.helpers.arrayElement([1, 1, 3, 3, 2, 4]);
  const month = quarter === 1 ? faker.number.int({ min: 1, max: 3 })
    : quarter === 2 ? faker.number.int({ min: 4, max: 6 })
    : quarter === 3 ? faker.number.int({ min: 7, max: 9 })
    : faker.number.int({ min: 10, max: 12 });
  const eventDate = randomDate(
    new Date(`${year}-${String(month).padStart(2, '0')}-01`),
    new Date(`${year}-${String(month).padStart(2, '0')}-28`)
  );

  const fromLic = faker.helpers.arrayElement(licensees);
  const toLic = faker.helpers.arrayElement(licensees.filter(l => l.id !== fromLic.id));

  movements.push({
    id: `mov_${String(++movId).padStart(4, '0')}`,
    adviserId: adv.id,
    adviserName: adv.fullName,
    eventType: movType,
    fromLicenseeId: ['Transfer', 'Exit', 'Suspension', 'Cancellation'].includes(movType) ? fromLic.id : undefined,
    fromLicenseeName: ['Transfer', 'Exit', 'Suspension', 'Cancellation'].includes(movType) ? fromLic.name : undefined,
    toLicenseeId: ['Transfer', 'Join', 'Reinstatement'].includes(movType) ? toLic.id : undefined,
    toLicenseeName: ['Transfer', 'Join', 'Reinstatement'].includes(movType) ? toLic.name : undefined,
    eventDate,
    effectiveDate: eventDate,
    source: 'ASIC Register',
  });
}

// Sort by date desc
movements.sort((a, b) => b.eventDate.localeCompare(a.eventDate));

// --- Market Size Data ---
const marketSize = {
  asAtDate: '2024-03-31',
  source: 'IBISWorld Financial Planning Industry Report FIN3340, 2024; ASIC Financial Adviser Register',
  methodology: 'Industry revenue from IBISWorld sector report. Adviser and licensee counts derived from ASIC Financial Adviser Register snapshot. Penetration rate based on ABS adult population estimate.',
  totalRevenue: 6.1,
  totalBusinesses: 17530,
  totalAdvisers: 15847,
  totalLicensees: 2241,
  averageRevenuePerBusiness: 348000,
  averageAdvisersPerPractice: 2.3,
  penetrationRate: 12.4,
  byState: [
    { state: 'NSW', adviserCount: 5229, businessCount: 5783, revenue: 2.13, penetrationRate: 13.1 },
    { state: 'VIC', adviserCount: 4279, businessCount: 4733, revenue: 1.74, penetrationRate: 13.0 },
    { state: 'QLD', adviserCount: 2852, businessCount: 3156, revenue: 1.04, penetrationRate: 11.8 },
    { state: 'WA', adviserCount: 1744, businessCount: 1929, revenue: 0.65, penetrationRate: 12.5 },
    { state: 'SA', adviserCount: 951, businessCount: 1052, revenue: 0.32, penetrationRate: 10.9 },
    { state: 'ACT', adviserCount: 476, businessCount: 526, revenue: 0.14, penetrationRate: 11.5 },
    { state: 'TAS', adviserCount: 238, businessCount: 263, revenue: 0.07, penetrationRate: 9.2 },
    { state: 'NT', adviserCount: 79, businessCount: 87, revenue: 0.02, penetrationRate: 7.8 },
  ],
  byChannel: [
    { channel: 'Aligned', adviserCount: 6339, percentage: 40.0 },
    { channel: 'Independent', adviserCount: 5546, percentage: 35.0 },
    { channel: 'Institutional', adviserCount: 3169, percentage: 20.0 },
    { channel: 'Direct', adviserCount: 793, percentage: 5.0 },
  ],
};

const timeSeries = [
  {
    metric: 'Total Advisers',
    unit: 'count',
    source: 'ASIC Financial Adviser Register',
    dataPoints: [
      { date: '2018-06-30', value: 28647, note: 'Pre-Royal Commission peak' },
      { date: '2019-06-30', value: 26832, note: 'Royal Commission impact begins' },
      { date: '2020-06-30', value: 22596, note: 'FASEA education requirements announced' },
      { date: '2021-06-30', value: 19515, note: 'Continued attrition' },
      { date: '2022-06-30', value: 16812, note: 'Market stabilising' },
      { date: '2023-06-30', value: 15983, note: 'Near bottom' },
      { date: '2024-03-31', value: 15847, note: 'Current' },
    ],
  },
  {
    metric: 'Industry Revenue',
    unit: 'AUD billions',
    source: 'IBISWorld FIN3340',
    dataPoints: [
      { date: '2018-06-30', value: 6.8 },
      { date: '2019-06-30', value: 6.4 },
      { date: '2020-06-30', value: 5.9 },
      { date: '2021-06-30', value: 5.7 },
      { date: '2022-06-30', value: 5.9 },
      { date: '2023-06-30', value: 6.0 },
      { date: '2024-03-31', value: 6.1 },
    ],
  },
  {
    metric: 'Advice Penetration Rate',
    unit: 'percentage',
    source: 'Adviser Ratings Australian Advice Landscape 2025',
    dataPoints: [
      { date: '2019-06-30', value: 13.8 },
      { date: '2020-06-30', value: 12.9 },
      { date: '2021-06-30', value: 11.8 },
      { date: '2022-06-30', value: 11.6 },
      { date: '2023-06-30', value: 12.1 },
      { date: '2024-03-31', value: 12.4 },
    ],
  },
];

// --- Geographic Aggregations ---
const NATIONAL_BENCHMARK = 7.2; // advisers per 10,000 adults

const statePopulations: Record<string, number> = {
  NSW: 8300000, VIC: 6600000, QLD: 5500000, WA: 2800000,
  SA: 1800000, ACT: 450000, TAS: 570000, NT: 250000,
};

const geoData = SA4_REGIONS.map(region => {
  const stateAdvisers = marketSize.byState.find(s => s.state === region.state)?.adviserCount ?? 0;
  const regionCount = SA4_REGIONS.filter(r => r.state === region.state).length;
  const baseAdvisers = Math.round(stateAdvisers / regionCount * faker.number.float({ min: 0.3, max: 2.5 }));
  const isMetro = METRO_SA4_CODES.includes(region.code);
  const statePopulation = statePopulations[region.state] ?? 500000;
  const regionPopulation = Math.round(statePopulation / regionCount * faker.number.float({ min: 0.4, max: 2.0 }));
  const advisersPerCapita = regionPopulation > 0 ? (baseAdvisers / regionPopulation) * 10000 : 0;
  const whiteSpaceScore = Math.round(Math.min(100, Math.max(0, 100 - (advisersPerCapita / NATIONAL_BENCHMARK) * 100)));

  const suburbsInRegion = SUBURB_POSTCODES.filter(s => s.sa4Code === region.code);
  const refSuburb = suburbsInRegion[0] ?? SUBURB_POSTCODES[0];

  return {
    regionCode: region.code,
    regionName: region.name,
    regionType: 'sa4',
    adviserCount: baseAdvisers,
    licenseeCount: Math.max(1, Math.round(baseAdvisers / 3.5)),
    practiceCount: Math.max(1, Math.round(baseAdvisers / 2.3)),
    population: regionPopulation,
    advisersPerCapita: Math.round(advisersPerCapita * 10) / 10,
    whiteSpaceScore,
    metroOrRegional: isMetro ? 'Metro' : 'Regional',
    state: region.state,
    coordinates: [refSuburb.lat, refSuburb.lng] as [number, number],
  };
});

// --- Write all files ---
const OUT = path.join(__dirname, '../mock');
fs.mkdirSync(OUT, { recursive: true });

fs.writeFileSync(path.join(OUT, 'licensees.json'), JSON.stringify(licensees, null, 2));
fs.writeFileSync(path.join(OUT, 'advisers.json'), JSON.stringify(advisersResolved, null, 2));
fs.writeFileSync(path.join(OUT, 'movements.json'), JSON.stringify(movements, null, 2));
fs.writeFileSync(path.join(OUT, 'market-size.json'), JSON.stringify({ snapshot: marketSize, timeSeries }, null, 2));
fs.writeFileSync(path.join(OUT, 'geographic.json'), JSON.stringify(geoData, null, 2));

console.log('✓ licensees.json', licensees.length, 'records');
console.log('✓ advisers.json', advisersResolved.length, 'records');
console.log('✓ movements.json', movements.length, 'records');
console.log('✓ market-size.json');
console.log('✓ geographic.json', geoData.length, 'regions');
