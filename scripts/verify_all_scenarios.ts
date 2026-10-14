/**
 * Standalone Verification Script for Multi-Pass Quality Controls & Competition Simulation
 * Run with: npx tsx scripts/verify_all_scenarios.ts
 */

import { QualityControlService, getRandomQcTeams } from '../src/services/qualityControl';
import { pitStore, Actions } from '../src/store';

async function main() {
  console.log('======================================================================');
  console.log('🚀 FRC PITFUSION 2.0 - QUALITY CONTROL & SIMULATION VERIFICATION SUITE');
  console.log('======================================================================');
  console.log('Testing all scenarios across multiple passes with random teams...\n');

  // Scenario 1: Standard Team 1002 Simulation
  console.log('--- SCENARIO 1: Verifying Team 1002 Baseline ---');
  const pass1002 = await QualityControlService.runPass(1, 1002, '2026gacmp');
  console.log(`Team 1002 Result: ${pass1002.success ? 'PASSED ✅' : 'FAILED ❌'} (${pass1002.passedChecks}/${pass1002.totalChecks} checks in ${pass1002.durationMs}ms)`);
  if (!pass1002.success) {
    console.error('Errors in Pass 1002:', pass1002.checks.filter(c => !c.passed));
    process.exit(1);
  }

  // Scenario 2: Multi-Pass QC with 10 Random Teams Across All Tiers
  console.log('\n--- SCENARIO 2: Running 10-Pass QC with 10 Random Teams ---');
  const randomTeams = getRandomQcTeams(10);
  console.log('Selected Random Teams:', randomTeams);

  const report = await QualityControlService.runMultiPassQC(10, randomTeams, (completed, total, pass) => {
    console.log(`  Pass ${completed}/${total}: Team ${pass.teamNumber} (${pass.teamName}) -> ${pass.success ? 'PASSED ✅' : 'FAILED ❌'} [${pass.passedChecks}/${pass.totalChecks} checks in ${pass.durationMs}ms]`);
  });

  console.log('\n================== QC MULTI-PASS SUMMARY ==================');
  console.log(`Total Passes:      ${report.totalPasses}`);
  console.log(`Successful Passes: ${report.successfulPasses}`);
  console.log(`Failed Passes:     ${report.failedPasses}`);
  console.log(`Overall Pass Rate: ${report.passRate}%`);
  console.log(`Total Sub-Checks:  ${report.totalChecks} (${report.passedChecks} passed, ${report.failedChecks} failed)`);
  console.log(`Average Latency:   ${report.averagePassLatencyMs}ms / pass`);
  console.log('===========================================================');

  if (report.passRate < 100) {
    console.error('❌ Quality Control Failed! Pass rate below 100%.');
    process.exit(1);
  }

  // Scenario 3: Verify Simulated Competition Live Updates (Step Progression)
  console.log('\n--- SCENARIO 3: Verifying Simulated Competition Live Up-to-date State ---');
  const testTeam = 254; // The Cheesy Poofs
  console.log(`Initializing simulation for Team ${testTeam}...`);
  Actions.enableDemoMode(testTeam, '2026gacmp', 0);
  const state0 = pitStore.getState();

  const nextMatch0 = state0.activeEvent.schedule.find(m => m.status !== 'COMPLETED');
  console.log(`Initial Queued Match: Qual ${nextMatch0?.matchNumber} (Status: ${nextMatch0?.status})`);
  const initialRank = state0.activeEvent.rankings.find(r => r.teamNumber === testTeam);
  console.log(`Team ${testTeam} Initial Rank: #${initialRank?.rank} (Record: ${initialRank?.record.wins}-${initialRank?.record.losses})`);

  console.log('\nAdvancing competition simulation step (Simulating match finish & score posting)...');
  Actions.advanceSimulatedCompetition();
  const state1 = pitStore.getState();

  const nextMatch1 = state1.activeEvent.schedule.find(m => m.status !== 'COMPLETED');
  console.log(`New Queued Match: Qual ${nextMatch1?.matchNumber} (Status: ${nextMatch1?.status})`);
  const updatedRank = state1.activeEvent.rankings.find(r => r.teamNumber === testTeam);
  console.log(`Team ${testTeam} Updated Rank: #${updatedRank?.rank} (Record: ${updatedRank?.record.wins}-${updatedRank?.record.losses})`);

  // Assertions for Scenario 3
  if (nextMatch0?.matchNumber === nextMatch1?.matchNumber) {
    console.error('❌ Match did not advance after step!');
    process.exit(1);
  }
  if (!updatedRank || updatedRank.matchesPlayed <= (initialRank?.matchesPlayed ?? 0)) {
    console.error('❌ Standings did not update with new match outcome!');
    process.exit(1);
  }
  console.log('✅ Competition simulation live progression verified! All data updated in real-time.');

  console.log('\n======================================================================');
  console.log('🎉 ALL QUALITY CONTROL VERIFICATIONS PASSED WITH 100% SUCCESS RATE!');
  console.log('======================================================================\n');
}

main().catch((err) => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});
