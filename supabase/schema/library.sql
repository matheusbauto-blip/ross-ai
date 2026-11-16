-- Private, versioned copies and a compact locator catalog for the whole
-- pinned repository. Catalog records are not counted as imported full texts.
create table if not exists public.ross_law_versions (
  document_id text not null references public.ross_law_documents(id),
  content_sha256 text not null check (content_sha256 ~ '^[a-f0-9]{64}$'),
  repository_ref text not null check (repository_ref ~ '^[a-f0-9]{40}$'),
  markdown text not null check (octet_length(markdown) <= 3000000),
  stored_at timestamptz not null default now(),
  primary key(document_id,content_sha256)
);
create table if not exists public.ross_law_directories (
  id text primary key check (id ~ '^[a-f0-9]{64}$'),
  prefix text not null,
  repository_ref text not null check (repository_ref ~ '^[a-f0-9]{40}$'),
  scope text not null check (scope in ('federal','estadual','municipal')),
  uf text, municipality text, family text not null, year integer,
  category text not null,
  records jsonb not null check (jsonb_typeof(records)='array'),
  imported_at timestamptz not null default now(),
  unique(prefix,repository_ref),
  check (position('..' in prefix)=0 and left(prefix,1)<>'/' and position(chr(92) in prefix)=0)
);
create index if not exists ross_law_directories_lookup_idx on public.ross_law_directories(family,year,scope,uf,municipality);
alter table public.ross_law_versions enable row level security;
alter table public.ross_law_directories enable row level security;
revoke all on public.ross_law_versions,public.ross_law_directories from public,anon,authenticated;
grant all on public.ross_law_versions,public.ross_law_directories to service_role;

