import { mkdir } from "node:fs/promises";
import * as path from "node:path";
import { spawn } from "node:child_process";

import type { TtsAdapter, TtsOptions, TtsRequest, TtsResult } from "./tts-adapter.js";

export class EdgeTtsAdapter implements TtsAdapter {
  name = "edge_tts";

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async synthesize(
    request: TtsRequest,
    options: TtsOptions,
  ): Promise<TtsResult> {
    if (options.dry_run) {
      return {
        status: "dry_run",
        metadata: {
          adapter: this.name,
          text_length: request.text.length,
          language: request.language,
          voice_style: request.voice_style,
          duration_hint_sec: request.duration_hint_sec,
        },
      };
    }

    if (process.platform !== "win32") {
      return {
        status: "error",
        error: "edge_tts_requires_windows_runtime",
        metadata: {
          adapter: this.name,
        },
      };
    }

    const outputDir = options.output_dir ?? path.resolve(process.cwd(), "data", "tts");
    await mkdir(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, `edge-tts-${Date.now()}.wav`);

    const command = [
      "[System.Reflection.Assembly]::LoadWithPartialName('System.Speech') | Out-Null",
      "$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer",
      `$synth.Rate = ${resolveRate(request.voice_style)}`,
      `$synth.SetOutputToWaveFile(${JSON.stringify(outputPath)})`,
      `$synth.Speak(${JSON.stringify(request.text)})`,
      "$synth.Dispose()",
    ].join("; ");

    const exitCode = await new Promise<number>((resolve, reject) => {
      const child = spawn(
        "powershell",
        ["-NoProfile", "-Command", command],
        { stdio: "ignore" },
      );

      child.once("error", reject);
      child.once("exit", (code) => resolve(code ?? 1));
    });

    if (exitCode !== 0) {
      return {
        status: "error",
        error: `edge_tts_failed_with_exit_code_${exitCode}`,
        metadata: {
          adapter: this.name,
        },
      };
    }

    return {
      status: "success",
      output_path: outputPath,
      metadata: {
        adapter: this.name,
        language: request.language,
        voice_style: request.voice_style,
      },
    };
  }
}

function resolveRate(voiceStyle: TtsRequest["voice_style"]): number {
  switch (voiceStyle) {
    case "energetic":
      return 1;
    case "dramatic":
      return -1;
    case "neutral":
    default:
      return 0;
  }
}
