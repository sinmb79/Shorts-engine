# Shorts Engine

Shorts Engine is a simulate-first CLI prototype for short-form video production planning. It does not generate media yet. Instead, it validates a structured request, normalizes it, scores it, chooses a backend route, builds an execution plan, and simulates recovery paths.

## Why this project exists

The goal of this repository is to turn an abstract shorts-production engine spec into deterministic execution rules. The first slice focuses on the core engine behavior that should remain stable even when real generation backends are added later:

- request validation
- normalization
- scoring
- routing
- execution planning
- recovery simulation

## Current Scope

- Prompt request schema validation
- Request normalization with derived fields
- Deterministic scoring and routing
- Execution plan generation with nodes and edges
- Recovery simulation with normal and fallback paths
- Human-readable or JSON CLI output

## What is intentionally not implemented yet

The first MVP does not call real video, TTS, or image generation services. It also does not implement the later sections of the master plan such as:

- platform-specific publishing outputs
- motion engine rules
- semantic B-roll datasets
- learning and personalization
- novel-to-shorts flows

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

## How the command works

`engine run <request.json>` always follows this order:

1. Load the JSON file
2. Validate the request structure
3. Normalize the request into `base` and `derived`
4. Score the request
5. Choose a routing decision
6. Build an execution plan with nodes and edges
7. Simulate normal and recovery paths
8. Render output for humans or machines

## Output fields

The JSON output includes these top-level fields:

- `schema_version`
- `request_id`
- `validation`
- `normalized_request`
- `scoring`
- `routing`
- `execution_plan`
- `recovery_simulation`

### Example result summary

- `validation.valid`: whether the input matched the schema
- `normalized_request.base`: cleaned user input
- `normalized_request.derived`: computed fields such as aspect ratio and premium allowance
- `routing.selected_backend`: the backend chosen for this request
- `routing.reason_codes`: why the backend was chosen
- `execution_plan.nodes`: logical engine nodes
- `execution_plan.edges`: the order between nodes
- `recovery_simulation.normal_path`: the happy-path flow
- `recovery_simulation.recovery_paths`: the fallback flow if a node fails

## Test

```bash
npm test
```

Current test coverage verifies:

- schema validation
- normalization
- scoring and routing
- execution planning
- recovery simulation
- CLI JSON output
- CLI exit codes

## Project structure

```text
src/
  cli/
  domain/
  simulation/
  shared/
tests/
  bootstrap/
  cli/
  domain/
  fixtures/
  helpers/
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
