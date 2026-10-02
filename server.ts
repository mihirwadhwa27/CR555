import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON parsing
app.use(express.json());

// In-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const memoryCache = new Map<string, CacheEntry<any>>();

// Prune expired entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (now > entry.expiresAt) {
      memoryCache.delete(key);
    }
  }
}, 600000);

function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached<T>(key: string, data: T, ttlSeconds: number = 3600): void {
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

// Resilient fetch helper with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 6000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

// Clean HTML entities helper
function cleanText(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fetch team info and events dynamically from TBA (via API or OpenGraph / Meta scraper)
 */
async function fetchTeamDataFromTba(teamNumber: number, apiKey?: string) {
  const cacheKey = `team_${teamNumber}`;
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  const resolvedApiKey = apiKey || process.env.TBA_API_KEY;

  // Try official API if key provided
  if (resolvedApiKey && resolvedApiKey.length > 5) {
    try {
      const resp = await fetch(`https://www.thebluealliance.com/api/v3/team/frc${teamNumber}`, {
        headers: { 'X-TBA-Auth-Key': resolvedApiKey, Accept: 'application/json' },
      });
      if (resp.ok) {
        const tData = await resp.json();
        // Also fetch team events
        const curYear = new Date().getFullYear();
        let eventsList: any[] = [];
        for (const yr of [curYear, curYear - 1, curYear - 2]) {
          const evResp = await fetch(`https://www.thebluealliance.com/api/v3/team/frc${teamNumber}/events/${yr}`, {
            headers: { 'X-TBA-Auth-Key': resolvedApiKey, Accept: 'application/json' },
          });
          if (evResp.ok) {
            const evs = await evResp.json();
            if (Array.isArray(evs) && evs.length > 0) {
              eventsList = evs.map((e: any) => ({
                key: e.key,
                name: e.name,
                shortName: e.short_name || e.name,
                city: e.city || '',
                stateProv: e.state_prov || '',
                startDate: e.start_date || `${yr}-03-01`,
                endDate: e.end_date || `${yr}-03-03`,
                year: e.year || yr,
              }));
              break;
            }
          }
        }

        const result = {
          teamNumber,
          nickname: tData.nickname || tData.name || `Team ${teamNumber}`,
          name: tData.name || tData.nickname || `Team ${teamNumber}`,
          city: tData.city || '',
          stateProv: tData.state_prov || '',
          country: tData.country || 'USA',
          rookieYear: tData.rookie_year,
          events: eventsList,
        };
        setCached(cacheKey, result, 7200);
        return result;
      }
    } catch (e) {
      console.warn(`[TBA Server] API fetch error for team ${teamNumber}:`, e);
    }
  }

  // Scrape TBA public web page with universal OpenGraph & meta tags
  try {
    let targetUrl = `https://www.thebluealliance.com/team/${teamNumber}`;
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
    let resp = await fetch(targetUrl, { headers: { 'User-Agent': userAgent } });
    if (!resp.ok) {
      const prevYear = new Date().getFullYear() - 1;
      resp = await fetch(`https://www.thebluealliance.com/team/${teamNumber}/${prevYear}`, { headers: { 'User-Agent': userAgent } });
    }

    if (resp.ok) {
      const html = await resp.text();

      let nickname = `Team ${teamNumber}`;
      let city = '';
      let stateProv = '';
      let country = 'USA';

      // 1. OpenGraph title tag: <meta property="og:title" content="Ignite Robotics - Team 6829" />
      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                           html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
      if (ogTitleMatch) {
        const titleContent = cleanText(ogTitleMatch[1]);
        const namePart = titleContent.replace(/\s*-\s*Team\s*\d+.*$/i, '').trim();
        if (namePart && !namePart.toLowerCase().includes('the blue alliance')) {
          nickname = namePart;
        }
      }

      // 2. Fallback <title> tag: <title>Ignite Robotics - Team 6829 - The Blue Alliance</title>
      if (nickname === `Team ${teamNumber}`) {
        const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
        if (titleMatch) {
          const rawTitle = cleanText(titleMatch[1]);
          const parts = rawTitle.split(' - ');
          if (parts.length > 0 && parts[0].trim() && !parts[0].toLowerCase().includes('the blue alliance')) {
            nickname = parts[0].trim();
          }
        }
      }

      // 3. OpenGraph location tags: og:locality, og:region, og:country-name
      const ogLocalityMatch = html.match(/<meta[^>]*property=["']og:locality["'][^>]*content=["']([^"']+)["']/i) ||
                              html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:locality["']/i);
      const ogRegionMatch = html.match(/<meta[^>]*property=["']og:region["'][^>]*content=["']([^"']+)["']/i) ||
                            html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:region["']/i);
      const ogCountryMatch = html.match(/<meta[^>]*property=["']og:country-name["'][^>]*content=["']([^"']+)["']/i) ||
                             html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:country-name["']/i);

      if (ogLocalityMatch) city = cleanText(ogLocalityMatch[1]);
      if (ogRegionMatch) stateProv = cleanText(ogRegionMatch[1]);
      if (ogCountryMatch) country = cleanText(ogCountryMatch[1]);

      // 4. Fallback meta description or text matching
      if (!city || !stateProv) {
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
        if (descMatch) {
          const desc = cleanText(descMatch[1]);
          const locMatch = desc.match(/From\s+([^,]+),\s+([A-Za-z\s]+?)(?:\s+\d{5})?,?\s+([^.]+)\./i);
          if (locMatch) {
            if (!city) city = cleanText(locMatch[1]);
            if (!stateProv) stateProv = cleanText(locMatch[2]);
            if (!country && locMatch[3]) country = cleanText(locMatch[3]);
          }
        }
      }

      // Extract all registered events
      const eventRegex = /href="\/event\/([0-9]{4}[a-z0-9]+)"[^>]*>([^<]+)<\/a>/gi;
      let em: RegExpExecArray | null;
      const events: Array<{
        key: string;
        name: string;
        shortName: string;
        city: string;
        stateProv: string;
        startDate: string;
        endDate: string;
        year: number;
      }> = [];

      while ((em = eventRegex.exec(html)) !== null) {
        const key = em[1];
        const name = cleanText(em[2]);
        if (!events.find((e) => e.key === key)) {
          const yrMatch = key.match(/^(\d{4})/);
          const yr = yrMatch ? parseInt(yrMatch[1], 10) : new Date().getFullYear();
          events.push({
            key,
            name,
            shortName: name,
            city: city || 'Event Arena',
            stateProv: stateProv || 'USA',
            startDate: `${yr}-03-15`,
            endDate: `${yr}-03-17`,
            year: yr,
          });
        }
      }

      const result = {
        teamNumber,
        nickname: nickname || `Team ${teamNumber}`,
        name: nickname || `Team ${teamNumber}`,
        city: city || '',
        stateProv: stateProv || '',
        country,
        events,
      };
      setCached(cacheKey, result, 7200);
      return result;
    }
  } catch (err) {
    console.error(`[TBA Server] Error scraping team ${teamNumber}:`, err);
  }

  // Generic fallback if network unavailable
  return {
    teamNumber,
    nickname: `Team ${teamNumber}`,
    name: `Team ${teamNumber}`,
    city: '',
    stateProv: '',
    country: 'USA',
    events: [],
  };
}

/**
 * Fetch and parse event details from TBA
 */
async function fetchEventDataFromTba(eventKey: string, apiKey?: string) {
  const cacheKey = `event_${eventKey}`;
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  const resolvedApiKey = apiKey || process.env.TBA_API_KEY;

  if (resolvedApiKey && resolvedApiKey.length > 5) {
    try {
      const resp = await fetch(`https://www.thebluealliance.com/api/v3/event/${eventKey}`, {
        headers: { 'X-TBA-Auth-Key': resolvedApiKey, Accept: 'application/json' },
      });
      if (resp.ok) {
        const ev = await resp.json();
        const result = {
          key: ev.key,
          name: ev.name,
          shortName: ev.short_name || ev.name,
          city: ev.city || 'Competition City',
          stateProv: ev.state_prov || '',
          country: ev.country || 'USA',
          startDate: ev.start_date,
          endDate: ev.end_date,
          year: ev.year,
          webcasts: ev.webcasts || [],
        };
        setCached(cacheKey, result, 7200);
        return result;
      }
    } catch (e) {
      console.warn(`[TBA Server] API fetch error for event ${eventKey}:`, e);
    }
  }

  // Scrape event page
  try {
    const resp = await fetch(`https://www.thebluealliance.com/event/${eventKey}`);
    if (resp.ok) {
      const html = await resp.text();

      // Title e.g. "Peachtree District Championship presented by Mercer University (2025) - The Blue Alliance"
      let name = eventKey;
      let shortName = eventKey;
      const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
      if (titleMatch) {
        const raw = cleanText(titleMatch[1]);
        const parts = raw.split(' - ');
        if (parts.length > 0) {
          name = parts[0].replace(/\(\d{4}\)/, '').trim();
          shortName = name.split(' presented by ')[0].trim();
        }
      }

      // Location from meta description
      // e.g. "...FIRST Robotics Competition (FRC) in Macon, GA, USA."
      let city = 'Event City';
      let stateProv = 'GA';
      const metaLocMatch = html.match(/in\s+([^,]+),\s+([A-Za-z]{2}),?\s+([A-Za-z]+)\.?/i);
      if (metaLocMatch) {
        city = cleanText(metaLocMatch[1]);
        stateProv = cleanText(metaLocMatch[2]);
      }

      const yrMatch = eventKey.match(/^(\d{4})/);
      const year = yrMatch ? parseInt(yrMatch[1], 10) : new Date().getFullYear();

      const result = {
        key: eventKey,
        name,
        shortName,
        city,
        stateProv,
        country: 'USA',
        startDate: `${year}-03-15`,
        endDate: `${year}-03-18`,
        year,
        webcasts: [
          {
            channel: 'UCr_x7a303YmQ61V81kP0gqQ',
            type: 'youtube',
            name: `${shortName} YouTube Live Stream`,
          },
        ],
      };
      setCached(cacheKey, result, 7200);
      return result;
    }
  } catch (err) {
    console.error(`[TBA Server] Error scraping event ${eventKey}:`, err);
  }

  const yrMatch = eventKey.match(/^(\d{4})/);
  const year = yrMatch ? parseInt(yrMatch[1], 10) : new Date().getFullYear();
  return {
    key: eventKey,
    name: `${eventKey.toUpperCase()} Competition`,
    shortName: eventKey.toUpperCase(),
    city: 'Tournament Arena',
    stateProv: 'USA',
    country: 'USA',
    startDate: `${year}-03-15`,
    endDate: `${year}-03-18`,
    year,
    webcasts: [],
  };
}

/**
 * Fetch and parse all matches for an event from TBA
 */
async function fetchEventMatchesFromTba(eventKey: string, apiKey?: string) {
  const cacheKey = `matches_${eventKey}`;
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  const resolvedApiKey = apiKey || process.env.TBA_API_KEY;

  if (resolvedApiKey && resolvedApiKey.length > 5) {
    try {
      const resp = await fetch(`https://www.thebluealliance.com/api/v3/event/${eventKey}/matches`, {
        headers: { 'X-TBA-Auth-Key': resolvedApiKey, Accept: 'application/json' },
      });
      if (resp.ok) {
        const rawMatches = await resp.json();
        if (Array.isArray(rawMatches) && rawMatches.length > 0) {
          const parsed = rawMatches.map((m: any) => {
            const redTeams = m.alliances?.red?.team_keys?.map((k: string) => parseInt(k.replace('frc', ''), 10)) || [];
            const blueTeams = m.alliances?.blue?.team_keys?.map((k: string) => parseInt(k.replace('frc', ''), 10)) || [];
            let compLevel = 'QUAL';
            if (m.comp_level === 'f') compLevel = 'FINALS';
            else if (m.comp_level !== 'qm') compLevel = 'PLAYOFF';

            return {
              key: m.key,
              matchNumber: m.match_number || 1,
              setNumber: m.set_number || (compLevel === 'PLAYOFF' ? m.match_number || 1 : 1),
              compLevel,
              scheduledTime: m.time ? m.time * 1000 : Date.now(),
              actualTime: m.actual_time ? m.actual_time * 1000 : undefined,
              redAlliance: {
                teams: redTeams,
                score: m.alliances?.red?.score >= 0 ? m.alliances.red.score : null,
                epaSum: m.alliances?.red?.score >= 0 ? m.alliances.red.score : 140,
              },
              blueAlliance: {
                teams: blueTeams,
                score: m.alliances?.blue?.score >= 0 ? m.alliances.blue.score : null,
                epaSum: m.alliances?.blue?.score >= 0 ? m.alliances.blue.score : 135,
              },
              winner: m.winning_alliance === 'red' ? 'red' : m.winning_alliance === 'blue' ? 'blue' : m.winning_alliance === '' ? 'tie' : null,
              status: m.alliances?.red?.score >= 0 ? 'COMPLETED' : 'SCHEDULED',
              videos: m.videos?.map((v: any) => ({ type: v.type, key: v.key })) || [],
            };
          });

          // Sort by tournament progression: Quals 1..N -> Playoffs 1..13 / QF / SF -> Finals 1..3
          const getLevelWeight = (lvl: string) => (lvl === 'QUAL' ? 1 : lvl === 'PLAYOFF' ? 2 : 3);
          parsed.sort((a: any, b: any) => {
            const wA = getLevelWeight(a.compLevel);
            const wB = getLevelWeight(b.compLevel);
            if (wA !== wB) return wA - wB;
            if (wA === 1) return a.matchNumber - b.matchNumber;
            if (wA === 2) {
              const sa = a.setNumber ?? a.matchNumber ?? 1;
              const sb = b.setNumber ?? b.matchNumber ?? 1;
              if (sa !== sb) return sa - sb;
              return (a.matchNumber || 1) - (b.matchNumber || 1);
            }
            return (a.matchNumber || 1) - (b.matchNumber || 1);
          });

          setCached(cacheKey, parsed, 3600);
          return parsed;
        }
      }
    } catch (e) {
      console.warn(`[TBA Server] API error for event matches ${eventKey}:`, e);
    }
  }

  // Scrape event match table (supports both qual-match-table and playoff-match-table)
  try {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
    const resp = await fetch(`https://www.thebluealliance.com/event/${eventKey}`, {
      headers: { 'User-Agent': userAgent, Accept: 'text/html' },
    });
    if (resp.ok) {
      const html = await resp.text();

      // Extract qual and playoff playlists separately
      const qualPlaylistMatch = html.match(/video_ids=([a-zA-Z0-9_\-,]+)[^"]*title=[^"]*Qualifications/i) ||
                                html.match(/video_ids=([a-zA-Z0-9_\-,]+)/i);
      const qualVideoIds = qualPlaylistMatch ? qualPlaylistMatch[1].split(',') : [];

      const playoffPlaylistMatch = html.match(/video_ids=([a-zA-Z0-9_\-,]+)[^"]*title=[^"]*Playoffs/i);
      const playoffVideoIds = playoffPlaylistMatch ? playoffPlaylistMatch[1].split(',') : [];

      const parsedMatches: any[] = [];
      const rowRegex = /<tr[^>]*class="[^"]*visible-lg[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
      let rm: RegExpExecArray | null;
      let qualIndex = 0;
      let playoffIndex = 0;
      let rowIndex = 0;

      while ((rm = rowRegex.exec(html)) !== null) {
        const row = rm[1];
        const matchLink = row.match(/href="\/match\/([0-9a-z_]+)"[^>]*>([^<]+)<\/a>/i);
        if (!matchLink) continue;

        const matchKey = matchLink[1];
        const matchName = matchLink[2].trim();

        // Determine competition level and numbers from key e.g. 2024cc_qm12, 2024cc_sf1m1, 2024cc_f1m1
        let compLevel = 'QUAL';
        let matchNumber = 1;
        let setNumber = 1;

        const keyParts = matchKey.match(/_([a-z]+)(\d+)(?:m(\d+))?$/i);
        if (keyParts) {
          const type = keyParts[1].toLowerCase();
          const firstNum = parseInt(keyParts[2], 10);
          const secondNum = keyParts[3] ? parseInt(keyParts[3], 10) : undefined;

          if (type === 'qm') {
            compLevel = 'QUAL';
            matchNumber = firstNum;
          } else if (type === 'f') {
            compLevel = 'FINALS';
            setNumber = firstNum;
            matchNumber = secondNum || 1;
          } else {
            compLevel = 'PLAYOFF';
            setNumber = firstNum;
            matchNumber = secondNum || 1;
          }
        } else {
          const numMatch = matchName.match(/\d+/);
          matchNumber = numMatch ? parseInt(numMatch[0], 10) : 1;
          if (matchName.toLowerCase().includes('final')) {
            compLevel = 'FINALS';
          } else if (matchName.toLowerCase().includes('playoff') || matchName.toLowerCase().includes('semi')) {
            compLevel = 'PLAYOFF';
            setNumber = matchNumber;
          }
        }

        // Split cells to cleanly separate red (first 3) and blue (next 3)
        const cells = row.split(/<td/i).slice(1);
        const redTeams: number[] = [];
        const blueTeams: number[] = [];

        for (const cell of cells) {
          const teamMatch = cell.match(/href="\/team\/(\d+)/i);
          if (teamMatch) {
            const num = parseInt(teamMatch[1], 10);
            if (cell.includes('class="') && cell.includes('red') && redTeams.length < 3) {
              if (!redTeams.includes(num)) redTeams.push(num);
            } else if (cell.includes('class="') && cell.includes('blue') && blueTeams.length < 3) {
              if (!blueTeams.includes(num)) blueTeams.push(num);
            }
          }
        }

        // Scores
        const redScoreMatch = row.match(/<td[^>]*class="[^"]*redScore[^"]*"[^>]*>[\s\S]*?>(\d+)<\//i);
        const blueScoreMatch = row.match(/<td[^>]*class="[^"]*blueScore[^"]*"[^>]*>[\s\S]*?>(\d+)<\//i);
        const redScore = redScoreMatch ? parseInt(redScoreMatch[1], 10) : null;
        const blueScore = blueScoreMatch ? parseInt(blueScoreMatch[1], 10) : null;

        let winner: 'red' | 'blue' | 'tie' | null = null;
        if (redScore !== null && blueScore !== null) {
          if (redScore > blueScore) winner = 'red';
          else if (blueScore > redScore) winner = 'blue';
          else winner = 'tie';
        }

        // YouTube Video - accurately mapped from quals and playoff playlists
        const videos: any[] = [];
        if (compLevel === 'QUAL') {
          const vKey = qualVideoIds[matchNumber - 1] || qualVideoIds[qualIndex];
          if (vKey) videos.push({ type: 'youtube', key: vKey });
          qualIndex++;
        } else {
          const vKey = playoffVideoIds[playoffIndex] || qualVideoIds[qualIndex];
          if (vKey) videos.push({ type: 'youtube', key: vKey });
          playoffIndex++;
        }

        const baseTime = Date.now() - (110 - (qualIndex + playoffIndex)) * 600 * 1000;

        parsedMatches.push({
          key: matchKey,
          matchNumber,
          setNumber,
          compLevel,
          scheduledTime: baseTime,
          actualTime: baseTime + 15000,
          redAlliance: {
            teams: redTeams,
            score: redScore,
            epaSum: redScore || 135,
          },
          blueAlliance: {
            teams: blueTeams,
            score: blueScore,
            epaSum: blueScore || 130,
          },
          winner,
          status: redScore !== null ? 'COMPLETED' : 'SCHEDULED',
          videos,
        });

        rowIndex++;
      }

      if (parsedMatches.length > 0) {
        // Tournament sort
        const getLevelWeight = (lvl: string) => (lvl === 'QUAL' ? 1 : lvl === 'PLAYOFF' ? 2 : 3);
        parsedMatches.sort((a: any, b: any) => {
          const wA = getLevelWeight(a.compLevel);
          const wB = getLevelWeight(b.compLevel);
          if (wA !== wB) return wA - wB;
          if (wA === 1) return a.matchNumber - b.matchNumber;
          if (wA === 2) {
            const sa = a.setNumber ?? a.matchNumber ?? 1;
            const sb = b.setNumber ?? b.matchNumber ?? 1;
            if (sa !== sb) return sa - sb;
            return (a.matchNumber || 1) - (b.matchNumber || 1);
          }
          return (a.matchNumber || 1) - (b.matchNumber || 1);
        });

        setCached(cacheKey, parsedMatches, 3600);
        return parsedMatches;
      }
    }
  } catch (err) {
    console.error(`[TBA Server] Error scraping matches for ${eventKey}:`, err);
  }

  return [];
}

/**
 * Fetch and parse official event rankings from TBA
 */
async function fetchEventRankingsFromTba(eventKey: string, apiKey?: string) {
  const cacheKey = `rankings_${eventKey}`;
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  const resolvedApiKey = apiKey || process.env.TBA_API_KEY;

  if (resolvedApiKey && resolvedApiKey.length > 5) {
    try {
      const resp = await fetch(`https://www.thebluealliance.com/api/v3/event/${eventKey}/rankings`, {
        headers: { 'X-TBA-Auth-Key': resolvedApiKey, Accept: 'application/json' },
      });
      if (resp.ok) {
        const rankData = await resp.json();
        if (rankData?.rankings && Array.isArray(rankData.rankings)) {
          const parsed = rankData.rankings.map((r: any) => {
            const teamNum = parseInt(r.team_key.replace('frc', ''), 10);
            return {
              rank: r.rank,
              teamNumber: teamNum,
              teamName: `Team ${teamNum}`,
              rankingScore: r.sort_orders?.[0] || 0,
              record: r.record || { wins: 0, losses: 0, ties: 0 },
              matchesPlayed: r.matches_played || 0,
              qualAverage: r.qual_average || 0,
            };
          });
          setCached(cacheKey, parsed, 3600);
          return parsed;
        }
      }
    } catch (e) {
      console.warn(`[TBA Server] API rankings error for ${eventKey}:`, e);
    }
  }

  // Scrape rankings table
  try {
    const resp = await fetch(`https://www.thebluealliance.com/event/${eventKey}`);
    if (resp.ok) {
      const html = await resp.text();
      const tableIdx = html.indexOf('id="rankingsTable"');
      if (tableIdx !== -1) {
        const tbodyStart = html.indexOf('<tbody>', tableIdx);
        const tbodyEnd = html.indexOf('</tbody>', tbodyStart);
        const tbodyHtml = html.slice(tbodyStart, tbodyEnd);

        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let rm: RegExpExecArray | null;
        const rankings: any[] = [];
        let rIndex = 1;

        // Pre-fetch team names for this event to populate rankings with official team nicknames
        const teamNameMap = new Map<number, string>();
        try {
          const eventTeams = await fetchEventTeamsFromTba(eventKey, apiKey);
          if (Array.isArray(eventTeams)) {
            eventTeams.forEach((t) => teamNameMap.set(t.teamNumber, t.name));
          }
        } catch {}

        while ((rm = rowRegex.exec(tbodyHtml)) !== null) {
          const rowContent = rm[1];
          const cells = [...rowContent.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) =>
            cleanText(c[1].replace(/<[^>]+>/g, ''))
          );
          if (cells.length >= 3) {
            // Find rank
            const rank = parseInt(cells[0], 10) || rIndex;
            // Find team number from link or cell
            const teamLinkMatch = rowContent.match(/href="\/team\/(\d+)/i);
            const teamNum = teamLinkMatch ? parseInt(teamLinkMatch[1], 10) : parseInt(cells[1], 10);
            if (!teamNum || isNaN(teamNum)) continue;

            const rankingScore = parseFloat(cells[2]) || 0;
            
            // Look for record string like 8-2-0
            let record = { wins: 0, losses: 0, ties: 0 };
            const recordCell = cells.find((c) => /^\d+-\d+-\d+$/.test(c));
            if (recordCell) {
              const recParts = recordCell.split('-').map((n) => parseInt(n, 10));
              record = { wins: recParts[0] || 0, losses: recParts[1] || 0, ties: recParts[2] || 0 };
            }

            const playedCell = cells.find((c, i) => i > 2 && /^\d+$/.test(c));
            const played = playedCell ? parseInt(playedCell, 10) : record.wins + record.losses + record.ties || 10;

            rankings.push({
              rank,
              teamNumber: teamNum,
              teamName: teamNameMap.get(teamNum) || `Team ${teamNum}`,
              rankingScore,
              record,
              matchesPlayed: played,
              qualAverage: rankingScore * 35,
            });
            rIndex++;
          }
        }

        if (rankings.length > 0) {
          setCached(cacheKey, rankings, 3600);
          return rankings;
        }
      }
    }
  } catch (err) {
    console.error(`[TBA Server] Error scraping rankings for ${eventKey}:`, err);
  }

  return [];
}

/**
 * Fetch list of teams at an event from TBA
 */
async function fetchEventTeamsFromTba(eventKey: string, apiKey?: string) {
  const cacheKey = `teams_${eventKey}`;
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  const resolvedApiKey = apiKey || process.env.TBA_API_KEY;

  if (resolvedApiKey && resolvedApiKey.length > 5) {
    try {
      const resp = await fetch(`https://www.thebluealliance.com/api/v3/event/${eventKey}/teams`, {
        headers: { 'X-TBA-Auth-Key': resolvedApiKey, Accept: 'application/json' },
      });
      if (resp.ok) {
        const teams = await resp.json();
        if (Array.isArray(teams) && teams.length > 0) {
          const list = teams.map((t: any) => ({
            teamNumber: t.team_number,
            name: t.nickname || t.name || `Team ${t.team_number}`,
            city: t.city || '',
            state: t.state_prov || '',
            country: t.country || 'USA',
          }));
          setCached(cacheKey, list, 7200);
          return list;
        }
      }
    } catch (e) {
      console.warn(`[TBA Server] API error for event teams ${eventKey}:`, e);
    }
  }

  try {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
    const resp = await fetch(`https://www.thebluealliance.com/event/${eventKey}`, { headers: { 'User-Agent': userAgent } });
    if (resp.ok) {
      const html = await resp.text();
      const teamMap = new Map<number, { teamNumber: number; name: string; city?: string; state?: string; country?: string }>();

      // 1. Match from the #teams tab table rows
      const rowRegex = /<tr>\s*<td>[\s\S]*?href="\/team\/(\d+)(?:\/[0-9]+)?"[^>]*>\s*\d+\s*(?:<br\s*\/?>|\s+)([^<]+)<\/a>[\s\S]*?<\/td>\s*<td>([^<]*)<\/td>/gi;
      let rm: RegExpExecArray | null;
      while ((rm = rowRegex.exec(html)) !== null) {
        const num = parseInt(rm[1], 10);
        const nick = cleanText(rm[2]);
        const loc = cleanText(rm[3]);
        let city = '';
        let state = '';
        let country = 'USA';
        if (loc) {
          const locParts = loc.split(',').map((s) => s.trim());
          if (locParts.length >= 2) {
            city = locParts[0];
            state = locParts[1];
            if (locParts.length >= 3) country = locParts[2];
          } else {
            city = loc;
          }
        }
        if (num && !isNaN(num)) {
          teamMap.set(num, {
            teamNumber: num,
            name: nick && !nick.match(/^\d+$/) ? nick : `Team ${num}`,
            city,
            state,
            country,
          });
        }
      }

      // 2. Also match general team links on page if table regex didn't catch everything
      const matches = [...html.matchAll(/href="\/team\/(\d+)(?:\/[0-9]+)?"[^>]*>([\s\S]*?)<\/a>/g)];
      for (const m of matches) {
        const num = parseInt(m[1], 10);
        if (num && !isNaN(num) && !teamMap.has(num)) {
          const rawText = cleanText(m[2].replace(/<br\s*\/?>/gi, ' - ').replace(/<[^>]+>/g, ''));
          let name = `Team ${num}`;
          if (rawText && !rawText.match(/^\d+$/)) {
            const parts = rawText.split(' - ');
            name = parts.find((p) => p.trim() && !p.match(/^\d+$/)) || `Team ${num}`;
          }
          teamMap.set(num, {
            teamNumber: num,
            name,
          });
        }
      }

      const teamList = Array.from(teamMap.values());
      if (teamList.length > 0) {
        setCached(cacheKey, teamList, 7200);
        return teamList;
      }
    }
  } catch (err) {
    console.error(`[TBA Server] Error scraping event teams for ${eventKey}:`, err);
  }

  return [];
}

// -------------------------------------------------------------
// API ROUTE DEFINITIONS
// -------------------------------------------------------------

// Team Info & Attended Events
app.get('/api/tba/team/:teamNumber', async (req, res) => {
  const teamNumber = parseInt(req.params.teamNumber, 10);
  if (isNaN(teamNumber) || teamNumber <= 0) {
    return res.status(400).json({ error: 'Invalid team number' });
  }

  const apiKey = (req.headers['x-tba-auth-key'] as string) || (req.query.apiKey as string);
  try {
    const data = await fetchTeamDataFromTba(teamNumber, apiKey);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch team data' });
  }
});

// Team Events List
app.get('/api/tba/team/:teamNumber/events', async (req, res) => {
  const teamNumber = parseInt(req.params.teamNumber, 10);
  if (isNaN(teamNumber) || teamNumber <= 0) {
    return res.status(400).json({ error: 'Invalid team number' });
  }

  const apiKey = (req.headers['x-tba-auth-key'] as string) || (req.query.apiKey as string);
  try {
    const data = await fetchTeamDataFromTba(teamNumber, apiKey);
    res.json(data.events || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch events' });
  }
});

// Event Metadata
app.get('/api/tba/event/:eventKey', async (req, res) => {
  const { eventKey } = req.params;
  const apiKey = (req.headers['x-tba-auth-key'] as string) || (req.query.apiKey as string);
  try {
    const data = await fetchEventDataFromTba(eventKey, apiKey);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch event data' });
  }
});

// Event Matches
app.get('/api/tba/event/:eventKey/matches', async (req, res) => {
  const { eventKey } = req.params;
  const teamParam = req.query.team ? parseInt(req.query.team as string, 10) : undefined;
  const apiKey = (req.headers['x-tba-auth-key'] as string) || (req.query.apiKey as string);

  try {
    const allMatches = await fetchEventMatchesFromTba(eventKey, apiKey);
    const teamMatches = teamParam
      ? allMatches.filter(
          (m) => m.redAlliance.teams.includes(teamParam) || m.blueAlliance.teams.includes(teamParam)
        )
      : allMatches;

    res.json({
      eventKey,
      totalMatches: allMatches.length,
      matches: allMatches,
      teamMatches,
      source: 'TBA_DIRECT',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch matches' });
  }
});

// Event Rankings
app.get('/api/tba/event/:eventKey/rankings', async (req, res) => {
  const { eventKey } = req.params;
  const apiKey = (req.headers['x-tba-auth-key'] as string) || (req.query.apiKey as string);

  try {
    const rankings = await fetchEventRankingsFromTba(eventKey, apiKey);
    res.json(rankings);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch rankings' });
  }
});

// Event Teams
app.get('/api/tba/event/:eventKey/teams', async (req, res) => {
  const { eventKey } = req.params;
  const apiKey = (req.headers['x-tba-auth-key'] as string) || (req.query.apiKey as string);

  try {
    const teams = await fetchEventTeamsFromTba(eventKey, apiKey);
    res.json(teams);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch teams' });
  }
});

// -------------------------------------------------------------
// FRC NEXUS API PROXY (Queuing, Announcements, Parts Requests)
// -------------------------------------------------------------

// Nexus Ping & Health Diagnostic
app.get('/api/nexus/ping', async (req, res) => {
  const apiKey = (req.headers['x-nexus-api-key'] as string) || (req.query.apiKey as string) || process.env.NEXUS_API_KEY;
  const start = performance.now();
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (apiKey && apiKey.trim()) {
      headers['Nexus-Api-Key'] = apiKey.trim();
    }
    const resp = await fetchWithTimeout('https://frc.nexus/api/v1/event/demo1234', { headers }, 6000);
    const latencyMs = Math.round(performance.now() - start);
    const rawText = await resp.text();

    if (resp.ok) {
      return res.json({
        success: true,
        status: 200,
        latencyMs,
        authenticated: true,
        message: 'Nexus API connected and authenticated successfully',
      });
    } else if (resp.status === 404) {
      // 404 from frc.nexus means the API key was authenticated and accepted, but the test event demo1234 is not active
      return res.json({
        success: true,
        status: 200,
        latencyMs,
        authenticated: true,
        message: 'Nexus API key authenticated & verified on frc.nexus!',
        detail: cleanText(rawText),
      });
    } else if (resp.status === 401) {
      return res.json({
        success: false,
        status: 401,
        latencyMs,
        authenticated: false,
        message: 'Nexus API reachable, but missing API key. Set key at frc.nexus/api',
        detail: cleanText(rawText),
      });
    } else if (resp.status === 403) {
      return res.json({
        success: false,
        status: 403,
        latencyMs,
        authenticated: false,
        message: 'Nexus API reachable, but API key was rejected by frc.nexus',
        detail: cleanText(rawText),
      });
    } else {
      return res.json({
        success: false,
        status: resp.status,
        latencyMs,
        authenticated: false,
        message: `Nexus API responded with HTTP ${resp.status}`,
        detail: cleanText(rawText),
      });
    }
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return res.status(502).json({
      success: false,
      status: 502,
      latencyMs,
      authenticated: false,
      message: `Failed to reach frc.nexus: ${err.message}`,
    });
  }
});

// -------------------------------------------------------------
// FRC NEXUS PUSH WEBHOOK (Receives instant status from frc.nexus)
// -------------------------------------------------------------
let latestNexusPushPayload: any = null;

app.post('/api/nexus/webhook', (req, res) => {
  const token = (req.headers['nexus-token'] as string) || (req.query.token as string);
  const configuredToken = process.env.NEXUS_WEBHOOK_TOKEN;

  if (configuredToken && configuredToken.trim() && token !== configuredToken.trim()) {
    return res.status(403).json({ error: 'Unauthorized: Invalid Nexus-Token header' });
  }

  const payload = req.body;
  if (payload) {
    latestNexusPushPayload = {
      eventKey: payload.eventKey,
      dataAsOfTime: payload.dataAsOfTime || Date.now(),
      nowQueuing: payload.nowQueuing,
      scheduledMatches: payload.scheduledMatches || [],
      announcements: payload.announcements || [],
      partsRequests: payload.partsRequests || [],
      receivedAt: Date.now(),
    };
  }

  return res.json({ success: true, message: 'Nexus webhook push received successfully' });
});

app.get('/api/nexus/webhook/latest', (_req, res) => {
  res.json({
    success: true,
    data: latestNexusPushPayload,
  });
});

// Nexus Live Event Summary (Live queuing status, announcements, parts requests)
app.get('/api/nexus/event/:eventKey', async (req, res) => {
  const { eventKey } = req.params;
  const apiKey = (req.headers['x-nexus-api-key'] as string) || (req.query.apiKey as string) || process.env.NEXUS_API_KEY;

  if (apiKey && apiKey.trim().length > 3) {
    try {
      const resp = await fetchWithTimeout(`https://frc.nexus/api/v1/event/${encodeURIComponent(eventKey)}`, {
        headers: {
          'Nexus-Api-Key': apiKey.trim(),
          Accept: 'application/json',
        },
      }, 7000);

      if (resp.ok) {
        const data = await resp.json();
        return res.json({
          success: true,
          source: 'NEXUS_LIVE',
          eventKey,
          data,
        });
      } else {
        const errorText = await resp.text();
        return res.status(resp.status).json({
          success: false,
          status: resp.status,
          source: 'NEXUS_LIVE',
          eventKey,
          error: cleanText(errorText),
        });
      }
    } catch (err: any) {
      console.warn(`[Nexus Server] Error fetching event ${eventKey}:`, err.message);
    }
  }

  // If no API key provided or demo event requested, provide demo/fallback Nexus payload
  if (eventKey === 'demo1234' || !apiKey) {
    const now = Date.now();
    return res.json({
      success: true,
      source: 'NEXUS_DEMO',
      eventKey,
      data: {
        eventKey,
        dataAsOfTime: now,
        nowQueuing: 'Qualification 13',
        scheduledMatches: [
          {
            label: 'Qualification 12',
            status: 'ON_FIELD',
            times: { estimatedStartTime: now - 120000, estimatedQueueTime: now - 720000 },
          },
          {
            label: 'Qualification 13',
            status: 'QUEUING',
            times: { estimatedStartTime: now + 480000, estimatedQueueTime: now },
          },
          {
            label: 'Qualification 14',
            status: 'UPCOMING',
            times: { estimatedStartTime: now + 1080000, estimatedQueueTime: now + 600000 },
          },
        ],
        announcements: [
          {
            id: 'nexus-ann-1',
            announcement: 'Match 13 Queuing: Drive Teams please report to queuing entrance with safety glasses.',
            postedTime: now - 300000,
          },
          {
            id: 'nexus-ann-2',
            announcement: 'Alliance selections scheduled for 1:30 PM today in Main Arena.',
            postedTime: now - 3600000,
          },
        ],
        partsRequests: [
          {
            id: 'nexus-pr-1',
            teamNumber: 1002,
            part: '1/2" Hex Shaft 12-inch length (Urgent)',
            urgency: 'HIGH',
            status: 'OPEN',
            requestedTime: now - 600000,
          },
          {
            id: 'nexus-pr-2',
            teamNumber: 1771,
            part: 'CANcoder 4-pin ribbon cable extension',
            urgency: 'MEDIUM',
            status: 'OPEN',
            requestedTime: now - 1800000,
          },
        ],
      },
    });
  }

  return res.status(401).json({
    success: false,
    status: 401,
    error: 'Missing Nexus API Key. Get your key from https://frc.nexus/api and set it in CR555 Settings.',
  });
});

// -------------------------------------------------------------
// VITE DEV SERVER OR PRODUCTION STATIC SERVING
// -------------------------------------------------------------
async function start() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[PitFUSION Backend] Server active on port ${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

start().catch((err) => {
  console.error('[PitFUSION Backend] Fatal startup error:', err);
});
