# Shorts Operating Engine — Master Plan v21 (Execution Spec)

## 0. Final Handoff Scope

This version converts the remaining conceptual gaps into **execution rules** for Codex CLI.

It adds:

- Prompt Schema (formal input/output contracts)
- Cost Routing Logic (quantified escalation rules)
- Error Recovery Policy (node-level retry/fallback/skip)
- Learning Cold-Start Flow (bootstrapped → adaptive → personalized)
- Novel → Shorts Pipeline (formalized)
- Motion Engine rules (minimum deterministic constraints)
- Semantic B-roll seed map (starter dataset)
- Platform Output Spec layer (YouTube / TikTok / Reels)

This is the **implementation handoff version**.

---

# 1. Prompt Layer — Formal Schema

## 1.1 Problem
The Smart Prompt Layer exists conceptually, but must be defined as a machine-readable contract.

## 1.2 Core Prompt Request Schema

```json
{
  "intent": {
    "topic": "AI meeting note tool",
    "subject": "young professional using laptop",
    "goal": "make a short-form explainer clip",
    "emotion": "curiosity and satisfaction",
    "platform": "youtube_shorts",
    "theme": "explainer",
    "duration_sec": 20
  },
  "constraints": {
    "language": "en",
    "budget_tier": "low",
    "quality_tier": "balanced",
    "visual_consistency_required": true,
    "content_policy_safe": true
  },
  "style": {
    "hook_type": "curiosity",
    "pacing_profile": "fast_cut",
    "caption_style": "tiktok_viral",
    "camera_language": "simple_push_in"
  },
  "backend": {
    "preferred_engine": "sora",
    "allow_fallback": true
  },
  "output": {
    "type": "video_prompt"
  }
}
```

## 1.3 Prompt Layer Stages

```text
Prompt Request
→ Intent Normalizer
→ Theme Injector
→ Tool Adapter
→ Formatter
→ Quality Checker
→ Prompt Result
```

## 1.4 Prompt Result Schema

```json
{
  "engine": "sora",
  "main_prompt": "Scene: ...",
  "negative_prompt": "",
  "style_descriptor": "",
  "warnings": [],
  "params": {
    "aspect_ratio": "9:16",
    "duration_sec": 8
  },
  "quality_score": 0.91
}
```

## 1.5 Hard rule
Every promptable step must consume and emit structured data.
No hidden free-form-only prompt building.

---

# 2. Cost Routing Logic — Quantified Rules

## 2.1 Routing objective
Use the cheapest backend that satisfies the task.

## 2.2 Escalation order

```text
1. cache
2. local model/runtime
3. rented GPU / remote machine
4. premium hosted API
```

## 2.3 Routing inputs
- candidate_score
- task_type
- expected_quality_gain
- estimated_cost
- retry_probability
- batch_size
- local availability
- GPU availability
- user budget policy

## 2.4 Deterministic rules

### Rule A — Low score should never trigger premium generation
```text
if candidate_score < 0.60:
    do_not_escalate_to_premium = true
```

### Rule B — Cache always wins
```text
if cache_hit == true:
    skip_generation = true
```

### Rule C — Batch jobs prefer rented GPU
```text
if batch_size >= 5 and gpu_available == true:
    prefer_gpu_batch = true
```

### Rule D — Premium only for final-value steps
```text
premium_allowed_for = [
  "final_script_refinement",
  "premium_tts",
  "high_value_video_generation",
  "final_polish"
]
```

### Rule E — Retry cost awareness
```text
if retry_cost > expected_value_gain:
    fallback_or_skip = true
```

## 2.5 Node-level cost metadata
Every node must report:
- estimated_cost
- actual_cost
- retry_cost
- cost_efficiency_score

---

# 3. Error Recovery Policy — DAG Execution Safety

## 3.1 Problem
A graph-based engine without failure rules cannot run reliably.

## 3.2 Node execution policy
Each node must declare:
- retry_count
- fallback_node
- skip_allowed
- failure_severity

## 3.3 Default recovery policy

### Standard nodes
- retry: 2 times
- then fallback: yes
- then skip: if low-risk

### High-value generation nodes
- retry: 1 time
- then fallback: cheaper alternative
- then stop branch if quality critical

## 3.4 Generic failure flow

```text
Node Failure
→ Retry (max N)
→ If still failing: fallback node
→ If fallback fails:
    - skip if non-critical
    - block pipeline if critical
```

## 3.5 Examples

### Example: premium TTS fails
```text
ElevenLabs fails
→ OpenAI TTS
→ local TTS
→ Edge TTS
```

### Example: premium video generation fails
```text
Sora fails
→ Runway/Kling/Veo if available
→ image+motion fallback
→ final FFmpeg slideshow fallback
```

### Example: stock fetch fails
```text
Pexels fails
→ Pixabay
→ internal asset library
→ placeholder visual pack
```

## 3.6 Pipeline status classes
- success
- success_with_fallback
- partial_success
- blocked
- skipped_low_priority

---

# 4. Learning Cold-Start Flow

## 4.1 Problem
“User edits → learning” alone fails for new users.

## 4.2 Three-phase learning model

### Phase 1 — Bootstrapped
- use public dataset priors
- use theme defaults
- use platform defaults
- personalization weight low

### Phase 2 — Adaptive
- blend user edits with priors
- track accepted / rejected suggestions
- adapt defaults gradually

### Phase 3 — Personalized
- user behavior dominates
- dataset priors remain only as backstop

## 4.3 Weight schedule

