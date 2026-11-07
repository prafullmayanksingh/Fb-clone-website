create or replace function public.request_group_join(target_group_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.groups
    where id = target_group_id and not is_public
  ) then
    raise exception 'Private group not found';
  end if;

  if exists (
    select 1 from public.group_members
    where group_id = target_group_id and user_id = auth.uid()
  ) then
    raise exception 'Already a group member';
  end if;

  insert into public.group_join_requests (group_id, user_id, status, created_at)
  values (target_group_id, auth.uid(), 'pending', now())
  on conflict (group_id, user_id)
  do update set status = 'pending', created_at = now();

  return 'pending';
end;
$$;

create or replace function public.review_group_join_request(
  target_group_id uuid,
  target_user_id uuid,
  approve_request boolean
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.groups
    where id = target_group_id and owner_id = auth.uid()
  ) then
    raise exception 'Only the group owner can review join requests';
  end if;

  update public.group_join_requests
  set status = case when approve_request then 'accepted' else 'rejected' end
  where group_id = target_group_id
    and user_id = target_user_id
    and status = 'pending';

  if not found then
    raise exception 'Pending join request not found';
  end if;

  if approve_request then
    insert into public.group_members (group_id, user_id, role)
    values (target_group_id, target_user_id, 'member')
    on conflict (group_id, user_id) do nothing;
  end if;

  return case when approve_request then 'accepted' else 'rejected' end;
end;
$$;

revoke all on function public.request_group_join(uuid) from public;
revoke all on function public.review_group_join_request(uuid, uuid, boolean) from public;
grant execute on function public.request_group_join(uuid) to authenticated;
grant execute on function public.review_group_join_request(uuid, uuid, boolean) to authenticated;

drop policy if exists "Public groups or members can view groups" on public.groups;
create policy "Groups are discoverable; private content remains restricted" on public.groups
  for select to authenticated using (true);
