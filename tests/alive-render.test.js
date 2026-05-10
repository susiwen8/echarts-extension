import assert from 'node:assert/strict';
import { test } from 'vitest';

import * as echarts from 'echarts/lib/echarts';
import { SVGRenderer } from 'echarts/renderers';
import { renderAlive, setAliveRenderKey } from '@echarts-extension/layout-core';
import { __test__ as transitionInternals } from '../packages/echarts-layout-core/src/render-transition.ts';

import 'echarts-radial';
import 'echarts-concentric';
import 'echarts-grid';
import 'echarts-mds';
import 'echarts-arc';
import 'echarts-radial-area';
import 'echarts-radial-boxplot';
import 'echarts-venn';
import 'echarts-pack-bubble';
import 'echarts-circle-packing';
import 'echarts-nested-circle';
import 'echarts-mosaic';
import 'echarts-voronoi-treemap';
import 'echarts-subway';
import 'echarts-flame';
import 'echarts-sunrise-sunset';
import 'echarts-lollipop';
import 'echarts-beeswarm';
import 'echarts-spiral';
import 'echarts-vector-field';

echarts.use([SVGRenderer]);

class FakeGroup {
  isGroup = true;
  type = 'group';
  #children = [];

  add(element) {
    element.parent = this;
    this.#children.push(element);
  }

  remove(element) {
    this.#children = this.#children.filter((child) => child !== element);
    element.parent = null;
  }

  removeAll() {
    this.#children.forEach((child) => {
      child.parent = null;
    });
    this.#children = [];
  }

  childrenRef() {
    return this.#children;
  }
}

class FakeCircle {
  type = 'circle';
  animateToCalls = [];

  constructor(shape, style) {
    this.shape = shape;
    this.style = style;
  }

  attr(keyOrObj, value) {
    if (keyOrObj === 'style') {
      this.style = value;
      return;
    }
    Object.assign(this, keyOrObj);
  }

  animateTo(target, config) {
    this.animateToCalls.push({ target, config });
    Object.assign(this.shape, target.shape || {});
    Object.assign(this.style, target.style || {});
    config?.done?.();
  }
}

class NoAttrCircle {
  type = 'circle';

  constructor(shape, style) {
    this.shape = shape;
    this.style = style;
  }
}

class ChildrenOnlyGroup {
  isGroup = true;
  type = 'group';
  #children = [];

  add(element) {
    element.parent = this;
    this.#children.push(element);
  }

  remove(element) {
    this.#children = this.#children.filter((child) => child !== element);
    element.parent = null;
  }

  removeAll() {
    this.#children.forEach((child) => {
      child.parent = null;
    });
    this.#children = [];
  }

  children() {
    return this.#children;
  }
}

const fakeHost = {
  graphic: {
    Group: FakeGroup
  }
};

const graph = {
  data: [
    { id: 'root', name: 'Root', value: 12 },
    { id: 'a', name: 'A', value: 7 },
    { id: 'b', name: 'B', value: 4 }
  ],
  links: [
    { source: 'root', target: 'a' },
    { source: 'root', target: 'b' }
  ]
};

