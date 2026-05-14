import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test, vi } from 'vitest';

import {
  createArcBezierShape,
  computeGraphLayout,
  createArcPath,
  installElementHover,
  installGraphLayout,
  normalizeGraphData,
  setElementHoverBaseStyle,
  setElementHoverDimOpacity,
  setElementHoverEntering
} from '../src/index.ts';

const sampleGraph = {
  nodes: [
    { id: 'root', value: 10 },
    { id: 'a', value: 4 },
    { id: 'b', value: 3 },
    { id: 'c', value: 2 },
    { id: 'd', value: 1 }
  ],
  edges: [
    { source: 'root', target: 'a' },
    { source: 'root', target: 'b' },
    { source: 'a', target: 'c' },
    { source: 'b', target: 'd' }
  ]
};

test('does not depend on or import @antv/layout', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );
  const layoutSource = readFileSync(
    new URL('../src/layouts.ts', import.meta.url),
    'utf8'
  );

  assert.equal(packageJson.dependencies?.['@antv/layout'], undefined);
  assert.equal(layoutSource.includes('@antv/layout'), false);
});

test('installs graph-style hover transitions for generic element groups', () => {
  const host = createFakeEChartsHost();
  const primary = new host.graphic.Circle({
    style: {
      fill: '#2454a6',
      opacity: 1
    }
  });
  const primaryLabel = new host.graphic.Text({
    style: {
      text: 'A',
      opacity: 1
    },
    silent: true
  });
  const secondary = new host.graphic.Circle({
    style: {
      fill: '#248f6a',
      opacity: 0
    }
  });

  const controller = installElementHover([
    {
      elements: [primary, primaryLabel]
    },
    {
      elements: [secondary]
    }
  ], {
    zrender: host.zr
  });

  assert.equal(primaryLabel.silent, false);
  secondary.style.opacity = 0.82;
  primaryLabel.trigger('mouseover');

  assert.equal(primary.style.opacity, 1);
  assert.equal(primaryLabel.style.opacity, 1);
  assert.equal(secondary.style.opacity, 0.12);
  assert.equal(lastAnimation(secondary)?.key, 'style');
  assert.equal(lastAnimation(secondary)?.duration, 180);
  assert.equal(lastAnimation(secondary)?.targets.at(-1)?.opacity, 0.12);

  host.zr.emit('mousemove', {
    target: null
  });

  assert.equal(secondary.style.opacity, 0.82);
  assert.equal(lastAnimation(secondary)?.targets.at(-1)?.opacity, 0.82);

  secondary.trigger('mouseover');
  controller?.dispose();

  assert.equal(primary.style.opacity, 1);
  assert.equal(primaryLabel.style.opacity, 1);
  assert.equal(secondary.style.opacity, 0.82);
});

test('keeps hover transitions away from elements that are still entering', () => {
  const host = createFakeEChartsHost();
  const active = new host.graphic.Circle({
    style: {
      fill: '#2454a6',
      opacity: 0.9
    }
  });
  const entering = new host.graphic.Circle({
    style: {
      fill: '#248f6a',
      opacity: 0
    }
  });

  setElementHoverBaseStyle(entering, {
    fill: '#248f6a',
    opacity: 0.82
  });
  setElementHoverEntering(entering, true);

  installElementHover([
    {
      elements: [active]
    },
    {
      elements: [entering]
    }
  ], {
    zrender: host.zr
  });

  active.trigger('mouseover');

  assert.equal(entering.style.opacity, 0);
  assert.equal(entering.animations.length, 0);

  active.trigger('mouseout');

  assert.equal(entering.style.opacity, 0);
  assert.equal(entering.animations.length, 0);

  setElementHoverEntering(entering, false);
  active.trigger('mouseover');

  assert.equal(entering.style.opacity, 0.12);

  active.trigger('mouseout');

  assert.equal(entering.style.opacity, 0.82);
});

test('refreshes explicit hover base styles after an earlier hover capture', () => {
  const host = createFakeEChartsHost();
  const active = new host.graphic.Circle({
    style: {
      opacity: 1
    }
  });
  const secondary = new host.graphic.Text({
    style: {
      text: 'Old',
      fontSize: 12,
      opacity: 1
    }
  });
  const unrelated = new host.graphic.Circle({
    style: {
      opacity: 1
    }
  });

  installElementHover([
    {
      elements: [active, secondary]
    },
    {
      elements: [unrelated]
    }
  ], {
    transitionDuration: 0,
    zrender: host.zr
  });

  active.trigger('mouseover');
  active.trigger('mouseout');

  secondary.setStyle({
    text: 'New',
    fontSize: 4,
    opacity: 1
  });
  setElementHoverBaseStyle(secondary, secondary.style);
  setElementHoverDimOpacity(secondary, 0.42);
  unrelated.trigger('mouseover');

  assert.equal(secondary.style.text, 'New');
  assert.equal(secondary.style.fontSize, 4);
  assert.equal(secondary.style.opacity, 0.42);

  setElementHoverDimOpacity(secondary, 2);
  assert.equal(secondary.__echartsExtensionHoverDimOpacity, 1);
  setElementHoverDimOpacity(secondary, -1);
  assert.equal(secondary.__echartsExtensionHoverDimOpacity, 0);
  setElementHoverDimOpacity(secondary, null);
  assert.equal(secondary.__echartsExtensionHoverDimOpacity, undefined);
  setElementHoverDimOpacity(null, 0.5);
});

test('can defer element hover while a chart-level gate is disabled', () => {
  const host = createFakeEChartsHost();
  let hoverEnabled = false;
  const active = new host.graphic.Circle({
    style: {
      opacity: 0.9
    }
  });
  const secondary = new host.graphic.Circle({
    style: {
      opacity: 0.82
    }
  });

  installElementHover([
    {
      elements: [active]
    },
    {
      elements: [secondary]
    }
  ], {
    enabled: () => hoverEnabled,
    zrender: host.zr
  });

  active.trigger('mouseover');

  assert.equal(active.style.opacity, 0.9);
  assert.equal(secondary.style.opacity, 0.82);
  assert.equal(secondary.animations.length, 0);

  hoverEnabled = true;
  active.trigger('mouseover');

  assert.equal(active.style.opacity, 0.9);
  assert.equal(secondary.style.opacity, 0.12);
});

