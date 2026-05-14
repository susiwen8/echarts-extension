import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

import * as echarts from 'echarts/lib/echarts';
import { SVGRenderer } from 'echarts/renderers';

import '../src/circle-packing.ts';
import {
  flattenCirclePackingData,
  layoutCirclePacking,
  resolveCirclePackingLayout
} from '../src/layout.ts';

echarts.use([SVGRenderer]);

const portfolio = {
  name: 'Portfolio',
  children: [
    {
      name: 'Core',
      value: 120,
      children: [
        { name: 'Search', value: 54 },
        { name: 'Editor', value: 38 },
        { name: 'Storage', value: 28 }
      ]
    },
    {
      name: 'Growth',
      children: [
        { name: 'Campaigns', value: 32 },
        { name: 'Referrals', value: 22 },
        { name: 'Activation', value: 18 }
      ]
    },
    {
      name: 'Platform',
      children: [
        { name: 'API', value: 42 },
        { name: 'Billing', value: 24 }
      ]
    }
  ]
};

const productData = {
  name: 'root',
  children: [
    {
      name: 'Core Experience',
      value: 120,
      children: [
        { name: 'Sync', value: 18 },
        { name: 'Center Experience', value: 54 },
        { name: 'Search', value: 38 },
        { name: 'Other', value: 20 }
      ]
    },
    {
      name: 'Platform',
      children: [
        { name: 'API', value: 42 },
        { name: 'Billing', value: 24 }
      ]
    }
  ]
};

test('does not depend on external hierarchy layout packages', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );

  assert.equal(packageJson.dependencies?.['@antv/layout'], undefined);
  assert.equal(packageJson.dependencies?.d3, undefined);
  assert.equal(packageJson.dependencies?.['d3-hierarchy'], undefined);
});

test('computes deterministic nested circle packing with contained children', () => {
  const first = layoutCirclePacking(portfolio, {
    width: 640,
    height: 520,
    padding: 24,
    siblingGap: 2,
    nodePadding: 4,
    sort: false
  });
  const second = layoutCirclePacking(portfolio, {
    width: 640,
    height: 520,
    padding: 24,
    siblingGap: 2,
    nodePadding: 4,
    sort: false
  });

  assert.deepEqual(first, second);
  assert.equal(first.root.name, 'Portfolio');
  assert.equal(first.rootVisible, true);
  assert.equal(first.nodes.length, 12);

  const byName = new Map(first.nodes.map((node) => [node.name, node]));
  assert.ok(byName.get('Core').r > byName.get('Growth').r);
  assert.ok(byName.get('Search').r > byName.get('Storage').r);

  assertNodeWithinChart(first.root, first);
  first.nodes.forEach((node) => {
    assert.equal(Number.isFinite(node.x), true, `${node.name} x`);
    assert.equal(Number.isFinite(node.y), true, `${node.name} y`);
    assert.equal(Number.isFinite(node.r), true, `${node.name} radius`);
    if (!node.parentId) return;
    const parent = first.nodes.find((candidate) => candidate.id === node.parentId);
    assert.ok(parent, `${node.name} has parent`);
    assertNodeInsideParent(node, parent);
  });
  assertSiblingCirclesDoNotOverlap(first.nodes, 0.001);
});

test('supports hidden synthetic roots for array data', () => {
  const result = resolveCirclePackingLayout({
    data: [
      { name: 'A', value: 16 },
      { name: 'B', value: 9 },
      { name: 'C', value: 4 }
    ],
    width: 360,
    height: 300,
    padding: 10,
    rootVisible: false,
    sort: false
  });

  assert.equal(result.root.synthetic, true);
  assert.equal(result.rootVisible, false);
  assert.deepEqual(result.nodes.map((node) => node.name), ['A', 'B', 'C']);
  result.nodes.forEach((node) => {
    assert.ok(node.parentId === result.root.id, `${node.name} stays under hidden root`);
    assertNodeWithinChart(node, result);
  });
  assertSiblingCirclesDoNotOverlap(result.nodes, 0.001);
});

test('resolves layout aliases and flattened raw data order', () => {
  const result = resolveCirclePackingLayout({
    layout: {
      width: 500,
      height: 420,
      valueField: 'metrics.size',
      childrenField: 'items',
      nameField: 'label',
      sort: 'name'
    },
    data: {
      label: 'Root',
      items: [
        {
          label: 'Beta',
          metrics: { size: 7 },
          items: [{ label: 'Beta leaf', metrics: { size: 7 } }]
        },
        {
          label: 'Alpha',
          metrics: { size: 9 },
          items: [{ label: 'Alpha leaf', metrics: { size: 9 } }]
        }
      ]
    }
  });

  assert.deepEqual(
    result.root.children.map((node) => node.name),
    ['Alpha', 'Beta']
  );
  assert.deepEqual(
    result.nodes.map((node) => node.name),
    ['Root', 'Alpha', 'Alpha leaf', 'Beta', 'Beta leaf']
  );
  assert.deepEqual(
    flattenCirclePackingData(result.root.raw, {
      valueField: 'metrics.size',
      childrenField: 'items',
      nameField: 'label',
      sort: 'name'
    }).map((item) => item.label),
    ['Root', 'Alpha', 'Alpha leaf', 'Beta', 'Beta leaf']
  );
});

