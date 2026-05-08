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

test('sunriseSunset time updates grow the day line and area on a stable trajectory', () => {
  const chart = createSsrChart();
  const series = {
    type: 'sunriseSunset',
    sunrise: '05:12',
    sunset: '18:39',
    moonrise: '22:08',
    moonset: '07:59',
    currentTime: '2026-05-05 10:47:33',
    padding: 72,
    enterAnimation: false,
    animationDurationUpdate: 0,
    dayLineStyle: { color: '#ffa72b' },
    dayAreaStyle: { color: '#ffa72b', opacity: 0.2 }
  };

  chart.setOption({ animation: true, series: [series] });
  const before = sunriseSunsetGeometry(chart);

  chart.setOption({
    animation: true,
    series: [{
      ...series,
      enterAnimation: false,
      currentTime: '2026-05-05 16:30:00'
    }]
  }, {
    notMerge: false,
    lazyUpdate: false
  });
  chart.getZr().flush?.();
  const after = sunriseSunsetGeometry(chart);
  chart.dispose();

  assert.ok(before.dayArea && after.dayArea);
  assert.ok(before.daySolid && after.daySolid);
  assert.ok(before.dayFuture && after.dayFuture);
  assert.equal(after.dayArea.width, before.dayArea.width);
  assert.ok(after.dayArea.clipWidth > before.dayArea.clipWidth + 80);
  assert.equal(after.daySolid.pointCount, before.daySolid.pointCount);
  assert.equal(after.daySolid.endX, before.daySolid.endX);
  assert.ok(after.daySolid.clipWidth > before.daySolid.clipWidth + 80);
  assert.ok(after.daySolid.clipWidth < after.daySolid.width);
  assert.equal(after.dayFuture.pointCount, before.dayFuture.pointCount);
  assert.equal(after.dayFuture.endX, before.dayFuture.endX);
  assert.ok(after.dayFuture.clipX > before.dayFuture.clipX + 80);
  assert.ok(after.dayFuture.clipWidth < before.dayFuture.clipWidth - 80);
});

test('sunriseSunset enter animation grows the day line and area with the sun icon', () => {
  const chart = createSsrChart();
  const series = {
    type: 'sunriseSunset',
    sunrise: '05:12',
    sunset: '18:39',
    moonrise: '22:08',
    moonset: '07:59',
    currentTime: '2026-05-05 10:47:33',
    padding: 72,
    enterAnimation: {
      duration: 860,
      stagger: 90,
      easing: 'cubicOut'
    },
    dayLineStyle: { color: '#ffa72b' },
    dayAreaStyle: { color: '#ffa72b', opacity: 0.2 }
  };

  chart.setOption({ animation: true, series: [series] });
  const geometry = sunriseSunsetGeometry(chart);
  const tree = collectElementTree(chart);
  chart.dispose();

  assert.ok(geometry.dayArea);
  assert.ok(geometry.daySolid);
  assert.equal(geometry.dayArea.clipWidth, 0);
  assert.ok(geometry.dayArea.clipWidthTarget > 100);
  assert.ok(geometry.dayArea.clipAnimatorTracks.includes('width'));
  assert.ok(geometry.daySolid.clipWidth <= 10);
  assert.ok(geometry.daySolid.clipWidthTarget > 100);
  assert.ok(geometry.daySolid.clipAnimatorTracks.includes('width'));
  assert.ok(
    tree.some((element) => (
      element.type === 'group'
      && element.key === 'sky:sun-icon'
      && element.x === 72
      && element.animatorTracks.includes('x')
      && element.animatorTracks.includes('y')
    )),
    'sun icon should start at sunrise and animate to the same progress edge'
  );
});

test('sunriseSunset does not show the moving moon icon before moonrise', () => {
  const tree = renderElementTree({
    type: 'sunriseSunset',
    sunrise: '05:12',
    sunset: '18:39',
    moonrise: '22:08',
    moonset: '07:59',
    currentTime: '2026-05-05 10:47:33',
    padding: 72,
    enterAnimation: false
  });

  assert.equal(
    tree.some((element) => element.type === 'group' && element.key === 'sky:moon-icon'),
    false,
    'the sky moon icon should wait until the moon is actually visible'
  );
});

