import type { TasteCatalogCounts, TasteEntry, TasteProfile } from "../taste-db/schema.js";
import type { DnaAdjustment } from "../quality/dna-refiner.js";

export const TASTE_SCHEMA_VERSION = "0.2.0";

export type TasteCommandAction =
  | "saved_profile"
  | "show_profile"
  | "reset_profile"
  | "add_custom_entry"
  | "refined_profile";

export interface TasteCommandOutput {
  schema_version: string;
  action: TasteCommandAction;
  profile: TasteProfile | null;
  profile_path: string;
  catalog_counts?: TasteCatalogCounts;
  removed?: boolean;
  custom_entry?: TasteEntry;
  custom_entries_path?: string;
  adjustments?: DnaAdjustment[];
  considered_feedback?: number;
}
