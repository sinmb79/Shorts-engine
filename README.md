# Shorts Engine v0.2.0

Meta description: Taste-first CLI that turns what you love into short-form video scenarios, prompts, formatters, and quality feedback loops.

Labels: `shorts` `ai-video` `cli` `taste-first` `youtube-shorts` `tiktok` `instagram-reels` `22B Labs` `The 4th Path`

Built by **22B Labs · The 4th Path**  
GitHub: **sinmb79**

## Why This Exists

Most video tools ask for settings before they ask for taste.

That sounds efficient, but it usually produces generic work. People do not think in "`pacing_profile`" and "`camera_language`" first. They think in references, moods, instincts, and the strange combination of things they already love.

Shorts Engine exists to close that gap.

**KR:** 좋아하는 영화, 영상 스타일, 작가 취향에서 출발해 숏폼 시나리오와 프롬프트를 만드는 도구입니다.  
**EN:** Start from what you love, then turn it into a short-form scenario, prompt stack, and publish-ready package.

## In 30 Seconds

If you are not a developer, this is the only mental model you need:

1. Tell the engine what kind of work you love with `taste`.
2. Generate a guided short with `interactive` or a request file.
3. Export copy-ready output for Kling, Runway, Veo, Pika, CapCut, or a human editor.
4. Feed back what worked so the engine gets sharper over time.

## What You Get

### 🎬 Taste-first generation

`engine taste` builds a reusable style DNA from films, visual styles, and writers you already like.

That DNA automatically influences:

- scenario structure
- hook selection
- style resolution
- prompt building
- block selection
- quality evolution

### 🧠 Scenario engine

The engine does not just emit a generic prompt.

It produces:

- a scenario plan
- a prompt result
- a render plan
- a publish plan
- a quality score
- optional LLM refinement
- output-specific formatter packages

### 📈 Quality loop

Every generated scenario can be rated.

That feedback updates:

- learned block scores
- verified block combinations
- taste refinement heuristics
- dashboard summaries

## Quick Start

Install dependencies first:

```bash
npm install
```

Then build and verify the project:

```bash
npm run build
npm test
```

### 🚀 First run

Create your taste profile:

```bash
npm run engine -- taste
```

Then try the guided path:

```bash
npm run engine -- interactive
```

If you already have a request file:

```bash
npm run engine -- run tests/fixtures/valid-low-cost-request.json
```

## Core Commands

### 🪞 Taste

Use these when you want the engine to understand your instincts before it starts generating.

```bash
npm run engine -- taste
npm run engine -- taste show
npm run engine -- taste add
npm run engine -- taste refine
npm run engine -- taste reset
```

### 🧱 Generate

Use these when you want plans, prompts, or guided output.

```bash
npm run engine -- interactive
npm run engine -- create youtube_explainer my-request.json
npm run engine -- create --template recipe-30s my-template-request.json
npm run engine -- run my-request.json --json
npm run engine -- prompt my-request.json --llm
npm run engine -- render my-request.json
npm run engine -- publish my-request.json --trend-aware
```

### 🧰 Formatters

Use `format` when you want copy-paste-ready output for a target tool instead of a raw internal plan.

```bash
npm run engine -- format my-request.json --output kling
npm run engine -- format my-request.json --output human
npm run engine -- format my-request.json --output all --json
```

Supported output formats:

- `kling`
- `runway`
- `veo`
- `pika`
- `capcut`
- `generic`
- `human`

### 🧪 Quality loop

Use these after generation when you want the engine to learn from real outcomes.

```bash
npm run engine -- feedback <scenario-id>
npm run engine -- quality
```

## Templates

Templates are shortcuts, not cages.

The current preset catalog includes:

- `recipe-30s`
- `comedy-skit-15s`
- `tutorial-60s`
- `product-launch-20s`
- `story-tease-25s`
- `before-after-15s`
- `cozy-vlog-20s`
- `cinematic-mood-20s`

They give you strong defaults while still letting taste DNA decide how the piece feels.

## Trend-aware mode

If `~/.22b/trends/index.json` exists, `--trend-aware` will safely read it and blend trend keywords and hashtags into the prompt and publish layer.

If the file does not exist, the engine keeps working normally.

```bash
npm run engine -- format my-request.json --trend-aware --output generic
```

## LLM mode

LLM refinement is optional by design.

The offline path is still the default philosophy. When you do want a second pass:

```bash
npm run engine -- prompt my-request.json --llm --provider openai
npm run engine -- format my-request.json --llm --provider anthropic
```

Supported providers:

- OpenAI
- Anthropic
- Ollama

If a provider is unavailable or fails, the engine falls back to the offline plan.

## Project Shape

This repo is organized around a simple idea: taste enters early, quality loops back late.

```text
src/
  cli/         command entrypoints
  taste/       onboarding, DNA generation, profile storage
  taste-db/    curated reference data
  style/       style resolution
  scenario/    hook forge + block weaving
  quality/     score gate, feedback, evolution
  llm/         provider routing + refinement
  output/      formatter packages
  templates/   one-click presets
```

## For Non-developers

You do not need to understand the internal JSON to get value from this project.

The shortest useful path is:

1. `taste`
2. `interactive`
3. `format --output human` or `format --output kling`
4. `feedback`

That is enough to move from instinct to structured output without learning the whole engine.

## For Builders

If you are extending the engine, start here:

```bash
npm run build
npm test
```

Then inspect:

- `src/taste/`
- `src/scenario/`
- `src/quality/`
- `src/output/formatters/`
- `src/templates/`

## Maker's Philosophy

This project is built on a simple belief from **The 4th Path**: understanding between humans and AI matters more than speed for its own sake.

Good tools do not replace taste. They help taste become legible, portable, and improvable.

Tell us what you love, and the machine should become more human in how it helps.  
That is the whole game.
