import { boundedText, digestText, libraryReferences } from './repository-library.mjs';
const plain=s=>String(s||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,' ').replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g,m=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '}[m])).replace(/\s+/g,' ').trim();
const norm=s=>plain(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const safeURL=s=>{try{const u=new URL(s);return u.protocol==='https:'&&(/(?:^|\.)stj\.jus\.br$/.test(u.hostname)||u.hostname==='normas.leg.br')?u.href:'';}catch{return '';}};
const STOP=new Set('ultimas ultimos noticias novidade novidades atualizacoes atualizacao recente recentes sobre direito juridico juridica jurisprudencia stj brasil hoje mostrar buscar consultar pesquisa quais quero saber'.split(' '));
export function parseCSV(text,maxRows=10000){
  const rows=[];let row=[],field='',quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
    else if(!quoted&&c===','){row.push(field);field='';}
    else if(!quoted&&(c==='\n'||c==='\r')){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(Boolean))rows.push(row);row=[];field='';if(rows.length>maxRows)throw new Error('source_too_large');}
    else field+=c;
  }
  if(quoted)throw new Error('source_format');
  if(field||row.length){row.push(field);rows.push(row);}
  const headers=(rows.shift()||[]).map(x=>x.replace(/^\uFEFF/,''));
  return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||''])));
}
export async function parseNews(xml){
  if(!/<rss\b|<feed\b/i.test(xml))throw new Error('source_format');
  const items=[...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].slice(0,150);
  const output=[];
  for(const match of items){const read=key=>plain(match[1].match(new RegExp('<'+key+'\\b[^>]*>([\\s\\S]*?)<\\/'+key+'>','i'))?.[1]||'');
    const title=read('title').slice(0,400),url=safeURL(read('link')),date=read('pubDate');
    if(!title||!url)continue;
    output.push({id:'news-'+(await digestText(url)).slice(0,32),contentType:'news',title,source:'STJ',source_url:url,published_at:Number.isFinite(Date.parse(date))?new Date(date).toISOString():null,summary:'Notícia do STJ. Abra a fonte para ler o conteúdo e conferir a decisão ou norma mencionada.'});
  }
  return output;
}
export function rankPublic(items,query,offset=0){
  const tokens=[...new Set(norm(query).match(/[a-z0-9]{3,}/g)||[])].filter(t=>!STOP.has(t));
  const ranked=items.map((item,index)=>({item,index,score:tokens.reduce((n,t)=>n+(norm([item.title,item.summary,item.subject,item.status,item.court].join(' ')).includes(t)?1:0),0)})).filter(x=>!tokens.length||x.score>0).sort((a,b)=>b.score-a.score||a.index-b.index);
  return {results:ranked.slice(offset,offset+15).map(x=>x.item),hasMore:ranked.length>offset+15};
}
const memory=new Map();
export function createPublicSources(sb,{fetcher=fetch,now=()=>Date.now(),cache=memory}={}){
  async function cached(key,loader,ttl=3600000){
    const hit=cache.get(key);if(hit&&now()-hit.at<ttl)return {...hit,stale:false};
    const saved=await sb.from('ross_source_cache').select('payload,fetched_at').eq('key',key).maybeSingle();
    if(saved.data&&now()-Date.parse(saved.data.fetched_at)<ttl){const value={at:Date.parse(saved.data.fetched_at),items:saved.data.payload};cache.set(key,value);return {...value,stale:false};}
    try{const items=await loader(),value={at:now(),items};if(cache.size>=40)cache.delete(cache.keys().next().value);cache.set(key,value);await sb.from('ross_source_cache').upsert({key,payload:items,fetched_at:new Date(value.at).toISOString()});return {...value,stale:false};}
    catch(e){if(hit)return {...hit,stale:true};if(saved.data)return {at:Date.parse(saved.data.fetched_at),items:saved.data.payload,stale:true};throw e;}
  }
  async function news(query='',offset=0){
    const result=await cached('stj-news-v1',async()=>parseNews(await boundedText(await fetcher('https://res.stj.jus.br/hrestp-c-portalp/RSS.xml',{signal:AbortSignal.timeout(15000),redirect:'error'}),2000000)),900000);
    return {...rankPublic(result.items,query,offset),kind:'news',source:'STJ',fetchedAt:new Date(result.at).toISOString(),stale:result.stale};
  }
  async function precedents(query='',offset=0){
    const result=await cached('stj-precedents-v1',async()=>{
      const meta=JSON.parse(await boundedText(await fetcher('https://dadosabertos.web.stj.jus.br/api/3/action/package_show?id=precedentes-qualificados',{signal:AbortSignal.timeout(15000),redirect:'error'}),1000000));
      if(meta.success!==true||!Array.isArray(meta.result?.resources))throw new Error('source_format');
      const resource=meta.result.resources.filter(r=>norm(r.name)==='temas.csv'&&safeURL(r.url)).sort((a,b)=>String(b.last_modified).localeCompare(String(a.last_modified)))[0];
      if(!resource)throw new Error('source_format');
      const rows=parseCSV(await boundedText(await fetcher(resource.url,{signal:AbortSignal.timeout(15000),redirect:'error'}),8000000));
      if(!rows.length||!('sequencialPrecedente' in rows[0]))throw new Error('source_format');
      return rows.filter(r=>/^\d+$/.test(r.sequencialPrecedente)).map(r=>({id:'stj-'+r.sequencialPrecedente,contentType:'precedent',title:'STJ · Tema '+r.numeroPrecedente,number:r.numeroPrecedente,precedentType:plain(r.tipoPrecedente),subject:plain(r.questaoSubmetidaAJulgamento).slice(0,2500),summary:plain(r.teseFirmada).slice(0,4500),truncated:plain(r.teseFirmada).length>4500,status:plain(r.situacao),court:plain(r.orgaoJulgador),published_at:r.dataPublicacaoAcordao||null,source:'STJ · Precedentes qualificados',source_url:'https://dadosabertos.web.stj.jus.br/dataset/precedentes-qualificados',data_url:resource.url}));
    });
    return {...rankPublic(result.items,query,offset),kind:'precedents',source:'STJ',fetchedAt:new Date(result.at).toISOString(),stale:result.stale};
  }
  async function senado(references,question=''){
    const refs=libraryReferences(references,question).slice(0,2),types={'leis-ordinarias':'LEI','leis-complementares':'LCP','leis-delegadas':'LDL','decretos-lei':'DEL','decretos':'DEC','medidas-provisorias':'MPV','emendas-constitucionais':'EMC'},output=[];
    for(const ref of refs){const type=types[ref.family];if(!type)continue;
      const key='senado-'+type+'-'+ref.number+'-'+(ref.year||'all');
      const result=await cached(key,async()=>{
        const url=new URL('https://legis.senado.leg.br/dadosabertos/legislacao/lista');url.search=new URLSearchParams({tipo:type,numero:ref.number,v:'3',...(ref.year?{ano:String(ref.year)}:{})}).toString();
        const response=await fetcher(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000),redirect:'error'});
        if(!response.headers.get('content-type')?.includes('json'))throw new Error('source_format');
        const json=JSON.parse(await boundedText(response,2000000)),records=json.ListaDocumento?.documentos?.documento;
        if(!Array.isArray(records))return [];
        return records.filter(r=>String(r.numero).replace(/\./g,'')===ref.number&&(!ref.year||String(r.anoassinatura)===String(ref.year))).slice(0,3).map(r=>({id:'senado-'+r.id,title:plain(r.normaNome),scope:'federal',norm_type:plain(r.descricao),number:ref.number,summary:plain(r.ementa),excerpt:plain(r.ementa),article:'Identificação da norma',source_type:'senado',source_url:'https://www25.senado.leg.br/web/atividade/legislacao',text_version:'Catálogo oficial do Senado; texto integral ainda não obtido',status:'unknown',is_partial:true,content_mode:'metadata',captured_at:new Date(now()).toISOString().slice(0,10)}));
      });output.push(...result.items);
    }
    return output;
  }
  return {news,precedents,senado};
}
