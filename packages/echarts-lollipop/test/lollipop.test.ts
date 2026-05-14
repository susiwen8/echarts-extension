import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as echarts from 'echarts';
import { test } from 'vitest';

import { __test__ as rendererInternals } from '../src/lollipop.ts';
import {
  layoutLollipop,
  resolveLollipopLayout
} from '../src/layout.ts';

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

test('maps configured fields into ECharts data for tooltip hover values', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 480,
    height: 320
  });

  try {
    chart.setOption({
      series: [
        {
          type: 'lollipop',
          data: populationData,
          categoryField: 'country',
          valueField: 'population'
        }
      ]
    });

    const seriesModel = chart.getModel().getSeriesByIndex(0);
    const data = seriesModel.getData();

    assert.equal(data.getName(0), 'India');
    assert.equal(data.get('value', 0), 1441);
    assert.equal(data.getName(1), 'China');
    assert.equal(data.get('value', 1), 1425);
  } finally {
    chart.dispose();
  }
});

test('normalizes object and array rows for ECharts tooltip data', () => {
  assert.deepEqual(rendererInternals.createSeriesDataSource({
    data: [
      ['Loss', -20],
      ['Profit', 40]
    ],
    dimensions: ['metric', 'amount'],
    categoryField: 'metric',
    valueField: 'amount'
  }), [
    { name: 'Loss', value: -20 },
    { name: 'Profit', value: 40 }
  ]);

  assert.deepEqual(rendererInternals.createSeriesDataItem({
    name: 'Named point',
    value: 9
  }, 0, {}, undefined), {
    name: 'Named point',
    value: 9
  });

  assert.deepEqual(rendererInternals.createSeriesDataItem({
    label: 2024,
    total: '18',
    itemStyle: { color: '#123456' }
  }, 0, {}, undefined), {
    itemStyle: { color: '#123456' },
    label: 2024,
    name: '2024',
    total: '18',
    value: 18
  });

  assert.deepEqual(rendererInternals.createSeriesDataItem({}, 3, {}, undefined), {
    name: 'item-3',
    value: NaN
  });

  assert.equal(rendererInternals.readSeriesField(['A', 'B'], 1, undefined, 0, []), 'B');
  assert.equal(rendererInternals.readSeriesField(['Only'], 'missing', [], -1, []), undefined);
  assert.equal(rendererInternals.readSeriesField({ population: 1441 }, 'value', undefined, 0, ['population']), 1441);
  assert.equal(rendererInternals.readSeriesField({ population: 1441 }, 0, undefined, 0, ['population']), undefined);
  assert.deepEqual(rendererInternals.normalizeSeriesDimensions(['category', 1, 'value']), ['category', 'value']);
  assert.equal(rendererInternals.normalizeSeriesDimensions(null), undefined);
  assert.equal(rendererInternals.stringifySeriesName(7), '7');
  assert.equal(rendererInternals.stringifySeriesName(null), '');
  assert.equal(rendererInternals.finiteNumber('not-a-number', 5), 5);
});
