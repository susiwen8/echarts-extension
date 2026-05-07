import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

import {
  layoutLollipop,
  resolveLollipopLayout
} from '../lib/src/layout.js';

const populationData = [
  { country: 'India', population: 1441 },
  { country: 'China', population: 1425 },
  { country: 'United States', population: 342 },
  { country: 'Indonesia', population: 278 }
];

test('does not depend on external layout packages', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );

  assert.equal(packageJson.dependencies?.['@antv/layout'], undefined);
  assert.equal(packageJson.dependencies?.d3, undefined);
});

test('computes deterministic vertical lollipop stems from a zero baseline', () => {
  const first = layoutLollipop(populationData, {
    width: 800,
    height: 460,
    padding: { top: 30, right: 36, bottom: 86, left: 92 },
    categoryField: 'country',
    valueField: 'population',
    baseline: 0,
    min: 0,
    max: 2000,
    tickCount: 5
  });
  const second = layoutLollipop(populationData, {
    width: 800,
    height: 460,
    padding: { top: 30, right: 36, bottom: 86, left: 92 },
    categoryField: 'country',
    valueField: 'population',
    baseline: 0,
    min: 0,
    max: 2000,
    tickCount: 5
  });

  assert.deepEqual(first, second);
  assert.equal(first.points.length, 4);
  assert.deepEqual(first.categories, ['India', 'China', 'United States', 'Indonesia']);
  assert.deepEqual(first.valueExtent, { min: 0, max: 2000 });
  assert.deepEqual(first.ticks.map((tick) => tick.value), [0, 500, 1000, 1500, 2000]);

  const [india, china, unitedStates, indonesia] = first.points;
  assert.equal(india.name, 'India');
  assert.equal(india.value, 1441);
  assert.equal(Math.round(india.x), 92);
  assert.equal(Math.round(china.x), 316);
  assert.equal(Math.round(unitedStates.x), 540);
  assert.equal(Math.round(indonesia.x), 764);
  assert.equal(Math.round(india.y), 126);
  assert.equal(Math.round(china.y), 129);
  assert.equal(Math.round(unitedStates.y), 315);
  assert.equal(Math.round(indonesia.y), 326);
  assert.equal(india.baseY, first.plot.bottom);
  assert.equal(india.baseX, india.x);
  assert.ok(india.y < india.baseY, 'positive value appears above the baseline');

  first.points.forEach((point) => {
    assert.ok(point.x >= first.plot.left, `${point.name} left bound`);
    assert.ok(point.x <= first.plot.right, `${point.name} right bound`);
    assert.ok(point.y >= first.plot.top, `${point.name} top bound`);
    assert.ok(point.y <= first.plot.bottom, `${point.name} bottom bound`);
    assert.ok(Number.isFinite(point.baseY), `${point.name} baseline`);
  });
});

test('supports array rows, explicit category ordering, and negative baselines', () => {
  const result = resolveLollipopLayout({
    data: [
      ['Profit', 40],
      ['Loss', -20],
      ['Flat', 0]
    ],
    width: 360,
    height: 260,
    padding: 30,
    dimensions: ['metric', 'amount'],
    categoryField: 'metric',
    valueField: 'amount',
    categories: ['Loss', 'Flat', 'Profit'],
    min: -40,
    max: 60,
    baseline: 0,
    tickCount: 6
  });

  assert.deepEqual(result.categories, ['Loss', 'Flat', 'Profit']);
  assert.deepEqual(result.points.map((point) => point.name), ['Loss', 'Flat', 'Profit']);
  assert.deepEqual(result.ticks.map((tick) => tick.value), [-40, -20, 0, 20, 40, 60]);

  const loss = result.points[0];
  const flat = result.points[1];
  const profit = result.points[2];
  assert.ok(loss.y > loss.baseY, 'negative value appears below the baseline');
  assert.equal(flat.y, flat.baseY);
  assert.ok(profit.y < profit.baseY, 'positive value appears above the baseline');
});
