
// Central place to load and validate environment variables.


import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  PORT: process.env.PORT || "4000",

  // Dashboard  Project Settings General  Project URL
  SUPABASE_URL: requireEnv("SUPABASE_URL"),

  // Dashboard Project Settings Database Connection string  URI
  DATABASE_URL: requireEnv("DATABASE_URL"),

  SUPABASE_ANON_KEY: requireEnv("SUPABASE_ANON_KEY")
};