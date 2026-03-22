function requireEnv(name: string) {
  const value = Bun.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  unsplashAccessKey: requireEnv("UNSPLASH_ACCESS_KEY"),
  unsplashSecretKey: requireEnv("UNSPLASH_SECRET_KEY"),
  unsplashRedirectUri: requireEnv("UNSPLASH_REDIRECT_URI"),
  openAiApiKey: requireEnv("OPENAI_API_KEY"),
  isProduction: Bun.env.ENVIRONMENT === "prod",
};
