import {
  allPairsShortestPaths,
  applySingleNodeLayout,
  buildLayoutGraph,
  createSorter,
  degreeMap,
  finiteNumber,
  getNodeSize,
  normalizeViewport,
  replaceInfinity,
  toPublicResult
} from './graph-utils.js';
import { runMDS } from './mds-layout.js';
import type { GraphData, LayoutGraph, LayoutNode, LayoutOptions, LayoutResult, Point } from './types.js';

export function computeRadialLayout(input: GraphData, options: LayoutOptions = {}): LayoutResult {
  const graph = buildLayoutGraph(input);
  const { width, height, center } = normalizeViewport(options);
  const n = graph.nodes.length;
  if (n <= 1) return applySingleNodeLayout(graph, center);

  const focusId = options.focusNode == null ? graph.nodes[0].id : String(options.focusNode);
  const focusIndex = graph.indexById.get(focusId) ?? 0;
  if (options.fast === true) return computeFastRadialLayout(graph, focusIndex, options, width, height, center);
  const rawDistances = allPairsShortestPaths(graph);
  const maxDistance = maxFinite(rawDistances[focusIndex]);
  const distances = replaceFocusInfinity(rawDistances, focusIndex, maxDistance + 1);
  const focusDistances = distances[focusIndex];
  const maxFocusDistance = Math.max(...focusDistances, 1);
  const maxRadius = resolveMaxRadius(width, height, center);
  const linkDistance = finiteNumber(options.linkDistance, 50);
  const unitRadius = options.unitRadius == null
    ? (maxRadius > 0 ? maxRadius / maxFocusDistance : Math.max(linkDistance, 80))
    : finiteNumber(options.unitRadius, 80);
  const radii = focusDistances.map((distance) => distance * unitRadius);
  const idealDistances = radialIdealDistanceMatrix(graph, distances, radii, unitRadius, options);
  const positions = runMDS(idealDistances, 2, linkDistance);
  const focusPosition = positions[focusIndex];

  graph.nodes.forEach((node, index) => {
    node.x = positions[index][0] - focusPosition[0];
    node.y = positions[index][1] - focusPosition[1];
  });

  runRadialIterations(graph.nodes, idealDistances, radii, focusIndex, finiteNumber(options.maxIteration, 1000));
  applyRadialFallbacks(graph, radii, focusIndex, options);

  graph.nodes.forEach((node) => {
    node.x += center[0];
    node.y += center[1];
  });

  if (options.preventOverlap) {
    preventRadialOverlap(graph, radii, focusIndex, options);
  }

  return toPublicResult(graph);
}

function computeFastRadialLayout(
  graph: LayoutGraph,
  focusIndex: number,
  options: LayoutOptions,
  width: number,
  height: number,
  center: Point
): LayoutResult {
  const focusDistances = focusShortestPaths(graph, focusIndex);
  const maxDistance = Math.max(...focusDistances.filter((distance) => Number.isFinite(distance)), 1);
  const fallbackDistance = maxDistance + 1;
  const normalizedDistances = focusDistances.map((distance) => Number.isFinite(distance) ? distance : fallbackDistance);
  const maxFocusDistance = Math.max(...normalizedDistances, 1);
  const maxRadius = resolveMaxRadius(width, height, center);
  const linkDistance = finiteNumber(options.linkDistance, 50);
  const unitRadius = options.unitRadius == null
    ? (maxRadius > 0 ? maxRadius / maxFocusDistance : Math.max(linkDistance, 80))
    : finiteNumber(options.unitRadius, 80);
  const radii = normalizedDistances.map((distance) => distance * unitRadius);
  const degrees = degreeMap(graph);
  const sortValue = createSorter(options.sortBy, degrees);
  const rings = new Map<number, number[]>();
  const startAngle = Number.isFinite(options.startAngle) ? options.startAngle as number : (3 / 2) * Math.PI;
  const clockwise = options.clockwise !== false;

  graph.nodes[focusIndex].x = center[0];
  graph.nodes[focusIndex].y = center[1];
  graph.nodes.forEach((node, index) => {
    if (index === focusIndex) return;
    const radius = radii[index];
    if (!rings.has(radius)) rings.set(radius, []);
    rings.get(radius)?.push(index);
  });

  rings.forEach((indexes, radius) => {
    indexes.sort((left, right) => sortValue(graph.nodes[right]) - sortValue(graph.nodes[left]));
    const sweep = Number.isFinite(options.sweep) ? options.sweep as number : 2 * Math.PI;
    indexes.forEach((nodeIndex, localIndex) => {
      const angle = startAngle + (clockwise ? 1 : -1) * (sweep * localIndex) / Math.max(indexes.length, 1);
      graph.nodes[nodeIndex].x = center[0] + Math.cos(angle) * radius;
      graph.nodes[nodeIndex].y = center[1] + Math.sin(angle) * radius;
    });
  });

  if (options.preventOverlap) {
    preventRadialOverlap(graph, radii, focusIndex, options);
  }

  return toPublicResult(graph);
}

