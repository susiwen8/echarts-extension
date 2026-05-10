import assert from 'node:assert/strict';
import { test } from 'vitest';

import * as echarts from 'echarts/lib/echarts';
import { SVGRenderer } from 'echarts/renderers';

import 'echarts-arc';
import 'echarts-beeswarm';
import 'echarts-circle-packing';
import 'echarts-concentric';
import 'echarts-fisheye';
import 'echarts-flame';
import 'echarts-grid';
import 'echarts-lollipop';
import 'echarts-mds';
import 'echarts-mosaic';
import 'echarts-nested-circle';
import 'echarts-pack-bubble';
import 'echarts-radial';
import 'echarts-radial-area';
import 'echarts-radial-boxplot';
import 'echarts-spiral';
import 'echarts-smith';
import 'echarts-subway';
import 'echarts-sunrise-sunset';
import 'echarts-vector-field';
import 'echarts-venn';
import 'echarts-voronoi-treemap';

echarts.use([SVGRenderer]);

test('cartesian custom charts render axis, label, style, silent, and animation variants', () => {
  renderSeries({
    type: 'lollipop',
    width: '86%',
    height: '76%',
    categoryField: 'country',
    valueField: 'population',
    categories: ['Alpha', 'Bravo', 'Charlie', 'Delta'],
    data: [
      { id: 'a', country: 'Alpha', population: -12, itemStyle: { color: '#ef4444' }, stemStyle: { color: '#111', type: [2, 3] } },
      { id: 'b', country: 'Bravo', population: 0, label: { show: false } },
      { id: 'c', country: 'Charlie', population: 22 },
      { id: 'd', country: 'Delta', population: 12 }
    ],
    min: -20,
    max: 30,
    baseline: 4,
    symbolSize: 16,
    label: {
      show: true,
      formatter: ({ category, value }) => `${category}:${value}`,
      color: '#111',
      fontSize: '13'
    },
    valueAxis: {
      name: 'Population',
      nameTextStyle: { color: '#333', fontSize: '12' },
      label: { formatter: (value) => `${value}M`, fontSize: '11' },
      splitLine: { lineStyle: { type: 'dotted', width: '2', opacity: '0.5' } },
      axisLine: { lineStyle: { type: [4, 2], color: '#888' } }
    },
    categoryAxis: {
      label: { formatter: 'Country {value}', rotate: 28, color: '#222' }
    },
    stemStyle: { type: 'dashed', width: '2', opacity: '0.6' },
    itemStyle: { borderColor: '#fff', borderWidth: '2', opacity: '0.8' },
    enterAnimation: {
      duration: (_item, index) => 20 + index,
      delay: () => 1,
      stagger: () => 2,
      easing: 'linear'
    }
  });
  renderSeries({
    type: 'lollipop',
    silent: true,
    large: true,
    symbolSize: 0,
    categoryField: 'country',
    valueField: 'population',
    label: { show: true, formatter: '{b}:{c}:{category}' },
    valueAxis: { label: { show: false }, axisLine: { show: false }, splitLine: { show: false } },
    categoryAxis: { show: false, label: { show: false } },
    grid: { show: false },
    data: [
      { country: 'A', population: 1 },
      { country: 'B', population: 2 }
    ],
    animation: false
  });

  renderSeries({
    type: 'beeswarm',
    orient: 'vertical',
    categoryField: 'team',
    valueField: 'score',
    nameField: 'name',
    categories: ['A', 'B'],
    data: [
      { team: 'A', score: 1, name: 'A1', itemStyle: { color: '#22c55e', shadowBlur: 4, shadowColor: '#000' } },
      { team: 'A', score: 1.2, name: 'A2', label: { show: false } },
      { team: 'B', score: 2, name: 'B1' }
    ],
    label: {
      show: true,
      formatter: ({ name, value, category }) => `${name}:${category}:${value}`,
      fontSize: '12'
    },
    valueAxis: {
      name: 'Score',
      nameTextStyle: { color: '#123', fontSize: '12' },
      label: { formatter: 'S {value}' },
      splitLine: { lineStyle: { type: [1, 2], width: '1' } }
    },
    categoryAxis: {
      label: { formatter: 'Group {value}', rotate: 25 }
    },
    itemStyle: { borderWidth: '2', opacity: '0.9' },
    enterAnimation: {
      duration: () => 30,
      delay: () => 1,
      stagger: () => 1,
      easing: 'linear'
    }
  });
  renderSeries({
    type: 'beeswarm',
    silent: true,
    orient: 'horizontal',
    valueAxis: { label: { show: false }, axisLine: { show: false }, splitLine: { show: false } },
    categoryAxis: { show: false, label: { show: false } },
    grid: { show: false },
    label: { show: true, formatter: '{b}:{c}:{category}' },
    data: [
      { group: 'A', value: 1, name: 'A1' },
      { group: 'B', value: 2, name: 'B1' }
    ],
    animation: false
  });

  assert.ok(true);
});

