// src/routes/resources.ts
//
// Public routes for browsing bookable resources (rooms + equipment).
// No auth required — this is the public catalogue.

import { Router } from "express";
import { pool } from "../db/pool";

export const resourcesRouter = Router();

// GET /api/resources — full catalogue, no filtering yet
resourcesRouter.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      "select id, name, type, capacity, description from resources order by type, name"
    );
    res.json({ resources: result.rows });
  } catch (err) {
    console.error("Failed to fetch resources:", err);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

// GET /api/resources/:id/availability — existing bookings for one resource
// Returns pending/approved bookings' time ranges so the frontend can grey
// out unavailable slots. Doesn't require auth — availability is public info,
// even though creating a booking will require it.
resourcesRouter.get("/:id/availability", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `select start_time, end_time, status
       from bookings
       where resource_id = $1
         and status in ('pending', 'approved')
       order by start_time`,
      [id]
    );
    res.json({ bookings: result.rows });
  } catch (err) {
    console.error("Failed to fetch availability:", err);
    res.status(500).json({ error: "Failed to fetch availability" });
  }
});