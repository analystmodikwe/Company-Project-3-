// src/routes/notifications.ts
import { Router } from "express";
import { pool } from "../db/pool";
import { verifyAuth } from "../middleware/verifyAuth";

export const notificationsRouter = Router();

// GET /api/notifications/me — the logged-in user's own notifications
notificationsRouter.get("/me", verifyAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `select id, message, read, created_at
       from notifications
       where user_id = $1
       order by created_at desc
       limit 50`,
      [req.user!.id]
    );
    res.json({ notifications: result.rows });
  } catch (err) {
    console.error("Failed to fetch notifications:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// PATCH /api/notifications/:id/read — mark one as read
notificationsRouter.patch("/:id/read", verifyAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `update notifications set read = true
       where id = $1 and user_id = $2
       returning id, read`,
      [id, req.user!.id]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }
    res.json({ notification: result.rows[0] });
  } catch (err) {
    console.error("Failed to mark notification read:", err);
    res.status(500).json({ error: "Failed to update notification" });
  }
});