test('element hover covers defensive inputs and non-animatable style fallbacks', () => {
  const host = createFakeEChartsHost();
  const active = createPlainHoverElement({ opacity: 1 });
  const secondary = createPlainHoverElement({ opacity: 0.8, stroke: '#111' });
  const attrOnly = createPlainHoverElement({ opacity: 0.6 });
  attrOnly.attr = function attr(keyOrObj, value) {
    if (keyOrObj === 'style') this.style = value;
    return this;
  };

  setElementHoverBaseStyle(null, { opacity: 0.5 });
  setElementHoverEntering(null);
  setElementHoverBaseStyle(secondary, null);
  setElementHoverEntering(secondary, false);

  assert.equal(installElementHover([{ elements: null }], { zrender: host.zr }), undefined);
  const controller = installElementHover([
    {
      elements: [active, attrOnly, active, null],
      triggerElements: [active]
    },
    {
      elements: [secondary],
      triggerElements: [secondary]
    }
  ], {
    dimOpacity: NaN,
    transitionDuration: 20,
    transitionEasing: '',
    zrender: host.zr
  });

  host.zr.emit('mousemove', { target: null });
  active.trigger('mouseover');
  assert.equal(secondary.style.opacity, 0.12);
  assert.equal(attrOnly.style.opacity, 0.6);

  host.zr.emit('mousemove', { target: { parent: active } });
  assert.equal(secondary.style.opacity, 0.12);
  host.zr.emit('mousemove', { target: null });
  assert.equal(secondary.style.opacity, 0.8);

  secondary.trigger('mouseover');
  controller?.dispose();
  assert.equal(active.style.opacity, 1);
});

test('element hover accepts callable trigger shims and custom easing', () => {
  const host = createFakeEChartsHost();
  const active = new host.graphic.Circle({
    style: {
      opacity: 1
    }
  });
  const secondary = new host.graphic.Circle({
    style: {
      opacity: 0.8
    }
  });
  const callableTrigger = function callableTrigger() {};

  installElementHover([
    {
      elements: [active],
      triggerElements: [active, callableTrigger]
    },
    {
      elements: [secondary],
      triggerElements: [secondary]
    }
  ], {
    transitionEasing: 'linear',
    zrender: host.zr
  });

  assert.equal(callableTrigger.cursor, 'pointer');
  assert.equal(callableTrigger.silent, false);

  active.trigger('mouseover');

  assert.equal(lastAnimation(secondary)?.easing, 'linear');
});

function expectFinitePositions(nodes) {
  assert.equal(nodes.length, sampleGraph.nodes.length);
  nodes.forEach((node) => {
    assert.equal(typeof node.id, 'string');
    assert.equal(Number.isFinite(node.x), true, `${node.id}.x is finite`);
    assert.equal(Number.isFinite(node.y), true, `${node.id}.y is finite`);
  });
}

function minNodeDistance(nodes) {
  let minDistance = Infinity;
  for (let leftIndex = 0; leftIndex < nodes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < nodes.length; rightIndex += 1) {
      const left = nodes[leftIndex];
      const right = nodes[rightIndex];
      minDistance = Math.min(minDistance, Math.hypot(left.x - right.x, left.y - right.y));
    }
  }
  return minDistance;
}

test('normalizes ECharts graph-like data and links', () => {
  const graph = normalizeGraphData({
    data: [{ name: 'alpha' }, { id: 'beta' }],
    links: [{ source: 'alpha', target: 'beta' }]
  });

  assert.deepEqual(
    graph.nodes.map((node) => node.id),
    ['alpha', 'beta']
  );
  assert.deepEqual(graph.edges, [
    { id: 'alpha-beta-0', source: 'alpha', target: 'beta' }
  ]);
});

test('computes radial layout with the first node as the default focus', async () => {
  const result = await computeGraphLayout('radial', sampleGraph, {
    center: [300, 240],
    unitRadius: 80,
    linkDistance: 120,
    nodeSize: 20
  });

  expectFinitePositions(result.nodes);
  const root = result.nodes.find((node) => node.id === 'root');
  assert.ok(Math.abs(root.x - 300) < 1);
  assert.ok(Math.abs(root.y - 240) < 1);
});

test('computes concentric layout with high-degree nodes near the center', async () => {
  const result = await computeGraphLayout('concentric', sampleGraph, {
    center: [200, 180],
    nodeSize: 24,
    sortBy: 'degree',
    preventOverlap: true
  });

  expectFinitePositions(result.nodes);
  const root = result.nodes.find((node) => node.id === 'root');
  const leaf = result.nodes.find((node) => node.id === 'c');
  const rootDistance = Math.hypot(root.x - 200, root.y - 180);
  const leafDistance = Math.hypot(leaf.x - 200, leaf.y - 180);
  assert.ok(rootDistance <= leafDistance);
});

test('computes mds layout and preserves graph ids', async () => {
  const result = await computeGraphLayout('mds', sampleGraph, {
    center: [160, 120],
    linkDistance: 90
  });

  expectFinitePositions(result.nodes);
  assert.deepEqual(
    result.nodes.map((node) => node.id).sort(),
    sampleGraph.nodes.map((node) => node.id).sort()
  );
});

test('computes grid layout with G6-style data fields and center-first sorting', async () => {
  const graph = {
    nodes: Array.from({ length: 8 }, (_, index) => ({
      id: String(index),
      data: {
        cluster: index < 4 ? 'a' : 'b',
        value: index === 7 ? 100 : index + 1
      }
    })),
    edges: [
      { source: '0', target: '1' },
      { source: '0', target: '2' },
      { source: '4', target: '7' }
    ]
  };

  const result = await computeGraphLayout('grid', graph, {
    width: 400,
    height: 240,
    cols: 4,
    rows: 2,
    nodeSize: 30,
    preventOverlap: true,
    sortBy: 'value'
  });

  assert.equal(result.nodes.length, graph.nodes.length);
  assert.deepEqual(result.edges, graph.edges.map((edge, index) => ({
    ...edge,
    id: `${edge.source}-${edge.target}-${index}`
  })));

  const xs = [...new Set(result.nodes.map((node) => node.x))].sort((left, right) => left - right);
  const ys = [...new Set(result.nodes.map((node) => node.y))].sort((left, right) => left - right);
  assert.deepEqual(xs, [50, 150, 250, 350]);
  assert.deepEqual(ys, [60, 180]);

  const highest = result.nodes.find((node) => node.id === '7');
  const lowest = result.nodes.find((node) => node.id === '0');
  assert.ok(Math.hypot(highest.x - 200, highest.y - 120) < Math.hypot(lowest.x - 200, lowest.y - 120));
});

