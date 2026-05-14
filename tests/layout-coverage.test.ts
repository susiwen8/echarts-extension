import assert from 'node:assert/strict';
import { test } from 'vitest';

import {
  computeArcLayout,
  computeConcentricLayout,
  computeGraphLayout,
  computeGridLayout,
  computeMDSLayout,
  computeRadialLayout,
  createArcPath,
  createArcShape,
  normalizeGraphData,
  pathToString,
  runMDS
} from '@echarts-extension/layout-core';
import { __test__ as gridInternals } from '../packages/echarts-layout-core/src/grid-layout.ts';
import { __test__ as mdsInternals } from '../packages/echarts-layout-core/src/mds-layout.ts';
import { __test__ as radialLayoutInternals } from '../packages/echarts-layout-core/src/radial-layout.ts';
import {
  allPairsShortestPaths,
  buildLayoutGraph,
  createSorter,
  degreeMap,
  getNodeSize,
  replaceInfinity
} from '../packages/echarts-layout-core/src/graph-utils.ts';
import {
  __test__ as beeswarmInternals,
  layoutBeeswarm,
  resolveBeeswarmLayout
} from '../packages/echarts-beeswarm/src/layout.ts';
import {
  __test__ as circlePackingInternals,
  flattenCirclePackingData,
  layoutCirclePacking,
  resolveCirclePackingLayout
} from '../packages/echarts-circle-packing/src/layout.ts';
import { flattenFlameData, layoutFlame, resolveFlameLayout } from '../packages/echarts-flame/src/layout.ts';
import {
  __test__ as lollipopInternals,
  layoutLollipop,
  resolveLollipopLayout
} from '../packages/echarts-lollipop/src/layout.ts';
import {
  __test__ as mosaicInternals,
  layoutMosaic,
  resolveMosaicLayout
} from '../packages/echarts-mosaic/src/layout.ts';
import {
  __test__ as nestedCircleLayoutInternals,
  layoutNestedCircle,
  resolveNestedCircleLayout
} from '../packages/echarts-nested-circle/src/layout.ts';
import {
  __test__ as packBubbleLayoutInternals,
  layoutPackBubble,
  resolvePackBubbleLayout
} from '../packages/echarts-pack-bubble/src/layout.ts';
import {
  __test__ as radialAreaInternals,
  layoutRadialArea,
  resolveRadialAreaLayout
} from '../packages/echarts-radial-area/src/layout.ts';
import {
  __test__ as radialBoxplotInternals,
  layoutRadialBoxplot,
  resolveRadialBoxplotLayout
} from '../packages/echarts-radial-boxplot/src/layout.ts';
import {
  __test__ as spiralInternals,
  layoutSpiral,
  resolveSpiralLayout
} from '../packages/echarts-spiral/src/layout.ts';
import {
  __test__ as subwayLayoutInternals,
  layoutSubway,
  resolveSubwayLayout
} from '../packages/echarts-subway/src/layout.ts';
import {
  __test__ as sequenceLayoutInternals,
  collectSequenceMessageData,
  layoutSequenceDiagram,
  resolveSequenceDiagramLayout
} from '../packages/echarts-sequence-diagram/src/layout.ts';
import {
  __test__ as causeEffectInternals,
  collectCauseEffectData,
  layoutCauseEffect,
  resolveCauseEffectLayout
} from '../packages/echarts-cause-effect/src/layout.ts';
import {
  __test__ as routePathInternals,
  buildRoundedRoutePathShape,
  createRoutePathShape,
  createRoundedRoutePath
} from '../packages/echarts-subway/src/route-path.ts';
import {
  __test__ as routeSegmentInternals,
  resolveSharedSegmentOffsets,
  routeSegmentOffsetKey
} from '../packages/echarts-subway/src/route-segments.ts';
import {
  __test__ as sunriseLayoutInternals,
  layoutSunriseSunset,
  resolveSunriseSunsetLayout
} from '../packages/echarts-sunrise-sunset/src/layout.ts';
import {
  __test__ as vectorLayoutInternals,
  layoutVectorField,
  normalizeVectorFieldData,
  resolveVectorFieldLayout
} from '../packages/echarts-vector-field/src/layout.ts';
import {
  __test__ as vennLayoutInternals,
  layoutBubbleVenn,
  layoutHollowVenn,
  resolveVennLayout
} from '../packages/echarts-venn/src/layout.ts';
import {
  __test__ as voronoiInternals,
  flattenVoronoiTreemapData,
  layoutVoronoiTreemap,
  resolveVoronoiTreemapLayout
} from '../packages/echarts-voronoi-treemap/src/layout.ts';

const graph = {
  nodes: [
    { id: 'root', value: 10, row: 1, col: 1, size: 18 },
    { id: 'a', value: 7, row: 0, col: 0, size: [12, 20] },
    { id: 'b', value: 4 },
    { id: 'c', value: 1 }
  ],
  edges: [
    { source: 'root', target: 'a' },
    { source: 'root', target: 'b' },
    { source: 1, target: 2 },
    { source: 'missing', target: 'root' }
  ]
};

test('layout core covers defensive graph normalization and graph layout branches', () => {
  const normalized = normalizeGraphData({
    data: ['loose', { name: 'named' }, { id: 'explicit' }],
    links: [
      { source: 0, target: 1 },
      { source: 'named', target: 'explicit' },
      { source: null, target: 'explicit' }
    ]
  });

  assert.deepEqual(normalized.nodes.map((node) => node.id), ['0', 'named', 'explicit']);
  assert.equal(normalized.edges.length, 2);
  assert.deepEqual(normalizeGraphData({ nodes: null, data: null, edges: null, links: null }).nodes, []);
  assert.equal(normalizeGraphData({
    nodes: [{ id: 'a' }],
    edges: ['not-an-edge']
  }).edges.length, 0);
  assert.throws(() => computeGraphLayout('unknown', graph), /Unsupported graph layout/);
  assert.equal(computeArcLayout({ nodes: [{ id: 'solo' }], edges: [] }, {}).nodes[0].x, 0);
  assert.equal(computeArcLayout({ nodes: [{ id: 'solo' }], edges: [] }, { width: 100, height: 80 }).nodes[0].x, 50);
  assert.equal(computeArcLayout({
    nodes: [{ id: 'a' }, { id: 'b' }],
    edges: []
  }, {}).nodes[0].y, 0);
  assert.deepEqual(computeArcLayout({
    nodes: [{ id: 'a' }, { id: 'b' }],
    edges: []
  }, { orient: 'horizontal' }).nodes[0], {
    id: 'a',
    x: 0,
    y: 0
  });
  assert.deepEqual(computeArcLayout({
    nodes: [{ id: 'a' }, { id: 'b' }],
    edges: []
  }, { width: 120, height: 80, orient: 'horizontal' }).nodes.map((node) => [node.x, node.y]), [
    [40, 40],
    [80, 40]
  ]);
  assert.equal(pathToString(createArcPath([0, 0], [10, 0])), 'M 0 0 A 5 5 0 0 1 10 0');
  assert.equal(pathToString(createArcPath([10, 0], [0, 0])), 'M 10 0 A 5 5 0 0 0 0 0');
  assert.equal(pathToString(createArcPath([0, 0], [0, 10])), 'M 0 0 A 5 5 0 0 1 0 10');
  assert.equal(pathToString(createArcPath([0, 10], [0, 0])), 'M 0 10 A 5 5 0 0 0 0 0');
  assert.equal(createArcShape([10, 0], [0, 0]).clockwise, false);
  assert.equal(createArcShape([0, 0], [10, 0]).clockwise, true);
  assert.equal(createArcShape([0, 10], [0, 0]).clockwise, false);
  assert.equal(createArcShape([0, 0], [0, 10]).clockwise, true);
  assert.equal(computeConcentricLayout(graph, { startAngle: 0, clockwise: false, preventOverlap: true }).nodes.length, 4);
  assert.equal(computeGridLayout(graph, {
    width: 120,
    height: 80,
    rows: 2,
    cols: 2,
    condense: true,
    preventOverlap: true,
    position: (node) => node.id === 'root' ? { row: 1, col: 1 } : null,
    sortBy: (node) => node.value
  }).nodes.length, 4);
  assert.equal(computeMDSLayout(graph, { preventOverlap: true, maxPreventOverlapIteration: 3 }).nodes.length, 4);
  assert.equal(computeRadialLayout(graph, {
    fast: true,
    focusNode: 'root',
    startAngle: 0,
    sweep: Math.PI,
    clockwise: false,
    preventOverlap: true
  }).nodes.length, 4);
  assert.equal(computeRadialLayout({ nodes: [{ id: 'solo' }], edges: [] }).nodes.length, 1);
  assert.equal(computeRadialLayout({
    nodes: [
      { id: 'root', value: 10 },
      { id: 'a', value: 8 },
      { id: 'b', value: 6 },
      { id: 'c', value: 4 }
    ],
    edges: [{ source: 'missing', target: 'a' }]
  }, {
    startAngle: 0,
    sweep: 0,
    preventOverlap: true,
    strictRadial: true,
    maxPreventOverlapIteration: 2,
    nodeSize: 80
  }).nodes.length, 4);
  assert.equal(computeRadialLayout({
    nodes: [
      { id: 'root' },
      { id: 'a' },
      { id: 'b' },
      { id: 'c' }
    ],
    edges: []
  }, {
    fast: true,
    startAngle: 0,
    sweep: 0,
    preventOverlap: true,
    strictRadial: false,
    maxPreventOverlapIteration: 2,
    nodeSize: 80
  }).nodes.length, 4);
  assert.equal(runMDS([], 2).length, 0);
  assert.equal(runMDS([[], []], 2).length, 2);
  assert.equal(mdsInternals.projectMDS([[], []], [], 2, 10).length, 2);
  assert.deepEqual(mdsInternals.recenterNodes({ nodes: [] }, [0, 0]), undefined);
  assert.deepEqual(mdsInternals.jacobiEigenDecomposition([]), []);
  assert.equal(mdsInternals.mean([]), 0);
  assert.equal(mdsInternals.fallbackCircle(3, 0).length, 3);
  const overlapGraph = {
    nodes: [
      { id: 'a', x: 0, y: 0, size: 20 },
      { id: 'b', x: 0, y: 0, size: 20 }
    ],
    edges: []
  };
  mdsInternals.preventMDSOverlap(overlapGraph, [0, 0], { maxPreventOverlapIteration: 1 });
  assert.equal(overlapGraph.nodes.every((node) => Number.isFinite(node.x)), true);
  assert.deepEqual(gridInternals.normalizeGridViewport({ width: -1, height: -2, center: ['bad', 4] }), {
    width: 0,
    height: 0,
    center: [0, 4]
  });
  assert.deepEqual(gridInternals.resolveGridDimensions(5, { cols: 2 }, 100, 50, new Map()), { rows: 3, cols: 2 });
  assert.deepEqual(gridInternals.resolveGridDimensions(5, { rows: 2 }, 100, 50, new Map()), { rows: 2, cols: 3 });
  assert.deepEqual(gridInternals.resolveGridDimensions(1, {}, 0, 0, new Map([['p', { row: 2, col: 3 }]])), { rows: 3, cols: 4 });
  assert.deepEqual(gridInternals.resolveGridBegin({ begin: ['bad', 7] }, [50, 50], { rows: 2, cols: 2 }, { width: 10, height: 20 }), [0, 7]);
  assert.equal(gridInternals.createCenterFirstCells({ rows: 2, cols: 2 }).length, 4);
  const unappliedGridNode = { id: 'unapplied' };
  gridInternals.applyGridCell(unappliedGridNode, undefined, [0, 0], { width: 10, height: 10 });
  assert.equal(unappliedGridNode.x, undefined);
  assert.equal(gridInternals.compareCenterFirstCells({ row: 1, col: 1 }, { row: 1, col: 1 }, 0, 0), 0);
  assert.equal(gridInternals.positiveInteger(0, true), 0);
  assert.equal(gridInternals.positiveInteger(0), null);
  assert.equal(gridInternals.squaredDistance({ row: 2, col: 3 }, 0, 0), 13);
  assert.equal(gridInternals.cellKey({ row: 2, col: 3 }), '2:3');
});

test('cartesian and polar layouts cover option fallbacks and data shapes', () => {
  const lollipopData = [
    ['Alpha', 10],
    { country: 'Beta', population: -4, itemStyle: { color: '#f00' } },
    { country: '', population: 0 }
  ];
  const beeswarmData = [
    ['A', 1, 'one'],
    { team: 'B', score: 4, name: 'two' },
    null
  ];

  assert.equal(resolveLollipopLayout({ data: lollipopData, dimensions: ['country', 'population'] }).points.length, 3);
  assert.equal(layoutLollipop(lollipopData, {
    dimensions: ['country', 'population'],
    categoryField: 'country',
    valueField: 'population',
    categories: ['Beta', 'Alpha', '(empty)'],
    sort: 'desc',
    baseline: -8,
    min: -10,
    max: 12,
    padding: { top: 8, right: 12, bottom: 16, left: 20 }
  }).points.length, 2);
  assert.equal(resolveBeeswarmLayout({
    data: beeswarmData,
    dimensions: ['team', 'score', 'name'],
    orient: 'vertical',
    sort: 'asc',
    symbolSize: (item) => item.name === 'two' ? 18 : 12,
    collisionPadding: 0
  }).points.length, 2);

  const radialRows = [
    ['2026-01-01', 10, 5, 16],
    ['2026-02-01', 24, 16, 30],
    ['2026-03-01', 12, 8, 18]
  ];
  assert.equal(resolveRadialAreaLayout({
    data: radialRows,
    dimensions: ['date', 'avg', 'min', 'max'],
    angleType: 'time',
    radius: ['20%', '80%'],
    center: ['55%', '45%'],
    closed: false,
    clockwise: false,
    startAngle: -90
  }).points.length, 3);
  assert.equal(layoutRadialArea([{ angle: 0, value: 1 }, { angle: 2, value: 1 }], {
    angleType: 'value',
    angleField: 'angle',
    valueField: 'value',
    min: 1,
    max: 1,
    angleMin: 0,
    angleMax: 2
  }).points.length, 2);

  const boxes = [
    ['A', 1, 2, 3, 4, 5],
    { name: 'B', min: 2, q1: 3, median: 4, q3: 5, max: 6 }
  ];
  assert.equal(resolveRadialBoxplotLayout({
    data: boxes,
    dimensions: ['name', 'min', 'q1', 'median', 'q3', 'max'],
    categories: ['B', 'A'],
    sort: false,
    radius: ['10%', '90%'],
    labelRadius: '96%',
    clockwise: false,
    boxWidth: 0,
    capWidth: 2
  }).boxes.length, 2);
});

