import { loadTasteProfile, saveTasteProfile } from "../taste/profile-manager.js";
import type { TasteProfile } from "../taste-db/schema.js";
import type { FeedbackRecord } from "./quality-db.js";
import { listFeedbackRecords } from "./quality-db.js";

export interface DnaAdjustment {
  kind:
    | "director_weight"
    | "writer_weight"
    | "editing_pace"
    | "camera_movement"
    | "color_saturation"
    | "hook_type";
  target: string;
  delta: number | string;
  reason: string;
}

export interface DnaRefinementResult {
  applied: boolean;
  profile: TasteProfile | null;
  adjustments: DnaAdjustment[];
  considered_feedback: number;
}

interface KeywordRule {
  pattern: RegExp;
  apply: (profile: TasteProfile, adjustments: DnaAdjustment[]) => void;
}

const KEYWORD_RULES: KeywordRule[] = [
  {
    pattern: /too slow|needs pace|more pace|drag|sluggish|more momentum/i,
    apply(profile, adjustments) {
      bumpNumber(profile, ["computed_dna", "editing", "pace"], 0.05, adjustments, "editing_pace", "editing.pace", "feedback requested more speed");
      bumpNumber(profile, ["computed_dna", "camera", "movement_energy"], 0.05, adjustments, "camera_movement", "camera.movement_energy", "feedback requested more kinetic motion");
      bumpWeight(profile.nearest_presets.directors, "edgar_wright", 0.05, adjustments, "director_weight", "feedback requested more momentum");
    },
  },
  {
    pattern: /too fast|too chaotic|too busy|too loud|calmer|more calm|more quiet/i,
    apply(profile, adjustments) {
      bumpNumber(profile, ["computed_dna", "editing", "pace"], -0.05, adjustments, "editing_pace", "editing.pace", "feedback requested calmer pacing");
      bumpNumber(profile, ["computed_dna", "camera", "movement_energy"], -0.05, adjustments, "camera_movement", "camera.movement_energy", "feedback requested calmer motion");
      bumpWeight(profile.nearest_presets.directors, "wes_anderson", 0.05, adjustments, "director_weight", "feedback requested calmer visual control");
      bumpWeight(profile.nearest_presets.writers, "noh_hee_kyung", 0.05, adjustments, "writer_weight", "feedback requested quieter emotional tone");
    },
  },
  {
    pattern: /symmetry|storybook|tableau|precise|ordered/i,
    apply(profile, adjustments) {
      bumpWeight(profile.nearest_presets.directors, "wes_anderson", 0.05, adjustments, "director_weight", "feedback mentioned symmetry or precision");
    },
  },
  {
    pattern: /kinetic|rhythm|snap|percussive|momentum/i,
    apply(profile, adjustments) {
      bumpWeight(profile.nearest_presets.directors, "edgar_wright", 0.05, adjustments, "director_weight", "feedback mentioned kinetic rhythm");
    },
  },
  {
    pattern: /nolan|epic|scale|imax/i,
    apply(profile, adjustments) {
      bumpWeight(profile.nearest_presets.directors, "christopher_nolan", 0.05, adjustments, "director_weight", "feedback requested more epic scale");
    },
  },
  {
    pattern: /warm|tender|human|healing/i,
    apply(profile, adjustments) {
      bumpWeight(profile.nearest_presets.writers, "noh_hee_kyung", 0.05, adjustments, "writer_weight", "feedback requested warmer human tone");
      bumpNumber(profile, ["computed_dna", "color", "saturation"], 0.03, adjustments, "color_saturation", "color.saturation", "feedback requested warmer color energy");
    },
  },
  {
    pattern: /mystery|question|reveal|clue/i,
    apply(profile, adjustments) {
      bumpWeight(profile.nearest_presets.writers, "agatha_christie", 0.05, adjustments, "writer_weight", "feedback requested stronger mystery structure");
      setHookType(profile, "mystery_question", adjustments, "feedback requested a sharper mystery hook");
    },
  },
  {
    pattern: /coelho|parable|spiritual|destiny/i,
    apply(profile, adjustments) {
      bumpWeight(profile.nearest_presets.writers, "paulo_coelho", 0.05, adjustments, "writer_weight", "feedback requested a more parable-like voice");
    },
  },
];

