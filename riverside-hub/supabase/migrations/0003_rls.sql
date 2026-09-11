-- Migration 0003: Row Level Security
-- Run after 0001 and 0002. Every table gets RLS enabled 

alter table profiles enable row level security;
alter table resources enable row level security;
alter table bookings enable row level security;
alter table campaigns enable row level security;
alter table donations enable row level security;
alter table notifications enable row level security;

-- Helper used across multiple policies below, so "is this user staff or
-- admin" is defined once instead of repeated (and possibly drifting) in
-- every policy that needs it.
create or replace function is_staff_or_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('staff', 'admin')
  );
$$ language sql stable;

-- profiles: users read/update their own row; staff/admin can read all
create policy "own profile select" on profiles
  for select using (id = auth.uid() or is_staff_or_admin());
create policy "own profile update" on profiles
  for update using (id = auth.uid());

-- resources: public read, staff/admin manage
create policy "public read resources" on resources
  for select using (true);
create policy "staff manage resources" on resources
  for all using (is_staff_or_admin());

-- bookings: members see/manage only their own; staff/admin see all
create policy "own bookings select" on bookings
  for select using (member_id = auth.uid() or is_staff_or_admin());
create policy "own bookings insert" on bookings
  for insert with check (member_id = auth.uid());
create policy "own bookings update" on bookings
  for update using (member_id = auth.uid() or is_staff_or_admin());

-- campaigns: public read, admin write
create policy "public read campaigns" on campaigns
  for select using (true);
create policy "admin write campaigns" on campaigns
  for all using (is_staff_or_admin());

-- donations: insert-open (public, including anonymous), read/update admin-only
-- (or the donor themselves reading their own donation history)
create policy "public insert donations" on donations
  for insert with check (true);
create policy "own or admin read donations" on donations
  for select using (donor_id = auth.uid() or is_staff_or_admin());
create policy "admin update donations" on donations
  for update using (is_staff_or_admin());

-- notifications: strictly owner-only
create policy "own notifications select" on notifications
  for select using (user_id = auth.uid());
create policy "own notifications update" on notifications
  for update using (user_id = auth.uid());
