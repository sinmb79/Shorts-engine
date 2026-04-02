import { mkdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import * as path from "node:path";

import type { PlanningContext } from "../cli/resolve-planning-context.js";
import { resolveShortsEngineHomeDir } from "../taste/profile-manager.js";

export interface QualityPaths {
  home_dir: string;
  db_path: string;
  block_scores_path: string;
  verified_combos_path: string;
}

export interface GeneratedScenarioRecord {
  scenario_id: string;
  taste_profile_id: string | null;
  blocks_used: string[];
  style_source: "request_only" | "taste_profile";
  director_anchor: string | null;
  writer_anchor: string | null;
  quality_gate_score: number;
  generated_at: string;
}

export interface FeedbackRecord {
  id: number;
  scenario_id: string;
  taste_profile_id: string | null;
  blocks_used: string[];
  overall_score: number;
  good_aspects: string[];
  bad_aspects: string[];
  taste_match: boolean | null;
  created_at: string;
}

export interface FeedbackInsertInput {
  scenario_id: string;
  overall_score: number;
  good_aspects: string[];
  bad_aspects: string[];
  taste_match: boolean | null;
  created_at?: string;
}

interface GeneratedScenarioRow {
  scenario_id: string;
  taste_profile_id: string | null;
  blocks_used: string;
  style_source: "request_only" | "taste_profile";
  director_anchor: string | null;
  writer_anchor: string | null;
  quality_gate_score: number;
  generated_at: string;
}

interface FeedbackRow {
  id: number;
  scenario_id: string;
  taste_profile_id: string | null;
  blocks_used: string;
  overall_score: number;
  good_aspects: string;
  bad_aspects: string;
  taste_match: number | null;
  created_at: string;
}

export function resolveQualityPaths(env: NodeJS.ProcessEnv = process.env): QualityPaths {
  const homeDir = resolveShortsEngineHomeDir(env);
  return {
    home_dir: homeDir,
    db_path: path.join(homeDir, "quality.db"),
    block_scores_path: path.join(homeDir, "block-scores.json"),
    verified_combos_path: path.join(homeDir, "verified-combos.json"),
  };
}

export async function ensureQualityHomeDir(
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  await mkdir(resolveQualityPaths(env).home_dir, { recursive: true });
}

export async function recordGeneratedScenario(
  context: PlanningContext,
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  await ensureQualityHomeDir(env);
  const db = openQualityDatabase(env);

  try {
    const record: GeneratedScenarioRecord = {
      scenario_id: context.scenario_plan.scenario_id,
      taste_profile_id: context.style_resolution.taste_profile_id,
      blocks_used: [...context.scenario_plan.blocks_used],
      style_source: context.scenario_plan.source,
      director_anchor: context.scenario_plan.director_anchor,
      writer_anchor: context.scenario_plan.writer_anchor,
      quality_gate_score: context.quality_gate.overall_score,
      generated_at: new Date().toISOString(),
    };

    db.prepare(
      `
        INSERT INTO generated_scenarios (
          scenario_id,
          taste_profile_id,
          blocks_used,
          style_source,
          director_anchor,
          writer_anchor,
          quality_gate_score,
          generated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(scenario_id) DO UPDATE SET
          taste_profile_id = excluded.taste_profile_id,
          blocks_used = excluded.blocks_used,
          style_source = excluded.style_source,
          director_anchor = excluded.director_anchor,
          writer_anchor = excluded.writer_anchor,
          quality_gate_score = excluded.quality_gate_score,
          generated_at = excluded.generated_at
      `,
    ).run(
      record.scenario_id,
      record.taste_profile_id,
      JSON.stringify(record.blocks_used),
      record.style_source,
      record.director_anchor,
      record.writer_anchor,
      record.quality_gate_score,
      record.generated_at,
    );
  } finally {
    db.close();
  }
}

export async function loadGeneratedScenario(
  scenarioId: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<GeneratedScenarioRecord | null> {
  await ensureQualityHomeDir(env);
  const db = openQualityDatabase(env);

  try {
    const row = db
      .prepare(
        `
          SELECT
            scenario_id,
            taste_profile_id,
            blocks_used,
            style_source,
            director_anchor,
            writer_anchor,
            quality_gate_score,
            generated_at
          FROM generated_scenarios
          WHERE scenario_id = ?
        `,
      )
      .get(scenarioId) as GeneratedScenarioRow | undefined;

    return row ? mapGeneratedScenarioRow(row) : null;
  } finally {
    db.close();
  }
}

export async function insertFeedbackRecord(
  input: FeedbackInsertInput,
  env: NodeJS.ProcessEnv = process.env,
): Promise<FeedbackRecord> {
  await ensureQualityHomeDir(env);
  const db = openQualityDatabase(env);

  try {
    const scenario = db
      .prepare(
        `
          SELECT
            scenario_id,
            taste_profile_id,
            blocks_used,
            style_source,
            director_anchor,
            writer_anchor,
            quality_gate_score,
            generated_at
          FROM generated_scenarios
          WHERE scenario_id = ?
        `,
      )
      .get(input.scenario_id) as GeneratedScenarioRow | undefined;

    if (!scenario) {
      throw new Error(`Unknown scenario_id: ${input.scenario_id}`);
    }

    const createdAt = input.created_at ?? new Date().toISOString();
    const result = db
      .prepare(
        `
          INSERT INTO feedback_entries (
            scenario_id,
            taste_profile_id,
            blocks_used,
            overall_score,
            good_aspects,
            bad_aspects,
            taste_match,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        input.scenario_id,
        scenario.taste_profile_id,
        scenario.blocks_used,
        input.overall_score,
        JSON.stringify(input.good_aspects),
        JSON.stringify(input.bad_aspects),
        input.taste_match === null ? null : input.taste_match ? 1 : 0,
        createdAt,
      );

    const inserted = db
      .prepare(
        `
          SELECT
            id,
            scenario_id,
            taste_profile_id,
            blocks_used,
            overall_score,
            good_aspects,
            bad_aspects,
            taste_match,
            created_at
          FROM feedback_entries
          WHERE id = ?
        `,
      )
      .get(Number(result.lastInsertRowid)) as FeedbackRow | undefined;

    if (!inserted) {
      throw new Error("Failed to load inserted feedback record.");
    }

    return mapFeedbackRow(inserted);
  } finally {
    db.close();
  }
}

export async function listFeedbackRecords(
  env: NodeJS.ProcessEnv = process.env,
): Promise<FeedbackRecord[]> {
  await ensureQualityHomeDir(env);
  const db = openQualityDatabase(env);

  try {
    const rows = db
      .prepare(
        `
          SELECT
            id,
            scenario_id,
            taste_profile_id,
            blocks_used,
            overall_score,
            good_aspects,
            bad_aspects,
            taste_match,
            created_at
          FROM feedback_entries
          ORDER BY created_at DESC, id DESC
        `,
      )
      .all() as unknown as FeedbackRow[];

    return rows.map(mapFeedbackRow);
  } finally {
    db.close();
  }
}

export async function countGeneratedScenarios(
  env: NodeJS.ProcessEnv = process.env,
): Promise<number> {
  await ensureQualityHomeDir(env);
  const db = openQualityDatabase(env);

  try {
    const row = db
      .prepare(`SELECT COUNT(*) AS count FROM generated_scenarios`)
      .get() as { count: number } | undefined;

    return row?.count ?? 0;
  } finally {
    db.close();
  }
}

function openQualityDatabase(env: NodeJS.ProcessEnv): DatabaseSync {
  const db = new DatabaseSync(resolveQualityPaths(env).db_path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS generated_scenarios (
      scenario_id TEXT PRIMARY KEY,
      taste_profile_id TEXT,
      blocks_used TEXT NOT NULL,
      style_source TEXT NOT NULL,
      director_anchor TEXT,
      writer_anchor TEXT,
      quality_gate_score REAL NOT NULL,
      generated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS feedback_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scenario_id TEXT NOT NULL,
      taste_profile_id TEXT,
      blocks_used TEXT NOT NULL,
      overall_score REAL NOT NULL,
      good_aspects TEXT NOT NULL,
      bad_aspects TEXT NOT NULL,
      taste_match INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY(scenario_id) REFERENCES generated_scenarios(scenario_id)
    );
  `);
  return db;
}

function mapGeneratedScenarioRow(row: GeneratedScenarioRow): GeneratedScenarioRecord {
  return {
    scenario_id: row.scenario_id,
    taste_profile_id: row.taste_profile_id,
    blocks_used: parseStringArray(row.blocks_used),
    style_source: row.style_source,
    director_anchor: row.director_anchor,
    writer_anchor: row.writer_anchor,
    quality_gate_score: row.quality_gate_score,
    generated_at: row.generated_at,
  };
}

function mapFeedbackRow(row: FeedbackRow): FeedbackRecord {
  return {
    id: row.id,
    scenario_id: row.scenario_id,
    taste_profile_id: row.taste_profile_id,
    blocks_used: parseStringArray(row.blocks_used),
    overall_score: row.overall_score,
    good_aspects: parseStringArray(row.good_aspects),
    bad_aspects: parseStringArray(row.bad_aspects),
    taste_match:
      row.taste_match === null ? null : row.taste_match === 1,
    created_at: row.created_at,
  };
}

function parseStringArray(raw: string): string[] {
  const parsed = JSON.parse(raw) as unknown;
  return Array.isArray(parsed)
    ? parsed.filter((value): value is string => typeof value === "string")
    : [];
}
