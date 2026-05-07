import type {
  ConcentricLevel,
  GraphData,
  LayoutGraph,
  LayoutNode,
  LayoutOptions,
  LayoutResult,
  NodeSizeOption,
  Point,
  PublicLayoutNode,
  SortByOption
} from './types.js';

export function buildLayoutGraph(graph: GraphData): LayoutGraph {
  const nodes: LayoutNode[] = graph.nodes.map((node, index) => ({
    ...node,
    x: finiteNumber(node.x, 0),
    y: finiteNumber(node.y, 0),
    __index: index
  }));
  const nodeById = new Map<string, LayoutNode>(nodes.map((node) => [node.id, node]));
  const edges = graph.edges.filter((edge) => nodeById.has(edge.source) && nodeById.has(edge.target));

  return {
    nodes,
    edges,
    nodeById,
    indexById: new Map<string, number>(nodes.map((node, index) => [node.id, index]))
  };
}

export function normalizeViewport(options: LayoutOptions = {}): { width: number; height: number; center: Point } {
  const width = finiteNumber(options.width, 0);
  const height = finiteNumber(options.height, 0);
  const center = Array.isArray(options.center)
    ? [finiteNumber(options.center[0], width / 2), finiteNumber(options.center[1], height / 2)]
    : [width / 2, height / 2];
  return { width, height, center: center as Point };
}

export function applySingleNodeLayout(graph: LayoutGraph, center: Point): LayoutResult {
  return {
    nodes: graph.nodes.map((node) => ({
      ...node,
      x: center[0],
      y: center[1]
    })),
    edges: graph.edges
  };
}

export function degreeMap(graph: GraphData): Map<string, number> {
  const degrees = new Map<string, number>(graph.nodes.map((node) => [node.id, 0]));
  graph.edges.forEach((edge) => {
    degrees.set(edge.source, (degrees.get(edge.source) || 0) + 1);
    degrees.set(edge.target, (degrees.get(edge.target) || 0) + 1);
  });
  return degrees;
}

export function allPairsShortestPaths(graph: LayoutGraph): number[][] {
  const n = graph.nodes.length;
  const distances = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity))
  );

  graph.edges.forEach((edge) => {
    const source = graph.indexById.get(edge.source);
    const target = graph.indexById.get(edge.target);
    if (source == null || target == null) return;
    distances[source][target] = 1;
    distances[target][source] = 1;
  });

  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      const dik = distances[i][k];
      if (dik === Infinity) continue;
      for (let j = 0; j < n; j++) {
        const next = dik + distances[k][j];
        if (next < distances[i][j]) distances[i][j] = next;
      }
    }
  }

  return distances;
}

export function replaceInfinity(distances: number[][], fallbackStep = 1) {
  let max = 0;
  distances.forEach((row) => {
    row.forEach((value) => {
      if (value !== Infinity && value > max) max = value;
    });
  });
  const fallback = max + fallbackStep;
  return distances.map((row, i) =>
    row.map((value, j) => {
      if (i === j) return 0;
      return value === Infinity ? fallback : value;
    })
  );
}

export function getNodeSize(
  node: LayoutNode,
  options: Pick<LayoutOptions, 'nodeSize' | 'nodeSpacing'> = {},
  defaults: Pick<LayoutOptions, 'nodeSize' | 'nodeSpacing'> = {}
): number {
  const spacing = resolveNodeSpacing(node, options.nodeSpacing, defaults.nodeSpacing);
  const data = asRecord(node.data);
  const value =
    (node.symbolSize as NodeSizeOption | undefined)
    ?? (node.size as NodeSizeOption | undefined)
    ?? (data?.symbolSize as NodeSizeOption | undefined)
    ?? (data?.size as NodeSizeOption | undefined)
    ?? options.nodeSize
    ?? defaults.nodeSize
    ?? 20;
  let size;
  if (typeof value === 'function') {
    size = value(node);
  } else if (Array.isArray(value)) {
    size = Math.max(...value.map((item) => finiteNumber(item, 0)));
  } else {
    size = finiteNumber(value, 20);
  }
  return Math.max(0, size + spacing);
}

export function createSorter(sortBy: SortByOption | undefined, degrees: Map<string, number>): (node: LayoutNode) => number {
  if (!sortBy || sortBy === 'degree') {
    return (node) => degrees.get(node.id) || 0;
  }
  if (sortBy === 'data') {
    return (node) => -node.__index;
  }
  if (typeof sortBy === 'function') {
    return (node) => toSortableNumber(sortBy(node));
  }
  if (typeof sortBy === 'string') {
    return (node) => toSortableNumber(readNodeSortValue(node, sortBy));
  }
  return () => 0;
}

export function toPublicResult(graph: LayoutGraph): LayoutResult {
  return {
    nodes: graph.nodes.map((node) => {
      const { __index, __raw, ...rest } = node;
      return rest as PublicLayoutNode;
    }),
    edges: graph.edges
  };
}

export function finiteNumber<T extends number | undefined>(value: unknown, fallback: T): number | T {
  return Number.isFinite(value) ? (value as number) : fallback;
}

function toSortableNumber(value: unknown): number {
  if (Number.isFinite(value)) return value as number;
  if (typeof value === 'string') {
    let score = 0;
    for (let i = 0; i < value.length; i++) score += value.charCodeAt(i) / (i + 1);
    return score;
  }
  return 0;
}

function resolveNodeSpacing(
  node: LayoutNode,
  value: LayoutOptions['nodeSpacing'],
  fallbackValue: LayoutOptions['nodeSpacing']
): number {
  if (typeof value === 'function') return Math.max(0, finiteNumber(value(node), 0));
  if (Number.isFinite(value)) return Math.max(0, value as number);
  if (typeof fallbackValue === 'function') return Math.max(0, finiteNumber(fallbackValue(node), 0));
  return Math.max(0, finiteNumber(fallbackValue, 0));
}

function readNodeSortValue(node: LayoutNode, path: string): unknown {
  if (path.includes('.')) {
    return path.split('.').reduce<unknown>((value, key) => {
      if (value == null || typeof value !== 'object') return undefined;
      return (value as Record<string, unknown>)[key];
    }, node);
  }

  if (Object.prototype.hasOwnProperty.call(node, path)) return node[path];
  const data = asRecord(node.data);
  if (data && Object.prototype.hasOwnProperty.call(data, path)) return data[path];
  return node[path];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