test('hierarchical layouts cover empty roots, sorting, fast paths, and custom fields', () => {
  const tree = {
    id: 'root',
    label: 'Root',
    amount: 10,
    kids: [
      { label: 'B', amount: 4 },
      { label: 'A', amount: 6, kids: [{ label: 'A1', amount: 2 }] }
    ]
  };

  assert.equal(flattenCirclePackingData(tree, {
    nameField: 'label',
    valueField: 'amount',
    childrenField: 'kids'
  }).length, 4);
  assert.ok(layoutCirclePacking(tree, {
    nameField: 'label',
    valueField: 'amount',
    childrenField: 'kids',
    rootVisible: true,
    sort: 'name',
    radius: '45%',
    center: ['40%', '60%'],
    padding: { top: 4, right: 8, bottom: 12, left: 16 }
  }).nodes.some((node) => node.name === 'Root'));
  assert.equal(resolveCirclePackingLayout({ data: [], rootVisible: false }).nodes.length, 0);

  assert.equal(layoutPackBubble([
    { label: 'A', amount: 10, group: 'x' },
    { label: 'B', amount: 1, group: 'y' },
    { label: 'C', amount: 0, group: 'z' }
  ], {
    nameField: 'label',
    valueField: 'amount',
    categoryField: 'group',
    fast: true,
    sort: 'asc',
    fillRatio: 1,
    padding: { top: 10, right: 20, bottom: 30, left: 40 }
  }).circles.length, 3);
  assert.equal(resolvePackBubbleLayout({ data: [], fast: false }).circles.length, 0);

  assert.equal(flattenFlameData(tree, 'Forced Root').length, 1);
  assert.equal(resolveFlameLayout({
    data: {
      name: 'Root',
      children: [
        { name: 'B', value: 4 },
        { name: 'A', value: 6, children: [{ name: 'A1', value: 2 }] }
      ]
    },
    rootName: 'Forced Root',
    orient: 'down',
    sort: 'name',
    rootVisible: false,
  }).nodes.length, 3);

  assert.equal(resolveNestedCircleLayout({
    data: [
      { label: 'Outer', kids: [{ label: 'Child' }, 'Loose'] },
      'String Ring'
    ],
    nameField: 'label',
    childrenField: 'kids',
    centerRadiusRatio: 1,
    minRingThickness: 40,
    titleRadiusRatio: 0.2,
    labelRadiusRatio: 0.99
  }).rings.length, 2);
  assert.equal(layoutNestedCircle([], {}).rings.length, 1);

  assert.equal(resolveMosaicLayout({
    data: [
      ['Organic', 'New', 10],
      ['Organic', 'New', 5],
      ['Paid', '', 0],
      { channel: 'Paid', stage: 'Returning', users: 7 }
    ],
    dimensions: ['channel', 'stage', 'users'],
    xField: 'channel',
    yField: 'stage',
    valueField: 'users',
    xCategories: ['Paid', 'Organic'],
    yCategories: ['Returning', 'New', '(empty)'],
    sort: 'name',
    gap: 0
  }).tiles.length, 2);
});

test('network, route, and path-like layouts cover projection and sampling variants', () => {
  const routes = [
    {
      id: 'red',
      color: '#f00',
      status: 'planned',
      stations: [
        { id: 'a', name: 'A', coord: [0, 0], labelPosition: 'top' },
        { id: 'b', name: 'B', coord: [100, 0] }
      ],
      waypoints: [['a', 0, 0], [50, 20], ['b', 100, 0]]
    },
    {
      id: 'blue',
      color: '#00f',
      stations: [
        { id: 'a', name: 'A', coord: [0, 0] },
        { id: 'c', name: 'C', coord: [0, 100], interchange: true }
      ]
    }
  ];

  const subway = resolveSubwayLayout({
    data: routes,
    preserveAspectRatio: false,
    colors: ['#123'],
    routeLabel: { show: true }
  });
  assert.equal(subway.routes.length, 2);
  assert.ok(createRoundedRoutePath([{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 20 }], 6).includes('Q'));
  assert.equal(routeSegmentOffsetKey('a', 'b'), 'a\0b');
  assert.ok(resolveSharedSegmentOffsets(subway.routes, 12).size >= 0);

  const sequence = resolveSequenceDiagramLayout({
    data: [
      ['client', 'api', 'request'],
      ['api', 'db', 'query', 'async'],
      ['db', 'api', 'rows', 'return'],
      ['api', 'api', 'cache', 'self']
    ],
    activations: [
      { participant: 'api', start: 0, end: 'cache', depth: 1 }
    ],
    padding: { top: 20, right: 30, bottom: 40, left: 50 },
    selfLoopWidth: 44
  });
  assert.deepEqual(sequence.participants.map((participant) => participant.id), ['client', 'api', 'db']);
  assert.equal(sequence.messages[3].direction, 'self');
  assert.equal(sequence.activations[0].depth, 1);
  assert.deepEqual(collectSequenceMessageData({ data: sequence.messages.map((message) => message.raw) }).length, 4);

  const causeEffect = resolveCauseEffectLayout({
    effect: { name: 'Late delivery' },
    data: [
      ['People', 'handoff gaps', ['unclear owner', 'no escalation path']],
      { category: 'Process', items: [{ label: 'manual approval' }, 'batch release'] },
      { name: 'Tools', children: ['slow build'] }
    ],
    padding: { top: 20, right: 30, bottom: 40, left: 50 },
    categoryAngle: 54,
    maxCauseDepth: 2
  });
  assert.deepEqual(causeEffect.categories.map((category) => category.side), ['top', 'bottom', 'top']);
  assert.equal(causeEffect.categories[0].causes[1].children[0].depth, 1);
  assert.deepEqual(collectCauseEffectData({ effect: 'Low NPS', categories: [['People', 'missed follow-up']] }).map((item) => item.kind), ['effect', 'category', 'cause']);
  assert.equal(layoutCauseEffect({ effect: null, categories: [null, 'Loose'] }, { width: 0, height: -1, padding: -5 }).width, 1);
  assert.equal(causeEffectInternals.readCategoryName(['Quality'], 'fallback'), 'Quality');
  assert.deepEqual(causeEffectInternals.readCauseItems({ causes: ['A'] }), ['A']);

  assert.equal(layoutSpiral([
    ['A', 10],
    ['B', 20],
    ['C', 20]
  ], {
    dimensions: ['name', 'value'],
    sort: 'asc',
    turns: 1.2,
    gapAngle: 0,
    innerRadius: '12%',
    outerRadius: '95%',
    startAngle: 0,
    clockwise: false
  }).segments.length, 3);
  assert.equal(resolveSpiralLayout({ data: [], turns: 0 }).segments.length, 0);

  assert.equal(resolveVectorFieldLayout({
    data: [
      [10, 50, 1, 0],
      [10.5, 50, 0, 1],
      [10, 49.5, -1, 0],
      [10.5, 49.5, 0, -1]
    ],
    samplingStep: 2,
    invertY: false,
    minLength: 2,
    maxLength: 6,
    xExtent: [10.5, 10],
    yExtent: [49.5, 50]
  }).items.length, 2);
  assert.equal(layoutVectorField([{ longitude: 0, latitude: 0, u: 0, v: 0 }], {}).items[0].magnitude, 0);
  assert.deepEqual(normalizeVectorFieldData('bad'), []);
  assert.equal(resolveVectorFieldLayout({ layout: null, data: [] }).items.length, 0);
  assert.equal(vectorLayoutInternals.minPositiveStep([1, 4, 2]), 1);
  assert.deepEqual(vectorLayoutInternals.readExtent(['bad', 1]), undefined);
  assert.equal(vectorLayoutInternals.readName({ id: 7 }, 0), '7');
  assert.equal(vectorLayoutInternals.readName(null, 3), 'vector-3');

  const hollow = layoutHollowVenn([
    { sets: ['A'], value: 10 },
    { sets: ['A', 'B'], value: 3 },
    { name: 'Loose', value: 2 }
  ], { layout: 'hollow' });
  const bubble = layoutBubbleVenn([
    { name: 'B', value: 2 },
    { name: 'A', value: 6 }
  ], { sort: 'name', minRadius: 8, maxRadius: 20 });
  assert.equal(resolveVennLayout({ data: [], layout: 'bubble' }).circles.length, 0);
  assert.ok(hollow.circles.length > 0);
  assert.equal(bubble.circles[0].name, 'A');
});

test('time and voronoi layouts cover date parsing, cross-midnight cycles, and flat trees', () => {
  const sunrise = resolveSunriseSunsetLayout({
    data: [{
      sunrise: '2026-05-05 22:00:00',
      sunset: '2026-05-06 04:00:00',
      moonrise: 22 * 60 * 60 * 1000,
      moonset: new Date('2026-05-06T07:00:00Z'),
      currentTime: '2026-05-06 02:30:00'
    }],
    title: '',
    currentTimeLabel: '',
    remainingText: '',
    updatedText: ''
  });
  assert.equal(Object.keys(sunrise.events).length, 4);
  assert.equal(Object.keys(layoutSunriseSunset({
    sunrise: 'bad',
    sunset: 0,
    moonrise: undefined,
    moonset: undefined,
    currentTime: 0
  }, { width: 1, height: 1, padding: 999 }).events).length, 4);

  const flat = flattenVoronoiTreemapData({
    label: 'Root',
    amount: 9,
    kids: [
      { label: 'A', amount: 4 },
      { label: 'B', amount: 5 }
    ]
  }, {
    nameField: 'label',
    valueField: 'amount',
    childrenField: 'kids'
  });
  assert.equal(flat.length, 3);
  assert.equal(resolveVoronoiTreemapLayout({
    data: flat,
    rootName: 'Forced',
    rootVisible: true,
    sort: 'name',
    maxIteration: 1,
    gap: 0,
    colors: []
  }).nodes.length, 4);
  assert.equal(layoutVoronoiTreemap([], { rootVisible: false }).nodes.length, 0);
});

test('circle packing and nested circle cover fallback readers and array ring inputs', () => {
  const circle = resolveCirclePackingLayout({
    data: {
      label: 'Root',
      items: [
        { label: 'B', amount: 3, children: [{ label: 'B1', amount: 1 }] },
        { label: 'A', amount: 1 }
      ]
    },
    nameField: 'label',
    valueField: 'amount',
    childrenField: 'kids',
    sort: 'asc',
    padding: { top: 10, right: 20, bottom: 30, left: 40 },
    center: [100, 'bad%'],
    radius: '50%'
  });
  assert.deepEqual(circle.root.children.map((child) => child.name), ['A', 'B']);
  assert.equal(circle.center.x, 100);
  assert.equal(circle.center.y, 190);
  assert.equal(layoutCirclePacking(5, { rootName: 'Scalar Root' }).root.name, 'Scalar Root');

  const nested = resolveNestedCircleLayout({
    data: [
      ['Center', ['Only child'], 8],
      { name: 'Outer', value: [9], children: [{ name: 'Obj child', value: [9] }] }
    ],
    center: [120, '75%'],
    radius: '55%'
  });
  assert.equal(nested.center.x, 120);
  assert.equal(nested.center.y, 300);
  assert.equal(nested.labels.find((label) => label.name === 'Obj child')?.value, 9);
});

test('circle packing internals cover degenerate front-chain and geometry branches', () => {
  const leaf = (id, x = 0, y = 0, r = 1, packRadius = r) => ({
    node: {
      id,
      name: id,
      explicitValue: 1,
      value: 1,
      depth: 0,
      parent: null,
      children: [],
      dataIndex: 0,
      localX: 0,
      localY: 0,
      localRadius: r,
      x: 0,
      y: 0,
      r,
      color: '#000',
      raw: {},
      synthetic: false
    },
    x,
    y,
    r,
    packRadius
  });

  assert.doesNotThrow(() => circlePackingInternals.packFrontChain([], 1));
  assert.doesNotThrow(() => circlePackingInternals.recenterCircles([]));
  assert.deepEqual(circlePackingInternals.measureBounds([]), {
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0,
    width: 0,
    height: 0
  });

  const overlapping = [leaf('a', 0, 0, 1, 10), leaf('b', 0, 0, 1, 10), leaf('c', 0, 0, 1, 10), leaf('d', 0, 0, 1, 10)];
  circlePackingInternals.resolveCollisions(overlapping);
  assert.ok(overlapping.some((circle) => Math.abs(circle.x) > 0 || Math.abs(circle.y) > 0));

  const chainCircles = [leaf('a', 0, 0, 8, 8), leaf('b', 0, 0, 8, 8), leaf('c', 0, 0, 8, 8), leaf('d', 0, 0, 8, 8), leaf('e', 0, 0, 8, 8)];
  circlePackingInternals.packFrontChain(chainCircles, 0);
  assert.equal(chainCircles.length, 5);
  const sneakyCircle = leaf('sneaky-b', 0, 0, 1, 1);
  installTemporaryPackRadiusSpike(sneakyCircle, 5, 2, 100);
  const rewoundChain = [leaf('sneaky-a'), sneakyCircle, leaf('sneaky-c'), leaf('sneaky-d'), leaf('sneaky-e')];
  circlePackingInternals.packFrontChain(rewoundChain, 0);
  assert.equal(rewoundChain.length, 5);
  for (let seed = 0; seed < 16; seed += 1) {
    const varied = Array.from({ length: 12 }, (_, index) => {
      const radius = 1 + ((seed * 11 + index * 7) % 17);
      return leaf(`varied-${seed}-${index}`, 0, 0, radius, radius);
    });
    circlePackingInternals.packFrontChain(varied, seed % 3);
    assert.equal(varied.every((circle) => Number.isFinite(circle.x) && Number.isFinite(circle.y)), true);
  }

  const tangent = leaf('c');
  circlePackingInternals.placeTangent(leaf('a', 0, 0, 10, 10), leaf('b', 0, 0, 1, 1), tangent);
  assert.equal(tangent.y, 0);
  const weightedTangent = leaf('weighted');
  circlePackingInternals.placeTangent(leaf('a', 0, 0, 10, 10), leaf('b', 4, 0, 1, 1), weightedTangent);
  assert.ok(Number.isFinite(weightedTangent.x));

  const chainNode = circlePackingInternals.createFrontChainNode(leaf('zero', 0, 0, 0, 0));
  chainNode.next = circlePackingInternals.createFrontChainNode(leaf('next-zero', 0, 0, 0, 0));
  assert.equal(circlePackingInternals.scoreFrontChainNode(chainNode), 0);
  assert.equal(circlePackingInternals.intersects(leaf('a', 0, 0, 1, 2), leaf('b', 1, 0, 1, 2)), true);
  assert.equal(circlePackingInternals.clamp(4, 10, 2), 6);

  const mutable = circlePackingInternals.normalizeRoot([], { rootName: '' });
  circlePackingInternals.computeValues(mutable);
  circlePackingInternals.assignDataIndices(mutable);
  circlePackingInternals.assignColors(mutable, ['#111'], 0);
  circlePackingInternals.assignPositions(mutable, { x: 1, y: 2 }, 1);
  assert.equal(circlePackingInternals.toPublicNode(mutable, 0).percent, 0);
  assert.equal(circlePackingInternals.resolveRadius('50%', { x: 0, y: 0, width: 100, height: 80 }), 20);
  assert.equal(circlePackingInternals.resolvePosition('bad%', 100, 12), 12);
  assert.equal(circlePackingInternals.readNonNegativeNumber(-3), 0);
});

