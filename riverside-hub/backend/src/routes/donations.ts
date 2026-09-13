// src/routes/donations.ts
import { Router } from "express";
import { pool } from "../db/pool";
import { verifyAuth, verifyTokenOptional } from "../middleware/verifyAuth";
import { requireRole } from "../middleware/requireRole";

export const donationsRouter = Router();

donationsRouter.get("/campaigns/active", async (_req, res) => {
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

donationsRouter.post("/", async (req, res) => {
  const { campaign_id, amount, is_recurring_pledge } = req.body;

  if (!campaign_id || !amount || amount <= 0) {
    res.status(400).json({ error: "campaign_id and a positive amount are required" });
    return;
  }

  // Optional auth: attribute to a logged-in user if a valid token is
  // present, otherwise record as anonymous (donor_id stays null).
  let donorId: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    donorId = await verifyTokenOptional(authHeader.slice(7));
  }

  try {
    const result = await pool.query(
      `insert into donations (donor_id, campaign_id, amount, is_recurring_pledge)
       values ($1, $2, $3, $4)
       returning id, campaign_id, amount, is_recurring_pledge, created_at`,
      [donorId, campaign_id, amount, !!is_recurring_pledge]
    );
    res.status(201).json({ donation: result.rows[0] });
  } catch (err) {
    console.error("Failed to record donation:", err);
    res.status(500).json({ error: "Failed to record donation" });
  }
});

donationsRouter.get("/admin/donations", verifyAuth, requireRole("admin"), async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = 25;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `select d.id, d.amount, d.is_recurring_pledge, d.created_at,
              d.campaign_id, c.title as campaign_title,
              p.full_name as donor_name
       from donations d
       join campaigns c on c.id = d.campaign_id
       left join profiles p on p.id = d.donor_id
       order by d.created_at desc
       limit $1 offset $2`,
      [limit, offset]
    );
    res.json({ donations: result.rows, page });
  } catch (err) {
    console.error("Failed to fetch donations:", err);
    res.status(500).json({ error: "Failed to fetch donations" });
  }
});

donationsRouter.get(
  "/admin/donations/export",
  verifyAuth,
  requireRole("admin"),
  async (_req, res) => {
    try {
      const result = await pool.query(
        `select d.id, d.amount, d.is_recurring_pledge, d.created_at,
                c.title as campaign_title, p.full_name as donor_name
         from donations d
         join campaigns c on c.id = d.campaign_id
         left join profiles p on p.id = d.donor_id
         order by d.created_at desc`
      );

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=donations.csv");

      const header = "id,amount,recurring_pledge,donor_name,campaign_title,created_at\n";
      const rows = result.rows
        .map((r) =>
          [r.id, r.amount, r.is_recurring_pledge, r.donor_name ?? "Anonymous", r.campaign_title, r.created_at.toISOString()]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");

      res.send(header + rows);
    } catch (err) {
      console.error("Failed to export donations:", err);
      res.status(500).json({ error: "Failed to export donations" });
    }
  }
);