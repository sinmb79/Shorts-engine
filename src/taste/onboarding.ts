import { buildTasteCatalogCounts, loadTasteCatalog } from "../taste-db/catalog-loader.js";
import type { TasteCatalog, TasteProfile } from "../taste-db/schema.js";
import { generateTasteProfile } from "./dna-generator.js";
import { saveTasteProfile } from "./profile-manager.js";
import type { TastePromptOption, TastePromptSession } from "./prompt-session.js";

export interface TasteOnboardingResult {
  profile: TasteProfile;
  profile_path: string;
  catalog_counts: ReturnType<typeof buildTasteCatalogCounts>;
}

function buildEntryOptions(entries: TasteCatalog["movies"]): TastePromptOption[] {
  return entries.map((entry) => ({
    value: entry.id,
    label: entry.year ? `${entry.title.en} (${entry.year})` : entry.title.en,
  }));
}

export async function runTasteOnboarding(
  session: TastePromptSession,
  options: {
    env?: NodeJS.ProcessEnv;
    catalog?: TasteCatalog;
    now?: Date;
  } = {},
): Promise<TasteOnboardingResult> {
  const catalog = options.catalog ?? await loadTasteCatalog(options.env);

  session.write("\nTaste onboarding builds a reusable Style DNA from what you already love.\n");
  session.write("Pick a small set of references. The engine will average them into one profile.\n");

  const movies = await session.askMultiSelect(
    "Pick 3-5 movies that feel close to your instinct.",
    buildEntryOptions(catalog.movies),
    { min: 3, max: 5 },
  );

  const visualStyles = await session.askMultiSelect(
    "Pick 2-3 visual styles you would happily publish under your own name.",
    buildEntryOptions(catalog.visual_styles),
    { min: 2, max: 3 },
  );

  const authors = await session.askMultiSelect(
    "Pick up to 3 authors or writers who match your narrative taste.",
    buildEntryOptions(catalog.authors),
    { min: 0, max: 3 },
  );

  const profile = generateTasteProfile(
    {
      movies,
      visual_styles: visualStyles,
      authors,
    },
    catalog,
    {
      ...(options.now ? { now: options.now } : {}),
    },
  );
  const profilePath = await saveTasteProfile(profile, options.env);

  return {
    profile,
    profile_path: profilePath,
    catalog_counts: buildTasteCatalogCounts(catalog),
  };
}
