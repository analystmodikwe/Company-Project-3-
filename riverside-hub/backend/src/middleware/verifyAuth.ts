

// Verifies the Supabase access token sent by the frontend and attaches
// the authenticated user's id + role to the request object.

import { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../config/env";
import { pool } from "../db/pool";

// Fetches and caches Supabase's public keys — created once at startup,
// not per-request, since jose handles caching/rotation internally.
const JWKS = createRemoteJWKSet(
  new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`),
);

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: "member" | "staff" | "admin";
      };
    }
  }
}

export async function verifyAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or malformed Authorization header" });
    return;
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    // Checks signature, expiry, and issuer against Supabase's public keys
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `${env.SUPABASE_URL}/auth/v1`,
    });

    const userId = payload.sub;
    if (!userId) {
      res.status(401).json({ error: "Token missing subject claim" });
      return;
    }

    // The JWT proves who the user is, but not their role — that's a
    // one-time lookup against your own profiles table.
    const result = await pool.query(
      "select role from profiles where id = $1",
      [userId]
    );

    if (result.rowCount === 0) {
      res.status(401).json({ error: "No profile found for this user" });
      return;
    }

    req.user = { id: userId, role: result.rows[0].role };
    next();
} catch (err) {
  res.status(401).json({ error: "Invalid or expired token" });
}
}