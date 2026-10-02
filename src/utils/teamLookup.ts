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
  27: { name: 'Team RUSH', city: 'Clarkston', state: 'Michigan' },
  33: { name: 'Killer Bees', city: 'Auburn Hills', state: 'Michigan' },
  51: { name: 'Wings of Fire', city: 'Pontiac', state: 'Michigan' },
  67: { name: 'The HOT Team', city: 'Milford', state: 'Michigan' },
  70: { name: 'More Martians', city: 'Flint', state: 'Michigan' },
  118: { name: 'Robonauts', city: 'League City', state: 'Texas' },
  125: { name: 'NUTRONS', city: 'Boston', state: 'Massachusetts' },
  131: { name: 'CHAOS', city: 'Manchester', state: 'New Hampshire' },
  148: { name: 'Robowranglers', city: 'Greenville', state: 'Texas' },
  176: { name: 'Aces High', city: 'Windsor Locks', state: 'Connecticut' },
  177: { name: 'Bobcat Robotics', city: 'South Windsor', state: 'Connecticut' },
  195: { name: 'CyberKnights', city: 'Southington', state: 'Connecticut' },
  230: { name: 'Gaelhawks', city: 'Shelton', state: 'Connecticut' },
  238: { name: 'Crusaders', city: 'Manchester', state: 'New Hampshire' },
  254: { name: 'The Cheesy Poofs', city: 'San Jose', state: 'California' },
  281: { name: 'The GreenVillains', city: 'Greenville', state: 'South Carolina' },
  319: { name: 'Big Bad Bob', city: 'Alton', state: 'New Hampshire' },
  342: { name: 'Burning Magnetos', city: 'North Charleston', state: 'South Carolina' },
  343: { name: 'Metal-In-Motion', city: 'Seneca', state: 'South Carolina' },
  449: { name: 'The Blair Robot Project', city: 'Silver Spring', state: 'Maryland' },
  469: { name: 'Las Guerrillas', city: 'Bloomfield Hills', state: 'Michigan' },
  501: { name: 'The PowerKnights', city: 'Manchester', state: 'New Hampshire' },
  610: { name: 'The Coyotes', city: 'Toronto', state: 'Ontario' },
  624: { name: 'CRyptonite', city: 'Katy', state: 'Texas' },
  772: { name: 'Sabre Bytes', city: 'Amherstburg', state: 'Ontario' },
  832: { name: 'OSCAR', city: 'Roswell', state: 'Georgia' },
  948: { name: 'NRG', city: 'Bellevue', state: 'Washington' },
  971: { name: 'Spartan Robotics', city: 'Mountain View', state: 'California' },
  973: { name: 'Greybots', city: 'Atascadero', state: 'California' },
  1002: { name: 'CircuitRunners Robotics', city: 'Marietta', state: 'Georgia' },
  1023: { name: 'Bedford Express', city: 'Temperance', state: 'Michigan' },
  1102: { name: 'M\'Aiken Magic', city: 'Aiken', state: 'South Carolina' },
  1114: { name: 'Simbotics', city: 'St. Catharines', state: 'Ontario' },
  1241: { name: 'THEORY6', city: 'Mississauga', state: 'Ontario' },
  1261: { name: 'Robo Lions Team1261', city: 'Suwanee', state: 'Georgia' },
  1287: { name: 'Aluminum Assault', city: 'Myrtle Beach', state: 'South Carolina' },
  1305: { name: 'Ice Cubed', city: 'North Bay', state: 'Ontario' },
  1310: { name: 'RUN NYC', city: 'Toronto', state: 'Ontario' },
  1311: { name: 'Kell Robotics', city: 'Kennesaw', state: 'Georgia' },
  1323: { name: 'MadTown Robotics', city: 'Madera', state: 'California' },
  1325: { name: 'Inverse Paradox', city: 'Mississauga', state: 'Ontario' },
  1414: { name: 'IHOT', city: 'Atlanta', state: 'Georgia' },
  1648: { name: 'G3 Robotics', city: 'Atlanta', state: 'Georgia' },
  1678: { name: 'Citrus Circuits', city: 'Davis', state: 'California' },
  1683: { name: 'Techno Titans', city: 'Johns Creek', state: 'Georgia' },
  1718: { name: 'The Fighting Pi', city: 'Armada', state: 'Michigan' },
  1746: { name: 'Team OTTO', city: 'Cumming', state: 'Georgia' },
  1758: { name: 'Technomancers', city: 'Florence', state: 'South Carolina' },
  1771: { name: 'North Gwinnett Robotics', city: 'Suwanee', state: 'Georgia' },
  1833: { name: 'Team BEAN', city: 'Cumming', state: 'Georgia' },
  1983: { name: 'Skunk Works Robotics', city: 'Seattle', state: 'Washington' },
  2046: { name: 'Bear Metal', city: 'Maple Valley', state: 'Washington' },
  2056: { name: 'OP Robotics', city: 'Stoney Creek', state: 'Ontario' },
  2415: { name: 'WiredCats', city: 'Atlanta', state: 'Georgia' },
  2468: { name: 'Team Appreciate', city: 'Austin', state: 'Texas' },
  2522: { name: 'Royal Robotics', city: 'Lynnwood', state: 'Washington' },
  2714: { name: 'BBQ', city: 'Dallas', state: 'Texas' },
  2815: { name: 'Blue Devil Mechanics', city: 'Columbia', state: 'South Carolina' },
  2834: { name: 'Bionic Black Hawks', city: 'Bloomfield Hills', state: 'Michigan' },
  2910: { name: 'Jack in the Bot', city: 'Mill Creek', state: 'Washington' },
  2930: { name: 'Sonic Squirrels', city: 'Snohomish', state: 'Washington' },
  2974: { name: 'Walton Robotics', city: 'Marietta', state: 'Georgia' },
  3005: { name: 'RoboChargers', city: 'Dallas', state: 'Texas' },
  3091: { name: '100 Scholars', city: 'Atlanta', state: 'Georgia' },
  3310: { name: 'Black Hawk Robotics', city: 'Heath', state: 'Texas' },
  3329: { name: 'Wildbots', city: 'Kingsland', state: 'Georgia' },
  3344: { name: 'Space Dragons', city: 'Fayetteville', state: 'Georgia' },
  3489: { name: 'Category 5', city: 'Summerville', state: 'South Carolina' },
  3490: { name: 'Viper Drive', city: 'Summerville', state: 'South Carolina' },
  3538: { name: 'RoboJackets', city: 'Auburn Hills', state: 'Michigan' },
  3604: { name: 'Goon Squad', city: 'Flat Rock', state: 'Michigan' },
  3635: { name: 'Flying Legion', city: 'Perry', state: 'Georgia' },
  3815: { name: 'NF Raiders', city: 'Cumming', state: 'Georgia' },
  3847: { name: 'Spectrum - Guidance', city: 'Houston', state: 'Texas' },
  4026: { name: 'Decatur Robotics', city: 'Decatur', state: 'Georgia' },
  4039: { name: 'MakeShift Robotics', city: 'Hamilton', state: 'Ontario' },
  4112: { name: 'EagleBots', city: 'Cumming', state: 'Georgia' },
  4188: { name: 'Columbus Space Program', city: 'Columbus', state: 'Georgia' },
  4189: { name: 'Chargers', city: 'Jefferson', state: 'Georgia' },
  4240: { name: 'TroTek Warriors', city: 'Albany', state: 'Georgia' },
  4328: { name: 'Colleyville Heritage', city: 'Colleyville', state: 'Texas' },
  4414: { name: 'HighTide', city: 'Ventura', state: 'California' },
  4451: { name: 'ROBOTZ Garage', city: 'Laurens', state: 'South Carolina' },
  4476: { name: 'W.A.F.F.L.E.S.', city: 'Kingston', state: 'Ontario' },
  4488: { name: 'Shockwave', city: 'Hillsboro', state: 'Oregon' },
  4509: { name: 'Mechanical Bulls', city: 'Sugar Hill', state: 'Georgia' },
  4516: { name: 'Hyperion', city: 'Roswell', state: 'Georgia' },
  4533: { name: 'Phoenix', city: 'Mount Pleasant', state: 'South Carolina' },
  4701: { name: 'Warriors (Team W.I.R.E.)', city: 'Savannah', state: 'Georgia' },
  4911: { name: 'CyberKnights', city: 'Seattle', state: 'Washington' },
  5109: { name: 'Gladiator Robotics', city: 'Johns Creek', state: 'Georgia' },
  5130: { name: 'Undercogs', city: 'LIttle River', state: 'South Carolina' },
  5219: { name: 'TeknoSquad 5219', city: 'Douglasville', state: 'Georgia' },
  5293: { name: 'Metal Crusaders', city: 'Duluth', state: 'Georgia' },
  5417: { name: 'Eagle Robotics', city: 'Allen', state: 'Texas' },
  5608: { name: 'Lassiter Robotics', city: 'Marietta', state: 'Georgia' },
  5828: { name: 'Flying Riots', city: 'Albany', state: 'Georgia' },
  5900: { name: 'The Fighting Mongooses', city: 'Dalton', state: 'Georgia' },
  6023: { name: 'DISCBOTS', city: 'Atlanta', state: 'Georgia' },
  6340: { name: 'The Marist Manatees', city: 'Atlanta', state: 'Georgia' },
  6341: { name: 'Firestorm Robotics', city: 'Acworth', state: 'Georgia' },
  6366: { name: 'RAM Rodz Robotics', city: 'Simpsonville', state: 'South Carolina' },
  6705: { name: 'Wildcat5e', city: 'Dunwoody', state: 'Georgia' },
  6712: { name: 'Mountaineers', city: 'Chatsworth', state: 'Georgia' },
  6772: { name: 'The Marist Manta Rays', city: 'Atlanta', state: 'Georgia' },
  6829: { name: 'Ignite Robotics', city: 'Suwanee', state: 'Georgia' },
  6887: { name: 'Dalton Catabots', city: 'Dalton', state: 'Georgia' },
  6905: { name: 'Raiders of the ARC- TEAR-A-BYTE', city: 'Alpharetta', state: 'Georgia' },
  6910: { name: 'Mill Creek Steel Talons', city: 'Hoschton', state: 'Georgia' },
  6919: { name: 'The Commodores', city: 'Albany', state: 'Georgia' },
  6925: { name: 'W.A.Robotics', city: 'College Park', state: 'Georgia' },
  6944: { name: 'Wolverines', city: 'Cumming', state: 'Georgia' },
  7104: { name: 'The Bot Brothers', city: 'Savannah', state: 'Georgia' },
  7451: { name: 'AvengerRobotics', city: 'Cumming', state: 'Georgia' },
  7514: { name: 'EVE Robotics', city: 'Atlanta', state: 'Georgia' },
  7538: { name: 'Metal Mountain', city: 'Lawrenceville', state: 'Georgia' },
  8080: { name: 'Sequoyah High School Robotics', city: 'Canton', state: 'Georgia' },
  8137: { name: 'Byting Bulldogs', city: 'Georgetown', state: 'South Carolina' },
  8515: { name: 'Photon', city: 'Spring', state: 'Texas' },
  8575: { name: 'The Due Westerners', city: 'Due West', state: 'South Carolina' },
  8577: { name: 'Georgia Cyber Academy Champions', city: 'Atlanta', state: 'Georgia' },
  8736: { name: 'The Mechanisms', city: 'Marietta', state: 'Georgia' },
  8761: { name: 'AHS TigerByte8761', city: 'Adairsville', state: 'Georgia' },
  8849: { name: 'Storm Robotics', city: 'Alpharetta', state: 'Georgia' },
  8865: { name: 'Dacula Droids', city: 'Dacula', state: 'Georgia' },
  8866: { name: 'Innovation Robotics', city: 'Alpharetta', state: 'Georgia' },
  9057: { name: 'G.I.R.L.', city: 'Atlanta', state: 'Georgia' },
  9260: { name: 'Built4Bibb Robotics', city: 'Macon', state: 'Georgia' },
  9293: { name: 'Caffeinated', city: 'Marietta', state: 'Georgia' },
  9315: { name: 'Coding Comets', city: 'Columbia', state: 'South Carolina' },
  9477: { name: 'Lambda (λ)', city: 'Suwanee', state: 'Georgia' },
  9480: { name: 'The Gear Bears', city: 'Flowery Branch', state: 'Georgia' },
  9500: { name: 'G28 Robotics', city: 'Atlanta', state: 'Georgia' },
  9522: { name: 'Archimedes', city: 'Flowery Branch', state: 'Georgia' },
  9571: { name: 'Patriot Prime', city: 'Greenville', state: 'South Carolina' },
  9582: { name: 'HHS NASA Snaggbotics', city: 'Conyers', state: 'Georgia' },
  9770: { name: 'Victory Church of Christ Robo Knights', city: 'Atlanta', state: 'Georgia' },
  10482: { name: 'BuzzBots', city: 'Athens', state: 'Georgia' },
  11174: { name: 'Danes Robotics', city: 'Alpharetta', state: 'Georgia' },
  11214: { name: '[CY]BEARCATS robotics', city: 'Bainbridge', state: 'Georgia' },
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
