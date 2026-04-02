import { readFile } from "node:fs/promises";

import { loadCustomEntries } from "../taste/profile-manager.js";
import {
  assertValidTasteEntries,
  type TasteCatalog,
  type TasteCatalogCounts,
  type TasteEntry,
} from "./schema.js";

async function loadCatalogFile(relativePath: string): Promise<TasteEntry[]> {
  const fileUrl = new URL(relativePath, import.meta.url);
  const raw = await readFile(fileUrl, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  assertValidTasteEntries(parsed, relativePath);
  return structuredClone(parsed);
}

function dedupeEntries(entries: TasteEntry[]): TasteEntry[] {
  const seen = new Set<string>();
  const deduped: TasteEntry[] = [];

  for (const entry of entries) {
    if (seen.has(entry.id)) {
      continue;
    }

    seen.add(entry.id);
    deduped.push(entry);
  }

  return deduped;
}

export async function loadTasteCatalog(
  env: NodeJS.ProcessEnv = process.env,
): Promise<TasteCatalog> {
  const [movieEntries, visualStyleEntries, authorEntries, seededCustomEntries, storedCustomEntries] =
    await Promise.all([
      loadCatalogFile("./movies/catalog.json"),
      loadCatalogFile("./visual-styles/catalog.json"),
      loadCatalogFile("./authors/catalog.json"),
      loadCatalogFile("./custom/user-added.json"),
      loadCustomEntries(env),
    ]);

  const customEntries = dedupeEntries([...seededCustomEntries, ...storedCustomEntries]);
  const customMovies = customEntries.filter((entry) => entry.category === "movie");
  const customVisualStyles = customEntries.filter((entry) => entry.category === "visual_style");
  const customAuthors = customEntries.filter((entry) => entry.category === "author");

  const movies = dedupeEntries([...movieEntries, ...customMovies]);
  const visual_styles = dedupeEntries([...visualStyleEntries, ...customVisualStyles]);
  const authors = dedupeEntries([...authorEntries, ...customAuthors]);
  const all = dedupeEntries([...movies, ...visual_styles, ...authors, ...customEntries]);

  return {
    movies,
    visual_styles,
    authors,
    custom: customEntries,
    all,
  };
}

export function buildTasteCatalogCounts(catalog: TasteCatalog): TasteCatalogCounts {
  return {
    movies: catalog.movies.length,
    visual_styles: catalog.visual_styles.length,
    authors: catalog.authors.length,
    custom: catalog.custom.length,
    total: catalog.all.length,
  };
}

export function findTasteEntryById(
  catalog: TasteCatalog,
  id: string,
): TasteEntry | null {
  return catalog.all.find((entry) => entry.id === id) ?? null;
}