const aliveRenderCases = [
  {
    name: 'radial',
    series: { ...graph, type: 'radial', layout: { unitRadius: 48, linkDistance: 72 } }
  },
  {
    name: 'concentric',
    series: { ...graph, type: 'concentric', layout: { nodeSize: 20 } }
  },
  {
    name: 'grid',
    series: { ...graph, type: 'grid', layout: { cols: 2, nodeSize: 20, preventOverlap: true } }
  },
  {
    name: 'mds',
    series: { ...graph, type: 'mds', layout: { linkDistance: 60 } }
  },
  {
    name: 'arc',
    series: { ...graph, type: 'arc', layout: { nodeSep: 36, nodeSize: 18 } }
  },
  {
    name: 'radialArea',
    series: {
      type: 'radialArea',
      angleField: 'time',
      valueField: 'value',
      minField: 'min',
      maxField: 'max',
      showSymbol: true,
      data: [
        { time: 'A', value: 32, min: 22, max: 38 },
        { time: 'B', value: 44, min: 34, max: 52 },
        { time: 'C', value: 36, min: 26, max: 46 }
      ]
    }
  },
  {
    name: 'radialBoxplot',
    series: {
      type: 'radialBoxplot',
      min: 0,
      max: 30,
      data: [
        { name: 'A', min: 2, q1: 8, median: 13, q3: 20, max: 24 },
        { name: 'B', min: 4, q1: 9, median: 12, q3: 15, max: 19 },
        { name: 'C', min: 8, q1: 13, median: 16, q3: 20, max: 26 }
      ]
    }
  },
  {
    name: 'venn',
    series: {
      type: 'venn',
      layout: 'bubble',
      data: [
        { name: 'A', value: 10 },
        { name: 'B', value: 6 }
      ]
    }
  },
  {
    name: 'packBubble',
    series: {
      type: 'packBubble',
      data: [
        { name: 'China', value: 1412, category: 'Asia' },
        { name: 'India', value: 1408, category: 'Asia' },
        { name: 'USA', value: 335, category: 'North America' }
      ]
    }
  },
  {
    name: 'circlePacking',
    series: {
      type: 'circlePacking',
      sort: false,
      data: {
        name: 'Portfolio',
        children: [
          { name: 'Core', children: [{ name: 'Search', value: 54 }, { name: 'Editor', value: 38 }] },
          { name: 'Growth', children: [{ name: 'Campaigns', value: 32 }, { name: 'Referrals', value: 22 }] }
        ]
      }
    }
  },
  {
    name: 'nestedCircle',
    series: {
      type: 'nestedCircle',
      data: [
        { name: 'Core', children: ['A', 'B'] },
        { name: 'Outer', children: ['C', 'D'] }
      ]
    }
  },
  {
    name: 'mosaic',
    series: {
      type: 'mosaic',
      xField: 'channel',
      yField: 'stage',
      valueField: 'users',
      data: [
        { channel: 'Organic', stage: 'New', users: 30 },
        { channel: 'Organic', stage: 'Returning', users: 12 },
        { channel: 'Paid', stage: 'New', users: 20 },
        { channel: 'Paid', stage: 'Returning', users: 18 }
      ]
    }
  },
  {
    name: 'voronoiTreemap',
    series: {
      type: 'voronoiTreemap',
      sort: false,
      data: {
        name: 'Portfolio',
        children: [
          { name: 'Search', value: 48 },
          { name: 'Ads', value: 32 },
          { name: 'Maps', value: 20 }
        ]
      }
    }
  },
  {
    name: 'subway',
    series: {
      type: 'subway',
      data: [
        {
          id: 'line1',
          name: 'Line 1',
          color: '#d51f2a',
          stations: [
            { id: 'a', name: 'Alpha', coord: [0, 0] },
            { id: 'b', name: 'Beta', coord: [50, 0] },
            { id: 'c', name: 'Central', coord: [100, 40] }
          ]
        }
      ]
    }
  },
  {
    name: 'flame',
    series: {
      type: 'flame',
      sort: false,
      data: {
        name: 'root',
        children: [
          { name: 'parse', value: 10 },
          { name: 'render', value: 20 }
        ]
      }
    }
  },
  {
    name: 'sunriseSunset',
    series: {
      type: 'sunriseSunset',
      sunrise: '05:12',
      sunset: '18:39',
      moonrise: '22:08',
      moonset: '07:59',
      currentTime: '2026-05-05 10:47:33',
      remainingText: '07:51:27',
      updatedText: 'Updated 10:46'
    }
  },
  {
    name: 'lollipop',
    series: {
      type: 'lollipop',
      categoryField: 'country',
      valueField: 'population',
      data: [
        { country: 'India', population: 1441 },
        { country: 'China', population: 1425 },
        { country: 'United States', population: 342 }
      ]
    }
  },
  {
    name: 'beeswarm',
    series: {
      type: 'beeswarm',
      categoryField: 'group',
      valueField: 'value',
      symbolSize: 14,
      data: [
        { group: 'A', value: 5.0, name: 'A0' },
        { group: 'A', value: 5.1, name: 'A1' },
        { group: 'B', value: 4.4, name: 'B0' }
      ]
    }
  },
  {
    name: 'spiral',
    series: {
      type: 'spiral',
      sort: false,
      data: [
        { name: 'Acquire', value: 34 },
        { name: 'Activate', value: 55 },
        { name: 'Retain', value: 21 }
      ]
    }
  },
  {
    name: 'vectorField',
    series: {
      type: 'vectorField',
      data: [
        { longitude: 0.125, latitude: 45.125, u: -2.3, v: -2.1 },
        { longitude: 0.375, latitude: 45.125, u: -2.4, v: -2.2 },
        { longitude: 0.125, latitude: 45.375, u: -2.1, v: -1.9 }
      ]
    }
  }
];

test('custom chart packages keep existing graphic elements alive across option updates', () => {
  for (const { name, series } of aliveRenderCases) {
    const chart = echarts.init(null, null, {
      renderer: 'svg',
      ssr: true,
      width: 480,
      height: 360
    });

    chart.setOption({
      series: [series]
    });
    const before = collectDisplayList(chart);
    const beforeSet = new Set(before);

    chart.setOption({
      series: [{
        ...series,
        left: '12%',
        width: '76%'
      }]
    });

    const after = collectDisplayList(chart);
    const shared = after.filter((element) => beforeSet.has(element));

    chart.dispose();

    assert.ok(before.length > 0, `${name} should render display elements`);
    assert.ok(shared.length > 0, `${name} should update existing elements instead of redrawing the tree`);
  }
});

