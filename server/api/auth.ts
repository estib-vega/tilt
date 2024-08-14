import { Hono } from "hono";
import { getSessionManager, kindeClient, authorize } from "../lib/kinde";

export const auth = new Hono()
  .get("/login", async (c) => {
    const sessionManager = getSessionManager(c);
    const loginUrl = await kindeClient.login(sessionManager);
    return c.redirect(loginUrl.toString());
  })
  .get("/logout", async (c) => {
    const sessionManager = getSessionManager(c);
    const logoutUrl = await kindeClient.logout(sessionManager);
    return c.redirect(logoutUrl.toString());
  })
  .get("/register", async (c) => {
    const sessionManager = getSessionManager(c);
    const registerUrl = await kindeClient.register(sessionManager);
    return c.redirect(registerUrl.toString());
  })
  .get("/callback", async (c) => {
    const sessionManager = getSessionManager(c);
    const url = new URL(c.req.url);
    await kindeClient.handleRedirectToApp(sessionManager, url);
    return c.redirect("/");
  })
  .get("/me", authorize, async (c) => {
    const user = c.var.user;
    return c.json({ user });
  });