test('hierarchical and polar custom charts render label and style option variants', () => {
  const tree = {
    name: 'Root',
    children: [
      { name: 'Alpha', value: 6, itemStyle: { color: '#60a5fa' } },
      { name: 'Beta', value: 4, label: { show: false } },
      { name: 'Gamma', children: [{ name: 'G1', value: 2 }] }
    ]
  };

  renderSeries({
    type: 'circlePacking',
    data: tree,
    rootVisible: true,
    sort: 'name',
    label: { show: true, formatter: ({ name, value }) => `${name}:${value}`, minRadius: 0, lineHeight: '14' },
    itemStyle: { borderColor: '#fff', borderWidth: '1', opacity: '0.8' },
    enterAnimation: { enabled: false }
  });
  renderSeries({
    type: 'packBubble',
    data: [
      { name: 'Alpha', value: 8, category: 'A', itemStyle: { color: '#f97316' } },
      { name: 'Beta', value: 3, category: 'B', label: { show: false } },
      { name: 'Gamma', value: 1, category: 'B' }
    ],
    label: { show: true, formatter: '{b}:{c}', minRadius: 0 },
    itemStyle: { borderColor: '#fff', borderWidth: '1' },
    enterAnimation: false
  });
  renderSeries({
    type: 'nestedCircle',
    data: [
      { name: 'Outer', children: ['A', 'B'], itemStyle: { color: '#ddd' } },
      { name: 'Inner', children: ['C'], label: { show: false } }
    ],
    label: { show: true, formatter: ({ name }) => `Ring ${name}` },
    childLabel: { show: true, formatter: '{b}' },
    enterAnimation: { show: false }
  });
  renderSeries({
    type: 'flame',
    data: tree,
    rootVisible: true,
    orient: 'down',
    label: { show: true, formatter: ({ name }) => `F ${name}` },
    itemStyle: { borderColor: '#fff', borderWidth: '1' },
    enterAnimation: { enabled: false }
  });
  renderSeries({
    type: 'mosaic',
    data: [
      { channel: 'Organic', stage: 'New', users: 10, itemStyle: { color: '#60a5fa' } },
      { channel: 'Organic', stage: 'Returning', users: 3, label: { show: false } },
      { channel: 'Paid', stage: 'New', users: 6 }
    ],
    label: { show: true, formatter: '{x} {y} {value}' },
    itemStyle: { borderColor: '#fff', borderWidth: '1' },
    enterAnimation: false
  });
  renderSeries({
    type: 'voronoiTreemap',
    data: tree,
    rootVisible: true,
    maxIteration: 2,
    label: { show: true, formatter: ({ name }) => `V ${name}`, minArea: 0 },
    itemStyle: { borderColor: '#fff', borderWidth: '1' },
    enterAnimation: { show: false }
  });
  renderSeries({
    type: 'venn',
    layout: 'hollow',
    data: [
      { sets: ['A'], value: 10, itemStyle: { color: '#60a5fa' } },
      { sets: ['B'], value: 7, label: { show: false } },
      { sets: ['A', 'B'], value: 2 }
    ],
    label: { show: true, formatter: '{b}:{c}' },
    enterAnimation: false
  });
  renderSeries({
    type: 'venn',
    layout: 'bubble',
    data: [
      { name: 'A', value: 5 },
      { name: 'B', value: 2 }
    ],
    label: { show: true, formatter: ({ name }) => name }
  });

  assert.ok(true);
});

