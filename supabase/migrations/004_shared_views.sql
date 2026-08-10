create extension if not exists "pgcrypto" with schema extensions;

create table if not exists public.shared_views (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  monitored_entity_id text not null,
  token_hash text not null unique,
  name text,
  created_at timestamptz not null default now(),
  unique (owner_user_id, monitored_entity_id)
);

alter table public.shared_views enable row level security;

create or replace function public.shared_view_token_hash(p_token text)
returns text
language sql
immutable
set search_path = public
as $$
  select encode(extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex');
$$;

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

create or replace function public.current_user_is_super_admin()
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
      and role = 'Super Admin'
  );
$$;

drop policy if exists "operators read own shared views" on public.shared_views;
create policy "operators read own shared views"
on public.shared_views for select
to authenticated
using (
  owner_user_id = (select auth.uid())
  or public.current_user_is_super_admin()
);

drop policy if exists "operators create shared views" on public.shared_views;
create policy "operators create shared views"
on public.shared_views for insert
to authenticated
with check (
  public.current_user_is_operator()
  and (
    owner_user_id = (select auth.uid())
    or public.current_user_is_super_admin()
  )
);

drop policy if exists "operators update shared views" on public.shared_views;
create policy "operators update shared views"
on public.shared_views for update
to authenticated
using (
  public.current_user_is_operator()
  and (
    owner_user_id = (select auth.uid())
    or public.current_user_is_super_admin()
  )
)
with check (
  public.current_user_is_operator()
  and (
    owner_user_id = (select auth.uid())
    or public.current_user_is_super_admin()
  )
);

