import type {
  VideoGenerationAdapter,
  VideoGenerationOptions,
  VideoGenerationPrompt,
  VideoGenerationResult,
} from "./video-generation-adapter.js";

export class VeoAdapter implements VideoGenerationAdapter {
  name = "veo3";

  async isAvailable(): Promise<boolean> {
    return Boolean(process.env["GEMINI_API_KEY"]);
  }

  async generate(
    prompt: VideoGenerationPrompt,
    options: VideoGenerationOptions,
  ): Promise<VideoGenerationResult> {
    if (options.dry_run) {
      return {
        status: "dry_run",
        metadata: { adapter: "veo3", dry_run: true },
      };
    }

    const apiKey = process.env["GEMINI_API_KEY"];
    if (!apiKey) {
      return {
        status: "error",
        error: "GEMINI_API_KEY is not set in environment",
        metadata: { adapter: "veo3" },
      };
    }

    return {
      status: "dry_run",
      metadata: {
        adapter: "veo3",
        model: "veo-3.1",
        note: "Add GEMINI_API_KEY to .env and implement the Veo generateContent call",
        duration_sec: prompt.duration_sec,
      },
    };
  }
}