test('sunriseSunset time updates cancel in-flight enter path animations', () => {
  const chart = createSsrChart();
  const series = {
    type: 'sunriseSunset',
    sunrise: '05:12',
    sunset: '18:39',
    moonrise: '22:08',
    moonset: '07:59',
    currentTime: '2026-05-05 10:47:33',
    padding: 72,
    animationDurationUpdate: 0,
    dayLineStyle: { color: '#ffa72b' },
    dayAreaStyle: { color: '#ffa72b', opacity: 0.2 }
  };

  chart.setOption({ animation: true, series: [series] });
  chart.setOption({
    animation: true,
    series: [{
      ...series,
      enterAnimation: false,
      currentTime: '2026-05-05 16:30:00'
    }]
  }, {
    notMerge: false,
    lazyUpdate: false
  });
  chart.getZr().flush?.();
  const after = sunriseSunsetGeometry(chart);
  chart.dispose();

  assert.ok(after.daySolid);
  assert.ok(after.dayArea);
  assert.ok(after.daySolid.clipWidth > 220);
  assert.ok(after.dayArea.clipWidth > 220);
});

test('sunriseSunset time updates grow the moon progress line on a stable trajectory', () => {
  const chart = createSsrChart();
  const series = {
    type: 'sunriseSunset',
    sunrise: '05:12',
    sunset: '18:39',
    moonrise: '22:08',
    moonset: '07:59',
    currentTime: '2026-05-05 23:20:00',
    padding: 72,
    enterAnimation: false,
    animationDurationUpdate: 0,
    moonLineStyle: { color: '#5a91f2' }
  };

  chart.setOption({ animation: true, series: [series] });
  const before = sunriseSunsetGeometry(chart);

  chart.setOption({
    animation: true,
    series: [{
      ...series,
      enterAnimation: false,
      currentTime: '2026-05-05 02:30:00'
    }]
  }, {
    notMerge: false,
    lazyUpdate: false
  });
  chart.getZr().flush?.();
  const after = sunriseSunsetGeometry(chart);
  chart.dispose();

  assert.ok(before.moonSolid && after.moonSolid);
  assert.equal(after.moonSolid.pointCount, before.moonSolid.pointCount);
  assert.equal(after.moonSolid.endX, before.moonSolid.endX);
  assert.ok(after.moonSolid.clipWidth > before.moonSolid.clipWidth + 30);
  assert.ok(after.moonSolid.clipWidth < after.moonSolid.width);
});

test('sunriseSunset time updates add the moon progress line after moonrise', () => {
  const chart = createSsrChart();
  const series = {
    type: 'sunriseSunset',
    sunrise: '05:12',
    sunset: '18:39',
    moonrise: '22:08',
    moonset: '07:59',
    currentTime: '2026-05-05 10:47:33',
    padding: 72,
    enterAnimation: false,
    animationDurationUpdate: 0,
    moonLineStyle: { color: '#5a91f2' }
  };

  chart.setOption({ animation: true, series: [series] });
  const before = sunriseSunsetGeometry(chart);

  chart.setOption({
    animation: true,
    series: [{
      ...series,
      enterAnimation: false,
      currentTime: '2026-05-05 23:20:00'
    }]
  }, {
    notMerge: false,
    lazyUpdate: false
  });
  chart.getZr().flush?.();
  const after = sunriseSunsetGeometry(chart);
  chart.dispose();

  assert.equal(before.moonSolid, null);
  assert.ok(after.moonSolid);
  assert.ok(after.moonSolid.clipWidth > 10);
  assert.equal(after.moonSolid.endX, after.moonFull.endX);
});

test('sunriseSunset hides the active day chart after sunset so the moon chart stays primary', () => {
  const chart = createSsrChart();
  const series = {
    type: 'sunriseSunset',
    sunrise: '05:12',
    sunset: '18:39',
    moonrise: '22:08',
    moonset: '07:59',
    currentTime: '2026-05-05 23:20:00',
    padding: 72,
    enterAnimation: false,
    animationDurationUpdate: 0,
    dayLineStyle: { color: '#ffa72b' },
    moonLineStyle: { color: '#5a91f2' },
    dayAreaStyle: { color: '#ffa72b', opacity: 0.2 }
  };

  chart.setOption({ animation: true, series: [series] });
  chart.getZr().flush?.();
  const geometry = sunriseSunsetGeometry(chart);
  chart.dispose();

  assert.equal(geometry.dayArea, null);
  assert.equal(geometry.daySolid, null);
  assert.ok(geometry.dayFuture);
  assert.equal(geometry.dayFuture.pointCount, 37);
  assert.deepEqual(geometry.dayFuture.lineDash, [7, 8]);
  assert.ok(geometry.dayFuture.opacity < 0.42);
  assert.ok(geometry.moonSolid);
  assert.ok(geometry.moonSolid.clipWidth > 10);
});

