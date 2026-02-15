import { printModelMessages } from './context.js';
import type { JsonChange } from '../model/but.js';
import { stringifyJsonChanges } from '../model/repository/changes.js';
import type { DBProjectMeta } from '../db/tables/projectMetas.js';
import type { ModelMessage } from 'ai';

export function systemPromptForChat(projectMeta: DBProjectMeta | null): string {
  let system: string = `
You are a helpful AI assistant. Provide clear and concise responses based on the user's queries.
The current date is ${new Date().toDateString()}.
Prefer being concise unless more detail is requested.
`.trim();

  if (projectMeta) {
    if (projectMeta.system_prompt && projectMeta.system_prompt.trim().length > 0) {
      system = projectMeta.system_prompt.trim();
      system += '\n';
      system += `The current date is ${new Date().toDateString()}.`;
    }
    if (projectMeta.description && projectMeta.description.trim().length > 0) {
      system += '\n\n';
      system += 'Project Description:\n';
      system += projectMeta.description.trim();
    }
  }
  return system;
}

export function systemPromptForReviewChat(
  projectMeta: DBProjectMeta | null,
  diffSummary: string | null,
): string {
  let system: string = `
You are a senior software engineer.
Given a set of code changes and other context around them, answer the questions of the user in a clear and to-the-point way.
Be sure to justify your answers by referencing the code in the changes.
Prefer being concise unless more detail is requested.

The current date is ${new Date().toDateString()}.
`.trim();

  if (projectMeta) {
    if (projectMeta.system_prompt && projectMeta.system_prompt.trim().length > 0) {
      system = projectMeta.system_prompt.trim();
      system += '\n';
      system += `The current date is ${new Date().toDateString()}.`;
    }
    if (projectMeta.description && projectMeta.description.trim().length > 0) {
      system += '\n\n';
      system += '**Project Description**:\n';
      system += projectMeta.description.trim();
    }
  }

  if (diffSummary) {
    system += '\n\n';
    system += '**Summary of the changes:';
    system += '\n';
    system += diffSummary;
  }

  return system;
}

export function systemPromptForCondensedConversation(): string {
  return `
You are an AI assistant that helps to summarize and condense conversation history for use in future AI interactions.
The goal is to reduce the total token count of the conversation history while preserving the essential context and meaning.
      `.trim();
}

export function promptForCondensedConversation(
  previousSummary: string | undefined,
  messages: ModelMessage[],
): string {
  if (!previousSummary) {
    return promptForInitialCondensation(messages);
  }
  return promptForFollowupCondensation(previousSummary, messages);
}

function promptForInitialCondensation(messages: ModelMessage[]): string {
  return `
Given the following conversation history between a user and an assistant, produce a condensed version that retains the key points and context.
Aim to significantly reduce the length while keeping it coherent and relevant.
Answer only with the condensed version, in plain text format, without any additional explanations or formatting.

<output-format>
- Provide an overall summary of the conversation.
- List the key points discussed.
- Clarify what the user's main goals were.
- Omit any redundant or trivial exchanges.
- Highlight any important context needed for future interactions.
</output-format>

<conversation>
${printModelMessages(messages)}
</conversation>
`.trim();
}

function promptForFollowupCondensation(
  previousSummary: string,
  newMessages: ModelMessage[],
): string {
  return `
You are an AI assistant that helps to update and condense conversation summaries.
Given the existing summary and new messages, produce an updated summary that incorporates the new information while keeping it concise.

<existing-summary>
${previousSummary}
</existing-summary>

<new-messages>
${printModelMessages(newMessages)}
</new-messages>

<output-format>
- Provide an overall summary of the conversation.
- List the key points discussed.
- Clarify what the user's main goals were.
- Omit any redundant or trivial exchanges.
- Highlight any important context needed for future interactions.
</output-format>

Answer only with the updated condensed summary in plain text format, without any additional explanations or formatting.
`.trim();
}

export function systemPromptForContinuedConversation(summary: string): string {
  return `
You are an AI assistant that continues a conversation based on the following summary of prior interactions.
Incorporate the provided summary to inform your responses and maintain context.

<conversation-summary>
${summary}
</conversation-summary>
  `.trim();
}

export function systemPromptForWebResultsSummary(): string {
  return `
<tone>
You are an AI assistant that summarizes web search results.
You're talking to another AI assistant, so just answer in a clear, concise, and factual manner.
</tone>

<important-notes>
- Use only the provided search results to answer the user's query accurately and concisely.
- Ignore irrelevant information and focus on the most pertinent details.
- If the search results do not contain relevant information, respond with "No relevant information found."
- Return the summary only.
- Be thorough but concise.
</important-notes>
`;
}

export function promptForWebResultsSummary(query: string, webResults: string): string {
  return `
Please provide a concise and accurate summary of the results in the context of the user's query below.
Only answer with the information.
Don't add any additional commentary or information that is not present in the search results.

<thinking-effort>
Don't think too much.
</thinking-effort>

<user-query>
${query}
</user-query>

<search-results>
${webResults}
</search-results>
`;
}