test('grid layout honors explicit positions and expands cells to prevent overlap', async () => {
  const graph = {
    nodes: [
      { id: 'pinned', data: { cluster: 'a' } },
      { id: 'a', data: { cluster: 'a' } },
      { id: 'b', data: { cluster: 'b' } },
      { id: 'c', data: { cluster: 'b' } }
    ],
    edges: []
  };

  const result = await computeGraphLayout('grid', graph, {
    begin: [10, 20],
    width: 40,
    height: 40,
    cols: 2,
    rows: 2,
    nodeSize: 32,
    preventOverlap: true,
    preventOverlapPadding: 8,
    position: (node) => (node.id === 'pinned' ? { row: 1, col: 1 } : undefined),
    sortBy: 'data.cluster'
  });

  const pinned = result.nodes.find((node) => node.id === 'pinned');
  assert.deepEqual([pinned.x, pinned.y], [70, 80]);
  assert.ok(minNodeDistance(result.nodes) >= 39.9);
});

test('separates overlapping MDS nodes when preventOverlap is enabled', async () => {
  const denseGraph = {
    nodes: Array.from({ length: 12 }, (_, index) => ({
      id: String(index),
      value: index + 1
    })),
    edges: Array.from({ length: 11 }, (_, index) => ({
      source: '0',
      target: String(index + 1)
    }))
  };
  const result = await computeGraphLayout('mds', denseGraph, {
    center: [200, 120],
    linkDistance: 50,
    nodeSize: 32,
    nodeSpacing: 4,
    preventOverlap: true
  });

  assert.ok(
    minNodeDistance(result.nodes) >= 35.9,
    `minimum node distance ${minNodeDistance(result.nodes)} should prevent overlap`
  );
});

test('computes arc layout and SVG arc edge paths', async () => {
  const result = await computeGraphLayout('arc', sampleGraph, {
    center: [200, 100],
    nodeSep: 12,
    nodeSize: 20
  });

  expectFinitePositions(result.nodes);
  assert.deepEqual(
    result.nodes.map((node) => [node.id, node.x, node.y]),
    [
      ['root', 200, 36],
      ['a', 200, 68],
      ['b', 200, 100],
      ['c', 200, 132],
      ['d', 200, 164]
    ]
  );

  assert.deepEqual(createArcPath([0, 0], [0, 64]), [
    ['M', 0, 0],
    ['A', 32, 32, 0, 0, 1, 0, 64]
  ]);

  assert.deepEqual(createArcBezierShape([0, 20], [0, 84]), {
    x1: 0,
    y1: 20,
    x2: 0,
    y2: 84,
    cpx1: 32,
    cpy1: 20,
    cpx2: 32,
    cpy2: 84
  });
});

test('animates arc nodes and edge connections together to a shared end', () => {
  const host = createFakeEChartsHost();
  installGraphLayout(host, {
    chartType: 'arc',
    layoutType: 'arc'
  });

  const seriesModel = createFakeSeriesModel({
    ...sampleGraph,
    animation: true,
    symbolSize: 20,
    edgeStyle: {
      color: '#8a94a6',
      width: 1.5,
      opacity: 0.7
    },
    enterAnimation: {
      duration: 300,
      delay: 10,
      stagger: 20,
      easing: 'linear'
    },
    edgeAnimation: {
      duration: 320,
      delay: 12,
      stagger: 25,
      easing: 'linear'
    },
    layout: {
      nodeSep: 12,
      nodeSize: 20
    }
  });
  const view = { group: new host.graphic.Group() };

  host.chartView.render.call(view, seriesModel, null, createFakeApi());

  const edgeGroup = view.group.children[0];
  const nodeGroup = view.group.children[1];
  const edgeEls = edgeGroup.children;
  const firstNodeCircle = nodeGroup.children[0].children[0];
  const secondNodeCircle = nodeGroup.children[1].children[0];
  const graphEnterEnd = Math.max(
    10 + (sampleGraph.nodes.length - 1) * 20 + 300,
    12 + (sampleGraph.edges.length - 1) * 25 + 320
  );
  assert.equal(edgeEls.length, sampleGraph.edges.length);
  assert.equal(firstNodeCircle.animations[0].delayValue, 10);
  assert.equal(secondNodeCircle.animations[0].delayValue, 30);
  assert.equal(firstNodeCircle.animations[0].delayValue + firstNodeCircle.animations[0].duration, graphEnterEnd);
  assert.equal(secondNodeCircle.animations[0].delayValue + secondNodeCircle.animations[0].duration, graphEnterEnd);
  assert.equal(edgeEls[0].style.strokePercent, 0);
  assert.equal(edgeEls[0].animations[0].key, 'style');
  assert.equal(edgeEls[0].animations[0].duration, graphEnterEnd - 12);
  assert.equal(edgeEls[0].animations[0].delayValue, 12);
  assert.equal(edgeEls[0].animations[0].easing, 'linear');
  assert.deepEqual(edgeEls[0].animations[0].targets, [
    {
      strokePercent: 1
    }
  ]);
  assert.equal(edgeEls[1].animations[0].delayValue, 37);
  assert.equal(edgeEls[1].animations[0].delayValue + edgeEls[1].animations[0].duration, graphEnterEnd);
});

