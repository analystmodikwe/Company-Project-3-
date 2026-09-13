console.log("DB URL length:", env.DATABASE_URL?.length, "starts with:", env.DATABASE_URL?.slice(0, 20));
// A single shared Postgres connection pool, reused across every query.

import { Pool } from "pg";
import { env } from "../config/env";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Supabase's managed Postgres requires SSL; this is the standard
  // workaround since Node doesn't automatically trust their cert chain.
  ssl: { rejectUnauthorized: false },
});