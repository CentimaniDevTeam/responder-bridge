# Responder Bridge v0.1.0 Specification (Draft)

**Repo:** CentimaniDevTeam/responder-bridge.  
**License:** MIT.  
**Version:** 0.1.0  
**Last updated:** 2026-02-09

This spec defines a monorepo that provides:

- a **core** Responder Bridge abstraction (`@hak2i/responder-bridge`)
- an **OpenAI-compatible provider** implementation (`@hak2i/responder-bridge-openai`)

Responder Bridge orchestrates a loop:
`describe + params + materials → LLM generate → validate → fix → validate … → artifacts`

---

## 1. Glossary

- **Tool**: an external CLI or service that supports `describe`, optional `params`, and `validate`.
  - Example tool: `flowmark`
- **Responder**: a passive participant that responds when invoked (LLM model).
- **Actor**: an active participant (agent). *Out of scope in v0.1.0.*
- **Provider**: implementation that can call an LLM endpoint (OpenAI-compatible API, etc.).
- **Artifact**: saved outputs produced by the loop (final doc, logs, prompts, metadata).

---

## 2. Monorepo Layout (Normative)

The repository MUST be a monorepo with at least:

```
packages/
  responder-bridge/          # @hak2i/responder-bridge (core)
  responder-bridge-openai/   # @hak2i/responder-bridge-openai (provider)
```

Recommended (non-normative):

- changesets for versioning
- workspace tooling (pnpm/yarn/npm workspaces)

---

## 3. Core Package: `@hak2i/responder-bridge`

### 3.1 Responsibilities (Normative)

Core MUST provide:

1. **Prompt composition**
   - Combine Tool `describe` output (and Tool `params` output if provided) with Materials.
2. **Validation loop orchestration**
   - Call tool `validate` after generation.
   - If invalid, generate a fix prompt and retry up to a max iteration count.
3. **Artifact output**
   - Save generated documents, prompts, and validation logs to a directory.
4. **Provider abstraction**
   - Provider interface used to send messages to an LLM.

Core MUST NOT:

- hardcode OpenAI-specific logic
- require aiwf internals
- perform network calls by itself (except via Provider interface)

### 3.2 Public Interfaces (Normative)

TypeScript API (names are normative; internal shapes may evolve):

- `ResponderBridge`
- `Provider`
- `ToolAdapter`
- `MaterialsLoader`
- `ArtifactStore`

#### 3.2.1 Provider Interface

Provider MUST support:

- model selection (string)
- message list input (system + user at minimum)
- text output (string)

Example minimal interface:

```ts
export interface Provider {
  generate(input: {
    model: string;
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
    temperature?: number;
  }): Promise<{ text: string }>;
}
```

#### 3.2.2 Tool Adapter Interface

ToolAdapter MUST support:

- `describe(topic, options)` → string
- `params(topic, options)` → string | null
- `validate(filePath, options)` → { ok: boolean; logText: string }

For v0.1.0, `describe` and `validate` are REQUIRED.
`params` is OPTIONAL.

#### 3.2.3 Materials Loader

MaterialsLoader MUST support at least local files:

- read one or more file paths
- wrap each file in a labeled block
- preserve content (no summarization)

### 3.3 Loop Behavior (Normative)

Core MUST implement:

- `maxIterations` default: 3
- On each iteration:
  1) compose prompts
  2) call Provider.generate
  3) write draft to artifacts
  4) call ToolAdapter.validate
  5) if ok → finalize; else → compose fix prompt using validation log

Fix prompt MUST include:

- previous draft (verbatim)
- validation log (verbatim)
- explicit instruction: “Fix to pass validator. Do not reduce enumeration.”

---

## 4. OpenAI Provider Package: `@hak2i/responder-bridge-openai`

### 4.1 Responsibilities

This package MUST implement the Core `Provider` interface using an OpenAI-compatible API.

It MUST support:

- base URL (overridable)
- API key (env var)
- model name (string)
- request timeout and retries (basic)

It MUST NOT depend on FlowMark or aiwf.

---

## 5. CLI (Recommended for v0.1.0)

A simple CLI is recommended to exercise the loop end-to-end.
This CLI MAY live in either package initially, but SHOULD be separated later.

### 5.1 CLI Command (Recommended)

Example command (non-normative):

```bash
rb run   --tool flowmark   --describe "ai --lang en"   --params "normalize --lang en"   --materials README.md tools.md sessions.md   --model gpt-5.2   --out artifacts/run-001
```

Core requirement: it must be possible to run without aiwf.

---

## 6. First Target Integration: FlowMark (v0.1.0 Test Case)

v0.1.0 SHOULD provide an example preset for FlowMark:

- uses `flowmark describe ai --lang en`
- optionally uses `flowmark params normalize --lang en` (future-ready)
- validates with `flowmark validate <file>`

---

## 7. Artifact Directory Structure (Normative)

ArtifactStore MUST create an output directory containing at least:

- `inputs/` (describe output, params output, materials snapshot)
- `iterations/iter-01/` (draft, prompt, validation log)
- `final/` (final document, final validation log)
- `meta.json` (provider, model, timestamps, tool version strings if known)

---

## 8. Security and Privacy (Normative)

- Materials may contain sensitive content.
- The CLI MUST require explicit user action to include files.
- The system MUST NOT upload files unless configured to do so (provider call uploads text).

---

## 9. Non-goals (v0.1.0)

- Multi-agent participation (Actors)
- Session server / distributed synchronization
- Web UI
- RAG / embedding search

---
