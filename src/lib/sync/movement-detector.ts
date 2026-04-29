/**
 * Detects adviser movement events by diffing the incoming ASIC snapshot
 * against the previous state stored in the DB.
 *
 * Movement rules:
 *   - Adviser not in DB + status Active → Join
 *   - Adviser in DB, AFSL changed        → Transfer (from old licensee → new licensee)
 *   - Status: Active → Suspended         → Suspension
 *   - Status: Active/Suspended → Cancelled/Lapsed → Cancellation
 *   - Status: Suspended → Active         → Reinstatement
 *   - Adviser in DB but absent from new CSV → Exit
 */

import { randomUUID } from 'crypto';

export interface AdviserSnapshot {
  adviserId:        string;
  fullName:         string;
  status:           string;
  currentLicenseeId:string;   // uses afslNumber as the stable key
  currentLicenseeName:string;
}

export interface DetectedMovement {
  id:              string;
  adviserId:       string;
  adviserName:     string;
  eventType:       'Join' | 'Exit' | 'Transfer' | 'Suspension' | 'Reinstatement' | 'Cancellation';
  fromLicenseeId?: string;
  fromLicenseeName?:string;
  toLicenseeId?:   string;
  toLicenseeName?: string;
  eventDate:       string;
  effectiveDate?:  string;
  source:          string;
}

export function detectMovements(
  previousSnap: AdviserSnapshot[],
  newSnap: AdviserSnapshot[],
  asAtDate: string,
): DetectedMovement[] {
  const movements: DetectedMovement[] = [];
  const today = asAtDate;

  const prevMap = new Map(previousSnap.map(a => [a.adviserId, a]));
  const newMap  = new Map(newSnap.map(a => [a.adviserId, a]));

  // ── Check each incoming adviser ───────────────────────────────────────────
  for (const cur of newSnap) {
    const prev = prevMap.get(cur.adviserId);

    if (!prev) {
      // New adviser appearing in the register
      if (cur.status === 'Active') {
        movements.push({
          id: randomUUID(), adviserId: cur.adviserId, adviserName: cur.fullName,
          eventType: 'Join',
          toLicenseeId: cur.currentLicenseeId, toLicenseeName: cur.currentLicenseeName,
          eventDate: today, source: 'ASIC Register',
        });
      }
      continue;
    }

    // ── Licensee changed → Transfer ──────────────────────────────────────────
    if (prev.currentLicenseeId !== cur.currentLicenseeId) {
      movements.push({
        id: randomUUID(), adviserId: cur.adviserId, adviserName: cur.fullName,
        eventType: 'Transfer',
        fromLicenseeId: prev.currentLicenseeId, fromLicenseeName: prev.currentLicenseeName,
        toLicenseeId:   cur.currentLicenseeId,  toLicenseeName:  cur.currentLicenseeName,
        eventDate: today, source: 'ASIC Register',
      });
      continue;
    }

    // ── Status changes ────────────────────────────────────────────────────────
    if (prev.status !== cur.status) {
      const from = prev.status;
      const to   = cur.status;

      if (to === 'Suspended') {
        movements.push({
          id: randomUUID(), adviserId: cur.adviserId, adviserName: cur.fullName,
          eventType: 'Suspension',
          fromLicenseeId: cur.currentLicenseeId, fromLicenseeName: cur.currentLicenseeName,
          eventDate: today, source: 'ASIC Register',
        });
      } else if (to === 'Cancelled' || to === 'Lapsed') {
        movements.push({
          id: randomUUID(), adviserId: cur.adviserId, adviserName: cur.fullName,
          eventType: 'Cancellation',
          fromLicenseeId: cur.currentLicenseeId, fromLicenseeName: cur.currentLicenseeName,
          eventDate: today, source: 'ASIC Register',
        });
      } else if (to === 'Active' && (from === 'Suspended' || from === 'Lapsed')) {
        movements.push({
          id: randomUUID(), adviserId: cur.adviserId, adviserName: cur.fullName,
          eventType: 'Reinstatement',
          toLicenseeId: cur.currentLicenseeId, toLicenseeName: cur.currentLicenseeName,
          eventDate: today, source: 'ASIC Register',
        });
      }
    }
  }

  // ── Advisers in DB but gone from new CSV → Exit ───────────────────────────
  for (const prev of previousSnap) {
    if (!newMap.has(prev.adviserId) && prev.status === 'Active') {
      movements.push({
        id: randomUUID(), adviserId: prev.adviserId, adviserName: prev.fullName,
        eventType: 'Exit',
        fromLicenseeId: prev.currentLicenseeId, fromLicenseeName: prev.currentLicenseeName,
        eventDate: today, source: 'ASIC Register',
      });
    }
  }

  return movements;
}