test('radial, temporal, network, and vector custom charts render branch-heavy variants', () => {
  renderSeries({
    type: 'radialArea',
    data: [
      { date: '2026-01-01', avg: 10, min: 6, max: 14 },
      { date: '2026-02-01', avg: 18, min: 11, max: 22 },
      { date: '2026-03-01', avg: 12, min: 8, max: 20 }
    ],
    angleType: 'time',
    closed: false,
    clockwise: false,
    showSymbol: true,
    label: { show: true, formatter: ({ value }) => `A ${value}` },
    angleAxis: { show: true, label: { show: true, formatter: 'M {value}' }, splitLine: { show: true } },
    radialAxis: { show: true, label: { formatter: (value) => `${value}` }, splitLine: { show: true } },
    areaStyle: { opacity: '0.2' },
    lineStyle: { type: 'dashed' },
    enterAnimation: { show: false }
  });
  renderSeries({
    type: 'radialBoxplot',
    data: [
      { name: 'A', min: 1, q1: 3, median: 4, q3: 7, max: 9, itemStyle: { color: '#60a5fa' } },
      { name: 'B', min: 2, q1: 4, median: 5, q3: 8, max: 11, label: { show: false } }
    ],
    label: { show: true, formatter: '{b}' },
    angleAxis: { show: true, label: { formatter: 'C {value}' } },
    radialAxis: { show: true, label: { formatter: (value) => `${value}` } },
    boxStyle: { opacity: '0.8' },
    lineStyle: { type: [2, 2] },
    enterAnimation: false
  });
  renderSeries({
    type: 'spiral',
    data: [
      { name: 'A', value: 10, itemStyle: { color: '#60a5fa' } },
      { name: 'B', value: 4, label: { show: false } },
      { name: 'C', value: 8 }
    ],
    label: { show: true, formatter: ({ name, value }) => `${name}:${value}` },
    lineStyle: { type: 'dotted' },
    itemStyle: { opacity: '0.8' },
    enterAnimation: { enabled: false }
  });
  renderSeries({
    type: 'subway',
    data: [
      {
        id: 'red',
        color: '#ef4444',
        status: 'planned',
        stations: [
          { id: 'a', name: 'A', coord: [0, 0], labelPosition: 'top' },
          { id: 'b', name: 'B', coord: [100, 0], label: { show: false } }
        ],
        waypoints: [['a', 0, 0], [50, 20], ['b', 100, 0]]
      },
      {
        id: 'blue',
        color: '#2563eb',
        stations: [
          { id: 'a', name: 'A', coord: [0, 0] },
          { id: 'c', name: 'C', coord: [0, 90], interchange: true }
        ]
      }
    ],
    label: { show: true, formatter: ({ name }) => `S ${name}` },
    routeLabel: { show: true, position: 'start', formatter: '{b}' },
    lineStyle: { type: 'dashed' },
    stationStyle: { borderColor: '#fff', borderWidth: '2' },
    enterAnimation: false
  }, { width: 900, height: 560 });
  renderSeries({
    type: 'sunriseSunset',
    sunrise: '22:00',
    sunset: '04:00',
    moonrise: '21:30',
    moonset: '06:20',
    currentTime: '2026-05-06 02:30:00',
    sunIcon: false,
    moonIcon: { path: 'M0 0L4 0L2 4Z', style: { fill: '#fff' } },
    label: { show: true },
    enterAnimation: false
  });
  renderSeries({
    type: 'vectorField',
    data: [
      [0, 0, 1, 0],
      [1, 0, 0, 1],
      [0, 1, -1, 0],
      [1, 1, 0, -1]
    ],
    samplingStep: 2,
    invertY: false,
    label: { show: true, formatter: ({ value }) => String(value) },
    lineStyle: { color: '#111', width: '2', opacity: '0.6' },
    arrowStyle: { color: '#222' },
    enterAnimation: { enabled: false }
  });
  renderSeries({
    type: 'smith',
    referenceImpedance: 50,
    resistanceField: 'resistance',
    reactanceField: 'reactance',
    data: [
      { name: 'Matched', resistance: 50, reactance: 0, itemStyle: { color: '#22c55e' } },
      { name: 'Inductive', resistance: 75, reactance: 25 },
      { name: 'Capacitive', resistance: 25, reactance: -20, label: { show: false } }
    ],
    showSwrCircle: true,
    grid: {
      label: { show: true, formatter: 'z {value}' },
      unitCircle: { lineStyle: { color: '#111', width: '2' } },
      axisLine: { lineStyle: { type: 'dotted' } },
      resistanceLine: { lineStyle: { type: [2, 3], opacity: '0.7' } },
      reactanceLine: { lineStyle: { type: 'dashed' } }
    },
    lineStyle: { show: true, color: '#2563eb', width: '2' },
    itemStyle: { borderWidth: '2', opacity: '0.9' },
    label: { show: true, formatter: ({ name, resistance, reactance }) => `${name}:${resistance}:${reactance}` },
    enterAnimation: {
      duration: () => 18,
      delay: () => 1,
      stagger: () => 1,
      easing: 'linear'
    }
  });
  renderSeries({
    type: 'smith',
    dataType: 'gamma',
    silent: true,
    grid: { show: false },
    lineStyle: { show: false },
    symbolSize: 0,
    label: { show: true, formatter: '{b}:{gamma}' },
    data: [
      { name: 'G1', gamma: [0.2, 0.3] },
      { name: 'G2', gammaReal: -0.2, gammaImag: -0.1 }
    ],
    animation: false
  });

  assert.ok(true);
});

