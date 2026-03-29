// src/adapters/tts/elevenlabs-adapter.ts
import type {
  TtsAdapter,
  TtsOptions,
  TtsRequest,
  TtsResult,
} from "./tts-adapter.js";

export class ElevenLabsAdapter implements TtsAdapter {
  name = "elevenlabs";

  async isAvailable(): Promise<boolean> {
    return Boolean(process.env["ELEVENLABS_API_KEY"]);
  }

  async synthesize(
    _request: TtsRequest,
    options: TtsOptions,
  ): Promise<TtsResult> {
    if (options.dry_run) {
      return {
        status: "dry_run",
        metadata: { adapter: "elevenlabs", dry_run: true },
      };
    }

    const apiKey = process.env["ELEVENLABS_API_KEY"];
    if (!apiKey) {
      return {
        status: "error",
        error: "ELEVENLABS_API_KEY is not set in environment",
        metadata: { adapter: "elevenlabs" },
      };
    }

    // ElevenLabs TTS API 호출 구조
    // 실제 사용 시 아래 주석을 해제하고 API 키를 .env에 추가하세요.
    //
    // const voiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel (기본 음성)
    // const response = await fetch(
    //   `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    //   {
    //     method: "POST",
    //     headers: {
    //       "xi-api-key": apiKey,
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       text: request.text,
    //       model_id: "eleven_multilingual_v2",
    //       voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    //     }),
    //   },
    // );
    // const buffer = await response.arrayBuffer();
    // const outputPath = `${options.output_dir ?? "."}/tts-output.mp3`;
    // await writeFile(outputPath, Buffer.from(buffer));
    // return {
    //   status: "success",
    //   output_path: outputPath,
    //   metadata: { adapter: "elevenlabs", voice_id: voiceId },
    // };

    return {
      status: "dry_run",
      metadata: {
        adapter: "elevenlabs",
        note: "Add ELEVENLABS_API_KEY to .env and uncomment the fetch call above",
      },
    };
  }
}
