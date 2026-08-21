-- Subscription state for The Voice.
--
-- The security model in one line: users may READ their own row, and
-- nobody may WRITE one from the browser. Only the Stripe webhook, which
-- runs server-side with the service-role key, can grant or revoke a plan.
-- That is what stops someone handing themselves a paid plan from devtools.

create table if not exists public.subscriptions (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  plan               text not null default 'free' check (plan in ('free', 'studio', 'pro')),
  stripe_customer_id text unique,
  updated_at         timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Read-only, and only your own row.
drop policy if exists "read own subscription" on public.subscriptions;
create policy "read own subscription"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

-- Deliberately no insert/update/delete policy for normal users. With RLS
-- enabled, absent policies mean denied. The service-role key used by the
-- webhook bypasses RLS, which is exactly the intended asymmetry.

-- Give every new signup a free row so the app always has something to read.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions (user_id, plan)
  values (new.id, 'free')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
