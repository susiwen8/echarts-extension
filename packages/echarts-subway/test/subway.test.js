import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as echarts from 'echarts';
import { test } from 'vitest';

import '../index.ts';
import {
  layoutSubway,
  resolveSubwayLayout
} from '../src/layout.ts';
import { createRoundedRoutePath } from '../src/route-path.ts';
import { resolveSharedSegmentOffsets, routeSegmentOffsetKey } from '../src/route-segments.ts';

const sampleRoutes = [
  {
    id: 'line1',
    name: 'Line 1',
    color: '#d51f2a',
    stations: [
      { id: 'a', name: 'Alpha', coord: [0, 0], labelPosition: 'top' },
      { id: 'b', name: 'Beta', coord: [50, 0] },
      { id: 'c', name: 'Central', coord: [100, 0] }
    ]
  },
  {
    id: 'line2',
    name: 'Line 2',
    color: '#f5a623',
    stations: [
      { id: 'x', name: 'Xeno', coord: [100, -40] },
      { id: 'c', name: 'Central', coord: [100, 0], labelPosition: 'right' },
      { id: 'y', name: 'Yard', coord: [100, 60] }
    ]
  }
];

test('does not depend on map or geospatial packages', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );

  assert.equal(packageJson.dependencies?.d3, undefined);
  assert.equal(packageJson.dependencies?.['@antv/l7'], undefined);
  assert.equal(packageJson.dependencies?.['echarts-gl'], undefined);
});

test('computes deterministic subway routes and station layouts without a map', () => {
  const first = layoutSubway(sampleRoutes, {
    width: 500,
    height: 320,
    padding: 20,
    stationRadius: 5,
    interchangeRadius: 8
  });
  const second = layoutSubway(sampleRoutes, {
    width: 500,
    height: 320,
    padding: 20,
    stationRadius: 5,
    interchangeRadius: 8
  });

  assert.deepEqual(first, second);
  assert.equal(first.routes.length, 2);
  assert.equal(first.stations.length, 5);

  const central = first.stations.find((station) => station.id === 'c');
  assert.ok(central);
  assert.equal(central.name, 'Central');
  assert.equal(central.interchange, true);
  assert.deepEqual(central.lines, ['line1', 'line2']);
  assert.equal(central.radius, 8);
  assert.equal(central.labelPosition, 'right');

  const line1 = first.routes.find((route) => route.id === 'line1');
  assert.ok(line1);
  assert.equal(line1.color, '#d51f2a');
  assert.deepEqual(
    line1.points.map((point) => point.stationId),
    ['a', 'b', 'c']
  );

  first.stations.forEach((station) => {
    assert.ok(station.x >= 20, `${station.id} left bound`);
    assert.ok(station.y >= 20, `${station.id} top bound`);
    assert.ok(station.x <= 480, `${station.id} right bound`);
    assert.ok(station.y <= 300, `${station.id} bottom bound`);
  });
});

test('supports array station rows and route-level waypoints', () => {
  const result = resolveSubwayLayout({
    data: [
      {
        name: 'Loop',
        color: '#14a75b',
        stations: [
          ['start', 'Start', 0, 0],
          ['mid', 'Middle', 50, 0],
          ['end', 'End', 100, 50]
        ],
        waypoints: [
          ['mid', 50, 0],
          [75, 24],
          ['end', 100, 50]
        ]
      }
    ],
    width: 300,
    height: 180,
    padding: 10
  });

  assert.equal(result.routes[0].id, 'Loop');
  assert.deepEqual(
    result.routes[0].points.map((point) => point.stationId || null),
    ['mid', null, 'end']
  );
  assert.equal(result.stations[0].id, 'start');
  assert.equal(result.stations[0].name, 'Start');
});

test('rounds subway route bends with quadratic path segments', () => {
  assert.equal(
    createRoundedRoutePath([
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 40 }
    ], 10),
    'M0 0L30 0Q40 0 40 10L40 40'
  );

  assert.equal(
    createRoundedRoutePath([
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 80, y: 0 }
    ], 10),
    'M0 0L40 0L80 0'
  );
});

test('keeps station points on the route at bends', () => {
  assert.equal(
    createRoundedRoutePath([
      { x: 0, y: 0, stationId: 'before' },
      { x: 40, y: 0, stationId: 'bend-station' },
      { x: 40, y: 40, stationId: 'after' }
    ], 10),
    'M0 0L40 0L40 40'
  );
});

test('offsets routes that share the same station-to-station segment', () => {
  const offsets = resolveSharedSegmentOffsets([
    {
      id: 'yellow',
      lineWidth: 8,
      points: [
        { x: 0, y: 0, stationId: 'jinjiang' },
        { x: 40, y: -30, stationId: 'qianjiang' }
      ]
    },
    {
      id: 'green',
      lineWidth: 8,
      points: [
        { x: 40, y: -30, stationId: 'qianjiang' },
        { x: 0, y: 0, stationId: 'jinjiang' }
      ]
    }
  ]);
  const yellow = offsets.get(routeSegmentOffsetKey('yellow', 0));
  const green = offsets.get(routeSegmentOffsetKey('green', 0));

  assert.ok(yellow);
  assert.ok(green);
  assert.equal(yellow.count, 2);
  assert.equal(green.count, 2);
  assert.ok(Math.abs(yellow.offsetX) > 0 || Math.abs(yellow.offsetY) > 0);
  assert.equal(Math.round((yellow.offsetX + green.offsetX) * 1000), 0);
  assert.equal(Math.round((yellow.offsetY + green.offsetY) * 1000), 0);
});