test('radial area and radial boxplot cover inferred domains, explicit bounds, and date formatting', () => {
  const timedArea = resolveRadialAreaLayout({
    data: [
      { date: new Date('2026-01-01T00:00:00Z'), avg: 2, low: 1, high: 3 },
      { date: '2026-02-01T00:00:00Z', avg: 4, low: 2, high: 5 }
    ],
    tickCount: 4
  });
  assert.equal(timedArea.angleType, 'time');
  assert.equal(timedArea.points[0].name, '2026-01-01T00:00:00.000Z');

  const categoricalArea = resolveRadialAreaLayout({
    data: [
      { category: 'B', avg: 2 },
      { category: 'A', avg: 1 }
    ],
    categories: ['A']
  });
  assert.equal(categoricalArea.angleType, 'category');
  assert.equal(categoricalArea.points.at(-1)?.name, 'B');

  const valuedArea = layoutRadialArea([
    { angle: 2, value: 1 },
    { angle: 1, value: 3 }
  ], {
    min: 10,
    max: 2,
    nice: false
  });
  assert.equal(valuedArea.angleType, 'value');
  assert.deepEqual(valuedArea.valueExtent, { min: 2, max: 10 });

  const explicitMinArea = layoutRadialArea([
    { angle: 1, value: 1.2 },
    { angle: 2, value: 2.8 }
  ], {
    min: 0,
    tickCount: 4
  });
  assert.equal(explicitMinArea.valueExtent.min, 0);
  assert.ok(explicitMinArea.valueExtent.max >= 2.8);

  const datedBoxes = resolveRadialBoxplotLayout({
    data: [{
      when: new Date('2026-03-01T00:00:00Z'),
      low: 1,
      quartile1: 2,
      med: 3,
      quartile3: 4,
      upper: 5
    }],
    categoryField: 'when',
    center: ['25%', '75%'],
    radius: ['20%', '80%'],
    min: 10,
    max: 2,
    nice: false,
    clockwise: false
  });
  assert.equal(datedBoxes.boxes[0].name, '2026-03-01T00:00:00.000Z');
  assert.equal(datedBoxes.centerX, 180);
  assert.equal(datedBoxes.centerY, 540);
  assert.deepEqual(datedBoxes.valueExtent, { min: 2, max: 10 });

  const explicitMinBoxes = layoutRadialBoxplot([{
    category: 'A',
    min: 1,
    q1: 2,
    median: 3,
    q3: 4,
    max: 5
  }], {
    min: 0,
    tickCount: 6
  });
  assert.equal(explicitMinBoxes.valueExtent.min, 0);
  assert.ok(explicitMinBoxes.valueExtent.max >= 5);
});

test('radial area and boxplot internals cover tick, sweep, and option fallbacks', () => {
  assert.deepEqual(radialAreaInternals.createRadialTicks(2, 8, 1), [2, 8]);
  assert.equal(radialAreaInternals.niceNumber(1, false), 1);
  assert.equal(radialAreaInternals.niceNumber(2, false), 2);
  assert.equal(radialAreaInternals.niceNumber(5, false), 5);
  assert.equal(radialAreaInternals.niceNumber(8, false), 10);
  assert.equal(radialAreaInternals.niceNumber(1.4, true), 1);
  assert.equal(radialAreaInternals.niceNumber(2.4, true), 2);
  assert.equal(radialAreaInternals.niceNumber(6, true), 5);
  assert.equal(radialAreaInternals.stringifyName(null), '');
  assert.equal(radialAreaInternals.stringifyName(new Date('2026-01-01T00:00:00Z')), '2026-01-01T00:00:00.000Z');
  assert.deepEqual(radialAreaInternals.normalizeRange(8, 2), { min: 2, max: 8 });
  assert.equal(Number.isNaN(radialAreaInternals.numericAngleValue('bad')), true);
  assert.equal(radialAreaInternals.inferAngleType([{ angleValue: '2026-01-01', angleNumeric: Date.parse('2026-01-01') }]), 'time');
  assert.equal(radialAreaInternals.inferAngleType([{ angleValue: 'A', angleNumeric: NaN }]), 'category');
  assert.deepEqual(radialAreaInternals.readTuple(['x', 'y'], undefined), ['x', 'y']);
  assert.equal(radialAreaInternals.readAngleType('bad'), undefined);
  assert.equal(radialAreaInternals.readFieldOption({}), undefined);
  assert.equal(radialAreaInternals.readRadiusOption({}), undefined);
  assert.equal(radialAreaInternals.firstBoolean('x', false, true), false);

  assert.deepEqual(radialBoxplotInternals.createRadialTicks(2, 8, 1), [2, 8]);
  assert.equal(radialBoxplotInternals.niceNumber(1, false), 1);
  assert.equal(radialBoxplotInternals.niceNumber(2, false), 2);
  assert.equal(radialBoxplotInternals.niceNumber(5, false), 5);
  assert.equal(radialBoxplotInternals.niceNumber(8, false), 10);
  assert.equal(radialBoxplotInternals.niceNumber(1.4, true), 1);
  assert.equal(radialBoxplotInternals.niceNumber(2.4, true), 2);
  assert.equal(radialBoxplotInternals.niceNumber(6, true), 5);
  assert.equal(radialBoxplotInternals.signedSweep(0, 810, true), -270);
  assert.equal(radialBoxplotInternals.signedSweep(0, -810, false), 270);
  assert.ok(radialBoxplotInternals.arcPath(0, 0, 10, 0, 270, true).includes(' 1 '));
  assert.ok(radialBoxplotInternals.sectorPath(0, 0, 4, 10, 0, 270, true).includes('Z'));
  assert.ok(radialBoxplotInternals.sectorPoints(0, 0, 4, 10, 0, 270, true).length > 4);
  assert.equal(radialBoxplotInternals.stringifyName(null), '');
  assert.deepEqual(radialBoxplotInternals.readTuple([1, 2], undefined), [1, 2]);
  assert.equal(radialBoxplotInternals.readFieldOption({}), undefined);
  assert.equal(radialBoxplotInternals.readRadiusOption({}), undefined);
  assert.equal(radialBoxplotInternals.firstBoolean('x', true, false), true);
});

test('radial area and boxplot layout internals cover domain and option edge branches', () => {
  const emptyArea = resolveRadialAreaLayout({
    data: 'not-array',
    layout: {
      width: 200,
      height: 100,
      padding: 10,
      center: ['25%', 'bad'],
      radius: ['bad%', '80%'],
      startAngle: 0,
      endAngle: 180,
      clockwise: false,
      closed: false,
      angleType: 'category',
      categories: [1, 'B', null],
      nice: false
    },
    layoutOptions: {
      tickCount: 1
    }
  });
  assert.equal(emptyArea.points.length, 0);
  assert.equal(emptyArea.angleSpan, 180);
  assert.equal(emptyArea.clockwise, false);

  const areaItems = radialAreaInternals.normalizeItems([
    { avg: 5 },
    ['cat', 2, 1, 3],
    { date: '2026-01-01', avg: 2, low: 3, high: 1, id: 'dated' },
    { angle: 1, value: 'bad' }
  ], {
    dimensions: ['angle', 'value', 'min', 'max'],
    valueField: 'avg',
    minField: 'low',
    maxField: 'high'
  });
  assert.equal(areaItems[0].name, 'item-0');
  assert.equal(areaItems.length, 3);
  assert.deepEqual(radialAreaInternals.resolveAngleDomain([], {}), { type: 'category', categories: [], min: 0, max: 1 });
  assert.equal(radialAreaInternals.resolveAngleDomain(areaItems, { angleType: 'value' }).type, 'value');
  assert.deepEqual(radialAreaInternals.orderByAngle(areaItems, {
    type: 'category',
    categories: ['missing'],
    min: 0,
    max: 1
  }, {}).map((item) => item.dataIndex), [0, 1, 2]);
  assert.deepEqual(radialAreaInternals.resolveValueExtent([], { min: 2, max: 2, nice: false }), { min: 1, max: 3 });
  assert.deepEqual(radialAreaInternals.resolveValueExtent(areaItems, { tickCount: 3 }).min <= 0, true);
  const areaPoint = radialAreaInternals.createPoint(areaItems[1], {
    type: 'category',
    categories: ['cat'],
    min: 0,
    max: 1
  }, { min: 0, max: 4 }, 10, 30, 50, 50, 90, 360, true);
  assert.equal(Number.isFinite(areaPoint.x), true);
  assert.equal(radialAreaInternals.resolveAngleRatio({ angleValue: 'missing', name: 'missing' }, {
    type: 'category',
    categories: [],
    min: 0,
    max: 1
  }), 0);
  assert.equal(radialAreaInternals.createRangePolygon([
    { name: 'a', angle: 0, min: 1, max: 3, minRadius: 10, maxRadius: 30, minX: 1, minY: 2, maxX: 3, maxY: 4, dataIndex: 0 },
    { name: 'b', angle: 1, min: 1, max: 3, minRadius: 10, maxRadius: 30, minX: 1, minY: 2, maxX: 3, maxY: 4, dataIndex: 1 },
    { name: 'c', angle: 2, min: 1, max: 3, minRadius: 10, maxRadius: 30, minX: 1, minY: 2, maxX: 3, maxY: 4, dataIndex: 2 }
  ], true).length, 8);
  assert.equal(radialAreaInternals.createAngleLabels({
    type: 'value',
    categories: [],
    min: 0,
    max: 1
  }, [areaPoint], 0, 0, 20, 0, 180, false).length, 1);
  assert.equal(radialAreaInternals.projectRadius(5, { min: 1, max: 1 }, 10, 20), 20);
  assert.deepEqual(radialAreaInternals.labelPlacement(0), { align: 'left', verticalAlign: 'middle' });
  assert.equal(radialAreaInternals.readField(['a', 'b'], 'missing', ['x'], -1, []), undefined);
  assert.equal(radialAreaInternals.readField({ fallback: 7 }, 'missing', undefined, 0, ['fallback']), 7);
  assert.equal(radialAreaInternals.readField(null, 'value', undefined, 0, []), undefined);
  assert.equal(radialAreaInternals.numericAngleValue(new Date('2026-01-01T00:00:00Z')), Date.parse('2026-01-01T00:00:00Z'));
  assert.equal(radialAreaInternals.parseCenter('25%', 200, 0), 50);
  assert.equal(radialAreaInternals.parseRadius('25%', 200, 0), 50);
  assert.equal(radialAreaInternals.clampRadius(NaN, 3, 8), 3);
  assert.deepEqual(radialAreaInternals.normalizeDimensions(['a', 1, 'b']), ['a', 'b']);
  assert.deepEqual(radialAreaInternals.normalizeCategories(['a', 2, null]), ['a', '2']);
  assert.deepEqual(radialAreaInternals.unique(['a', 'a', 'b']), ['a', 'b']);
  assert.equal(radialAreaInternals.roundNumber(1.2345678901234), 1.234567890123);
  assert.equal(radialAreaInternals.isPlainObject(Object.create(null)), true);

  const emptyBoxplot = resolveRadialBoxplotLayout({
    data: 'not-array',
    layout: {
      width: 200,
      height: 100,
      padding: 10,
      center: ['25%', 'bad'],
      radius: ['bad%', '80%'],
      labelRadius: '90%',
      startAngle: 0,
      endAngle: 180,
      clockwise: false,
      categories: [1, 'B', null],
      nice: false,
      boxWidth: -1,
      capWidth: 3
    }
  });
  assert.equal(emptyBoxplot.boxes.length, 0);
  assert.equal(emptyBoxplot.angleSpan, 180);
  assert.equal(emptyBoxplot.clockwise, false);

  const boxItems = radialBoxplotInternals.normalizeItems([
    { min: 5, q1: 4, median: 3, q3: 2, max: 1 },
    ['B', 1, 2, 3, 4, 5],
    { name: 'bad', min: 'x', q1: 1, median: 2, q3: 3, max: 4 }
  ], {
    dimensions: ['name', 'min', 'q1', 'median', 'q3', 'max']
  });
  assert.equal(boxItems[0].name, 'item-0');
  assert.deepEqual(boxItems[0].min, 1);
  assert.deepEqual(radialBoxplotInternals.resolveCategories(boxItems, { categories: ['B'] }), ['B']);
  assert.deepEqual(radialBoxplotInternals.orderByCategory(boxItems, ['B']).map((item) => item.name), ['B', 'item-0']);
  assert.deepEqual(radialBoxplotInternals.resolveValueExtent([], { min: 2, max: 2, nice: false }), { min: 1, max: 3 });
  assert.deepEqual(radialBoxplotInternals.resolveValueExtent(boxItems, { tickCount: 3 }).min <= 0, true);
  const box = radialBoxplotInternals.createBox(boxItems[0], ['item-0'], { min: 0, max: 6 }, 10, 30, 50, 50, 90, 180, true, 0.5, 0.25);
  assert.equal(Number.isFinite(box.medianX), true);
  assert.ok(radialBoxplotInternals.sectorPath(0, 0, 4, 10, 0, 90, true).includes(' 0 1 '));
  assert.ok(radialBoxplotInternals.arcPath(0, 0, 10, 0, 90, false).includes(' 0 0 '));
  assert.equal(radialBoxplotInternals.arcPoints(0, 0, 10, 0, 20, false).length, 5);
  assert.equal(radialBoxplotInternals.tangentialTextRotation(270), 0);
  assert.equal(radialBoxplotInternals.readField(['a'], 'missing', ['x'], -1, []), undefined);
  assert.equal(radialBoxplotInternals.readField({ region: 'R' }, 'missing', undefined, 0, ['region']), 'R');
  assert.equal(radialBoxplotInternals.parseCenter('25%', 200, 0), 50);
  assert.equal(radialBoxplotInternals.parseRadius('25%', 200, 0), 50);
  assert.equal(radialBoxplotInternals.clampRadius(NaN, 3, 8), 3);
  assert.deepEqual(radialBoxplotInternals.normalizeDimensions(['a', 1, 'b']), ['a', 'b']);
  assert.deepEqual(radialBoxplotInternals.normalizeCategories(['a', 2, null]), ['a', '2']);
  assert.deepEqual(radialBoxplotInternals.unique(['a', 'a', 'b']), ['a', 'b']);
  assert.equal(radialBoxplotInternals.roundNumber(1.2345678901234), 1.234567890123);
  assert.equal(radialBoxplotInternals.formatNumber(1.5), '1.5');
  assert.equal(radialBoxplotInternals.isPlainObject(Object.create(null)), true);
});