test('graph layout custom charts render node, edge, label, fisheye, and animation variants', () => {
  const nodes = [
    { id: 'root', name: 'Root', value: 1250000, category: 'core', itemStyle: { color: '#2563eb' }, label: { show: true, position: 'top' } },
    { id: 'a', name: 'Alpha', value: [9800, 'fallback'], category: 'leaf', symbolSize: 28 },
    { id: 'b', name: 'Beta', value: 'B2', category: 'leaf', label: { show: false } },
    { id: 'c', name: 'Gamma', value: 3.456, category: 'leaf' },
    { id: 'd', name: 'Delta', value: null, category: 'leaf' }
  ];
  const edges = [
    { id: 'ra', source: 'root', target: 'a', value: 4, lineStyle: { color: '#ef4444', width: 2 } },
    { id: 'rb', source: 'root', target: 'b', value: 2 },
    { id: 'ac', source: 'a', target: 'c', value: 1 },
    { id: 'bd', source: 'b', target: 'd', value: 1 },
    { id: 'missing', source: 'missing', target: 'd' }
  ];
  const common = {
    nodes,
    edges,
    width: '86%',
    height: '78%',
    center: ['52%', '48%'],
    label: {
      show: true,
      formatter: ({ name, value }) => `${name}:${Array.isArray(value) ? value[0] : value}`,
      color: '#111827',
      fontSize: '12',
      lineHeight: '15',
      fontWeight: 650,
      position: 'right'
    },
    itemStyle: { color: '#38bdf8', borderColor: '#fff', borderWidth: '2', opacity: 0.92 },
    edgeStyle: { color: '#64748b', width: '1.5', opacity: 0.72, type: [3, 2] },
    emphasis: {
      itemStyle: { shadowBlur: 12, shadowColor: '#000' },
      edgeStyle: { opacity: 1, width: 4 }
    },
    symbolSize: (node) => node.id === 'root' ? 38 : 18,
    enterAnimation: {
      duration: (_item, index) => 24 + index,
      delay: () => 2,
      stagger: () => 1,
      easing: 'linear'
    },
    edgeAnimation: {
      duration: () => 42,
      delay: () => 3,
      stagger: () => 1,
      easing: 'cubicOut'
    },
    fisheye: {
      show: true,
      radius: 120,
      scale: 2.4,
      labelScale: 1.4,
      preview: true,
      stroke: '#0f172a',
      strokeWidth: 2,
      opacity: 0.5
    }
  };

  ['radial', 'concentric', 'grid', 'mds'].forEach((type) => {
    renderSeries({
      ...common,
      type,
      layout: { preventOverlap: true, strictRadial: type === 'radial' },
      layoutOptions: { preventOverlap: true, maxIteration: 8 },
      rows: 2,
      cols: 3,
      sortBy: (node) => Number(node.value) || 0
    }, { width: 880, height: 580 });
  });

  renderSeries({
    ...common,
    type: 'arc',
    links: edges,
    edges: undefined,
    label: { show: true, formatter: '{b}', position: 'bottom' },
    edgeAnimation: false,
    fisheye: { show: false },
    symbolSize: ['bad']
  }, { width: 880, height: 480 });

  renderChart({
    fisheye: {
      show: true,
      radius: 100,
      scale: 2,
      preview: true,
      stroke: '#111',
      strokeWidth: 2,
      opacity: 0.75
    },
    series: []
  });

  assert.ok(true);
});