test('alive render internals cover proxy, matching, removal, and style fallback branches', () => {
  const captured = [];
  assert.equal(transitionInternals.createSeriesModelProxy(null, true, captured), null);

  const modelWithValues = {
    flag: 'bound',
    get: 'not-a-function',
    getData: 'also-not-a-function',
    method() {
      return this.flag;
    }
  };
  const valueProxy = transitionInternals.createSeriesModelProxy(modelWithValues, true, captured);
  assert.equal(valueProxy.get, 'not-a-function');
  assert.equal(valueProxy.getData, 'also-not-a-function');
  assert.equal(valueProxy.flag, 'bound');
  assert.equal(valueProxy.method(), 'bound');

  const reads = [];
  const data = {
    getName(index) {
      return index === 0 ? 'named' : '';
    },
    setItemGraphicEl(index, element) {
      this.bound = { index, element };
    },
    helper() {
      return this;
    }
  };
  const animatedModel = {
    get(path) {
      reads.push(path);
      return path === 'animationDuration' ? 12 : path === 'animationEasing' ? 'linear' : true;
    },
    getData() {
      return data;
    }
  };
  const initialProxy = transitionInternals.createSeriesModelProxy(animatedModel, false, []);
  assert.equal(initialProxy.get('enterAnimation'), true);
  const initialData = initialProxy.getData();
  const firstElement = { type: 'circle' };
  initialData.setItemGraphicEl(0, firstElement);
  assert.equal(data.bound.element, firstElement);
  assert.equal(initialData.helper(), data);

  const updateProxy = transitionInternals.createSeriesModelProxy(animatedModel, true, captured);
  assert.equal(updateProxy.get('enterAnimation'), false);
  assert.equal(updateProxy.get(['edgeAnimation']), false);
  assert.equal(updateProxy.get(['other']), true);
  const updateData = updateProxy.getData();
  assert.equal(updateProxy.getData(), updateData);
  const updateElement = { type: 'rect' };
  updateData.setItemGraphicEl(1, updateElement);
  assert.equal(captured.length, 1);
  assert.equal(updateElement.anid, 'data-index:1');

  const directCache = new WeakMap();
  assert.equal(transitionInternals.createDataProxy(null, true, [], directCache), null);
  assert.equal(transitionInternals.createDataProxy({ setItemGraphicEl: 'x' }, true, [], directCache).setItemGraphicEl, 'x');
  assert.equal(transitionInternals.createDataProxy({ label: 'plain' }, true, [], directCache).label, 'plain');

  assert.deepEqual(transitionInternals.resolveAliveTransitionOptions({ get: 'x' }, { duration: 3 }), {
    duration: 3,
    easing: 'cubicOut'
  });
  assert.deepEqual(transitionInternals.resolveAliveTransitionOptions({ get: (path) => path === 'animation' ? false : undefined }, { easing: 'quadIn' }), {
    duration: 0,
    easing: 'quadIn'
  });
  assert.deepEqual(transitionInternals.resolveAliveTransitionOptions(animatedModel, {}), {
    duration: 12,
    easing: 'linear'
  });
  assert.equal(transitionInternals.readModelValue({}, 'animation'), undefined);

  const currentA = new FakeCircle({ cx: 0 }, { opacity: 1 });
  const currentB = new FakeCircle({ cx: 1 }, { opacity: 1 });
  const currentGroup = new FakeGroup();
  currentGroup.add(currentA);
  currentGroup.add(currentB);
  const keyed = transitionInternals.createKeyedElementMap([currentA, currentB]);
  assert.equal(
    transitionInternals.findCurrentMatch({ type: 'circle' }, 0, [currentA], new Map(), new Set()),
    currentA
  );
  const used = new Set([currentA]);
  assert.equal(
    transitionInternals.findCurrentMatch({ type: 'circle' }, 0, [currentA, currentB], keyed, used),
    currentB
  );
  const explicit = { type: 'circle' };
  transitionInternals.setAliveRenderKey(explicit, 'missing');
  assert.equal(transitionInternals.findCurrentMatch(explicit, 0, [currentA], keyed, new Set()), undefined);

  const parent = new FakeGroup();
  const leaving = { type: 'path', parent };
  parent.add(leaving);
  transitionInternals.removeLeavingChild(parent, leaving, { duration: 0, easing: 'linear', elementMap: new Map() });
  assert.equal(leaving.parent, null);
  const parentWithoutRemove = {};
  const leavingWithoutRemove = { type: 'path', parent: parentWithoutRemove };
  transitionInternals.removeLeavingChild(parentWithoutRemove, leavingWithoutRemove, { duration: 0, easing: 'linear', elementMap: new Map() });
  assert.equal(leavingWithoutRemove.parent, parentWithoutRemove);
  const otherParent = {};
  const alreadyDetached = { type: 'path', parent: otherParent };
  transitionInternals.removeLeavingChild(parentWithoutRemove, alreadyDetached, { duration: 0, easing: 'linear', elementMap: new Map() });
  assert.equal(alreadyDetached.parent, otherParent);
  const bindingData = { setItemGraphicEl() { this.called = true; } };
  transitionInternals.applyCapturedGraphicBindings([{ data: bindingData, dataIndex: 0, element: null }], new Map());
  assert.equal(bindingData.called, undefined);

  const childrenOnly = new ChildrenOnlyGroup();
  childrenOnly.add({ type: 'rect', style: { opacity: 1 } });
  assert.equal(transitionInternals.childrenOf(childrenOnly).length, 1);
  assert.deepEqual(transitionInternals.childrenOf({}), []);
  assert.deepEqual(transitionInternals.collectDisplayables({ type: 'line' }), []);

  const plainStyle = { style: { opacity: 1 } };
  transitionInternals.setStyle(plainStyle, { opacity: 0.4 });
  assert.equal(plainStyle.style.opacity, 0.4);
  assert.equal(transitionInternals.elementKind({}), 'Object');
  assert.equal(transitionInternals.elementKind(Object.create(null)), 'element');
});

