/**
 * PitFUSION 2.0 - Competition Simulation & Quality Control Engine
 * Team 1002 CircuitRunners Robotics
 *
 * Provides comprehensive multi-pass quality control assertions,
 * full competition simulation synchronization, and real-time state verification
 * across diverse and randomized FRC teams.
 */

import {
  ApplicationState,
  MatchModel,
  RankingModel,
  TeamEPAModel,
  QueueStateModel,
  PlayoffStateModel,
  PlayoffAlliance,
  PlayoffMatchResult,
} from '../types';
import { pitStore, Actions, Selectors } from '../store';
import { TbaService, StatboticsService } from '../services';
import { getTeamMetadata, FRC_TEAM_DIRECTORY } from '../utils/teamLookup';
import { sortTournamentMatches } from '../utils/matchUtils';

export interface QualityControlCheckResult {
  id: string;
  name: string;
  category:
    | 'IDENTITY'
    | 'SCHEDULE'
    | 'SCORES'
    | 'QUEUING'
    | 'RANKINGS'
    | 'EPA'
    | 'PLAYOFFS'
    | 'REPLAY'
    | 'OPERATIONS'
    | 'TELEMETRY';
  passed: boolean;
  message: string;
  details?: Record<string, any>;
  durationMs: number;
}

export interface QualityControlPassResult {
  passNumber: number;
  teamNumber: number;
  teamName: string;
  teamLocation: string;
  eventKey: string;
  timestamp: number;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  success: boolean;
  durationMs: number;
  checks: QualityControlCheckResult[];
}

export interface QualityControlReport {
  timestamp: number;
  totalPasses: number;
  successfulPasses: number;
  failedPasses: number;
  passRate: number; // 0 - 100 %
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  averagePassLatencyMs: number;
  testedTeams: number[];
  passes: QualityControlPassResult[];
}

export interface SimulatedCompetitionData {
  teamNumber: number;
  teamName: string;
  eventKey: string;
  schedule: MatchModel[];
  rankings: RankingModel[];
  epa: Record<number, TeamEPAModel>;
  queue: QueueStateModel;
  playoffs: PlayoffStateModel;
  countdownSeconds: number;
  stepIndex: number; // 0 = Match 13 queued, 1 = Match 18 queued, etc.
}

// Diverse cohorts of authentic FRC teams for quality control passes
export const QC_TEST_COHORTS = {
  worldChampions: [254, 1678, 118, 2056, 1323, 148, 973, 4414, 2910, 3310],
  georgiaPeachtree: [1002, 1771, 2974, 4188, 1261, 1648, 832, 1833, 3635, 8736],
  regionalAndGlobal: [33, 67, 195, 230, 2046, 581, 604, 6014, 9483, 8058],
  rookiesAndEmerging: [5219, 6919, 7451, 8080, 8866, 9477, 9522, 10482, 11174, 11214],
};

/**
 * Returns a randomized list of distinct FRC teams across all experience tiers
 */
export function getRandomQcTeams(count: number = 10): number[] {
  const pool = [
    ...QC_TEST_COHORTS.worldChampions,
    ...QC_TEST_COHORTS.georgiaPeachtree,
    ...QC_TEST_COHORTS.regionalAndGlobal,
    ...QC_TEST_COHORTS.rookiesAndEmerging,
  ];

  // Shuffle pool using Fisher-Yates
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // If more requested than pool, add valid random rookie numbers
  const result = shuffled.slice(0, count);
  while (result.length < count) {
    const randomRookie = Math.floor(4000 + Math.random() * 6000);
    if (!result.includes(randomRookie)) {
      result.push(randomRookie);
    }
  }

  return result;
}

/**
 * Quality Control Service & Simulation Engine
 */