test('spiral, subway, pack bubble, and beeswarm cover numeric string and array-form branches', () => {
  const spiral = layoutSpiral([
    [101, 5],
    [202, 1]
  ], {
    dimensions: ['name', 'value'],
    nameField: 0,
    valueField: 'missing',
    center: [120, '25%'],
    innerRadius: '12',
    outerRadius: '50%',
    sort: true,
    min: 9,
    max: 3
  });
  assert.equal(spiral.centerX, 120);
  assert.equal(spiral.centerY, 105);
  assert.deepEqual(spiral.valueExtent, { min: 3, max: 9 });
  assert.equal(spiral.segments[0].name, '101');

  const spiralFallback = resolveSpiralLayout({
    data: [['A', 1]],
    center: ['bad%', '40']
  });
  assert.equal(spiralFallback.centerX, 300);
  assert.equal(spiralFallback.centerY, 40);
  assert.equal(resolveSpiralLayout({ layout: null, data: null }).segments.length, 0);
  assert.equal(spiralInternals.readField(['A'], 'missing', ['name'], 5, []), undefined);
  assert.equal(spiralInternals.readField({ fallback: 3 }, 1, [], 0, ['fallback']), 3);
  assert.equal(spiralInternals.readField(null, 'value', [], 0, []), undefined);
  assert.equal(spiralInternals.readCoordinate('bad%', 100, 12), 12);
  assert.equal(spiralInternals.readCoordinate('bad', 100, 12), 12);
  assert.equal(spiralInternals.readCoordinate(null, 100, 12), 12);
  assert.equal(spiralInternals.readLength('bad%', 100, 14), 14);
  assert.equal(spiralInternals.readLength('bad', 100, 14), 14);
  assert.deepEqual(spiralInternals.readCenterOption([false, 2]), undefined);
  assert.equal(spiralInternals.readLengthOption(false), undefined);
  assert.equal(spiralInternals.readFieldOption(false), undefined);
  assert.deepEqual(spiralInternals.resolveCenter(undefined, 100, 80), { x: 50, y: 40 });
  assert.deepEqual(spiralInternals.resolveValueExtent([{ value: 4 }], {}), { min: 4, max: 5 });
  assert.equal(spiralInternals.stringifyName({}), '');
  assert.equal(spiralInternals.isPlainObject([]), false);

  const subway = layoutSubway([
    {
      id: 'array',
      stations: [
        [0, 0, null, undefined, 'top', true],
        ['b', 'Bee', 10, 0, 'bottom', false],
        ['bad']
      ],
      waypoints: [
        ['array:1'],
        { x: 5, y: 5 },
        { value: [10, 10] },
        ['missing'],
        ['b', 10, 0]
      ]
    },
    {
      id: 'object',
      stations: [
        { id: 'v', value: [20, 0] },
        { id: 'x', x: 30, y: 10 }
      ],
      waypoints: [{ stationId: 'v' }]
    }
  ], {
    preserveAspectRatio: true
  });
  assert.equal(subway.routes.length, 2);
  assert.ok(subway.stations.some((station) => station.id === 'array:1'));
  assert.ok(subway.routes[0].points.some((point) => point.stationId === 'b'));
  assert.ok(subway.stations.some((station) => station.id === 'v'));

  const sequence = layoutSequenceDiagram({
    participants: ['A', ['B', 'Bee'], { id: 'C', label: 'See' }, null],
    messages: [
      { source: 'A', target: 'B', name: 'call' },
      { sender: 'B', receiver: 'C', message: 'emit', type: 'asynchronous' },
      { from: 'C', to: 'B', label: 'done', type: 'response' },
      { from: 'B', type: 'loop', text: 'retry' },
      { from: null, to: 'B' }
    ],
    activations: [
      { participantId: 'B', start: 'call', end: 'retry', depth: '2' },
      { participant: 'missing', start: 0, end: 1 }
    ]
  }, {
    width: 420,
    height: 260,
    padding: 24,
    headerHeight: '30',
    headerWidth: '90',
    messageGap: '36',
    activationWidth: '10',
    activationMargin: '8'
  });
  assert.equal(sequence.participants[1].name, 'Bee');
  assert.equal(sequence.participants[2].name, 'See');
  assert.deepEqual(sequence.messages.map((message) => message.type), ['sync', 'async', 'return', 'self']);
  assert.equal(sequence.activations.length, 1);
  assert.equal(sequenceLayoutInternals.normalizePadding({ top: 'bad', right: 1, bottom: -1, left: 2 }).top, 40);

  assert.equal(resolvePackBubbleLayout({ data: [], fast: true }).circles.length, 0);
  assert.equal(layoutPackBubble([{ value: 9 }], { fast: false }).circles.length, 1);

  const fastPacked = layoutPackBubble(Array.from({ length: 6 }, (_, index) => ({
    value: index + 1
  })), {
    width: 10,
    height: 10,
    padding: 0,
    fast: true,
    fastThreshold: 0
  });
  assert.equal(fastPacked.circles.length, 6);

  const packedWithFallbacks = layoutPackBubble([
    { stats: { amount: 9 }, meta: { label: 'A' }, group: 'x' },
    { stats: {}, value: 1, label: 'Fallback', category: 'y' },
    { value: 4, group: 'x' }
  ], {
    valueField: 'stats.amount',
    nameField: 'meta.label',
    categoryField: 'group',
    center: [42, 'bad%'],
    width: 120,
    height: 90,
    padding: 0,
    fast: true,
    fastThreshold: 0,
    gap: 8
  });
  assert.equal(packedWithFallbacks.center.x, 42);
  assert.equal(packedWithFallbacks.center.y, 45);
  assert.ok(packedWithFallbacks.circles.every((circle) => circle.x >= 0 && circle.x <= 120));

  const beeswarm = resolveBeeswarmLayout({
    data: [
      { category: '', value: 1 },
      { category: 5, value: '2', symbolSize: '10' }
    ],
    nameField: 2,
    categories: [5],
    min: 5,
    max: 1,
    nice: false
  });
  assert.equal(beeswarm.points.length, 1);
  assert.equal(beeswarm.points[0].category, '5');
  assert.deepEqual(beeswarm.valueExtent, { min: 1, max: 5 });
});

test('layout functions tolerate broad defensive input and option matrices', () => {
  const weirdTree = [
    null,
    'loose',
    { id: 'a', label: 'A', value: '4', children: [{ id: 'a1', value: -2 }, undefined] },
    { id: 'b', name: '', amount: 0, children: [] }
  ];
  const weirdRows = [
    null,
    ['A', 'B', '3'],
    { x: 'X', y: '', value: '5', min: '1', q1: '2', median: '3', q3: '4', max: '5' },
    { longitude: '1', latitude: '2', u: '3', v: '4' }
  ];

  const calls = [
    () => layoutLollipop(weirdRows, { width: 0, height: -1, padding: -5, sort: 'asc', min: 4, max: 4, tickCount: 1 }),
    () => layoutLollipop(weirdRows, { sort: 'none', categories: [], dimensions: ['category', 'name', 'value'] }),
    () => layoutBeeswarm(weirdRows, { orient: 'sideways', width: 0, height: 0, padding: -1, sort: 'desc', min: 4, max: 4, tickCount: 1 }),
    () => layoutBeeswarm(weirdRows, { orient: 'vertical', categories: ['B', 'A'], collisionPadding: -2, symbolSize: -3 }),
    () => layoutRadialArea(weirdRows, { angleType: 'category', angleField: 'x', valueField: 'value', min: 5, max: 5, angleSpan: -10, radius: ['bad', '-10%'], center: ['bad', null] }),
    () => layoutRadialArea(weirdRows, { angleType: 'value', angleField: 'value', valueField: 'value', angleMin: 5, angleMax: 5, closed: true }),
    () => layoutRadialBoxplot(weirdRows, { categoryField: 'x', minField: 'min', q1Field: 'q1', medianField: 'median', q3Field: 'q3', maxField: 'max', min: 5, max: 5, radius: ['bad', '-10%'] }),
    () => layoutSpiral(weirdRows, { valueField: 'value', sort: 'desc', turns: -1, segmentAngle: 0, innerRadius: 'bad', outerRadius: '-10%', gapAngle: -2, radialGap: 999 }),
    () => layoutVectorField(weirdRows, { xField: 'longitude', yField: 'latitude', uField: 'u', vField: 'v', samplingStep: 0, xExtent: [1, 1], yExtent: [2, 2], maxLength: -1, minLength: 10 }),
    () => layoutMosaic(weirdRows, { xField: 'x', yField: 'y', valueField: 'value', sort: false, width: -1, height: -1, padding: -1, colors: [] }),
    () => layoutFlame(weirdTree, { rootVisible: true, sort: false, width: 0, height: 0, padding: -1, gap: -1 }),
    () => layoutPackBubble(weirdRows, { valueField: 'value', sort: false, fast: false, width: 0, height: 0, gap: -1, fillRatio: -1, center: ['bad', null] }),
    () => layoutCirclePacking(weirdTree, { sort: 'desc', rootVisible: false, radius: -1, nodePadding: -1, siblingGap: -1, center: ['bad', null] }),
    () => layoutNestedCircle(weirdTree, { radius: -1, centerRadiusRatio: -1, labelRadiusRatio: -1, titleRadiusRatio: 2, minRingThickness: 999 }),
    () => layoutVoronoiTreemap(weirdTree, { sort: false, rootVisible: false, maxIteration: 999, gap: -1, width: 0, height: 0 }),
    () => layoutHollowVenn(weirdRows, { width: 0, height: 0, padding: -1 }),
    () => layoutBubbleVenn(weirdRows, { width: 0, height: 0, padding: -1, minRadius: -1, maxRadius: -1 }),
    () => layoutSubway([{ stations: [{ coord: ['bad', null] }, { id: 'x', coord: [0, 0] }], waypoints: [[null, 'bad', 1]] }], { width: 0, height: 0, padding: -1, preserveAspectRatio: true }),
    () => layoutSunriseSunset({ sunrise: undefined, sunset: undefined, moonrise: 'bad', moonset: 'bad', currentTime: undefined }, { moonStartRatio: 2, moonEndRatio: -1, dayArcHeight: -1, moonArcHeight: -1 })
  ];

  calls.forEach((call) => assert.doesNotThrow(call));
});

test('graph layout utility matrices cover defensive branches and fallbacks', () => {
  const emptyGraph = { nodes: [], edges: [] };
  assert.equal(computeConcentricLayout(emptyGraph, {}).nodes.length, 0);
  assert.equal(computeGridLayout(emptyGraph, {}).nodes.length, 0);
  assert.equal(computeMDSLayout({ nodes: [{ id: 'solo' }], edges: [] }, { center: [7, 9] }).nodes[0].x, 7);
  assert.deepEqual(runMDS([[0]], 2), [[0, 0]]);
  assert.equal(runMDS([[0, 0], [0, 0]], 2, 12).length, 2);

  const utilityGraph = {
    nodes: [
      { id: 'a', data: { rank: 'z', size: [3, 9] }, x: 'bad', y: 2 },
      { id: 'b', data: { rank: 'a', symbolSize: 4 } },
      { id: 'c', size: 5 },
      { id: 'd', symbolSize: () => 6 }
    ],
    edges: [
      { source: 'a', target: 'b' },
      { source: 'missing', target: 'b' },
      { source: 'c', target: 'd' }
    ]
  };
  const layoutGraph = buildLayoutGraph(utilityGraph);
  assert.equal(layoutGraph.edges.length, 2);

  const distances = allPairsShortestPaths({
    ...layoutGraph,
    edges: [...layoutGraph.edges, { source: 'missing', target: 'a' }]
  });
  assert.equal(distances.length, 4);
  assert.deepEqual(replaceInfinity([[Infinity, Infinity], [Infinity, 0]], 3), [[0, 3], [3, 0]]);

  assert.equal(getNodeSize(layoutGraph.nodes[0], { nodeSpacing: (node) => node.id === 'a' ? 2 : 0 }, {}), 11);
  assert.equal(getNodeSize(layoutGraph.nodes[1], {}, { nodeSpacing: () => 3 }), 7);
  assert.equal(getNodeSize(layoutGraph.nodes[2], { nodeSize: () => 8, nodeSpacing: -1 }, {}), 5);
  assert.equal(getNodeSize(layoutGraph.nodes[3], { nodeSpacing: 2 }, {}), 8);
  assert.equal(getNodeSize({ id: 'fallback', data: {}, __index: 0 }, {}, {}), 20);

  const sorterByData = createSorter('data.rank', degreeMap(layoutGraph));
  assert.ok(sorterByData(layoutGraph.nodes[0]) > sorterByData(layoutGraph.nodes[1]));
  assert.equal(createSorter(Symbol('bad'), degreeMap(layoutGraph))(layoutGraph.nodes[0]), 0);

  assert.equal(computeConcentricLayout(utilityGraph, {
    sortBy: 'data.rank',
    maxLevelDiff: 0.1,
    equidistant: true,
    preventOverlap: false,
    width: 20,
    height: 20,
    nodeSize: 24,
    sweep: 0,
    startAngle: 0,
    clockwise: false
  }).nodes.length, 4);
  assert.equal(computeConcentricLayout({
    nodes: [{ id: 'same-a' }, { id: 'same-b' }],
    edges: []
  }, {
    preventOverlap: true,
    sweep: 0
  }).nodes.length, 2);

  assert.equal(computeGridLayout(utilityGraph, {
    width: 0,
    height: 0,
    rows: 1,
    cols: 1,
    center: ['bad', null],
    position: (node) => node.id === 'a'
      ? { row: 0, col: 0 }
      : node.id === 'b'
        ? { row: 0, col: 0 }
        : node.id === 'c'
          ? { row: -1, col: 2 }
          : null,
    sortBy: 'rank'
  }).nodes.length, 4);
  assert.equal(computeGridLayout(utilityGraph, { rows: 2, cols: 0 }).nodes.length, 4);
  assert.equal(computeGridLayout(utilityGraph, { rows: 0, cols: 2 }).nodes.length, 4);
  assert.equal(gridInternals.assignGridCells([
    { id: 'a', __index: 0 },
    { id: 'b', __index: 1 }
  ], {
    nodes: [
      { id: 'a', __index: 0 },
      { id: 'b', __index: 1 }
    ],
    edges: []
  }, { rows: 1, cols: 1 }, new Map(), {}).size, 1);
  assert.equal(computeMDSLayout(utilityGraph, { preventOverlap: false, linkDistance: 'bad' }).nodes.length, 4);
});

test('radial layout internals cover fast rings, fallback placement, and overlap edge cases', () => {
  const radialGraph = buildLayoutGraph({
    nodes: [
      { id: 'root', value: 10 },
      { id: 'a', value: 8 },
      { id: 'b', value: 6 },
      { id: 'isolated', value: 1 }
    ],
    edges: [
      { source: 'root', target: 'a' },
      { source: 'a', target: 'b' },
      { source: 'missing', target: 'a' }
    ]
  });

  assert.equal(radialLayoutInternals.focusShortestPaths(radialGraph, 0).length, 4);
  assert.deepEqual(radialLayoutInternals.focusShortestPaths({
    nodes: [{ id: 'a' }, { id: 'b' }],
    edges: [{ source: 'missing', target: 'b' }],
    indexById: new Map([['a', 0], ['b', 1]])
  }, 0), [0, Infinity]);
  assert.equal(radialLayoutInternals.computeFastRadialLayout(radialGraph, 0, {
    preventOverlap: true,
    nodeSize: 100,
    maxPreventOverlapIteration: 2
  }, 0, 0, [0, 0]).nodes.length, 4);
  assert.equal(computeRadialLayout({
    nodes: [{ id: 'a' }, { id: 'b' }],
    edges: [{ source: 'a', target: 'b' }]
  }, {
    fast: true,
    focusNode: 'missing',
    width: 120,
    height: 120
  }).nodes.length, 2);
  assert.equal(radialLayoutInternals.computeFastRadialLayout(radialGraph, 0, {
    unitRadius: 24,
    startAngle: 0,
    sweep: Math.PI,
    preventOverlap: false
  }, 120, 120, [60, 60]).nodes.length, 4);

  const idealGraph = buildLayoutGraph({
    nodes: [{ id: 'a', value: 1 }, { id: 'b', value: 3 }, { id: 'c', value: 2 }],
    edges: [{ source: 'a', target: 'b' }]
  });
  const distances = [
    [0, 1, 1],
    [1, 0, 2],
    [1, 2, 0]
  ];
  assert.equal(radialLayoutInternals.radialIdealDistanceMatrix(idealGraph, distances, [10, 10, 20], 10, {
    sortBy: 'data'
  })[0][1] >= 0, true);
  assert.equal(radialLayoutInternals.radialIdealDistanceMatrix(idealGraph, distances, [10, 10, 20], 10, {
    sortBy: 'value'
  })[0][1] >= 0, true);
  assert.equal(radialLayoutInternals.radialIdealDistanceMatrix(idealGraph, distances, [10, 10, 20], 10, {})[0][1] >= 0, true);

  const nodes = [
    { id: 'focus', x: 0, y: 0 },
    { id: 'zero', x: 0, y: 0 },
    { id: 'other', x: 0, y: 0 }
  ];
  radialLayoutInternals.runRadialIterations(nodes, [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ], [0, 0, 0], 0, 0);
  assert.equal(nodes[1].x, 0);

  const fallbackGraph = buildLayoutGraph({
    nodes: [
      { id: 'focus' },
      { id: 'a' },
      { id: 'b' }
    ],
    edges: []
  });
  fallbackGraph.nodes[1].x = NaN;
  fallbackGraph.nodes[1].y = 0;
  fallbackGraph.nodes[2].x = 0;
  fallbackGraph.nodes[2].y = 0;
  radialLayoutInternals.applyRadialFallbacks(fallbackGraph, [0, 30, 30], 0, { sortBy: 'id' });
  assert.equal(Number.isFinite(fallbackGraph.nodes[1].x), true);

  const overlapGraph = buildLayoutGraph({
    nodes: [{ id: 'focus' }, { id: 'a' }, { id: 'b' }],
    edges: []
  });
  overlapGraph.nodes[1].x = 0;
  overlapGraph.nodes[1].y = 0;
  overlapGraph.nodes[2].x = 0;
  overlapGraph.nodes[2].y = 0;
  radialLayoutInternals.preventRadialOverlap(overlapGraph, [0, 0, 0], 0, {
    strictRadial: true,
    nodeSize: 50,
    maxPreventOverlapIteration: 1
  });
  radialLayoutInternals.preventRadialOverlap(overlapGraph, [0, 0, 0], 0, {
    strictRadial: false,
    nodeSize: 50,
    maxPreventOverlapIteration: 1
  });
  assert.equal(Number.isFinite(overlapGraph.nodes[1].x), true);

  assert.deepEqual(radialLayoutInternals.replaceFocusInfinity([
    [0, Infinity],
    [Infinity, 0]
  ], 0, 0), [
    [0, 1],
    [1, 0]
  ]);
  assert.deepEqual(radialLayoutInternals.replaceFocusInfinity([
    [0, Infinity],
    [Infinity, 0]
  ], 0, Infinity), [
    [0, Infinity],
    [Infinity, 0]
  ]);
  assert.equal(radialLayoutInternals.resolveMaxRadius(100, 80, [0, 40]), 40);
  assert.equal(radialLayoutInternals.resolveMaxRadius(100, 80, [50, 0]), 40);
  assert.equal(radialLayoutInternals.maxFinite([Infinity, 3, 2]), 3);
});

