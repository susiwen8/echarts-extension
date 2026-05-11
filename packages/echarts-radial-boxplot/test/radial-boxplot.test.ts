import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

import * as echarts from 'echarts';
import 'echarts-radial-boxplot';

import {
  layoutRadialBoxplot,
  resolveRadialBoxplotLayout
} from '../src/layout.ts';

const continents = [
  { name: 'Oceania', min: 1, q1: 8, median: 13, q3: 21, max: 24 },
  { name: 'East Europe', min: 4, q1: 9, median: 12, q3: 15, max: 19 },
  { name: 'Australia', min: 8, q1: 13, median: 16, q3: 20, max: 26 },
  { name: 'South America', min: 7, q1: 11, median: 14, q3: 22, max: 28 }
];

test('does not depend on external layout packages', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );

  assert.equal(packageJson.dependencies?.['@antv/layout'], undefined);
  assert.equal(packageJson.dependencies?.d3, undefined);
});

test('computes deterministic radial boxplot geometry', () => {
  const first = layoutRadialBoxplot(continents, {
    width: 400,
    height: 400,
    padding: 20,
    innerRadius: '20%',
    outerRadius: '90%',
    categoryField: 'name',
    min: 0,
    max: 30,
    tickCount: 4,
    startAngle: 90,
    clockwise: true,
    boxWidth: 0.58,
    capWidth: 0.34
  });
  const second = layoutRadialBoxplot(continents, {
    width: 400,
    height: 400,
    padding: 20,
    innerRadius: '20%',
    outerRadius: '90%',
    categoryField: 'name',
    min: 0,
    max: 30,
    tickCount: 4,
    startAngle: 90,
    clockwise: true,
    boxWidth: 0.58,
    capWidth: 0.34
  });

  assert.deepEqual(first, second);
  assert.equal(first.centerX, 200);
  assert.equal(first.centerY, 200);
  assert.equal(first.innerRadius, 36);
  assert.equal(first.outerRadius, 162);
  assert.deepEqual(first.radialTicks.map((tick) => tick.value), [0, 10, 20, 30]);
  assert.deepEqual(first.boxes.map((box) => box.name), ['Oceania', 'East Europe', 'Australia', 'South America']);

  const [oceania, eastEurope, australia, southAmerica] = first.boxes;
  assert.equal(Math.round(oceania.angle), 45);
  assert.equal(Math.round(oceania.axis.x1), 228);
  assert.equal(Math.round(oceania.axis.y1), 172);
  assert.equal(Math.round(oceania.axis.x2), 297);
  assert.equal(Math.round(oceania.axis.y2), 103);
  assert.equal(Math.round(first.angleLabels[0].rotation * 180 / Math.PI), -45);
  assert.equal(Math.round(first.angleLabels[1].rotation * 180 / Math.PI), 45);
  assert.ok(oceania.boxPath.includes('A '), 'box should use radial arcs');
  assert.ok(oceania.boxPath.endsWith('Z'), 'box sector should close');
  assert.ok(oceania.q1Radius < oceania.medianRadius);
  assert.ok(oceania.medianRadius < oceania.q3Radius);
  assert.ok(eastEurope.angle < oceania.angle);
  assert.ok(australia.angle < eastEurope.angle);
  assert.ok(southAmerica.angle < australia.angle);
});

test('supports array rows, dimensions, and explicit category order', () => {
  const result = resolveRadialBoxplotLayout({
    data: [
      ['South America', 7, 11, 14, 22, 28],
      ['Oceania', 1, 8, 13, 21, 24],
      ['Australia', 8, 13, 16, 20, 26],
      ['East Europe', 4, 9, 12, 15, 19]
    ],
    dimensions: ['region', 'low', 'q1', 'med', 'q3', 'high'],
    categoryField: 'region',
    minField: 'low',
    q1Field: 'q1',
    medianField: 'med',
    q3Field: 'q3',
    maxField: 'high',
    categories: ['Oceania', 'East Europe', 'Australia', 'South America'],
    width: 300,
    height: 300,
    min: 0,
    max: 30
  });

  assert.deepEqual(
    result.boxes.map((box) => box.name),
    ['Oceania', 'East Europe', 'Australia', 'South America']
  );
  assert.deepEqual(result.angleLabels.map((label) => label.name), ['Oceania', 'East Europe', 'Australia', 'South America']);
});

test('renders boxplots above axes and wires item tooltips', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 360,
    height: 360
  });

  try {
    chart.setOption({
      animation: false,
      series: [
        {
          type: 'radialBoxplot',
          data: continents,
          width: '100%',
          height: '100%',
          padding: 30,
          innerRadius: '20%',
          outerRadius: '90%',
          categoryField: 'name',
          min: 0,
          max: 30,
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
            splitLine: { show: false }
          },
          itemStyle: {
            color: '#2f83ed',
            borderColor: '#111111',
            borderWidth: 1
          },
          medianLineStyle: {
            color: '#111111',
            width: 1.5
          },
          whiskerLineStyle: {
            color: '#111111',
            width: 1
          }
        }
      ]
    });

    const svg = chart.renderToSVGString();
    const boxIndex = svg.indexOf('<path');
    const axisIndex = svg.indexOf('<circle');
    const medianIndex = svg.lastIndexOf('<path');

    assert.notEqual(boxIndex, -1, 'box sector paths should render');
    assert.notEqual(axisIndex, -1, 'radial axis split circles should render');
    assert.ok(axisIndex < boxIndex, 'box sectors should render above the axes');
    assert.ok(axisIndex < medianIndex, 'median arcs should render above axes');

    const data = chart.getModel().getSeriesByIndex(0).getData();
    assert.deepEqual(data.getItemLayout(0).map((value) => Math.round(value)), [233, 127]);
    assert.ok(data.getItemGraphicEl(0), 'data item should have a hit element');
  } finally {
    chart.dispose();
  }
});