create or replace function public.ross_library_import(p_documents jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare d jsonb; result jsonb;
begin
  if jsonb_typeof(p_documents)<>'array' or jsonb_array_length(p_documents)>20 or octet_length(p_documents::text)>8000000 then raise exception 'Invalid library batch'; end if;
  for d in select value from jsonb_array_elements(p_documents) loop
    if d->>'markdown' is null or octet_length(d->>'markdown')>3000000 or encode(sha256(convert_to(d->>'markdown','UTF8')),'hex')<>d->>'content_sha256' then raise exception 'Invalid snapshot integrity'; end if;
  end loop;
  result := public.ross_law_import(p_documents);
  insert into public.ross_law_versions(document_id,content_sha256,repository_ref,markdown)
  select item.value->>'id',item.value->>'content_sha256',item.value->>'repository_ref',item.value->>'markdown' from jsonb_array_elements(p_documents) item(value)
  on conflict(document_id,content_sha256) do nothing;
  return result;
end;
$$;
create or replace function public.ross_library_catalog_import(p_directories jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare d jsonb; n integer:=0;
begin
  if jsonb_typeof(p_directories)<>'array' or octet_length(p_directories::text)>1900000 then raise exception 'Invalid catalog batch'; end if;
  for d in select value from jsonb_array_elements(p_directories) loop
    if jsonb_typeof(d->'records')<>'array' or exists(select 1 from jsonb_array_elements(d->'records') r where jsonb_array_length(r)<>3 or r->>1 !~ '^[a-f0-9]{40}$' or position('/' in r->>0)>0 or position(chr(92) in r->>0)>0 or position('..' in r->>0)>0) then raise exception 'Invalid catalog record'; end if;
    if encode(sha256(convert_to((d->>'prefix')||':'||(d->>'repository_ref'),'UTF8')),'hex')<>d->>'id' then raise exception 'Invalid directory identity'; end if;
    insert into public.ross_law_directories(id,prefix,repository_ref,scope,uf,municipality,family,year,category,records)
    values(d->>'id',d->>'prefix',d->>'repository_ref',d->>'scope',d->>'uf',d->>'municipality',d->>'family',(d->>'year')::integer,d->>'category',d->'records')
    on conflict(id) do update set repository_ref=excluded.repository_ref,records=excluded.records,imported_at=now();
    n:=n+1;
  end loop;
  return jsonb_build_object('directories',n);
end;
$$;
create or replace function public.ross_library_locate(p_references jsonb,p_scope text default null,p_uf text default null,p_municipality text default null)
returns jsonb language sql stable security invoker set search_path='' set statement_timeout='8s' as $$
  select coalesce(jsonb_agg(x),'[]'::jsonb) from (
    select distinct 'l:'||d.id||':'||(r.ordinality-1)::text as id,
      d.prefix||'/'||(r.value->>0) as repository_path,d.repository_ref,r.value->>1 as blob_sha1,
      d.scope,d.uf,d.municipality,d.family,d.year,d.category,r.value->>2 as number
    from jsonb_array_elements(case when jsonb_typeof(p_references)='array' then p_references else '[]'::jsonb end) ref
    join public.ross_law_directories d on d.family=ref->>'family' and (nullif(ref->>'year','') is null or d.year=(ref->>'year')::integer)
    cross join lateral jsonb_array_elements(d.records) with ordinality r
    where r.value->>2=ref->>'number'
      and (p_scope is null or d.scope=p_scope)
      and (p_uf is null or d.scope='federal' or d.uf=p_uf)
      and (p_municipality is null or d.scope<>'municipal' or d.municipality=p_municipality)
      and (d.scope<>'municipal' or p_municipality is not null)
      and d.category<>'jurisprudencia'
    order by d.year desc nulls last,id limit 8
  ) x;
$$;
create or replace function public.ross_library_locator(p_id text)
returns jsonb language sql stable security invoker set search_path='' as $$
  select jsonb_build_object('id',p_id,'repository_path',d.prefix||'/'||(r->>0),'repository_ref',d.repository_ref,'blob_sha1',r->>1)
  from public.ross_law_directories d
  cross join lateral (select d.records->(case when p_id ~ '^l:[a-f0-9]{64}:[0-9]{1,6}$' then split_part(p_id,':',3)::integer else null end)) x(r)
  where p_id ~ '^l:[a-f0-9]{64}:[0-9]{1,6}$' and d.id=split_part(p_id,':',2) and r is not null;
$$;
create or replace function public.ross_law_stats()
returns jsonb language sql stable security invoker set search_path='' as $$
  select jsonb_build_object('documents',count(*),'fullTexts',count(*) filter(where content_mode='full'),
    'partial',count(*) filter(where is_partial),'federal',count(*) filter(where scope='federal'),
    'estadual',count(*) filter(where scope='estadual'),'municipal',count(*) filter(where scope='municipal'),
    'lastImport',max(imported_at),'repository','ctresb/leis','complete',false,
    'catalogDocuments',(select coalesce(sum(jsonb_array_length(records)),0) from public.ross_law_directories),
    'storedVersions',(select count(*) from public.ross_law_versions),
    'passages',(select count(*) from public.ross_law_passages)) from public.ross_law_documents;
$$;
revoke all on function public.ross_library_import(jsonb),public.ross_library_catalog_import(jsonb),public.ross_library_locate(jsonb,text,text,text),public.ross_library_locator(text),public.ross_law_stats() from public,anon,authenticated;
grant execute on function public.ross_library_import(jsonb),public.ross_library_catalog_import(jsonb),public.ross_library_locate(jsonb,text,text,text),public.ross_library_locator(text),public.ross_law_stats() to service_role;

-- Short-lived operator grants. Only a hash is stored; no browser role can
-- create, inspect or redeem a grant directly through the Data API.
create table if not exists public.ross_library_import_grants (
  token_hash text primary key check(token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  remaining integer not null check(remaining>=0 and remaining<=10000)
);
alter table public.ross_library_import_grants enable row level security;
revoke all on public.ross_library_import_grants from public,anon,authenticated;
grant all on public.ross_library_import_grants to service_role;
create or replace function public.ross_library_authorize(p_token_hash text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
  update public.ross_library_import_grants set remaining=remaining-1
  where token_hash=p_token_hash and expires_at>now() and remaining>0;
  get diagnostics n=row_count;
  return n=1;
end;
$$;
revoke all on function public.ross_library_authorize(text) from public,anon,authenticated;
grant execute on function public.ross_library_authorize(text) to service_role;

-- Source-wide cache: public legal/news material only, never a user's query,
-- conversation, attachment or account details.
create table if not exists public.ross_source_cache (
  key text primary key check(length(key)<=100),
  payload jsonb not null check(octet_length(payload::text)<=16000000),
  fetched_at timestamptz not null
);
alter table public.ross_source_cache enable row level security;
revoke all on public.ross_source_cache from public,anon,authenticated;
grant all on public.ross_source_cache to service_role;
