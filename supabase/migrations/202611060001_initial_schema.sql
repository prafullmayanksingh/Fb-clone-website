create extension if not exists pgcrypto;

create type public.profile_privacy as enum ('public', 'friends', 'private');
create type public.post_visibility as enum ('public', 'friends', 'private');
create type public.friend_request_status as enum ('pending', 'accepted', 'rejected');
create type public.reaction_kind as enum ('like', 'love', 'haha', 'wow', 'sad', 'angry');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  full_name text not null default 'New member' check (char_length(full_name) between 1 and 80),
  avatar_url text,
  cover_url text,
  bio text not null default '' check (char_length(bio) <= 500),
  education text check (education is null or char_length(education) <= 200),
  work text check (work is null or char_length(work) <= 200),
  location text check (location is null or char_length(location) <= 200),
  website text check (website is null or char_length(website) <= 2048),
  privacy public.profile_privacy not null default 'public',
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status public.friend_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followed_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

create table public.user_blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  description text not null default '' check (char_length(description) <= 2000),
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'admin')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table public.group_join_requests (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  description text not null default '' check (char_length(description) <= 2000),
  created_at timestamptz not null default now()
);

create table public.page_followers (
  page_id uuid not null references public.pages (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (page_id, user_id)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  group_id uuid references public.groups (id) on delete cascade,
  page_id uuid references public.pages (id) on delete cascade,
  body text not null default '' check (char_length(body) <= 10000),
  visibility public.post_visibility not null default 'public',
  pinned_at timestamptz,
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  check (char_length(body) > 0 or group_id is not null or page_id is not null)
);

create table public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  url text not null,
  kind text not null check (kind in ('image', 'video', 'gif')),
  position smallint not null default 0 check (position between 0 and 19),
  created_at timestamptz not null default now()
);

