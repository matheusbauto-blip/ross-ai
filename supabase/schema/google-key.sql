-- Optional encrypted credential source when GEMINI_API_KEY is not set.
-- The Vault extension must be enabled. Store the value in Vault under the name
-- ross_ai_google_api_key, never in migrations, source code or browser config.
begin;
create or replace function public.ross_ai_google_key()
returns text
language sql stable security invoker
set search_path = ''
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'ross_ai_google_api_key'
  limit 1;
$$;
revoke all on function public.ross_ai_google_key() from public, anon, authenticated;
grant execute on function public.ross_ai_google_key() to service_role;
commit;
