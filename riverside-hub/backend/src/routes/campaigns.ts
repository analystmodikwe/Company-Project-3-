// src/routes/campaigns.ts
import { Router } from "express";
import { pool } from "../db/pool";

export const campaignsRouter = Router();

// GET /api/campaigns/active
campaignsRouter.get("/active", async (_req, res) => {
  try {
    const result = await pool.query(
      `select id, title, goal_amount, current_amount
       from campaigns where active = true
       order by id limit 1`
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: "No active campaign" });
      return;
    }
    res.json({ campaign: result.rows[0] });
  } catch (err) {
    console.error("Failed to fetch campaign:", err);
    res.status(500).json({ error: "Failed to fetch campaign" });
  }
});