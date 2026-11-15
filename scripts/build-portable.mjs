import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(process.argv[2] || '/tmp/ross-ai-delivery/ROSS_AI.html');
const read = path => readFile(resolve(root, path), 'utf8');
const catalog = JSON.parse(await read('data/catalog.json'));
const data = { 'data/catalog.json': catalog };
try { data['data/pending.json'] = JSON.parse(await read('data/pending.json')); } catch { /* optional */ }
for (const law of catalog.laws) {
  data['data/' + law.file] = JSON.parse(await read('data/' + law.file));
}
const script = source => '<script>' + source.replace(/<\/script/gi, '<\\/script') + '</script>';
let html = await read('index.html');
const css = await read('styles.css');
html = html.replace(/<link rel="stylesheet" href="styles\.css(?:\?[^"]*)?">/, () => '<style>' + css + '</style>');
const config = script(await read('config.js')) + '\n' + script('window.ROSS_EMBEDDED_DATA=' + JSON.stringify(data).replace(/</g, '\\u003c') + ';');
html = html.replace(/<script src="config\.js(?:\?[^"]*)?"><\/script>/, () => config);
for (const file of ['i18n.js', 'demo-data.js', 'process-tracker.js', 'app.js']) {
  const content = script(await read(file));
  html = html.replace(new RegExp('<script src="' + file.replace('.', '\\.') + '(?:\\?[^"]*)?"></script>'), () => content);
}
await mkdir(dirname(output), { recursive: true });
await writeFile(output, html);
console.log(JSON.stringify({ output, bytes: Buffer.byteLength(html), bundledLaws: catalog.laws.length }));
