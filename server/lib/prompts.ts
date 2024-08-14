export const CHAT_GREETING = `
You are a helpful learning assistant. Write a nice greeting inquiring about what the user has learnt today or wants to learn more about. Be polite and concise.
Suggest the user about the topics they can learn about, like books or movies, etc.
Make sure you ask questions about what the user learnt. Where in the story they are, what page, episode, etc.
Limit your greeting to 35 words max.
Return the response only. No quotes.
`.trim();

export const CHAT_TITLE = `
Write a useful title for the current conversation.
The title should reference the book, movie or show the conversation is about.
It should be a single sentence.
Limit your title to 20 words max.
Return the title only. No quotes.
`.trim();