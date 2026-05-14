import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

import * as echarts from 'echarts/lib/echarts';
import { getECData } from 'echarts/lib/util/innerStore.js';
import { SVGRenderer } from 'echarts/renderers';

import {
  layoutMosaic,
  resolveMosaicLayout
} from '../src/layout.ts';
import { __test__ as mosaicRenderer } from '../src/mosaic.ts';
import '../index.ts';

echarts.use([SVGRenderer]);

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

test('binds mosaic labels to tooltip data and formats tooltip content', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 500,
    height: 300
  });

  chart.setOption({
    animation: false,
    series: [{
      type: 'mosaic',
      xField: 'category',
      yField: 'segment',
      valueField: 'value',
      data: sampleData,
      label: {
        show: true
      },
      tooltip: {
        trigger: 'item'
      }
    }]
  });

  const elements = collectMosaicElements(chart);
  const northALabel = elements.labels.find((label) => label.style.text === 'North / A');
  const seriesModel = chart.getModel().getSeriesByIndex(0);

  assert.ok(northALabel, 'North / A label should render');
  assert.equal(getECData(northALabel).dataIndex, 0);

  const tooltip = seriesModel.formatTooltip(0);
  assert.equal(tooltip.header, 'North / A');
  assert.deepEqual(
    tooltip.blocks.map((block) => [block.name, block.value]),
    [
      ['value', 30],
      ['Overall', '30%'],
      ['Within North', '75%']
    ]
  );

  chart.dispose();
});

test('formats mosaic tooltip fallback cases without visible cells', () => {
  const emptyChart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 320,
    height: 220
  });

  emptyChart.setOption({
    animation: false,
    series: [{
      type: 'mosaic',
      data: []
    }]
  });

  const emptyTooltip = emptyChart.getModel().getSeriesByIndex(0).formatTooltip(2);
  assert.equal(emptyTooltip.header, 'Item 3');
  assert.deepEqual(emptyTooltip.blocks, []);
  emptyChart.dispose();

  const sparseChart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 320,
    height: 220
  });

  sparseChart.setOption({
    animation: false,
    series: [{
      type: 'mosaic',
      dimensions: ['category', 'segment', 'users'],
      xField: 'category',
      yField: 'segment',
      valueField: 2,
      data: [
        ['Skipped', 'Zero', 0],
        ['Kept', 'One', 1],
        ['Kept', 'Two', 2]
      ]
    }]
  });

  const fallbackTooltip = sparseChart.getModel().getSeriesByIndex(0).formatTooltip(0);
  assert.equal(fallbackTooltip.header, 'Kept / One');
  assert.deepEqual(
    fallbackTooltip.blocks.map((block) => [block.name, block.value]),
    [
      ['value', 1],
      ['Overall', '33.3%'],
      ['Within Kept', '33.3%']
    ]
  );

  sparseChart.dispose();
});

test('normalizes tooltip layout options when series option is absent', () => {
  const option = mosaicRenderer.readTooltipLayoutOption({
    get(key) {
      if (key === 'padding') return 8;
      return null;
    }
  });

  assert.deepEqual(option.data, []);
  assert.deepEqual(option.layoutOptions, {});
  assert.equal(option.padding, 8);
});

function collectMosaicElements(chart) {
  const view = chart._chartsViews.find((chartView) => chartView.type === 'mosaic');
  const rects = [];
  const labels = [];

  visitElement(view.group, (element) => {
    if (element.type === 'rect') rects.push(element);
    if (element.type === 'text') labels.push(element);
  });

  return {
    rects,
    labels
  };
}

function visitElement(element, visitor) {
  visitor(element);
  element.childrenRef?.().forEach((child) => visitElement(child, visitor));
}