function focusShortestPaths(graph: LayoutGraph, focusIndex: number): number[] {
  const distances = Array(graph.nodes.length).fill(Infinity);
  const adjacency = Array.from({ length: graph.nodes.length }, () => [] as number[]);
  graph.edges.forEach((edge) => {
    const source = graph.indexById.get(edge.source);
    const target = graph.indexById.get(edge.target);
    if (source == null || target == null) return;
    adjacency[source].push(target);
    adjacency[target].push(source);
  });

  const queue = [focusIndex];
  distances[focusIndex] = 0;
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const nodeIndex = queue[cursor];
    const nextDistance = distances[nodeIndex] + 1;
    adjacency[nodeIndex].forEach((nextIndex) => {
      if (distances[nextIndex] <= nextDistance) return;
      distances[nextIndex] = nextDistance;
      queue.push(nextIndex);
    });
  }
  return distances;
}

function radialIdealDistanceMatrix(
  graph: LayoutGraph,
  distances: number[][],
  radii: number[],
  unitRadius: number,
  options: LayoutOptions
): number[][] {
  const n = distances.length;
  const linkDistance = finiteNumber(options.linkDistance, 50);
  const sortStrength = finiteNumber(options.sortStrength, 10);
  const baseLink = (linkDistance + unitRadius) / 2;
  const degrees = degreeMap(graph);
  const sortValue = createSorter(options.sortBy, degrees);
  const result = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    const radiusScale = Math.max(radii[i] / Math.max(unitRadius, 1), 1);
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const distance = distances[i][j];
      if (radii[i] === radii[j]) {
        if (options.sortBy === 'data') {
          result[i][j] = (distance * Math.abs(i - j) * sortStrength) / radiusScale;
        } else if (options.sortBy) {
          result[i][j] = (distance * Math.abs(sortValue(graph.nodes[i]) - sortValue(graph.nodes[j])) * sortStrength) / radiusScale;
        } else {
          result[i][j] = (distance * linkDistance) / radiusScale;
        }
      } else {
        result[i][j] = distance * baseLink;
      }
    }
  }

  return result;
}

function runRadialIterations(
  nodes: LayoutNode[],
  idealDistances: number[][],
  radii: number[],
  focusIndex: number,
  maxIteration: number
) {
  const n = nodes.length;
  const weights = idealDistances.map((row) =>
    row.map((value) => (value === 0 ? 0 : 1 / (value * value)))
  );
  const xs = Float64Array.from(nodes.map((node) => node.x));
  const ys = Float64Array.from(nodes.map((node) => node.y));
  const iterations = Math.max(1, Math.min(maxIteration, 1000));

  for (let iteration = 0; iteration <= iterations; iteration++) {
    const param = iteration / iterations;
    const inverseParam = 1 - param;

    for (let i = 0; i < n; i++) {
      if (i === focusIndex) continue;

      const vx = xs[i];
      const vy = ys[i];
      const originDistance = Math.hypot(vx, vy);
      const inverseOriginDistance = originDistance === 0 ? 0 : 1 / originDistance;
      let xNumerator = 0;
      let yNumerator = 0;
      let denominator = 0;

      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const ux = xs[j];
        const uy = ys[j];
        const euclideanDistance = Math.hypot(vx - ux, vy - uy);
        const inverseEuclideanDistance = euclideanDistance === 0 ? 0 : 1 / euclideanDistance;
        const idealDistance = idealDistances[j][i];
        denominator += weights[i][j];
        xNumerator += weights[i][j] * (ux + idealDistance * (vx - ux) * inverseEuclideanDistance);
        yNumerator += weights[i][j] * (uy + idealDistance * (vy - uy) * inverseEuclideanDistance);
      }

      const inverseRadius = radii[i] === 0 ? 0 : 1 / radii[i];
      denominator = denominator * inverseParam + param * inverseRadius * inverseRadius;
      xNumerator = xNumerator * inverseParam + param * inverseRadius * vx * inverseOriginDistance;
      yNumerator = yNumerator * inverseParam + param * inverseRadius * vy * inverseOriginDistance;
      if (denominator > 0) {
        xs[i] = xNumerator / denominator;
        ys[i] = yNumerator / denominator;
      }
    }
  }

  nodes.forEach((node, index) => {
    node.x = index === focusIndex ? 0 : xs[index];
    node.y = index === focusIndex ? 0 : ys[index];
  });
}

function applyRadialFallbacks(graph: LayoutGraph, radii: number[], focusIndex: number, options: LayoutOptions) {
  const rings = new Map<number, number[]>();
  graph.nodes.forEach((node, index) => {
    if (index === focusIndex) return;
    if (!Number.isFinite(node.x) || !Number.isFinite(node.y) || Math.hypot(node.x, node.y) < 1e-6) {
      const radius = radii[index];
      if (!rings.has(radius)) rings.set(radius, []);
      rings.get(radius)?.push(index);
    }
  });

  for (const [radius, indexes] of rings) {
    indexes.forEach((nodeIndex, localIndex) => {
      const angle = (Math.PI * 2 * localIndex) / indexes.length;
      graph.nodes[nodeIndex].x = Math.cos(angle) * radius;
      graph.nodes[nodeIndex].y = Math.sin(angle) * radius;
    });
  }

  if (options.sortBy) {
    sortRingAngles(graph, radii, focusIndex, options);
  }
}

