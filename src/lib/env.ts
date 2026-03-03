import "server-only";

type RequiredServerEnvKey =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY";

function readEnv(key: string): string | undefined {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    return undefined;
  }
  return value;
}

export function requireServerEnv(key: RequiredServerEnvKey): string {
  const value = readEnv(key);
  if (!value) {
    throw new Error(`Missing required server env var: ${key}`);
  }
  return value;
}

export function optionalServerEnv(key: string): string | undefined {
  return readEnv(key);
}

export const serverRuntimeConfig = {
  appUrl: readEnv("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000",
  stripeSecretKey: readEnv("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: readEnv("STRIPE_WEBHOOK_SECRET"),
  stripeProPriceId: readEnv("STRIPE_PRO_PRICE_ID"),
  spotifyClientId: readEnv("SPOTIFY_CLIENT_ID"),
  spotifyClientSecret: readEnv("SPOTIFY_CLIENT_SECRET"),
  publicMetricsEndpoint: readEnv("PUBLIC_METRICS_ENDPOINT"),
  ingestCronSecret: readEnv("INGEST_CRON_SECRET") ?? readEnv("VERCEL_CRON_SECRET"),
};