export class QualityControlService {
  /**
   * Generates a completely synchronized, 100% mathematically cohesive
   * simulated competition state for ANY team at ANY event.
   */
  public static generateSimulatedCompetition(
    teamNumber: number,
    eventKey: string = '2026gacmp',
    options?: { stepIndex?: number; baseTime?: number }
  ): SimulatedCompetitionData {
    const stepIndex = options?.stepIndex ?? 0;
    const now = options?.baseTime ?? Date.now();
    const meta = getTeamMetadata(teamNumber);
    const teamName = meta.name || `Team ${teamNumber}`;

    // Ensure pool has plenty of distinct teams
    const basePool = TbaService.getEventTeamsSync(eventKey, teamNumber);
    const poolSet = new Set<number>([teamNumber, ...basePool]);
    // Pad pool to at least 32 teams from directory
    for (const key of Object.keys(FRC_TEAM_DIRECTORY)) {
      if (poolSet.size >= 36) break;
      poolSet.add(Number(key));
    }
    const fullPool = Array.from(poolSet);
    const opponentsPool = fullPool.filter((t) => t !== teamNumber);

    // Helper to select N distinct teams from pool
    const pickDistinct = (startIdx: number, count: number, exclude: Set<number>): number[] => {
      const selected: number[] = [];
      let cursor = startIdx;
      while (selected.length < count) {
        const candidate = opponentsPool[cursor % opponentsPool.length];
        if (!exclude.has(candidate)) {
          selected.push(candidate);
          exclude.add(candidate);
        }
        cursor++;
      }
      return selected;
    };

    // Build 12 Qualification Matches with chronological times and step-based progression
    // Step 0: Matches 1-3 completed, Match 4 on field, Match 13 queued next (15 min away)
    // Step 1: Match 13 completes (Win for active team), Match 14 queued next (12 min away)
    // Step 2: Match 18 queued next, previous matches all completed
    const matchDefs = [
      { num: 3, offsetMins: -180, isRed: true, redScore: 142, blueScore: 118, video: 'kJQP7kiw5Fk' },
      { num: 7, offsetMins: -110, isRed: false, redScore: 124, blueScore: 156, video: 'L_LUpnjgPso' },
      { num: 12, offsetMins: -8, isRed: true, redScore: 148, blueScore: 112, video: 'kJQP7kiw5Fk' },
      {
        num: 13,
        offsetMins: stepIndex >= 1 ? -4 : 15, // Queued next at step 0, completed at step 1+
        isRed: true,
        redScore: 164,
        blueScore: 138,
        video: 'yEhH-UHuE2Y',
      },
      {
        num: 18,
        offsetMins: stepIndex >= 2 ? -2 : stepIndex >= 1 ? 14 : 75,
        isRed: false,
        redScore: 132,
        blueScore: 149,
        video: '7K09R3XfM3s',
      },
      { num: 24, offsetMins: 135, isRed: true, redScore: 155, blueScore: 122, video: 'OvyF-uF4ZlE' },
      { num: 33, offsetMins: 195, isRed: false, redScore: 119, blueScore: 144, video: 'kJQP7kiw5Fk' },
      { num: 42, offsetMins: 260, isRed: true, redScore: 160, blueScore: 141, video: 'yEhH-UHuE2Y' },
      { num: 51, offsetMins: 320, isRed: false, redScore: 128, blueScore: 152, video: 'L_LUpnjgPso' },
      { num: 60, offsetMins: 380, isRed: true, redScore: 145, blueScore: 135, video: '7K09R3XfM3s' },
      { num: 69, offsetMins: 440, isRed: true, redScore: 158, blueScore: 130, video: 'OvyF-uF4ZlE' },
      { num: 78, offsetMins: 500, isRed: false, redScore: 134, blueScore: 150, video: 'kJQP7kiw5Fk' },
    ];

    const completedThresholdMins = 0; // Negative offset = completed

    const schedule: MatchModel[] = matchDefs.map((def, idx) => {
      const scheduledTime = now + def.offsetMins * 60 * 1000;
      const isPast = def.offsetMins <= completedThresholdMins;
      const isCurrentQueued = !isPast && (
        (stepIndex === 0 && def.num === 13) ||
        (stepIndex === 1 && def.num === 18) ||
        (stepIndex >= 2 && def.num === 24)
      );

      const exclude = new Set<number>([teamNumber]);
      const partners = pickDistinct(idx * 5, 2, exclude);
      const opponents = pickDistinct(idx * 5 + 2, 3, exclude);

      const redTeams = def.isRed ? [teamNumber, ...partners] : opponents;
      const blueTeams = def.isRed ? opponents : [teamNumber, ...partners];

      let status: MatchModel['status'] = 'SCHEDULED';
      let redScore: number | null = null;
      let blueScore: number | null = null;
      let winner: MatchModel['winner'] = null;
      let actualTime: number | undefined = undefined;

      if (isPast) {
        status = 'COMPLETED';
        redScore = def.redScore;
        blueScore = def.blueScore;
        winner = redScore > blueScore ? 'red' : blueScore > redScore ? 'blue' : 'tie';
        actualTime = scheduledTime + 15000;
      } else if (isCurrentQueued) {
        status = 'QUEUED';
      }

      return {
        key: `${eventKey}_qm${def.num}`,
        matchNumber: def.num,
        compLevel: 'QUAL',
        scheduledTime,
        actualTime,
        redAlliance: {
          teams: redTeams,
          score: redScore,
          epaSum: redScore ? redScore - 5 : 145.5,
        },
        blueAlliance: {
          teams: blueTeams,
          score: blueScore,
          epaSum: blueScore ? blueScore - 5 : 138.2,
        },
        winner,
        status,
        videos: def.video ? [{ type: 'youtube', key: def.video }] : [],
      };
    });

    // 2. Compute live Standings from completed matches
    const completedMatches = schedule.filter((m) => m.status === 'COMPLETED');
    const teamStatsMap: Record<number, { wins: number; losses: number; ties: number; points: number; matchesPlayed: number }> = {};

    fullPool.forEach((t) => {
      teamStatsMap[t] = { wins: 0, losses: 0, ties: 0, points: 0, matchesPlayed: 0 };
    });

    completedMatches.forEach((m) => {
      const redWon = m.winner === 'red';
      const blueWon = m.winner === 'blue';
      const isTie = m.winner === 'tie';

      m.redAlliance.teams.forEach((t) => {
        if (!teamStatsMap[t]) teamStatsMap[t] = { wins: 0, losses: 0, ties: 0, points: 0, matchesPlayed: 0 };
        teamStatsMap[t].matchesPlayed += 1;
        teamStatsMap[t].points += m.redAlliance.score || 0;
        if (redWon) teamStatsMap[t].wins += 1;
        else if (isTie) teamStatsMap[t].ties += 1;
        else teamStatsMap[t].losses += 1;
      });

      m.blueAlliance.teams.forEach((t) => {
        if (!teamStatsMap[t]) teamStatsMap[t] = { wins: 0, losses: 0, ties: 0, points: 0, matchesPlayed: 0 };
        teamStatsMap[t].matchesPlayed += 1;
        teamStatsMap[t].points += m.blueAlliance.score || 0;
        if (blueWon) teamStatsMap[t].wins += 1;
        else if (isTie) teamStatsMap[t].ties += 1;
        else teamStatsMap[t].losses += 1;
      });
    });

    // Sort rankings by Win Ratio, then Total Points
    const sortedTeams = Object.keys(teamStatsMap)
      .map(Number)
      .sort((a, b) => {
        const statsA = teamStatsMap[a];
        const statsB = teamStatsMap[b];
        const rpA = statsA.matchesPlayed > 0 ? (statsA.wins * 2 + statsA.ties) / statsA.matchesPlayed : 0;
        const rpB = statsB.matchesPlayed > 0 ? (statsB.wins * 2 + statsB.ties) / statsB.matchesPlayed : 0;
        if (rpB !== rpA) return rpB - rpA;
        return (statsB.points / Math.max(1, statsB.matchesPlayed)) - (statsA.points / Math.max(1, statsA.matchesPlayed));
      });

    const rankings: RankingModel[] = sortedTeams.slice(0, 28).map((num, idx) => {
      const stats = teamStatsMap[num];
      const matchesPlayed = stats.matchesPlayed || 1;
      const rankingScore = parseFloat(
        Math.max(1.0, (stats.wins * 2 + stats.ties * 1) / matchesPlayed + (28 - idx) * 0.05).toFixed(2)
      );
      const qualAverage = parseFloat(
        (stats.points / matchesPlayed || (160 - idx * 2.5)).toFixed(1)
      );

      return {
        rank: idx + 1,
        teamNumber: num,
        teamName: getTeamMetadata(num).name || `Team ${num}`,
        record: {
          wins: stats.wins,
          losses: stats.losses,
          ties: stats.ties,
        },
        rankingScore,
        matchesPlayed: stats.matchesPlayed,
        qualAverage,
      };
    });

    // 3. Statbotics EPA for event participants
    const epaRecord: Record<number, TeamEPAModel> = {};
    rankings.forEach((r, idx) => {
      const totalEPA = parseFloat((58.5 - idx * 1.1).toFixed(1));
      const autoEPA = parseFloat((totalEPA * 0.32).toFixed(1));
      const teleopEPA = parseFloat((totalEPA * 0.52).toFixed(1));
      const endgameEPA = parseFloat((totalEPA - autoEPA - teleopEPA).toFixed(1));
      const unitlessEPA = Math.round(totalEPA * 32.5);

      epaRecord[r.teamNumber] = {
        teamNumber: r.teamNumber,
        teamName: r.teamName,
        totalEPA,
        autoEPA,
        teleopEPA,
        endgameEPA,
        totalXP: totalEPA,
        autoXP: autoEPA,
        teleopXP: teleopEPA,
        endgameXP: endgameEPA,
        unitlessEPA,
        normEPA: unitlessEPA,
        rank: idx + 1,
        eventRank: idx + 1,
        eventPercentile: Math.max(1, Math.round(100 - (idx / rankings.length) * 100)),
        districtRank: idx + 4,
        worldRank: 80 + idx * 18,
        worldPercentile: Math.max(1, Math.round(99 - idx * 1.5)),
        maxEPA: parseFloat((totalEPA + 7.4).toFixed(1)),
        meanEPA: totalEPA,
        stdDev: 4.5,
        winRate: Math.round((r.record.wins / Math.max(1, r.record.wins + r.record.losses)) * 100),
        wins: r.record.wins,
        losses: r.record.losses,
        ties: r.record.ties,
        seasonYear: 2026,
        lastUpdated: now,
      };
    });

    // 4. Queue State
    const nextMatch = schedule.find((m) => m.status !== 'COMPLETED') || schedule[schedule.length - 1];
    const isRedAlliance = nextMatch.redAlliance.teams.includes(teamNumber);
    const stationLabel = isRedAlliance ? 'Red' : 'Blue';
    const queue: QueueStateModel = {
      currentMatchNumber: Math.max(1, nextMatch.matchNumber - 1),
      currentCompLevel: 'QUAL',
      nowQueuingMatchNumber: nextMatch.matchNumber,
      statusText: `Qual ${Math.max(1, nextMatch.matchNumber - 1)} on field • Qual ${nextMatch.matchNumber} in queuing lane (Team ${teamNumber} preparing Station ${stationLabel})`,
      updatedAt: now,
      isEstimated: false,
    };

    // Countdown
    const countdownSeconds = nextMatch.scheduledTime > now
      ? Math.max(0, Math.floor((nextMatch.scheduledTime - now) / 1000))
      : 900;

    // 5. Playoff Double-Elimination Bracket
    // Form 8 Alliances from top 24 teams
    const topTeams = rankings.map((r) => r.teamNumber);
    const alliances: PlayoffAlliance[] = [];
    for (let a = 1; a <= 8; a++) {
      const captain = topTeams[a - 1] || fullPool[a - 1];
      const pick1 = topTeams[16 - a] || fullPool[16 - a];
      const pick2 = topTeams[16 + a - 1] || fullPool[16 + a - 1];
      alliances.push({
        number: a,
        name: `Alliance ${a}`,
        picks: [captain, pick1, pick2],
        status: a === 1 ? 'CHAMPIONS' : a === 2 ? 'FINALISTS' : `LOWER R${Math.max(2, 6 - a)}`,
      });
    }

    const playoffMatches: PlayoffMatchResult[] = [
      { matchKey: `${eventKey}_sf1m1`, matchName: 'Match 1 (#1 vs #8)', redAllianceNumber: 1, blueAllianceNumber: 8, redScore: 558, blueScore: 273, winner: 'red' },
      { matchKey: `${eventKey}_sf2m1`, matchName: 'Match 2 (#4 vs #5)', redAllianceNumber: 4, blueAllianceNumber: 5, redScore: 328, blueScore: 288, winner: 'red' },
      { matchKey: `${eventKey}_sf3m1`, matchName: 'Match 3 (#2 vs #7)', redAllianceNumber: 2, blueAllianceNumber: 7, redScore: 470, blueScore: 333, winner: 'red' },
      { matchKey: `${eventKey}_sf4m1`, matchName: 'Match 4 (#3 vs #6)', redAllianceNumber: 3, blueAllianceNumber: 6, redScore: 305, blueScore: 199, winner: 'red' },
      { matchKey: `${eventKey}_sf7m1`, matchName: 'Match 7 (#1 vs #4)', redAllianceNumber: 1, blueAllianceNumber: 4, redScore: 563, blueScore: 342, winner: 'red' },
      { matchKey: `${eventKey}_sf8m1`, matchName: 'Match 8 (#2 vs #3)', redAllianceNumber: 2, blueAllianceNumber: 3, redScore: 411, blueScore: 388, winner: 'red' },
      { matchKey: `${eventKey}_sf11m1`, matchName: 'Match 11 (#1 vs #2)', redAllianceNumber: 1, blueAllianceNumber: 2, redScore: 648, blueScore: 358, winner: 'red' },
      { matchKey: `${eventKey}_f1m1`, matchName: 'Finals 1 (#1 vs #2)', redAllianceNumber: 1, blueAllianceNumber: 2, redScore: 557, blueScore: 227, winner: 'red' },
      { matchKey: `${eventKey}_f1m2`, matchName: 'Finals 2 (#1 vs #2)', redAllianceNumber: 1, blueAllianceNumber: 2, redScore: 529, blueScore: 224, winner: 'red' },
    ];

    const playoffs: PlayoffStateModel = {
      alliances,
      matches: playoffMatches,
      bracketType: 'DOUBLE_ELIM_8',
    };

    return {
      teamNumber,
      teamName,
      eventKey,
      schedule,
      rankings,
      epa: epaRecord,
      queue,
      playoffs,
      countdownSeconds,
      stepIndex,
    };
  }

