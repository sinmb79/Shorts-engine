import { loadTasteCatalog } from "../../src/taste-db/catalog-loader.js";
import { generateTasteProfile } from "../../src/taste/dna-generator.js";
import { saveTasteProfile } from "../../src/taste/profile-manager.js";

export async function seedTasteProfile(
  env: NodeJS.ProcessEnv,
  options: {
    profile_id?: string;
    movies?: string[];
    visual_styles?: string[];
    authors?: string[];
  } = {},
) {
  const catalog = await loadTasteCatalog(env);
  const profile = generateTasteProfile(
    {
      movies: options.movies ?? ["grand_budapest_hotel", "amelie", "spirited_away"],
      visual_styles: options.visual_styles ?? ["ghibli_dreamscape", "luxury_editorial"],
      authors: options.authors ?? ["paulo_coelho_books"],
    },
    catalog,
    {
      now: new Date("2026-04-02T00:00:00.000Z"),
      profile_id: options.profile_id ?? "taste_cli_integration",
    },
  );

  await saveTasteProfile(profile, env);
  return profile;
}
