# Shorts Engine Architecture

This document explains the current structure of the first Shorts Engine MVP.

## Purpose

The project turns a structured shorts-production request into deterministic planning output. The first MVP does not generate media. It simulates the decision-making path that a future production engine will follow.

## Main flow

The `run` command always executes these stages:

1. `load`
2. `validate`
3. `normalize`
4. `score`
5. `route`
6. `build_execution_plan`
7. `simulate_recovery`
8. `render_output`

Each stage reads structured data and returns structured data.

## Module layout

### `src/cli`

This layer handles:

- command parsing
- file loading
- result rendering
- process exit codes

It does not own business rules.

### `src/domain`

This layer handles:

- request contracts
- error contracts
- schema validation
- normalization
- scoring
- routing

This is where deterministic policy rules live.

### `src/simulation`

This layer handles:

- execution plan building
- node metadata
- normal-path generation
- recovery-path generation

It models what the engine would do if real backends existed.

### `src/shared`

This layer contains shared utilities that do not belong to a single domain module.

## Core request objects

### `EngineRequest`

This is the external JSON contract accepted by the CLI.

### `NormalizedRequest`

This is the internal request contract used after validation. It is split into:

- `base`: canonicalized user input
- `derived`: computed fields such as duration, aspect ratio, and premium allowance

All later stages read only `NormalizedRequest`.

## Scoring and routing

The current engine computes four structured scores:

- `candidate_score`
- `quality_tier_score`
- `premium_eligibility_score`
- `cost_risk_score`

Routing uses those scores plus the request to decide:

- selected backend
- fallback backend
- premium allowance
- reason codes

## Execution plan

The execution plan is a lightweight DAG model with:

- `nodes`
- `edges`

Each node contains retry, fallback, skip, and cost metadata.

## Recovery simulation

Recovery simulation returns:

- `normal_path`
- `recovery_paths`

This allows the project to show how fallback behavior would work before any real backend integration exists.
