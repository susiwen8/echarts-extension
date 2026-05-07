import assert from 'node:assert/strict';
import { test } from 'vitest';

import * as echarts from 'echarts/lib/echarts';
import { SVGRenderer } from 'echarts/renderers';
import { renderAlive } from '@echarts-extension/layout-core';

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

function collectDisplayList(chart) {
  return chart.getZr().storage.getDisplayList().filter((element) => element.type !== 'group');
}
