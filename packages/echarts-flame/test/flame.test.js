import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

import {
  layoutFlame,
  resolveFlameLayout
} from '../lib/src/layout.js';

const profile = {
  name: 'root',
  children: [
    {
      name: 'render',
      value: 30,
      children: [
        { name: 'diff', value: 18 },
        { name: 'patch', value: 12 }
      ]
    },
    { name: 'commit', value: 20 }
  ]
};

test('does not depend on external layout packages', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );

  assert.equal(packageJson.dependencies?.['@antv/layout'], undefined);
  assert.equal(packageJson.dependencies?.d3, undefined);
});

test('computes deterministic bottom-up flame rectangles', () => {
  const first = layoutFlame(profile, {
    width: 500,
    height: 260,
    padding: 10,
    gap: 2,
    sort: false
  });
  const second = layoutFlame(profile, {
    width: 500,
    height: 260,
    padding: 10,
    gap: 2,
    sort: false
  });

  assert.deepEqual(first, second);
  assert.equal(first.root.name, 'root');
  assert.equal(first.root.value, 50);
  assert.equal(first.nodes.length, 5);

  const root = first.nodes.find((node) => node.name === 'root');
  const render = first.nodes.find((node) => node.name === 'render');
  const commit = first.nodes.find((node) => node.name === 'commit');
  const diff = first.nodes.find((node) => node.name === 'diff');
  const patch = first.nodes.find((node) => node.name === 'patch');

  assert.equal(Math.round(root.x), 10);
  assert.equal(Math.round(root.width), 480);
  assert.ok(root.y > render.y, 'root is below its children by default');
  assert.equal(Math.round(render.width), 287);
  assert.equal(Math.round(commit.width), 191);
  assert.equal(Math.round(diff.width), 171);
  assert.equal(Math.round(patch.width), 114);
  assert.equal(Math.round(commit.x), 299);
  assert.equal(Math.round(patch.x), 183);
});

test('supports top-down orientation and hidden synthetic roots', () => {
  const result = resolveFlameLayout({
    data: [
      { name: 'parse', value: 10 },
      { name: 'execute', value: 30 }
    ],
    width: 400,
    height: 120,
    padding: 0,
    gap: 0,
    rootVisible: false,
    orient: 'down',
    sort: false
  });

  assert.equal(result.nodes.length, 2);
  assert.deepEqual(
    result.nodes.map((node) => node.name),
    ['parse', 'execute']
  );
  assert.equal(result.nodes[0].x, 0);
  assert.equal(result.nodes[0].y, 0);
  assert.equal(result.nodes[0].width, 100);
  assert.equal(result.nodes[1].x, 100);
  assert.equal(result.nodes[1].width, 300);
});

test('keeps parent self time as unfilled horizontal space', () => {
  const result = layoutFlame({
    name: 'root',
    value: 100,
    children: [
      { name: 'child-a', value: 30 },
      { name: 'child-b', value: 20 }
    ]
  }, {
    width: 500,
    height: 160,
    padding: 0,
    gap: 0,
    sort: false
  });

  const root = result.root;
  const childWidth = result.nodes
    .filter((node) => node.parentId === root.id)
    .reduce((sum, node) => sum + node.width, 0);

  assert.equal(root.width, 500);
  assert.equal(childWidth, 250);
});

test('lays out the AntV partition profile fixture', () => {
  const partitionData = JSON.parse(
    readFileSync(new URL('../../../tests/visual/fixtures/partition.json', import.meta.url), 'utf8')
  );
  const result = layoutFlame(partitionData, {
    width: 960,
    height: 620,
    padding: 4,
    gap: 0.8,
    rootVisible: false,
    sort: false
  });

  assert.equal(result.nodes.length, 535);
  assert.equal(result.nodes[0].name, 'root');
  assert.ok(result.nodes.some((node) => node.name === 'genunix`syscall_mstate'));
  result.nodes.forEach((node) => {
    assert.ok(Number.isFinite(node.x), `${node.name} x`);
    assert.ok(Number.isFinite(node.y), `${node.name} y`);
    assert.ok(Number.isFinite(node.width), `${node.name} width`);
    assert.ok(Number.isFinite(node.height), `${node.name} height`);
    assert.ok(node.x >= 4, `${node.name} left bound`);
    assert.ok(node.x + node.width <= 956.000001, `${node.name} right bound`);
  });
});
