import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCSV,parseNews,rankPublic,createPublicSources } from '../supabase/functions/ross-ai/public-sources.mjs';
test('CSV parser preserves multiline quoted theses and doubled quotes',()=>{
  const rows=parseCSV('\uFEFFnumero,tese\r\n1,"linha 1\nlinha 2, com ""aspas"""\r\n');
  assert.deepEqual(rows,[{numero:'1',tese:'linha 1\nlinha 2, com "aspas"'}]);
  assert.throws(()=>parseCSV('tese\n"incompleta'),/source_format/);
});
test('official news contains a headline and source, never a copied article or statute',async()=>{
  const rows=await parseNews('<rss><channel><item><title><![CDATA[Consumidor &amp; contrato]]></title><link>https://www.stj.jus.br/noticia</link><description>corpo que não deve ser copiado</description><pubDate>Mon, 16 Nov 2026 12:00:00 GMT</pubDate></item><item><title>Unsafe</title><link>javascript:alert(1)</link></item></channel></rss>');
  assert.equal(rows.length,1);assert.equal(rows[0].contentType,'news');
  assert.equal(rows[0].title,'Consumidor & contrato');assert.equal(rows[0].published_at,'2026-11-16T12:00:00.000Z');
  assert.doesNotMatch(JSON.stringify(rows),/corpo que/);
  assert.equal(rankPublic(rows,'notícias consumidor').results.length,1);
  assert.equal(rankPublic(rows,'aposentadoria').results.length,0);
  await assert.rejects(()=>parseNews('<html>security challenge</html>'),/source_format/);
});
test('source cache reuses material without storing a user question and marks stale copies',async()=>{
  const writes=[];let now=Date.parse('2026-11-16T12:00Z'),fail=false,calls=0;
  const query={select(){return this;},eq(){return this;},maybeSingle:async()=>({data:null}),upsert:async row=>{writes.push(row);return {data:null};}};
  const sources=createPublicSources({from:()=>query},{cache:new Map(),now:()=>now,fetcher:async()=>{calls++;if(fail)throw new Error('outage');return new Response('<rss><channel><item><title>Direitos do consumidor</title><link>https://www.stj.jus.br/noticia-cache</link></item></channel></rss>');}});
  assert.equal((await sources.news('consumidor')).stale,false);
  assert.equal((await sources.news('contrato')).stale,false);assert.equal(calls,1);
  assert.ok(!JSON.stringify(writes).includes('contrato'));
  now+=901000;fail=true;
  const stale=await sources.news('consumidor');assert.equal(stale.stale,true);assert.equal(stale.fetchedAt,'2026-11-16T12:00:00.000Z');
});
test('Senado metadata is never presented as an article or a confirmed full text',async()=>{
  const query={select(){return this;},eq(){return this;},maybeSingle:async()=>({data:null}),upsert:async()=>({})};
  const sources=createPublicSources({from:()=>query},{cache:new Map(),fetcher:async()=>Response.json({ListaDocumento:{documentos:{documento:[{id:1,numero:142,anoassinatura:2013,normaNome:'LCP 142/2013',ementa:'Ementa de identificação'}]}}})});
  const result=await sources.senado([{type:'lei complementar',number:'142',year:2013}]);
  assert.equal(result[0].content_mode,'metadata');assert.equal(result[0].is_partial,true);assert.equal(result[0].article,'Identificação da norma');
});
