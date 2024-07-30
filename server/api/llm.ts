import { Hono } from "hono";

export const llmAPI = new Hono().get("/", (c) => {
  return c.json({ message: "Hello, World!" }, 200);
});
