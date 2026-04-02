import type { PlanningContext } from "../cli/resolve-planning-context.js";
import { recordGeneratedScenario } from "./quality-db.js";

export async function persistGeneratedScenario(
  context: PlanningContext,
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  try {
    await recordGeneratedScenario(context, env);
  } catch {
    return;
  }
}
