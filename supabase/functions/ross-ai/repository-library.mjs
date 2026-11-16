import { corpusDocument, isCorpusPath, DEFAULT_REF } from './corpus-document.mjs';
import { eligibleForAnswer, repositoryExcerpts } from './repository-excerpts.mjs';
const FAMILIES = new Set(['leis-ordinarias','leis-complementares','leis-delegadas','decretos-lei','decretos','medidas-provisorias','emendas-constitucionais','resolucoes','portarias']);
const normalize = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const TYPES = {'lei':'leis-ordinarias','lei ordinaria':'leis-ordinarias','lei complementar':'leis-complementares','lc':'leis-complementares','lcp':'leis-complementares','lei delegada':'leis-delegadas','decreto-lei':'decretos-lei','decreto lei':'decretos-lei','decreto':'decretos','medida provisoria':'medidas-provisorias','mp':'medidas-provisorias','emenda constitucional':'emendas-constitucionais','ec':'emendas-constitucionais','resolucao':'resolucoes','portaria':'portarias'};
// Verified build manifest, not an estimate of all Brazilian legislation. Only
// expose its file count while every directory of this pinned edition exists.
export const CATALOG_SNAPSHOT = Object.freeze({ref:DEFAULT_REF,directories:12801,files:1218984,verifiedAt:'2026-11-16'});
export async function libraryStats(sb) {
  const counts=await Promise.all([
    sb.from('ross_law_documents').select('id',{head:true,count:'exact'}),
    sb.from('ross_law_documents').select('id',{head:true,count:'exact'}).eq('content_mode','full'),
    sb.from('ross_law_versions').select('document_id',{head:true,count:'exact'}),
    sb.from('ross_law_directories').select('id',{head:true,count:'exact'}).eq('repository_ref',CATALOG_SNAPSHOT.ref)
  ]);
  if(counts.some(r=>r.error))throw new Error('corpus_unavailable');
  return {documents:counts[0].count,fullTexts:counts[1].count,storedVersions:counts[2].count,
    catalogDocuments:counts[3].count===CATALOG_SNAPSHOT.directories?CATALOG_SNAPSHOT.files:null,
    catalogVerifiedAt:CATALOG_SNAPSHOT.verifiedAt,catalogCountMode:'pinned-snapshot',repository:'ctresb/leis',complete:false};
}
export async function documentCandidates(sb,{query,scope,uf,municipality,forAnswer,offset=0}) {
  let request=sb.from('ross_law_documents').select('id,title,norm_type,number,scope,uf,municipality,summary,source_url,text_version,status,captured_at,is_partial,category,content_mode,repository_path,repository_ref,content_sha256');
  const number=query.trim().match(/^(\d[\d.]{0,10})$/)?.[1]?.replace(/\./g,'');
  const words=normalize(query).match(/[a-z0-9]{2,}/g)||[];
  if(number)request=request.eq('number',number);
  else request=request.textSearch('search_vector',forAnswer?words.slice(0,16).join(' OR '):query,{config:'portuguese',type:'websearch'});
  if(scope)request=request.eq('scope',scope);
  if(uf)request=request.or('scope.eq.federal,uf.eq.'+uf);
  if(municipality)request=request.or('scope.neq.municipal,municipality.eq.'+municipality);
  if(forAnswer){request=request.eq('is_partial',false).neq('status','repealed').neq('category','jurisprudencia');if(!municipality)request=request.neq('scope','municipal');}
  const result=await request.order('norm_date',{ascending:false,nullsFirst:false}).order('id').range(offset,offset+15);
  if(result.error)throw new Error('corpus_unavailable');
  return {results:(result.data||[]).slice(0,15).map(d=>({...d,requires_read:true,article:'Identificação da norma',excerpt:d.summary})),hasMore:(result.data||[]).length>15};
}
export function libraryReferences(input, question = '') {
  const candidates = Array.isArray(input) ? input.slice(0,8) : [];
  const regex = /\b(lei complementar|lei delegada|lei ordinaria|decreto[- ]lei|emenda constitucional|medida provisoria|lei|decreto|resolucao|portaria|lcp|lc|ec|mp)\s*(?:n[.º°o]*\s*)?(\d[\d.]{0,10})(?:\s*(?:\/|de\s+)(\d{4}))?/g;
  for (const m of normalize(question).matchAll(regex)) candidates.push({type:m[1],number:m[2],year:m[3] || null});
  const seen = new Set(), result = [];
  for (const r of candidates) {
    if (!r || typeof r !== 'object') continue;
    const family = FAMILIES.has(r.family) ? r.family : TYPES[normalize(r.type).trim()];
    const number = String(r.number || '').replace(/\./g,'');
    const year = r.year == null || r.year === '' ? null : Number(r.year);
    if (!family || !/^[1-9]\d{0,7}$/.test(number) || year !== null && (!Number.isInteger(year) || year < 1800 || year > new Date().getUTCFullYear()+1)) continue;
    const key = family+':'+number+':'+year;
    if (seen.has(key)) continue; seen.add(key); result.push({family,number,year});
  }
  return result.slice(0,4);
}
export async function digestText(text, algorithm='SHA-256') {
  const bytes = typeof text === 'string' ? new TextEncoder().encode(text) : text;
  return Array.from(new Uint8Array(await crypto.subtle.digest(algorithm,bytes)),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function boundedText(response, max=3_000_000) {
  if (!response.ok || Number(response.headers.get('content-length') || 0)>max) throw new Error('source_unavailable');
  const reader=response.body.getReader(), chunks=[]; let count=0;
  try { for (;;) { const part=await reader.read(); if(part.done)break; count+=part.value.byteLength; if(count>max){await reader.cancel();throw new Error('source_too_large');} chunks.push(part.value); } }
  finally { reader.releaseLock(); }
  const bytes=new Uint8Array(count); let offset=0; for(const c of chunks){bytes.set(c,offset);offset+=c.byteLength;}
  return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
}
const memory=new Map();
function keep(cache,key,value) {
  const bytes=new TextEncoder().encode(value.raw).byteLength;
  cache.delete(key);
  let cacheBytes=Array.from(cache.values()).reduce((n,v)=>n+v.bytes,0);
  while(cache.size && (cache.size>=30 || cacheBytes+bytes>12_000_000)){const [k,v]=cache.entries().next().value;cacheBytes-=v.bytes;cache.delete(k);}
  cache.set(key,{...value,bytes});cacheBytes+=bytes;
}
export function createRepositoryLibrary(sb,{fetcher=fetch,cache=memory,persist=true}={}) {
  async function read(id) {
    if(!/^l:[a-f0-9]{64}:\d{1,6}$/.test(id))throw new Error('invalid_locator');
    const found=await sb.rpc('ross_library_locator',{p_id:id});
    const loc=found.data;
    if(found.error || !loc || !isCorpusPath(loc.repository_path) || !/^[a-f0-9]{40}$/.test(loc.repository_ref) || !/^[a-f0-9]{40}$/.test(loc.blob_sha1))throw new Error('document_unavailable');
    const key=loc.repository_ref+':'+loc.repository_path;
    const documentId=await digestText('ctresb/leis:'+loc.repository_path);
    let raw, localCopy=false;
    const stored=await sb.from('ross_law_versions').select('markdown,stored_at').eq('document_id',documentId).eq('repository_ref',loc.repository_ref).order('stored_at',{ascending:false}).limit(1).maybeSingle();
    if(stored.data?.markdown){raw=stored.data.markdown;localCopy=true;}
    else if(cache.has(key))raw=cache.get(key).raw;
    else {
      const url='https://raw.githubusercontent.com/ctresb/leis/'+loc.repository_ref+'/'+loc.repository_path.split('/').map(encodeURIComponent).join('/');
      raw=await boundedText(await fetcher(url,{signal:AbortSignal.timeout(15000),redirect:'error'}));
    }
    const bytes=new TextEncoder().encode(raw), prefix=new TextEncoder().encode('blob '+bytes.length+'\0'), input=new Uint8Array(prefix.length+bytes.length);input.set(prefix);input.set(bytes,prefix.length);
    if(await digestText(input,'SHA-1')!==loc.blob_sha1)throw new Error('document_integrity');
    const doc=corpusDocument(loc.repository_path,raw,loc.repository_ref,false);
    keep(cache,key,{raw});
    return {doc,raw,markdown:raw.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/,''),localCopy,locatorId:id};
  }
  async function save(item) {
    if(item.localCopy)return item;
    if(!persist)return {...item,localCopy:false,persistencePaused:true};
    const stored=await sb.rpc('ross_library_import',{p_documents:[{...item.doc,markdown:item.raw}]});
    return {...item,localCopy:!stored.error,cacheUnavailable:!!stored.error};
  }
  async function readAndStore(id){return save(await read(id));}
  async function search({references,query='',scope=null,uf=null,municipality=null,forAnswer=false}) {
    const refs=libraryReferences(references,query);if(!refs.length)return {results:[],sourceFailures:0};
    // Without a state/city, a bare law number must not silently pick a
    // same-number state law from another jurisdiction.
    const lookup=await sb.rpc('ross_library_locate',{p_references:refs,p_scope:scope || (uf ? null : 'federal'),p_uf:uf,p_municipality:municipality});
    if(lookup.error)throw new Error('catalog_unavailable');
    const candidates=Array.isArray(lookup.data)?lookup.data.slice(0,3):[];
    const reads=await Promise.allSettled(candidates.map(loc=>read(loc.id)));
    const results=[];let sourceFailures=0;
    for(const result of reads){
      if(result.status!=='fulfilled'){sourceFailures++;continue;}
      const item=await save(result.value),doc=item.doc;
      if(forAnswer && !eligibleForAnswer(doc,municipality))continue;
      const excerpts=repositoryExcerpts(item.markdown,query,3,2800,libraryReferences([],query).length>0);
      const passages=excerpts.length?excerpts:forAnswer?[]:[{article:'Texto da norma',excerpt:item.markdown.slice(0,2800)}];
      for(const p of passages)results.push({...doc,...p,id:item.localCopy?doc.id:item.locatorId,content_mode:item.localCopy?'full':'on_demand',heading:'Texto do acervo; vigência não confirmada',localCopy:item.localCopy});
    }
    return {results,sourceFailures};
  }
  return {read:readAndStore,search};
}
