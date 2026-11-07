create table public.post_polls (
  post_id uuid primary key references public.posts (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.post_poll_options (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.post_polls (post_id) on delete cascade,
  option_text text not null check (char_length(option_text) between 1 and 120),
  position smallint not null check (position between 0 and 3),
  vote_count integer not null default 0 check (vote_count >= 0),
  unique (post_id, position),
  unique (id, post_id)
);

create table public.post_poll_votes (
  post_id uuid not null references public.post_polls (post_id) on delete cascade,
  option_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id),
  foreign key (option_id, post_id) references public.post_poll_options (id, post_id) on delete cascade
);

alter table public.post_polls enable row level security;
alter table public.post_poll_options enable row level security;
alter table public.post_poll_votes enable row level security;

grant select, insert on public.post_polls, public.post_poll_options to authenticated;
grant select, insert, update on public.post_poll_votes to authenticated;

create policy "Polls are visible with their posts" on public.post_polls for select to authenticated
  using (exists (select 1 from public.posts where id = post_id));
create policy "Post authors can create polls" on public.post_polls for insert to authenticated
  with check (exists (select 1 from public.posts where id = post_id and user_id = auth.uid()));

create policy "Poll options are visible with their polls" on public.post_poll_options for select to authenticated
  using (exists (select 1 from public.post_polls where post_id = post_poll_options.post_id));
create policy "Post authors can create poll options" on public.post_poll_options for insert to authenticated
  with check (exists (
    select 1 from public.post_polls
    join public.posts on posts.id = post_polls.post_id
    where post_polls.post_id = post_poll_options.post_id and posts.user_id = auth.uid()
  ));

create policy "Members can see their own poll votes" on public.post_poll_votes for select to authenticated
  using (user_id = auth.uid());
create policy "Members can vote on visible polls" on public.post_poll_votes for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.posts where id = post_poll_votes.post_id)
    and exists (
      select 1 from public.post_poll_options
      where id = post_poll_votes.option_id and post_id = post_poll_votes.post_id
    )
  );
create policy "Members can change their own poll vote" on public.post_poll_votes for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.posts where id = post_poll_votes.post_id)
    and exists (
      select 1 from public.post_poll_options
      where id = post_poll_votes.option_id and post_id = post_poll_votes.post_id
    )
  );

create function public.create_post_poll(target_post_id uuid, target_options text[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null
    or not exists (select 1 from public.posts where id = target_post_id and user_id = auth.uid()) then
    raise exception 'Only the post author can create a poll';
  end if;

  if coalesce(array_length(target_options, 1), 0) not between 2 and 4
    or exists (
      select 1 from unnest(target_options) as options(option_text)
      where char_length(btrim(option_text)) not between 1 and 120
    )
    or exists (
      select 1 from unnest(target_options) as options(option_text)
      group by lower(btrim(option_text))
      having count(*) > 1
    ) then
    raise exception 'Polls need 2 to 4 distinct options of 1 to 120 characters';
  end if;

  insert into public.post_polls (post_id) values (target_post_id);
  insert into public.post_poll_options (post_id, option_text, position)
  select target_post_id, btrim(option_text), (ordinality - 1)::smallint
  from unnest(target_options) with ordinality as options(option_text, ordinality);
end;
$$;

revoke all on function public.create_post_poll(uuid, text[]) from public;
grant execute on function public.create_post_poll(uuid, text[]) to authenticated;

create function public.sync_post_poll_vote_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.post_poll_options set vote_count = vote_count + 1
    where id = new.option_id and post_id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.post_poll_options set vote_count = vote_count - 1
    where id = old.option_id and post_id = old.post_id;
    return old;
  elsif (new.post_id, new.option_id) is distinct from (old.post_id, old.option_id) then
    update public.post_poll_options set vote_count = vote_count - 1
    where id = old.option_id and post_id = old.post_id;
    update public.post_poll_options set vote_count = vote_count + 1
    where id = new.option_id and post_id = new.post_id;
  end if;
  return new;
end;
$$;

create trigger post_poll_vote_count_insert_delete
after insert or delete on public.post_poll_votes
for each row execute function public.sync_post_poll_vote_count();

create trigger post_poll_vote_count_update
after update on public.post_poll_votes
for each row execute function public.sync_post_poll_vote_count();