test('animates radial, concentric, grid, and mds nodes and edges together', () => {
  for (const layoutType of ['radial', 'concentric', 'grid', 'mds']) {
    const host = createFakeEChartsHost();
    installGraphLayout(host, {
      chartType: layoutType,
      layoutType
    });

    const seriesModel = createFakeSeriesModel({
      ...sampleGraph,
      animation: true,
      symbolSize: 20,
      enterAnimation: {
        duration: 300,
        delay: 10,
        stagger: 20,
        easing: 'linear'
      },
      layout: {
        nodeSize: 20,
        linkDistance: 70
      }
    });
    const view = { group: new host.graphic.Group() };

    host.chartView.render.call(view, seriesModel, null, createFakeApi());

    const edgeGroup = view.group.children[0];
    const nodeGroup = view.group.children[1];
    const firstNodeCircle = nodeGroup.children[0].children[0];
    const secondNodeCircle = nodeGroup.children[1].children[0];
    const firstEdge = edgeGroup.children[0];
    const graphEnterEnd = 10 + (sampleGraph.nodes.length - 1) * 20 + 300;

    assert.equal(firstNodeCircle.animations[0].delayValue, 10, `${layoutType} first node delay`);
    assert.equal(secondNodeCircle.animations[0].delayValue, 30, `${layoutType} second node delay`);
    assert.equal(firstNodeCircle.animations[0].delayValue + firstNodeCircle.animations[0].duration, graphEnterEnd, `${layoutType} first node end`);
    assert.equal(firstEdge.animations[0].delayValue, 10, `${layoutType} first edge delay`);
    assert.equal(firstEdge.animations[0].delayValue + firstEdge.animations[0].duration, graphEnterEnd, `${layoutType} first edge end`);
    assert.equal(firstEdge.shape.percent, 0, `${layoutType} edge draw starts hidden`);
  }
});

test('renders graph node sizes from data values by default', () => {
  const valueSizedGraph = {
    nodes: [
      { id: 'small', value: 1 },
      { id: 'medium', value: 4 },
      { id: 'large', value: 9 }
    ],
    edges: [
      { source: 'small', target: 'medium' },
      { source: 'medium', target: 'large' }
    ]
  };

  for (const layoutType of ['arc', 'radial', 'concentric', 'grid', 'mds']) {
    const host = createFakeEChartsHost();
    installGraphLayout(host, {
      chartType: layoutType,
      layoutType
    });

    const seriesModel = createFakeSeriesModel({
      ...valueSizedGraph,
      animation: false,
      layout: {
        linkDistance: 70,
        nodeSep: 12
      }
    });
    const view = { group: new host.graphic.Group() };

    host.chartView.render.call(view, seriesModel, null, createFakeApi());

    const nodeGroup = view.group.children[1];
    const radii = nodeGroup.children.map((itemGroup) => itemGroup.children[0].shape.r);

    assert.equal(radii.length, valueSizedGraph.nodes.length, `${layoutType} node count`);
    assert.ok(radii[0] < radii[1], `${layoutType} medium value is larger than small`);
    assert.ok(radii[1] < radii[2], `${layoutType} large value is larger than medium`);
  }
});

test('keeps graph labels fully outside nodes and away from each other', () => {
  const crowdedGraph = {
    nodes: [
      { id: 'alpha', name: 'Alpha', value: 10 },
      { id: 'beta', name: 'Beta', value: 8 },
      { id: 'gamma', name: 'Gamma', value: 6 },
      { id: 'delta', name: 'Delta', value: 4 }
    ],
    edges: [
      { source: 'alpha', target: 'beta' },
      { source: 'beta', target: 'gamma' },
      { source: 'gamma', target: 'delta' }
    ]
  };

  const host = createFakeEChartsHost();
  installGraphLayout(host, {
    chartType: 'arc',
    layoutType: 'arc'
  });

  const seriesModel = createFakeSeriesModel({
    ...crowdedGraph,
    animation: false,
    symbolSize: 36,
    label: {
      show: true,
      position: 'right',
      fontSize: 14
    },
    layout: {
      nodeSep: 0,
      nodeSize: 36
    }
  });
  const view = { group: new host.graphic.Group() };

  host.chartView.render.call(view, seriesModel, null, createFakeApi());

  const { circleBoxes, labelBoxes } = collectGraphRenderBoxes(view.group);

  assert.equal(labelBoxes.length, crowdedGraph.nodes.length);
  labelBoxes.forEach((labelBox, labelIndex) => {
    circleBoxes.forEach((circleBox, circleIndex) => {
      assert.equal(
        boxesIntersect(labelBox, circleBox),
        false,
        `label ${labelIndex} overlaps node ${circleIndex}`
      );
    });
  });

  for (let leftIndex = 0; leftIndex < labelBoxes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < labelBoxes.length; rightIndex += 1) {
      assert.equal(
        boxesIntersect(labelBoxes[leftIndex], labelBoxes[rightIndex]),
        false,
        `label ${leftIndex} overlaps label ${rightIndex}`
      );
    }
  }
});

test('places arc labels below nodes by default', () => {
  const labelGraph = {
    nodes: [
      { id: 'a', name: 'Alpha', value: 12 },
      { id: 'b', name: 'Beta', value: 3 }
    ],
    edges: [
      { source: 'a', target: 'b' }
    ]
  };
  const host = createFakeEChartsHost();
  installGraphLayout(host, {
    chartType: 'arc',
    layoutType: 'arc'
  });

  const seriesModel = createFakeSeriesModel({
    ...host.seriesModel.defaultOption,
    ...labelGraph,
    animation: false,
    symbolSize: 32,
    label: {
      ...host.seriesModel.defaultOption.label,
      show: true,
      fontSize: 12
    },
    layout: {
      nodeSep: 48,
      nodeSize: 32
    }
  });
  const view = { group: new host.graphic.Group() };

  host.chartView.render.call(view, seriesModel, null, createFakeApi());

  const nodeGroup = view.group.children[1];
  const labelGroup = view.group.children[2];
  const firstCircle = nodeGroup.children[0].children.find((element) => element.shape?.r != null);
  const firstExternalLabel = collectTextElements(labelGroup).find((element) => element.style.text === 'Alpha');

  assert.ok(firstExternalLabel.style.y > firstCircle.shape.cy + firstCircle.shape.r);
  assert.equal(firstExternalLabel.style.align, 'center');
  assert.equal(firstExternalLabel.style.verticalAlign, 'top');
});