  /**
   * Applies the simulated competition state directly to the store
   */
  public static applySimulatedCompetition(simData: SimulatedCompetitionData): void {
    const nextMatch = simData.schedule.find((m) => m.status !== 'COMPLETED') || simData.schedule[0];
    const isRed = nextMatch.redAlliance.teams.includes(simData.teamNumber);

    pitStore.setState((s) => ({
      ...s,
      config: {
        ...s.config,
        teamNumber: simData.teamNumber,
        verifiedTeamName: simData.teamName,
        selectedEventKey: simData.eventKey,
        demoMode: {
          enabled: true,
          dayLabel: 'Day 2',
          timeString: '11:30 AM',
          simulatedTimeOffset: 0,
          eventKey: simData.eventKey,
          teamNumber: simData.teamNumber,
        },
      },
      activeEvent: {
        ...s.activeEvent,
        metadata: {
          key: simData.eventKey,
          name: 'Peachtree District Championship 2026',
          shortName: 'PCH DCMP 2026',
          city: 'Macon',
          stateProv: 'GA',
          startDate: '2026-04-03',
          endDate: '2026-04-05',
          year: 2026,
          category: 'CURRENT',
          timezone: 'America/New_York',
          webcasts: [
            {
              channel: 'UCr_x7a303YmQ61V81kP0gqQ',
              type: 'youtube',
              name: 'PCH District Championship YouTube Live',
            },
          ],
        },
        schedule: simData.schedule,
        rankings: simData.rankings,
        epa: simData.epa,
        queue: simData.queue,
        playoffs: simData.playoffs,
        announcements: [
          {
            id: `ann-sim-${Date.now()}-1`,
            message: `Simulated Competition Active • Field schedule proceeding for Team ${simData.teamNumber}`,
            postedAt: Date.now() - 1000 * 60 * 15,
          },
          {
            id: `ann-sim-${Date.now()}-2`,
            message: `Next Match: Qual ${nextMatch.matchNumber} (${isRed ? 'Station Red 1' : 'Station Blue 1'})`,
            postedAt: Date.now() - 1000 * 60 * 5,
          },
        ],
      },
      overrides: {
        ...s.overrides,
        nextMatchNumber: nextMatch.matchNumber,
        allianceColor: isRed ? 'red' : 'blue',
        queueState: 'QUEUE_5MIN',
      },
      videoReplay: {
        ...s.videoReplay,
        activeMatchKey: simData.schedule[0].key,
        youtubeId: simData.schedule[0].videos?.[0]?.key || 'yEhH-UHuE2Y',
        matchTitle: `Quals ${simData.schedule[0].matchNumber} - Team ${simData.teamNumber}`,
      },
      ui: {
        ...s.ui,
        countdownSeconds: simData.countdownSeconds,
        selectedScheduleMatchKey: nextMatch.key,
        lastSyncedAt: Date.now(),
        dataFreshness: 'live',
      },
    }));
  }

