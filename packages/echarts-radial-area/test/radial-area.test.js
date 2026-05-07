import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

import * as echarts from 'echarts';
import 'echarts-radial-area';

import {
  layoutRadialArea,
  resolveRadialAreaLayout
} from '../lib/src/layout.js';

const seasonalData = [
  { month: 'January', value: 50, min: 42, max: 64 },
  { month: 'April', value: 70, min: 58, max: 80 },
  { month: 'July', value: 60, min: 50, max: 74 },
  { month: 'October', value: 40, min: 34, max: 52 }
];

test('does not depend on external layout packages', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );

  assert.equal(packageJson.dependencies?.['@antv/layout'], undefined);
  assert.equal(packageJson.dependencies?.d3, undefined);
});

test('computes deterministic clockwise radial area geometry', () => {
  const first = layoutRadialArea(seasonalData, {
    width: 400,
    height: 400,
    padding: 20,
    innerRadius: '40%',
    outerRadius: '90%',
    angleField: 'month',
    angleType: 'category',
    valueField: 'value',
    minField: 'min',
    maxField: 'max',
    min: 20,
    max: 80,
    tickCount: 4,
    startAngle: 90,
    clockwise: true
  });
  const second = layoutRadialArea(seasonalData, {
    width: 400,
    height: 400,
    padding: 20,
    innerRadius: '40%',
    outerRadius: '90%',
    angleField: 'month',
    angleType: 'category',
    valueField: 'value',
    minField: 'min',
    maxField: 'max',
    min: 20,
    max: 80,
    tickCount: 4,
    startAngle: 90,
    clockwise: true
  });

  assert.deepEqual(first, second);
  assert.equal(first.centerX, 200);
  assert.equal(first.centerY, 200);
  assert.equal(first.innerRadius, 72);
  assert.equal(first.outerRadius, 162);
  assert.deepEqual(first.radialTicks.map((tick) => tick.value), [20, 40, 60, 80]);
  assert.deepEqual(first.points.map((point) => point.name), ['January', 'April', 'July', 'October']);

  const [january, april, july, october] = first.points;
  assert.equal(Math.round(january.x), 200);
  assert.equal(Math.round(january.y), 83);
  assert.equal(Math.round(april.x), 347);
  assert.equal(Math.round(april.y), 200);
  assert.equal(Math.round(july.x), 200);
  assert.equal(Math.round(july.y), 332);
  assert.equal(Math.round(october.x), 98);
  assert.equal(Math.round(october.y), 200);

  assert.equal(first.rangePolygon.length, 10);
  assert.ok(first.rangePolygon[0].radius > first.rangePolygon.at(-1).radius);
  first.rangePolygon.forEach((point) => {
    assert.ok(Number.isFinite(point.x), `${point.name} x`);
    assert.ok(Number.isFinite(point.y), `${point.name} y`);
    assert.ok(Number.isFinite(point.radius), `${point.name} radius`);
  });
});

test('closes the range band across the final-to-first category interval', () => {
  const result = layoutRadialArea(seasonalData, {
    width: 400,
    height: 400,
    padding: 20,
    innerRadius: '40%',
    outerRadius: '90%',
    angleField: 'month',
    angleType: 'category',
    valueField: 'value',
    minField: 'min',
    maxField: 'max',
    min: 20,
    max: 80,
    startAngle: 90,
    clockwise: true,
    closed: true
  });

  assert.equal(result.rangePolygon.length, 10);
  assert.equal(result.rangePolygon[4].name, 'January');
  assert.equal(result.rangePolygon[4].radius, result.rangePolygon[0].radius);
  assert.equal(result.rangePolygon[5].name, 'January');
  assert.equal(result.rangePolygon[5].radius, result.points[0].minRadius);
  assert.equal(result.rangePolygon[6].name, 'October');
  assert.equal(result.rangePolygon.at(-1).name, 'January');
});

test('renders the range area below axes and the line above axes', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 320,
    height: 320
  });

  try {
    chart.setOption({
      animation: false,
      series: [
        {
          type: 'radialArea',
          data: seasonalData,
          width: '100%',
          height: '100%',
          padding: 30,
          angleField: 'month',
          angleType: 'category',
          valueField: 'value',
          minField: 'min',
          maxField: 'max',
          min: 20,
          max: 80,
          radialAxis: {
            show: true,
            label: { show: false },
            splitLine: {
              show: true,
              lineStyle: {
                color: '#111111',
                width: 1,
                type: 'solid',
                opacity: 1
              }
            }
          },
          angleAxis: {
            show: true,
            label: { show: false },
            splitLine: {
              show: true,
              lineStyle: {
                color: '#222222',
                width: 1,
                type: 'solid',
                opacity: 1
              }
            }
          },
          rangeAreaStyle: {
            show: true,
            color: '#fedcba',
            opacity: 1
          },
          areaStyle: { show: false },
          lineStyle: {
            color: '#13579b',
            width: 2,
            opacity: 1
          },
          showSymbol: false
        }
      ]
    });

    const svg = chart.renderToSVGString();
    const rangeAreaIndex = svg.indexOf('<polygon');
    const radialAxisIndex = svg.indexOf('<circle');
    const lineIndex = svg.indexOf('<polyline');

    assert.notEqual(rangeAreaIndex, -1, 'range area polygon should render');
    assert.notEqual(radialAxisIndex, -1, 'radial axis split circles should render');
    assert.notEqual(lineIndex, -1, 'series line should render');
    assert.ok(rangeAreaIndex < radialAxisIndex, 'range area should render below the axes');
    assert.ok(radialAxisIndex < lineIndex, 'series line should render above the axes');
  } finally {
    chart.dispose();
  }
});

test('supports array rows, dimensions, and explicit category order', () => {
  const result = resolveRadialAreaLayout({
    data: [
      ['October', 40, 34, 52],
      ['January', 50, 42, 64],
      ['July', 60, 50, 74],
      ['April', 70, 58, 80]
    ],
    dimensions: ['month', 'mean', 'low', 'high'],
    angleField: 'month',
    angleType: 'category',
    valueField: 'mean',
    minField: 'low',
    maxField: 'high',
    categories: ['January', 'April', 'July', 'October'],
    width: 300,
    height: 300,
    min: 20,
    max: 80
  });

  assert.deepEqual(
    result.points.map((point) => point.name),
    ['January', 'April', 'July', 'October']
  );
  assert.deepEqual(result.angleLabels.map((label) => label.name), ['January', 'April', 'July', 'October']);
});

test('sorts temporal data by time and keeps empty ranges out of the band', () => {
  const result = resolveRadialAreaLayout({
    data: [
      { time: '2000-07-01', value: 55 },
      { time: '2000-01-01', value: 44, low: 36, high: 56 },
      { time: '2000-04-01', value: 62, low: 52, high: 71 }
    ],
    angleField: 'time',
    angleType: 'time',
    valueField: 'value',
    minField: 'low',
    maxField: 'high',
    width: 320,
    height: 320
  });

  assert.deepEqual(
    result.points.map((point) => point.name),
    ['2000-01-01', '2000-04-01', '2000-07-01']
  );
  assert.equal(result.rangePolygon.length, 4);
  assert.ok(result.valueExtent.min <= 36);
  assert.ok(result.valueExtent.max >= 71);
});