test('renders node data values centered on graph circles across graph layouts', () => {
  const valueGraph = {
    nodes: [
      { id: 'a', name: 'Alpha', value: 12 },
      { id: 'b', name: 'Beta', value: 3 }
    ],
    edges: [
      { source: 'a', target: 'b' }
    ]
  };
  for (const layoutType of ['arc', 'radial', 'concentric', 'grid', 'mds']) {
    const host = createFakeEChartsHost();
    installGraphLayout(host, {
      chartType: layoutType,
      layoutType
    });

    const seriesModel = createFakeSeriesModel({
      ...valueGraph,
      animation: false,
      symbolSize: 32,
      label: {
        show: false
      },
      layout: {
        linkDistance: 70,
        nodeSep: 40,
        nodeSize: 32
      }
    });
    const view = { group: new host.graphic.Group() };

    host.chartView.render.call(view, seriesModel, null, createFakeApi());

    const nodeGroup = view.group.children[1];
    const firstCircle = nodeGroup.children[0].children.find((element) => element.shape?.r != null);
    const valueLabels = collectTextElements(view.group).filter((element) => ['12', '3'].includes(String(element.style.text)));

    assert.equal(valueLabels.length, 2, `${layoutType} value label count`);
    assert.deepEqual(
      valueLabels.map((element) => element.style.text),
      ['12', '3'],
      `${layoutType} value label text`
    );
    assert.equal(valueLabels[0].style.x, firstCircle.shape.cx, `${layoutType} value label x`);
    assert.equal(valueLabels[0].style.y, firstCircle.shape.cy, `${layoutType} value label y`);
    assert.equal(valueLabels[0].style.align, 'center', `${layoutType} value label align`);
    assert.equal(valueLabels[0].style.verticalAlign, 'middle', `${layoutType} value label verticalAlign`);
  }
});

test('applies fisheye magnifier to graph nodes and labels on pointer move', () => {
  const valueGraph = {
    nodes: [
      { id: 'a', name: 'Alpha', value: 12 },
      { id: 'b', name: 'Beta', value: 3 }
    ],
    edges: [
      { source: 'a', target: 'b' }
    ]
  };

  for (const layoutType of ['arc', 'radial', 'concentric', 'grid', 'mds']) {
    const host = createFakeEChartsHost();
    installGraphLayout(host, {
      chartType: layoutType,
      layoutType
    });

    const seriesModel = createFakeSeriesModel({
      ...valueGraph,
      animation: false,
      symbolSize: 32,
      label: {
        show: true,
        fontSize: 12
      },
      fisheye: {
        show: true,
        radius: 80,
        scale: 2,
        labelScale: 1.5
      },
      layout: {
        linkDistance: 70,
        nodeSep: 40,
        nodeSize: 32
      }
    });
    const view = { group: new host.graphic.Group() };

    host.chartView.render.call(view, seriesModel, null, createFakeApi(host));

    const edgeGroup = view.group.children[0];
    const nodeGroup = view.group.children[1];
    const labelGroup = view.group.children[2];
    const lens = view.group.children[3];
    const firstCircle = nodeGroup.children[0].children.find((element) => element.shape?.r != null);
    const valueLabel = nodeGroup.children[0].children.find((element) => element.style?.text === '12');
    const externalLabel = collectTextElements(labelGroup).find((element) => element.style.text === 'Alpha');
    const baseRadius = firstCircle.shape.r;
    const baseValueFontSize = valueLabel.style.fontSize;
    const baseLabelFontSize = externalLabel.style.fontSize;

    assert.equal(lens.ignore, true, `${layoutType} lens starts hidden`);

    host.zr.emit('mousemove', {
      offsetX: firstCircle.shape.cx,
      offsetY: firstCircle.shape.cy
    });

    assert.equal(lens.ignore, false, `${layoutType} lens appears`);
    assert.equal(lens.shape.cx, firstCircle.shape.cx, `${layoutType} lens follows pointer x`);
    assert.equal(lens.shape.cy, firstCircle.shape.cy, `${layoutType} lens follows pointer y`);
    assert.ok(firstCircle.shape.r > baseRadius, `${layoutType} node radius grows`);
    assert.ok(valueLabel.style.fontSize > baseValueFontSize, `${layoutType} value label grows`);
    assert.ok(externalLabel.style.fontSize > baseLabelFontSize, `${layoutType} external label grows`);
    if (layoutType === 'arc') {
      assert.ok(edgeGroup.children.length > valueGraph.edges.length, 'arc adds a fisheye edge overlay');
      assert.equal(edgeGroup.children[0].ignore, true, 'arc static edge hides while fisheye is active');
      assert.equal(edgeGroup.children.at(-1).ignore, false, 'arc fisheye edge appears');
    }

    host.zr.emit('globalout', {});

    assert.equal(lens.ignore, true, `${layoutType} lens hides`);
    assert.equal(firstCircle.shape.r, baseRadius, `${layoutType} node radius resets`);
    assert.equal(valueLabel.style.fontSize, baseValueFontSize, `${layoutType} value label resets`);
    assert.equal(externalLabel.style.fontSize, baseLabelFontSize, `${layoutType} external label resets`);
    if (layoutType === 'arc') {
      assert.equal(edgeGroup.children[0].ignore, false, 'arc static edge reappears');
      assert.equal(edgeGroup.children.at(-1).ignore, true, 'arc fisheye edge hides after reset');
    }
  }
});

