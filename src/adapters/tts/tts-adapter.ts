// src/adapters/tts/tts-adapter.ts

export type VoiceStyle = "neutral" | "energetic" | "dramatic";

export interface TtsRequest {
  text: string;
  language: string;
  voice_style: VoiceStyle;
  duration_hint_sec: number;
}

export interface TtsResult {
  status: "success" | "error" | "dry_run";
  output_path?: string;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface TtsOptions {
  dry_run: boolean;
  output_dir?: string;
}

export interface TtsAdapter {
  name: string;
  isAvailable(): Promise<boolean>;
  synthesize(request: TtsRequest, options: TtsOptions): Promise<TtsResult>;
}
