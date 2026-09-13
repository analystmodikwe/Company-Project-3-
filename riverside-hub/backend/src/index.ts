
// Entry point: sets up Express and a few test routes to prove the
// auth chain works before real feature routes are built.

import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { verifyAuth } from "./middleware/verifyAuth";
import { requireRole } from "./middleware/requireRole";
import { resourcesRouter } from "./routes/resources";
const app = express();

app.use(cors());
app.use(express.json());

// Public — no auth needed
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Authenticated — any logged-in user
app.get("/api/me", verifyAuth, (req, res) => {
  res.json({ user: req.user });
});

// Role-gated — staff/admin only
app.get(
  "/api/staff/ping",
  verifyAuth,
  requireRole("staff", "admin"),
  (_req, res) => {
    res.json({ message: "You have staff or admin access." });
  }
);

app.use("/api/resources", resourcesRouter);

app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});