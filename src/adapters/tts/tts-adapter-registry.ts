// src/adapters/tts/tts-adapter-registry.ts
import type { ExecutionBackend } from "../../domain/contracts.js";
import type { TtsAdapter } from "./tts-adapter.js";
import { ElevenLabsAdapter } from "./elevenlabs-adapter.js";
import { GoogleTtsAdapter } from "./google-tts-adapter.js";
import { LocalTtsAdapter } from "./local-tts-adapter.js";
import { OpenAiTtsAdapter } from "./openai-tts-adapter.js";

// TTS_ADAPTER_REGISTRY includes "elevenlabs", "openai_tts", "google_tts" for
// internal use by the "premium" and "sora" cascades in resolveTtsAdapter.
// They are not direct ExecutionBackend values.
export const TTS_ADAPTER_REGISTRY: Record<string, TtsAdapter> = {
  local: new LocalTtsAdapter(),
  elevenlabs: new ElevenLabsAdapter(),
  openai_tts: new OpenAiTtsAdapter(),
  google_tts: new GoogleTtsAdapter(),
};

const local = TTS_ADAPTER_REGISTRY["local"]!;

export async function resolveTtsAdapter(
  backend: ExecutionBackend,
): Promise<TtsAdapter> {
  switch (backend) {
    case "local":
    case "gpu":
    case "cache":
      return local;

    case "sora": {
      const openai = TTS_ADAPTER_REGISTRY["openai_tts"]!;
      return (await openai.isAvailable()) ? openai : local;
    }

    case "premium": {
      const elevenlabs = TTS_ADAPTER_REGISTRY["elevenlabs"]!;
      if (await elevenlabs.isAvailable()) return elevenlabs;
      const openai = TTS_ADAPTER_REGISTRY["openai_tts"]!;
      if (await openai.isAvailable()) return openai;
      const google = TTS_ADAPTER_REGISTRY["google_tts"]!;
      if (await google.isAvailable()) return google;
      return local;
    }

    default:
      return local;
  }
}
