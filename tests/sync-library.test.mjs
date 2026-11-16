import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {syncLibrary} from '../scripts/sync-library.mjs';
async function staging(t){const directory=await mkdtemp(join(tmpdir(),'ross-import-test-'));t.after(()=>rm(directory,{recursive:true,force:true}));await writeFile(join(directory,'manifest.json'),JSON.stringify({directoryBatches:[],batches:[{file:'texts-00001.sql'}]}));await writeFile(join(directory,'texts-00001.json'),JSON.stringify(Array.from({length:21},(_,i)=>({id:String(i)}))));return directory;}
test('bounded imports checkpoint committed batches and resume without resending them',async t=>{
  const directory=await staging(t),sizes=[];const input={directory,endpoint:'https://test.invalid',token:'a'.repeat(43),intervalMs:0,fetcher:async(_u,o)=>{const rows=JSON.parse(o.body).batch;sizes.push(rows.length);return Response.json({imported:rows.length});}};
  const first=await syncLibrary({...input,maxBatches:1});assert.equal(first.documents,20);assert.equal(first.finishedAt,undefined);
  const second=await syncLibrary(input);assert.equal(second.documents,21);assert.ok(second.finishedAt);assert.deepEqual(sizes,[20,1]);
  assert.doesNotMatch(await readFile(join(directory,'import-checkpoint.json'),'utf8'),/aaaaaaaaa/);
});
test('a read-only capacity response stops immediately and preserves the last checkpoint',async t=>{
  const directory=await staging(t);let calls=0;
  await assert.rejects(()=>syncLibrary({directory,endpoint:'https://test.invalid',token:'a'.repeat(43),intervalMs:0,fetcher:async()=>{calls++;return Response.json({error:'library_read_only'},{status:503});}}),/capacity/);
  assert.equal(calls,1);
});
