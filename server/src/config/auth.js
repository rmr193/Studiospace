import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import dotenv from "dotenv";

dotenv.config();

let authInstance = null;

export function initBetterAuth(db) {
  if (authInstance) return authInstance;

  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  const serverUrl =
    process.env.BETTER_AUTH_URL ||
    (process.env.RENDER_EXTERNAL_URL
      ? process.env.RENDER_EXTERNAL_URL
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:${process.env.PORT || 5000}`);

  authInstance = betterAuth({
    database: mongodbAdapter(db, {
      usePlural: true,
    }),
    secret:
      process.env.BETTER_AUTH_SECRET || "studiospace_better_auth_secret_replace_in_production_2026",
    baseURL: serverUrl,
    trustedOrigins: [
      clientUrl,
      serverUrl,
      "https://studiospace-lyart.vercel.app",
      "https://studiospace-t70a.onrender.com",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://localhost:5000",
      "https://*.vercel.app",
      "https://*.onrender.com",
    ],
    account: {
      skipStateCookieCheck: true,
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 6,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      },
    },
    user: {
      modelName: "user",
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "host",
        },
        wishlist: {
          type: "string[]",
          required: false,
          defaultValue: [],
        },
      },
    },
    advanced: {
      defaultCookieAttributes: {
        sameSite:
          process.env.NODE_ENV === "production" || process.env.RENDER || process.env.VERCEL
            ? "none"
            : "lax",
        secure: Boolean(
          process.env.NODE_ENV === "production" || process.env.RENDER || process.env.VERCEL
        ),
      },
    },
  });

  return authInstance;
}

export function getBetterAuth() {
  return authInstance;
}
