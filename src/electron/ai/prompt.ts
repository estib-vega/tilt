import { ModelMessage } from 'ai';
import { printModelMessages } from './context.js';

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
  return `You are an AI assistant that helps users find information based on web search results.
Use the provided search results to answer the user's query accurately and concisely.
Ignore irrelevant information and focus on the most pertinent details.
If the search results do not contain relevant information, respond with "No relevant information found."
Answer only with the information provided in the search results.
`;
}

export function promptForWebResultsSummary(query: string, webResults: string): string {
  return `
Please provide a concise and accurate answer to the user's query based on the following web search results.
Only answer with the information. Don't add any additional commentary or information that is not present in the search results.

<user-query>
${query}
</user-query>

<search-results>
${webResults}
</search-results>
`;
}