test('voronoi treemap internals cover degenerate geometry and option normalization', () => {
  const square = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 }
  ];
  const reversed = [...square].reverse();
  const line = [{ x: 0, y: 0 }, { x: 5, y: 0 }];
  const children = [
    { value: 0 },
    { value: 2 },
    { value: 3 }
  ];

  assert.equal(voronoiInternals.partitionWeightedVoronoi([], children, 1).length, 3);
  assert.equal(voronoiInternals.partitionWeightedVoronoi(square, [{ value: 2 }, { value: 0 }], 2).length, 2);
  assert.equal(voronoiInternals.partitionWeightedVoronoi(square, [{ value: 1000 }, { value: 0.000001 }], 4).length, 2);
  const tinyPolygon = [{ x: 0, y: 0 }, { x: 0.002, y: 0 }, { x: 0, y: 0.002 }];
  assert.equal(voronoiInternals.partitionWeightedVoronoi(tinyPolygon, [{ value: 1 }, { value: 1 }], 2).length, 2);
  const sortRoot = voronoiInternals.normalizeRoot([
    { name: 'Beta', value: 2 },
    { name: 'Alpha', value: 2 }
  ], {});
  voronoiInternals.computeValues(sortRoot, {});
  voronoiInternals.sortChildren(sortRoot, 'name');
  assert.equal(sortRoot.children[0].name, 'Alpha');
  const fallbackSite = voronoiInternals.initialSitePoint([
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 }
  ], { x: 0.5, y: 0.5 }, { minX: 0, minY: 0, maxX: 100, maxY: 100 }, 0, 1);
  assert.ok(Math.abs(fallbackSite.x - 0.5) < 1e-9);
  assert.ok(Math.abs(fallbackSite.y - 0.5) < 1e-9);
  assert.equal(voronoiInternals.clipPolygonByHalfPlane(line, 1, 0, 0).length, 0);
  assert.deepEqual(voronoiInternals.intersection({ x: 1, y: 1 }, { x: 2, y: 2 }, 1, 1), { x: 1, y: 1 });
  assert.ok(voronoiInternals.createFallbackCell(square, { x: 5, y: 5, targetArea: 16 }).length >= 3);
  assert.equal(voronoiInternals.createFallbackCell(square, { x: 5, y: 5, targetArea: 1 }).length, 4);
  assert.ok(voronoiInternals.createFallbackCell(reversed, { x: 5, y: 5, targetArea: 16 }).length >= 3);
  assert.equal(voronoiInternals.createFallbackCell(line, { x: 5, y: 5, targetArea: 0 }).length, 0);
  assert.deepEqual(voronoiInternals.shrinkPolygon(square, 0), square);
  assert.deepEqual(voronoiInternals.shrinkPolygon(line, 4), line);
  assert.equal(voronoiInternals.pointsToPath([]), '');
  assert.equal(voronoiInternals.pointsToPath([[0, 0], [1.5, 0], [1, 1]]), 'M 0 0 L 1.5 0 L 1 1 Z');
  assert.equal(voronoiInternals.signedPolygonArea(line), 0);
  assert.equal(voronoiInternals.polygonArea(line), 0);
  assert.deepEqual(voronoiInternals.polygonCentroid([]), { x: 0, y: 0 });
  assert.deepEqual(voronoiInternals.polygonCentroid(line), { x: 2.5, y: 0 });
  assert.deepEqual(voronoiInternals.polygonBounds(square), { minX: 0, minY: 0, maxX: 10, maxY: 10 });
  assert.equal(voronoiInternals.pointInPolygon({ x: 5, y: 5 }, square), true);
  assert.equal(voronoiInternals.pointInPolygon({ x: 20, y: 5 }, square), false);
  assert.equal(voronoiInternals.cleanPolygon([{ x: 0, y: 0 }, { x: Infinity, y: 1 }, { x: 0, y: 0 }]).length, 0);
  assert.equal(voronoiInternals.cleanPolygon([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 }]).length, 0);

  assert.deepEqual(voronoiInternals.readChildren(null), []);
  assert.deepEqual(voronoiInternals.readChildren({ children: [1] }, 'kids'), [1]);
  assert.equal(voronoiInternals.readField(['A', 'B', 3], 'value', ['name', 'value'], 2, []), 'B');
  assert.equal(voronoiInternals.readField(['A', 'B', 3], 'missing', ['name', 'value'], 2, []), 3);
  assert.equal(voronoiInternals.readField({ nested: { value: 4 } }, 'nested.value', undefined, 0, []), 4);
  assert.equal(voronoiInternals.readField({ amount: 5 }, 'missing', undefined, 0, ['amount']), 5);
  assert.equal(voronoiInternals.readField(null, 'value', undefined, 0, []), undefined);
  assert.equal(voronoiInternals.readPath({ a: 1 }, 'a'), 1);
  assert.equal(voronoiInternals.readPath({ a: 1 }, 'b'), undefined);
  assert.equal(voronoiInternals.readPath({ a: null }, 'a.b'), undefined);
  assert.equal(voronoiInternals.readNonNegativeNumber('7'), 7);
  assert.equal(voronoiInternals.readNonNegativeNumber('-1'), undefined);
  assert.equal(voronoiInternals.readItemColor({ itemStyle: { color: '#abc' } }), '#abc');
  assert.equal(voronoiInternals.readItemColor({ itemStyle: { color: '' } }), undefined);
  assert.equal(voronoiInternals.normalizeName(7, 'fallback'), '7');
  assert.equal(voronoiInternals.normalizeName('', 'fallback'), 'fallback');
  assert.equal(voronoiInternals.normalizeSort(true), true);
  assert.equal(voronoiInternals.normalizeSort('bad'), undefined);
  assert.deepEqual(voronoiInternals.normalizeColors(['#fff', 2, '#000']), ['#fff', '#000']);
  assert.equal(voronoiInternals.normalizeColors('bad'), undefined);
  assert.deepEqual(voronoiInternals.normalizeDimensions(['name', 1, 'value']), ['name', 'value']);
  assert.equal(voronoiInternals.normalizeDimensions('bad'), undefined);
  assert.equal(voronoiInternals.readFieldOption(2), 2);
  assert.equal(voronoiInternals.readFieldOption({}), undefined);
  assert.equal(voronoiInternals.readStringOption('', 'ok'), 'ok');
  assert.equal(voronoiInternals.readBooleanOption('no', false), false);
  assert.equal(voronoiInternals.adjustColor('not-a-color', 2, 1), 'not-a-color');
  assert.deepEqual(voronoiInternals.parseHexColor('#abc'), { r: 170, g: 187, b: 204 });
  assert.equal(voronoiInternals.parseHexColor('bad'), null);
  assert.equal(voronoiInternals.mixChannel(0, 100, 0.25), 25);
  assert.equal(voronoiInternals.rgbToHex(-1, 16, 999), '#0010ff');
  assert.equal(voronoiInternals.finiteNumber('bad', 4), 4);
  assert.equal(voronoiInternals.firstFiniteNumber('bad', 2), 2);
  assert.equal(voronoiInternals.distanceSquared({ x: 0, y: 0 }, { x: 3, y: 4 }), 25);
  assert.equal(voronoiInternals.clamp(9, 0, 5), 5);
  assert.equal(voronoiInternals.round(1.23456, 2), 1.23);
  assert.equal(voronoiInternals.formatPathNumber(1.5), '1.5');
  assert.equal(voronoiInternals.isPlainObject({}), true);
  assert.equal(voronoiInternals.isPlainObject([]), false);
});

test('cartesian, mosaic, pack bubble, nested circle, and venn internals cover edge helpers', () => {
  const beePlot = beeswarmInternals.createPlotRect(100, 80, { top: 10, right: 10, bottom: 10, left: 10 });
  assert.deepEqual(beeswarmInternals.createTicks(2, 8, 1), [2, 8]);
  assert.deepEqual(beeswarmInternals.createOffsetCandidates(3, 1.5), [0, 1.5, -1.5, 3, -3]);
  assert.equal(beeswarmInternals.projectCategory(0, 0, beePlot, 'vertical'), 50);
  assert.equal(beeswarmInternals.niceStep(0.5), 0.5);
  assert.equal(beeswarmInternals.cleanNumber(-0), 0);
  assert.deepEqual(beeswarmInternals.resolveValueExtent([{ value: 4 }], { min: 4, max: 4, nice: false }), { min: 3, max: 5 });
  assert.deepEqual(beeswarmInternals.normalizeFinalExtent(2, 2), { min: 2, max: 3 });
  assert.equal(beeswarmInternals.readField(['A', 'B'], 1, undefined, 0), 'B');
  assert.equal(beeswarmInternals.readField({ fallback: 3 }, 'missing', undefined, 0, ['fallback']), 3);
  assert.equal(beeswarmInternals.chooseSwarmOffset(0, 5, 10, 12, [{ axisCoord: 0, offset: 0, radius: 5 }]), 10);

  const lollipopPlot = lollipopInternals.createPlotRect(100, 80, { top: 10, right: 10, bottom: 10, left: 10 });
  assert.deepEqual(lollipopInternals.createTicks(2, 8, 1), [2, 8]);
  assert.equal(lollipopInternals.projectCategory(0, 0, lollipopPlot), 50);
  assert.deepEqual(lollipopInternals.resolveValueExtent([], { min: 5, max: 2, nice: false }), { min: 2, max: 5 });
  assert.deepEqual(lollipopInternals.resolveValueExtent([{ value: 4 }], { min: 4, max: 4, nice: false }), { min: 3, max: 5 });
  assert.deepEqual(lollipopInternals.normalizeFinalExtent(4, 4), { min: 4, max: 5 });
  assert.equal(lollipopInternals.readField(['A', 'B'], 1, undefined, 0, []), 'B');
  assert.equal(lollipopInternals.readField({ fallback: 3 }, 1, undefined, 0, ['fallback']), undefined);
  assert.deepEqual(lollipopInternals.unique(['a', 'a', 'b']), ['a', 'b']);
  assert.equal(lollipopInternals.stringifyName(7), '7');

  const mosaicItems = mosaicInternals.normalizeItems([
    ['A', 'X', 2],
    ['A', 'X', 3],
    { x: 'B', y: 'Y', value: 4 },
    { fallback: 5 }
  ], {
    dimensions: ['x', 'y', 'value'],
    xField: 'x',
    yField: 'y',
    valueField: 'value'
  });
  const cells = mosaicInternals.mergeCells(mosaicItems);
  const totals = mosaicInternals.sumBy(cells, 'xCategory');
  assert.deepEqual(mosaicInternals.resolveCategories('xCategory', cells, undefined, totals, true), ['A', 'B', '(empty)']);
  assert.equal(mosaicInternals.readField({ fallback: 3 }, 'missing', undefined, 0, ['fallback']), 3);
  assert.equal(mosaicInternals.normalizeCategory(9), '9');
  assert.equal(mosaicInternals.positiveNumber('6', 0), 6);

  const packLeaf = (id, x, y, r, packRadius = r) => ({
    item: { id, name: id, value: r, numericValue: r, category: 'c', dataIndex: 0, color: '#000', raw: {} },
    x,
    y,
    r,
    packRadius
  });
  assert.deepEqual(packBubbleLayoutInternals.layoutFastGrid([], 1, { x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5 }), []);
  const colliding = [packLeaf('a', 0, 0, 2, 2), packLeaf('b', 0, 0, 2, 2)];
  packBubbleLayoutInternals.resolveCollisions(colliding);
  assert.equal(colliding.some((circle) => circle.x !== 0 || circle.y !== 0), true);
  const tangent = packLeaf('c', 0, 0, 1, 1);
  packBubbleLayoutInternals.placeTangent(packLeaf('a', 0, 0, 2, 2), packLeaf('b', 0, 0, 2, 2), tangent);
  assert.equal(tangent.y, 0);
  assert.deepEqual(packBubbleLayoutInternals.fitCircles([], { x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5 }), []);
  assert.deepEqual(packBubbleLayoutInternals.resolveFitOffset({ minX: -2, maxX: 15, minY: -3, maxY: 14, width: 17, height: 17 }, { x: 0, y: 0, width: 10, height: 10 }), { x: -5, y: -4 });
  assert.deepEqual(packBubbleLayoutInternals.measureBounds([]), { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 });
  assert.equal(packBubbleLayoutInternals.clamp(5, 10, 0), 5);
  assert.equal(packBubbleLayoutInternals.resolvePosition('50%', 200, 0), 100);
  assert.equal(packBubbleLayoutInternals.resolvePosition('bad%', 200, 7), 7);
  assert.equal(packBubbleLayoutInternals.readField({ nested: { value: 4 } }, 'nested.value'), 4);

  assert.deepEqual(nestedCircleLayoutInternals.distributeAngles(3, true, 0), [20, 100, 180]);
  assert.deepEqual(nestedCircleLayoutInternals.spreadAngles(0, 0, 10), []);
  assert.equal(nestedCircleLayoutInternals.normalizeAngle(190), -170);
  assert.equal(nestedCircleLayoutInternals.normalizeAngle(-190), 170);
  assert.equal(nestedCircleLayoutInternals.resolveRadius(40, 200, 100, 10), 40);
  assert.equal(nestedCircleLayoutInternals.parsePercent('12', 100, 5), 12);
  assert.equal(nestedCircleLayoutInternals.parsePercent('bad', 100, 5), 5);

  assert.equal(vennLayoutInternals.createHollowCircles(1, ['Only'], { width: 100, height: 80, padding: 10 }).length, 1);
  const directCircle = { id: 'A', name: 'A', setKey: 'A', sets: ['A'], x: 40, y: 40, r: 20, dataIndex: 0 };
  assert.deepEqual(vennLayoutInternals.resolveHollowLabelPoint(['A'], 'A', new Map([['A', directCircle]]), new Map([['A', directCircle]]), { width: 100, height: 80 }), { x: 40, y: 40 });
  assert.equal(vennLayoutInternals.normalizeItems([{ name: 'A', value: [7], sets: ['A'] }])[0].value, 7);
  assert.equal(vennLayoutInternals.clamp(3, 10, 2), 6);
});

