import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

import * as echarts from 'echarts';
import '@echarts-extension/smith';

import {
  impedanceToGamma,
  layoutSmithChart,
  resolveSmithChartLayout
} from '../src/layout.ts';

const impedanceData = [
  { name: 'Matched', r: 1, x: 0 },
  { name: 'Inductive', r: 1, x: 1 },
  { name: 'Capacitive', r: 0.5, x: -0.75 }
];

test('does not depend on external layout packages', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );

  assert.equal(packageJson.dependencies?.['@antv/layout'], undefined);
  assert.equal(packageJson.dependencies?.d3, undefined);
});

test('maps normalized impedance to reflection coefficient coordinates', () => {
  assert.deepEqual(impedanceToGamma(1, 0), { real: 0, imag: 0, magnitude: 0, angle: 0 });

  const inductive = impedanceToGamma(1, 1);
  assert.equal(round(inductive.real), 0.2);
  assert.equal(round(inductive.imag), 0.4);
  assert.equal(round(inductive.magnitude), round(Math.sqrt(0.2)));

  const open = impedanceToGamma(Infinity, 0);
  assert.deepEqual(open, { real: 1, imag: 0, magnitude: 1, angle: 0 });

  const short = impedanceToGamma(0, 0);
  assert.deepEqual(short, { real: -1, imag: 0, magnitude: 1, angle: Math.PI });
});

test('computes deterministic Smith chart geometry inside the unit reflection circle', () => {
  const first = layoutSmithChart(impedanceData, {
    width: 500,
    height: 420,
    padding: 30,
    dataType: 'impedance',
    resistanceValues: [0, 0.5, 1, 2],
    reactanceValues: [-1, -0.5, 0.5, 1],
    showSwrCircle: true
  });
  const second = layoutSmithChart(impedanceData, {
    width: 500,
    height: 420,
    padding: 30,
    dataType: 'impedance',
    resistanceValues: [0, 0.5, 1, 2],
    reactanceValues: [-1, -0.5, 0.5, 1],
    showSwrCircle: true
  });

  assert.deepEqual(first, second);
  assert.equal(first.centerX, 250);
  assert.equal(first.centerY, 210);
  assert.equal(first.radius, 180);
  assert.equal(first.unitCircle.r, 180);
  assert.deepEqual(first.resistanceCircles.map((circle) => circle.value), [0, 0.5, 1, 2]);
  assert.equal(Math.round(first.resistanceCircles[0].labelX), 70);
  assert.equal(Math.round(first.resistanceCircles[2].labelX), 250);
  assert.equal(Math.round(first.resistanceCircles[3].labelX), 310);
  assert.deepEqual(first.reactanceArcs.map((arc) => arc.value), [-1, -0.5, 0.5, 1]);
  assert.equal(first.swrCircle?.magnitude, 0);

  const [matched, inductive, capacitive] = first.points;
  assert.equal(matched.name, 'Matched');
  assert.equal(round(matched.gamma.real), 0);
  assert.equal(round(matched.gamma.imag), 0);
  assert.equal(Math.round(matched.x), 250);
  assert.equal(Math.round(matched.y), 210);
  assert.equal(Math.round(inductive.x), 286);
  assert.equal(Math.round(inductive.y), 138);
  assert.equal(capacitive.y > first.centerY, true);

  first.points.forEach((point) => {
    assert.ok(point.gamma.magnitude <= 1, `${point.name} magnitude`);
    assert.ok(point.x >= first.centerX - first.radius, `${point.name} left bound`);
    assert.ok(point.x <= first.centerX + first.radius, `${point.name} right bound`);
    assert.ok(point.y >= first.centerY - first.radius, `${point.name} top bound`);
    assert.ok(point.y <= first.centerY + first.radius, `${point.name} bottom bound`);
  });
});

test('supports gamma data, array dimensions, and explicit reference impedance', () => {
  const result = resolveSmithChartLayout({
    data: [
      ['Load A', 75, 25],
      ['Load B', 25, -10]
    ],
    width: 360,
    height: 360,
    padding: 30,
    dimensions: ['name', 'resistance', 'reactance'],
    nameField: 'name',
    resistanceField: 'resistance',
    reactanceField: 'reactance',
    referenceImpedance: 50,
    resistanceValues: [0, 1],
    reactanceValues: [-1, 1]
  });

  assert.deepEqual(result.points.map((point) => point.name), ['Load A', 'Load B']);
  assert.equal(round(result.points[0].normalized.r), 1.5);
  assert.equal(round(result.points[0].normalized.x), 0.5);
  assert.equal(round(result.points[0].gamma.real), 0.230769);
  assert.equal(round(result.points[0].gamma.imag), 0.153846);
  assert.equal(result.resistanceCircles.length, 2);
  assert.equal(result.reactanceArcs.length, 2);

  const gamma = resolveSmithChartLayout({
    data: [
      { name: 'G', gamma: [0.25, -0.5] },
      { name: 'Outside', gammaReal: 2, gammaImag: 0 }
    ],
    dataType: 'gamma',
    width: 300,
    height: 300,
    padding: 20
  });

  assert.equal(gamma.points.length, 2);
  assert.equal(round(gamma.points[0].gamma.real), 0.25);
  assert.equal(round(gamma.points[0].gamma.imag), -0.5);
  assert.equal(gamma.points[1].gamma.magnitude, 1);
});

test('renders Smith grid and data points in SVG SSR mode', () => {
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
          type: 'smith',
          data: impedanceData,
          width: '100%',
          height: '100%',
          padding: 28,
          label: { show: true },
          lineStyle: { show: true, color: '#2563eb', width: 2 },
          itemStyle: { color: '#ef4444' },
          grid: {
            unitCircle: { lineStyle: { color: '#111111', width: 2 } },
            resistanceLine: { lineStyle: { color: '#777777' } },
            reactanceLine: { lineStyle: { color: '#999999' } }
          }
        }
      ]
    });

    const svg = chart.renderToSVGString();
    assert.match(svg, /<circle/);
    assert.match(svg, /<path/);
    assert.match(svg, /Matched/);
    assert.match(svg, /#ef4444|rgb\(239,68,68\)/);
  } finally {
    chart.dispose();
  }
});

function round(value) {
  return Math.round(value * 1000000) / 1000000;
}
