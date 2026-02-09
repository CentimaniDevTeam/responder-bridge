# Responder Bridge

A minimal bridge that orchestrates:

describe + params + materials → LLM generate → validate → fix → validate … → artifacts

## Packages

- `@hak2i/responder-bridge` (core)
- `@hak2i/responder-bridge-openai` (OpenAI-compatible provider)

## Quickstart

```bash
npm install
node packages/responder-bridge/bin/responder-bridge.js run \
  --tool flowmark \
  --describe "ai --lang en" \
  --materials README.md \
  --model gpt-5.2 \
  --out artifacts/run-001
```

Environment:

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL` (optional)

## Tests

```bash
npm test
```
