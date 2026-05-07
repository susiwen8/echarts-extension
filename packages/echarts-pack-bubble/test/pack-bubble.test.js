import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

import * as echarts from 'echarts/lib/echarts';
import { SVGRenderer } from 'echarts/renderers';

import '../lib/index.js';
import {
  createDemoPackBubbleData,
  layoutPackBubble,
  resolvePackBubbleLayout
} from '../lib/src/layout.js';

echarts.use([SVGRenderer]);

const sampleData = [
  { name: 'China', value: 1412, category: 'Asia' },
  { name: 'India', value: 1408, category: 'Asia' },
  { name: 'USA', value: 335, category: 'North America' },
  { name: 'Indonesia', value: 281, category: 'Asia' },
  { name: 'Brazil', value: 212, category: 'South America' },
  { name: 'Germany', value: 84, category: 'Europe' },
  { name: 'France', value: 68, category: 'Europe' },
  { name: 'Canada', value: 40, category: 'North America' }
];

test('does not depend on external layout packages', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );

  assert.equal(packageJson.dependencies?.['@antv/layout'], undefined);
  assert.equal(packageJson.dependencies?.d3, undefined);
  assert.equal(packageJson.dependencies?.['d3-hierarchy'], undefined);
});

test('computes deterministic packed circles sized by value', () => {
  const first = layoutPackBubble(sampleData, {
    width: 720,
    height: 520,
    padding: 24,
    gap: 3,
    minRadius: 8,
    maxRadius: 86
  });
  const second = layoutPackBubble(sampleData, {
    width: 720,
    height: 520,
    padding: 24,
    gap: 3,
    minRadius: 8,
    maxRadius: 86
  });

  assert.deepEqual(first.circles, second.circles);
  assert.equal(first.circles.length, sampleData.length);

  const byName = new Map(first.circles.map((circle) => [circle.name, circle]));
  assert.ok(byName.get('China').r > byName.get('USA').r);
  assert.ok(byName.get('USA').r > byName.get('Canada').r);
  assert.equal(byName.get('China').color, byName.get('India').color);
  assert.equal(byName.get('Germany').color, byName.get('France').color);

  first.circles.forEach((circle) => {
    assert.ok(circle.x - circle.r >= 24 - 0.001, `${circle.name} left bound`);
    assert.ok(circle.x + circle.r <= 696 + 0.001, `${circle.name} right bound`);
    assert.ok(circle.y - circle.r >= 24 - 0.001, `${circle.name} top bound`);
    assert.ok(circle.y + circle.r <= 496 + 0.001, `${circle.name} bottom bound`);
  });
  assertNoOverlap(first.circles, 0.001);
});

test('resolves layout options and field names', () => {
  const result = resolvePackBubbleLayout({
    width: 500,
    height: 360,
    layout: {
      gap: 4,
      valueField: 'metrics.population',
      nameField: 'country'
    },
    data: [
      { country: 'A', metrics: { population: 100 }, group: 'one' },
      { country: 'B', metrics: { population: 25 }, group: 'two' }
    ]
  });

  assert.deepEqual(result.circles.map((circle) => circle.name), ['A', 'B']);
  assert.ok(result.circles[0].r > result.circles[1].r);
  assertNoOverlap(result.circles, 3.99);
});

test('fast layout handles thousands of pack bubbles without overlap', () => {
  const data = Array.from({ length: 2000 }, (_, index) => ({
    name: `Item ${index}`,
    value: 5 + ((index * 31) % 1000),
    category: `G${index % 12}`
  }));
  const result = layoutPackBubble(data, {
    width: 960,
    height: 640,
    padding: 2,
    gap: 0,
    maxRadius: 18,
    fillRatio: 0.86,
    fast: true
  });

  assert.equal(result.circles.length, data.length);
  result.circles.forEach((circle) => {
    assert.ok(circle.x - circle.r >= 2 - 0.001, `${circle.name} left bound`);
    assert.ok(circle.x + circle.r <= 958 + 0.001, `${circle.name} right bound`);
    assert.ok(circle.y - circle.r >= 2 - 0.001, `${circle.name} top bound`);
    assert.ok(circle.y + circle.r <= 638 + 0.001, `${circle.name} bottom bound`);
  });
  assertNoOverlap(result.circles, 0);
});

test('demo data provides a dense many-country pack bubble fixture', () => {
  const data = createDemoPackBubbleData();
  const result = layoutPackBubble(data, {
    width: 960,
    height: 720,
    padding: 30,
    gap: 2,
    maxRadius: 76
  });

  assert.ok(data.length > 80);
  assert.equal(result.circles.length, data.length);
  assert.ok(result.circles.some((circle) => circle.name === 'China'));
  assert.ok(result.circles.some((circle) => circle.name === 'India'));
  assertNoOverlap(result.circles, 0.001);
});

test('does not apply hover transitions to pack bubbles that are still entering', () => {
  const chart = createSsrChart();

  chart.setOption({
    animation: true,
    series: [{
      type: 'packBubble',
      enterAnimation: {
        duration: 600,
        delay: 0,
        stagger: 120,
        easing: 'linear'
      },
      data: sampleData.slice(0, 4)
    }]
  });

  const circles = chart.getZr().storage.getDisplayList().filter((element) => element.type === 'circle');
  assert.equal(circles.length, 4);
  assert.equal(circles[1].style.opacity, 0);

  circles[0].trigger('mouseover', {
    target: circles[0]
  });

  assert.equal(hasElementHoverAnimator(circles[1]), false);
  assert.equal(circles[1].style.opacity, 0);

  circles[0].trigger('mouseout', {
    target: circles[0]
  });

  assert.equal(hasElementHoverAnimator(circles[1]), false);
  assert.equal(circles[1].style.opacity, 0);

  chart.dispose();
});

function assertNoOverlap(circles, gap) {
  for (let leftIndex = 0; leftIndex < circles.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < circles.length; rightIndex += 1) {
      const left = circles[leftIndex];
      const right = circles[rightIndex];
      const dx = right.x - left.x;
      const dy = right.y - left.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      assert.ok(
        distance + 0.001 >= left.r + right.r + gap,
        `${left.name} overlaps ${right.name}`
      );
    }
  }
}

function createSsrChart(width = 420, height = 320) {
  return echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width,
    height
  });
}

function hasElementHoverAnimator(element) {
  return element.animators?.some((animator) => animator.scope === 'element-hover') === true;
}
