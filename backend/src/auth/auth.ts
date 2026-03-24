import type { Cookie } from "elysia";
import { generateHash } from "../utils/utils";
import { env } from "../utils/env";

export const issueOauthState = (oauth_state: Cookie<string | undefined>) => {
  const state = generateHash(16);
  oauth_state.set({
    value: state,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return state;
};

export const exchangeCodeForToken = async (code: string) => {
  const body = JSON.stringify({
    client_id: env.unsplashAccessKey,
    client_secret: env.unsplashSecretKey,
    redirect_uri: env.unsplashRedirectUri,
    code,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://unsplash.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(
      `Unsplash OAuth exchange failed: ${response.status} ${await response.text()}`,
    );
  }

  const auth = (await response.json()) as {
    access_token: string;
    token_type: string;
    scope: string;
    created_at: number;
  };

  return auth.access_token;
};
