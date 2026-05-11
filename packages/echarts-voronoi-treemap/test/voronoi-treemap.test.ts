import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

import {
  flattenVoronoiTreemapData,
  layoutVoronoiTreemap,
  resolveVoronoiTreemapLayout
} from '../src/layout.ts';

const sampleHierarchy = {
  name: 'Portfolio',
  children: [
    {
      name: 'Core',
      children: [
        { name: 'Search', value: 48 },
        { name: 'Ads', value: 32 },
        { name: 'Maps', value: 20 }
      ]
    },
    {
      name: 'Growth',
      children: [
        { name: 'Cloud', value: 34 },
        { name: 'AI', value: 26 }
      ]
    },
    { name: 'Labs', value: 24 }
  ]
};

test('does not depend on external layout packages', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );

  assert.equal(packageJson.dependencies?.['@antv/layout'], undefined);
  assert.equal(packageJson.dependencies?.d3, undefined);
  assert.equal(packageJson.dependencies?.['d3-hierarchy'], undefined);
  assert.equal(packageJson.dependencies?.['d3-voronoi-treemap'], undefined);
});

test('computes deterministic weighted Voronoi treemap cells', () => {
  const first = layoutVoronoiTreemap(sampleHierarchy, {
    width: 640,
    height: 420,
    padding: 12,
    gap: 2,
    maxIteration: 18,
    sort: false
  });
  const second = layoutVoronoiTreemap(sampleHierarchy, {
    width: 640,
    height: 420,
    padding: 12,
    gap: 2,
    maxIteration: 18,
    sort: false
  });

  assert.deepEqual(first, second);
  assert.equal(first.root.name, 'Portfolio');
  assert.equal(first.root.value, 184);
  assert.equal(first.nodes.length, 9);

  const leaves = first.nodes.filter((node) => node.isLeaf);
  assert.deepEqual(leaves.map((node) => node.name), ['Search', 'Ads', 'Maps', 'Cloud', 'AI', 'Labs']);

  const byName = new Map(leaves.map((node) => [node.name, node]));
  assert.ok(byName.get('Search').area > byName.get('Ads').area);
  assert.ok(byName.get('Ads').area > byName.get('Maps').area);
  assert.ok(byName.get('Cloud').area > byName.get('AI').area);

  first.nodes.forEach((node) => {
    assert.ok(node.points.length >= 3, `${node.name} polygon`);
    assert.ok(Number.isFinite(node.centroidX), `${node.name} centroidX`);
    assert.ok(Number.isFinite(node.centroidY), `${node.name} centroidY`);
    node.points.forEach(([x, y]) => {
      assert.ok(x >= 12 - 0.001, `${node.name} left bound`);
      assert.ok(x <= 628 + 0.001, `${node.name} right bound`);
      assert.ok(y >= 12 - 0.001, `${node.name} top bound`);
      assert.ok(y <= 408 + 0.001, `${node.name} bottom bound`);
    });
  });
});

test('resolves layout options and array roots', () => {
  const result = resolveVoronoiTreemapLayout({
    data: [
      ['Alpha', 60],
      ['Beta', 30],
      ['Gamma', 10]
    ],
    dimensions: ['label', 'amount'],
    nameField: 'label',
    valueField: 'amount',
    layoutOptions: {
      width: 360,
      height: 240,
      padding: 8,
      gap: 0,
      rootVisible: false,
      sort: false
    }
  });

  assert.equal(result.width, 360);
  assert.equal(result.height, 240);
  assert.deepEqual(
    result.nodes.map((node) => node.name),
    ['Alpha', 'Beta', 'Gamma']
  );
  assert.ok(result.nodes[0].area > result.nodes[1].area);
  assert.ok(result.nodes[1].area > result.nodes[2].area);
});

test('flattens hierarchy for ECharts data binding in source order', () => {
  const flat = flattenVoronoiTreemapData(sampleHierarchy);

  assert.deepEqual(
    flat.map((item) => item.name),
    ['Portfolio', 'Core', 'Search', 'Ads', 'Maps', 'Growth', 'Cloud', 'AI', 'Labs']
  );
});
