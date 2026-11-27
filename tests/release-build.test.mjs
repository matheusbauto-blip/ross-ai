import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

test('publication bundle stamps the version, resolves public assets and contains verified files only', () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'ross-release-test-'));
  try {
    execFileSync(process.execPath, ['scripts/build-release.mjs', directory]);
    const html = readFileSync(resolve(directory, 'index.html'), 'utf8');
    const release = JSON.parse(readFileSync(resolve(directory, 'release.json'), 'utf8'));
    assert.match(release.version, /^[a-f0-9]{12}$/);
    assert.doesNotMatch(html, /__ROSS_VERSION__/);
    for (const match of html.matchAll(/(?:src|href)="([^"?#]+)\?v=([a-f0-9]+)"/g)) {
      assert.equal(match[2], release.version);
      assert.ok(readFileSync(resolve(directory, match[1])).length > 0);
    }
    for (const file of release.files) {
      const content = readFileSync(resolve(directory, file.path));
      assert.equal(createHash('sha256').update(content).digest('hex'), file.sha256);
      assert.equal(content.length, file.bytes);
      assert.doesNotMatch(file.path, /(?:^|\/)(?:\.env|\.git|supabase|qa|tests|docs)(?:\/|$)/);
    }
    assert.ok(readdirSync(directory).includes('.nojekyll'));
    assert.equal(release.bundledLaws, 67);
    assert.ok(readFileSync(resolve(directory, 'process-tracker.js'), 'utf8').includes('window.ROSS_TRACKER'));
    const app = readFileSync(resolve(directory, 'app.js'), 'utf8');
    for (const feature of ['sources-disclosure', 'function conversationContext(', 'function plainAnswerQuestion(']) assert.ok(app.includes(feature));
    execFileSync(process.execPath, ['scripts/build-release.mjs', directory]);
    assert.equal(JSON.parse(readFileSync(resolve(directory, 'release.json'), 'utf8')).version, release.version);
    writeFileSync(resolve(directory, 'do-not-publish.txt'), 'keep this private');
    assert.throws(() => execFileSync(process.execPath, ['scripts/build-release.mjs', directory], { stdio: 'pipe' }), /Unexpected file in release directory/);
    assert.equal(readFileSync(resolve(directory, 'do-not-publish.txt'), 'utf8'), 'keep this private');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
