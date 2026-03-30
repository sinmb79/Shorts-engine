import { PromptTracker, type PromptRecord, type PromptTrackerLike } from "../../src/tracking/prompt-tracker.js";

export interface CostBucket {
  total_cost: number;
  by_engine: Record<string, number>;
}

export interface DashboardCostBreakdown {
  daily: CostBucket;
  weekly: CostBucket;
  monthly: CostBucket;
}

export function getDashboardCostBreakdown(input?: {
  tracker?: PromptTrackerLike;
  trackerPath?: string;
}): DashboardCostBreakdown {
  const managedTracker = input?.tracker ?? new PromptTracker(input?.trackerPath);

  try {
    const history = managedTracker.getHistory(undefined, 500);

    return {
      daily: buildCostBucket(history, 1),
      weekly: buildCostBucket(history, 7),
      monthly: buildCostBucket(history, 30),
    };
  } finally {
    if (!input?.tracker) {
      managedTracker.close();
    }
  }
}

function buildCostBucket(records: PromptRecord[], days: number): CostBucket {
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
  const filtered = records.filter((record) => Date.parse(record.timestamp) >= threshold);
  const byEngine: Record<string, number> = {};

  for (const record of filtered) {
    byEngine[record.engine] = roundCost((byEngine[record.engine] ?? 0) + record.cost_usd);
  }

  return {
    total_cost: roundCost(filtered.reduce((sum, record) => sum + record.cost_usd, 0)),
    by_engine: byEngine,
  };
}

function roundCost(value: number): number {
  return Number(value.toFixed(2));
}
