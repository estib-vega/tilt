import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import { llmAPI } from "./api/llm";

const app = new Hono();

app.use("*", logger());

const apiRoutes = app.basePath("/api").route("/llm", llmAPI);

app.use("*", serveStatic({ root: "./frontend/dist" }));
app.use("*", serveStatic({ path: "./frontend/dist/index.html" }));

export default app;

export type APIRoutes = typeof apiRoutes;
