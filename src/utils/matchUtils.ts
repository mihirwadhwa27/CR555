/**
 * Tournament Match Utilities & Formatting
 * PitFUSION 2.0
 */

import { MatchModel } from '../types';

/**
 * Standardized human-readable match title formatting
 * Handles QUAL (Q1, Qual 1), PLAYOFF (P1..P13 / SF / QF), and FINALS (F1..F3, Finals 1)
 */
export function formatMatchLabel(
  match: MatchModel | { matchNumber?: number; compLevel?: string; setNumber?: number; key?: string },
  short: boolean = false
): string {
  if (!match) return short ? 'Q?' : 'Qual ?';

  let compLevel = match.compLevel;
  let matchNum = match.matchNumber;
  let setNum = match.setNumber;

  if (match.key) {
    const keyMatch = match.key.match(/_([a-z]+)(\d+)(?:m(\d+))?$/i);
    if (keyMatch) {
      const type = keyMatch[1].toLowerCase();
      const num1 = parseInt(keyMatch[2], 10);
      const num2 = keyMatch[3] ? parseInt(keyMatch[3], 10) : undefined;

      if (type === 'qm') {
        compLevel = 'QUAL';
        if (matchNum === undefined || matchNum === null) matchNum = num1;
      } else if (type === 'f') {
        compLevel = 'FINALS';
        if (setNum === undefined || setNum === null) setNum = num1;
        if (matchNum === undefined || matchNum === null) matchNum = num2 || 1;
      } else {
        compLevel = 'PLAYOFF';
        if (setNum === undefined || setNum === null) setNum = num1;
        if (matchNum === undefined || matchNum === null) matchNum = num2 || 1;
      }
    }
  }

  if (!compLevel) compLevel = 'QUAL';
  if (matchNum === undefined || matchNum === null) matchNum = 1;

  if (compLevel === 'FINALS') {
    const fNum = matchNum || setNum || 1;
    if (short) return `F${fNum}`;
    return `Finals ${fNum}`;
  }

  if (compLevel === 'PLAYOFF') {
    const pNum = setNum || matchNum || 1;
    if (short) return `P${pNum}`;
    return `Playoff ${pNum}`;
  }

  // Qualification
  if (short) return `Q${matchNum}`;
  return `Qual ${matchNum}`;
}

/**
 * Visual styling classes based on tournament competition level
 */
export function getCompLevelBadgeClasses(
  compLevel?: string,
  isOurMatch: boolean = false,
  key?: string
): { badgeBg: string; border: string; text: string; label: string } {
  let resolvedLevel = compLevel;
  if (!resolvedLevel && key) {
    if (key.includes('_f')) resolvedLevel = 'FINALS';
    else if (key.includes('_sf') || key.includes('_qf') || key.includes('_ef')) resolvedLevel = 'PLAYOFF';
    else resolvedLevel = 'QUAL';
  }

  if (resolvedLevel === 'FINALS') {
    return {
      badgeBg: 'bg-amber-500/25',
      border: 'border-amber-500/60',
      text: 'text-amber-300 font-black',
      label: 'FINALS',
    };
  }
  if (resolvedLevel === 'PLAYOFF') {
    return {
      badgeBg: 'bg-purple-900/40',
      border: 'border-purple-600/60',
      text: 'text-purple-300 font-extrabold',
      label: 'PLAYOFF',
    };
  }
  if (isOurMatch) {
    return {
      badgeBg: 'bg-amber-400',
      border: 'border-amber-500',
      text: 'text-black font-extrabold',
      label: 'QUAL',
    };
  }
  return {
    badgeBg: 'bg-zinc-800',
    border: 'border-zinc-700',
    text: 'text-zinc-300 font-bold',
    label: 'QUAL',
  };
}

/**
 * Authoritative tournament match sorting:
 * 1. Qualification matches (Qual 1 ... Qual N)
 * 2. Playoff matches (Playoff 1 ... Playoff 13 / Double Elimination)
 * 3. Finals matches (Finals 1 ... Finals 3)
 */
export function sortTournamentMatches(matches: MatchModel[]): MatchModel[] {
  if (!Array.isArray(matches)) return [];

  const getLevelWeight = (level?: string, key?: string) => {
    if (level === 'QUAL' || (key && key.includes('_qm'))) return 1;
    if (level === 'PLAYOFF' || (key && (key.includes('_ef') || key.includes('_qf') || key.includes('_sf')))) return 2;
    if (level === 'FINALS' || (key && key.includes('_f'))) return 3;
    return 1;
  };

  return [...matches].sort((a, b) => {
    const wA = getLevelWeight(a.compLevel, a.key);
    const wB = getLevelWeight(b.compLevel, b.key);

    if (wA !== wB) return wA - wB;

    if (wA === 1) {
      // Qual matches: sort by matchNumber
      return (a.matchNumber || 0) - (b.matchNumber || 0);
    }

    if (wA === 2) {
      // Playoff matches: sort by setNumber (Playoff match 1..13), then matchNumber
      const setA = a.setNumber ?? a.matchNumber ?? 1;
      const setB = b.setNumber ?? b.matchNumber ?? 1;
      if (setA !== setB) return setA - setB;
      return (a.matchNumber || 1) - (b.matchNumber || 1);
    }

    // Finals: sort by matchNumber (Finals 1, 2, 3)
    return (a.matchNumber || 1) - (b.matchNumber || 1);
  });
}