create table public.post_saves (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.hashtags (
  id uuid primary key default gen_random_uuid(),
  tag text not null unique check (tag ~ '^[a-z0-9_]{1,50}$')
);

create table public.post_hashtags (
  post_id uuid not null references public.posts (id) on delete cascade,
  hashtag_id uuid not null references public.hashtags (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, hashtag_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid,
  body text not null check (char_length(body) between 1 and 2000),
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, post_id),
  foreign key (parent_id, post_id) references public.comments (id, post_id) on delete cascade
);

create table public.reactions (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.reaction_kind not null default 'like',
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.comment_reactions (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.reaction_kind not null default 'like',
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  media_url text not null,
  media_kind text not null check (media_kind in ('image', 'video')),
  caption text not null default '' check (char_length(caption) <= 500),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);

create table public.story_views (
  story_id uuid not null references public.stories (id) on delete cascade,
  viewer_id uuid not null references public.profiles (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 10000),
  attachment_url text,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  kind text not null check (kind in ('reaction', 'comment', 'friend_request', 'friend_accepted', 'follow', 'message')),
  post_id uuid references public.posts (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (actor_id is null or actor_id <> recipient_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_user_id uuid references public.profiles (id) on delete cascade,
  post_id uuid references public.posts (id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 1000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  check (reported_user_id is not null or post_id is not null)
);

create index posts_feed_idx on public.posts (created_at desc);
create index posts_user_feed_idx on public.posts (user_id, created_at desc);
create index comments_post_idx on public.comments (post_id, created_at);
create index reactions_post_idx on public.reactions (post_id);
create index notifications_inbox_idx on public.notifications (recipient_id, created_at desc);
create index messages_conversation_idx on public.messages (conversation_id, created_at);
create index stories_expiry_idx on public.stories (expires_at);
create index reports_open_idx on public.reports (created_at desc) where status = 'open';
create index post_hashtags_tag_idx on public.post_hashtags (hashtag_id, post_id);

create function public.sync_post_hashtags()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  matched_tag text;
  matched_id uuid;
begin
  delete from public.post_hashtags where post_id = new.id;
  for matched_tag in
    select distinct lower(matches.captures[1])
    from regexp_matches(coalesce(new.body, ''), '#([a-zA-Z0-9_]{1,50})', 'g') as matches(captures)
  loop
    insert into public.hashtags (tag) values (matched_tag)
    on conflict (tag) do update set tag = excluded.tag
    returning id into matched_id;
    insert into public.post_hashtags (post_id, hashtag_id)
    values (new.id, matched_id)
    on conflict do nothing;
  end loop;
  return new;
end;
$$;

create trigger sync_post_hashtags_trigger
  after insert or update of body on public.posts
  for each row execute function public.sync_post_hashtags();

create function public.get_trending_hashtags(limit_count integer default 10)
returns table (tag text, post_count bigint)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select hashtags.tag, count(distinct post_hashtags.post_id) as post_count
  from public.hashtags
  join public.post_hashtags on post_hashtags.hashtag_id = hashtags.id
  join public.posts on posts.id = post_hashtags.post_id
  where posts.created_at > now() - interval '7 days'
  group by hashtags.tag
  order by post_count desc, hashtags.tag
  limit greatest(1, least(limit_count, 20));
$$;

revoke all on function public.get_trending_hashtags(integer) from public;
grant execute on function public.get_trending_hashtags(integer) to authenticated;

create function public.is_friend(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.friend_requests
    where status = 'accepted'
      and ((requester_id = auth.uid() and addressee_id = target_user_id)
        or (addressee_id = auth.uid() and requester_id = target_user_id))
  );
$$;

create function public.is_blocked(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.user_blocks
    where (blocker_id = auth.uid() and blocked_id = target_user_id)
      or (blocker_id = target_user_id and blocked_id = auth.uid())
  );
$$;

create function public.is_conversation_member(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = target_conversation_id and user_id = auth.uid()
  ) and not exists (
    select 1 from public.conversation_participants
    where conversation_id = target_conversation_id and user_id <> auth.uid()
      and public.is_blocked(user_id)
  );
$$;

create function public.is_group_member(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.group_members
    where group_id = target_group_id and user_id = auth.uid()
  );
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

revoke all on function public.is_friend(uuid) from public;
revoke all on function public.is_blocked(uuid) from public;
revoke all on function public.is_conversation_member(uuid) from public;
revoke all on function public.is_group_member(uuid) from public;
revoke all on function public.is_admin() from public;
grant execute on function public.is_friend(uuid), public.is_conversation_member(uuid), public.is_group_member(uuid), public.is_admin() to authenticated;
grant execute on function public.is_blocked(uuid) to authenticated;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    lower(regexp_replace(split_part(coalesce(new.email, new.id::text), '@', 1), '[^a-zA-Z0-9_]', '', 'g')) || '_' || substr(new.id::text, 1, 6),
    left(coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'New member'), '@', 1)), 80)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.update_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at();
create trigger conversations_updated_at before update on public.conversations for each row execute function public.update_updated_at();
create trigger friend_requests_updated_at before update on public.friend_requests for each row execute function public.update_updated_at();

create function public.guard_friend_request_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.status <> 'pending'
    or old.addressee_id <> auth.uid()
    or new.addressee_id <> old.addressee_id
    or new.requester_id <> old.requester_id
    or new.status not in ('accepted', 'rejected') then
    raise exception 'Only the recipient can accept or reject a pending request.';
  end if;
  return new;
end;
$$;

create trigger protect_friend_request_update before update on public.friend_requests
  for each row execute function public.guard_friend_request_update();

create function public.join_group_as_owner()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.group_members (group_id, user_id, role) values (new.id, new.owner_id, 'admin');
  return new;
end;
$$;

create trigger add_group_owner after insert on public.groups
  for each row execute function public.join_group_as_owner();

create function public.notify_post_activity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  post_owner uuid;
begin
  select user_id into post_owner from public.posts where id = new.post_id;
  if post_owner is not null and post_owner <> new.user_id then
    insert into public.notifications (recipient_id, actor_id, kind, post_id, comment_id)
    values (post_owner, new.user_id, case when tg_table_name = 'comments' then 'comment' else 'reaction' end, new.post_id,
      case when tg_table_name = 'comments' then new.id else null end);
  end if;
  return new;
end;
$$;

create trigger notify_new_reaction after insert on public.reactions for each row execute function public.notify_post_activity();
create trigger notify_new_comment after insert on public.comments for each row execute function public.notify_post_activity();

create function public.notify_friend_request()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'pending' then
    insert into public.notifications (recipient_id, actor_id, kind)
    values (new.addressee_id, new.requester_id, 'friend_request');
  elsif new.status = 'accepted' then
    insert into public.notifications (recipient_id, actor_id, kind)
    values (new.requester_id, new.addressee_id, 'friend_accepted');
  end if;
  return new;
end;
$$;

create trigger notify_friend_request_created after insert on public.friend_requests
  for each row execute function public.notify_friend_request();
create trigger notify_friend_request_accepted after update of status on public.friend_requests
  for each row when (new.status = 'accepted' and old.status is distinct from new.status)
  execute function public.notify_friend_request();

create function public.notify_new_follower()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.notifications (recipient_id, actor_id, kind)
  values (new.followed_id, new.follower_id, 'follow');
  return new;
end;
$$;

create trigger notify_new_follow after insert on public.follows
  for each row execute function public.notify_new_follower();

create function public.remove_relationships_for_block()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.friend_requests
  where (requester_id = new.blocker_id and addressee_id = new.blocked_id)
    or (requester_id = new.blocked_id and addressee_id = new.blocker_id);
  delete from public.follows
  where (follower_id = new.blocker_id and followed_id = new.blocked_id)
    or (follower_id = new.blocked_id and followed_id = new.blocker_id);
  return new;
end;
$$;

create trigger remove_relationships_after_block after insert on public.user_blocks
  for each row execute function public.remove_relationships_for_block();

create function public.start_conversation(recipient_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  conversation_id uuid;
begin
  if auth.uid() is null or recipient_id = auth.uid() then
    raise exception 'A valid recipient is required.';
  end if;
  if not exists (select 1 from public.profiles where id = recipient_id) then
    raise exception 'Recipient does not exist.';
  end if;
  if public.is_blocked(recipient_id) then
    raise exception 'This conversation is unavailable.';
  end if;
  insert into public.conversations (created_by) values (auth.uid()) returning id into conversation_id;
  insert into public.conversation_participants (conversation_id, user_id)
  values (conversation_id, auth.uid()), (conversation_id, recipient_id);
  return conversation_id;
end;
$$;

revoke all on function public.start_conversation(uuid) from public;
grant execute on function public.start_conversation(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.friend_requests enable row level security;
alter table public.follows enable row level security;
alter table public.user_blocks enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_join_requests enable row level security;
alter table public.pages enable row level security;
alter table public.page_followers enable row level security;
alter table public.posts enable row level security;
alter table public.post_media enable row level security;
alter table public.post_saves enable row level security;
alter table public.hashtags enable row level security;
alter table public.post_hashtags enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.comment_reactions enable row level security;
alter table public.stories enable row level security;
alter table public.story_views enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;

grant select on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update (username, full_name, avatar_url, cover_url, bio, education, work, location, website, privacy) on public.profiles to authenticated;
grant select, insert, update, delete on public.friend_requests, public.follows, public.user_blocks, public.groups, public.group_join_requests, public.pages, public.page_followers, public.posts, public.post_media, public.post_saves, public.comments, public.reactions, public.comment_reactions, public.stories, public.story_views, public.conversations, public.messages, public.notifications, public.reports to authenticated;
grant select on public.hashtags, public.post_hashtags to authenticated;
grant select, insert, update, delete on public.group_members, public.conversation_participants to authenticated;
grant insert (group_id, user_id) on public.group_members to authenticated;
grant insert (page_id, user_id) on public.page_followers to authenticated;

create policy "Profiles are visible according to privacy" on public.profiles for select to authenticated
  using (id = auth.uid() or (not public.is_blocked(id) and
    (privacy = 'public' or (privacy = 'friends' and public.is_friend(id)))));
create policy "Members can update their profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "Participants can view friend requests" on public.friend_requests for select to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());
create policy "Members can send friend requests" on public.friend_requests for insert to authenticated
  with check (requester_id = auth.uid() and status = 'pending' and not public.is_blocked(addressee_id));
create policy "Recipient can accept or reject requests" on public.friend_requests for update to authenticated
  using (addressee_id = auth.uid() and status = 'pending')
  with check (addressee_id = auth.uid() and status in ('accepted', 'rejected'));
create policy "Sender can cancel pending request" on public.friend_requests for delete to authenticated
  using (requester_id = auth.uid() and status = 'pending');
create policy "Either member can end a friendship" on public.friend_requests for delete to authenticated
  using (status = 'accepted' and (requester_id = auth.uid() or addressee_id = auth.uid()));

create policy "Follow relationships are visible to signed-in users" on public.follows for select to authenticated using (true);
create policy "Members can follow other accounts" on public.follows for insert to authenticated
  with check (follower_id = auth.uid() and not public.is_blocked(followed_id));
create policy "Members can unfollow accounts" on public.follows for delete to authenticated using (follower_id = auth.uid());
create policy "Members can view blocks they created" on public.user_blocks for select to authenticated using (blocker_id = auth.uid());
create policy "Members can block accounts" on public.user_blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy "Members can unblock accounts" on public.user_blocks for delete to authenticated using (blocker_id = auth.uid());

create policy "Public groups or members can view groups" on public.groups for select to authenticated
  using (is_public or owner_id = auth.uid() or public.is_group_member(id));
create policy "Members can create groups" on public.groups for insert to authenticated with check (owner_id = auth.uid());
create policy "Group owners can edit groups" on public.groups for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Group owners can delete groups" on public.groups for delete to authenticated using (owner_id = auth.uid());
create policy "Group membership is visible to signed-in users" on public.group_members for select to authenticated using (true);
create policy "Members can join public groups" on public.group_members for insert to authenticated
  with check (user_id = auth.uid() and role = 'member' and exists (select 1 from public.groups where id = group_id and is_public));
create policy "Members can leave groups" on public.group_members for delete to authenticated using (user_id = auth.uid());
create policy "Group owners can review requests" on public.group_join_requests for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.groups where id = group_id and owner_id = auth.uid()));
create policy "Members can request private group access" on public.group_join_requests for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.groups where id = group_id and not is_public));
create policy "Group owners can process requests" on public.group_join_requests for update to authenticated
  using (exists (select 1 from public.groups where id = group_id and owner_id = auth.uid()))
  with check (exists (select 1 from public.groups where id = group_id and owner_id = auth.uid()));

