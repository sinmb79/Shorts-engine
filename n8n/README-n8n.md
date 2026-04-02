# Shorts-engine n8n Integration

This bridge exists for one reason: `shorts-engine` already knows how to think, score, and format, so n8n should orchestrate it instead of reimplementing it.

The counterintuitive failure point is not the webhook or Telegram token. It is the filesystem path. If n8n runs in Docker, `D:\workspace\shorts-engine\repo` is meaningless inside the container. Use the path that the n8n process can actually see.

## What gets added

- `workflow-shorts-engine.json`: importable workflow with Manual Trigger and Webhook Trigger
- `README-n8n.md`: setup notes, environment variables, and payload examples

## 1. Install n8n

Choose one of these paths:

- Local install: `npm install -g n8n`
- Docker: run the official `n8nio/n8n` image

Open your n8n instance and confirm it is a version compatible with the latest node schema. This workflow was authored against the current n8n node metadata used by the MCP tools.

## 2. Import the workflow

1. In n8n, select `Import from File`.
2. Import [`workflow-shorts-engine.json`](/D:/workspace/shorts-engine/repo/n8n/workflow-shorts-engine.json).
3. Save the workflow.
4. Add Telegram credentials to the three Telegram nodes if you want push delivery.

## 3. Set required variables

Set these in n8n environment variables, Docker compose, or your trigger payload.

- `SHORTS_ENGINE_PATH`: absolute path to this repo as seen by the n8n runtime
- `TELEGRAM_CHAT_ID`: default destination chat for result delivery
- `COMFYUI_URL`: optional, for example `http://127.0.0.1:8188/prompt`

Examples:

- Windows local n8n: `D:/workspace/shorts-engine/repo`
- Docker n8n with mounted repo: `/data/repos/shorts-engine`

If you pass `project_path` in the webhook body, it overrides `SHORTS_ENGINE_PATH`.

## 4. What the workflow actually does

1. Accepts `topic`, `platform`, `style`, and `output_format`
2. Builds a valid `request.json` in memory
3. Writes `n8n/request.runtime.json`
4. Runs the current CLI entrypoint:

```bash
npm --prefix "<SHORTS_ENGINE_PATH>" run engine -- format "<SHORTS_ENGINE_PATH>/n8n/request.runtime.json" --output "<output_format>" --json
```

5. Parses the formatter JSON
6. If the output is `kling`, it extracts the Kling prompt
7. If `COMFYUI_URL` exists, it sends a placeholder HTTP payload to ComfyUI
8. Sends the result to Telegram

The workflow intentionally uses `format`, not the older `run --style --output` example. The current Shorts-engine CLI exposes output formatter routing through `format`.

## 5. Trigger payload

Webhook path:

- `POST /webhook/22b-shorts-engine`

Minimal payload:

```json
{
  "topic": "AI meeting note tool",
  "platform": "youtube_shorts",
  "style": "cinematic",
  "output_format": "kling"
}
```

Extended payload:

```json
{
  "topic": "AI meeting note tool",
  "subject": "young professional using laptop",
  "goal": "make a short-form explainer clip",
  "emotion": "curiosity and satisfaction",
  "platform": "youtube_shorts",
  "theme": "explainer",
  "duration_sec": 20,
  "style": "documentary",
  "output_format": "runway",
  "project_path": "D:/workspace/shorts-engine/repo",
  "telegram_chat_id": "123456789",
  "comfyui_url": "http://127.0.0.1:8188/prompt",
  "trend_aware": true
}
```

Supported `style` presets in this workflow:

- `cinematic`
- `documentary`
- `viral`
- `editorial`
- `cozy`

Supported `output_format` values:

- `kling`
- `runway`
- `veo`
- `pika`
- `capcut`
- `generic`
- `human`

## 6. ComfyUI note

The included `Send to ComfyUI` node uses a placeholder JSON body on purpose. That keeps the workflow importable without pretending to know your checkpoint, LoRA, sampler, or exported graph.

Replace the HTTP body with your real ComfyUI API graph if you want image generation to happen for real. The useful input already arrives as:

- `kling_prompt`
- `cli_result.metadata.scenario_id`

## 7. Telegram note

This workflow assumes Telegram is the notification layer, not the approval layer. If you want review loops, add:

- `Wait`
- Telegram callback handling
- a second Execute Command run for regeneration

## 8. Common failure modes

- `SHORTS_ENGINE_PATH is not configured`
  - Set `SHORTS_ENGINE_PATH` or pass `project_path`
- `npm` not found
  - Install Node.js where n8n runs
- Repo path works on host but not in Docker
  - Mount the repo and use the container path
- Telegram node fails
  - Add Telegram credentials and verify `TELEGRAM_CHAT_ID`
- ComfyUI returns schema errors
  - Replace the placeholder request body with your exported graph JSON

## 9. Minimal operator checklist

1. Import the workflow
2. Set `SHORTS_ENGINE_PATH`
3. Attach Telegram credentials
4. Test with Manual Trigger
5. Then switch to Webhook Trigger or upstream automation

The shortest automation is the one that refuses to duplicate the engine it is orchestrating.
