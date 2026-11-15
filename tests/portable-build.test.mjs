import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';

test('portable bundle preserves literal JavaScript replacement patterns and compiles every inline script', () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'ross-portable-test-'));
  try {
    const output = resolve(directory, 'ROSS_AI.html');
    execFileSync(process.execPath, ['scripts/build-portable.mjs', output]);
    const html = readFileSync(output, 'utf8');
    assert.doesNotMatch(html, /<script\s+src=/);
    const scripts = Array.from(html.matchAll(/<script>([\s\S]*?)<\/script>/g), match => match[1]);
    assert.equal(scripts.length, 5);
    for (const script of scripts) assert.doesNotThrow(() => new vm.Script(script));
    const app = readFileSync('app.js', 'utf8').replace(/<\/script/gi, '<\\/script');
    assert.equal(scripts.at(-1), app);
    assert.doesNotMatch(html, /AQ\.[A-Za-z0-9_-]{25,}|AIza[A-Za-z0-9_-]{25,}/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
