import assert from 'node:assert/strict';
import { test } from 'vitest';

import * as echarts from 'echarts/lib/echarts';
import { SVGRenderer } from 'echarts/renderers';

import 'echarts-radial';
import 'echarts-concentric';
import 'echarts-grid';
import 'echarts-mds';
import 'echarts-arc';
import 'echarts-radial-area';
import 'echarts-radial-boxplot';
import 'echarts-venn';
import 'echarts-nested-circle';
import 'echarts-mosaic';
import 'echarts-subway';
import 'echarts-flame';
import 'echarts-sunrise-sunset';

echarts.use([SVGRenderer]);

const graph = {
  data: [
    { id: 'root', name: 'Root' },
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' }
  ],
  links: [
    { source: 'root', target: 'a' },
    { source: 'root', target: 'b' }
  ]
};

const animationCases = [
  {
    name: 'radial',
    series: {
      ...graph,
      type: 'radial',
      layout: {
        unitRadius: 48,
        linkDistance: 72
      }
    }
  },
  {
    name: 'concentric',
    series: {
      ...graph,
      type: 'concentric',
      layout: {
        nodeSize: 20
      }
    }
  },
  {
    name: 'grid',
    series: {
      ...graph,
      type: 'grid',
      layout: {
        cols: 2,
        nodeSize: 20,
        preventOverlap: true
      }
    }
  },
  {
    name: 'mds',
    series: {
      ...graph,
      type: 'mds',
      layout: {
        linkDistance: 60
      }
    }
  },
  {
    name: 'arc',
    series: {
      ...graph,
      type: 'arc',
      layout: {
        nodeSep: 36,
        nodeSize: 18
      }
    }
  },
  {
    name: 'radialArea',
    series: {
      type: 'radialArea',
      angleField: 'time',
      valueField: 'value',
      minField: 'min',
      maxField: 'max',
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
  }
];

test('custom chart packages create enter animations by default', () => {
  for (const { name, series } of animationCases) {
    const displayList = renderDisplayList(series);
    assert.ok(
      displayList.some((element) => element.animators.length > 0),
      `${name} should animate at least one element`
    );
  }
});

test('custom chart package enter animations respect global animation false', () => {
  for (const { name, series } of animationCases) {
    const displayList = renderDisplayList(series, false);
    assert.equal(
      displayList.every((element) => element.animators.length === 0),
      true,
      `${name} should not animate when animation is false`
    );
  }
});

test('sunriseSunset animates sun and moon icon groups with the arc lines', () => {
  const series = {
    type: 'sunriseSunset',
    sunrise: '05:12',
    sunset: '18:39',
    moonrise: '22:08',
    moonset: '07:59',
    currentTime: '2026-05-05 06:30:00',
    remainingText: '12:09:00',
    updatedText: 'Updated 06:30'
  };

  const animatedGroups = renderElementTree(series).filter((element) => (
    element.type === 'group' && element.animatorCount > 0
  ));
  assert.equal(animatedGroups.length, 2);
  assert.ok(
    animatedGroups.some((element) => element.childCount === 11),
    'sun icon group should move with the day arc'
  );
  assert.ok(
    animatedGroups.some((element) => element.childCount === 2),
    'moon icon group should move with the moon arc'
  );

  const staticGroups = renderElementTree({
    ...series,
    enterAnimation: false
  }).filter((element) => element.type === 'group' && element.animatorCount > 0);
  assert.equal(staticGroups.length, 0);
});

test('sunriseSunset custom sun and moon icons move with the arc lines', () => {
  const series = {
    type: 'sunriseSunset',
    sunrise: '05:12',
    sunset: '18:39',
    moonrise: '22:08',
    moonset: '07:59',
    currentTime: '2026-05-05 06:30:00',
    remainingText: '12:09:00',
    updatedText: 'Updated 06:30',
    sunIcon: {
      path: 'M -10 -7 L 10 -7 L 0 11 Z',
      size: 34,
      style: {
        fill: '#ffdd55'
      }
    },
    moonIcon: 'path://M -11 0 C -5 -12 8 -10 11 0 C 8 10 -5 12 -11 0 Z'
  };

  const animatedGroups = renderElementTree(series).filter((element) => (
    element.type === 'group' && element.animatorCount > 0
  ));
  assert.equal(animatedGroups.length, 2);
  assert.equal(
    animatedGroups.every((element) => element.childCount === 1),
    true,
    'custom icons should replace the built-in multi-shape sun and moon glyphs'
  );
});

function renderDisplayList(series, animation) {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 420,
    height: 320
  });

  chart.setOption({
    ...(animation === undefined ? {} : { animation }),
    series: [series]
  });

  const displayList = chart.getZr().storage.getDisplayList().slice();
  chart.dispose();
  return displayList;
}

function renderElementTree(series, animation) {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 420,
    height: 320
  });

  chart.setOption({
    ...(animation === undefined ? {} : { animation }),
    series: [series]
  });

  const elements = [];
  const roots = chart.getZr().storage._roots;
  for (const root of roots) {
    collectElement(root, elements);
  }
  chart.dispose();
  return elements;
}

function collectElement(element, elements) {
  const children = element.children?.() ?? [];
  elements.push({
    type: element.type,
    animatorCount: element.animators?.length ?? 0,
    childCount: children.length,
    x: element.x,
    y: element.y
  });

  for (const child of children) {
    collectElement(child, elements);
  }
}