test('can show an initial fisheye preview before pointer movement', () => {
  const host = createFakeEChartsHost();
  installGraphLayout(host, {
    chartType: 'arc',
    layoutType: 'arc'
  });

  const seriesModel = createFakeSeriesModel({
    nodes: [
      { id: 'a', name: 'Alpha', value: 12 },
      { id: 'b', name: 'Beta', value: 3 }
    ],
    edges: [
      { source: 'a', target: 'b' }
    ],
    animation: false,
    symbolSize: 32,
    label: {
      show: true,
      fontSize: 12
    },
    fisheye: {
      show: true,
      radius: 80,
      scale: 2,
      preview: true
    },
    layout: {
      nodeSep: 40,
      nodeSize: 32
    }
  });
  const view = { group: new host.graphic.Group() };

  host.chartView.render.call(view, seriesModel, null, createFakeApi(host));

  const nodeGroup = view.group.children[1];
  const lens = view.group.children[3];
  const nodeRadii = nodeGroup.children.map((itemGroup) => itemGroup.children[0].shape.r);

  assert.equal(lens.ignore, false);
  assert.equal(lens.shape.cx, 200);
  assert.equal(lens.shape.cy, 120);
  assert.ok(Math.max(...nodeRadii) > 16);
});

test('reapplies initial fisheye preview after enter animations finish', () => {
  vi.useFakeTimers();
  try {
    const host = createFakeEChartsHost();
    installGraphLayout(host, {
      chartType: 'arc',
      layoutType: 'arc'
    });

    const seriesModel = createFakeSeriesModel({
      nodes: [
        { id: 'a', name: 'Alpha', value: 12 },
        { id: 'b', name: 'Beta', value: 3 }
      ],
      edges: [
        { source: 'a', target: 'b' }
      ],
      animation: true,
      symbolSize: 32,
      enterAnimation: {
        duration: 100,
        stagger: 0
      },
      fisheye: {
        show: true,
        radius: 80,
        scale: 2,
        preview: true
      },
      layout: {
        nodeSep: 40,
        nodeSize: 32
      }
    });
    const view = { group: new host.graphic.Group() };

    host.chartView.render.call(view, seriesModel, null, createFakeApi(host));

    const nodeGroup = view.group.children[1];
    const firstCircle = nodeGroup.children[0].children[0];
    firstCircle.shape.r = 16;

    vi.advanceTimersByTime(101);

    assert.ok(firstCircle.shape.r > 16);
  } finally {
    vi.useRealTimers();
  }
});

test('updates fisheye options without redrawing graph elements', () => {
  const host = createFakeEChartsHost();
  installGraphLayout(host, {
    chartType: 'radial',
    layoutType: 'radial'
  });

  const baseOption = {
    ...sampleGraph,
    animation: false,
    symbolSize: 32,
    label: {
      show: true,
      fontSize: 12
    },
    fisheye: {
      show: true,
      radius: 80,
      scale: 2
    },
    layout: {
      linkDistance: 70,
      nodeSize: 32
    }
  };
  const view = { group: new host.graphic.Group() };
  const api = createFakeApi(host);

  host.chartView.render.call(view, createFakeSeriesModel(baseOption), null, api);

  const firstChildren = view.group.children.slice();
  const firstLens = view.group.children[3];
  const removeAllCalls = view.group.removeAllCalls;

  host.chartView.render.call(
    view,
    createFakeSeriesModel({
      ...baseOption,
      fisheye: {
        show: true,
        radius: 140,
        scale: 2.4
      }
    }),
    null,
    api
  );

  assert.equal(view.group.removeAllCalls, removeAllCalls);
  assert.deepEqual(view.group.children, firstChildren);
  assert.equal(view.group.children[3], firstLens);

  host.zr.emit('mousemove', {
    offsetX: 200,
    offsetY: 120
  });

  assert.equal(firstLens.ignore, false);
  assert.equal(firstLens.shape.r, 140);
});

test('highlights graph node adjacency and graph edges on hover', () => {
  const host = createFakeEChartsHost();
  installGraphLayout(host, {
    chartType: 'radial',
    layoutType: 'radial'
  });

  const seriesModel = createFakeSeriesModel({
    ...sampleGraph,
    animation: false,
    symbolSize: 28,
    label: {
      show: true,
      fontSize: 12
    },
    edgeStyle: {
      color: '#9aa4b2',
      width: 1.4,
      opacity: 0.5
    },
    layout: {
      linkDistance: 70,
      nodeSize: 28
    }
  });
  const view = { group: new host.graphic.Group() };

  host.chartView.render.call(view, seriesModel, null, createFakeApi(host));

  const edgeGroup = view.group.children[0];
  const nodeGroup = view.group.children[1];
  const labelGroup = view.group.children[2];
  const rootCircle = nodeGroup.children[0].children[0];
  const rootValueLabel = nodeGroup.children[0].children.find((element) => element.style?.text === '10');
  const firstNeighborCircle = nodeGroup.children[1].children[0];
  const unrelatedCircle = nodeGroup.children[3].children[0];
  const rootToAEdge = edgeGroup.children[0];
  const rootToBEdge = edgeGroup.children[1];
  const unrelatedEdge = edgeGroup.children[2];
  const rootLabel = collectTextElements(labelGroup).find((element) => element.style.text === 'root');
  const unrelatedLabel = collectTextElements(labelGroup).find((element) => element.style.text === 'c');

  rootCircle.trigger('mouseover');

  assert.equal(rootCircle.style.opacity, 1);
  assert.equal(firstNeighborCircle.style.opacity, 1);
  assert.ok(unrelatedCircle.style.opacity < 0.25);
  assert.equal(lastAnimation(unrelatedCircle)?.key, 'style');
  assert.equal(lastAnimation(unrelatedCircle)?.duration, 180);
  assert.equal(lastAnimation(unrelatedCircle)?.targets.at(-1)?.opacity, 0.12);
  assert.equal(rootLabel.style.opacity, 1);
  assert.ok(unrelatedLabel.style.opacity < 0.35);
  assert.equal(rootToAEdge.style.opacity, 0.96);
  assert.equal(rootToBEdge.style.opacity, 0.96);
  assert.equal(rootToAEdge.style.stroke, rootCircle.style.fill);
  assert.ok(rootToAEdge.style.lineWidth > 1.4);
  assert.ok(unrelatedEdge.style.opacity < 0.18);

  rootCircle.trigger('mouseout');

  assert.equal(rootCircle.style.opacity, 1);
  assert.equal(firstNeighborCircle.style.opacity, 1);
  assert.equal(unrelatedCircle.style.opacity, 1);
  assert.equal(lastAnimation(unrelatedCircle)?.key, 'style');
  assert.equal(lastAnimation(unrelatedCircle)?.duration, 180);
  assert.equal(lastAnimation(unrelatedCircle)?.targets.at(-1)?.opacity, 1);
  assert.equal(rootCircle.style.shadowBlur, undefined);
  assert.equal(rootToAEdge.style.opacity, 0.5);
  assert.equal(rootToAEdge.style.stroke, '#9aa4b2');
  assert.equal(rootToAEdge.style.lineWidth, 1.4);
  assert.equal(unrelatedLabel.style.opacity, undefined);

  rootValueLabel.trigger('mouseover');

  assert.equal(rootCircle.style.opacity, 1);
  assert.equal(firstNeighborCircle.style.opacity, 1);
  assert.ok(unrelatedCircle.style.opacity < 0.25);
  assert.equal(rootToAEdge.style.opacity, 0.96);
  assert.equal(rootToAEdge.style.stroke, rootCircle.style.fill);

  host.zr.emit('mousemove', {
    target: null,
    offsetX: 12,
    offsetY: 12
  });

  assert.equal(unrelatedCircle.style.opacity, 1);
  assert.equal(lastAnimation(unrelatedCircle)?.targets.at(-1)?.opacity, 1);
  assert.equal(rootCircle.style.shadowBlur, undefined);
  assert.equal(rootToAEdge.style.stroke, '#9aa4b2');

  rootValueLabel.trigger('mouseover');

  assert.equal(rootToAEdge.style.opacity, 0.96);

  rootValueLabel.trigger('mouseout');

  assert.equal(unrelatedCircle.style.opacity, 1);
  assert.equal(rootCircle.style.shadowBlur, undefined);
  assert.equal(rootToAEdge.style.stroke, '#9aa4b2');

  rootToAEdge.trigger('mouseover');

  assert.equal(rootToAEdge.style.stroke, '#1fb6e8');
  assert.ok(rootToAEdge.style.lineWidth >= 6);
  assert.equal(rootCircle.style.opacity, 1);
  assert.equal(firstNeighborCircle.style.opacity, 1);
  assert.ok(unrelatedCircle.style.opacity < 0.25);
  assert.ok(unrelatedEdge.style.opacity < 0.18);

  rootToAEdge.trigger('mouseout');

  assert.equal(rootToAEdge.style.stroke, '#9aa4b2');
  assert.equal(rootToAEdge.style.lineWidth, 1.4);
  assert.equal(unrelatedCircle.style.opacity, 1);
});

