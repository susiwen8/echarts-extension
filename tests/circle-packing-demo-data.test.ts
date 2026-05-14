import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'vitest';

function loadDemoData() {
  const window = {};
  runInNewContext(readFileSync(new URL('../docs/shared/demo-data.js', import.meta.url), 'utf8'), { window });
  return window.EChartsExtensionExamples.data;
}

test('circle packing standard demo uses a deeper hierarchy than the overview groups', () => {
  const data = loadDemoData();
  const maxDepth = measureDepth(data.circlePacking);

  assert.ok(maxDepth >= 5, `expected at least 5 hierarchy levels, got ${maxDepth}`);
});

test('circle packing standard demo gives every branch an explicit color', () => {
  const data = loadDemoData();
  const uncoloredBranches = collectUncoloredBranchNames(data.circlePacking);

  assert.deepEqual(uncoloredBranches, []);
});

function measureDepth(node: unknown): number {
  if (!node || typeof node !== 'object') return 0;
  const children = Array.isArray((node as { children?: unknown[] }).children)
    ? (node as { children: unknown[] }).children
    : [];
  if (!children.length) return 1;
  return 1 + Math.max(...children.map(measureDepth));
}

function collectUncoloredBranchNames(node: unknown): string[] {
  if (!node || typeof node !== 'object') return [];
  const record = node as {
    name?: unknown;
    children?: unknown[];
    itemStyle?: { color?: unknown };
  };
  const children = Array.isArray(record.children) ? record.children : [];
  const missing = children.length && typeof record.itemStyle?.color !== 'string'
    ? [String(record.name ?? 'unnamed')]
    : [];
  return missing.concat(children.flatMap(collectUncoloredBranchNames));
}
