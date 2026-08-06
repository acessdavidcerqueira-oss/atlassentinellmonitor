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

drop policy if exists "super admins manage users" on public.users;
create policy "super admins manage users"
on public.users for all
to authenticated
using (public.current_user_is_super_admin())
with check (public.current_user_is_super_admin());

drop policy if exists "super admins manage all monitored entities" on public.monitored_entities;
create policy "super admins manage all monitored entities"
on public.monitored_entities for all
to authenticated
using (public.current_user_is_super_admin())
with check (public.current_user_is_super_admin());

drop policy if exists "super admins manage all reports" on public.reports;
create policy "super admins manage all reports"
on public.reports for all
to authenticated
using (public.current_user_is_super_admin())
with check (public.current_user_is_super_admin());

drop policy if exists "super admins manage all incidents" on public.incidents;
create policy "super admins manage all incidents"
on public.incidents for all
to authenticated
using (public.current_user_is_super_admin())
with check (public.current_user_is_super_admin());

drop policy if exists "super admins manage all actors" on public.actors;
create policy "super admins manage all actors"
on public.actors for all
to authenticated
using (public.current_user_is_super_admin())
with check (public.current_user_is_super_admin());

drop policy if exists "super admins manage all narratives" on public.narratives;
create policy "super admins manage all narratives"
on public.narratives for all
to authenticated
using (public.current_user_is_super_admin())
with check (public.current_user_is_super_admin());

drop policy if exists "super admins manage all evidences" on public.evidences;
create policy "super admins manage all evidences"
on public.evidences for all
to authenticated
using (public.current_user_is_super_admin())
with check (public.current_user_is_super_admin());

drop policy if exists "super admins manage all alerts" on public.alerts;
create policy "super admins manage all alerts"
on public.alerts for all
to authenticated
using (public.current_user_is_super_admin())
with check (public.current_user_is_super_admin());

drop policy if exists "super admins manage all imports" on public.imports;
create policy "super admins manage all imports"
on public.imports for all
to authenticated
using (public.current_user_is_super_admin())
with check (public.current_user_is_super_admin());

drop policy if exists "super admins manage all audit logs" on public.audit_logs;
create policy "super admins manage all audit logs"
on public.audit_logs for all
to authenticated
using (public.current_user_is_super_admin())
with check (public.current_user_is_super_admin());

drop policy if exists "super admins manage all blacklist entries" on public.blacklist_entries;
create policy "super admins manage all blacklist entries"
on public.blacklist_entries for all
to authenticated
using (public.current_user_is_super_admin())
with check (public.current_user_is_super_admin());