test('keeps descendant circles highlighted when hovering a parent circle', () => {
  const chart = createSsrChart();

  chart.setOption({
    animation: false,
    series: [{
      type: 'circlePacking',
      data: portfolio,
      sort: false,
      label: {
        show: true,
        minRadius: 0
      },
      itemStyle: {
        opacity: 0.88
      }
    }]
  });

  const circles = chart.getZr().storage.getDisplayList().filter((element) => element.type === 'circle');
  assert.equal(circles.length, 12);

  const core = circles[1];
  const platform = circles[9];
  const api = circles[10];
  const billing = circles[11];

  platform.trigger('mouseover', {
    target: platform
  });

  assert.equal(lastHoverTargetOpacity(platform), 0.88);
  assert.equal(lastHoverTargetOpacity(api), 0.88);
  assert.equal(lastHoverTargetOpacity(billing), 0.88);
  assert.equal(lastHoverTargetOpacity(core), 0.12);

  platform.trigger('mouseout', {
    target: platform
  });

  assert.equal(lastHoverTargetOpacity(api), 0.88);
  assert.equal(lastHoverTargetOpacity(billing), 0.88);
  assert.equal(lastHoverTargetOpacity(core), 0.88);

  chart.dispose();
});

test('places parent labels away from child circles', () => {
  const chart = createSsrChart();

  chart.setOption({
    animation: false,
    series: [{
      type: 'circlePacking',
      data: productData,
      sort: false,
      label: {
        show: true,
        minRadius: 0
      }
    }]
  });

  const circles = chart.getZr().storage.getDisplayList().filter((element) => element.type === 'circle');
  const parentLabel = collectTextElements(chart)
    .find((element) => element.style.text === 'Core Experience');
  assert.ok(parentLabel);

  const parentLabelBox = textBoxFromStyle(parentLabel.style);
  const childCircles = circles.slice(2, 6);
  childCircles.forEach((childCircle, childIndex) => {
    assert.equal(
      boxIntersectsCircle(parentLabelBox, childCircle.shape),
      false,
      `parent label overlaps child circle ${childIndex}`
    );
  });

  chart.dispose();
});

function assertNodeInsideParent(node, parent) {
  const distance = Math.hypot(node.x - parent.x, node.y - parent.y);
  assert.ok(
    distance + node.r <= parent.r + 0.001,
    `${node.name} is outside ${parent.name}`
  );
}

function createSsrChart(width = 640, height = 420) {
  return echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width,
    height
  });
}

function lastHoverTargetOpacity(element) {
  const animator = element.animators
    ?.filter((item) => item.scope === 'element-hover')
    .at(-1);
  return animator?._tracks?.opacity?.keyframes?.at(-1)?.value;
}

function collectTextElements(chart) {
  const elements = [];
  chart.getZr().storage.getRoots().forEach((root) => visitTextElements(root, elements));
  return elements;
}

function visitTextElements(element, elements) {
  if (element.style?.text != null) elements.push(element);
  element.children?.().forEach((child) => visitTextElements(child, elements));
}

function textBoxFromStyle(style) {
  const fontSize = Number(style.fontSize) || 12;
  const lineHeight = Number(style.lineHeight) || fontSize + 2;
  const lines = String(style.text).split('\n');
  const width = Math.max(...lines.map((line) => line.length), 1) * fontSize * 0.56;
  const height = lines.length * lineHeight;
  let x = Number(style.x) || 0;
  let y = Number(style.y) || 0;
  if (style.align === 'center') x -= width / 2;
  if (style.align === 'right') x -= width;
  if (style.verticalAlign === 'middle') y -= height / 2;
  if (style.verticalAlign === 'bottom') y -= height;
  return {
    x,
    y,
    width,
    height
  };
}

function boxIntersectsCircle(box, circle) {
  const closestX = Math.max(box.x, Math.min(circle.cx, box.x + box.width));
  const closestY = Math.max(box.y, Math.min(circle.cy, box.y + box.height));
  return Math.hypot(closestX - circle.cx, closestY - circle.cy) < circle.r;
}

function assertNodeWithinChart(node, layout) {
  assert.ok(node.x - node.r >= -0.001, `${node.name} left bound`);
  assert.ok(node.x + node.r <= layout.width + 0.001, `${node.name} right bound`);
  assert.ok(node.y - node.r >= -0.001, `${node.name} top bound`);
  assert.ok(node.y + node.r <= layout.height + 0.001, `${node.name} bottom bound`);
}

function assertSiblingCirclesDoNotOverlap(nodes, gap) {
  const byParent = new Map();
  nodes.forEach((node) => {
    if (!node.parentId) return;
    const siblings = byParent.get(node.parentId) || [];
    siblings.push(node);
    byParent.set(node.parentId, siblings);
  });

  for (const siblings of byParent.values()) {
    for (let leftIndex = 0; leftIndex < siblings.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < siblings.length; rightIndex += 1) {
        const left = siblings[leftIndex];
        const right = siblings[rightIndex];
        const distance = Math.hypot(right.x - left.x, right.y - left.y);
        assert.ok(
          distance + 0.001 >= left.r + right.r + gap,
          `${left.name} overlaps ${right.name}`
        );
      }
    }
  }
}