test('does not animate arc edge connections when chart animation is disabled', () => {
  const host = createFakeEChartsHost();
  installGraphLayout(host, {
    chartType: 'arc',
    layoutType: 'arc'
  });

  const seriesModel = createFakeSeriesModel({
    ...sampleGraph,
    animation: false,
    edgeAnimation: true,
    layout: {
      nodeSep: 12,
      nodeSize: 20
    }
  });
  const view = { group: new host.graphic.Group() };

  host.chartView.render.call(view, seriesModel, null, createFakeApi());

  const edgeGroup = view.group.children[0];
  const edgeEls = edgeGroup.children;
  assert.equal(edgeEls[0].style.strokePercent, undefined);
  assert.equal(edgeEls[0].animations.length, 0);
});

test('updates existing arc edge geometry when appended data reflows the layout', () => {
  const host = createFakeEChartsHost();
  installGraphLayout(host, {
    chartType: 'arc',
    layoutType: 'arc'
  });

  const view = { group: new host.graphic.Group() };
  const api = createFakeApi(host);
  const baseOption = {
    ...sampleGraph,
    animation: false,
    edgeAnimation: false,
    layout: {
      nodeSep: 12,
      nodeSize: 20
    }
  };

  host.chartView.render.call(view, createFakeSeriesModel(baseOption), null, api);

  const firstEdge = view.group.children[0].children[0];
  const initialGeometry = arcEdgeGeometry(firstEdge);

  host.chartView.render.call(
    view,
    createFakeSeriesModel({
      ...baseOption,
      nodes: [
        ...baseOption.nodes,
        { id: 'e', value: 1 }
      ],
      edges: [
        ...baseOption.edges,
        { source: 'd', target: 'e' }
      ]
    }),
    null,
    api
  );

  const updatedFirstEdge = view.group.children[0].children[0];
  const updatedGeometry = arcEdgeGeometry(updatedFirstEdge);

  assert.equal(updatedFirstEdge, firstEdge);
  assert.notDeepEqual(updatedGeometry, initialGeometry);
  assert.deepEqual(updatedGeometry, {
    cx: 200,
    cy: 56,
    r: 16,
    startAngle: -Math.PI / 2,
    endAngle: Math.PI / 2,
    clockwise: true
  });
});

function arcEdgeGeometry(element) {
  if (Number.isFinite(element.shape?.cx)) {
    return {
      cx: element.shape.cx,
      cy: element.shape.cy,
      r: element.shape.r,
      startAngle: element.shape.startAngle,
      endAngle: element.shape.endAngle,
      clockwise: element.shape.clockwise
    };
  }
  return {
    path: element.path
  };
}

