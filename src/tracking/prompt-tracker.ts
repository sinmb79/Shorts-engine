import { mkdirSync } from "node:fs";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

export interface PromptRecord {
  id: string;
  timestamp: string;
  engine: string;
  prompt_text: string;
  request_id: string;
  platform: string;
  corner?: string;
  duration_sec: number;
  cost_usd: number;
  quality_score?: number;
  micro_signals?: string;
}

export interface PromptTrackerStats {
  total: number;
  by_engine: Record<string, number>;
  avg_cost: number;
}

export interface PromptTrackerLike {
  record(entry: Omit<PromptRecord, "id" | "timestamp">): void;
  getHistory(engine?: string, limit?: number): PromptRecord[];
  getStats(): PromptTrackerStats;
  close(): void;
}

export function resolvePromptTrackerPath(): string {
  return process.env["SHORTS_ENGINE_PROMPT_DB_PATH"] ?? path.resolve(process.cwd(), "data", "prompt_log.db");
}

export class PromptTracker implements PromptTrackerLike {
  private readonly db: DatabaseSync;

  constructor(private readonly dbPath = resolvePromptTrackerPath()) {
    mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS prompt_records (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        engine TEXT NOT NULL,
        prompt_text TEXT NOT NULL,
        request_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        corner TEXT,
        duration_sec REAL NOT NULL,
        cost_usd REAL NOT NULL,
        quality_score REAL,
        micro_signals TEXT
      );
    `);
  }

  record(entry: Omit<PromptRecord, "id" | "timestamp">): void {
    const statement = this.db.prepare(`
      INSERT INTO prompt_records (
        id, timestamp, engine, prompt_text, request_id, platform, corner,
        duration_sec, cost_usd, quality_score, micro_signals
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    statement.run(
      randomUUID(),
      new Date().toISOString(),
      entry.engine,
      entry.prompt_text,
      entry.request_id,
      entry.platform,
      entry.corner ?? null,
      entry.duration_sec,
      entry.cost_usd,
      entry.quality_score ?? null,
      entry.micro_signals ?? null,
    );
  }

  getHistory(engine?: string, limit = 20): PromptRecord[] {
    const safeLimit = Math.max(1, limit);

    if (engine) {
      const statement = this.db.prepare(`
        SELECT id, timestamp, engine, prompt_text, request_id, platform, corner,
               duration_sec, cost_usd, quality_score, micro_signals
        FROM prompt_records
        WHERE engine = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `);

      return (statement.all(engine, safeLimit) as unknown[]).map(mapPromptRecord);
    }

    const statement = this.db.prepare(`
      SELECT id, timestamp, engine, prompt_text, request_id, platform, corner,
             duration_sec, cost_usd, quality_score, micro_signals
      FROM prompt_records
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    return (statement.all(safeLimit) as unknown[]).map(mapPromptRecord);
  }

  getStats(): PromptTrackerStats {
    const summaryStatement = this.db.prepare(`
      SELECT
        COUNT(*) AS total,
        COALESCE(ROUND(AVG(cost_usd), 2), 0) AS avg_cost
      FROM prompt_records
    `);
    const engineStatement = this.db.prepare(`
      SELECT engine, COUNT(*) AS count
      FROM prompt_records
      GROUP BY engine
      ORDER BY engine ASC
    `);

    const summary = summaryStatement.get() as { total: number; avg_cost: number } | undefined;
    const engineRows = engineStatement.all() as Array<{ engine: string; count: number }>;
    const byEngine: Record<string, number> = {};

    for (const row of engineRows) {
      byEngine[row.engine] = row.count;
    }

    return {
      total: summary?.total ?? 0,
      by_engine: byEngine,
      avg_cost: Number(summary?.avg_cost ?? 0),
    };
  }

  close(): void {
    this.db.close();
  }
}

function mapPromptRecord(row: unknown): PromptRecord {
  const record = row as Record<string, unknown>;

  return {
    id: String(record["id"] ?? ""),
    timestamp: String(record["timestamp"] ?? ""),
    engine: String(record["engine"] ?? ""),
    prompt_text: String(record["prompt_text"] ?? ""),
    request_id: String(record["request_id"] ?? ""),
    platform: String(record["platform"] ?? ""),
    ...(record["corner"] ? { corner: String(record["corner"]) } : {}),
    duration_sec: Number(record["duration_sec"] ?? 0),
    cost_usd: Number(record["cost_usd"] ?? 0),
    ...(record["quality_score"] !== null && record["quality_score"] !== undefined
      ? { quality_score: Number(record["quality_score"]) }
      : {}),
    ...(record["micro_signals"] ? { micro_signals: String(record["micro_signals"]) } : {}),
  };
}
