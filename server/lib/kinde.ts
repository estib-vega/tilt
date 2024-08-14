import {
  createKindeServerClient,
  GrantType,
  type SessionManager,
  type UserType,
} from "@kinde-oss/kinde-typescript-sdk";
import type { Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import type { CookieOptions } from "hono/utils/cookie";

// Client for authorization code flow
export const kindeClient = createKindeServerClient(
  GrantType.AUTHORIZATION_CODE,
  {
    authDomain: process.env.KINDE_DOMAIN!,
    clientId: process.env.KINDE_CLIENT_ID!,
    clientSecret: process.env.KINDE_CLIENT_SECRET!,
    redirectURL: process.env.KINDE_REDIRECT_URI!,
    logoutRedirectURL: process.env.KINDE_LOGOUT_REDIRECT_URI!,
  }
);

export function getSessionManager(c: Context): SessionManager {
  return {
    async getSessionItem(key: string) {
      const cookie = getCookie(c, key);
      return cookie;
    },
    async setSessionItem(key: string, value: unknown) {
      const opts: CookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
      };

      if (typeof value === "string") {
        setCookie(c, key, value, opts);
        return;
      }

      setCookie(c, key, JSON.stringify(value), opts);
    },
    async removeSessionItem(key: string) {
      deleteCookie(c, key);
    },
    async destroySession() {
      ["id_token", "access_token", "user", "refresh_token"].forEach((key) =>
        deleteCookie(c, key)
      );
    },
  };
}

type Env = {
  Variables: {
    user: UserType;
  };
};

export const authorize = createMiddleware<Env>(async (c, next) => {
  try {
    const sessionManager = getSessionManager(c);

    const isAuthenticated = await kindeClient.isAuthenticated(sessionManager);
    if (!isAuthenticated) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const user = await kindeClient.getUserProfile(sessionManager);
    c.set("user", user);
    await next();
  } catch (e) {
    console.error(e);
    return c.json({ error: "Unauthorized" }, 401);
  }
});
