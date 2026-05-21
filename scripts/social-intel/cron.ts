// ============================================================
// Confetti Social Intelligence — Cron Scheduler
// ============================================================
// Lightweight cron runner using node-cron. Alternatively, these
// can be scheduled via GitHub Actions, Railway, or pg_cron.
//
// Usage:
//   npx tsx scripts/social-intel/cron.ts
//
// Schedules:
//   Every 6h  → Trend scan (tier-1 cities only)
//   Daily 2AM → New openings (all cities)
//   Sunday 3AM → Deep audit (all cities)
//   1st of month 4AM → Dormant check (all cities)
// ============================================================

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Simple cron-like scheduler (no dependency needed)
function scheduleCron(label: string, checkFn: () => boolean, task: () => Promise<void>) {
  const run = async () => {
    if (checkFn()) {
      console.log(`[${new Date().toISOString()}] Running: ${label}`);
      try {
        await task();
      } catch (err) {
        console.error(`[${label}] Failed:`, err);
      }
    }
  };

  // Check every minute
  setInterval(run, 60_000);
  console.log(`Scheduled: ${label}`);
}

async function runOrchestrator(type: string, scope: string) {
  const cmd = `npx tsx ${__dirname}/orchestrator.ts --type ${type} ${scope}`;
  console.log(`  Executing: ${cmd}`);
  const { stdout, stderr } = await execAsync(cmd, { timeout: 30 * 60_000 }); // 30 min timeout
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);
}

// ---- Schedule definitions ----

const lastRun: Record<string, number> = {};

function shouldRun(key: string, intervalHours: number): boolean {
  const now = Date.now();
  const last = lastRun[key] || 0;
  if (now - last >= intervalHours * 3600_000) {
    lastRun[key] = now;
    return true;
  }
  return false;
}

// Trend scans: every 6 hours, tier-1 cities
scheduleCron('Trend Scan (Tier 1)', () => shouldRun('trend', 6), async () => {
  await runOrchestrator('trend', '--tier1');
});

// New openings: daily, all cities
scheduleCron('New Openings (All)', () => shouldRun('new_opening', 24), async () => {
  await runOrchestrator('new_opening', '--all');
});

// Deep audit: weekly (every 168 hours), all cities
scheduleCron('Deep Audit (All)', () => shouldRun('deep_audit', 168), async () => {
  await runOrchestrator('deep_audit', '--all');
});

// Dormant check: monthly (every 720 hours), all cities
scheduleCron('Dormant Check (All)', () => shouldRun('dormant_check', 720), async () => {
  await runOrchestrator('dormant_check', '--all');
});

console.log('\n🎊 Confetti Social Intelligence Cron — Running');
console.log('   Press Ctrl+C to stop\n');

// Keep process alive
process.on('SIGINT', () => {
  console.log('\nShutting down cron scheduler...');
  process.exit(0);
});
