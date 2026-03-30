import { PromptTracker, type PromptRecord, type PromptTrackerLike } from "../../src/tracking/prompt-tracker.js";

export interface DashboardAnalytics {
  stats: {
    total: number;
    by_engine: Record<string, number>;
    avg_cost: number;
  };
  quality_trend: Array<{
    timestamp: string;
    engine: string;
    quality_score: number;
  }>;
  recent_costs: Array<{
    timestamp: string;
    cost_usd: number;
  }>;
}

export function getDashboardAnalytics(input?: {
  tracker?: PromptTrackerLike;
  trackerPath?: string;
}): DashboardAnalytics {
  const managedTracker = input?.tracker ?? new PromptTracker(input?.trackerPath);

  try {
    const history = managedTracker.getHistory(undefined, 100);
    const stats = managedTracker.getStats();

    return {
      stats,
      quality_trend: history
        .filter((record) => record.quality_score !== undefined)
        .map((record) => ({
          timestamp: record.timestamp,
          engine: record.engine,
          quality_score: record.quality_score!,
        }))
        .reverse(),
      recent_costs: history
        .map((record) => ({
          timestamp: record.timestamp,
          cost_usd: record.cost_usd,
        }))
        .reverse(),
    };
  } finally {
    if (!input?.tracker) {
      managedTracker.close();
    }
  }
}
