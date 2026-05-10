import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

import {
  layoutBeeswarm,
  resolveBeeswarmLayout
} from '../src/layout.ts';

const samples = [
  { group: 'A', value: 5.0, name: 'A0' },
  { group: 'A', value: 5.1, name: 'A1' },
  { group: 'A', value: 5.2, name: 'A2' },
  { group: 'A', value: 6.8, name: 'A3' },
  { group: 'B', value: 4.4, name: 'B0' },
  { group: 'B', value: 4.5, name: 'B1' }
];

test('does not depend on external layout packages', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );

  assert.equal(packageJson.dependencies?.['@antv/layout'], undefined);
  assert.equal(packageJson.dependencies?.d3, undefined);
});

test('computes deterministic horizontal swarms that avoid point overlap', () => {
  const first = layoutBeeswarm(samples, {
    width: 420,
    height: 260,
    padding: { top: 30, right: 28, bottom: 50, left: 62 },
    categoryField: 'group',
    valueField: 'value',
    symbolSize: 18,
    collisionPadding: 2,
    min: 4,
    max: 7,
    tickCount: 4
  });
  const second = layoutBeeswarm(samples, {
    width: 420,
    height: 260,
    padding: { top: 30, right: 28, bottom: 50, left: 62 },
    categoryField: 'group',
    valueField: 'value',
    symbolSize: 18,
    collisionPadding: 2,
    min: 4,
    max: 7,
    tickCount: 4
  });

  assert.deepEqual(first, second);
  assert.equal(first.orient, 'horizontal');
  assert.deepEqual(first.categories, ['A', 'B']);
  assert.deepEqual(first.valueExtent, { min: 4, max: 7 });
  assert.deepEqual(first.ticks.map((tick) => tick.value), [4, 5, 6, 7]);
  assert.equal(first.points.length, 6);

  const aPoints = first.points.filter((point) => point.category === 'A');
  assert.ok(new Set(aPoints.map((point) => Math.round(point.y))).size > 1, 'dense values are spread across lanes');
  assertPointDistances(aPoints, 20);

  const firstPoint = first.points[0];
  assert.equal(firstPoint.name, 'A0');
  assert.equal(Math.round(firstPoint.x), 172);
  assert.equal(Math.round(firstPoint.centerY), 75);
  assert.ok(aPoints.some((point) => point.y !== point.centerY), 'overlap resolution moves dense points away from row center');
});

test('supports array rows, explicit category ordering, and vertical orientation', () => {
  const result = resolveBeeswarmLayout({
    data: [
      ['East', 12, 'Q1'],
      ['West', 18, 'Q2'],
      ['East', 13, 'Q3'],
      ['North', 'bad', 'skip']
    ],
    width: 300,
    height: 320,
    padding: 30,
    dimensions: ['region', 'score', 'name'],
    categoryField: 'region',
    valueField: 'score',
    nameField: 'name',
    categories: ['West', 'East', 'North'],
    orient: 'vertical',
    min: 10,
    max: 20,
    symbolSize: 14,
    tickCount: 3
  });

  assert.equal(result.orient, 'vertical');
  assert.deepEqual(result.categories, ['West', 'East']);
  assert.deepEqual(result.points.map((point) => point.name), ['Q2', 'Q1', 'Q3']);
  assert.deepEqual(result.ticks.map((tick) => tick.value), [10, 15, 20]);
  assert.equal(Math.round(result.points[0].centerX), 90);
  assert.equal(Math.round(result.points[1].centerX), 210);
  assert.ok(result.points.every((point) => point.x >= result.plot.left && point.x <= result.plot.right));
  assert.ok(result.points.every((point) => point.y >= result.plot.top && point.y <= result.plot.bottom));
});

function assertPointDistances(points, minDistance) {
  for (let leftIndex = 0; leftIndex < points.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < points.length; rightIndex += 1) {
      const left = points[leftIndex];
      const right = points[rightIndex];
      const distance = Math.hypot(left.x - right.x, left.y - right.y);
      assert.ok(
        distance >= minDistance - 1e-6,
        `${left.name} and ${right.name} are ${distance} apart`
      );
    }
  }
}
