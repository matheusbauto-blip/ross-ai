import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(process.argv[2] || resolve(root, 'dist'));
if (output === root || root.startsWith(output + sep)) throw new Error('The release directory must not contain the source checkout');
const files = new Map();
for (const name of ['index.html', 'styles.css', 'config.js', 'i18n.js', 'demo-data.js', 'process-tracker.js', 'app.js', 'data/catalog.json']) {
  files.set(name, await readFile(resolve(root, name)));
}
const catalog = JSON.parse(files.get('data/catalog.json').toString());
for (const law of catalog.laws) {
  if (!/^laws\/[a-z0-9_-]+\.json$/i.test(law.file)) throw new Error('Unsafe law path in catalog');
  const name = 'data/' + law.file;
  files.set(name, await readFile(resolve(root, name)));
}
try { files.set('data/pending.json', await readFile(resolve(root, 'data/pending.json'))); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
files.set('.nojekyll', Buffer.alloc(0));

async function checkExisting(directory, prefix = '') {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return; throw error; }
  for (const entry of entries) {
    const name = prefix + entry.name;
    if (entry.isSymbolicLink()) throw new Error('Symbolic link in release directory: ' + name);
    if (entry.isDirectory()) await checkExisting(resolve(directory, entry.name), name + '/');
    else if (name !== 'release.json' && !files.has(name)) throw new Error('Unexpected file in release directory: ' + name);
  }
}
await checkExisting(output);

const fingerprint = createHash('sha256');
for (const [name, content] of [...files].sort(([a], [b]) => a.localeCompare(b))) {
  fingerprint.update(name).update('\0').update(content).update('\0');
  if (/AQ\.[A-Za-z0-9_-]{25,}|AIza[A-Za-z0-9_-]{25,}|sb_secret_[A-Za-z0-9_-]+/.test(content.toString())) {
    throw new Error('Possible private credential in public release: ' + name);
  }
}
const version = fingerprint.digest('hex').slice(0, 12);
files.set('index.html', Buffer.from(files.get('index.html').toString().replaceAll('__ROSS_VERSION__', version)));
const manifest = { version, files: [], bundledLaws: catalog.laws.length };
for (const [name, content] of files) {
  const destination = resolve(output, name);
  if (!destination.startsWith(output + sep)) throw new Error('Unsafe release path');
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, content);
  manifest.files.push({ path: name, bytes: content.length, sha256: createHash('sha256').update(content).digest('hex') });
}
await writeFile(resolve(output, 'release.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ output, version, files: files.size, bundledLaws: catalog.laws.length }));