create policy "Pages are public" on public.pages for select to authenticated using (true);
create policy "Members can create pages" on public.pages for insert to authenticated with check (owner_id = auth.uid());
create policy "Page owners can edit pages" on public.pages for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Page owners can delete pages" on public.pages for delete to authenticated using (owner_id = auth.uid());
create policy "Page followers are visible to signed-in users" on public.page_followers for select to authenticated using (true);
create policy "Members can follow pages" on public.page_followers for insert to authenticated with check (user_id = auth.uid());
create policy "Members can unfollow pages" on public.page_followers for delete to authenticated using (user_id = auth.uid());

create policy "Posts are visible by audience" on public.posts for select to authenticated
  using (
    user_id = auth.uid()
    or (
      not public.is_blocked(user_id)
      and (
        (visibility = 'public' and (select privacy from public.profiles where id = user_id) = 'public')
        or (visibility = 'friends' and public.is_friend(user_id))
        or (group_id is not null and public.is_group_member(group_id))
      )
    )
  );
create policy "Members can create their own posts" on public.posts for insert to authenticated
  with check (user_id = auth.uid() and (group_id is null or public.is_group_member(group_id)));
create policy "Authors can edit posts" on public.posts for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and (group_id is null or public.is_group_member(group_id)));
create policy "Authors or admins can delete posts" on public.posts for delete to authenticated using (user_id = auth.uid() or public.is_admin());

