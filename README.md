# Shorts Engine

Shorts Engine is a simulate-first CLI prototype for short-form video production planning. It does not generate media yet. Instead, it validates a structured request, normalizes it, optionally resolves a novel-to-shorts plan, resolves a platform output spec, generates a motion plan, generates a semantic B-roll plan, resolves a learning state, scores it, chooses a backend route, builds an execution plan, simulates recovery paths, and emits deterministic prompt, analysis, render, and publish artifacts on top of the same planning context.

## Why this project exists

The goal of this repository is to turn an abstract shorts-production engine spec into deterministic execution rules. The first slice focuses on the core engine behavior that should remain stable even when real generation backends are added later:

- request validation
- normalization
- platform output policy resolution
- motion planning rules
- semantic B-roll planning
- learning cold-start state resolution
- novel-to-shorts branching
- scoring
- routing
- execution planning
- recovery simulation

## Current Scope

- Prompt request schema validation
- Request normalization with derived fields
- Platform output spec resolution with automatic duration correction and warnings
- Deterministic motion planning with segment-aware assignments
- Deterministic semantic B-roll planning with seed-backed concepts
- Deterministic learning-state resolution from optional user history
- Deterministic novel-to-shorts planning with optional episode metadata
- Deterministic prompt result generation from shared planning context
- Deterministic request scaffolding from built-in profiles
- Deterministic environment diagnostics and request analysis
- Deterministic scoring and routing
- Execution plan generation with nodes and edges
- Recovery simulation with normal and fallback paths
- Deterministic render and publish manifests
- Human-readable or JSON CLI output across all command families

## What is intentionally not implemented yet

The first MVP does not call real video, TTS, image generation, or platform publish services. It also does not implement:

- render-time motion application
- real uploader integrations
- persistent user-state storage

Persistent personalization is intentionally deferred until there is real user-state storage.

Those are intentionally deferred until the core engine behavior is stable and test-covered.

## Requirements

- Node.js 24 or newer
- npm 11 or newer

## Install

```bash
npm install
```

## Build

```bash
npm run build
```

The compiled JavaScript files are written to `dist/`.

## Run the CLI

### Human-readable output

```bash
npm run run -- run tests/fixtures/valid-low-cost-request.json
```

### JSON output

```bash
npm run run -- run tests/fixtures/valid-low-cost-request.json --json
```

### Prompt output

```bash
npm run run -- prompt tests/fixtures/valid-low-cost-request.json
```

### Prompt JSON output

```bash
npm run run -- prompt tests/fixtures/valid-low-cost-request.json --json
```

### Config output

```bash
npm run run -- config --json
```

### Create request scaffold

```bash
npm run run -- create youtube_explainer tmp/request.json --json
```

### Doctor output

```bash
npm run run -- doctor --json
```

### Analyze output

```bash
npm run run -- analyze tests/fixtures/valid-low-cost-request.json --json
```

### Render manifest output

```bash
npm run run -- render tests/fixtures/valid-low-cost-request.json --json
```

### Publish manifest output

```bash
npm run run -- publish tests/fixtures/valid-low-cost-request.json --json
```

## How the command works

`engine run <request.json>` always follows this order:

1. Load the JSON file
2. Validate the request structure
3. Normalize the request into `base` and `derived`
4. Resolve the novel-to-shorts plan when `novel_project` is present
5. Resolve the platform output spec
6. Resolve the motion plan
7. Resolve the B-roll plan
8. Resolve the learning state
9. Score the request
10. Choose a routing decision
11. Build an execution plan with nodes and edges
12. Simulate normal and recovery paths
13. Render output for humans or machines

`engine prompt <request.json>` reuses the same planning context through `resolve_planning_context`, then:

1. Build a deterministic `PromptResult`
2. Render a short human-readable prompt summary or JSON

`engine analyze <request.json>` reuses the same planning context and emits a compact readiness and risk summary.

`engine render <request.json>` reuses the same planning context plus `PromptResult`, then emits a deterministic `RenderPlan`.

`engine publish <request.json>` reuses the same planning context plus `PromptResult` and `RenderPlan`, then emits a deterministic `PublishPlan`.

`engine config` exposes the built-in profile catalog and supported commands.

`engine create <profile> <output.json>` writes a starter request scaffold from the built-in profile catalog.

`engine doctor` checks whether the local environment can run the simulate-first CLI safely.

## Output fields

The JSON output includes these top-level fields:

- `schema_version`
- `request_id`
- `validation`
- `normalized_request`
- `platform_output_spec`
- `novel_shorts_plan`
- `motion_plan`
- `broll_plan`
- `learning_state`
- `scoring`
- `routing`
- `execution_plan`
- `recovery_simulation`

The prompt JSON output includes these top-level fields:

- `schema_version`
- `engine`
- `main_prompt`
- `negative_prompt`
- `style_descriptor`
- `quality_score`
- `warnings`
- `params`

The analyze JSON output includes these top-level fields:

- `schema_version`
- `request_id`
- `readiness`
- `risk_summary`
- `warning_count`
- `recommended_backend`

The render JSON output includes these top-level fields:

- `schema_version`
- `render_id`
- `engine`
- `output_filename`
- `segments`
- `asset_manifest`
- `qa_checklist`
- `warnings`

The publish JSON output includes these top-level fields:

- `schema_version`
- `publish_id`
- `platform`
- `title`
- `description`
- `hashtags`
- `cta`
- `upload_checklist`
- `warnings`

### Example result summary

- `validation.valid`: whether the input matched the schema
- `normalized_request.base`: cleaned user input
- `normalized_request.derived`: computed fields such as aspect ratio and premium allowance
- `platform_output_spec`: platform policy, effective duration, warnings, and adjustments
- `novel_shorts_plan`: optional novel highlight, hook, script outline, QA flags, and intent overrides
- `motion_plan`: segment grid, motion assignments, hook summary, and anti-repetition state
- `broll_plan`: seed-backed semantic concepts aligned to motion segments
- `learning_state`: cold-start phase, weights, threshold flags, confidence, and fallback priors
- `routing.selected_backend`: the backend chosen for this request
- `routing.reason_codes`: why the backend was chosen
- `execution_plan.nodes`: logical engine nodes
- `execution_plan.edges`: the order between nodes
- `recovery_simulation.normal_path`: the happy-path flow
- `recovery_simulation.recovery_paths`: the fallback flow if a node fails
- `main_prompt`: the structured generation prompt derived from planning output
- `params`: prompt execution parameters such as aspect ratio and effective duration
- `readiness`: prompt/render/publish readiness booleans
- `segments`: render-time segment assignments derived from motion and B-roll plans
- `hashtags`: deterministic platform packaging tags for publish preparation

## Human-readable summary

The default `engine run` output stays short and includes:

- platform
- effective duration in seconds
- warning count, including `0`

Use `--json` to inspect the full planning objects such as `platform_output_spec`, `novel_shorts_plan`, `motion_plan`, `broll_plan`, and `learning_state`.

The default `engine prompt` output also stays short and includes:

- engine
- quality score
- warning count, including `0`
- main prompt text

Use `engine prompt --json` to inspect the full `PromptResult`.

The default `engine analyze`, `engine render`, and `engine publish` outputs also stay short and summarize backend, readiness, filenames, hashtag counts, and warnings. Use `--json` to inspect the full structured result for each command.

## Test

```bash
npm test
```

Current test coverage verifies:

- schema validation
- normalization
- platform output spec resolution
- novel-to-shorts planning
- motion planning
- semantic B-roll planning
- learning-state resolution
- scoring and routing
- execution planning
- recovery simulation
- request scaffolding
- environment doctor
- analysis reports
- render manifest generation
- publish manifest generation
- CLI JSON output
- CLI exit codes

## Project structure

```text
src/
  analyze/
  broll/
  cli/
  config/
  create/
  domain/
  doctor/
  learning/
  motion/
  novel/
  platform/
  publish/
  prompt/
  render/
  simulation/
  shared/
tests/
  analyze/
  broll/
  bootstrap/
  cli/
  domain/
  fixtures/
  helpers/
  learning/
  motion/
  novel/
  platform/
  publish/
  prompt/
  render/
  simulation/
docs/
  superpowers/
```

## Public GitHub safety

This repository is intended for future public publication. Sensitive and unnecessary files are excluded through `.gitignore`, including:

- dependency directories
- build outputs
- environment files
- logs
- editor cache files
- common credential and certificate files

Before publishing, review [docs/github-publication-checklist.md](C:\Users\sinmb\workspace\media\docs\github-publication-checklist.md).

## Safety for Public GitHub Publishing

This repository is intended for future public publication. Sensitive and unnecessary files are excluded through `.gitignore`, including:

- dependency directories
- build outputs
- environment files
- logs
- editor cache files
- common credential and certificate files

Do not store secrets in this workspace. Keep them outside the repository and load them only when needed.
