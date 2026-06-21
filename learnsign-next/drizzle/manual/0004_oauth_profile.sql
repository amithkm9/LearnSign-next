-- ============================================================================
-- Google/OAuth support: extend handle_new_user to use the OAuth `full_name`
-- (Google sends `name`/`full_name`, no phone/user_type/age_group). Re-run after
-- adding the Google provider in the Supabase dashboard.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, phone, user_type, age_group)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name',
      'Learner'
    ),
    new.raw_user_meta_data ->> 'phone',
    coalesce(new.raw_user_meta_data ->> 'user_type', 'parent'),
    new.raw_user_meta_data ->> 'age_group'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
