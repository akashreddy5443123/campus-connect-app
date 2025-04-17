create or replace function delete_all_data()
returns void
language plpgsql
security definer
as $$
begin
  -- Delete from dependent tables first
  delete from club_memberships where true;
  delete from events where true;
  delete from announcements where true;
  delete from clubs where true;
end;
$$; 