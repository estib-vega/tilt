import type { GenerateParams } from "./chatStreamGeneration";

const LOCAL_HOST_ADDRESS = "http://localhost:11434";

enum OllamaAPIEndpoint {
  Generate = "/api/generate",
  Chat = "/api/chat",
}

type OllamaModel = "llama3.1";



function getAPIUrl(endpoint: OllamaAPIEndpoint) {
  return `${LOCAL_HOST_ADDRESS}${endpoint}`;
}

export async function ollamaGenerateStream(params: GenerateParams<OllamaModel>): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(
    getAPIUrl(OllamaAPIEndpoint.Generate),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: params.model,
        prompt: params.prompt,
        context: params.context,
        stream: true,
        options: {
          temperature: params.temperature,
        },
      }),
    }
  );

  const genStream = response.body;
  if (!genStream) {
    throw new Error("Failed to create a readable stream.");
  }

  return genStream;
}