test('hierarchical layout internals cover remaining option and degenerate geometry fallbacks', () => {
  assert.equal(resolveVoronoiTreemapLayout({
    data: [{ name: 'A', value: 1 }],
    layout: { width: 220, height: 180, padding: 8, rootName: 'Layout Root' },
    layoutOptions: { gap: 1 }
  }).root.name, 'Layout Root');
  assert.equal(flattenVoronoiTreemapData([{ name: 'A', value: 1 }], 'String Root').length, 1);
  assert.equal(layoutVoronoiTreemap([
    { name: 'B', value: 2 },
    { name: 'A', value: 2 }
  ], { sort: 'name', rootVisible: true }).root.children[0].name, 'A');
  assert.equal(layoutVoronoiTreemap([
    { name: 'Same', value: 1 },
    { name: 'Same', value: 3 }
  ], { sort: 'name', rootVisible: true }).root.children[0].value, 3);
  assert.equal(layoutVoronoiTreemap([
    { name: 'B', value: 1 },
    { name: 'A', value: 1 }
  ], { sort: 'value', rootVisible: true }).root.children[0].name, 'A');
  const voronoiRoot = voronoiInternals.normalizeRoot([{ name: 'child', value: 1 }], { rootName: '' });
  voronoiInternals.computeValues(voronoiRoot, {});
  voronoiInternals.assignColors(voronoiRoot, []);
  assert.equal(typeof voronoiRoot.color, 'string');
  assert.equal(voronoiInternals.normalizeRoot(5, { rootName: '' }).name, 'root');
  assert.equal(voronoiInternals.normalizeRoot({ name: 'object-root', children: [] }, { rootName: 'Fallback' }).name, 'Fallback');
  assert.equal(voronoiInternals.initialSitePoint([], { x: 3, y: 4 }, { minX: 0, minY: 0, maxX: 10, maxY: 10 }, 0, 1).x, 3);
  const polygon = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 }
  ];
  assert.deepEqual(voronoiInternals.createFallbackCell(polygon, { x: 1000, y: 1000, targetArea: 16 }), polygon);
  const publicNode = voronoiInternals.toPublicNode({
    id: 'root',
    name: 'Root',
    value: 0,
    depth: 0,
    parent: null,
    children: [],
    points: polygon,
    targetArea: 0,
    dataIndex: -1,
    color: '#000',
    raw: {},
    synthetic: false
  }, 0);
  assert.equal(publicNode.percent, 0);
  const zeroChildRoot = {
    id: 'root',
    name: 'root',
    value: 0,
    depth: 0,
    parent: null,
    children: [
      { id: 'child', name: 'child', value: 0, depth: 1, parent: null, children: [], points: [], targetArea: 0, dataIndex: 0, color: '#000', raw: {}, synthetic: false }
    ],
    points: polygon,
    targetArea: 0,
    dataIndex: -1,
    color: '#000',
    raw: {},
    synthetic: true
  };
  zeroChildRoot.children[0].parent = zeroChildRoot;
  voronoiInternals.layoutChildren(zeroChildRoot, { gap: 999, maxIteration: 1 });
  assert.equal(zeroChildRoot.children[0].points.length >= 3, true);
  const zeroWeightRoot = {
    ...zeroChildRoot,
    children: [
      { ...zeroChildRoot.children[0], id: 'zero-a', value: 0, points: [] },
      { ...zeroChildRoot.children[0], id: 'zero-b', value: 0, points: [] }
    ],
    points: polygon
  };
  zeroWeightRoot.children.forEach((child) => {
    child.parent = zeroWeightRoot;
  });
  voronoiInternals.layoutChildren(zeroWeightRoot, { gap: 0, maxIteration: 1 });
  assert.equal(zeroWeightRoot.children.every((child) => child.points.length >= 3), true);
  assert.equal(voronoiInternals.partitionWeightedVoronoi(polygon, [{ value: 1 }, { value: 1 }], 0).length, 2);
  assert.equal(voronoiInternals.shrinkPolygon([
    { x: 1, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 1 }
  ], 2).length, 0);
  assert.equal(voronoiInternals.shrinkPolygon(polygon, 999).length, 4);
  assert.equal(voronoiInternals.readField(['A', 'B'], 1, undefined, 0, []), 'B');
  assert.equal(voronoiInternals.readField({ fallback: 'ok' }, 1, undefined, 0, ['fallback']), 'ok');
  assert.equal(voronoiInternals.readBooleanOption('bad'), undefined);

  assert.equal(layoutCirclePacking([], { rootVisible: true }).nodes.length, 1);
  assert.equal(layoutCirclePacking(5, { rootName: '' }).root.name, 'root');
  assert.equal(layoutCirclePacking([
    { name: 'B', value: 2 },
    { name: 'A', value: 2 }
  ], { sort: 'name', rootVisible: true }).root.children[0].name, 'A');
  assert.equal(layoutCirclePacking([
    { name: 'Same', value: 1 },
    { name: 'Same', value: 3 }
  ], { sort: 'name', rootVisible: true }).root.children[0].value, 3);
  assert.equal(layoutCirclePacking([
    { name: 'B', value: 1 },
    { name: 'A', value: 1 }
  ], { sort: 'asc', rootVisible: true }).root.children[0].name, 'A');
  assert.equal(circlePackingInternals.resolveRadius('bad%', { x: 0, y: 0, width: 100, height: 80 }), 40);
  const circleChain = Array.from({ length: 20 }, (_, index) => ({
    node: {
      id: `c${index}`,
      name: `c${index}`,
      explicitValue: 1,
      value: 1,
      depth: 0,
      parent: null,
      children: [],
      dataIndex: index,
      localX: 0,
      localY: 0,
      localRadius: 1,
      x: 0,
      y: 0,
      r: 1,
      color: '#000',
      raw: {},
      synthetic: false
    },
    x: 0,
    y: 0,
    r: 1 + ((index * 7) % 9),
    packRadius: 1 + ((index * 7) % 9)
  }));
  circlePackingInternals.packFrontChain(circleChain, 0);
  assert.equal(circleChain.length, 20);

  assert.equal(resolvePackBubbleLayout({ data: 'bad', center: [10, 20] }).circles.length, 0);
  const packBubbleLeaf = (id, x, y, r, packRadius = r) => ({
    item: { id, name: id, value: r, numericValue: r, category: 'c', dataIndex: 0, color: '#000', raw: {} },
    x,
    y,
    r,
    packRadius
  });
  const zeroGrid = packBubbleLayoutInternals.layoutFastGrid([
    { item: { id: 'zero' }, x: 0, y: 0, r: 0, packRadius: 0 }
  ], 0, { x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5 });
  assert.equal(zeroGrid[0].r, 0);
  assert.equal(packBubbleLayoutInternals.scoreFrontChainNode({
    circle: { x: 0, y: 0, packRadius: 0 },
    next: { circle: { x: 1, y: 1, packRadius: 0 } }
  }), 0);
  const packChain = Array.from({ length: 20 }, (_, index) => ({
    item: { id: `p${index}`, name: `p${index}`, value: 1, numericValue: 1, category: '', dataIndex: index, color: '#000', raw: {} },
    x: 0,
    y: 0,
    r: 1 + ((index * 5) % 11),
    packRadius: 1 + ((index * 5) % 11)
  }));
  packBubbleLayoutInternals.packFrontChain(packChain, 0);
  assert.equal(packChain.length, 20);
  const sneakyPackCircle = {
    item: { id: 'sneaky-b', name: 'sneaky-b', value: 1, numericValue: 1, category: '', dataIndex: 1, color: '#000', raw: {} },
    x: 0,
    y: 0,
    r: 1,
    packRadius: 1
  };
  installTemporaryPackRadiusSpike(sneakyPackCircle, 5, 2, 100);
  const rewoundPackChain = [
    packBubbleLeaf('sneaky-a', 0, 0, 1, 1),
    sneakyPackCircle,
    packBubbleLeaf('sneaky-c', 0, 0, 1, 1),
    packBubbleLeaf('sneaky-d', 0, 0, 1, 1),
    packBubbleLeaf('sneaky-e', 0, 0, 1, 1)
  ];
  packBubbleLayoutInternals.packFrontChain(rewoundPackChain, 0);
  assert.equal(rewoundPackChain.length, 5);
  for (let seed = 0; seed < 16; seed += 1) {
    const varied = Array.from({ length: 12 }, (_, index) => {
      const radius = 1 + ((seed * 13 + index * 5) % 19);
      return {
        item: { id: `pv${seed}-${index}`, name: `pv${seed}-${index}`, value: 1, numericValue: 1, category: '', dataIndex: index, color: '#000', raw: {} },
        x: 0,
        y: 0,
        r: radius,
        packRadius: radius
      };
    });
    packBubbleLayoutInternals.packFrontChain(varied, seed % 4);
    assert.equal(varied.every((circle) => Number.isFinite(circle.x) && Number.isFinite(circle.y)), true);
  }

  assert.equal(resolveMosaicLayout({
    data: [['A', 'X', 1]],
    layout: { width: 120, height: 90, padding: 2 }
  }).width, 600);
  assert.equal(resolveMosaicLayout({ data: 'bad' }).tiles.length, 0);
  assert.equal(mosaicInternals.readField({ fallback: 3 }, 0, undefined, 0, ['fallback']), undefined);
  assert.deepEqual(mosaicInternals.resolveCategories('xCategory', [
    { xCategory: 'B', yCategory: 'Y', value: 1 },
    { xCategory: 'A', yCategory: 'Y', value: 1 }
  ], undefined, { A: 1, B: 1 }, true), ['A', 'B']);
  assert.equal(mosaicInternals.positiveNumber('bad', 7), 7);
});

test('cartesian layout internals cover remaining extent and collision fallbacks', () => {
  assert.equal(resolveBeeswarmLayout({
    data: [{ category: 'A', value: 1 }],
    layout: { width: 240, height: 160, padding: 4 }
  }).width, 240);
  assert.equal(resolveBeeswarmLayout({ data: 'bad' }).points.length, 0);
  assert.deepEqual(beeswarmInternals.resolveValueExtent([{ value: 4 }], {
    min: 4,
    max: 4,
    nice: true
  }), { min: 3, max: 5 });
  assert.deepEqual(beeswarmInternals.resolveValueExtent([{ value: 2 }, { value: 8 }], {
    nice: true,
    tickCount: 3
  }), { min: 0, max: 10 });
  assert.deepEqual(beeswarmInternals.resolveValueExtent([{ value: 2 }, { value: 8 }], {
    min: 9,
    max: 1,
    nice: false
  }), { min: 1, max: 9 });
  assert.deepEqual(beeswarmInternals.resolveValueExtent([{ value: 2 }, { value: 8 }], {
    min: 1,
    nice: true,
    tickCount: 3
  }), { min: 1, max: 10 });
  assert.deepEqual(beeswarmInternals.resolveValueExtent([{ value: 2 }, { value: 8 }], {
    max: 9,
    nice: true,
    tickCount: 3
  }), { min: 0, max: 9 });
  assert.deepEqual(beeswarmInternals.orderByCategory([
    { category: 'B', dataIndex: 2 },
    { category: 'A', dataIndex: 1 },
    { category: 'missing', dataIndex: 0 }
  ], ['A', 'B']).map((item) => item.category), ['A', 'B']);
  assert.equal(beeswarmInternals.chooseSwarmOffset(0, 10, 100, 0, [{
    axisCoord: 0,
    offset: 0,
    radius: 10
  }]), 0);
  assert.deepEqual(beeswarmInternals.layoutPoints([
    { id: 'b', name: 'B', category: 'A', categoryValue: 'A', value: 1, radius: 1, dataIndex: 2, raw: {} },
    { id: 'a', name: 'A', category: 'A', categoryValue: 'A', value: 1, radius: 1, dataIndex: 1, raw: {} }
  ], ['A', 'Empty'], { min: 0, max: 2 }, beeswarmInternals.createPlotRect(100, 80, 0), 'horizontal', {}).map((point) => point.id), ['a', 'b']);
  assert.equal(beeswarmInternals.readField(['A'], 'missing', [], -1, []), undefined);
  assert.equal(beeswarmInternals.niceStep(0.1), 0.1);
  assert.equal(Object.is(beeswarmInternals.cleanNumber(-1e-13), 0), true);

  assert.equal(resolveLollipopLayout({
    data: [['A', 1]],
    layout: { width: 260, height: 180, padding: 6 }
  }).width, 260);
  assert.equal(resolveLollipopLayout({ data: 'bad' }).points.length, 0);
  assert.deepEqual(lollipopInternals.resolveValueExtent([], {
    min: 2,
    max: 2,
    nice: true
  }, 2), { min: 1, max: 3 });
  assert.deepEqual(lollipopInternals.resolveValueExtent([{ value: 2 }, { value: 8 }], {
    nice: true,
    tickCount: 3
  }, 0), { min: 0, max: 10 });
  assert.deepEqual(lollipopInternals.resolveValueExtent([{ value: 2 }, { value: 8 }], {
    min: 1,
    nice: true,
    tickCount: 3
  }, 0), { min: 1, max: 10 });
  assert.deepEqual(lollipopInternals.resolveValueExtent([{ value: 2 }, { value: 8 }], {
    max: 9,
    nice: true,
    tickCount: 3
  }, 0), { min: 0, max: 9 });
  assert.deepEqual(lollipopInternals.orderByCategory([
    { category: 'missing', dataIndex: 0 },
    { category: 'B', dataIndex: 2 },
    { category: 'A', dataIndex: 1 }
  ], ['A', 'B']).map((item) => item.category), ['A', 'B']);
  assert.equal(lollipopInternals.niceStep(0.1), 0.1);
  assert.equal(lollipopInternals.niceStep(3), 5);
  assert.equal(lollipopInternals.niceStep(8), 10);
  assert.equal(lollipopInternals.readField(['A'], 'missing', [], -1, []), undefined);
  assert.equal(Object.is(lollipopInternals.cleanNumber(-1e-13), 0), true);
});

