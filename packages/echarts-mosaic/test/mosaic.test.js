import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

import {
  layoutMosaic,
  resolveMosaicLayout
} from '../lib/src/layout.js';

const sampleData = [
  { category: 'North', segment: 'A', value: 30 },
  { category: 'North', segment: 'B', value: 10 },
  { category: 'South', segment: 'A', value: 20 },
  { category: 'South', segment: 'B', value: 40 }
];

test('does not depend on external layout packages', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );

  assert.equal(packageJson.dependencies?.['@antv/layout'], undefined);
  assert.equal(packageJson.dependencies?.d3, undefined);
});

test('computes deterministic mosaic tiles from two categorical dimensions', () => {
  const first = layoutMosaic(sampleData, {
    width: 500,
    height: 300,
    padding: 10,
    gap: 2,
    xField: 'category',
    yField: 'segment',
    valueField: 'value'
  });
  const second = layoutMosaic(sampleData, {
    width: 500,
    height: 300,
    padding: 10,
    gap: 2,
    xField: 'category',
    yField: 'segment',
    valueField: 'value'
  });

  assert.deepEqual(first, second);
  assert.equal(first.tiles.length, 4);
  assert.deepEqual(first.xCategories, ['North', 'South']);
  assert.deepEqual(first.yCategories, ['A', 'B']);

  const northA = first.tiles.find((tile) => tile.xCategory === 'North' && tile.yCategory === 'A');
  const northB = first.tiles.find((tile) => tile.xCategory === 'North' && tile.yCategory === 'B');
  const southA = first.tiles.find((tile) => tile.xCategory === 'South' && tile.yCategory === 'A');
  const southB = first.tiles.find((tile) => tile.xCategory === 'South' && tile.yCategory === 'B');

  assert.equal(Math.round(northA.width), 191);
  assert.equal(Math.round(southA.width), 287);
  assert.ok(northA.height > northB.height, 'North/A is taller than North/B');
  assert.ok(southB.height > southA.height, 'South/B is taller than South/A');
  assert.equal(Math.round(northA.width * northA.height + northB.width * northB.height), 53154);
  assert.equal(Math.round(southA.width * southA.height + southB.width * southB.height), 79730);

  first.tiles.forEach((tile) => {
    assert.ok(tile.x >= 10, `${tile.id} left bound`);
    assert.ok(tile.y >= 10, `${tile.id} top bound`);
    assert.ok(tile.x + tile.width <= 490, `${tile.id} right bound`);
    assert.ok(tile.y + tile.height <= 290, `${tile.id} bottom bound`);
    assert.ok(tile.width > 0, `${tile.id} width`);
    assert.ok(tile.height > 0, `${tile.id} height`);
  });
});

test('supports array rows and explicit category ordering', () => {
  const result = resolveMosaicLayout({
    data: [
      ['Desktop', 'Chrome', 50],
      ['Mobile', 'Chrome', 35],
      ['Desktop', 'Safari', 10],
      ['Mobile', 'Safari', 30]
    ],
    width: 420,
    height: 240,
    dimensions: ['device', 'browser', 'users'],
    xField: 'device',
    yField: 'browser',
    valueField: 'users',
    xCategories: ['Mobile', 'Desktop'],
    yCategories: ['Safari', 'Chrome'],
    sort: false
  });

  assert.deepEqual(result.xCategories, ['Mobile', 'Desktop']);
  assert.deepEqual(result.yCategories, ['Safari', 'Chrome']);
  assert.deepEqual(
    result.tiles.map((tile) => tile.name),
    ['Mobile / Safari', 'Mobile / Chrome', 'Desktop / Safari', 'Desktop / Chrome']
  );
});

test('drops non-positive values without breaking the viewport', () => {
  const result = layoutMosaic([
    { category: 'A', segment: 'One', value: 0 },
    { category: 'A', segment: 'Two', value: 10 },
    { category: 'B', segment: 'One', value: -3 },
    { category: 'B', segment: 'Two', value: 5 }
  ], {
    width: 300,
    height: 180,
    xField: 'category',
    yField: 'segment',
    valueField: 'value'
  });

  assert.equal(result.tiles.length, 2);
  assert.deepEqual(
    result.tiles.map((tile) => tile.id),
    ['A\x00Two', 'B\x00Two']
  );
  result.tiles.forEach((tile) => {
    assert.ok(Number.isFinite(tile.x));
    assert.ok(Number.isFinite(tile.y));
    assert.ok(Number.isFinite(tile.width));
    assert.ok(Number.isFinite(tile.height));
  });
});