test('subway add-data updates the route path to reach the appended station', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 900,
    height: 560
  });
  const route = {
    id: 'line1',
    name: 'Line 1',
    color: '#d51f2a',
    stations: [
      { id: 'lake', name: 'Lake', coord: [60, 280] },
      { id: 'market', name: 'Market', coord: [150, 220] },
      { id: 'central', name: 'Central', coord: [250, 220] },
      { id: 'harbor', name: 'Harbor', coord: [350, 220] },
      { id: 'airport', name: 'Airport', coord: [470, 120], labelPosition: 'right' }
    ],
    waypoints: [
      ['lake', 60, 280],
      ['market', 150, 220],
      ['central', 250, 220],
      ['harbor', 350, 220],
      [470, 220],
      ['airport', 470, 120]
    ]
  };
  const routes = [
    route,
    {
      id: 'line2',
      name: 'Line 2',
      color: '#f5a623',
      stations: [
        { id: 'north', name: 'North', coord: [250, 70] },
        { id: 'central', name: 'Central', coord: [250, 220] },
        { id: 'south', name: 'South', coord: [320, 400] }
      ]
    },
    {
      id: 'line3',
      name: 'Line 3',
      color: '#18a849',
      stations: [
        { id: 'west', name: 'West', coord: [90, 120] },
        { id: 'central', name: 'Central', coord: [250, 220] },
        { id: 'garden', name: 'Garden', coord: [390, 310] }
      ]
    }
  ];
  const series = {
    type: 'subway',
    top: 68,
    width: '92%',
    height: '82%',
    padding: 34,
    animation: true,
    animationDurationUpdate: 0,
    lineWidth: 9,
    stationRadius: 4,
    interchangeRadius: 8,
    data: routes,
    label: { show: true },
    routeLabel: { show: true, position: 'end', fontSize: 12, fontWeight: 800 }
  };

  chart.setOption({ series: [series] });
  route.stations.push({ id: 'line1-added-1', name: 'Added 1', coord: [540, 120], labelPosition: 'right' });
  route.waypoints.push(['line1-added-1', 540, 120]);
  chart.setOption({ series: [{ ...series, data: routes }] }, {
    notMerge: false,
    lazyUpdate: false
  });

  const displayList = collectDisplayList(chart);
  const redRouteBounds = displayList
    .filter((element) => element.style?.stroke === '#d51f2a' && element.style?.fill == null)
    .map((element) => element.getBoundingRect?.())
    .filter(Boolean);
  const redStationCenters = displayList
    .filter((element) => element.type === 'circle' && element.style?.stroke === '#d51f2a')
    .map((element) => element.shape?.cx)
    .filter((value) => Number.isFinite(value));
  const routeRight = Math.max(...redRouteBounds.map((rect) => rect.x + rect.width));
  const stationRight = Math.max(...redStationCenters);
  const stationLabels = stationLabelRects(displayList);
  const labelOverlaps = findTextLabelOverlaps(textLabelRects(displayList));
  const routeLabelOverlaps = findRouteLabelOverlaps(stationLabels, routeSegments(displayList));

  chart.dispose();

  assert.ok(routeRight >= stationRight - 1, `route right ${routeRight} should reach station ${stationRight}`);
  assert.deepEqual(labelOverlaps, [], `subway labels should not overlap after add-data: ${labelOverlaps.join(', ')}`);
  assert.deepEqual(routeLabelOverlaps, [], `subway station labels should not sit on route lines: ${routeLabelOverlaps.join(', ')}`);
});