export async function refineTasteProfileFromFeedback(
  env: NodeJS.ProcessEnv = process.env,
  options: { force?: boolean } = {},
): Promise<DnaRefinementResult> {
  const profile = await loadTasteProfile(env);
  if (!profile) {
    return {
      applied: false,
      profile: null,
      adjustments: [],
      considered_feedback: 0,
    };
  }

  const feedback = await listFeedbackRecords(env);
  const relevantFeedback = selectRelevantFeedback(feedback);

  if (!options.force && (feedback.length < 10 || relevantFeedback.length === 0)) {
    return {
      applied: false,
      profile,
      adjustments: [],
      considered_feedback: relevantFeedback.length,
    };
  }

  const nextProfile = structuredClone(profile);
  const adjustments: DnaAdjustment[] = [];

  for (const record of relevantFeedback) {
    const lines = [...record.good_aspects, ...record.bad_aspects];
    for (const line of lines) {
      for (const rule of KEYWORD_RULES) {
        if (rule.pattern.test(line)) {
          rule.apply(nextProfile, adjustments);
        }
      }
    }

    if (record.taste_match === false && record.bad_aspects.length === 0) {
      bumpWeight(nextProfile.nearest_presets.directors, "wes_anderson", 0.03, adjustments, "director_weight", "taste mismatch without details favored safer refinement");
    }
  }

  if (adjustments.length === 0) {
    return {
      applied: false,
      profile,
      adjustments,
      considered_feedback: relevantFeedback.length,
    };
  }

  nextProfile.updated_at = new Date().toISOString();
  await saveTasteProfile(nextProfile, env);

  return {
    applied: true,
    profile: nextProfile,
    adjustments,
    considered_feedback: relevantFeedback.length,
  };
}

function selectRelevantFeedback(feedback: FeedbackRecord[]): FeedbackRecord[] {
  return feedback
    .filter((record) => {
      return record.taste_match === false
        || record.good_aspects.length > 0
        || record.bad_aspects.length > 0;
    })
    .slice(0, 20);
}

function bumpWeight(
  weights: Record<string, number>,
  key: string,
  delta: number,
  adjustments: DnaAdjustment[],
  kind: DnaAdjustment["kind"],
  reason: string,
) {
  weights[key] = clampUnit((weights[key] ?? 0) + delta);
  adjustments.push({
    kind,
    target: key,
    delta: roundDelta(delta),
    reason,
  });
}

function bumpNumber(
  profile: TasteProfile,
  path: ["computed_dna", "editing", "pace"] | ["computed_dna", "camera", "movement_energy"] | ["computed_dna", "color", "saturation"],
  delta: number,
  adjustments: DnaAdjustment[],
  kind: DnaAdjustment["kind"],
  target: string,
  reason: string,
) {
  const current =
    path[1] === "editing"
      ? profile.computed_dna.editing.pace
      : path[1] === "camera"
        ? profile.computed_dna.camera.movement_energy
        : profile.computed_dna.color.saturation;
  const next = clampUnit(current + delta);

  if (path[1] === "editing") {
    profile.computed_dna.editing.pace = next;
  } else if (path[1] === "camera") {
    profile.computed_dna.camera.movement_energy = next;
  } else {
    profile.computed_dna.color.saturation = next;
  }

  adjustments.push({
    kind,
    target,
    delta: roundDelta(delta),
    reason,
  });
}

function setHookType(
  profile: TasteProfile,
  hookType: string,
  adjustments: DnaAdjustment[],
  reason: string,
) {
  profile.computed_dna.hook.type = hookType;
  adjustments.push({
    kind: "hook_type",
    target: "computed_dna.hook.type",
    delta: hookType,
    reason,
  });
}

function clampUnit(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(3));
}

function roundDelta(value: number): number {
  return Number(value.toFixed(3));
}
