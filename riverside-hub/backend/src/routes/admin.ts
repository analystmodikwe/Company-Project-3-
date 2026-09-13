// src/routes/admin.ts
//
// Admin-only reporting and member management. Everything here requires
// staff or admin depending on sensitivity — member directory is
// staff+admin (per the brief), reports are staff+admin too.

import { Router } from "express";
import { pool } from "../db/pool";
import { verifyAuth } from "../middleware/verifyAuth";
import { requireRole } from "../middleware/requireRole";

export const adminRouter = Router();

// GET /api/staff/members — member directory, search/filter, paginated
adminRouter.get("/members", verifyAuth, requireRole("staff", "admin"), async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = 25;
  const offset = (page - 1) * limit;
  const search = (req.query.search as string) || "";

  try {
    const result = await pool.query(
      `select id, full_name, role, membership_tier, joined_at, membership_expires_at
       from profiles
       where full_name ilike $1
       order by joined_at desc
       limit $2 offset $3`,
      [`%${search}%`, limit, offset]
    );
    res.json({ members: result.rows, page });
  } catch (err) {
    console.error("Failed to fetch members:", err);
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

// GET /api/admin/reports/summary — bookings this month, total donations, active members
adminRouter.get("/reports/summary", verifyAuth, requireRole("staff", "admin"), async (_req, res) => {
  try {
    const [bookingsThisMonth, totalDonations, activeMembers] = await Promise.all([
      pool.query(
        `select count(*) from bookings
         where created_at >= date_trunc('month', now())`
      ),
      pool.query(`select coalesce(sum(amount), 0) as total from donations`),
      pool.query(
        `select count(*) from profiles
         where membership_expires_at is null or membership_expires_at >= current_date`
      ),
    ]);

    res.json({
      bookings_this_month: parseInt(bookingsThisMonth.rows[0].count),
      total_donations: parseFloat(totalDonations.rows[0].total),
      active_members: parseInt(activeMembers.rows[0].count),
    });
  } catch (err) {
    console.error("Failed to fetch report summary:", err);
    res.status(500).json({ error: "Failed to fetch report summary" });
  }
});