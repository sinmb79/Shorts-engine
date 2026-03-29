// src/adapters/tts/openai-tts-adapter.ts
import type {
  TtsAdapter,
  TtsOptions,
  TtsRequest,
  TtsResult,
} from "./tts-adapter.js";

export class OpenAiTtsAdapter implements TtsAdapter {
  name = "openai_tts";

  async isAvailable(): Promise<boolean> {
    return Boolean(process.env["OPENAI_API_KEY"]);
  }

  async synthesize(
    _request: TtsRequest,
    options: TtsOptions,
  ): Promise<TtsResult> {
    if (options.dry_run) {
      return {
        status: "dry_run",
        metadata: { adapter: "openai_tts", dry_run: true },
      };
    }

    const apiKey = process.env["OPENAI_API_KEY"];
    if (!apiKey) {
      return {
        status: "error",
        error: "OPENAI_API_KEY is not set in environment",
        metadata: { adapter: "openai_tts" },
      };
    }

    // OpenAI TTS API 호출 구조
    // 실제 사용 시 아래 주석을 해제하고 API 키를 .env에 추가하세요.
    //
    // const voice = request.voice_style === "dramatic" ? "onyx" : "nova";
    // const response = await fetch("https://api.openai.com/v1/audio/speech", {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${apiKey}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     model: "tts-1",
    //     input: request.text,
    //     voice,
    //   }),
    // });
    // const buffer = await response.arrayBuffer();
    // const outputPath = `${options.output_dir ?? "."}/tts-output.mp3`;
    // await writeFile(outputPath, Buffer.from(buffer));
    // return {
    //   status: "success",
    //   output_path: outputPath,
    //   metadata: { adapter: "openai_tts", voice },
    // };

    return {
      status: "dry_run",
      metadata: {
        adapter: "openai_tts",
        note: "Add OPENAI_API_KEY to .env and uncomment the fetch call above",
      },
    };
  }
}
