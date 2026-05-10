import assert from 'node:assert/strict';
import { test } from 'vitest';

import {
  layoutVectorField,
  normalizeVectorFieldData,
  resolveVectorFieldLayout
} from '../src/layout.ts';

const windSample = [
  { longitude: 0.125, latitude: 45.125, u: -2.3278859, v: -2.0757618 },
  { longitude: 0.375, latitude: 45.125, u: -2.418542, v: -2.1568856 },
  { longitude: 0.125, latitude: 45.375, u: -2.1537428, v: -1.8844506 },
  { longitude: 0.375, latitude: 45.375, u: -2.2439163, v: -1.9845597 }
];

test('normalizes AntV wind object records into vector tuples', () => {
  const points = normalizeVectorFieldData(windSample);

  assert.equal(points.length, 4);
  assert.deepEqual(points[0].coord, [0.125, 45.125]);
  assert.equal(points[0].u, -2.3278859);
  assert.equal(points[0].v, -2.0757618);
  assert.equal(Number(points[0].magnitude.toFixed(4)), 3.1189);
});

test('lays out wind vectors with north-up coordinates and stable arrow geometry', () => {
  const layout = layoutVectorField(windSample, {
    width: 240,
    height: 160,
    padding: 20,
    minLength: 6,
    maxLength: 24,
    arrowHeadLength: 5,
    invertY: true
  });

  assert.deepEqual(layout.xExtent, [0.125, 0.375]);
  assert.deepEqual(layout.yExtent, [45.125, 45.375]);
  assert.equal(layout.items.length, 4);
  assert.equal(layout.items[0].x, 20);
  assert.equal(layout.items[0].y, 140);
  assert.ok(layout.items[0].endX < layout.items[0].startX, 'negative u points left');
  assert.ok(layout.items[0].endY > layout.items[0].startY, 'negative v points down when north is up');
  assert.equal(Number(layout.items[0].length.toFixed(2)), 23.1);
  assert.equal(Number(layout.items[0].headLeftX.toFixed(2)), 13.3);
  assert.equal(Number(layout.items[0].headRightY.toFixed(2)), 146.31);
});

test('resolves series-style options and filters unusable vectors', () => {
  const layout = resolveVectorFieldLayout({
    data: [
      [10, 50, 3, 4],
      { x: 12, y: 52, u: 'bad', v: 1 },
      { lng: 14, lat: 54, u: -1, v: 0 }
    ],
    width: 300,
    height: 180,
    layoutOptions: {
      xExtent: [8, 16],
      yExtent: [48, 56]
    },
    padding: 30,
    maxLength: 20
  });

  assert.equal(layout.items.length, 2);
  assert.deepEqual(layout.xExtent, [8, 16]);
  assert.deepEqual(layout.yExtent, [48, 56]);
  assert.deepEqual(
    layout.items.map((item) => item.dataIndex),
    [0, 2]
  );
});