  /**
   * Executes a single thorough Quality Control Pass for a given team
   */
  public static async runPass(
    passNumber: number,
    teamNumber: number,
    eventKey: string = '2026gacmp'
  ): Promise<QualityControlPassResult> {
    const passStart = performance.now();
    const meta = getTeamMetadata(teamNumber);
    const checks: QualityControlCheckResult[] = [];

    // Generate isolated simulation state for this pass
    const simData = this.generateSimulatedCompetition(teamNumber, eventKey);

    // ========================================================
    // CHECK 1: Team Identity & Directory Metadata
    // ========================================================
    const c1Start = performance.now();
    const isIdValid = teamNumber > 0 && Number.isInteger(teamNumber);
    const isNameValid = meta.name && !meta.name.includes('NaN') && meta.name.trim().length > 0;
    checks.push({
      id: 'qc_identity',
      name: 'Team Identity & Metadata Directory',
      category: 'IDENTITY',
      passed: Boolean(isIdValid && isNameValid),
      message: isIdValid && isNameValid
        ? `Team ${teamNumber} resolved as "${meta.name}" (${meta.city || 'Regional'}, ${meta.state || 'FIRST'})`
        : `Invalid team resolution: ${teamNumber}`,
      durationMs: Math.round(performance.now() - c1Start),
      details: { teamNumber, name: meta.name, city: meta.city, state: meta.state },
    });

    // ========================================================
    // CHECK 2: Schedule Structure & No-Duplicate Alliances
    // ========================================================
    const c2Start = performance.now();
    const schedule = simData.schedule;
    const hasEnoughMatches = schedule.length >= 6;
    let scheduleAlliancesValid = true;
    let allMatchesHaveTargetTeam = true;
    let noDuplicateTeamsInAnyMatch = true;

    for (const m of schedule) {
      if (m.redAlliance.teams.length !== 3 || m.blueAlliance.teams.length !== 3) {
        scheduleAlliancesValid = false;
      }
      const isTargetIn = m.redAlliance.teams.includes(teamNumber) || m.blueAlliance.teams.includes(teamNumber);
      if (!isTargetIn) {
        allMatchesHaveTargetTeam = false;
      }
      const matchTeams = [...m.redAlliance.teams, ...m.blueAlliance.teams];
      const matchSet = new Set(matchTeams);
      if (matchSet.size !== 6) {
        noDuplicateTeamsInAnyMatch = false;
      }
    }

    const c2Passed = hasEnoughMatches && scheduleAlliancesValid && allMatchesHaveTargetTeam && noDuplicateTeamsInAnyMatch;
    checks.push({
      id: 'qc_schedule',
      name: 'Schedule Structure & Alliance Integrity',
      category: 'SCHEDULE',
      passed: c2Passed,
      message: c2Passed
        ? `${schedule.length} qualification matches generated with 3v3 distinct alliances. Target Team ${teamNumber} present in 100% of matches.`
        : `Schedule integrity issue detected (matches: ${schedule.length}, noDupes: ${noDuplicateTeamsInAnyMatch})`,
      durationMs: Math.round(performance.now() - c2Start),
      details: { matchCount: schedule.length, noDuplicateTeamsInAnyMatch },
    });

    // ========================================================
    // CHECK 3: Scores, Outcomes & Mathematical Determinism
    // ========================================================
    const c3Start = performance.now();
    let scoreDeterminismValid = true;
    const completedMatches = schedule.filter((m) => m.status === 'COMPLETED');

    for (const m of completedMatches) {
      const red = m.redAlliance.score ?? -1;
      const blue = m.blueAlliance.score ?? -1;
      if (red < 0 || blue < 0) scoreDeterminismValid = false;
      if (red > blue && m.winner !== 'red') scoreDeterminismValid = false;
      if (blue > red && m.winner !== 'blue') scoreDeterminismValid = false;
      if (red === blue && m.winner !== 'tie') scoreDeterminismValid = false;
    }

    checks.push({
      id: 'qc_scores',
      name: 'Match Scores & Winner Determinism',
      category: 'SCORES',
      passed: scoreDeterminismValid && completedMatches.length >= 3,
      message: scoreDeterminismValid
        ? `${completedMatches.length} completed matches have valid non-negative scores strictly adhering to winner comparison.`
        : 'Score determinism mismatch found in completed matches.',
      durationMs: Math.round(performance.now() - c3Start),
      details: { completedCount: completedMatches.length },
    });

    // ========================================================
    // CHECK 4: Queuing State & Countdown Synchronization
    // ========================================================
    const c4Start = performance.now();
    const queue = simData.queue;
    const nextMatch = schedule.find((m) => m.status !== 'COMPLETED');
    const isQueueValid = Boolean(
      queue &&
      queue.nowQueuingMatchNumber &&
      queue.statusText &&
      queue.statusText.includes(String(teamNumber)) &&
      simData.countdownSeconds >= 0
    );

    checks.push({
      id: 'qc_queuing',
      name: 'Queue Call & Countdown Ticker',
      category: 'QUEUING',
      passed: isQueueValid,
      message: isQueueValid
        ? `Active Queue correctly targets Qual ${queue.nowQueuingMatchNumber} with positive countdown (${simData.countdownSeconds}s).`
        : 'Queue state or countdown ticker failed validation.',
      durationMs: Math.round(performance.now() - c4Start),
      details: { queueMatch: queue.nowQueuingMatchNumber, countdown: simData.countdownSeconds },
    });

    // ========================================================
    // CHECK 5: Standings & Record Mathematical Rigor
    // ========================================================
    const c5Start = performance.now();
    const rankings = simData.rankings;
    const targetRanking = rankings.find((r) => r.teamNumber === teamNumber);
    let standingsMathValid = Boolean(targetRanking);

    if (targetRanking) {
      const expectedRecord = { wins: 0, losses: 0, ties: 0 };
      completedMatches.forEach((m) => {
        const isRed = m.redAlliance.teams.includes(teamNumber);
        if (m.winner === 'tie') expectedRecord.ties += 1;
        else if ((isRed && m.winner === 'red') || (!isRed && m.winner === 'blue')) expectedRecord.wins += 1;
        else expectedRecord.losses += 1;
      });

      if (
        targetRanking.record.wins !== expectedRecord.wins ||
        targetRanking.record.losses !== expectedRecord.losses ||
        targetRanking.record.ties !== expectedRecord.ties
      ) {
        standingsMathValid = false;
      }
    }

    checks.push({
      id: 'qc_rankings',
      name: 'Standings Math & Win/Loss Cohesion',
      category: 'RANKINGS',
      passed: standingsMathValid,
      message: standingsMathValid && targetRanking
        ? `Rank #${targetRanking.rank} with record ${targetRanking.record.wins}-${targetRanking.record.losses}-${targetRanking.record.ties} matches completed schedule results.`
        : `Standings record mismatch for Team ${teamNumber}`,
      durationMs: Math.round(performance.now() - c5Start),
      details: targetRanking ? { rank: targetRanking.rank, record: targetRanking.record } : {},
    });

    // ========================================================
    // CHECK 6: Match 13 xP Model Completeness
    // ========================================================
    const c6Start = performance.now();
    const teamEpa = simData.epa[teamNumber];
    let epaConsistent = false;

    if (teamEpa && teamEpa.totalEPA !== null && teamEpa.autoEPA !== null && teamEpa.teleopEPA !== null && teamEpa.endgameEPA !== null) {
      const sum = teamEpa.autoEPA + teamEpa.teleopEPA + teamEpa.endgameEPA;
      epaConsistent = Math.abs(sum - teamEpa.totalEPA) < 0.5;
    }

    checks.push({
      id: 'qc_epa',
      name: 'Match 13 xP Model Breakdown',
      category: 'EPA',
      passed: epaConsistent,
      message: epaConsistent && teamEpa
        ? `Total xP ${teamEpa.totalXP ?? teamEpa.totalEPA} = Auto (${teamEpa.autoXP ?? teamEpa.autoEPA}) + Teleop (${teamEpa.teleopXP ?? teamEpa.teleopEPA}) + Endgame (${teamEpa.endgameXP ?? teamEpa.endgameEPA}). Percentile: ${teamEpa.eventPercentile}%.`
        : 'Match 13 xP breakdown sum mismatch or missing rating values.',
      durationMs: Math.round(performance.now() - c6Start),
      details: teamEpa ? { totalXP: teamEpa.totalXP ?? teamEpa.totalEPA, percentile: teamEpa.eventPercentile } : {},
    });

    // ========================================================
    // CHECK 7: Double-Elimination Playoff Bracket Integrity
    // ========================================================
    const c7Start = performance.now();
    const playoffs = simData.playoffs;
    const has8Alliances = playoffs && playoffs.alliances.length === 8;
    let allAlliancesDistinct = true;
    const allPlayoffPicks = new Set<number>();

    if (has8Alliances) {
      playoffs.alliances.forEach((a) => {
        if (a.picks.length !== 3) allAlliancesDistinct = false;
        a.picks.forEach((p) => {
          if (allPlayoffPicks.has(p)) allAlliancesDistinct = false;
          allPlayoffPicks.add(p);
        });
      });
    }

    const c7Passed = Boolean(has8Alliances && allAlliancesDistinct && playoffs.matches.length >= 8);
    checks.push({
      id: 'qc_playoffs',
      name: 'Playoff Bracket & Alliances Integrity',
      category: 'PLAYOFFS',
      passed: c7Passed,
      message: c7Passed
        ? `8 distinct alliances (24 teams) and double-elimination bracket generated with valid progression.`
        : 'Playoff alliance or bracket validation failed.',
      durationMs: Math.round(performance.now() - c7Start),
      details: { allianceCount: playoffs?.alliances?.length, matchCount: playoffs?.matches?.length },
    });

    // ========================================================
    // CHECK 8: Video Replay Indexing & Scrubber
    // ========================================================
    const c8Start = performance.now();
    const replayMatch = schedule.find((m) => m.videos && m.videos.length > 0);
    const hasReplays = Boolean(replayMatch && replayMatch.videos && replayMatch.videos[0].key);

    checks.push({
      id: 'qc_replay',
      name: 'Video Replay Indexing & Media Keys',
      category: 'REPLAY',
      passed: hasReplays,
      message: hasReplays
        ? `Match replays indexed with valid YouTube ID (${replayMatch?.videos?.[0]?.key}).`
        : 'No match videos available in schedule.',
      durationMs: Math.round(performance.now() - c8Start),
      details: { replayKey: replayMatch?.videos?.[0]?.key },
    });

    // ========================================================
    // CHECK 9: Tool Operations & Ledger Integrity
    // ========================================================
    const c9Start = performance.now();
    const storeState = pitStore.getState();
    const toolLoans = storeState.userOperations?.toolLoans || [];
    const isOpsValid = Array.isArray(toolLoans) && toolLoans.every((t) => t.borrowerTeamNumber > 0);

    checks.push({
      id: 'qc_operations',
      name: 'Pit Tool Ledger & Strategy Store',
      category: 'OPERATIONS',
      passed: isOpsValid,
      message: isOpsValid
        ? `Tool loans registry healthy (${toolLoans.length} records verified with valid numeric team IDs).`
        : 'Tool lending records contain invalid references.',
      durationMs: Math.round(performance.now() - c9Start),
      details: { toolLoansCount: toolLoans.length },
    });

    // ========================================================
    // CHECK 10: Telemetry Health & Data Freshness
    // ========================================================
    const c10Start = performance.now();
    const telemetry = storeState.telemetry;
    const isTelemetryValid = Boolean(
      telemetry.tba &&
      telemetry.nexus &&
      (telemetry.match13 || telemetry.statbotics) &&
      storeState.ui.dataFreshness
    );

    checks.push({
      id: 'qc_telemetry',
      name: 'Telemetry Health & Freshness Indicators',
      category: 'TELEMETRY',
      passed: isTelemetryValid,
      message: isTelemetryValid
        ? `Telemetry pipelines green (TBA: ${telemetry.tba.status}, Nexus: ${telemetry.nexus.status}, Match 13: ${telemetry.match13?.status || telemetry.statbotics?.status}).`
        : 'Telemetry service health check failed.',
      durationMs: Math.round(performance.now() - c10Start),
      details: {
        tba: telemetry.tba?.status,
        nexus: telemetry.nexus?.status,
        match13: telemetry.match13?.status || telemetry.statbotics?.status,
      },
    });

    const passedCount = checks.filter((c) => c.passed).length;
    const failedCount = checks.filter((c) => !c.passed).length;
    const totalDuration = Math.round(performance.now() - passStart);

    return {
      passNumber,
      teamNumber,
      teamName: meta.name || `Team ${teamNumber}`,
      teamLocation: `${meta.city || 'Regional'}, ${meta.state || 'FIRST'}`,
      eventKey,
      timestamp: Date.now(),
      totalChecks: checks.length,
      passedChecks: passedCount,
      failedChecks: failedCount,
      success: failedCount === 0,
      durationMs: totalDuration,
      checks,
    };
  }