```text
Phase 1:
  dataset = 0.80
  user = 0.20

Phase 2:
  dataset = 0.50
  user = 0.50

Phase 3:
  dataset = 0.20
  user = 0.80
```

## 4.4 Trigger thresholds

```text
After 10 completed outputs:
  enable adaptive personalization

After 30 completed outputs:
  increase user-weighting

After 50 completed outputs:
  allow stronger auto-default updates
```

## 4.5 Cold-start fallback
If user history is insufficient:
- use global theme priors
- use niche priors if known
- use platform priors
- never assume personalization confidence is high

---

# 5. Novel → Shorts Pipeline (Formalized)

## 5.1 Problem
Novel is mentioned, but not connected as a real production branch.

## 5.2 Formal flow

```text
Novel Project
→ Episode
→ Scene Extraction
→ Highlight Candidate Selection
→ Hook Builder
→ Shorts Script
→ Prompt Layer
→ DAG Production
```

## 5.3 Novel-specific extraction fields
- episode_number
- scene_summary
- emotional_peak
- cliffhanger_strength
- character_focus
- visual_style_profile

## 5.4 Novel-to-shorts modes

### A. Cliffhanger Short
- purpose: attract next-episode interest
- hook: strongest unresolved moment
- duration: 20–35s

### B. Character Moment Short
- purpose: emotional engagement
- focus: one character / one choice
- duration: 15–25s

### C. Lore / Worldbuilding Short
- purpose: deepen story universe
- format: mini-explainer
- duration: 20–40s

## 5.5 Novel-specific QA
- scene coherence
- spoiler risk
- emotional payoff
- continuity with series tone

---

# 6. Motion Engine — Minimum Deterministic Rules

## 6.1 Problem
“Auto-rotation” without rules is not implementable.

## 6.2 Motion pattern list
- zoom_in
- zoom_out
- pan_left
- pan_right
- parallax
- rotate_slow
- glitch_transition

## 6.3 Hard rules

```text
- same motion cannot repeat 3 times in a row
- same pan direction cannot repeat more than 2 times
- hook segment must include at least 1 strong motion event
- every 5 seconds, visual motion must change at least once
- loop content should avoid excessive glitch motion
```

## 6.4 Motion selection logic
- theme-aware
- platform-aware
- user-preference-aware
- anti-repetition stateful history

---

# 7. Semantic B-roll Engine — Seed Map

## 7.1 Problem
A semantic engine needs a minimum starter vocabulary.

## 7.2 Seed concept map (starter set)

```text
시간절약 → hourglass / clock fast-forward / relaxing person / clean schedule
성장 → plant growing / sunrise / rocket launch / staircase upward
돈 → coin stack / wallet / piggy bank / revenue chart
비교 → balance scale / split screen / side-by-side desk
위험 → warning sign / cliff edge / storm clouds / red alert
무료 → gift box / unlocked door / open hands / bonus screen
AI → digital interface / code screen / glowing data flow / laptop automation
집중 → focused face / quiet desk / noise-cancelling headphones / dark room monitor
속도 → racing lines / stopwatch / fast typing / moving train
실패 → broken object / frustrated face / error screen / missed shot
성공 → celebration gesture / checkmark UI / handshake / upward chart
변화 → butterfly / doorway / before-after split / moving shadows
선택 → crossroads / buttons / hand hovering / menu selection
학습 → book notes / highlighted text / whiteboard / student desk
기회 → open window / sunrise city / gold light / reaching hand
```

## 7.3 Minimum viable dataset target
Initial build should include:
- 30 core concepts
- 3–5 visual metaphors per concept
- mood tags
- platform suitability tags

---

# 8. Platform Output Spec Layer

## 8.1 Problem
Final video behavior differs by platform and must be encoded.

## 8.2 Initial platform spec

### YouTube Shorts
- aspect: 9:16
- recommended length target: 15–60s
- metadata style: informative + searchable
- QA emphasis: hook clarity + retention

### TikTok
- aspect: 9:16
- recommended length target: 10–45s
- metadata style: native/social/trend-aware
- QA emphasis: motion energy + caption immediacy

### Instagram Reels
- aspect: 9:16
- recommended length target: 10–45s
- metadata style: polished / brand-forward
- QA emphasis: visual coherence + clean packaging

## 8.3 Output spec fields
- resolution
- fps
- max_duration
- safe_zone
- caption_position
- title_style
- hashtag_style
- CTA_style

---

# 9. Interface Layer — Formalized

## 9.1 Why
The system must be operable by beginners and experts.

## 9.2 Required interfaces
- interactive setup wizard
- profile-based settings
- CLI command layer
- diagnostics / doctor mode

## 9.3 Core command families
- create
- render
- prompt
- config
- doctor
- analyze
- publish

---

# 10. Final Execution Hierarchy

```text
Dataset Priors
→ Trend Intelligence
→ Strategy Engine
→ Theme Template Engine
→ Prompt Layer
→ Cost Routing
→ DAG Execution
→ Error Recovery
→ QA + Micro-Failure
→ Learning + Personalization
```

---

# 11. Codex CLI Handoff Principle

Codex CLI should implement in this order:

1. Prompt Schema
2. Cost Routing Logic
3. Error Recovery Policy
4. Platform Output Spec
5. Motion Engine rules
6. Semantic B-roll seed system
7. Learning cold-start thresholds
8. Novel → Shorts pipeline

---

# 12. Final Principle

> The remaining work is no longer conceptual design.

> It is the conversion of abstract ideas into deterministic execution rules.

