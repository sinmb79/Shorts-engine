import type {
  TtsAdapter,
  TtsOptions,
  TtsRequest,
  TtsResult,
} from "./tts-adapter.js";

export class LocalTtsAdapter implements TtsAdapter {
  name = "local";

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async synthesize(
    request: TtsRequest,
    _options: TtsOptions,
  ): Promise<TtsResult> {
    return {
      status: "dry_run",
      metadata: {
        adapter: "local",
        text_length: request.text.length,
        language: request.language,
        voice_style: request.voice_style,
        duration_hint_sec: request.duration_hint_sec,
      },
    };
  }
}
