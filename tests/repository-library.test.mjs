import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRepositoryLibrary, libraryReferences, boundedText, libraryStats, documentCandidates, CATALOG_SNAPSHOT } from '../supabase/functions/ross-ai/repository-library.mjs';
const ref='a'.repeat(40),path='federal/leis-complementares/2013/lcp-142-2013-05-08.md';
const raw='---\ntitulo: "Lei Complementar 142/2013"\ntipo: "Lei Complementar"\nnumero: "142"\ndata: "2013-05-08"\nfonte: "https://www.planalto.gov.br/lei"\nversao_texto: "Original"\n---\n## Art. 1º\nEsta lei trata da aposentadoria da pessoa com deficiência e estabelece critérios para a concessão do benefício previdenciário.\n## Art. 2º\nA avaliação deve considerar os requisitos estabelecidos nesta lei e observar as condições previstas na legislação aplicável.\n';
const digest=createHash('sha1').update('blob '+Buffer.byteLength(raw)+'\0').update(raw).digest('hex');
function database(stored=null){
  const calls=[];const locator={id:'l:'+ref.repeat(1)+'b'.repeat(24)+':0',repository_path:path,repository_ref:ref,blob_sha1:digest};
  const sb={rpc:async(name,params)=>{calls.push({name,params});return {data:name==='ross_library_locator'?locator:name==='ross_library_locate'?[locator]:{imported:1}};},from:()=>{const query={select:()=>query,eq:()=>query,order:()=>query,limit:()=>query,maybeSingle:async()=>({data:stored?{markdown:stored}:null})};return query;}};
  return {sb,calls,locator};
}
test('references include laws outside the bundled catalog and reject invented shapes',()=>{
  assert.deepEqual(libraryReferences([], 'Explique a Lei Complementar nº 142/2013 e o decreto-lei 5.452 de 1943'),[{family:'leis-complementares',number:'142',year:2013},{family:'decretos-lei',number:'5452',year:1943}]);
  assert.equal(libraryReferences([{type:'projeto de lei',number:1},{type:'lei',number:'../1'},{type:'lei',number:'1',year:9999}]).length,0);
});
test('an intact own snapshot answers without any GitHub request or database mutation',async()=>{
  const {sb,calls,locator}=database(raw);
  const library=createRepositoryLibrary(sb,{fetcher:()=>{throw new Error('network must not be used');}});
  const result=await library.search({references:[{type:'lei complementar',number:'142',year:2013}],query:'aposentadoria deficiência',forAnswer:true});
  assert.equal(result.results[0].article,'Art. 1º');assert.equal(result.results[0].localCopy,true);
  assert.ok(!calls.some(c=>c.name==='ross_library_import'));
  assert.equal(calls[0].params.p_scope,'federal');
  assert.equal((await library.read(locator.id)).localCopy,true);
});
test('remote snapshots are checked against the pinned Git blob before being saved',async()=>{
  const {sb,calls,locator}=database();let url='';
  const result=await createRepositoryLibrary(sb,{cache:new Map(),fetcher:async u=>{url=u;return new Response(raw);}}).read(locator.id);
  assert.match(url,/^https:\/\/raw\.githubusercontent\.com\/ctresb\/leis\/[a-f0-9]{40}\//);
  assert.equal(result.localCopy,true);assert.ok(calls.some(c=>c.name==='ross_library_import'));
  const bad=database(raw+'tampered');
  await assert.rejects(()=>createRepositoryLibrary(bad.sb).read(bad.locator.id),/integrity/);
  assert.ok(!bad.calls.some(c=>c.name==='ross_library_import'));
});
test('locator validation and streamed byte limits protect source reads',async()=>{
  const {sb}=database();await assert.rejects(()=>createRepositoryLibrary(sb).read('https://evil.invalid'),/invalid_locator/);
  await assert.rejects(()=>boundedText(new Response('a'.repeat(21)),20),/source_too_large/);
});

test('coverage counts avoid scanning catalog bodies and disclose the pinned counting date',async()=>{
  const selections=[];
  const sb={from:table=>{const q={select(field,options){selections.push({field,options});return q;},eq:()=>q,then(resolve){return Promise.resolve({count:table==='ross_law_directories'?CATALOG_SNAPSHOT.directories:20}).then(resolve);}};return q;}};
  const stats=await libraryStats(sb);assert.equal(stats.catalogDocuments,1218984);assert.equal(stats.fullTexts,20);
  assert.equal(stats.catalogCountMode,'pinned-snapshot');assert.equal(stats.complete,false);
  assert.ok(selections.every(x=>x.options.head===true&&x.field!=='records'));
});
test('topic search returns document identifiers for hydration, never metadata disguised as an article',async()=>{
  const calls=[];const q={select:()=>q,eq:(...args)=>{calls.push(args);return q;},or:()=>q,neq:()=>q,textSearch:()=>q,order:()=>q,range:async()=>({data:[{id:'a'.repeat(64),summary:'Ementa de identificação'}]})};
  const result=await documentCandidates({from:()=>q},{query:'14.133',scope:'federal',forAnswer:true});
  assert.ok(calls.some(x=>x[0]==='number'&&x[1]==='14133'));assert.equal(result.results[0].requires_read,true);assert.equal(result.results[0].article,'Identificação da norma');
});
