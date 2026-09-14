# API Reference

Base URL: `http://localhost:4000/api` (local) — i will replace with the deployed one wheni am done deploying
backend URL in production.

## Authentication

Protected routes require an `Authorization: Bearer <token>` header, where
`<token>` is the Supabase Auth access token from the current session
(`supabase.auth.getSession()` on the frontend).

The backend does not issue its own tokens — it verifies the token
Supabase Auth already issued, then looks up the user's role from the
`profiles` table.

Roles: `member` (default on signup), `staff`, `admin`.

---

## Health

### `GET /health`
Public. Returns `{ "status": "ok" }`. No auth.

---

## Resources

### `GET /resources`
Public. Returns the full catalogue of bookable rooms and equipment.

**Response 200**
```json
{ "resources": [ { "id": "uuid", "name": "Main Hall", "type": "room", "capacity": 80, "description": "..." } ] }
```

### `GET /resources/:id/availability`
Public. Returns pending/approved bookings for one resource, so a
frontend calendar can show taken slots.

**Response 200**
```json
{ "bookings": [ { "start_time": "...", "end_time": "...", "status": "approved" } ] }
```

---

## Bookings

### `POST /bookings`
Auth required (any role). Creates a booking request with `status: pending`.

**Body**
```json
{ "resource_id": "uuid", "start_time": "ISO 8601", "end_time": "ISO 8601" }
```

**Response 201** — the created booking.
**Response 400** — missing fields, or `end_time` not after `start_time`.
**Response 409** — the resource is already booked for an overlapping
time (enforced by a database exclusion constraint, not just app logic).

### `GET /bookings/me`
Auth required. Returns the current user's own bookings, paginated
(`?page=`).

### `PATCH /bookings/:id/cancel`
Auth required. Cancels a booking — only the owning member can cancel
their own booking.

**Response 404** if the booking doesn't exist or belongs to someone else
(same response either way, to avoid leaking which bookings exist).

### `GET /bookings/staff/pending`
Requires `staff` or `admin`. Returns all pending bookings across all
members, oldest first.

### `PATCH /bookings/staff/:id/approve`
Requires `staff` or `admin`. Approves a pending booking and creates a
notification for the member.

### `PATCH /bookings/staff/:id/reject`
Requires `staff` or `admin`. Rejects a pending booking and creates a
notification for the member.

---

## Donations

### `GET /campaigns/active`
Public. Returns the current active donation campaign and its progress.

**Response 200**
```json
{ "campaign": { "id": "uuid", "title": "...", "goal_amount": "50000.00", "current_amount": "1120.00" } }
```

### `POST /donations`
Public — auth is optional. If a valid `Authorization` header is present,
the donation is attributed to that user (`donor_id`); otherwise it's
recorded anonymously (`donor_id: null`).

**Body**
```json
{ "campaign_id": "uuid", "amount": 250, "is_recurring_pledge": false }
```

`is_recurring_pledge` is logged as intent only — no real recurring
billing is triggered.

### `GET /admin/donations`
Requires `admin`. Full donation list, paginated, with donor name (or
"Anonymous") and campaign title joined in.

### `GET /admin/donations/export`
Requires `admin`. Streams a CSV file of all donations.

---

## Staff / Admin

### `GET /staff/members`
Requires `staff` or `admin`. Member directory, paginated, with optional
`?search=` filtering on name.

### `GET /admin/reports/summary`
Requires `staff` or `admin`. Returns aggregate figures for the admin
dashboard.

**Response 200**
```json
{ "bookings_this_month": 4, "total_donations": 1120, "active_members": 12 }
```

---

## Notifications

### `GET /notifications/me`
Auth required. The current user's own notifications, most recent first
(max 50).

### `PATCH /notifications/:id/read`
Auth required. Marks one of the user's own notifications as read.

---

## Error format

All error responses follow the same shape:
```json
{ "error": "Human-readable message" }
```

Common status codes: `400` (bad input), `401` (missing/invalid token),
`403` (wrong role), `404` (not found or not yours), `409` (booking
conflict), `500` (server error, logged server-side).