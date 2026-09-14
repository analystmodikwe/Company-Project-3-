live Deployment: https://company-project-3.vercel.app/

# Riverside Community Hub

A full-stack platform for Riverside Community Hub (a fictional NPO) that
replaces paper/WhatsApp-based membership, booking, and donation tracking
with a single web application.

Public visitors can browse programmes and facilities and donate. Members
can book rooms/equipment and manage their bookings. Staff/admin approve
bookings, manage members, and view funder reports.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite, Tailwind CSS, React Router |
| Backend | Node.js + Express + TypeScript |
| Database & Auth | Supabase (Postgres, Supabase Auth, Row Level Security) |
| Deployment | Frontend on Vercel/Netlify, backend on Render/Railway, Supabase managed |

## Architecture

Supabase Auth issues JWTs; the frontend talks to Supabase Auth directly
(via `supabase-js`) for signup/login/session management. All other
reads/writes to protected data go through the Express API, which:

1. Verifies the Supabase-issued JWT against Supabase's public JWKS
   endpoint (`/auth/v1/.well-known/jwks.json`) — no shared secret needed.
2. Looks up the user's `role` from the `profiles` table (the JWT itself
   doesn't carry app-specific roles).
3. Enforces role-based authorization in route middleware
   (`verifyAuth` + `requireRole`).

Row Level Security policies on every table act as a second line of
defense underneath the Express authorization layer — even a bug in a
route's role check can't bypass what the database itself allows.

Double-booking prevention is enforced at the database level via a
Postgres `EXCLUDE USING gist` constraint on `(resource_id, time range)`,
not just an application-level check — this holds even under concurrent
requests, closing race conditions that a "check then insert" approach
would miss.

## Project structure

```
riverside-hub/
├── backend/          Express + TypeScript API
│   └── src/
│       ├── config/     env loading/validation
│       ├── db/         Postgres connection pool
│       ├── middleware/ JWT verification, role gating
│       └── routes/     one file per resource (bookings, donations, etc.)
├── frontend/         React + TypeScript + Vite app
│   └── src/
│       ├── context/    AuthContext (session + role)
│       ├── lib/        Supabase client, API client
│       └── pages/      one file per route/screen
├── supabase/
│   ├── migrations/     numbered SQL migrations (schema, auth trigger, RLS)
│   └── seed.sql         seed data (rooms, equipment, initial campaign)
└── docs/
    ├── README.md        this file
    ├── API.md           full route reference
    └── handover.md       non-technical guide for Riverside staff
```

## Local setup

### 1. Supabase project

1. Create a project at supabase.com.
2. Install the Supabase CLI and run, from `riverside-hub/`:
   ```
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
3. Run `supabase/seed.sql` once against your project (via the dashboard's
   SQL Editor, or `psql`) to load starter rooms/equipment and the first
   donation campaign.

### 2. Backend

```
cd backend
npm install
```

Create `backend/.env`:
```
PORT=4000
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_ANON_KEY=<your publishable/anon key — Dashboard → API Keys>
DATABASE_URL=<your Postgres connection string — Dashboard → Database → Connection string>
```

```
npm run dev
```

Server runs at `http://localhost:4000`.

### 3. Frontend

```
cd frontend
npm install
```

Create `frontend/.env`:
```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<same anon key as above>
VITE_API_URL=http://localhost:4000/api
```

```
npm run dev
```

App runs at `http://localhost:5173`.

## Roles

New signups default to `member`. Promote a user to `staff` or `admin`
manually via SQL Editor:
```sql
update profiles set role = 'staff' where id = '<user-id>';
```

## Environment variables reference

| Variable | Where | Purpose |
|---|---|---|
| `SUPABASE_URL` | backend | Used to build the JWKS verification URL |
| `SUPABASE_ANON_KEY` | backend | Used by optional-auth donation flow |
| `DATABASE_URL` | backend | Direct Postgres connection for all queries |
| `VITE_SUPABASE_URL` | frontend | Supabase Auth client |
| `VITE_SUPABASE_ANON_KEY` | frontend | Supabase Auth client (public key, safe to expose) |
| `VITE_API_URL` | frontend | Base URL for calls to the Express API |

None of these `.env` files are committed — see each folder's
`.gitignore`.