test('polar layout internals cover explicit extent and angle fallback branches', () => {
  const radialItems = [
    { name: 'B', angleValue: 'B', angleNumeric: NaN, value: 2, min: 1, max: 3, dataIndex: 1, raw: {} },
    { name: 'A', angleValue: 'A', angleNumeric: NaN, value: 4, min: 2, max: 6, dataIndex: 0, raw: {} }
  ];
  const categoryDomain = radialAreaInternals.resolveAngleDomain(radialItems, {
    angleType: 'category',
    categories: ['A', 'B']
  });
  assert.deepEqual(radialAreaInternals.orderByAngle(radialItems, categoryDomain, {}).map((item) => item.name), ['A', 'B']);
  const nameFallbackDomain = radialAreaInternals.resolveAngleDomain([
    { name: 'Fallback A', angleValue: undefined, angleNumeric: NaN, value: 1, dataIndex: 0, raw: {} }
  ], { angleType: 'category' });
  assert.deepEqual(nameFallbackDomain.categories, ['Fallback A']);
  assert.deepEqual(radialAreaInternals.resolveAngleDomain([], { angleType: 'value' }), {
    type: 'value',
    categories: [],
    min: 0,
    max: 1
  });
  assert.deepEqual(radialAreaInternals.orderByAngle([
    { angleNumeric: 2, dataIndex: 2 },
    { angleNumeric: 2, dataIndex: 1 }
  ], { type: 'value', categories: [], min: 0, max: 3 }, {}).map((item) => item.dataIndex), [1, 2]);
  assert.equal(radialAreaInternals.resolveAngleRatio({ name: 'missing', angleValue: 'missing', angleNumeric: NaN }, categoryDomain), 0);
  assert.equal(radialAreaInternals.resolveAngleRatio({ name: 'A', angleValue: undefined, angleNumeric: NaN }, categoryDomain), 0);
  assert.equal(radialAreaInternals.resolveAngleRatio({ angleNumeric: 5 }, {
    type: 'value',
    min: 5,
    max: 5,
    categories: []
  }), 0);
  assert.deepEqual(radialAreaInternals.resolveValueExtent(radialItems, {
    min: 10,
    max: 0,
    nice: false
  }), { min: 0, max: 10 });
  assert.deepEqual(radialAreaInternals.resolveValueExtent([{ value: 0, dataIndex: 0 }], { nice: false }), { min: -0.5, max: 0.5 });
  assert.deepEqual(radialAreaInternals.resolveValueExtent(radialItems, { min: 1, nice: true, tickCount: 3 }).min, 1);
  assert.deepEqual(radialAreaInternals.normalizeRange(9, 3), { min: 3, max: 9 });
  assert.equal(radialAreaInternals.normalizeRange(NaN, 3), undefined);
  assert.equal(radialAreaInternals.numericAngleValue(new Date('2020-01-01T00:00:00Z')), Date.parse('2020-01-01T00:00:00Z'));
  assert.equal(radialAreaInternals.inferAngleType([{ angleNumeric: Date.parse('2020-01-01'), angleValue: '2020-01-01' }]), 'time');
  assert.equal(radialAreaInternals.inferAngleType([{ angleNumeric: 2, angleValue: 2 }]), 'value');
  assert.deepEqual(radialAreaInternals.createRangePolygon(radialAreaInternals.normalizeItems([
    ['A', 4, 1, 6],
    ['B', 5, 2, 7]
  ], {
    dimensions: ['name', 'value', 'min', 'max']
  }).map((item) => radialAreaInternals.createPoint(item, categoryDomain, { min: 0, max: 10 }, 4, 20, 0, 0, 0, 180, false)), true).length, 4);
  assert.deepEqual(radialAreaInternals.createAngleLabels({ type: 'category', categories: [], min: 0, max: 1 }, [], 0, 0, 10, 0, 90, false), []);
  assert.equal(radialAreaInternals.niceNumber(6, false), 10);
  assert.equal(radialAreaInternals.projectRadius(5, { min: 5, max: 5 }, 10, 20), 10);
  assert.deepEqual(radialAreaInternals.labelPlacement(180), { align: 'right', verticalAlign: 'middle' });
  assert.equal(radialAreaInternals.readField(['A'], 'missing', [], -1, []), undefined);
  assert.equal(radialAreaInternals.readField(['A', 'B'], 'missing', undefined, 1, []), 'B');
  assert.deepEqual(radialAreaInternals.readTuple(['x', 'y'], undefined), ['x', 'y']);

  const boxItems = [
    { name: 'B', categoryValue: 'B', min: 1, q1: 2, median: 3, q3: 4, max: 5, dataIndex: 1, raw: {} },
    { name: 'A', categoryValue: 'A', min: 1, q1: 2, median: 3, q3: 4, max: 5, dataIndex: 0, raw: {} },
    { name: 'Z', categoryValue: 'Z', min: 1, q1: 2, median: 3, q3: 4, max: 5, dataIndex: 2, raw: {} }
  ];
  assert.deepEqual(radialBoxplotInternals.resolveCategories(boxItems, { categories: ['A', 'B'] }), ['A', 'B']);
  assert.deepEqual(radialBoxplotInternals.resolveCategories([{ name: 'Named', categoryValue: undefined }], {}), ['Named']);
  assert.deepEqual(radialBoxplotInternals.orderByCategory(boxItems, ['A', 'B']).map((item) => item.name), ['A', 'B', 'Z']);
  assert.deepEqual(radialBoxplotInternals.resolveValueExtent(boxItems, {
    min: 10,
    max: 0,
    nice: false
  }), { min: 0, max: 10 });
  assert.deepEqual(radialBoxplotInternals.resolveValueExtent([{ min: 0, q1: 0, median: 0, q3: 0, max: 0 }], { nice: false }), { min: -0.5, max: 0.5 });
  assert.equal(radialBoxplotInternals.resolveValueExtent(boxItems, { min: 1, nice: true, tickCount: 3 }).min, 1);
  assert.equal(radialBoxplotInternals.createBox({
    name: 'Named',
    categoryValue: undefined,
    min: 0,
    q1: 1,
    median: 2,
    q3: 3,
    max: 4,
    dataIndex: 0,
    raw: {}
  }, [], { min: 0, max: 4 }, 4, 20, 0, 0, 0, 90, true, 0.5, 0.5).name, 'Named');
  assert.equal(radialBoxplotInternals.arcPath(0, 0, 10, 0, 270, false).includes(' 1 0 '), true);
  assert.equal(radialBoxplotInternals.niceNumber(6, false), 10);
  assert.equal(radialBoxplotInternals.projectRadius(5, { min: 5, max: 5 }, 10, 20), 10);
  assert.deepEqual(radialBoxplotInternals.labelPlacement(270), { align: 'center', verticalAlign: 'top' });
  assert.equal(radialBoxplotInternals.tangentialTextRotation(270), 0);
  assert.equal(radialBoxplotInternals.readField(['A', 'B', 3], 'missing', ['name'], 2, []), 3);
  assert.equal(radialBoxplotInternals.readField(['A'], 'missing', [], -1, []), undefined);
  assert.equal(radialBoxplotInternals.readField(['A', 'B'], 'missing', undefined, 1, []), 'B');
  assert.equal(radialBoxplotInternals.readField({ fallback: 4 }, 'missing', undefined, 0, ['fallback']), 4);
});

test('subway layout and route internals cover projection, parsing, and shared segment edges', () => {
  assert.equal(resolveSubwayLayout({
    data: [{
      id: 'from-data',
      stations: [[0, 0], [10, 0]]
    }],
    colors: ['#111', 2],
    layout: { width: 200, height: 120, preserveAspectRatio: true },
    layoutOptions: null
  }).routes[0].id, 'from-data');
  assert.equal(subwayLayoutInternals.normalizeRoutes([
    {
      id: 'data-route',
      data: [
        [0, 0, null, undefined, 'top', true],
        ['b', 'Bee', 10, 0, 'bottom', false],
        { id: 'c', coord: [20, 0], labelPosition: 'left' },
        { id: 'v', value: [30, 0] },
        { id: 'xy', x: 40, y: 0 },
        ['bad']
      ],
      waypoints: [
        ['data-route:1'],
        ['b', 12, 0],
        ['missing'],
        [16, 4],
        { id: 'c' },
        { coord: [20, 8] },
        { value: [24, 8] },
        { x: 28, y: 8 }
      ]
    },
    null,
    { id: 'empty' }
  ]).length, 1);

  assert.deepEqual(subwayLayoutInternals.parseArrayStation([1, 2, null, undefined, 'top', true], 'fallback'), {
    id: 'fallback',
    name: 'fallback',
    x: 1,
    y: 2,
    labelPosition: 'top',
    interchange: true
  });
  assert.deepEqual(subwayLayoutInternals.parseArrayStation(['id', '', 3, 4, 'left', true]), {
    id: 'id',
    name: 'id',
    x: 3,
    y: 4,
    labelPosition: 'left',
    interchange: true
  });
  assert.equal(subwayLayoutInternals.parseArrayStation(['bad']), null);
  assert.equal(subwayLayoutInternals.normalizeStation({ coord: ['bad', 0] }, 'r', 0), null);

  const stationById = new Map([
    ['a', { id: 'a', name: 'A', x: 1, y: 2, raw: {} }],
    ['r:2', { id: 'r:2', name: 'Fallback', x: 3, y: 4, raw: {} }]
  ]);
  assert.deepEqual(subwayLayoutInternals.parseArrayPathPoint(['a'], stationById), { x: 1, y: 2, stationId: 'a' });
  assert.deepEqual(subwayLayoutInternals.parseArrayPathPoint(['a', 5, 6], stationById), { x: 5, y: 6, stationId: 'a' });
  assert.deepEqual(subwayLayoutInternals.parseArrayPathPoint(['missing', 5, 6], stationById), { x: 5, y: 6, stationId: undefined });
  assert.deepEqual(subwayLayoutInternals.parseArrayPathPoint([7, 8], stationById), { x: 7, y: 8 });
  assert.equal(subwayLayoutInternals.parseArrayPathPoint(['missing'], stationById), null);
  assert.deepEqual(subwayLayoutInternals.normalizePathPoint({ stationId: 'a' }, stationById, 'r', 0), { x: 1, y: 2, stationId: 'a' });
  assert.deepEqual(subwayLayoutInternals.normalizePathPoint({ x: 9, y: 10 }, stationById, 'r', 1), { x: 9, y: 10, stationId: 'r:2' });
  assert.equal(subwayLayoutInternals.normalizePathPoint({ x: 'bad', y: 0 }, stationById, 'r', 2), null);

  const merged = subwayLayoutInternals.mergeStations(subwayLayoutInternals.normalizeRoutes([
    { id: 'r1', stations: [{ id: 'a', coord: [0, 0], labelPosition: 'right' }] },
    { id: 'r1', stations: [{ id: 'a', coord: [0, 0], labelPosition: 'bottom' }] },
    { id: 'r2', stations: [{ id: 'a', coord: [1, 1], labelPosition: 'left', interchange: true }] }
  ]));
  assert.deepEqual(merged.get('a').lines, ['r1', 'r2']);
  assert.equal(merged.get('a').labelPosition, 'right');
  assert.equal(merged.get('a').interchange, true);
  assert.deepEqual(subwayLayoutInternals.collectRawPoints([], new Map()), []);
  assert.deepEqual(subwayLayoutInternals.computeExtent([]), { minX: 0, minY: 0, maxX: 0, maxY: 0 });
  assert.deepEqual(subwayLayoutInternals.computeExtent([[2, 3], [-1, 9]]), { minX: -1, minY: 3, maxX: 2, maxY: 9 });

  const zeroProject = subwayLayoutInternals.createProjector({ minX: 5, minY: 6, maxX: 5, maxY: 6 }, 100, 80, 10, false);
  assert.deepEqual(zeroProject(5, 6), { x: 50, y: 40 });
  const freeProject = subwayLayoutInternals.createProjector({ minX: 0, minY: 0, maxX: 10, maxY: 20 }, 100, 80, 10, false);
  assert.deepEqual(freeProject(10, 20), { x: 90, y: 70 });

  assert.deepEqual(subwayLayoutInternals.readCoord({ coord: [1, 2] }), [1, 2]);
  assert.deepEqual(subwayLayoutInternals.readCoord({ value: [3, 4] }), [3, 4]);
  assert.deepEqual(subwayLayoutInternals.readCoord({ x: 5, y: 6 }), [5, 6]);
  assert.equal(subwayLayoutInternals.readCoord({ coord: ['bad', 2] }), null);
  assert.equal(subwayLayoutInternals.autoLabelPosition(80, 100), 'left');
  assert.equal(subwayLayoutInternals.autoLabelPosition(20, 100), 'right');
  assert.equal(subwayLayoutInternals.normalizeOptionalId(null), undefined);
  assert.equal(subwayLayoutInternals.normalizeId(null), 'station');
  assert.equal(subwayLayoutInternals.normalizeName('', 'fallback'), 'fallback');
  assert.equal(subwayLayoutInternals.firstBoolean('x', false, true), false);
  assert.equal(subwayLayoutInternals.isPlainObject([]), false);
  assert.deepEqual(subwayLayoutInternals.asRecord(null), {});

  assert.equal(createRoundedRoutePath([], 6), '');
  assert.equal(createRoundedRoutePath([{ x: Infinity, y: 0 }, { x: 1, y: 1 }], 6), 'M1 1');
  assert.equal(createRoundedRoutePath([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 }], 6), 'M0 0L10 0L20 0');
  assert.deepEqual(createRoutePathShape([{ x: 0, y: 0 }, { x: NaN, y: 1 }, { x: 2, y: 2, stationId: 's' }], -1), {
    points: [[0, 0, 0], [2, 2, 1]],
    cornerRadius: 0
  });

  const commands = [];
  const ctx = {
    moveTo: (x, y) => commands.push(['M', x, y]),
    lineTo: (x, y) => commands.push(['L', x, y]),
    quadraticCurveTo: (cpx, cpy, x, y) => commands.push(['Q', cpx, cpy, x, y])
  };
  buildRoundedRoutePathShape(ctx, { points: [], cornerRadius: 5 });
  assert.equal(commands.length, 0);
  buildRoundedRoutePathShape(ctx, { points: [[0, 0, 0]], cornerRadius: 5 });
  assert.deepEqual(commands.at(-1), ['M', 0, 0]);
  buildRoundedRoutePathShape(ctx, { points: [[0, 0, 0], [10, 0, 1], [10, 10, 0]], cornerRadius: 5 });
  assert.deepEqual(commands.slice(-3).map((command) => command[0]), ['M', 'L', 'L']);
  buildRoundedRoutePathShape(ctx, { points: [[0, 0, 0], [10, 0, 0], [10, 10, 0]], cornerRadius: 5 });
  assert.equal(commands.at(-2)[0], 'Q');
  assert.equal(routePathInternals.vector({ x: 3, y: 4 }, { x: 0, y: 0 }).length, 5);
  assert.equal(routePathInternals.isStraight({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }), true);
  assert.equal(routePathInternals.isStraight({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }), false);
  assert.equal(routePathInternals.lineTo({ x: 1.23456, y: -0 }), 'L1.235 0');
  assert.equal(routePathInternals.finiteNumber('bad', 4), 4);

  const sharedOffsets = resolveSharedSegmentOffsets([
    { id: 'b', lineWidth: 4, points: [{ x: 0, y: 0 }, { x: 10, y: 0 }] },
    { id: 'a', lineWidth: 6, points: [{ x: 10, y: 0 }, { x: 0, y: 0 }] },
    { id: 'tie', lineWidth: 5, points: [{ x: 0, y: 2 }, { x: 10, y: 2 }, { x: 0, y: 2 }] },
    { id: 'same', lineWidth: 6, points: [{ x: 1, y: 1 }, { x: 1, y: 1 }] },
    { id: 'same-2', lineWidth: 6, points: [{ x: 1, y: 1 }, { x: 1, y: 1 }] },
    { id: 'bad', lineWidth: 6, points: [{ x: Infinity, y: 0 }, { x: 1, y: 1 }] }
  ]);
  assert.equal(sharedOffsets.size, 4);
  assert.equal(sharedOffsets.has(routeSegmentOffsetKey('a', 0)), true);
  assert.deepEqual(routeSegmentInternals.uniqueSegmentEntries([
    { routeId: 'r', segmentIndex: 0 },
    { routeId: 'r', segmentIndex: 0 },
    { routeId: 'r', segmentIndex: 1 }
  ]).map((entry) => entry.segmentIndex), [0, 1]);
  assert.equal(
    routeSegmentInternals.canonicalSegmentKey({ x: 0, y: 0 }, { x: 1, y: 1 }),
    routeSegmentInternals.canonicalSegmentKey({ x: 1, y: 1 }, { x: 0, y: 0 })
  );
  assert.deepEqual(routeSegmentInternals.canonicalSegmentPoints({ x: 2, y: 0 }, { x: 1, y: 0 }).start, { x: 1, y: 0 });
  assert.equal(routeSegmentInternals.pointKey({ x: 1.23456, y: 2, stationId: 's' }), 'station:s');
  assert.equal(routeSegmentInternals.pointKey({ x: 1.23456, y: 2 }), 'coord:1.235,2');
  assert.equal(routeSegmentInternals.samePoint({ x: 1.0004, y: 2 }, { x: 1.00049, y: 2 }), true);
  assert.equal(routeSegmentInternals.isDrawablePoint({ x: NaN, y: 0 }), false);
  const noLengthOffsets = new Map();
  routeSegmentInternals.assignSegmentGroupOffsets(noLengthOffsets, {
    start: { x: 1, y: 1 },
    end: { x: 1, y: 1 },
    entries: [
      { routeId: 'a', segmentIndex: 0, lineWidth: 2, start: { x: 1, y: 1 }, end: { x: 1, y: 1 } },
      { routeId: 'b', segmentIndex: 0, lineWidth: 2, start: { x: 1, y: 1 }, end: { x: 1, y: 1 } }
    ]
  });
  assert.equal(noLengthOffsets.size, 0);
});

