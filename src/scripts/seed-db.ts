/**
 * Seeds the Prisma sync tables from the committed mock JSON files.
 * Run once to populate the DB for local development without needing a real ASIC sync.
 *
 *   npx tsx src/scripts/seed-db.ts
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { Adviser, Licensee, MovementEvent } from '../types';

const prisma = new PrismaClient();

function load<T>(file: string): T {
  const text = readFileSync(join(process.cwd(), 'src/data/mock', file), 'utf-8');
  return JSON.parse(text) as T;
}

async function seed() {
  const advisers   = load<Adviser[]>('advisers.json');
  const licensees  = load<Licensee[]>('licensees.json');
  const movements  = load<MovementEvent[]>('movements.json');
  const geographic = load<any[]>('geographic.json');

  console.log(`Seeding ${advisers.length} advisers…`);
  for (const a of advisers) {
    await prisma.syncAdviser.upsert({
      where:  { adviserId: a.adviserId },
      update: {},
      create: {
        id:                  a.id,
        adviserId:           a.adviserId,
        firstName:           a.firstName,
        lastName:            a.lastName,
        fullName:            a.fullName,
        status:              a.status,
        registrationDate:    a.registrationDate,
        channel:             a.channel,
        currentLicenseeId:   a.currentLicenseeId,
        currentLicenseeName: a.currentLicenseeName,
        currentFirmName:     a.currentFirmName,
        locationJson:        JSON.stringify(a.location),
        qualificationsJson:  JSON.stringify(a.qualifications),
        productAuthsJson:    JSON.stringify(a.productAuthorities),
        workHistoryJson:     JSON.stringify(a.workHistory),
        yearsExperience:     a.yearsExperience,
        specialisationsJson: JSON.stringify(a.specialisations),
        lastUpdated:         a.lastUpdated,
      },
    });
  }

  console.log(`Seeding ${licensees.length} licensees…`);
  for (const l of licensees) {
    await prisma.syncLicensee.upsert({
      where:  { afslNumber: l.afslNumber },
      update: {},
      create: {
        id:                 l.id,
        afslNumber:         l.afslNumber,
        name:               l.name,
        tradingName:        l.tradingName ?? null,
        parentGroup:        l.parentGroup ?? null,
        abn:                l.abn,
        registrationDate:   l.registrationDate,
        status:             l.status,
        headOfficeState:    l.headOfficeState,
        headOfficePostcode: l.headOfficePostcode,
        adviserCount:       l.adviserCount,
        practiceCount:      l.practiceCount,
        channel:            l.channel,
        tier:               l.tier,
        productsJson:       JSON.stringify(l.products ?? []),
        historyJson:        JSON.stringify(l.adviserCountHistory ?? []),
        website:            l.website ?? null,
      },
    });
  }

  console.log(`Seeding ${movements.length} movements…`);
  for (const m of movements) {
    await prisma.syncMovement.upsert({
      where:  { id: m.id },
      update: {},
      create: {
        id:              m.id,
        adviserId:       m.adviserId,
        adviserName:     m.adviserName,
        eventType:       m.eventType,
        fromLicenseeId:  m.fromLicenseeId  ?? null,
        fromLicenseeName:m.fromLicenseeName ?? null,
        toLicenseeId:    m.toLicenseeId    ?? null,
        toLicenseeName:  m.toLicenseeName  ?? null,
        eventDate:       m.eventDate,
        effectiveDate:   m.effectiveDate   ?? null,
        source:          m.source,
      },
    });
  }

  console.log(`Seeding ${geographic.length} geographic regions…`);
  for (const g of geographic) {
    await prisma.syncGeographic.upsert({
      where:  { regionCode: g.regionCode },
      update: {},
      create: {
        regionCode:        g.regionCode,
        regionName:        g.regionName,
        regionType:        g.regionType,
        state:             g.state,
        adviserCount:      g.adviserCount,
        practiceCount:     g.practiceCount,
        population:        g.population,
        advisersPerCapita: g.advisersPerCapita,
        whiteSpaceScore:   g.whiteSpaceScore,
        metroOrRegional:   g.metroOrRegional,
        coordinatesJson:   JSON.stringify(g.coordinates),
      },
    });
  }

  // Create a seed log entry
  await prisma.syncLog.create({
    data: {
      status:          'success',
      source:          'mock-json-seed',
      completedAt:     new Date(),
      advisersAdded:   advisers.length,
      licenseesAdded:  licensees.length,
      movementsAdded:  movements.length,
      notes:           'Initial seed from mock JSON files',
    },
  });

  console.log('Seed complete.');
}

seed()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