test('custom chart renderers tolerate empty, malformed, and disabled option variants', () => {
  const variants = [
    { type: 'lollipop', data: null, label: { show: true }, valueAxis: { show: false }, categoryAxis: { show: false } },
    { type: 'beeswarm', data: null, label: { show: true }, valueAxis: { show: false }, categoryAxis: { show: false } },
    { type: 'circlePacking', data: null, rootVisible: false, label: { show: true }, itemStyle: null },
    { type: 'packBubble', data: null, label: { show: true }, itemStyle: null },
    { type: 'nestedCircle', data: null, label: { show: true }, childLabel: { show: true } },
    { type: 'flame', data: null, label: { show: true }, itemStyle: null },
    { type: 'mosaic', data: null, label: { show: true }, itemStyle: null },
    { type: 'voronoiTreemap', data: null, rootVisible: false, label: { show: true }, itemStyle: null },
    { type: 'venn', data: null, layout: 'bubble', label: { show: true } },
    { type: 'radialArea', data: null, label: { show: true }, angleAxis: { show: false }, radialAxis: { show: false } },
    { type: 'radialBoxplot', data: null, label: { show: true }, angleAxis: { show: false }, radialAxis: { show: false } },
    { type: 'spiral', data: null, label: { show: true }, itemStyle: null },
    { type: 'subway', data: null, label: { show: true }, routeLabel: { show: true } },
    { type: 'sunriseSunset', data: null, label: { show: true }, sunIcon: null, moonIcon: null },
    { type: 'vectorField', data: null, label: { show: true }, lineStyle: null, arrowStyle: null },
    { type: 'smith', data: null, label: { show: true }, grid: { show: false }, lineStyle: null }
  ];

  variants.forEach((series) => {
    renderSeries({
      ...series,
      silent: true,
      animation: false,
      enterAnimation: true,
      width: 0,
      height: 0,
      left: 'bad',
      top: 'bad'
    }, { width: 1, height: 1 });
  });

  assert.ok(true);
});

function renderSeries(series, size = { width: 760, height: 520 }) {
  renderChart({ animation: true, series: [series] }, size, series);
}

function renderChart(option, size = { width: 760, height: 520 }, series = null) {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: size.width,
    height: size.height
  });

  chart.setOption(option);
  if (series) {
    chart.setOption({ series: [{ ...series, left: '8%', top: '10%' }] }, {
      notMerge: false,
      lazyUpdate: false
    });
    chart.setOption({ series: [] }, {
      replaceMerge: ['series'],
      lazyUpdate: false
    });
  }
  const displayList = chart.getZr().storage.getDisplayList();
  chart.dispose();
  assert.ok(Array.isArray(displayList));
  return displayList;
}
