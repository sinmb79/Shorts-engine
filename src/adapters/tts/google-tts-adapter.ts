// src/adapters/tts/google-tts-adapter.ts
import type {
  TtsAdapter,
  TtsOptions,
  TtsRequest,
  TtsResult,
} from "./tts-adapter.js";

export class GoogleTtsAdapter implements TtsAdapter {
  name = "google_tts";

  async isAvailable(): Promise<boolean> {
    return Boolean(process.env["GOOGLE_TTS_API_KEY"]);
  }

  async synthesize(
    _request: TtsRequest,
    options: TtsOptions,
  ): Promise<TtsResult> {
    if (options.dry_run) {
      return {
        status: "dry_run",
        metadata: { adapter: "google_tts", dry_run: true },
      };
    }

    const apiKey = process.env["GOOGLE_TTS_API_KEY"];
    if (!apiKey) {
      return {
        status: "error",
        error: "GOOGLE_TTS_API_KEY is not set in environment",
        metadata: { adapter: "google_tts" },
      };
    }

    // Google Cloud TTS API 호출 구조
    // 실제 사용 시 아래 주석을 해제하고 API 키를 .env에 추가하세요.
    //
    // const langCode = request.language === "ko" ? "ko-KR" : "en-US";
    // const response = await fetch(
    //   `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    //   {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       input: { text: request.text },
    //       voice: { languageCode: langCode, ssmlGender: "NEUTRAL" },
    //       audioConfig: { audioEncoding: "MP3" },
    //     }),
    //   },
    // );
    // const data = await response.json() as { audioContent: string };
    // const outputPath = `${options.output_dir ?? "."}/tts-output.mp3`;
    // await writeFile(outputPath, Buffer.from(data.audioContent, "base64"));
    // return {
    //   status: "success",
    //   output_path: outputPath,
    //   metadata: { adapter: "google_tts", language_code: langCode },
    // };

    return {
      status: "dry_run",
      metadata: {
        adapter: "google_tts",
        note: "Add GOOGLE_TTS_API_KEY to .env and uncomment the fetch call above",
      },
    };
  }
}
