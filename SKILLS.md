# Agent Skills — Anthropic TypeScript SDK

Demonstrates using **Agent Skills** through the Anthropic Messages API with the
[`@anthropic-ai/sdk`](https://github.com/anthropics/anthropic-sdk-js) — the same
flow as the `examples/skills` sample in the SDK repo.

A **Skill** is a folder of instructions + scripts (e.g. the pre-built `xlsx`,
`docx`, `pptx`, `pdf` skills) that Claude loads on demand and runs inside the
server-side **code execution** container.

## How Skills are enabled (Messages API)

Three things on the **same** `client.beta.messages.create(...)` request:

1. **Beta flags** — `code-execution-2025-08-25` and `skills-2025-10-02`.
2. **`container.skills`** — selects which skills are available in the container:
   - Pre-built: `{ type: 'anthropic', skill_id: 'xlsx', version: 'latest' }`
   - Custom (uploaded via the Skills API): `{ type: 'custom', skill_id: 'skill_abc123', version: 'latest' }`
3. **The code execution tool** — `{ type: 'code_execution_20260521', name: 'code_execution' }`; skills run through it.

Files the skill generates (`.xlsx`, `.pptx`, …) are written inside the container
and returned as file references. Download them with the Files API
(`client.beta.files.download(fileId)`), which the example does automatically.

> Note: this is the **Agent Skills** surface (`container` + code execution), not
> Managed Agents (`client.beta.agents` / `sessions`). They are different APIs.

## Requirements

- Node.js 20+
- An Anthropic API key with access to code execution + skills

## Install

```bash
npm install
export ANTHROPIC_API_KEY=sk-ant-...
```

## Run

```bash
npm run skills       # runs src/skills.ts (asks Claude to build budget.xlsx)
npm run typecheck    # tsc --noEmit
```

## Listing available skills

```ts
// GET /v1/skills — requires the skills-2025-10-02 beta
const skills = await client.beta.skills.list();
```

## Uploading a custom skill

Package your skill (a `SKILL.md` plus any scripts/resources), create it via the
Skills API, then reference the returned `skill_id` in `container.skills` with
`{ type: 'custom', skill_id, version: 'latest' }`.

## Pinned versions

- `@anthropic-ai/sdk` — `^0.115.0`