test('sunriseSunset keeps sun and moon motion icon identities separate across sunset', () => {
  const chart = createSsrChart();
  const series = {
    type: 'sunriseSunset',
    sunrise: '05:12',
    sunset: '18:39',
    moonrise: '22:08',
    moonset: '07:59',
    currentTime: '2026-05-05 10:47:33',
    padding: 72,
    enterAnimation: false,
    animationDurationUpdate: 0,
    sunIcon: {
      path: 'M -10 -7 L 10 -7 L 0 11 Z',
      style: {
        fill: '#ffdd55'
      }
    },
    moonIcon: null
  };

  chart.setOption({ animation: true, series: [series] });
  chart.setOption({
    animation: true,
    series: [{
      ...series,
      currentTime: '2026-05-05 23:20:00'
    }]
  }, {
    notMerge: false,
    lazyUpdate: false
  });
  chart.getZr().flush?.();
  const tree = collectElementTree(chart);
  chart.dispose();

  assert.ok(
    tree.some((element) => element.type === 'group' && element.key === 'sky:moon-icon'),
    'the moving moon icon should have a stable moon-specific key'
  );
  assert.equal(
    tree.some((element) => element.type === 'group' && element.key === 'sky:sun-icon'),
    false,
    'the moving sun icon should not be reused for the moon after sunset'
  );
});

function renderDisplayList(series, animation) {
  const chart = createSsrChart();

  chart.setOption({
    ...(animation === undefined ? {} : { animation }),
    series: [series]
  });

  const displayList = chart.getZr().storage.getDisplayList().slice();
  chart.dispose();
  return displayList;
}

function renderElementTree(series, animation) {
  const chart = createSsrChart();

  chart.setOption({
    ...(animation === undefined ? {} : { animation }),
    series: [series]
  });

  const elements = collectElementTree(chart);
  chart.dispose();
  return elements;
}

function createSsrChart(width = 420, height = 320) {
  return echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width,
    height
  });
}

function sunriseSunsetGeometry(chart) {
  const displayList = chart.getZr().storage.getDisplayList(true);
  return {
    dayArea: shapeStateForElement(displayList, (element) => element.z2 === -2 && element.style?.fill),
    dayFuture: shapeStateForElement(displayList, (element) => element.z2 === 1 && element.style?.stroke === '#ffa72b'),
    daySolid: shapeStateForElement(displayList, (element) => element.z2 === 3 && element.style?.stroke === '#ffa72b'),
    moonFull: shapeStateForElement(displayList, (element) => element.z2 === 0 && element.style?.stroke === '#5a91f2'),
    moonSolid: shapeStateForElement(displayList, (element) => element.z2 === 2 && element.style?.stroke === '#5a91f2')
  };
}

function shapeStateForElement(displayList, predicate) {
  const element = displayList.find(predicate);
  const rect = element?.getBoundingRect();
  const points = element?.shape?.points || [];
  const lastPoint = points[points.length - 1];
  return rect ? {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    pointCount: points.length,
    endX: Array.isArray(lastPoint) ? Math.round(lastPoint[0]) : undefined,
    percent: element?.shape?.percent,
    clipX: element?.__clipPaths?.[0]?.shape?.x,
    clipWidth: element?.__clipPaths?.[0]?.shape?.width,
    clipWidthTarget: animationTrackTarget(element?.__clipPaths?.[0], 'width'),
    clipAnimatorTracks: animatorTracks(element?.__clipPaths?.[0]),
    lineDash: element?.style?.lineDash,
    opacity: element?.style?.opacity
  } : null;
}

function collectElementTree(chart) {
  const elements = [];
  const roots = chart.getZr().storage._roots;
  for (const root of roots) {
    collectElement(root, elements);
  }
  return elements;
}

function collectElement(element, elements) {
  const children = element.children?.() ?? [];
  elements.push({
    type: element.type,
    key: element.__aliveRenderKey,
    animatorCount: element.animators?.length ?? 0,
    animatorTracks: animatorTracks(element),
    childCount: children.length,
    x: element.x,
    y: element.y
  });

  for (const child of children) {
    collectElement(child, elements);
  }
}

function animatorTracks(element) {
  return [
    ...new Set((element?.animators || []).flatMap((animator) => Object.keys(animator._tracks || {})))
  ];
}

function animationTrackTarget(element, trackName) {
  const track = (element?.animators || [])
    .map((animator) => animator._tracks?.[trackName])
    .find(Boolean);
  const keyframes = track?._keyframes || track?.keyframes || [];
  return keyframes.length ? keyframes[keyframes.length - 1].value : undefined;
}
