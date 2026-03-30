import type {
  VideoGenerationAdapter,
  VideoGenerationOptions,
  VideoGenerationPrompt,
  VideoGenerationResult,
} from "./video-generation-adapter.js";

export class SeedanceAdapter implements VideoGenerationAdapter {
  name = "seedance2";

  async isAvailable(): Promise<boolean> {
    return Boolean(process.env["FAL_API_KEY"]);
  }

  async generate(
    prompt: VideoGenerationPrompt,
    options: VideoGenerationOptions,
  ): Promise<VideoGenerationResult> {
    if (options.dry_run) {
      return {
        status: "dry_run",
        metadata: { adapter: "seedance2", dry_run: true },
      };
    }

    const apiKey = process.env["FAL_API_KEY"];
    if (!apiKey) {
      return {
        status: "error",
        error: "FAL_API_KEY is not set in environment",
        metadata: { adapter: "seedance2" },
      };
    }

    return {
      status: "dry_run",
      metadata: {
        adapter: "seedance2",
        model: "seedance-2.0",
        note: "Add FAL_API_KEY to .env and implement the fal.ai Seedance request",
        duration_sec: prompt.duration_sec,
      },
    };
  }
}
