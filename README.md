# Shorts Engine

Shorts Engine is a TypeScript CLI for planning short-form video production across YouTube Shorts, TikTok, and Instagram Reels. It validates requests, resolves runtime config, routes work to the best backend, composes prompts, tracks prompt history, and exposes an optional dashboard for analytics.

## Highlights

- File-backed runtime configuration under `config/`
- Smart video routing with `kling`, `veo3`, `seedance2`, `runway`, and `local` adapters
- Prompt composition for search queries and generation prompts
- Korean preprocessing and visual vocabulary translation
- Quality analysis with micro-signals and hook optimization
- Caption template selection for render plans
- Prompt Tracker backed by SQLite-compatible storage
- Optional Dashboard backend and frontend scaffold
- TTS adapter registry including `edge_tts` for a free local fallback on Windows

## Requirements

- Node.js 24 or newer
- npm

## Install

```bash
git clone https://github.com/sinmb79/Shorts-engine.git
cd Shorts-engine
npm install
```

## Quick Start

Create a request interactively:

```bash
npm run engine -- init my-request.json
```

The `engine init` command is an alias of the wizard and also scaffolds the default `config/` files when they do not exist yet.

Run the planning pipeline:

```bash
npm run engine -- run my-request.json --json
```

Inspect prompt composition:

```bash
npm run engine -- prompt my-request.json --json
```

Check prompt tracker statistics:

```bash
npm run engine -- stats --json
```

Start the optional dashboard:

```bash
npm run engine -- dashboard
```

## Windows Portable EXE

Shorts Engine can now be packaged as a portable Windows executable so end users do not need to install Node.js.

Build the executable from source:

```bash
npm run package:win-portable
```

This generates:

```text
release/shorts-engine-win-x64.exe
```

The packaged executable includes the default runtime config assets needed by `engine init`. A typical user flow is:

```powershell
.\shorts-engine-win-x64.exe init my-request.json
.\shorts-engine-win-x64.exe run my-request.json --json
.\shorts-engine-win-x64.exe stats --json
```

For distribution, ship the `.exe` from the `release/` folder as a portable download in a GitHub Release or zip archive.

For first-time Korean users, see:

- `docs/getting-started-ko.md`

## Runtime Config

Shorts Engine loads the nearest ancestor `config/` directory from the request file location. The default config set contains:

- `config/engine.json`
- `config/shorts-config.json`
- `config/prompt-styles.json`
- `config/user-profile.json`

Resolution precedence is:

1. Request overrides
2. User profile defaults
3. Engine defaults

## Commands

Existing planning and execution commands:

- `engine run <request.json>`
- `engine prompt <request.json>`
- `engine analyze <request.json>`
- `engine render <request.json>`
- `engine publish <request.json>`
- `engine execute <request.json> [--dry-run]`
- `engine tts <request.json> [--dry-run]`
- `engine upload <request.json> <video.mp4> [--dry-run]`
- `engine create <profile> <output.json>`
- `engine config --json`
- `engine doctor`

New operational commands:

- `engine init [output.json]`
- `engine stats [--json]`
- `engine dashboard [--json]`

## Adapter Coverage

Video adapters:

- `local`
- `kling`
- `veo3`
- `seedance2`
- `runway`

TTS adapters:

- `local`
- `edge_tts`
- `openai_tts`
- `elevenlabs`
- `google_tts`

Upload adapters:

- `local`
- `youtube`
- `tiktok`
- `instagram`

## Prompt Tracker

Prompt Tracker records prompt generations and execution attempts, including engine choice, cost, score, and status. The CLI command `engine stats` reads this data and returns aggregated statistics.

By default, tracker data is stored under:

```text
data/prompt_log.db
```

Override the location with:

```bash
SHORTS_ENGINE_PROMPT_DB_PATH=/custom/path/prompt_log.db
```

## Dashboard

The dashboard foundation lives under `dashboard/` and includes:

- Backend HTTP APIs for overview, analytics, cost, and settings
- A frontend scaffold for overview, analytics, settings, and cost views
- CLI startup through `engine dashboard`

The dashboard is optional. The core engine works without it.

## Diagnostics

Use `engine doctor` to verify:

- Node version support
- Required project paths
- Command catalog, including `engine init`, `engine stats`, and `engine dashboard`
- Registered video, TTS, and upload adapters

## Testing

Run the full test suite with:

```bash
npm test
```

## Repository Structure

```text
config/              Runtime configuration defaults
dashboard/           Optional dashboard backend and frontend scaffold
src/adapters/        Video, TTS, and upload adapters
src/cli/             CLI entrypoints
src/config/          Config loader and resolver
src/prompt/          Prompt preprocessing and composition
src/quality/         Micro-signals and hook analysis
src/render/          Render plan generation
src/tracking/        Prompt tracker
tests/               Automated tests
```
