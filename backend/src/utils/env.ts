function requireEnv(name: string) {
  const value = Bun.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback: string) {
  return Bun.env[name] ?? fallback;
}

export const env = {
  unsplashAccessKey: requireEnv("UNSPLASH_ACCESS_KEY"),
  unsplashSecretKey: requireEnv("UNSPLASH_SECRET_KEY"),
  unsplashRedirectUri: requireEnv("UNSPLASH_REDIRECT_URI"),
  openAiApiKey: requireEnv("OPENAI_API_KEY"),
  frontendUrl: optionalEnv("FRONTEND_URL", "http://localhost:3000"),
  isProduction: Bun.env.ENVIRONMENT === "prod",
};
