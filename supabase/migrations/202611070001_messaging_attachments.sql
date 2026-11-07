alter table public.messages
  add column if not exists attachment_name text,
  add column if not exists attachment_type text;

alter table public.messages
  drop constraint if exists messages_body_check,
  drop constraint if exists messages_body_attachment_check;

alter table public.messages
  add constraint messages_body_attachment_check
  check (
    char_length(body) <= 10000
    and (char_length(body) > 0 or attachment_url is not null)
    and (attachment_name is null or char_length(attachment_name) <= 255)
    and (attachment_type is null or char_length(attachment_type) <= 150)
  );

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm',
  'application/pdf', 'text/plain', 'text/csv', 'application/zip',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
]
where id = 'community-media';

drop policy if exists "Conversation members can read message attachments" on storage.objects;
create policy "Conversation members can read message attachments" on storage.objects for select to authenticated
  using (bucket_id = 'community-media' and exists (
    select 1 from public.messages
    where messages.attachment_url = storage.objects.name
      and public.is_conversation_member(messages.conversation_id)
  ));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conversation_participants'
  ) then
    alter publication supabase_realtime add table public.conversation_participants;
  end if;
end;
$$;

drop policy if exists "Conversation members can use private realtime channels" on realtime.messages;
drop policy if exists "Conversation members can broadcast privately" on realtime.messages;
create policy "Conversation members can use private realtime channels" on realtime.messages
  for select to authenticated
  using (
    split_part(realtime.topic(), ':', 1) = 'conversation'
    and exists (
      select 1 from public.conversation_participants
      where conversation_id::text = split_part(realtime.topic(), ':', 2)
        and user_id = auth.uid()
    )
    and not exists (
      select 1 from public.conversation_participants peer
      where peer.conversation_id::text = split_part(realtime.topic(), ':', 2)
        and peer.user_id <> auth.uid()
        and public.is_blocked(peer.user_id)
    )
  );
create policy "Conversation members can broadcast privately" on realtime.messages
  for insert to authenticated
  with check (
    split_part(realtime.topic(), ':', 1) = 'conversation'
    and exists (
      select 1 from public.conversation_participants
      where conversation_id::text = split_part(realtime.topic(), ':', 2)
        and user_id = auth.uid()
    )
    and not exists (
      select 1 from public.conversation_participants peer
      where peer.conversation_id::text = split_part(realtime.topic(), ':', 2)
        and peer.user_id <> auth.uid()
        and public.is_blocked(peer.user_id)
    )
  );