test('renders planned subway routes as dashed lines', () => {
  const svg = renderSubwaySvg([
    {
      id: 'future',
      name: 'Future Line',
      color: '#1677c9',
      status: 'planned',
      stations: [
        { id: 'a', name: 'A', coord: [0, 0] },
        { id: 'b', name: 'B', coord: [60, 0] },
        { id: 'c', name: 'C', coord: [120, 40] }
      ]
    }
  ]);

  assert.ok(
    routeStrokeElements(svg, '#1677c9').some((element) => element.includes('stroke-dasharray')),
    'planned route path should include stroke-dasharray'
  );
});

test('renders construction extensions as dashed segments on a solid route', () => {
  const svg = renderSubwaySvg([
    {
      id: 'line1',
      name: 'Line 1',
      color: '#d51f2a',
      stations: [
        { id: 'a', name: 'A', coord: [0, 0] },
        { id: 'b', name: 'B', coord: [60, 0] },
        { id: 'c', name: 'C', coord: [120, 40] }
      ],
      waypoints: [
        ['a', 0, 0],
        ['b', 60, 0],
        [90, 0],
        ['c', 120, 40]
      ],
      segments: [
        {
          from: 'b',
          to: 'c',
          status: 'construction'
        }
      ]
    }
  ]);
  const routeElements = routeStrokeElements(svg, '#d51f2a');

  assert.ok(
    routeElements.some((element) => element.includes('stroke-dasharray')),
    'construction extension should include a dashed path'
  );
  assert.ok(
    routeElements.some((element) => !element.includes('stroke-dasharray')),
    'operating part of the same route should remain solid'
  );
});

test('uses rounded rectangle station markers for parallel route interchanges', () => {
  const svg = renderSubwaySvg([
    {
      id: 'line-a',
      name: 'Line A',
      color: '#a65f2b',
      stations: [
        { id: 'west', name: 'West', coord: [0, 0] },
        { id: 'shared', name: 'Shared', coord: [60, 0] },
        { id: 'east', name: 'East', coord: [120, 0] }
      ]
    },
    {
      id: 'line-b',
      name: 'Line B',
      color: '#773456',
      stations: [
        { id: 'west', name: 'West', coord: [0, 0] },
        { id: 'shared', name: 'Shared', coord: [60, 0] },
        { id: 'east', name: 'East', coord: [120, 0] }
      ]
    }
  ]);

  assert.equal(stationCircleElements(svg).length, 0);
  assert.ok(
    stationMarkerPathElements(svg).length >= 3,
    'parallel route station markers should render as rounded rectangle paths'
  );
});

test('keeps circle station markers for non-shared interchanges', () => {
  const svg = renderSubwaySvg([
    {
      id: 'line-a',
      name: 'Line A',
      color: '#d51f2a',
      stations: [
        { id: 'west', name: 'West', coord: [-80, 0] },
        { id: 'central', name: 'Central', coord: [0, 0] },
        { id: 'east', name: 'East', coord: [80, 0] }
      ]
    },
    {
      id: 'line-b',
      name: 'Line B',
      color: '#18a849',
      stations: [
        { id: 'southwest', name: 'Southwest', coord: [-60, 60] },
        { id: 'central', name: 'Central', coord: [0, 0] },
        { id: 'northeast', name: 'Northeast', coord: [60, -60] }
      ]
    },
    {
      id: 'line-c',
      name: 'Line C',
      color: '#f5a623',
      stations: [
        { id: 'outer-southwest', name: 'Outer Southwest', coord: [-90, 90] },
        { id: 'central', name: 'Central', coord: [0, 0] },
        { id: 'outer-northeast', name: 'Outer Northeast', coord: [90, -90] }
      ]
    }
  ]);

  assert.equal(stationMarkerPathElements(svg).length, 0);
  assert.ok(
    stationCircleElements(svg).length > 0,
    'interchange stations without a shared parallel segment should stay circular'
  );
});

test('keeps circle station markers on a single route', () => {
  const svg = renderSubwaySvg([
    {
      id: 'line-a',
      name: 'Line A',
      color: '#a65f2b',
      stations: [
        { id: 'west', name: 'West', coord: [0, 0] },
        { id: 'east', name: 'East', coord: [120, 0] }
      ]
    }
  ]);

  assert.equal(stationCircleElements(svg).length, 2);
});

function renderSubwaySvg(data) {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 320,
    height: 220
  });

  try {
    chart.setOption({
      animation: false,
      series: [
        {
          type: 'subway',
          width: '100%',
          height: '100%',
          padding: 18,
          lineWidth: 8,
          stationRadius: 4,
          interchangeRadius: 7,
          data,
          label: {
            show: false
          },
          routeLabel: {
            show: false
          }
        }
      ]
    });
    return chart.renderToSVGString();
  } finally {
    chart.dispose();
  }
}

function routeStrokeElements(svg, color) {
  return (svg.match(/<path\b[^>]*>/g) || [])
    .filter((element) => element.includes(`stroke="${color}"`) && element.includes('stroke-width="8"'));
}

function stationCircleElements(svg) {
  return (svg.match(/<circle\b[^>]*>/g) || [])
    .filter((element) => element.includes('fill="#ffffff"'));
}

function stationMarkerPathElements(svg) {
  return (svg.match(/<path\b[^>]*>/g) || [])
    .filter((element) => element.includes('fill="#ffffff"') && element.includes('stroke="#111827"'));
}
