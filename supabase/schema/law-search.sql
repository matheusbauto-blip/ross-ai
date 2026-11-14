-- Searchable legal corpus. Backend service role only; no public writes.
create table public.ross_law_documents (
  id text primary key check (id ~ '^[a-f0-9]{64}$'),
  repository text not null check (repository = 'ctresb/leis'),
  repository_path text not null unique,
  repository_ref text not null check (repository_ref ~ '^[a-f0-9]{40}$'),
  content_sha256 text not null check (content_sha256 ~ '^[a-f0-9]{64}$'),
  title text not null, norm_type text not null, number text not null default '',
  norm_date date, scope text not null check (scope in ('federal','estadual','municipal')),
  uf text, municipality text, category text not null,
  summary text not null default '', urn text not null default '',
  source_url text not null, text_version text not null,
  status text not null check (status in ('unknown','repealed')),
  captured_at date, is_partial boolean not null default true,
  content_mode text not null default 'full' check (content_mode in ('full','metadata')),
  warnings jsonb not null default '[]'::jsonb,
  imported_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('portuguese'::regconfig, title || ' ' || number), 'A') ||
    setweight(to_tsvector('portuguese'::regconfig, summary), 'B')
  ) stored
);
create index ross_law_documents_search_idx on public.ross_law_documents using gin(search_vector);
create index ross_law_documents_scope_idx on public.ross_law_documents(scope, uf, municipality);
create index ross_law_documents_number_idx on public.ross_law_documents(number);
create table public.ross_law_passages (
  document_id text not null references public.ross_law_documents(id) on delete cascade,
  ordinal integer not null, article text not null, heading text not null default '',
  content text not null, repealed boolean not null default false,
  search_vector tsvector generated always as (to_tsvector('portuguese'::regconfig, content)) stored,
  primary key(document_id, ordinal)
);
create index ross_law_passages_search_idx on public.ross_law_passages using gin(search_vector);
alter table public.ross_law_documents enable row level security;
alter table public.ross_law_passages enable row level security;
revoke all on public.ross_law_documents, public.ross_law_passages from public, anon, authenticated;
grant all on public.ross_law_documents, public.ross_law_passages to service_role;

