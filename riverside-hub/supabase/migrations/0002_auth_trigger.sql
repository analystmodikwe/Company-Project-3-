-- Migration 0002: link Supabase Auth signups to the profiles table
-- Without this, every new user would need a manual profiles insert, and
-- anything that joins on profiles would fail for brand-new accounts.

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    -- full_name is passed in from the frontend signup call as user metadata
    -- (supabase.auth.signUp({ options: { data: { full_name: '...' } } }))
    -- falls back to email if it's ever missing, so the insert never fails
    -- on a not-null violation.

    -- everyone starts as a member; staff/admin promoted manually
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'member'  
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Fires after Supabase Auth creates the user, before anything else can
-- reference profiles for this user.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