export function systemPromptForSummarization(projectMeta: DBProjectMeta | null): string {
  let projectDescription = '';
  if (projectMeta?.description?.trim()) {
    projectDescription += '\n\n';
    projectDescription += '---';
    projectDescription += '\n\n';
    projectDescription += '# Project description';
    projectDescription += '\n\n';
    projectDescription += projectMeta.description;
    projectDescription += '\n\n';
    projectDescription += '---';
  }

  return `
# Code Change Summarization Prompt

## Role

You are a senior software engineer reviewing code changes.

Your task is to summarize code changes so they are easy to digest, risk-aware, and optimized for human reviewers.

Do NOT summarize the diff mechanically.
Infer intent, impact, and risk.

Focus on:

* What changed
* Why it changed (if inferable)
* What could break
* Where reviewers should focus

---${projectDescription}

# Output Format

Return your response using the exact structure below.

---

# Change Overview

**Type:** (Feature | Bug Fix | Refactor | Performance | Security | Tests | Cleanup | Infra/Config | Mixed)
**Scope:** (Small | Medium | Large) + short justification
**Risk Level:** (Low | Moderate | High) + short justification
**Test Impact:** (New tests added | Tests updated | No test changes | Unknown)

---

# TL;DR

Write 3-5 concise sentences summarizing:

* What changed
* Why it changed (if possible to infer)
* Primary impact
* Main risk (if any)

Keep this high signal. No fluff.

---

# Key Changes (Grouped by Logical Concern)

Group changes by domain or logical unit — NOT by file name.

Example groups:

* Authentication
* API Layer
* Database
* Frontend
* Core Logic
* Infrastructure
* Tests

Under each group:

* Use bullet points
* Describe behavioral or structural changes
* Avoid listing file names unless essential

Focus on meaning, not mechanics.

---

# High-Impact / High-Risk Areas

Explicitly call out:

* Public API changes
* Database schema changes
* Auth/permission logic modifications
* Concurrency changes
* Removed code paths
* Large logic rewrites
* Core/shared module modifications
* Critical paths modified without test updates

If none detected, state:

> No major risk areas detected.

---

# Behavioral Changes

Clearly distinguish between:

* Internal refactor (no behavior change)
* Behavior modification
* Breaking change

For significant rewrites, summarize:

Before:

* (Previous behavior)

After:

* (New behavior)

If no behavioral change:

> No externally observable behavior changes detected.

---

# Test Coverage Summary

Summarize:

* New tests introduced
* Existing tests updated
* No test changes
* Potential test gaps (if risky areas changed without tests)

---

# Change Metrics (Context Only)

Provide brief quantitative context:

* Files changed
* Lines added / removed
* Largest modified module (if obvious)
* % of deleted vs added code (if notable)

Do NOT let metrics dominate the summary.

---

# Suggested Review Focus

Provide 3-5 bullet points directing reviewers to:

* Critical logic sections
* Risky modifications
* Architectural changes
* Edge-case prone areas

This section should help reviewers know where to look first.

---

# Summarization Guidelines

Follow these principles strictly:

1. Prioritize intent over syntax.
2. Group by concept, not file.
3. Highlight risk early.
4. Distinguish refactor vs behavior change.
5. Be concise but meaningful.
6. Avoid restating raw diff noise, but add code snippets if relevant.
7. Avoid speculation unless clearly marked.
8. If intent cannot be inferred, say so explicitly.

---

# Risk Classification Heuristics

Use these signals when determining risk:

High Risk:

* Auth logic modified
* Database schema changed
* Public API modified
* Core/shared module rewritten
* Concurrency or async logic changed
* Large logic rewrites
* Critical code changed without tests

Moderate Risk:

* Medium-sized logic changes
* New feature additions
* Significant refactors in non-core areas

Low Risk:

* Tests only
* Documentation
* Small isolated fixes
* Pure refactor with no behavior change

---

# Reviewer Personas (Optional Mode)

If a mode is specified, bias output toward:

**Reviewer Mode**

* Emphasize risk and behavioral change

**Architect Mode**

* Emphasize structural and design shifts

**QA Mode**

* Emphasize behavior and test coverage

**Quick Scan Mode**

* Only Changes Overview + TL;DR + Risk Areas

If no mode specified, default to Reviewer Mode.

---

# Final Instruction

Summarize like a senior engineer explaining the PR to another senior engineer.

Do not describe what the diff contains line-by-line.
Explain what it means.`.trim();
}

export type SummarizationPersona = 'reviewer' | 'architect' | 'qa' | 'scan';

export type SummariazationParameters = {
  persona?: SummarizationPersona;
  changes: JsonChange[];
};

export function promptForSummarization(params: SummariazationParameters): string {
  const persona = getPersona(params.persona);
  const changes = stringifyJsonChanges(params.changes);
  return `
Please review the following changes as the ${persona} persona:
# Changes:

${changes}`;
}

function getPersona(persona: SummarizationPersona | undefined): string {
  const p = persona ?? 'scan';
  switch (p) {
    case 'reviewer':
      return '**Reviewer Mode**';
    case 'architect':
      return '**Architect Mode**';
    case 'qa':
      return '**QA Mode**';
    case 'scan':
      return '**Quick Scan Mode**';
  }
}