create policy "Media is visible with its post" on public.post_media for select to authenticated
  using (exists (select 1 from public.posts where id = post_id));
create policy "Authors can attach media to their posts" on public.post_media for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.posts where id = post_id and user_id = auth.uid()));
create policy "Authors can remove their post media" on public.post_media for delete to authenticated
  using (user_id = auth.uid());
create policy "Members can view their saved posts" on public.post_saves for select to authenticated
  using (user_id = auth.uid());
create policy "Members can save visible posts" on public.post_saves for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.posts where id = post_id));
create policy "Members can remove their saved posts" on public.post_saves for delete to authenticated
  using (user_id = auth.uid());
create policy "Hashtags are visible with a public post" on public.hashtags for select to authenticated using (true);
create policy "Hashtag links are visible with their post" on public.post_hashtags for select to authenticated
  using (exists (select 1 from public.posts where id = post_id));

create policy "Comments are visible with their post" on public.comments for select to authenticated
  using (exists (select 1 from public.posts where id = post_id));
create policy "Members can comment as themselves" on public.comments for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.posts where id = post_id));
create policy "Authors can edit their comments" on public.comments for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Authors can delete comments" on public.comments for delete to authenticated using (user_id = auth.uid() or public.is_admin());

create policy "Reactions are visible with their post" on public.reactions for select to authenticated
  using (exists (select 1 from public.posts where id = post_id));