test('subway station labels avoid sitting on route lines', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 640,
    height: 360
  });
  const routes = [
    {
      id: 'line1',
      name: 'Line 1',
      color: '#d51f2a',
      stations: [
        { id: 'a', name: 'A', coord: [0, 0], labelPosition: 'top' },
        { id: 'central', name: 'Central', coord: [100, 0], labelPosition: 'right' },
        { id: 'b', name: 'B', coord: [200, 0], labelPosition: 'bottom' }
      ]
    }
  ];

  chart.setOption({
    series: [{
      type: 'subway',
      width: '88%',
      height: '68%',
      padding: 32,
      lineWidth: 10,
      stationRadius: 4,
      data: routes,
      label: { show: true, fontSize: 14, fontWeight: 800 }
    }]
  });

  const displayList = collectDisplayList(chart);
  const stationLabels = stationLabelRects(displayList);
  const routeLabelOverlaps = findRouteLabelOverlaps(stationLabels, routeSegments(displayList));

  chart.dispose();

  assert.deepEqual(routeLabelOverlaps, [], `subway station labels should avoid route lines: ${routeLabelOverlaps.join(', ')}`);
});

test('radial boxplot add-data keeps existing boxes on updatable geometry', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 900,
    height: 560
  });
  const data = [
    { name: 'A', min: 1, q1: 8, median: 13, q3: 21, max: 24, itemStyle: { color: '#2f83ed' } },
    { name: 'B', min: 4, q1: 9, median: 12, q3: 15, max: 19, itemStyle: { color: '#28c3c7' } },
    { name: 'C', min: 8, q1: 13, median: 16, q3: 20, max: 26, itemStyle: { color: '#fb8b50' } },
    { name: 'D', min: 7, q1: 11, median: 14, q3: 22, max: 28, itemStyle: { color: '#c973ee' } }
  ];
  const series = {
    type: 'radialBoxplot',
    width: '94%',
    height: '88%',
    padding: 42,
    categoryField: 'name',
    categories: data.map((item) => item.name),
    min: 0,
    max: 32,
    boxWidth: 0.58,
    capWidth: 0.34,
    animationDurationUpdate: 420,
    data
  };

  chart.setOption({ series: [series] });
  data.push({ name: 'Added', min: 2, q1: 7, median: 12, q3: 18, max: 23, itemStyle: { color: '#3344aa' } });
  chart.setOption({
    series: [{ ...series, categories: data.map((item) => item.name), data }]
  }, {
    notMerge: false,
    lazyUpdate: false
  });

  const displayList = collectDisplayList(chart);
  const updatedBox = displayList
    .find((element) => element.style?.fill === '#2f83ed' && element.style?.opacity !== 0);
  const visibleBoxKeys = displayList
    .filter((element) => element.z2 === 3 && element.style?.fill && element.style.fill !== 'rgba(0,0,0,0)')
    .map((element) => element.__aliveRenderKey)
    .filter(Boolean);

  chart.dispose();

  assert.ok(isUpdatableRadialBoxGeometry(updatedBox), 'existing radial box should animate shape geometry after category reflow');
  assert.equal(visibleBoxKeys.length, data.length, 'radial boxplot should keep exactly one visible box per category after add-data');
  assert.equal(new Set(visibleBoxKeys).size, visibleBoxKeys.length, 'radial boxplot visible boxes should have stable unique keys');
});

