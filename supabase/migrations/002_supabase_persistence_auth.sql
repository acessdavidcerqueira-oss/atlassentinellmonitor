create extension if not exists "pgcrypto";

alter table public.users
  add column if not exists auth_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists role text not null default 'Admin',
  add column if not exists team text not null default 'Operação',
  add column if not exists user_id uuid;

update public.users
set user_id = auth_user_id
where user_id is null and auth_user_id is not null;

create unique index if not exists users_auth_user_id_key
  on public.users(auth_user_id)
  where auth_user_id is not null;

create table if not exists public.blacklist_entries (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  value text not null,
  normalized_value text not null,
  kind text not null,
  status text not null,
  reason text,
  source text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, client_id),
  unique (user_id, normalized_value)
);

alter table public.monitored_entities
  add column if not exists client_id text,
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists payload jsonb not null default '{}'::jsonb;

alter table public.reports
  add column if not exists client_id text,
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists monitored_entity_client_id text,
  add column if not exists payload jsonb not null default '{}'::jsonb;

alter table public.incidents
  add column if not exists client_id text,
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists monitored_entity_client_id text,
  add column if not exists payload jsonb not null default '{}'::jsonb;

alter table public.actors
  add column if not exists client_id text,
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists payload jsonb not null default '{}'::jsonb;

alter table public.narratives
  add column if not exists client_id text,
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists payload jsonb not null default '{}'::jsonb;

alter table public.evidences
  add column if not exists client_id text,
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists incident_client_id text,
  add column if not exists payload jsonb not null default '{}'::jsonb;

alter table public.alerts
  add column if not exists client_id text,
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists incident_client_id text,
  add column if not exists payload jsonb not null default '{}'::jsonb;

alter table public.imports
  add column if not exists client_id text,
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists payload jsonb not null default '{}'::jsonb;

alter table public.audit_logs
  add column if not exists client_id text,
  add column if not exists entity_client_id text,
  add column if not exists payload jsonb not null default '{}'::jsonb;

alter table public.audit_logs drop constraint if exists audit_logs_user_id_fkey;
alter table public.audit_logs
  add constraint audit_logs_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

create unique index if not exists monitored_entities_user_client_key on public.monitored_entities(user_id, client_id) where user_id is not null and client_id is not null;
create unique index if not exists reports_user_client_key on public.reports(user_id, client_id) where user_id is not null and client_id is not null;
create unique index if not exists incidents_user_client_key on public.incidents(user_id, client_id) where user_id is not null and client_id is not null;
create unique index if not exists actors_user_client_key on public.actors(user_id, client_id) where user_id is not null and client_id is not null;
create unique index if not exists narratives_user_client_key on public.narratives(user_id, client_id) where user_id is not null and client_id is not null;
create unique index if not exists evidences_user_client_key on public.evidences(user_id, client_id) where user_id is not null and client_id is not null;
create unique index if not exists alerts_user_client_key on public.alerts(user_id, client_id) where user_id is not null and client_id is not null;
create unique index if not exists imports_user_client_key on public.imports(user_id, client_id) where user_id is not null and client_id is not null;
create unique index if not exists audit_logs_user_client_key on public.audit_logs(user_id, client_id) where user_id is not null and client_id is not null;

alter table public.blacklist_entries enable row level security;

drop policy if exists "authenticated read users" on public.users;
drop policy if exists "authenticated read monitored entities" on public.monitored_entities;
drop policy if exists "authenticated read incidents" on public.incidents;
drop policy if exists "authenticated insert incidents" on public.incidents;
drop policy if exists "authenticated update incidents" on public.incidents;
drop policy if exists "authenticated read audit" on public.audit_logs;
drop policy if exists "authenticated insert audit" on public.audit_logs;

create or replace function public.current_user_is_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where auth_user_id = (select auth.uid())
      and role in ('Admin', 'Super Admin')
  );
$$;

create policy "users can read allowed profiles"
on public.users for select
to authenticated
using (
  auth_user_id = (select auth.uid())
  or public.current_user_is_operator()
);

create policy "users can create own profile"
on public.users for insert
to authenticated
with check (auth_user_id = (select auth.uid()));

create policy "operators can create profiles"
on public.users for insert
to authenticated
with check (public.current_user_is_operator());

create policy "operators can update profiles"
on public.users for update
to authenticated
using (public.current_user_is_operator() or auth_user_id = (select auth.uid()))
with check (public.current_user_is_operator() or auth_user_id = (select auth.uid()));

create policy "users manage own monitored entities"
on public.monitored_entities for all
to authenticated
using (user_id = (select auth.uid()) and deleted_at is null)
with check (user_id = (select auth.uid()));

create policy "users manage own reports"
on public.reports for all
to authenticated
using (user_id = (select auth.uid()) and deleted_at is null)
with check (user_id = (select auth.uid()));

create policy "users manage own incidents"
on public.incidents for all
to authenticated
using (user_id = (select auth.uid()) and deleted_at is null)
with check (user_id = (select auth.uid()));

create policy "users manage own actors"
on public.actors for all
to authenticated
using (user_id = (select auth.uid()) and deleted_at is null)
with check (user_id = (select auth.uid()));

create policy "users manage own narratives"
on public.narratives for all
to authenticated
using (user_id = (select auth.uid()) and deleted_at is null)
with check (user_id = (select auth.uid()));

create policy "users manage own evidences"
on public.evidences for all
to authenticated
using (user_id = (select auth.uid()) and deleted_at is null)
with check (user_id = (select auth.uid()));

create policy "users manage own alerts"
on public.alerts for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "users manage own imports"
on public.imports for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "users manage own audit logs"
on public.audit_logs for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "users manage own blacklist"
on public.blacklist_entries for all
to authenticated
using (user_id = (select auth.uid()) and deleted_at is null)
with check (user_id = (select auth.uid()));