function sortRingAngles(graph: LayoutGraph, radii: number[], focusIndex: number, options: LayoutOptions) {
  const degrees = degreeMap(graph);
  const sortValue = createSorter(options.sortBy, degrees);
  const ringMap = new Map<number, number[]>();
  graph.nodes.forEach((node, index) => {
    if (index === focusIndex) return;
    const radius = radii[index];
    if (!ringMap.has(radius)) ringMap.set(radius, []);
    ringMap.get(radius)?.push(index);
  });

  for (const indexes of ringMap.values()) {
    indexes
      .slice()
      .sort((left, right) => sortValue(graph.nodes[right]) - sortValue(graph.nodes[left]))
      .forEach((nodeIndex, localIndex) => {
        const angle = (Math.PI * 2 * localIndex) / indexes.length;
        const radius = radii[nodeIndex];
        graph.nodes[nodeIndex].x = Math.cos(angle) * radius;
        graph.nodes[nodeIndex].y = Math.sin(angle) * radius;
      });
  }
}

function preventRadialOverlap(graph: LayoutGraph, radii: number[], focusIndex: number, options: LayoutOptions) {
  const strictRadial = options.strictRadial !== false;
  const maxIteration = Math.max(1, Math.min(finiteNumber(options.maxPreventOverlapIteration, 200), 300));
  const k = graph.nodes.length / 4.5;

  for (let iteration = 0; iteration < maxIteration; iteration++) {
    let moved = false;
    const displacements = graph.nodes.map(() => ({ x: 0, y: 0 }));

    for (let i = 0; i < graph.nodes.length; i++) {
      for (let j = i + 1; j < graph.nodes.length; j++) {
        if (radii[i] !== radii[j]) continue;
        const left = graph.nodes[i];
        const right = graph.nodes[j];
        let dx = left.x - right.x;
        let dy = left.y - right.y;
        let distance = Math.hypot(dx, dy);
        if (distance === 0) {
          distance = 0.01;
          dx = 0.01;
          dy = 0;
        }
        const minDistance = (getNodeSize(left, options, { nodeSize: 10 }) + getNodeSize(right, options, { nodeSize: 10 })) / 2;
        if (distance >= minDistance) continue;
        const force = (k * k) / distance;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        displacements[i].x += fx;
        displacements[i].y += fy;
        displacements[j].x -= fx;
        displacements[j].y -= fy;
      }
    }

    graph.nodes.forEach((node, index) => {
      if (index === focusIndex) return;
      let { x, y } = displacements[index];
      const length = Math.hypot(x, y);
      if (!length) return;
      const limit = Math.min(length, Math.max(radii[index] / 20, 1));
      x = (x / length) * limit;
      y = (y / length) * limit;

      if (strictRadial) {
        const vx = node.x;
        const vy = node.y;
        const radialLength = Math.hypot(vx, vy);
        if (radialLength > 0) {
          const tx = vy / radialLength;
          const ty = -vx / radialLength;
          const projected = x * tx + y * ty;
          node.x += tx * projected;
          node.y += ty * projected;
          const nextLength = Math.hypot(node.x, node.y);
          node.x = (node.x / nextLength) * radii[index];
          node.y = (node.y / nextLength) * radii[index];
          moved = moved || Math.abs(projected) > 1e-3;
        }
      } else {
        node.x += x;
        node.y += y;
        moved = true;
      }
    });

    if (!moved) break;
  }
}

function replaceFocusInfinity(distances: number[][], focusIndex: number, step: number) {
  const next = replaceInfinity(distances, step || 1);
  next[focusIndex].forEach((value, index) => {
    if (value === Infinity) {
      next[focusIndex][index] = step;
      next[index][focusIndex] = step;
    }
  });
  return next;
}

function resolveMaxRadius(width: number, height: number, center: Point) {
  if (!width || !height) return 0;
  const semiWidth = Math.min(center[0], width - center[0]) || width / 2;
  const semiHeight = Math.min(center[1], height - center[1]) || height / 2;
  return Math.max(0, Math.min(semiWidth, semiHeight));
}

function maxFinite(values: number[]) {
  let max = 0;
  values.forEach((value) => {
    if (value !== Infinity && value > max) max = value;
  });
  return max;
}

export const __test__ = {
  computeFastRadialLayout,
  focusShortestPaths,
  radialIdealDistanceMatrix,
  runRadialIterations,
  applyRadialFallbacks,
  sortRingAngles,
  preventRadialOverlap,
  replaceFocusInfinity,
  resolveMaxRadius,
  maxFinite
};