test('nested circle add-data inserts a bounded ring instead of covering the chart', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 720,
    height: 560
  });
  const data = [
    { name: 'Math', children: ['Probability', 'Algebra', 'Calculus'], itemStyle: { color: '#d7e7ff' } },
    { name: 'Python', children: ['Pandas', 'NumPy', 'Scikit-Learn'], itemStyle: { color: '#c5d4fb' } },
    { name: 'SQL', children: ['Joins', 'Windows', 'Optimization'], itemStyle: { color: '#adbef5' } },
    { name: 'Visualization', children: ['Plotly', 'Tableau', 'Matplotlib'], itemStyle: { color: '#8195e9' } },
    { name: 'Machine Learning', children: ['Supervised', 'Clustering', 'Evaluation'], itemStyle: { color: '#687de2' } }
  ];
  const series = {
    type: 'nestedCircle',
    width: '94%',
    height: '84%',
    padding: 8,
    centerRadiusRatio: 0.3,
    animation: true,
    animationDurationUpdate: 720,
    enterAnimation: false,
    data
  };

  chart.setOption({ series: [series] });
  data.push({
    id: 'added-nested-circle-1',
    name: 'Added 1',
    children: [],
    itemStyle: { color: '#2454a6' }
  });
  chart.setOption({ series: [{ ...series, data }] }, {
    notMerge: false,
    lazyUpdate: false
  });

  const circles = collectDisplayList(chart).filter((element) => element.type === 'circle');
  const added = circles.find((element) => element.__aliveRenderKey === 'nested-circle-ring:added-nested-circle-1');
  const center = circles.find((element) => element.__aliveRenderKey === 'nested-circle-ring:Math');
  const largestRadius = Math.max(...circles.map((element) => Number(element.shape?.r || 0)));
  const displayList = collectDisplayList(chart);

  chart.dispose();

  assert.ok(added, 'nested circle added ring should keep a stable transition key');
  assert.ok(center, 'nested circle center ring should keep its stable transition key');
  assert.equal(Number(added.shape.r), largestRadius, 'nested circle added ring should be able to enter as a new outer circle');
  assert.ok(Number(center.z2) > Number(added.z2), 'nested circle added ring should stay under the inner ring while update animation runs');
  assert.ok(displayList.indexOf(center) > displayList.indexOf(added), 'nested circle display order should keep the inner ring above the added ring');
});

test('lollipop inserted data grows the new symbol while existing symbols move', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 720,
    height: 460
  });
  const data = [
    { country: 'Alpha', population: 120, itemStyle: { color: '#2db5ff' } },
    { country: 'Bravo', population: 180, itemStyle: { color: '#2db5ff' } },
    { country: 'Charlie', population: 90, itemStyle: { color: '#2db5ff' } }
  ];
  const series = {
    type: 'lollipop',
    categoryField: 'country',
    valueField: 'population',
    categories: data.map((item) => item.country),
    min: 0,
    max: 240,
    symbolSize: 14,
    animationDurationUpdate: 420,
    enterAnimation: { duration: 620, stagger: 0, easing: 'cubicOut' },
    data
  };

  chart.setOption({ series: [series] });
  data.splice(1, 0, {
    id: 'added-lollipop-1',
    country: 'Added 1',
    population: 150,
    itemStyle: { color: '#ff3b30' }
  });
  chart.setOption({
    series: [{ ...series, categories: data.map((item) => item.country), data }]
  }, {
    notMerge: false,
    lazyUpdate: false
  });

  const symbols = collectDisplayList(chart)
    .filter((element) => element.type === 'circle' && element.z2 === 8);
  const addedSymbol = symbols.find((element) => element.__aliveRenderKey === 'lollipop-symbol:added-lollipop-1');
  const existingSymbols = symbols.filter((element) => String(element.__aliveRenderKey || '').startsWith('lollipop-symbol:') && element !== addedSymbol);

  chart.dispose();

  assert.ok(addedSymbol, 'inserted lollipop symbol should keep its own transition key');
  assert.equal(addedSymbol.shape.r, 0, 'inserted lollipop symbol should grow from radius zero at its target position');
  assert.ok(animatorTracks(addedSymbol).includes('r'), 'inserted lollipop symbol should animate radius growth');
  assert.ok(existingSymbols.length >= 3, 'existing lollipop symbols should remain keyed after insertion');
  existingSymbols.forEach((symbol) => {
    assert.ok(symbol.shape.r > 0, `${symbol.__aliveRenderKey} should move without regrowing`);
  });
});

test('alive render respects animation false for update reconciliation', () => {
  const view = {};
  const group = new FakeGroup();
  const seriesModel = {
    get(path) {
      return path === 'animation' ? false : undefined;
    }
  };

  renderAlive(view, fakeHost, group, seriesModel, (targetGroup) => {
    targetGroup.add(new FakeCircle({ cx: 10, cy: 10, r: 4 }, { fill: '#2454a6', opacity: 1 }));
  });
  const circle = group.childrenRef()[0];

  renderAlive(view, fakeHost, group, seriesModel, (targetGroup) => {
    targetGroup.add(new FakeCircle({ cx: 28, cy: 12, r: 8 }, { fill: '#c4554d', opacity: 0.8 }));
  });

  assert.equal(group.childrenRef()[0], circle);
  assert.equal(circle.animateToCalls.length, 0);
  assert.deepEqual(circle.shape, { cx: 28, cy: 12, r: 8 });
  assert.deepEqual(circle.style, { fill: '#c4554d', opacity: 0.8 });
});

