import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import { llmAPI } from "./api/llm";
import { auth } from "./api/auth";

const app = new Hono();

app.use("*", logger());

const apiRoutes = app
  .basePath("/api")
  .route("/llm", llmAPI)
  .route("/auth", auth);

app.use("*", serveStatic({ root: "./frontend/dist" }));
app.use("*", serveStatic({ path: "./frontend/dist/index.html" }));

export default app;

export type APIRoutes = typeof apiRoutes;
