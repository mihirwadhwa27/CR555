/**
 * Global Dynamic FRC Team Directory & Metadata Resolver
 * Real-time dynamic lookup powered by The Blue Alliance
 */

import { useState, useEffect } from 'react';
import { CacheManager } from '../services';

export interface TeamMetadata {
  name: string;
  city?: string;
  state?: string;
}

// In-memory dynamic team cache
export const FRC_TEAM_DIRECTORY: Record<number, TeamMetadata> = {};

const pendingFetches = new Set<number>();
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {}
  });
}

/**
 * Register or update metadata for a specific team
 */
export function registerTeamMetadata(teamNumber: number, meta: Partial<TeamMetadata>) {
  if (!teamNumber || isNaN(teamNumber)) return;
  const existing: Partial<TeamMetadata> = FRC_TEAM_DIRECTORY[teamNumber] || {};
  const newName = meta.name && !meta.name.match(/^Team \d+$/i) ? meta.name : existing.name || `Team ${teamNumber}`;

  FRC_TEAM_DIRECTORY[teamNumber] = {
    name: newName,
    city: meta.city !== undefined ? meta.city : existing.city,
    state: meta.state !== undefined ? meta.state : existing.state,
  };

  CacheManager.set(
    'tba',
    'teams',
    `team_${teamNumber}`,
    {
      nickname: FRC_TEAM_DIRECTORY[teamNumber].name,
      city: FRC_TEAM_DIRECTORY[teamNumber].city,
      stateProv: FRC_TEAM_DIRECTORY[teamNumber].state,
    },
    86400
  );

  notifyListeners();
}

/**
 * Bulk register metadata for multiple teams (e.g. from event rosters or rankings)
 */
export function registerTeamsBulk(teams: Array<{ teamNumber: number; name?: string; city?: string; state?: string }>) {
  if (!Array.isArray(teams) || teams.length === 0) return;
  let hasChanges = false;

  for (const t of teams) {
    if (!t.teamNumber || isNaN(t.teamNumber)) continue;
    const existing = FRC_TEAM_DIRECTORY[t.teamNumber];
    const newName = t.name && !t.name.match(/^Team \d+$/i) ? t.name : existing?.name || `Team ${t.teamNumber}`;

    if (!existing || existing.name !== newName || existing.city !== t.city || existing.state !== t.state) {
      FRC_TEAM_DIRECTORY[t.teamNumber] = {
        name: newName,
        city: t.city !== undefined ? t.city : existing?.city,
        state: t.state !== undefined ? t.state : existing?.state,
      };

      CacheManager.set(
        'tba',
        'teams',
        `team_${t.teamNumber}`,
        {
          nickname: FRC_TEAM_DIRECTORY[t.teamNumber].name,
          city: FRC_TEAM_DIRECTORY[t.teamNumber].city,
          stateProv: FRC_TEAM_DIRECTORY[t.teamNumber].state,
        },
        86400
      );
      hasChanges = true;
    }
  }

  if (hasChanges) {
    notifyListeners();
  }
}

/**
 * Fetch and return team metadata, automatically dispatching a live TBA fetch if missing
 */
export function getTeamMetadata(teamNumber: number): TeamMetadata {
  if (!teamNumber || isNaN(teamNumber)) return { name: 'Unknown Team' };

  // 1. Check in-memory dynamic cache
  const info = FRC_TEAM_DIRECTORY[teamNumber];
  if (info && info.name && !info.name.match(/^Team \d+$/i)) {
    return info;
  }

  // 2. Check CacheManager persistent storage
  const cachedTeam = CacheManager.get<{ nickname?: string; city?: string; stateProv?: string }>('tba', 'teams', `team_${teamNumber}`);
  if (cachedTeam?.data?.nickname && !cachedTeam.data.nickname.match(/^Team \d+$/i)) {
    FRC_TEAM_DIRECTORY[teamNumber] = {
      name: cachedTeam.data.nickname,
      city: cachedTeam.data.city,
      state: cachedTeam.data.stateProv,
    };
    return FRC_TEAM_DIRECTORY[teamNumber];
  }

  // 3. Trigger asynchronous background fetch from TBA server proxy
  if (typeof window !== 'undefined' && !pendingFetches.has(teamNumber)) {
    pendingFetches.add(teamNumber);
    fetch(`/api/tba/team/${teamNumber}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && (data.nickname || data.name)) {
          const nick = data.nickname || data.name;
          registerTeamMetadata(teamNumber, {
            name: nick,
            city: data.city,
            state: data.stateProv,
          });
        }
      })
      .catch((err) => {
        console.warn(`[TeamLookup] Live fetch failed for team ${teamNumber}:`, err);
      })
      .finally(() => {
        pendingFetches.delete(teamNumber);
      });
  }

  return info || { name: `Team ${teamNumber}` };
}

/**
 * Get just the team nickname/name
 */
export function getTeamName(teamNumber: number): string {
  return getTeamMetadata(teamNumber).name;
}

/**
 * Get full formatted team display e.g. "6829 - Ignite Robotics (Suwanee, Georgia)"
 */
export function getTeamFullInfo(teamNumber: number): string {
  const meta = getTeamMetadata(teamNumber);
  const loc = meta.city && meta.state ? ` (${meta.city}, ${meta.state})` : meta.city ? ` (${meta.city})` : '';
  return `${teamNumber} - ${meta.name}${loc}`;
}

/**
 * React hook that automatically updates component when live team data arrives
 */
export function useTeamMetadata(teamNumber: number): TeamMetadata {
  const [meta, setMeta] = useState<TeamMetadata>(() => getTeamMetadata(teamNumber));

  useEffect(() => {
    setMeta(getTeamMetadata(teamNumber));
    const onChange = () => {
      setMeta(getTeamMetadata(teamNumber));
    };
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, [teamNumber]);

  return meta;
}