create or replace function public.create_or_get_shared_view(
  p_monitored_entity_id text,
  p_name text default null
)
returns table (
  token text,
  monitored_entity_id text,
  name text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_requester uuid := auth.uid();
  v_owner uuid;
  v_entity_name text;
  v_existing public.shared_views%rowtype;
  v_token uuid;
begin
  if v_requester is null or not public.current_user_is_operator() then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  select entity.user_id, entity.name
    into v_owner, v_entity_name
  from public.monitored_entities entity
  where entity.client_id = p_monitored_entity_id
    and entity.deleted_at is null
    and (
      entity.user_id = v_requester
      or public.current_user_is_super_admin()
    )
  order by (entity.user_id = v_requester) desc, entity.created_at desc
  limit 1;

  if v_owner is null then
    raise exception 'monitored entity not found' using errcode = 'P0002';
  end if;

  select *
    into v_existing
  from public.shared_views shared
  where shared.owner_user_id = v_owner
    and shared.monitored_entity_id = p_monitored_entity_id
  limit 1;

  if found then
    if p_name is not null and p_name <> '' and v_existing.name is distinct from p_name then
      update public.shared_views
      set name = p_name
      where id = v_existing.id
      returning * into v_existing;
    end if;

    return query
      select
        v_existing.id::text,
        v_existing.monitored_entity_id,
        coalesce(v_existing.name, v_entity_name),
        v_existing.created_at;
    return;
  end if;

  v_token := gen_random_uuid();

  insert into public.shared_views (id, owner_user_id, monitored_entity_id, token_hash, name)
  values (
    v_token,
    v_owner,
    p_monitored_entity_id,
    public.shared_view_token_hash(v_token::text),
    coalesce(nullif(p_name, ''), v_entity_name)
  )
  returning * into v_existing;

  return query
    select
      v_existing.id::text,
      v_existing.monitored_entity_id,
      coalesce(v_existing.name, v_entity_name),
      v_existing.created_at;
end;
$$;

create or replace function public.get_shared_view_state(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token uuid;
  v_view public.shared_views%rowtype;
begin
  begin
    v_token := p_token::uuid;
  exception
    when others then
      return null;
  end;

  select *
    into v_view
  from public.shared_views shared
  where shared.id = v_token
    and shared.token_hash = public.shared_view_token_hash(p_token)
  limit 1;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'sharedView',
    jsonb_build_object(
      'token', v_view.id::text,
      'monitoredEntityId', v_view.monitored_entity_id,
      'name', v_view.name,
      'createdAt', v_view.created_at
    ),
    'state',
    jsonb_build_object(
      'monitoredEntities',
      coalesce((
        select jsonb_agg(entity.payload order by entity.created_at desc)
        from public.monitored_entities entity
        where entity.user_id = v_view.owner_user_id
          and entity.client_id = v_view.monitored_entity_id
          and entity.deleted_at is null
      ), '[]'::jsonb),
      'activeMonitoredEntityId',
      v_view.monitored_entity_id,
      'incidents',
      coalesce((
        select jsonb_agg(incident.payload order by incident.created_at desc)
        from public.incidents incident
        where incident.user_id = v_view.owner_user_id
          and incident.monitored_entity_client_id = v_view.monitored_entity_id
          and incident.deleted_at is null
      ), '[]'::jsonb),
      'evidences',
      coalesce((
        select jsonb_agg(evidence.payload order by evidence.collected_at desc)
        from public.evidences evidence
        where evidence.user_id = v_view.owner_user_id
          and evidence.deleted_at is null
          and exists (
            select 1
            from public.incidents incident
            where incident.user_id = v_view.owner_user_id
              and incident.monitored_entity_client_id = v_view.monitored_entity_id
              and incident.client_id = evidence.incident_client_id
              and incident.deleted_at is null
          )
      ), '[]'::jsonb),
      'actors',
      coalesce((
        select jsonb_agg(actor.payload order by actor.updated_at desc)
        from public.actors actor
        where actor.user_id = v_view.owner_user_id
          and actor.deleted_at is null
          and (
            exists (
              select 1
              from public.incidents incident
              where incident.user_id = v_view.owner_user_id
                and incident.monitored_entity_client_id = v_view.monitored_entity_id
                and incident.deleted_at is null
                and (
                  actor.payload->'incidentIds' ? incident.client_id
                  or incident.payload->'relatedActorIds' ? actor.client_id
                )
            )
          )
      ), '[]'::jsonb),
      'narratives',
      coalesce((
        select jsonb_agg(narrative.payload order by narrative.updated_at desc)
        from public.narratives narrative
        where narrative.user_id = v_view.owner_user_id
          and narrative.deleted_at is null
          and (
            exists (
              select 1
              from public.incidents incident
              where incident.user_id = v_view.owner_user_id
                and incident.monitored_entity_client_id = v_view.monitored_entity_id
                and incident.deleted_at is null
                and (
                  narrative.payload->'incidentIds' ? incident.client_id
                  or incident.payload->'relatedNarrativeIds' ? narrative.client_id
                )
            )
          )
      ), '[]'::jsonb),
      'indicators',
      '[]'::jsonb,
      'alerts',
      coalesce((
        select jsonb_agg(alert.payload order by alert.created_at desc)
        from public.alerts alert
        where alert.user_id = v_view.owner_user_id
          and exists (
            select 1
            from public.incidents incident
            where incident.user_id = v_view.owner_user_id
              and incident.monitored_entity_client_id = v_view.monitored_entity_id
              and incident.client_id = alert.incident_client_id
              and incident.deleted_at is null
          )
      ), '[]'::jsonb),
      'tasks',
      '[]'::jsonb,
      'blacklist',
      coalesce((
        select jsonb_agg(entry.payload order by entry.updated_at desc)
        from public.blacklist_entries entry
        where entry.user_id = v_view.owner_user_id
          and entry.deleted_at is null
          and (
            entry.payload->>'monitoredEntityId' = v_view.monitored_entity_id
            or entry.payload->>'monitored_entity_client_id' = v_view.monitored_entity_id
          )
      ), '[]'::jsonb),
      'auditLogs',
      '[]'::jsonb,
      'imports',
      '[]'::jsonb
    )
  );
end;
$$;

grant execute on function public.create_or_get_shared_view(text, text) to authenticated;
grant execute on function public.get_shared_view_state(text) to anon, authenticated;