test('sunrise-sunset layout internals cover data, time, cycle, and path boundaries', () => {
  const base = new Date(2026, 4, 6, 12, 0, 0).getTime();
  const fallback = new Date(2026, 4, 7, 12, 0, 0).getTime();
  assert.deepEqual(sunriseLayoutInternals.readDataOption([null, { title: 'From data' }]), { title: 'From data' });
  assert.deepEqual(sunriseLayoutInternals.readDataOption({ title: 'Object' }), { title: 'Object' });
  assert.deepEqual(sunriseLayoutInternals.readDataOption('bad'), {});
  assert.deepEqual(sunriseLayoutInternals.definedEventOption({
    sunrise: '06:00',
    sunset: null,
    moonrise: undefined,
    title: ''
  }), {
    sunrise: '06:00',
    title: ''
  });

  assert.equal(sunriseLayoutInternals.parseTime(new Date(base), undefined, fallback), base);
  assert.equal(sunriseLayoutInternals.parseTime(new Date('bad'), undefined, fallback), fallback);
  assert.equal(sunriseLayoutInternals.parseTime(60, base, fallback), sunriseLayoutInternals.localTime(base, 1, 0, 0));
  assert.equal(sunriseLayoutInternals.parseTime(99_999_999, base, fallback), 99_999_999);
  assert.equal(sunriseLayoutInternals.parseTime('', base, fallback), fallback);
  assert.equal(sunriseLayoutInternals.parseTime('25:99', base, fallback), fallback);
  assert.equal(sunriseLayoutInternals.parseTime('06:05:07', base, fallback), sunriseLayoutInternals.localTime(base, 6, 5, 7));
  assert.equal(sunriseLayoutInternals.parseTime('2026-05-06 02:03:04', base, fallback), new Date(2026, 4, 6, 2, 3, 4).getTime());
  assert.equal(sunriseLayoutInternals.parseTime('2026/05/06', base, fallback), new Date(2026, 4, 6).getTime());
  assert.equal(sunriseLayoutInternals.parseTime('not a date', base, fallback), fallback);

  const sunrise = sunriseLayoutInternals.localTime(base, 18, 0, 0);
  const sunset = sunriseLayoutInternals.localTime(base, 6, 0, 0);
  const daytime = sunriseLayoutInternals.resolveDayCycle(sunrise, sunset, sunriseLayoutInternals.localTime(base, 20, 0, 0));
  assert.equal(daytime.wraps, true);
  assert.equal(daytime.isDaylight, true);
  const moon = sunriseLayoutInternals.resolveMoonCycle(
    sunriseLayoutInternals.localTime(base, 21, 0, 0),
    sunriseLayoutInternals.localTime(base, 5, 0, 0),
    sunriseLayoutInternals.localTime(base, 2, 0, 0)
  );
  assert.equal(moon.wraps, true);
  assert.equal(moon.visible, true);

  const geometry = { startX: 0, endX: 100, baselineY: 50, height: 20 };
  const emptyArc = sunriseLayoutInternals.createArcLayout(geometry, 0, false, false, 0);
  assert.equal(emptyArc.solidPath, '');
  assert.equal(emptyArc.dashedPath.startsWith('M '), true);
  assert.equal(emptyArc.areaPath, '');
  const fullArc = sunriseLayoutInternals.createArcLayout(geometry, 1, true, true, 720);
  assert.equal(fullArc.dashedPath, '');
  assert.equal(fullArc.areaPath.endsWith(' Z'), true);
  assert.deepEqual(sunriseLayoutInternals.createAreaPoints(geometry, []).slice(-2), [
    { x: 0, y: 50 },
    { x: 0, y: 50 }
  ]);
  assert.equal(sunriseLayoutInternals.createMotionPoints(geometry, 0).length, 2);
  assert.deepEqual(sunriseLayoutInternals.pointOnArc(geometry, -1), { x: 0, y: 50 });
  assert.equal(sunriseLayoutInternals.pointsToPath([]), '');
  assert.equal(sunriseLayoutInternals.pointsToAreaPath([{ x: 0, y: 0 }, { x: 1, y: 1 }]), '');
  assert.equal(sunriseLayoutInternals.formatDuration(-1), '00:00:00');
  assert.equal(sunriseLayoutInternals.formatUpdatedText(undefined), '');
  assert.equal(sunriseLayoutInternals.formatUpdatedText(NaN), '');
  assert.equal(sunriseLayoutInternals.formatUpdatedText(base).startsWith('更新于'), true);
  assert.equal(sunriseLayoutInternals.pad2(7), '07');
  assert.equal(sunriseLayoutInternals.formatNumber(-0.0001), '0');
  assert.equal(sunriseLayoutInternals.finiteNumber('bad', 3), 3);
  assert.equal(sunriseLayoutInternals.finiteNumber('bad', undefined), undefined);
  assert.equal(sunriseLayoutInternals.clamp(9, 0, 5), 5);
  assert.equal(sunriseLayoutInternals.isPlainObject([]), false);
});

test('layout private helpers cover additional branch fallback matrices', () => {
  assert.equal(beeswarmInternals.finiteNumber('bad', 9), 9);
  assert.equal(lollipopInternals.resolveValueExtent([{ value: 2 }, { value: 8 }], {}, 0).max, 8);
  assert.deepEqual(lollipopInternals.orderByCategory([
    { category: 'A', dataIndex: 2 },
    { category: 'A', dataIndex: 1 }
  ], ['A']).map((item) => item.dataIndex), [1, 2]);

  assert.equal(resolveFlameLayout({
    data: [{ name: 'A', value: 1 }],
    layout: { width: 240 },
    rootName: ''
  }).width, 600);
  assert.equal(layoutFlame([], { rootName: '' }).root.name, 'root');
  assert.equal(layoutFlame(4, { rootName: '' }).root.name, 'root');
  assert.equal(layoutFlame({ name: 'Root', value: 2 }).root.value, 2);
  assert.equal(layoutFlame([
    { name: 'Same', value: 1 },
    { name: 'Same', value: 3 }
  ], { sort: 'name', rootVisible: true }).root.children[0].value, 3);
  assert.equal(layoutFlame([
    { name: 'B', value: 1 },
    { name: 'A', value: 1 }
  ], { sort: true, rootVisible: true }).root.children[0].name, 'A');

  const namedMosaicItems = mosaicInternals.normalizeItems([
    { name: 'Named Cell', x: 'A', y: 'Y', value: 1 }
  ], {});
  assert.equal(namedMosaicItems[0].name, 'Named Cell');
  assert.equal(mosaicInternals.readField(['A', 'B'], 0, undefined, 1, []), 'A');
  assert.deepEqual(mosaicInternals.resolveCategories('xCategory', [
    { xCategory: 'A', yCategory: 'Y', value: 1 },
    { xCategory: 'B', yCategory: 'Y', value: 1 }
  ], ['A', 'missing', 'B'], { A: 1, B: 1 }, 'name'), ['A', 'B']);

  assert.equal(resolveNestedCircleLayout({ data: 'bad', layout: { width: 220 } }).width, 600);
  assert.equal(nestedCircleLayoutInternals.placeLabelPoint({
    x: 0,
    y: 0,
    outerRadius: 20,
    labels: []
  }, undefined, 0, 10).x, 10);
  assert.equal(nestedCircleLayoutInternals.parsePercent(12, 100, 5), 12);
  assert.equal(nestedCircleLayoutInternals.parsePercent('bad%', 100, 5), 5);
  assert.equal(nestedCircleLayoutInternals.parsePercent(null, 100, 5), 5);

  assert.equal(resolveVennLayout({ data: 'bad', layout: { type: 'hollow' } }).circles.length, 1);
  assert.equal(resolveVennLayout({ data: [{ name: 'A' }] }).circles.length, 1);
  assert.equal(resolveVennLayout({ data: [{ name: 'A' }], vennType: 'circle' }).circles.length, 1);
  assert.equal(resolveVennLayout({ data: [{ name: 'A' }], layout: { type: 'hollow' } }).circles.length, 1);
  assert.equal(vennLayoutInternals.createHollowCircles(1, [], { width: 100, height: 80, padding: 10 })[0].id, 'A');
  assert.deepEqual(vennLayoutInternals.normalizeItems('bad'), []);

  assert.equal(resolveSubwayLayout({
    data: [{ stations: [[0, 0], [1, 1]] }],
    layoutOptions: { width: 220, height: 120 }
  }).width, 220);
  assert.equal(resolveSubwayLayout({
    routes: [{ stations: [[0, 0], [1, 1]] }]
  }).routes.length, 1);
  assert.equal(resolveSubwayLayout({
    routes: 'bad',
    data: 'bad'
  }).routes.length, 0);
  assert.deepEqual(subwayLayoutInternals.parseArrayStation([1, 2, 'Named'], 'fallback'), {
    id: 'Named',
    name: 'Named',
    x: 1,
    y: 2,
    labelPosition: undefined,
    interchange: false
  });
  assert.deepEqual(subwayLayoutInternals.parseArrayStation([7, 'Seven', 3, 4]), {
    id: '7',
    name: 'Seven',
    x: 3,
    y: 4,
    labelPosition: undefined,
    interchange: false
  });
  assert.equal(subwayLayoutInternals.normalizeStation({ name: 'Named Station', coord: [1, 2] }, 'r', 0)?.id, 'Named Station');
  assert.equal(subwayLayoutInternals.normalizeStation({ coord: [1, 2] }, 'r', 1)?.id, 'r:2');
  assert.deepEqual(subwayLayoutInternals.parseArrayPathPoint(['id', 1, 2], new Map()), {
    x: 1,
    y: 2,
    stationId: undefined
  });

  assert.equal(resolveSpiralLayout({ data: [['A', 1]], layout: { width: 240, height: 160 } }).width, 240);
  assert.equal(spiralInternals.readNumber('8', 1), 8);
  assert.equal(spiralInternals.readNumber(8, 1), 8);
  assert.equal(spiralInternals.firstFiniteNumber('bad', '7', 1), 1);
  assert.equal(spiralInternals.readFieldOption(0), 0);
  assert.equal(spiralInternals.readFieldOption(Infinity), undefined);
  assert.equal(Number.isFinite(spiralInternals.spiralCenterPoint(0, 0, 0, 0, 1, 0, 0, 0).normalX), true);

  assert.equal(resolveVectorFieldLayout({ data: [], layout: { width: 220 } }).width, 600);
  assert.equal(vectorLayoutInternals.readNumber('8', 1), 8);
  assert.equal(vectorLayoutInternals.readString(7, 'fallback'), undefined);

  assert.deepEqual(radialAreaInternals.orderByAngle([
    { name: 'missing', angleValue: 'missing', dataIndex: 0 },
    { name: 'A', angleValue: 'A', dataIndex: 1 }
  ], { type: 'category', categories: ['A'], min: 0, max: 1 }, {}).map((item) => item.name), ['A', 'missing']);
  assert.deepEqual(radialAreaInternals.orderByAngle([
    { name: 'A', angleValue: 'A', dataIndex: 0 },
    { name: 'missing', angleValue: 'missing', dataIndex: 1 }
  ], { type: 'category', categories: ['A'], min: 0, max: 1 }, {}).map((item) => item.name), ['A', 'missing']);
  assert.deepEqual(radialAreaInternals.orderByAngle([
    { name: 'B', angleValue: 'B', dataIndex: 1 },
    { name: 'A', angleValue: undefined, dataIndex: 0 }
  ], { type: 'category', categories: ['A', 'B'], min: 0, max: 2 }, {}).map((item) => item.name), ['A', 'B']);
  assert.equal(radialAreaInternals.resolveValueExtent([{ value: 2 }, { value: 8 }], {
    max: 9,
    nice: true,
    tickCount: 3
  }).max, 9);
  assert.deepEqual(radialAreaInternals.createAngleLabels({
    type: 'category',
    categories: ['Only'],
    min: 0,
    max: 1
  }, [], 0, 0, 10, 0, 90, false)[0].angle, 0);
  assert.equal(radialAreaInternals.readField(['A', 'B'], 0, undefined, 1, []), 'A');

  assert.deepEqual(radialBoxplotInternals.orderByCategory([
    { name: 'missing', categoryValue: 'missing', dataIndex: 0 },
    { name: 'A', categoryValue: 'A', dataIndex: 1 }
  ], ['A']).map((item) => item.name), ['A', 'missing']);
  assert.deepEqual(radialBoxplotInternals.orderByCategory([
    { name: 'A', categoryValue: 'A', dataIndex: 2 },
    { name: 'A', categoryValue: 'A', dataIndex: 1 },
    { name: 'missing', categoryValue: 'missing', dataIndex: 3 }
  ], ['A']).map((item) => item.dataIndex), [1, 2, 3]);
  assert.deepEqual(radialBoxplotInternals.orderByCategory([
    { name: 'A', categoryValue: 'A', dataIndex: 0 },
    { name: 'B', categoryValue: undefined, dataIndex: 1 }
  ], ['A', 'B']).map((item) => item.name), ['A', 'B']);
  assert.deepEqual(radialBoxplotInternals.orderByCategory([
    { name: 'B', categoryValue: undefined, dataIndex: 1 },
    { name: 'A', categoryValue: 'A', dataIndex: 0 }
  ], ['A', 'B']).map((item) => item.name), ['A', 'B']);
  assert.equal(radialBoxplotInternals.resolveValueExtent([{
    min: 2,
    q1: 3,
    median: 4,
    q3: 5,
    max: 8
  }], {
    max: 9,
    nice: true,
    tickCount: 3
  }).max, 9);
  assert.equal(radialBoxplotInternals.niceNumber(8, true), 10);
  assert.equal(radialBoxplotInternals.readField(['A', 'B'], 0, undefined, 1, []), 'A');

  const base = new Date(2026, 4, 6).getTime();
  assert.deepEqual(sunriseLayoutInternals.readDataOption([{ title: 'First' }]), { title: 'First' });
  assert.deepEqual(sunriseLayoutInternals.readDataOption([null, 'bad']), {});
  assert.equal(resolveSunriseSunsetLayout({ layout: { width: 260 } }).width, 900);
  assert.equal(sunriseLayoutInternals.parseTime(base, undefined, 0), base);
  assert.equal(sunriseLayoutInternals.parseTime('May 6, 2026', undefined, 0), new Date('May 6, 2026').getTime());
  assert.equal(sunriseLayoutInternals.createArcPoints({
    startX: 0,
    endX: 100,
    baselineY: 50,
    height: 20
  }, 0, 1, 4).length, 5);
  assert.equal(sunriseLayoutInternals.createArcPoints({
    startX: 0,
    endX: 100,
    baselineY: 50,
    height: 20
  }, 0.2, 0.8, 2).length, 3);
});

function installTemporaryPackRadiusSpike(circle, startRead, readCount, spike) {
  let stored = circle.packRadius;
  let reads = 0;
  Object.defineProperty(circle, 'packRadius', {
    configurable: true,
    get() {
      reads += 1;
      return reads >= startRead && reads < startRead + readCount
        ? stored + spike
        : stored;
    },
    set(value) {
      stored = value;
    }
  });
}
