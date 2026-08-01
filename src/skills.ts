/**
 * Agent Skills via the Anthropic Messages API.
 *
 * Demonstrates the same flow as the `examples/skills` sample in
 * anthropic-sdk-js: enable an Agent Skill (here the pre-built `xlsx` skill)
 * on a Messages request, let Claude run it inside the server-side code
 * execution container, then download the file it produces via the Files API.
 *
 * Skills are enabled through three things on the SAME beta request:
 *   1. the `code-execution-2025-08-25` and `skills-2025-10-02` beta flags,
 *   2. `container.skills` selecting which skills are available in the container,
 *   3. the `code_execution` tool, which is how skills actually run.
 *
 * Prereqs:
 *   npm install
 *   export ANTHROPIC_API_KEY=sk-ant-...
 *
 * Run:
 *   npm run skills
 */

import { writeFile } from 'node:fs/promises';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

const MODEL = 'claude-opus-5';

// Beta flags required for Agent Skills + the code execution tool.
const BETAS = ['code-execution-2025-08-25', 'skills-2025-10-02'];

async function main(): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Set ANTHROPIC_API_KEY before running.');
  }

  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: BETAS,
    // Make the pre-built `xlsx` skill available inside the container.
    // For a custom skill (uploaded via the Skills API) use:
    //   { type: 'custom', skill_id: 'skill_abc123', version: 'latest' }
    container: {
      skills: [{ type: 'anthropic', skill_id: 'xlsx', version: 'latest' }],
    },
    // Skills execute via the code execution tool.
    tools: [{ type: 'code_execution_20260521', name: 'code_execution' }],
    messages: [
      {
        role: 'user',
        content:
          'Create an .xlsx spreadsheet named budget.xlsx with a "Category" and ' +
          '"Amount" column and five sample rows, plus a SUM total row.',
      },
    ],
  });

  // Print Claude's narration and collect any files the skill generated.
  const fileIds: string[] = [];

  for (const block of response.content) {
    if (block.type === 'text') {
      console.log(block.text);
    }
    // Code-execution file outputs surface as file references inside the
    // bash_code_execution tool result. SDK types for these nested blocks can
    // lag, so we walk the structure defensively and pull out any `file_id`.
    for (const fileId of extractFileIds(block)) {
      fileIds.push(fileId);
    }
  }

  if (fileIds.length === 0) {
    console.log('\nNo files were generated.');
    return;
  }

  for (const fileId of fileIds) {
    const meta = await client.beta.files.retrieveMetadata(fileId);
    const content = await client.beta.files.download(fileId);
    const bytes = Buffer.from(await content.arrayBuffer());
    const safeName = (meta.filename ?? fileId).split('/').pop() || fileId;
    await writeFile(safeName, bytes);
    console.log(`\nSaved ${safeName} (${bytes.length} bytes)`);
  }
}

/** Recursively pull every `file_id` string out of an arbitrary content block. */
function extractFileIds(node: unknown): string[] {
  const out: string[] = [];
  if (node === null || typeof node !== 'object') return out;

  if (Array.isArray(node)) {
    for (const item of node) out.push(...extractFileIds(item));
    return out;
  }

  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key === 'file_id' && typeof value === 'string') {
      out.push(value);
    } else if (typeof value === 'object' && value !== null) {
      out.push(...extractFileIds(value));
    }
  }
  return out;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
