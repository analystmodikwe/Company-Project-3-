
// Entry point: sets up Express, middleware, and mounts every route module.

import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { verifyAuth } from "./middleware/verifyAuth";
import { requireRole } from "./middleware/requireRole";
import { resourcesRouter } from "./routes/resources";
import { bookingsRouter } from "./routes/bookings";
import { donationsRouter, adminDonationsRouter } from "./routes/donations";
import { campaignsRouter } from "./routes/campaigns";
import { staffRouter, adminReportsRouter } from "./routes/admin";
import { notificationsRouter } from "./routes/notifications";

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

// Role-gated — staff/admin only (kept as a simple sanity-check route)
app.get(
  "/api/staff/ping",
  verifyAuth,
  requireRole("staff", "admin"),
  (_req, res) => {
    res.json({ message: "You have staff or admin access." });
  }
);

// Feature routes
app.use("/api/resources", resourcesRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/donations", donationsRouter);
app.use("/api/campaigns", campaignsRouter);
app.use("/api/admin/donations", adminDonationsRouter);
app.use("/api/staff", staffRouter);
app.use("/api/admin", adminReportsRouter);
app.use("/api/notifications", notificationsRouter);

app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});