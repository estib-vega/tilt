import { ModelMessage } from 'ai';
import { printModelMessages } from './context';

export function systemPromptForCondensedConversation(): string {
  return `
You are an AI assistant that helps to summarize and condense conversation history for use in future AI interactions.
The goal is to reduce the total token count of the conversation history while preserving the essential context and meaning.
      `.trim();
}

export function promptForCondensedConversation(messages: ModelMessage[]): string {
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

export function systemPromptForContinuedConversation(summary: string): string {
  return `
You are an AI assistant that continues a conversation based on the following summary of prior interactions.
Incorporate the provided summary to inform your responses and maintain context.

<conversation-summary>
${summary}
</conversation-summary>
  `.trim();
}
