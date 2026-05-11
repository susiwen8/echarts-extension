import assert from 'node:assert/strict';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { test } from 'vitest';

const root = path.resolve(import.meta.dirname, '..');
const packagesDir = path.join(root, 'packages');

test('extension implementation sources are TypeScript', () => {
  const offenders = [];

  for (const packageName of readdirSync(packagesDir)) {
    const packageDir = path.join(packagesDir, packageName);
    if (!statSync(packageDir).isDirectory()) continue;

    const indexJs = path.join(packageDir, 'index.js');
    if (exists(indexJs)) offenders.push(path.relative(root, indexJs));

    const sourceDir = path.join(packageDir, 'src');
    if (!exists(sourceDir)) continue;
    collectSourceJs(sourceDir, offenders);
  }

  assert.deepEqual(offenders, []);
});

function collectSourceJs(dir, offenders) {
  for (const entry of readdirSync(dir)) {
    const filePath = path.join(dir, entry);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      collectSourceJs(filePath, offenders);
    } else if (filePath.endsWith('.js')) {
      offenders.push(path.relative(root, filePath));
    }
  }
}

function exists(filePath) {
  try {
    statSync(filePath);
    return true;
  } catch {
    return false;
  }
}
