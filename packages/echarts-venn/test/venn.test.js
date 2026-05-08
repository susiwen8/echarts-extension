import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

import * as echarts from 'echarts/lib/echarts';
import { SVGRenderer } from 'echarts/renderers';

import {
  layoutBubbleVenn,
  layoutHollowVenn,
  resolveVennLayout
} from '../lib/src/layout.js';
import '../lib/index.js';

echarts.use([SVGRenderer]);

const hollowData = [
  { name: 'A', sets: ['A'], value: 100 },
  { name: 'B', sets: ['B'], value: 95 },
  { name: 'C', sets: ['C'], value: 82 },
  { name: 'A&B', sets: ['A', 'B'], value: 32 },
  { name: 'A&C', sets: ['A', 'C'], value: 24 },
  { name: 'B&C', sets: ['B', 'C'], value: 21 },
  { name: 'A&B&C', sets: ['A', 'B', 'C'], value: 12 }
];

const bubbleData = [
  { name: 'Radiohead', value: 100 },
  { name: 'Kanye West', value: 62 },
  { name: 'The Beatles', value: 56 },
  { name: 'Pink Floyd', value: 42 },
  { name: 'Muse', value: 30 },
  { name: 'Massive Attack', value: 21 }
];

test('does not depend on or import @antv/layout', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );

  assert.equal(packageJson.dependencies?.['@antv/layout'], undefined);
});

test('computes hollow three-set Venn circles and region labels', () => {
  const result = layoutHollowVenn(hollowData, {
    width: 600,
    height: 420,
    padding: 28
  });

  assert.equal(result.mode, 'hollow');
  assert.deepEqual(
    result.circles.map((circle) => circle.id),
    ['A', 'B', 'C']
  );
  assert.deepEqual(
    result.labels.map((label) => label.name),
    ['A', 'B', 'C', 'A&B', 'A&C', 'B&C', 'A&B&C']
  );

  result.circles.forEach((circle) => {
    assert.ok(Number.isFinite(circle.x), `${circle.id}.x is finite`);
    assert.ok(Number.isFinite(circle.y), `${circle.id}.y is finite`);
    assert.ok(circle.r > 0, `${circle.id}.r is positive`);
  });

  const center = result.labels.find((label) => label.name === 'A&B&C');
  const a = result.circles.find((circle) => circle.id === 'A');
  const b = result.circles.find((circle) => circle.id === 'B');
  const c = result.circles.find((circle) => circle.id === 'C');
  assert.ok(center.x > a.x && center.x < b.x);
  assert.ok(center.y > a.y && center.y < c.y);
});

test('computes deterministic bubble Venn circles sized by value inside the viewport', () => {
  const first = layoutBubbleVenn(bubbleData, {
    width: 640,
    height: 420,
    padding: 20,
    minRadius: 18,
    maxRadius: 86
  });
  const second = layoutBubbleVenn(bubbleData, {
    width: 640,
    height: 420,
    padding: 20,
    minRadius: 18,
    maxRadius: 86
  });

  assert.equal(first.mode, 'bubble');
  assert.deepEqual(first.circles, second.circles);
  assert.equal(first.circles.length, bubbleData.length);

  const byName = new Map(first.circles.map((circle) => [circle.name, circle]));
  assert.ok(byName.get('Radiohead').r > byName.get('Muse').r);
  first.circles.forEach((circle) => {
    assert.ok(circle.x - circle.r >= 20, `${circle.name} left bound`);
    assert.ok(circle.x + circle.r <= 620, `${circle.name} right bound`);
    assert.ok(circle.y - circle.r >= 20, `${circle.name} top bound`);
    assert.ok(circle.y + circle.r <= 400, `${circle.name} bottom bound`);
  });
});

test('resolves layout mode from Venn series options', () => {
  assert.equal(resolveVennLayout({ layout: 'bubble', data: bubbleData }).mode, 'bubble');
  assert.equal(resolveVennLayout({ data: hollowData }).mode, 'hollow');
});

test('highlights related hollow Venn circles when hovering an intersection label', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 600,
    height: 420
  });

  chart.setOption({
    animation: false,
    series: [{
      type: 'venn',
      layout: 'hollow',
      data: hollowData,
      label: {
        show: true
      }
    }]
  });

  const elements = collectVennElements(chart);
  const acLabel = elements.labels.find((label) => label.style.text === 'A&C');
  const baseCircleOpacities = elements.circles.map((circle) => circle.style.opacity);

  assert.ok(acLabel, 'A&C label should render');
  assert.equal(acLabel.silent, false);

  acLabel.trigger('mouseover', {
    target: acLabel
  });

  assert.equal(lastElementHoverOpacityTarget(elements.circles[0]), baseCircleOpacities[0]);
  assert.equal(lastElementHoverOpacityTarget(elements.circles[1]), 0.12);
  assert.equal(lastElementHoverOpacityTarget(elements.circles[2]), baseCircleOpacities[2]);
  assert.equal(lastElementHoverOpacityTarget(acLabel), 1);

  acLabel.trigger('mouseout', {
    target: acLabel
  });

  assert.deepEqual(elements.circles.map(lastElementHoverOpacityTarget), baseCircleOpacities);

  chart.dispose();
});

function collectVennElements(chart) {
  const view = chart._chartsViews.find((chartView) => chartView.type === 'venn');
  const circles = [];
  const labels = [];

  visitElement(view.group, (element) => {
    if (element.type === 'circle') circles.push(element);
    if (element.type === 'text') labels.push(element);
  });

  return {
    circles,
    labels
  };
}

function visitElement(element, visitor) {
  visitor(element);
  element.childrenRef?.().forEach((child) => visitElement(child, visitor));
}

function lastElementHoverOpacityTarget(element) {
  const animator = element.animators?.findLast((item) => item.scope === 'element-hover');
  return animator?._tracks?.opacity?.keyframes?.at(-1)?.value;
}
