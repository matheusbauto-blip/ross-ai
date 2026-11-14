-- Controle de uso da função ross-ai: contagem diária por IP (hash) e total.
create table if not exists public.ross_ai_usage (
  day date not null,
  ip_hash text not null,
  requests integer not null default 0,
  primary key (day, ip_hash)
);
alter table public.ross_ai_usage enable row level security;

create or replace function public.ross_ai_bump(p_ip_hash text, p_ip_limit integer, p_global_limit integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_total integer;
begin
  insert into public.ross_ai_usage (day, ip_hash, requests)
  values (current_date, p_ip_hash, 1)
  on conflict (day, ip_hash) do update set requests = public.ross_ai_usage.requests + 1
  returning requests into v_count;
  select coalesce(sum(requests), 0) into v_total from public.ross_ai_usage where day = current_date;
  return jsonb_build_object('ip', v_count, 'total', v_total, 'allowed', (v_count <= p_ip_limit and v_total <= p_global_limit));
end;
$$;
revoke all on function public.ross_ai_bump(text, integer, integer) from public;
revoke all on function public.ross_ai_bump(text, integer, integer) from anon;
revoke all on function public.ross_ai_bump(text, integer, integer) from authenticated;
