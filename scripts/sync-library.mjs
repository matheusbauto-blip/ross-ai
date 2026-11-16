#!/usr/bin/env node
// Upload only typed corpus data through an expiring operator grant. Neither
// the grant nor database credentials are written into checkpoints or logs.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
export async function syncLibrary({ directory, endpoint, token, onProgress = () => {}, signal, maxBatches = 50, intervalMs = 1500, fetcher = fetch }) {
  if (!/^https:\/\//.test(endpoint) || !/^[A-Za-z0-9_-]{43,100}$/.test(token || '')) throw new Error('Use an HTTPS endpoint and a temporary operator grant');
  const manifest = JSON.parse(await fs.readFile(path.join(directory, 'manifest.json'), 'utf8'));
  const checkpointFile = path.join(directory, 'import-checkpoint.json');
  let checkpoint;
  try { checkpoint = JSON.parse(await fs.readFile(checkpointFile, 'utf8')); }
  catch(e) { if (e.code !== 'ENOENT') throw e; checkpoint = { completed: [], documents: 0, directories: 0, startedAt: new Date().toISOString() }; }
  const completed = new Set(checkpoint.completed); let sent = 0;
  const groups = [{ kind: 'catalog', files: manifest.directoryBatches }, { kind: 'texts', files: manifest.batches }];
  for (const group of groups) for (const entry of group.files) {
    const json = await fs.readFile(path.join(directory, entry.file.replace('.sql', '.json')), 'utf8');
    const identity = createHash('sha256').update(json).digest('hex'), rows = JSON.parse(json);
    const count = group.kind === 'texts' ? 20 : rows.length;
    for (let offset = 0; offset < rows.length; offset += count) {
      const key = group.kind + ':' + identity + ':' + offset;
      if (completed.has(key)) continue;
      delete checkpoint.finishedAt;
      if (sent >= maxBatches) return checkpoint;
      if (signal?.aborted) throw new Error('Import cancelled');
      const batch = rows.slice(offset, offset + count), body = JSON.stringify({ op: 'library_import', kind: group.kind, batch });
      let data;
      for (let attempt = 0; attempt < 3; attempt++) {
        const timeout = AbortSignal.timeout(90000);
        const response = await fetcher(endpoint, {method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body,signal:signal ? AbortSignal.any([signal,timeout]) : timeout});
        const result = await response.json();
        if (response.ok) { data = result; break; }
        if (result.error === 'library_read_only' || result.error === 'library_capacity') throw new Error('Import paused: database capacity must be recovered before resuming; checkpoint preserved');
        if ([401,403].includes(response.status)) throw new Error('Operator grant missing or expired; preserve the checkpoint and renew it');
        if (![429,500,502,503,504].includes(response.status) || attempt === 2) throw new Error('Import '+group.kind+' '+entry.file+' failed: HTTP '+response.status+' '+String(result.error || ''));
        await pause(Math.min(60000, Math.max(1000,Number(response.headers.get('retry-after') || 0)*1000,1000*2**attempt)));
      }
      completed.add(key); checkpoint.completed = Array.from(completed); checkpoint.updatedAt = new Date().toISOString();
      checkpoint.documents += Number(data.imported || 0); checkpoint.directories += Number(data.directories || 0);
      await fs.writeFile(checkpointFile + '.tmp', JSON.stringify(checkpoint)); await fs.rename(checkpointFile + '.tmp', checkpointFile);
      sent++; onProgress({ kind: group.kind, file: entry.file, completedBatches: completed.size, documents: checkpoint.documents, directories: checkpoint.directories });
      if (intervalMs > 0) await pause(Math.max(1000, intervalMs));
    }
  }
  checkpoint.finishedAt = new Date().toISOString(); await fs.writeFile(checkpointFile, JSON.stringify(checkpoint));
  return checkpoint;
}
if (typeof process !== 'undefined' && process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const directory = path.resolve(process.argv[2] || '.corpus-library');
  const endpoint = process.env.ROSS_API_URL, token = process.env.ROSS_LIBRARY_OPERATOR_TOKEN;
  await syncLibrary({directory,endpoint,token,onProgress:p=>{if(p.completedBatches%25===0)console.log(JSON.stringify(p));}}).then(p=>console.log(JSON.stringify({done:!!p.finishedAt,paused:!p.finishedAt,documents:p.documents,directories:p.directories})));
}
