import type { ExecutionBackend } from "../../domain/contracts.js";
import type { VideoGenerationAdapter } from "./video-generation-adapter.js";
import { KlingAdapter } from "./kling-adapter.js";
import { LocalAdapter } from "./local-adapter.js";
import { RunwayAdapter } from "./runway-adapter.js";
import { SeedanceAdapter } from "./seedance-adapter.js";
import { VeoAdapter } from "./veo-adapter.js";

// ADAPTER_REGISTRY includes "runway" and "kling" for internal use by the "premium"
// cascade in resolveAdapter. They are not direct ExecutionBackend values.
export const ADAPTER_REGISTRY: Record<string, VideoGenerationAdapter> = {
  local: new LocalAdapter(),
  runway: new RunwayAdapter(),
  kling: new KlingAdapter(),
  veo3: new VeoAdapter(),
  seedance2: new SeedanceAdapter(),
};

const local = ADAPTER_REGISTRY["local"]!;

export async function resolveAdapter(
  backend: ExecutionBackend,
): Promise<VideoGenerationAdapter> {
  switch (backend) {
    case "local":
    case "gpu":
    case "cache":
      return local;

    case "sora": {
      return local;
    }

    case "premium": {
      const kling = ADAPTER_REGISTRY["kling"]!;
      if (await kling.isAvailable()) return kling;
      const veo = ADAPTER_REGISTRY["veo3"]!;
      if (await veo.isAvailable()) return veo;
      const seedance = ADAPTER_REGISTRY["seedance2"]!;
      if (await seedance.isAvailable()) return seedance;
      const runway = ADAPTER_REGISTRY["runway"]!;
      if (await runway.isAvailable()) return runway;
      return local;
    }

    default:
      return local;
  }
}
