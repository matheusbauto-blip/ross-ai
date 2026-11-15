import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const version = '0.18.12';
const integrity = 'sha512-jalJsOwIKuQJSeTvsgzPe9iJzyfVaEJiEXl+25EkKevsULHvMJzpNqwvj1jOESWdmgKDiXObyjOYwlUqG7wo1Q==';
const localTarball = process.argv[2];
const archive = localTarball ? await readFile(localTarball) : Buffer.from(await (await fetch('https://registry.npmjs.org/linkedom/-/linkedom-' + version + '.tgz')).arrayBuffer());
if ('sha512-' + createHash('sha512').update(archive).digest('base64') !== integrity) throw new Error('DOM dependency integrity mismatch');
const tar = gunzipSync(archive);
let worker;
for (let offset = 0; offset < tar.length;) {
  const name = tar.subarray(offset, offset + 100).toString().replace(/\0.*$/, '');
  const size = parseInt(tar.subarray(offset + 124, offset + 136).toString().trim(), 8) || 0;
  if (name === 'package/worker.js') worker = tar.subarray(offset + 512, offset + 512 + size);
  offset += 512 + Math.ceil(size / 512) * 512;
}
if (!worker) throw new Error('DOM module not found');
const directory = resolve(tmpdir(), 'ross-qa-dom');
await mkdir(directory, { recursive: true });
await writeFile(resolve(directory, 'linkedom-worker.mjs'), worker);
console.log('DOM test dependency ready: linkedom ' + version);
