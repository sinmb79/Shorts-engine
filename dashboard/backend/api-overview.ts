import { PromptTracker, type PromptRecord, type PromptTrackerLike } from "../../src/tracking/prompt-tracker.js";

export interface DashboardOverview {
  recent_runs: PromptRecord[];
  engine_status: Record<string, number>;
  daily_cost: number;
  total_prompts: number;
}

export function getDashboardOverview(input?: {
  tracker?: PromptTrackerLike;
  trackerPath?: string;
}): DashboardOverview {
  const managedTracker = input?.tracker ?? new PromptTracker(input?.trackerPath);

  try {
    const recentRuns = managedTracker.getHistory(undefined, 10);
    const stats = managedTracker.getStats();

    return {
      recent_runs: recentRuns,
      engine_status: stats.by_engine,
      daily_cost: roundCost(sumCosts(filterByRecentDays(recentRuns, 1))),
      total_prompts: stats.total,
    };
  } finally {
    if (!input?.tracker) {
      managedTracker.close();
    }
  }
}

function filterByRecentDays(records: PromptRecord[], days: number): PromptRecord[] {
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
  return records.filter((record) => Date.parse(record.timestamp) >= threshold);
}

function sumCosts(records: PromptRecord[]): number {
  return records.reduce((sum, record) => sum + record.cost_usd, 0);
}

function roundCost(value: number): number {
  return Number(value.toFixed(2));
}