test('alive render reads ECharts update animation settings when enabled', () => {
  const view = {};
  const group = new FakeGroup();
  const seriesModel = {
    get(path) {
      if (path === 'animation') return true;
      if (path === 'animationDurationUpdate') return 120;
      if (path === 'animationEasingUpdate') return 'linear';
      return undefined;
    }
  };

  renderAlive(view, fakeHost, group, seriesModel, (targetGroup) => {
    targetGroup.add(new FakeCircle({ cx: 0, cy: 0, r: 2 }, { opacity: 1 }));
  });
  const circle = group.childrenRef()[0];

  renderAlive(view, fakeHost, group, seriesModel, (targetGroup) => {
    targetGroup.add(new FakeCircle({ cx: 20, cy: 0, r: 2 }, { opacity: 0.6 }));
  });

  assert.equal(circle.animateToCalls.length, 1);
  assert.equal(circle.animateToCalls[0].config.duration, 120);
  assert.equal(circle.animateToCalls[0].config.easing, 'linear');
});

test('alive render covers defensive proxy, key, child, and clip-path fallbacks', () => {
  setAliveRenderKey(null, 'missing');
  setAliveRenderKey('not-object', 'missing');

  const emptyView = {};
  const emptyGroup = new FakeGroup();
  renderAlive(emptyView, fakeHost, emptyGroup, null, (targetGroup, model, isUpdate) => {
    assert.equal(model, null);
    assert.equal(isUpdate, false);
    targetGroup.add(new FakeCircle({ cx: 0, cy: 0, r: 1 }, { opacity: 1 }));
  });

  const view = {};
  const group = new FakeGroup();
  const boundData = {
    getName(index) {
      return index === 0 ? '' : `item-${index}`;
    },
    setItemGraphicEl(index, element) {
      this.bound = { index, element };
    }
  };
  const seriesModel = {
    get(path) {
      if (Array.isArray(path) && path[0] === 'enterAnimation') return true;
      if (path === 'animationDuration') return 0;
      return undefined;
    },
    getData() {
      return boundData;
    },
    marker() {
      return this;
    }
  };

  renderAlive(view, fakeHost, group, seriesModel, (targetGroup, renderModel, isUpdate) => {
    assert.equal(renderModel.marker(), seriesModel);
    assert.equal(renderModel.__aliveRenderUpdating, false);
    const first = new FakeCircle({ cx: 1, cy: 1, r: 2 }, { opacity: 1, unused: true });
    renderModel.getData().setItemGraphicEl(0, first);
    targetGroup.add(first);
    targetGroup.add(new FakeGroup());
    targetGroup.add(new FakeCircle({ cx: 2, cy: 2, r: 2 }, null));
    return undefined;
  });
  const first = group.childrenRef()[0];
  first.getClipPath = () => first.clip;
  first.setClipPath = (clip) => {
    first.clip = clip;
  };
  first.removeClipPath = () => {
    first.clip = null;
  };
  first.clip = new FakeCircle({ cx: 0, cy: 0, r: 1 }, { opacity: 0.4 });

  renderAlive(view, fakeHost, group, seriesModel, (targetGroup, renderModel, isUpdate) => {
    assert.equal(isUpdate, true);
    assert.equal(renderModel.__aliveRenderUpdating, true);
    assert.equal(renderModel.get(['enterAnimation']), false);
    const next = new FakeCircle({ cx: 10, cy: 10, r: 4 }, { opacity: 0.5 });
    next.getClipPath = () => new FakeGroup();
    renderModel.getData().setItemGraphicEl(0, next);
    targetGroup.add(next);
    const explicit = new FakeCircle({ cx: 20, cy: 20, r: 3 }, { opacity: 0.7 });
    setAliveRenderKey(explicit, 'new-explicit');
    targetGroup.add(explicit);
    return {
      hoverItems: [{ elements: [next, next, null] }],
      payload: { updated: true }
    };
  }, {
    duration: 0,
    easing: ''
  });

  assert.equal(group.childrenRef().length, 2);
  assert.equal(first.clip?.isGroup, true);
  assert.equal(boundData.bound.index, 0);
  assert.equal(boundData.bound.element, first);
});

test('alive render reconciles children APIs, removal without displayables, and direct style assignment', () => {
  const view = {};
  const group = new ChildrenOnlyGroup();
  const first = new NoAttrCircle({ cx: 0, cy: 0, r: 3 }, { opacity: 1, removeMe: true });
  const leavingGroup = new ChildrenOnlyGroup();
  group.add(first);
  group.add(leavingGroup);
  view.__aliveRenderState = { rendered: true };

  const result = renderAlive(view, {
    graphic: { Group: ChildrenOnlyGroup }
  }, group, {}, (targetGroup) => {
    const next = new NoAttrCircle({ cx: 5, cy: 6, r: 7 }, { opacity: 0.4 });
    targetGroup.add(next);
    return [{ elements: [next] }];
  }, {
    duration: 0
  });

  assert.equal(result.hoverItems.length, 1);
  assert.equal(group.children().length, 1);
  assert.deepEqual(first.shape, { cx: 5, cy: 6, r: 7 });
  assert.deepEqual(first.style, { opacity: 0.4 });
  assert.equal(leavingGroup.parent, null);
});