create function public.ross_law_import(p_documents jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare d jsonb; old_hash text; old_mode text; imported integer := 0; unchanged integer := 0;
begin
  if jsonb_typeof(p_documents) <> 'array' or jsonb_array_length(p_documents) > 20 or octet_length(p_documents::text) > 8000000 then
    raise exception 'Invalid or oversized import batch';
  end if;
  for d in select value from jsonb_array_elements(p_documents) loop
    if d->>'repository' <> 'ctresb/leis' or coalesce(d->>'repository_path','') !~ '^(constituicao\.md|(federal|estaduais|municipais|reguladores|jurisprudencia|tratados)/.+\.md)$'
      or position('..' in d->>'repository_path') > 0 or jsonb_typeof(d->'passages') <> 'array'
      or jsonb_array_length(d->'passages') > 20000 then raise exception 'Invalid corpus document'; end if;
    perform pg_advisory_xact_lock(hashtextextended(d->>'id', 0));
    select content_sha256,content_mode into old_hash,old_mode from public.ross_law_documents where id = d->>'id';
    -- A lightweight sync never replaces an existing complete search index.
    if old_hash = d->>'content_sha256' and ((old_mode='full' and d->>'content_mode'='metadata') or (old_mode=coalesce(d->>'content_mode','full') and (select count(*) from public.ross_law_passages where document_id=d->>'id') = jsonb_array_length(d->'passages'))) then unchanged := unchanged + 1; continue; end if;
    insert into public.ross_law_documents
      (id,repository,repository_path,repository_ref,content_sha256,title,norm_type,number,norm_date,scope,uf,municipality,category,summary,urn,source_url,text_version,status,captured_at,is_partial,content_mode,warnings)
    values
      (d->>'id',d->>'repository',d->>'repository_path',d->>'repository_ref',d->>'content_sha256',d->>'title',d->>'norm_type',d->>'number',(d->>'norm_date')::date,d->>'scope',d->>'uf',d->>'municipality',d->>'category',d->>'summary',d->>'urn',d->>'source_url',d->>'text_version',d->>'status',(d->>'captured_at')::date,(d->>'is_partial')::boolean,coalesce(d->>'content_mode','full'),d->'warnings')
    on conflict (id) do update set
      repository_ref=excluded.repository_ref,content_sha256=excluded.content_sha256,title=excluded.title,norm_type=excluded.norm_type,number=excluded.number,norm_date=excluded.norm_date,
      scope=excluded.scope,uf=excluded.uf,municipality=excluded.municipality,category=excluded.category,summary=excluded.summary,urn=excluded.urn,source_url=excluded.source_url,
      text_version=excluded.text_version,status=excluded.status,captured_at=excluded.captured_at,is_partial=excluded.is_partial,content_mode=excluded.content_mode,warnings=excluded.warnings,imported_at=now();
    delete from public.ross_law_passages where document_id = d->>'id';
    insert into public.ross_law_passages(document_id,ordinal,article,heading,content,repealed)
      select d->>'id',p.ordinal,p.article,p.heading,p.content,p.repealed
      from jsonb_to_recordset(d->'passages') as p(ordinal integer,article text,heading text,content text,repealed boolean);
    imported := imported + 1;
  end loop;
  return jsonb_build_object('imported',imported,'unchanged',unchanged);
end;
$$;

create function public.ross_law_search(p_query text,p_scope text default null,p_uf text default null,p_municipality text default null,p_limit integer default 15,p_offset integer default 0,p_for_answer boolean default false)
returns jsonb language plpgsql stable security invoker set search_path = '' set statement_timeout = '8s' as $$
declare q tsquery; exact_number text; answer jsonb;
begin
  if length(trim(p_query)) < 2 or length(p_query) > 500 then return jsonb_build_object('results','[]'::jsonb,'hasMore',false); end if;
  if p_for_answer then q := replace(plainto_tsquery('portuguese',p_query)::text, ' & ', ' | ')::tsquery;
  else q := websearch_to_tsquery('portuguese',p_query); end if;
  exact_number := replace(substring(p_query from '\m([0-9]{1,3}\.[0-9]{3}|[0-9]{4,6})\M'),'.','');
  with document_hits as materialized (
    select d.id, (ts_rank(d.search_vector,q) + case when d.number = exact_number then 10 else 0 end) as rank
    from public.ross_law_documents d
    where (d.search_vector @@ q or d.number = exact_number)
      and (p_scope is null or d.scope = p_scope)
      and (p_uf is null or d.uf = p_uf or d.scope = 'federal')
      and (p_municipality is null or d.municipality = p_municipality or d.scope <> 'municipal')
      and (not p_for_answer or (d.content_mode='full' and not d.is_partial and d.status <> 'repealed' and d.category <> 'jurisprudencia'))
      and (not p_for_answer or d.scope <> 'municipal' or p_municipality is not null)
    order by rank desc,d.id limit 150
  ), candidates as (
    select c.document_id,c.ordinal,h.rank + ts_rank(c.search_vector,q) as rank
    from document_hits h join public.ross_law_passages c on c.document_id = h.id
    where (c.ordinal = 0 or c.search_vector @@ q) and (not p_for_answer or not c.repealed)
    union all
    select c.document_id,c.ordinal,ts_rank(c.search_vector,q) as rank
    from public.ross_law_passages c join public.ross_law_documents d on d.id = c.document_id
    where c.search_vector @@ q
      and (p_scope is null or d.scope = p_scope)
      and (p_uf is null or d.uf = p_uf or d.scope = 'federal')
      and (p_municipality is null or d.municipality = p_municipality or d.scope <> 'municipal')
      and (not p_for_answer or (d.content_mode='full' and not d.is_partial and d.status <> 'repealed' and not c.repealed and d.category <> 'jurisprudencia'))
      and (not p_for_answer or d.scope <> 'municipal' or p_municipality is not null)
  ), deduplicated as (
    select document_id,ordinal,max(rank) as rank from candidates group by document_id,ordinal
  ), diversified as (
    select *,row_number() over(partition by document_id order by rank desc,ordinal) as document_position from deduplicated
  ), ranked as (
    select document_id,ordinal,rank from diversified where document_position <= 3
    order by rank desc,document_id,ordinal limit greatest(1,least(p_limit,30)) + 1 offset greatest(0,least(p_offset,300))
  ), results as (
    select d.id,d.title,d.norm_type,d.number,d.norm_date,d.scope,d.uf,d.municipality,d.summary,d.source_url,d.text_version,d.status,d.captured_at,d.is_partial,d.category,d.content_mode,
      d.repository_path,d.repository_ref,d.content_sha256,c.article,c.heading,c.ordinal,c.content as excerpt,c.repealed,r.rank
    from ranked r join public.ross_law_documents d on d.id = r.document_id join public.ross_law_passages c on c.document_id = r.document_id and c.ordinal = r.ordinal
    order by r.rank desc,d.id,c.ordinal
  )
  select jsonb_build_object('results',coalesce((select jsonb_agg(to_jsonb(x)) from (select * from results limit greatest(1,least(p_limit,30))) x),'[]'::jsonb),'hasMore',(select count(*) from results) > greatest(1,least(p_limit,30))) into answer;
  return answer;
end;
$$;
create function public.ross_law_stats()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('documents',count(*),'partial',count(*) filter(where is_partial),
    'federal',count(*) filter(where scope='federal'),'estadual',count(*) filter(where scope='estadual'),
    'municipal',count(*) filter(where scope='municipal'),'lastImport',max(imported_at),
    'repository','ctresb/leis','complete',false) from public.ross_law_documents;
$$;
revoke all on function public.ross_law_import(jsonb) from public,anon,authenticated;
revoke all on function public.ross_law_search(text,text,text,text,integer,integer,boolean) from public,anon,authenticated;
revoke all on function public.ross_law_stats() from public,anon,authenticated;
grant execute on function public.ross_law_import(jsonb) to service_role;
grant execute on function public.ross_law_search(text,text,text,text,integer,integer,boolean) to service_role;
grant execute on function public.ross_law_stats() to service_role;
grant execute on function public.ross_ai_bump(text,integer,integer) to service_role;
