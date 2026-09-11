-- Migration 0001: core schema for Riverside Community Hub


--  Enums
-- Using enums instead of text so invalid values (typos, bad states) are
-- rejected by Postgres itself, not caught later by application code.
create type user_role as enum ('member', 'staff', 'admin');
create type membership_tier as enum ('free', 'standard', 'family');
create type booking_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type resource_type as enum ('room', 'equipment');

-- Profiles 
-- Shadow table for auth.users, since we can't add custom columns (role,
-- membership_tier) directly to Supabase's managed auth.users table.
-- on delete cascade: if a user is removed from auth.users, their profile
-- goes with them instead of becoming an orphaned row.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null default 'member',
  membership_tier membership_tier not null default 'free',
  joined_at timestamptz not null default now(),
  membership_expires_at date
);

--  Resources (rooms + equipment) 
create table resources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type resource_type not null,
  capacity int,
  description text
);

-- Bookings 
create table bookings (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references resources(id),
  member_id uuid not null references profiles(id),
  start_time timestamptz not null,
  end_time timestamptz not null,
  status booking_status not null default 'pending',
  created_at timestamptz not null default now(),
  constraint valid_range check (start_time < end_time)
);

-- Enables GiST indexing on plain equality columns (resource_id) alongside
-- range types (tstzrange) — required for the exclusion constraint below.
create extension if not exists btree_gist;

-- The actual double-booking prevention. Postgres checks this atomically as
-- part of every insert/update, so it holds even under concurrent requests 

-- Only pending/approved bookings block a slot; rejected/cancelled don't.
alter table bookings
  add constraint no_overlapping_bookings
  exclude using gist (
    resource_id with =,
    tstzrange(start_time, end_time) with &&
  ) where (status in ('pending', 'approved'));

create index idx_bookings_member on bookings(member_id);
create index idx_bookings_resource_time on bookings(resource_id, start_time);

--  Campaigns & donations 
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  goal_amount numeric(10,2) not null,
  current_amount numeric(10,2) not null default 0,
  active boolean not null default true
);

create table donations (
  id uuid primary key default gen_random_uuid(),

  -- nullable: anonymous donations allowed
  donor_id uuid references profiles(id),  

  campaign_id uuid not null references campaigns(id),
  amount numeric(10,2) not null check (amount > 0),
  is_recurring_pledge boolean not null default false,
  created_at timestamptz not null default now()  
);

create index idx_donations_campaign on donations(campaign_id);

-- Keeps campaigns.current_amount up to date without a background job or
-- an expensive SUM() query every time the progress bar loads.
create or replace function bump_campaign_total()
returns trigger as $$
begin
  update campaigns
  set current_amount = current_amount + new.amount
  where id = new.campaign_id;
  return new;
end;
$$ language plpgsql;

create trigger on_donation_insert
  after insert on donations
  for each row execute function bump_campaign_total();

-- Notifications 
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Partial index: only indexes unread rows, since that's the only query
-- pattern this table actually needs to be fast for.
create index idx_notifications_user_unread on notifications(user_id) where read = false;
