import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as echarts from 'echarts';
import { test } from 'vitest';

import '../index.ts';
import {
  createAlgorithmSortDataSource,
  createSortFrames,
  layoutAlgorithmSort,
  resolveAlgorithmSortLayout
} from '../src/layout.ts';

const values = [
  { name: 'A', value: 5 },
  { name: 'B', value: 2 },
  { name: 'C', value: 4 },
  { name: 'D', value: 1 },
  { name: 'E', value: 3 }
];

test('does not depend on external algorithm packages', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );

  assert.equal(packageJson.dependencies?.['@antv/layout'], undefined);
  assert.equal(packageJson.dependencies?.d3, undefined);
});

test('generates deterministic final frames for supported sorting algorithms', () => {
  const items = createAlgorithmSortDataSource({ data: values })
    .map((item, dataIndex) => ({
      id: String(item.name),
      name: String(item.name),
      value: Number(item.value),
      dataIndex,
      raw: item
    }));
  const algorithms = ['bubble', 'selection', 'insertion', 'merge', 'quick', 'heap'] as const;

  algorithms.forEach((algorithm) => {
    const first = createSortFrames(items, algorithm);
    const second = createSortFrames(items, algorithm);
    const final = first[first.length - 1];

    assert.deepEqual(first, second, `${algorithm} frames are deterministic`);
    assert.equal(final.kind, 'complete');
    assert.deepEqual(final.items.map((item) => item.value), [1, 2, 3, 4, 5], `${algorithm} sorts ascending`);
    assert.ok(final.comparisons > 0, `${algorithm} records comparisons`);
  });
});

test('supports descending order and clamps current steps', () => {
  const result = resolveAlgorithmSortLayout({
    data: values,
    algorithm: 'quick',
    order: 'descending',
    width: 500,
    height: 320,
    currentStep: 999
  });

  assert.equal(result.frame.kind, 'complete');
  assert.deepEqual(result.frame.items.map((item) => item.value), [5, 4, 3, 2, 1]);
  assert.equal(result.currentStep, result.maxStep);
  assert.equal(result.bars.length, values.length);
  result.bars.forEach((bar) => {
    assert.ok(bar.x >= result.plot.left - 1e-6, `${bar.name} left bound`);
    assert.ok(bar.x + bar.width <= result.plot.right + 1e-6, `${bar.name} right bound`);
    assert.ok(bar.y >= result.plot.top - 1e-6, `${bar.name} top bound`);
    assert.ok(bar.y + bar.height <= result.plot.bottom + 1e-6, `${bar.name} bottom bound`);
  });
});

test('normalizes number, array, and object rows into ECharts data', () => {
  assert.deepEqual(createAlgorithmSortDataSource({
    data: [4, 1, 3]
  }), [
    { name: 'Item 1', value: 4 },
    { name: 'Item 2', value: 1 },
    { name: 'Item 3', value: 3 }
  ]);

  assert.deepEqual(createAlgorithmSortDataSource({
    data: [
      ['Alpha', 8],
      ['Beta', 6]
    ],
    dimensions: ['label', 'score'],
    nameField: 'label',
    valueField: 'score'
  }), [
    { name: 'Alpha', value: 8 },
    { name: 'Beta', value: 6 }
  ]);

  assert.deepEqual(createAlgorithmSortDataSource({
    data: [
      { label: 'Gamma', amount: '7', itemStyle: { color: '#123456' } }
    ]
  }), [
    { label: 'Gamma', amount: '7', itemStyle: { color: '#123456' }, name: 'Gamma', value: 7 }
  ]);
});

test('maps configured fields into ECharts data for tooltip values', () => {
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
          type: 'algorithmSort',
          data: [
            { label: 'Gamma', amount: 7 },
            { label: 'Delta', amount: 3 }
          ],
          nameField: 'label',
          valueField: 'amount',
          currentStep: 1
        }
      ]
    });

    const seriesModel = chart.getModel().getSeriesByIndex(0);
    const data = seriesModel.getData();

    assert.equal(data.getName(0), 'Gamma');
    assert.equal(data.get('value', 0), 7);
    assert.equal(data.getName(1), 'Delta');
    assert.equal(data.get('value', 1), 3);
  } finally {
    chart.dispose();
  }
});

test('lays out a middle frame with highlighted active states', () => {
  const result = layoutAlgorithmSort(values, {
    width: 420,
    height: 280,
    algorithm: 'bubble',
    currentStep: 2,
    min: 0,
    max: 6,
    tickCount: 4
  });

  assert.equal(result.algorithm, 'bubble');
  assert.deepEqual(result.ticks.map((tick) => tick.value), [0, 2, 4, 6]);
  assert.ok(result.bars.some((bar) => bar.state === 'compare' || bar.state === 'swap'));
});

test('interpolates bar positions between compare and swap frames for fractional steps', () => {
  const data = [
    { id: 'high', name: 'High', value: 3 },
    { id: 'low', name: 'Low', value: 1 },
    { id: 'mid', name: 'Mid', value: 2 }
  ];
  const baseOptions = {
    width: 360,
    height: 240,
    algorithm: 'bubble' as const,
    min: 0,
    max: 4,
    tickCount: 3
  };
  const before = layoutAlgorithmSort(data, { ...baseOptions, currentStep: 1 });
  const during = layoutAlgorithmSort(data, { ...baseOptions, currentStep: 1.5 });
  const after = layoutAlgorithmSort(data, { ...baseOptions, currentStep: 2 });

  const highBefore = before.bars.find((bar) => bar.id === 'high');
  const highDuring = during.bars.find((bar) => bar.id === 'high');
  const highAfter = after.bars.find((bar) => bar.id === 'high');
  const lowBefore = before.bars.find((bar) => bar.id === 'low');
  const lowDuring = during.bars.find((bar) => bar.id === 'low');
  const lowAfter = after.bars.find((bar) => bar.id === 'low');

  assert.equal(before.frame.kind, 'compare');
  assert.equal(after.frame.kind, 'swap');
  assert.equal(during.currentStep, 1.5);
  assert.equal(highDuring?.state, 'swap');
  assert.equal(lowDuring?.state, 'swap');
  assert.ok(highBefore && highDuring && highAfter);
  assert.ok(lowBefore && lowDuring && lowAfter);
  assert.ok(highDuring.x > highBefore.x, 'the larger bar should move right during the swap');
  assert.ok(highDuring.x < highAfter.x, 'the larger bar should not jump directly to its final swap slot');
  assert.ok(lowDuring.x < lowBefore.x, 'the smaller bar should move left during the swap');
  assert.ok(lowDuring.x > lowAfter.x, 'the smaller bar should not jump directly to its final swap slot');
});