create policy "Members can react as themselves" on public.reactions for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.posts where id = post_id));
create policy "Members can update their reaction" on public.reactions for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Members can remove their reactions" on public.reactions for delete to authenticated using (user_id = auth.uid());
create policy "Comment reactions are visible with their comment" on public.comment_reactions for select to authenticated
  using (exists (select 1 from public.comments where id = comment_id));
create policy "Members can react to visible comments" on public.comment_reactions for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.comments where id = comment_id));
create policy "Members can update their comment reaction" on public.comment_reactions for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Members can remove their comment reactions" on public.comment_reactions for delete to authenticated using (user_id = auth.uid());

create policy "Active stories follow profile privacy" on public.stories for select to authenticated
  using (expires_at > now() and (user_id = auth.uid()
    or (not public.is_blocked(user_id) and (
      (select privacy from public.profiles where id = user_id) = 'public'
      or ((select privacy from public.profiles where id = user_id) = 'friends' and public.is_friend(user_id))
    ))));
create policy "Members can publish their own stories" on public.stories for insert to authenticated with check (user_id = auth.uid());
create policy "Authors can remove stories" on public.stories for delete to authenticated using (user_id = auth.uid());
create policy "Story views are visible to story owners" on public.story_views for select to authenticated
  using (viewer_id = auth.uid() or exists (select 1 from public.stories where id = story_id and user_id = auth.uid()));
create policy "Members can record story views" on public.story_views for insert to authenticated with check (viewer_id = auth.uid());

create policy "Conversation members can read conversations" on public.conversations for select to authenticated
  using (public.is_conversation_member(id));
create policy "Members can create conversations" on public.conversations for insert to authenticated with check (created_by = auth.uid());
create policy "Participants can view conversation participants" on public.conversation_participants for select to authenticated
  using (public.is_conversation_member(conversation_id));
create policy "Members can update their read status" on public.conversation_participants for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Conversation members can read messages" on public.messages for select to authenticated
  using (public.is_conversation_member(conversation_id));
create policy "Members can send messages as themselves" on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id));

create policy "Members can read their notifications" on public.notifications for select to authenticated using (recipient_id = auth.uid());
create policy "Members can mark their notifications read" on public.notifications for update to authenticated
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

create policy "Members can submit reports" on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "Reporters and admins can view reports" on public.reports for select to authenticated using (reporter_id = auth.uid() or public.is_admin());
create policy "Admins can triage reports" on public.reports for update to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community-media', 'community-media', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Community media follows content visibility" on storage.objects for select to authenticated
  using (bucket_id = 'community-media' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.post_media where post_media.url = storage.objects.name)
    or exists (
      select 1 from public.profiles
      where profiles.avatar_url = storage.objects.name or profiles.cover_url = storage.objects.name
    )
    or exists (select 1 from public.stories where stories.media_url = storage.objects.name)
  ));
create policy "Members upload only into their own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'community-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Members update only their own uploads" on storage.objects for update to authenticated
  using (bucket_id = 'community-media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'community-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Members delete only their own uploads" on storage.objects for delete to authenticated
  using (bucket_id = 'community-media' and (storage.foldername(name))[1] = auth.uid()::text);

do $$
begin
  alter publication supabase_realtime add table public.posts;
  alter publication supabase_realtime add table public.comments;
  alter publication supabase_realtime add table public.reactions;
  alter publication supabase_realtime add table public.notifications;
  alter publication supabase_realtime add table public.messages;
  alter publication supabase_realtime add table public.post_hashtags;
exception
  when duplicate_object then null;
end;
$$;