function createFakeEChartsHost() {
  class Group {
    constructor(options = {}) {
      this.children = [];
      Object.assign(this, options);
    }

    add(element) {
      this.children.push(element);
    }

    removeAll() {
      this.removeAllCalls = (this.removeAllCalls || 0) + 1;
      this.children = [];
    }

    childrenRef() {
      return this.children;
    }
  }

  class Element {
    constructor(options = {}) {
      this.shape = options.shape || {};
      this.style = options.style || {};
      this.ignore = options.ignore;
      this.silent = options.silent;
      this.z2 = options.z2;
      this.animations = [];
      this.handlers = {};
    }

    on(eventName, handler) {
      if (!this.handlers[eventName]) this.handlers[eventName] = new Set();
      this.handlers[eventName].add(handler);
      return this;
    }

    trigger(eventName, payload = {}) {
      this.handlers[eventName]?.forEach((handler) => handler({
        target: this,
        ...payload
      }));
    }

    attr(keyOrObj, value) {
      if (typeof keyOrObj === 'string') {
        this[keyOrObj] = value;
      } else if (keyOrObj && typeof keyOrObj === 'object') {
        Object.assign(this, keyOrObj);
      }
      return this;
    }

    setShape(shape) {
      Object.assign(this.shape, shape);
      return this;
    }

    setStyle(style) {
      Object.assign(this.style, style);
      return this;
    }

    stopAnimation(scope) {
      this.animations = scope
        ? this.animations.filter((animation) => animation.scope !== scope)
        : [];
      return this;
    }

    animate(key, loop) {
      const target = this[key] || {};
      const animation = {
        key,
        loop,
        scope: undefined,
        targets: [],
        duration: undefined,
        delayValue: undefined,
        easing: undefined,
        doneCallbacks: [],
        when(duration, target) {
          this.duration = duration;
          this.targets.push(target);
          return this;
        },
        delay(value) {
          this.delayValue = value;
          return this;
        },
        done(callback) {
          this.doneCallbacks.push(callback);
          return this;
        },
        start(easing) {
          this.easing = easing;
          if (this.scope === 'graph-hover' || this.scope === 'element-hover') {
            Object.assign(target, this.targets.at(-1));
            this.doneCallbacks.forEach((callback) => callback());
          }
          return this;
        }
      };
      this.animations.push(animation);
      return animation;
    }
  }

  const zrHandlers = {};
  const zr = {
    on(eventName, handler) {
      if (!zrHandlers[eventName]) zrHandlers[eventName] = new Set();
      zrHandlers[eventName].add(handler);
    },
    off(eventName, handler) {
      zrHandlers[eventName]?.delete(handler);
    },
    emit(eventName, payload) {
      zrHandlers[eventName]?.forEach((handler) => handler(payload));
    }
  };

  const host = {
    zr,
    helper: {
      createDimensions() {
        return [];
      },
      getLayoutRect() {
        return {
          x: 0,
          y: 0,
          width: 400,
          height: 240
        };
      }
    },
    List: class {
      initData() {}
    },
    graphic: {
      Group,
      Arc: Element,
      Circle: Element,
      Line: Element,
      BezierCurve: Element,
      Text: Element,
      makePath(path, options) {
        const element = new Element(options);
        element.path = path;
        return element;
      }
    },
    number: {
      parsePercent(value, maxValue) {
        if (typeof value === 'string' && value.endsWith('%')) {
          return (Number(value.slice(0, -1)) / 100) * maxValue;
        }
        return Number(value);
      }
    },
    extendSeriesModel(option) {
      this.seriesModel = option;
    },
    extendChartView(option) {
      this.chartView = option;
    }
  };

  return host;
}

function createPlainHoverElement(style) {
  return {
    style: { ...style },
    handlers: {},
    on(eventName, handler) {
      if (!this.handlers[eventName]) this.handlers[eventName] = new Set();
      this.handlers[eventName].add(handler);
    },
    trigger(eventName, payload = {}) {
      this.handlers[eventName]?.forEach((handler) => handler({ target: this, ...payload }));
    },
    stopAnimation() {
      this.stopped = true;
    }
  };
}

function createFakeSeriesModel(option) {
  const data = {
    getItemModel(index) {
      return createFakeModel(option.nodes[index] || {});
    },
    getItemVisual(dataIndex, key) {
      if (key === 'style') return {};
      return undefined;
    },
    setItemLayout() {},
    setItemGraphicEl() {}
  };

  return {
    option,
    get(path) {
      return readPath(option, path);
    },
    getModel(path) {
      return createFakeModel(readPath(option, path));
    },
    getBoxLayoutParams() {
      return {};
    },
    getData() {
      return data;
    }
  };
}

function createFakeModel(option) {
  const source = option && typeof option === 'object' ? option : {};
  return {
    get(path) {
      return readPath(source, path);
    },
    getModel(path) {
      return createFakeModel(readPath(source, path));
    }
  };
}

function readPath(source, path) {
  if (Array.isArray(path)) {
    return path.reduce((value, key) => {
      if (value == null || typeof value !== 'object') return undefined;
      return value[key];
    }, source);
  }
  return source?.[path];
}

function createFakeApi(host) {
  return {
    getWidth() {
      return 400;
    },
    getHeight() {
      return 240;
    },
    getZr() {
      return host?.zr;
    }
  };
}

function collectGraphRenderBoxes(nodeGroup) {
  const circleBoxes = [];
  const labelBoxes = [];
  const labelGroup = nodeGroup.children?.[2] || nodeGroup;

  visitGraphicTree(nodeGroup, (element) => {
    if (element.shape?.r != null) {
      const { cx, cy, r } = element.shape;
      circleBoxes.push({
        x: cx - r,
        y: cy - r,
        width: r * 2,
        height: r * 2
      });
    }
  });

  visitGraphicTree(labelGroup, (element) => {
    if (element.style?.text != null) {
      labelBoxes.push(textBoxFromStyle(element.style));
    }
  });

  return { circleBoxes, labelBoxes };
}

function collectTextElements(root) {
  const textElements = [];
  visitGraphicTree(root, (element) => {
    if (element.style?.text != null) textElements.push(element);
  });
  return textElements;
}

function lastAnimation(element) {
  return element.animations[element.animations.length - 1];
}

function visitGraphicTree(element, visitor) {
  visitor(element);
  element.children?.forEach((child) => visitGraphicTree(child, visitor));
}

function textBoxFromStyle(style) {
  const fontSize = Number(style.fontSize) || 12;
  const lines = String(style.text).split('\n');
  const width = Math.max(...lines.map((line) => line.length), 1) * fontSize * 0.62;
  const height = lines.length * fontSize * 1.2;
  let x = Number(style.x) || 0;
  let y = Number(style.y) || 0;

  if (style.align === 'center') x -= width / 2;
  if (style.align === 'right') x -= width;
  if (style.verticalAlign === 'middle') y -= height / 2;
  if (style.verticalAlign === 'bottom') y -= height;

  return { x, y, width, height };
}

function boxesIntersect(left, right) {
  return left.x < right.x + right.width
    && left.x + left.width > right.x
    && left.y < right.y + right.height
    && left.y + left.height > right.y;
}