  /**
   * Runs multiple passes of quality control across a randomized cohort of teams
   */
  public static async runMultiPassQC(
    passCount: number = 10,
    customTeams?: number[],
    onProgress?: (completed: number, total: number, currentPass: QualityControlPassResult) => void
  ): Promise<QualityControlReport> {
    const teamsToTest = customTeams && customTeams.length >= passCount
      ? customTeams.slice(0, passCount)
      : getRandomQcTeams(passCount);

    const passes: QualityControlPassResult[] = [];
    const startAll = performance.now();

    for (let i = 0; i < passCount; i++) {
      const targetTeam = teamsToTest[i] || 1002;
      const passResult = await this.runPass(i + 1, targetTeam);
      passes.push(passResult);

      if (onProgress) {
        onProgress(i + 1, passCount, passResult);
      }
    }

    const totalPassedChecks = passes.reduce((acc, p) => acc + p.passedChecks, 0);
    const totalFailedChecks = passes.reduce((acc, p) => acc + p.failedChecks, 0);
    const totalChecks = passes.reduce((acc, p) => acc + p.totalChecks, 0);
    const successfulPasses = passes.filter((p) => p.success).length;
    const failedPasses = passes.length - successfulPasses;
    const passRate = parseFloat(((successfulPasses / Math.max(1, passes.length)) * 100).toFixed(1));
    const avgLatency = Math.round((performance.now() - startAll) / passes.length);

    return {
      timestamp: Date.now(),
      totalPasses: passes.length,
      successfulPasses,
      failedPasses,
      passRate,
      totalChecks,
      passedChecks: totalPassedChecks,
      failedChecks: totalFailedChecks,
      averagePassLatencyMs: avgLatency,
      testedTeams: teamsToTest,
      passes,
    };
  }
}
