import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as echarts from 'echarts';
import { test } from 'vitest';

import '../index.ts';
import {
  createShortestPathFrames,
  layoutShortestPath,
  resolveShortestPathLayout
} from '../src/layout.ts';

const graph = {
  nodes: [
    { id: 'A', name: 'A', x: 0.08, y: 0.5 },
    { id: 'B', name: 'B', x: 0.24, y: 0.25 },
    { id: 'C', name: 'C', x: 0.28, y: 0.72 },
    { id: 'D', name: 'D', x: 0.48, y: 0.4 },
    { id: 'E', name: 'E', x: 0.68, y: 0.58 },
    { id: 'F', name: 'F', x: 0.88, y: 0.42 }
  ],
  edges: [
    { source: 'A', target: 'B', weight: 2 },
    { source: 'A', target: 'C', weight: 5 },
    { source: 'B', target: 'C', weight: 1 },
    { source: 'B', target: 'D', weight: 2 },
    { source: 'C', target: 'D', weight: 1 },
    { source: 'C', target: 'E', weight: 6 },
    { source: 'D', target: 'E', weight: 3 },
    { source: 'D', target: 'F', weight: 6 },
    { source: 'E', target: 'F', weight: 1 }
  ]
};

test('does not depend on external graph algorithm packages', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );

  assert.equal(packageJson.dependencies?.['graphology'], undefined);
  assert.equal(packageJson.dependencies?.['@antv/algorithm'], undefined);
});

test('generates deterministic shortest path frames for supported algorithms', () => {
  const algorithms = ['dijkstra', 'bfs', 'a-star', 'bellman-ford'] as const;

  algorithms.forEach((algorithm) => {
    const first = createShortestPathFrames(graph.nodes, graph.edges, {
      algorithm,
      start: 'A',
      target: 'F'
    });
    const second = createShortestPathFrames(graph.nodes, graph.edges, {
      algorithm,
      start: 'A',
      target: 'F'
    });
    const final = first[first.length - 1];

    assert.deepEqual(first, second, `${algorithm} frames are deterministic`);
    assert.equal(final.kind, 'complete');
    assert.equal(final.path[0], 'A');
    assert.equal(final.path.at(-1), 'F');
    assert.ok(final.path.length >= 2, `${algorithm} returns a path`);
    assert.ok(final.visitedIds.includes('A'), `${algorithm} visits the start node`);
  });
});

test('dijkstra computes the weighted shortest path and distance labels', () => {
  const result = layoutShortestPath(graph, {
    width: 640,
    height: 420,
    algorithm: 'dijkstra',
    start: 'A',
    target: 'F',
    currentStep: 999
  });

  assert.equal(result.frame.kind, 'complete');
  assert.deepEqual(result.frame.path, ['A', 'B', 'D', 'E', 'F']);
  assert.equal(result.frame.distances.F, 8);
  assert.equal(result.currentStep, result.maxStep);
  assert.equal(result.nodes.find((node) => node.id === 'F')?.distanceLabel, '8');
  assert.ok(result.edges.some((edge) => edge.state === 'path'));
});

test('lays out an active relaxation frame with graph coordinates in bounds', () => {
  const result = resolveShortestPathLayout({
    ...graph,
    width: 500,
    height: 320,
    algorithm: 'dijkstra',
    start: 'A',
    target: 'F',
    currentStep: 2
  });

  assert.equal(result.algorithm, 'dijkstra');
  assert.equal(result.nodes.length, graph.nodes.length);
  assert.ok(result.frame.kind === 'relax' || result.frame.kind === 'visit' || result.frame.kind === 'inspect');
  assert.ok(result.nodes.some((node) => node.state === 'frontier' || node.state === 'visited'));
  result.nodes.forEach((node) => {
    assert.ok(node.x >= result.plot.left - 1e-6, `${node.id} left bound`);
    assert.ok(node.x <= result.plot.right + 1e-6, `${node.id} right bound`);
    assert.ok(node.y >= result.plot.top - 1e-6, `${node.id} top bound`);
    assert.ok(node.y <= result.plot.bottom + 1e-6, `${node.id} bottom bound`);
  });
});

test('maps configured graph rows into ECharts data for tooltip values', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 480,
    height: 320
  });

  try {
    chart.setOption({
      series: [
        {
          type: 'algorithmShortestPath',
          nodes: graph.nodes,
          edges: graph.edges,
          start: 'A',
          target: 'F',
          currentStep: 1
        }
      ]
    });

    const seriesModel = chart.getModel().getSeriesByIndex(0);
    const data = seriesModel.getData();

    assert.equal(data.getName(0), 'A');
    assert.equal(data.count(), graph.nodes.length);
  } finally {
    chart.dispose();
  }
});
