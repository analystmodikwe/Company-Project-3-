
// Booking creation, member's own bookings, and staff approval workflow.
// All routes here require auth — booking anything requires knowing who
// you are, and approving requires knowing you're staff/admin.

import { Router } from "express";
import { pool } from "../db/pool";
import { verifyAuth } from "../middleware/verifyAuth";
import { requireRole } from "../middleware/requireRole";

export const bookingsRouter = Router();

// POST /api/bookings — member creates a booking request
// Relies on the DB exclusion constraint (see migration 0001) to reject
// overlapping bookings — we don't need to manually check for conflicts
// here, Postgres does it atomically on insert.
bookingsRouter.post("/", verifyAuth, async (req, res) => {
  const { resource_id, start_time, end_time } = req.body;

  if (!resource_id || !start_time || !end_time) {
    res.status(400).json({ error: "resource_id, start_time, and end_time are required" });
    return;
  }

  try {
    const result = await pool.query(
      `insert into bookings (resource_id, member_id, start_time, end_time)
       values ($1, $2, $3, $4)
       returning id, resource_id, start_time, end_time, status`,
      [resource_id, req.user!.id, start_time, end_time]
    );
    res.status(201).json({ booking: result.rows[0] });
  } catch (err: any) {
    // Postgres error code 23P01 = exclusion_violation — this is the
    // double-booking constraint firing. Turn it into a friendly message
    // instead of a raw Postgres error leaking to the client.
    if (err.code === "23P01") {
      res.status(409).json({ error: "This resource is already booked for that time slot" });
      return;
    }
    console.error("Failed to create booking:", err);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// GET /api/bookings/me — member's own bookings, paginated
bookingsRouter.get("/me", verifyAuth, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `select b.id, b.resource_id, r.name as resource_name, b.start_time,
              b.end_time, b.status, b.created_at
       from bookings b
       join resources r on r.id = b.resource_id
       where b.member_id = $1
       order by b.start_time desc
       limit $2 offset $3`,
      [req.user!.id, limit, offset]
    );
    res.json({ bookings: result.rows, page });
  } catch (err) {
    console.error("Failed to fetch bookings:", err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// PATCH /api/bookings/:id/cancel — member cancels their own booking
bookingsRouter.patch("/:id/cancel", verifyAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `update bookings
       set status = 'cancelled'
       where id = $1 and member_id = $2
       returning id, status`,
      [id, req.user!.id]
    );

    if (result.rowCount === 0) {
      // Either the booking doesn't exist, or it belongs to someone else —
      // we don't distinguish, to avoid leaking which bookings exist.
      res.status(404).json({ error: "Booking not found" });
      return;
    }

    res.json({ booking: result.rows[0] });
  } catch (err) {
    console.error("Failed to cancel booking:", err);
    res.status(500).json({ error: "Failed to cancel booking" });
  }
});

// GET /api/staff/bookings/pending — staff/admin approval queue
bookingsRouter.get(
  "/staff/pending",
  verifyAuth,
  requireRole("staff", "admin"),
  async (_req, res) => {
    try {
      const result = await pool.query(
        `select b.id, b.resource_id, r.name as resource_name, b.member_id,
                p.full_name as member_name, b.start_time, b.end_time, b.created_at
         from bookings b
         join resources r on r.id = b.resource_id
         join profiles p on p.id = b.member_id
         where b.status = 'pending'
         order by b.created_at asc`
      );
      res.json({ bookings: result.rows });
    } catch (err) {
      console.error("Failed to fetch pending bookings:", err);
      res.status(500).json({ error: "Failed to fetch pending bookings" });
    }
  }
);

// PATCH /api/staff/bookings/:id/approve
bookingsRouter.patch(
  "/staff/:id/approve",
  verifyAuth,
  requireRole("staff", "admin"),
  async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        `update bookings set status = 'approved' where id = $1 and status = 'pending'
         returning id, member_id, status`,
        [id]
      );

      if (result.rowCount === 0) {
        res.status(404).json({ error: "Pending booking not found" });
        return;
      }

      const booking = result.rows[0];

      // Notify the member — this is the notifications table doing its job.
      await pool.query(
        `insert into notifications (user_id, message) values ($1, $2)`,
        [booking.member_id, "Your booking has been approved."]
      );

      res.json({ booking });
    } catch (err) {
      console.error("Failed to approve booking:", err);
      res.status(500).json({ error: "Failed to approve booking" });
    }
  }
);

// PATCH /api/staff/bookings/:id/reject
bookingsRouter.patch(
  "/staff/:id/reject",
  verifyAuth,
  requireRole("staff", "admin"),
  async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        `update bookings set status = 'rejected' where id = $1 and status = 'pending'
         returning id, member_id, status`,
        [id]
      );

      if (result.rowCount === 0) {
        res.status(404).json({ error: "Pending booking not found" });
        return;
      }

      const booking = result.rows[0];

      await pool.query(
        `insert into notifications (user_id, message) values ($1, $2)`,
        [booking.member_id, "Your booking has been rejected."]
      );

      res.json({ booking });
    } catch (err) {
      console.error("Failed to reject booking:", err);
      res.status(500).json({ error: "Failed to reject booking" });
    }
  }
);