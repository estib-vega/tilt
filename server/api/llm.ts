import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  chatGreeting,
  chatTitle,
  ChatTitleRequestSchema,
  generate,
  GenerateRequestSchema,
} from "../lib/ai/llm";
import { sendLLMStream } from "../utils/streaming";

export const llmAPI = new Hono()
  .get("greeting", async (c) => {
    const genStream = await chatGreeting();
    return sendLLMStream(genStream, c);
  })
  .post("generate", zValidator("json", GenerateRequestSchema), async (c) => {
    const params = c.req.valid("json");
    const genStream = await generate(params);
    return sendLLMStream(genStream, c);
  })
  .post("title", zValidator("json", ChatTitleRequestSchema), async (c) => {
    const params = c.req.valid("json");
    const genStream = await chatTitle(params);
    return sendLLMStream(genStream, c);
  });