function collectDisplayList(chart) {
  return chart.getZr().storage.getDisplayList().filter((element) => element.type !== 'group');
}

function textLabelRects(displayList) {
  return displayList
    .filter((element) => (element.type === 'text' || element.type === 'tspan') && element.style?.text)
    .map((element) => {
      const rect = element.getBoundingRect();
      return {
        key: String(element.__aliveRenderKey || element.style.text),
        text: String(element.style.text),
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        right: rect.x + rect.width,
        bottom: rect.y + rect.height
      };
    });
}

function stationLabelRects(displayList) {
  return textLabelRects(displayList)
    .filter((rect) => rect.text);
}

function routeSegments(displayList) {
  return displayList.flatMap((element) => {
    const lineWidth = Number(element.style?.lineWidth || 0);
    const padding = lineWidth / 2 + 3;
    if (element.style?.stroke && lineWidth > 0 && Array.isArray(element.shape?.points)) {
      return segmentsFromPoints(element.shape.points, padding);
    }
    if (element.type === 'polyline' && Array.isArray(element.shape?.points)) {
      return segmentsFromPoints(element.shape.points, padding);
    }
    if (element.type === 'line' && element.shape) {
      return [routeSegment(Number(element.shape.x1), Number(element.shape.y1), Number(element.shape.x2), Number(element.shape.y2), padding)];
    }
    return [];
  }).filter(isFiniteRouteSegment);
}

function segmentsFromPoints(points, padding) {
  const segments = [];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    segments.push(routeSegment(Number(previous[0]), Number(previous[1]), Number(current[0]), Number(current[1]), padding));
  }
  return segments;
}

function routeSegment(x1, y1, x2, y2, padding) {
  return {
    key: `segment:${x1},${y1}-${x2},${y2}`,
    x1,
    y1,
    x2,
    y2,
    padding
  };
}

function findTextLabelOverlaps(labels) {
  const overlaps = [];
  for (let leftIndex = 0; leftIndex < labels.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < labels.length; rightIndex += 1) {
      const left = labels[leftIndex];
      const right = labels[rightIndex];
      if (rectsOverlap(left, right)) overlaps.push(`${left.text}/${right.text}`);
    }
  }
  return overlaps;
}

function findRouteLabelOverlaps(labels, segments) {
  const overlaps = [];
  labels.forEach((label) => {
    segments.forEach((segment) => {
      if (segmentIntersectsInflatedRect(segment, label)) overlaps.push(`${label.text}/${segment.key}`);
    });
  });
  return overlaps;
}

function rectsOverlap(left, right) {
  return left.x < right.right
    && right.x < left.right
    && left.y < right.bottom
    && right.y < left.bottom;
}

function segmentIntersectsInflatedRect(segment, rect) {
  return segmentIntersectsRect(segment.x1, segment.y1, segment.x2, segment.y2, {
    x: rect.x - segment.padding,
    y: rect.y - segment.padding,
    width: rect.width + segment.padding * 2,
    height: rect.height + segment.padding * 2
  });
}

function segmentIntersectsRect(x1, y1, x2, y2, rect) {
  const left = rect.x;
  const right = rect.x + rect.width;
  const top = rect.y;
  const bottom = rect.y + rect.height;
  let tMin = 0;
  let tMax = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;

  const clip = (edge, distance) => {
    if (edge === 0) return distance >= 0;
    const t = distance / edge;
    if (edge < 0) {
      if (t > tMax) return false;
      if (t > tMin) tMin = t;
    } else {
      if (t < tMin) return false;
      if (t < tMax) tMax = t;
    }
    return true;
  };

  return clip(-dx, x1 - left)
    && clip(dx, right - x1)
    && clip(-dy, y1 - top)
    && clip(dy, bottom - y1);
}

function isFiniteRouteSegment(segment) {
  return Number.isFinite(segment.x1)
    && Number.isFinite(segment.y1)
    && Number.isFinite(segment.x2)
    && Number.isFinite(segment.y2)
    && Number.isFinite(segment.padding);
}

function animatorTracks(element) {
  return [
    ...new Set((element?.animators || []).flatMap((animator) => Object.keys(animator._tracks || {})))
  ];
}

function isUpdatableRadialBoxGeometry(element) {
  if (Array.isArray(element?.shape?.points)) return true;
  return Number.isFinite(element?.shape?.r)
    && Number.isFinite(element?.shape?.r0)
    && Number.isFinite(element?.shape?.startAngle)
    && Number.isFinite(element?.shape?.endAngle);
}
