import type { Context } from "hono";
import { stream } from "hono/streaming";

/**
 * Return a response with the LLM stream.
 *
 * @param genStream - The LLM stream to send.
 * @param c - The API context object.
 * @returns A promise that resolves when the stream is sent.
 */
export function sendLLMStream(
  genStream: ReadableStream<Uint8Array>,
  c: Context
) {
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
}
