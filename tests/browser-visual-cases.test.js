import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'vitest';

import { browserPerfCases } from './browser-perf/cases.js';
import { browserVisualCases } from './browser-visual/cases.js';

const root = path.resolve(import.meta.dirname, '..');

test('browser visual cases cover every gallery example link', () => {
  const gallery = readFileSync(path.join(root, 'examples/index.html'), 'utf8');
  const galleryHrefs = [...gallery.matchAll(/href="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((href) => href.startsWith('../packages/'))
    .map((href) => href.replace(/^\.\.\//, '/'))
    .sort();
  const standardHrefs = galleryHrefs.filter((href) => !href.endsWith('/large.html'));
  const visualPaths = browserVisualCases.map((visualCase) => visualCase.path).sort();

  assert.deepEqual(visualPaths, standardHrefs);
  assert.deepEqual(
    browserVisualCases.map((visualCase) => visualCase.name),
    [...new Set(browserVisualCases.map((visualCase) => visualCase.name))]
  );
});

test('browser perf cases cover every chart-level large data example link', () => {
  const largeHrefs = [...new Set(browserVisualCases.flatMap((visualCase) => {
    const filePath = examplePathToFile(visualCase.path);
    const content = readFileSync(filePath, 'utf8');

    return [...content.matchAll(/href="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((href) => href.endsWith('/large.html'))
      .map((href) => normalizeExampleHref(filePath, href));
  }))].sort();
  const perfPaths = browserPerfCases.map((perfCase) => perfCase.path).sort();

  assert.deepEqual(perfPaths, largeHrefs);
  assert.deepEqual(
    browserPerfCases.map((perfCase) => perfCase.name),
    [...new Set(browserPerfCases.map((perfCase) => perfCase.name))]
  );
});

test('browser perf runner can measure post-initial update performance', () => {
  const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
  const runner = readFileSync(path.join(root, 'tests/browser-perf/perf-runner.js'), 'utf8');

  assert.match(runner, /BROWSER_PERF_MEASURE_UPDATE/);
  assert.match(runner, /__ECHARTS_EXTENSION_PERF__\?\.run/);
  assert.match(runner, /initialResult/);
  assert.ok(packageJson.scripts['test:perf:browser:update']);
  assert.ok(packageJson.scripts['test:perf:browser:stress:update']);
});

function examplePathToFile(examplePath) {
  const localPath = path.join(root, examplePath.replace(/^\//, ''));
  return examplePath.endsWith('/') ? path.join(localPath, 'index.html') : localPath;
}

function normalizeExampleHref(filePath, href) {
  return `/${path.relative(root, path.resolve(path.dirname(filePath), href)).split(path.sep).join('/')}`;
}
