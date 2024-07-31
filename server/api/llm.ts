import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { generate, GenerateRequestSchema } from "../lib/llm";
import { stream } from "hono/streaming";

export const llmAPI = new Hono()
  .post("generate", zValidator("json", GenerateRequestSchema), async (c) => {
    const params = c.req.valid("json");
    const genStream = await generate(params);
    return stream(
      c,
      async (stream) => {
        await stream.pipe(genStream);
      },
      async (err, stream) => {
        console.error(err);
        await stream.writeln("An error occurred!");
      }
    );
  });
