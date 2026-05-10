import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

import {
  flattenCirclePackingData,
  layoutCirclePacking,
  resolveCirclePackingLayout
} from '../src/layout.ts';

const portfolio = {
  name: 'Portfolio',
  children: [
    {
      name: 'Core',
      value: 120,
      children: [
        { name: 'Search', value: 54 },
        { name: 'Editor', value: 38 },
        { name: 'Storage', value: 28 }
      ]
    },
    {
      name: 'Growth',
      children: [
        { name: 'Campaigns', value: 32 },
        { name: 'Referrals', value: 22 },
        { name: 'Activation', value: 18 }
      ]
    },
    {
      name: 'Platform',
      children: [
        { name: 'API', value: 42 },
        { name: 'Billing', value: 24 }
      ]
    }
  ]
};

test('does not depend on external hierarchy layout packages', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );

  assert.equal(packageJson.dependencies?.['@antv/layout'], undefined);
  assert.equal(packageJson.dependencies?.d3, undefined);
  assert.equal(packageJson.dependencies?.['d3-hierarchy'], undefined);
});

test('computes deterministic nested circle packing with contained children', () => {
  const first = layoutCirclePacking(portfolio, {
    width: 640,
    height: 520,
    padding: 24,
    siblingGap: 2,
    nodePadding: 4,
    sort: false
  });
  const second = layoutCirclePacking(portfolio, {
    width: 640,
    height: 520,
    padding: 24,
    siblingGap: 2,
    nodePadding: 4,
    sort: false
  });

  assert.deepEqual(first, second);
  assert.equal(first.root.name, 'Portfolio');
  assert.equal(first.rootVisible, true);
  assert.equal(first.nodes.length, 12);

  const byName = new Map(first.nodes.map((node) => [node.name, node]));
  assert.ok(byName.get('Core').r > byName.get('Growth').r);
  assert.ok(byName.get('Search').r > byName.get('Storage').r);

  assertNodeWithinChart(first.root, first);
  first.nodes.forEach((node) => {
    assert.equal(Number.isFinite(node.x), true, `${node.name} x`);
    assert.equal(Number.isFinite(node.y), true, `${node.name} y`);
    assert.equal(Number.isFinite(node.r), true, `${node.name} radius`);
    if (!node.parentId) return;
    const parent = first.nodes.find((candidate) => candidate.id === node.parentId);
    assert.ok(parent, `${node.name} has parent`);
    assertNodeInsideParent(node, parent);
  });
  assertSiblingCirclesDoNotOverlap(first.nodes, 0.001);
});

test('supports hidden synthetic roots for array data', () => {
  const result = resolveCirclePackingLayout({
    data: [
      { name: 'A', value: 16 },
      { name: 'B', value: 9 },
      { name: 'C', value: 4 }
    ],
    width: 360,
    height: 300,
    padding: 10,
    rootVisible: false,
    sort: false
  });

  assert.equal(result.root.synthetic, true);
  assert.equal(result.rootVisible, false);
  assert.deepEqual(result.nodes.map((node) => node.name), ['A', 'B', 'C']);
  result.nodes.forEach((node) => {
    assert.ok(node.parentId === result.root.id, `${node.name} stays under hidden root`);
    assertNodeWithinChart(node, result);
  });
  assertSiblingCirclesDoNotOverlap(result.nodes, 0.001);
});

test('resolves layout aliases and flattened raw data order', () => {
  const result = resolveCirclePackingLayout({
    layout: {
      width: 500,
      height: 420,
      valueField: 'metrics.size',
      childrenField: 'items',
      nameField: 'label',
      sort: 'name'
    },
    data: {
      label: 'Root',
      items: [
        {
          label: 'Beta',
          metrics: { size: 7 },
          items: [{ label: 'Beta leaf', metrics: { size: 7 } }]
        },
        {
          label: 'Alpha',
          metrics: { size: 9 },
          items: [{ label: 'Alpha leaf', metrics: { size: 9 } }]
        }
      ]
    }
  });

  assert.deepEqual(
    result.root.children.map((node) => node.name),
    ['Alpha', 'Beta']
  );
  assert.deepEqual(
    result.nodes.map((node) => node.name),
    ['Root', 'Alpha', 'Alpha leaf', 'Beta', 'Beta leaf']
  );
  assert.deepEqual(
    flattenCirclePackingData(result.root.raw, {
      valueField: 'metrics.size',
      childrenField: 'items',
      nameField: 'label',
      sort: 'name'
    }).map((item) => item.label),
    ['Root', 'Alpha', 'Alpha leaf', 'Beta', 'Beta leaf']
  );
});

function assertNodeInsideParent(node, parent) {
  const distance = Math.hypot(node.x - parent.x, node.y - parent.y);
  assert.ok(
    distance + node.r <= parent.r + 0.001,
    `${node.name} is outside ${parent.name}`
  );
}

function assertNodeWithinChart(node, layout) {
  assert.ok(node.x - node.r >= -0.001, `${node.name} left bound`);
  assert.ok(node.x + node.r <= layout.width + 0.001, `${node.name} right bound`);
  assert.ok(node.y - node.r >= -0.001, `${node.name} top bound`);
  assert.ok(node.y + node.r <= layout.height + 0.001, `${node.name} bottom bound`);
}

function assertSiblingCirclesDoNotOverlap(nodes, gap) {
  const byParent = new Map();
  nodes.forEach((node) => {
    if (!node.parentId) return;
    const siblings = byParent.get(node.parentId) || [];
    siblings.push(node);
    byParent.set(node.parentId, siblings);
  });

  for (const siblings of byParent.values()) {
    for (let leftIndex = 0; leftIndex < siblings.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < siblings.length; rightIndex += 1) {
        const left = siblings[leftIndex];
        const right = siblings[rightIndex];
        const distance = Math.hypot(right.x - left.x, right.y - left.y);
        assert.ok(
          distance + 0.001 >= left.r + right.r + gap,
          `${left.name} overlaps ${right.name}`
        );
      }
    }
  }
}
