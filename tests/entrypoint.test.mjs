import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('HTML entrypoint references assets that exist', async () => {
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  const paths = [...html.matchAll(/(?:href|src)="\.\/([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(paths.sort(), ['assets/favicon.svg', 'src/app.js', 'src/style.css'].sort());
  for (const path of paths) await access(resolve(root, path));
});
