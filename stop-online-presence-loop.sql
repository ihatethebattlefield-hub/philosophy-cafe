-- One-time emergency stop for the old online-presence feedback loop.
-- The updated page-script.js no longer needs Realtime for online_users.
do $$
begin
  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'online_users'
  ) then
    execute 'alter publication supabase_realtime drop table public.online_users';
  end if;
end
$$;
