/**
 * Global Dynamic FRC Team Directory & Metadata Resolver
 * Real-time dynamic lookup powered by The Blue Alliance
 */

import { useState, useEffect } from 'react';
import { CacheManager, StorageService, STORAGE_KEYS } from '../services';

export interface TeamMetadata {
  name: string;
  city?: string;
  state?: string;
}

// In-memory dynamic team cache preloaded with official FRC team directory
export const FRC_TEAM_DIRECTORY: Record<number, TeamMetadata> = {
  // Key User & Preset Teams
  1002: { name: 'CircuitRunners Robotics', city: 'Marietta', state: 'Georgia' },
  1833: { name: 'Team BEAN', city: 'Roswell', state: 'Georgia' },
  1771: { name: 'North Gwinnett Robotics', city: 'Suwanee', state: 'Georgia' },
  2974: { name: 'Walton Robotics', city: 'Marietta', state: 'Georgia' },
  8736: { name: 'The Mechanisms', city: 'Roswell', state: 'Georgia' },

  // Peachtree (PCH) District Teams
  832: { name: 'Oscar', city: 'Roswell', state: 'Georgia' },
  1261: { name: 'Robo Lions', city: 'Suwanee', state: 'Georgia' },
  1414: { name: 'IHOT', city: 'Atlanta', state: 'Georgia' },
  1648: { name: 'G3 Robotics', city: 'Atlanta', state: 'Georgia' },
  1683: { name: 'Techno Titans', city: 'Johns Creek', state: 'Georgia' },
  3344: { name: 'Technic Titans', city: 'Atlanta', state: 'Georgia' },
  3635: { name: 'Flying Horsepower', city: 'Alpharetta', state: 'Georgia' },
  4026: { name: 'Decatur Robotics', city: 'Decatur', state: 'Georgia' },
  4188: { name: 'Columbus Space Program', city: 'Columbus', state: 'Georgia' },
  5109: { name: 'Gladiator Robotics', city: 'Johns Creek', state: 'Georgia' },
  5203: { name: 'Gremlins', city: 'Cumming', state: 'Georgia' },
  6705: { name: 'Dunwoody Wildcat Robotics', city: 'Dunwoody', state: 'Georgia' },
  6829: { name: 'Ignite Robotics', city: 'Suwanee', state: 'Georgia' },
  6919: { name: 'The Commodore Conchs', city: 'Albany', state: 'Georgia' },
  7451: { name: 'Innovation Robotics', city: 'Lawrenceville', state: 'Georgia' },
  8080: { name: 'Kalu', city: 'Kennesaw', state: 'Georgia' },
  8866: { name: 'Innovation', city: 'Lawrenceville', state: 'Georgia' },

  // World Champion & Notable FRC Powerhouses
  118: { name: 'The Robonauts', city: 'League City', state: 'Texas' },
  148: { name: 'Robowranglers', city: 'Greenville', state: 'Texas' },
  254: { name: 'The Cheesy Poofs', city: 'San Jose', state: 'California' },
  971: { name: 'Spartan Robotics', city: 'Mountain View', state: 'California' },
  973: { name: 'Greybots', city: 'Atascadero', state: 'California' },
  1114: { name: 'Simbotics', city: 'St. Catharines', state: 'Ontario' },
  1241: { name: 'THEORY6', city: 'Mississauga', state: 'Ontario' },
  1323: { name: 'MadTown Robotics', city: 'Madera', state: 'California' },
  1678: { name: 'Citrus Circuits', city: 'Davis', state: 'California' },
  2056: { name: 'OP Robotics', city: 'Stoney Creek', state: 'Ontario' },
  2468: { name: 'Team Appreciate', city: 'Austin', state: 'Texas' },
  2714: { name: 'BBQ', city: 'Dallas', state: 'Texas' },
  2910: { name: 'Jack in the Bot', city: 'Mill Creek', state: 'Washington' },
  3005: { name: 'RoboChargers', city: 'Dallas', state: 'Texas' },
  3310: { name: 'Black Hawk Robotics', city: 'Heath', state: 'Texas' },
  3847: { name: 'Spectrum - Guidance', city: 'Houston', state: 'Texas' },
  4414: { name: 'HighTide', city: 'Ventura', state: 'California' },
  4911: { name: 'CyberKnights', city: 'Seattle', state: 'Washington' },
  8515: { name: 'Photon', city: 'Spring', state: 'Texas' },

  // Midwest & East Coast Favorites
  27: { name: 'Team RUSH', city: 'Clarkston', state: 'Michigan' },
  33: { name: 'Killer Bees', city: 'Auburn Hills', state: 'Michigan' },
  51: { name: 'Wings of Fire', city: 'Pontiac', state: 'Michigan' },
  67: { name: 'The HOT Team', city: 'Milford', state: 'Michigan' },
  70: { name: 'More Martians', city: 'Flint', state: 'Michigan' },
  125: { name: 'NUTRONS', city: 'Boston', state: 'Massachusetts' },
  131: { name: 'CHAOS', city: 'Manchester', state: 'New Hampshire' },
  176: { name: 'Aces High', city: 'Windsor Locks', state: 'Connecticut' },
  177: { name: 'Bobcat Robotics', city: 'South Windsor', state: 'Connecticut' },
  195: { name: 'CyberKnights', city: 'Southington', state: 'Connecticut' },
  230: { name: 'Gaelhawks', city: 'Shelton', state: 'Connecticut' },
  238: { name: 'Crusaders', city: 'Manchester', state: 'New Hampshire' },
  319: { name: 'Big Bad Bob', city: 'Alton', state: 'New Hampshire' },
  449: { name: 'The Blair Robot Project', city: 'Silver Spring', state: 'Maryland' },
  469: { name: 'Las Guerrillas', city: 'Bloomfield Hills', state: 'Michigan' },
  501: { name: 'The PowerKnights', city: 'Manchester', state: 'New Hampshire' },
  610: { name: 'The Coyotes', city: 'Toronto', state: 'Ontario' },
  624: { name: 'CRyptonite', city: 'Katy', state: 'Texas' },
  772: { name: 'Sabre Bytes', city: 'Amherstburg', state: 'Ontario' },
  948: { name: 'NRG', city: 'Bellevue', state: 'Washington' },
  1023: { name: 'Bedford Express', city: 'Temperance', state: 'Michigan' },
  1305: { name: 'Ice Cubed', city: 'North Bay', state: 'Ontario' },
  1310: { name: 'RUN NYC', city: 'Toronto', state: 'Ontario' },
  1325: { name: 'Inverse Paradox', city: 'Mississauga', state: 'Ontario' },
  1718: { name: 'The Fighting Pi', city: 'Armada', state: 'Michigan' },
  1983: { name: 'Skunk Works Robotics', city: 'Seattle', state: 'Washington' },
  2046: { name: 'Bear Metal', city: 'Maple Valley', state: 'Washington' },
  2522: { name: 'Royal Robotics', city: 'Lynnwood', state: 'Washington' },
  2834: { name: 'Bionic Black Hawks', city: 'Bloomfield Hills', state: 'Michigan' },
  2930: { name: 'Sonic Squirrels', city: 'Snohomish', state: 'Washington' },
  3538: { name: 'RoboJackets', city: 'Auburn Hills', state: 'Michigan' },
  3604: { name: 'Goon Squad', city: 'Flat Rock', state: 'Michigan' },
  4039: { name: 'MakeShift Robotics', city: 'Hamilton', state: 'Ontario' },
  4328: { name: 'Colleyville Heritage', city: 'Colleyville', state: 'Texas' },
  4476: { name: 'W.A.F.F.L.E.S.', city: 'Kingston', state: 'Ontario' },
  4488: { name: 'Shockwave', city: 'Hillsboro', state: 'Oregon' },
  5417: { name: 'Eagle Robotics', city: 'Allen', state: 'Texas' },
};

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

  // 3. Trigger asynchronous background fetch from TBA server proxy or direct TBA API
  if (typeof window !== 'undefined' && !pendingFetches.has(teamNumber)) {
    pendingFetches.add(teamNumber);

    const config = StorageService.get<any>(STORAGE_KEYS.CONFIG, null);
    const rawKey = config?.tbaApiKey;
    const envKey = typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_TBA_API_KEY : '';
    const apiKey = (rawKey && !rawKey.includes('PublicPreviewKey') && rawKey.trim().length > 5 ? rawKey.trim() : '') || (envKey && envKey.trim().length > 5 ? envKey.trim() : '');

    const fetchTeamAsync = async () => {
      const isStatic = window.location.hostname.endsWith('github.io') || window.location.protocol === 'file:';

      // 1. Try server proxy first if not on static host
      if (!isStatic) {
        try {
          const resp = await fetch(`/api/tba/team/${teamNumber}${apiKey ? `?apiKey=${encodeURIComponent(apiKey)}` : ''}`);
          if (resp.ok) {
            const data = await resp.json();
            if (data && (data.nickname || data.name)) return data;
          }
        } catch {
          // continue to direct fetch
        }
      }

      // 2. Direct TBA API call (browser CORS compatible)
      if (apiKey) {
        try {
          const directResp = await fetch(`https://www.thebluealliance.com/api/v3/team/frc${teamNumber}`, {
            headers: { 'X-TBA-Auth-Key': apiKey, Accept: 'application/json' },
          });
          if (directResp.ok) {
            const data = await directResp.json();
            return {
              nickname: data.nickname || data.name,
              city: data.city || '',
              stateProv: data.state_prov || '',
            };
          }
        } catch {
          // continue
        }
      }

      return null;
    };

    fetchTeamAsync()
      .then((data) => {
        if (data && (data.nickname || data.name)) {
          const nick = data.nickname || data.name;
          registerTeamMetadata(teamNumber, {
            name: nick,
            city: data.city,
            state: data.stateProv || data.state,
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
      const next = getTeamMetadata(teamNumber);
      setMeta((prev) => {
        if (prev.name === next.name && prev.city === next.city && prev.state === next.state) {
          return prev;
        }
        return next;
      });
    };
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, [teamNumber]);

  return meta;
}
