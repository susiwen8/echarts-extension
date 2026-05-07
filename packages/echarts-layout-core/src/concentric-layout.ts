import {
  applySingleNodeLayout,
  buildLayoutGraph,
  createSorter,
  degreeMap,
  getNodeSize,
  normalizeViewport,
  toPublicResult
} from './graph-utils.js';
import type { ConcentricLevel, GraphData, LayoutNode, LayoutOptions, LayoutResult } from './types.js';

const DEFAULT_START_ANGLE = (3 / 2) * Math.PI;

export function computeConcentricLayout(input: GraphData, options: LayoutOptions = {}): LayoutResult {
  const graph = buildLayoutGraph(input);
  const { width, height, center } = normalizeViewport(options);
  const n = graph.nodes.length;
  if (n <= 1) return applySingleNodeLayout(graph, center);

  const degrees = degreeMap(graph);
  const sortValue = createSorter(options.sortBy || 'degree', degrees);
  const nodes = graph.nodes
    .slice()
    .sort((left: LayoutNode, right: LayoutNode) => sortValue(right) - sortValue(left) || left.__index - right.__index);
  const maxValue = sortValue(nodes[0]);
  const configuredMaxLevelDiff = options.maxLevelDiff;
  const maxLevelDiff =
    typeof configuredMaxLevelDiff === 'number' && Number.isFinite(configuredMaxLevelDiff) && configuredMaxLevelDiff > 0
      ? configuredMaxLevelDiff
      : Math.max(Math.abs(maxValue) / 4, 1);
  const levels = createLevels(nodes, sortValue, maxLevelDiff);

  levels.forEach((level) => {
    level.nodeSizes = level.nodes.map((node: LayoutNode) => getNodeSize(node, options, { nodeSize: 30, nodeSpacing: 10 }));
    level.maxNodeSize = Math.max(...level.nodeSizes, 0);
    const sweep =
      options.sweep === undefined
        ? 2 * Math.PI - (2 * Math.PI) / Math.max(level.nodes.length, 1)
        : options.sweep;
    level.dTheta = sweep / Math.max(1, level.nodes.length - 1);
  });

  assignConcentricRadii(levels, options, width, height);

  const configuredStartAngle = options.startAngle;
  const startAngle =
    typeof configuredStartAngle === 'number' && Number.isFinite(configuredStartAngle)
      ? configuredStartAngle
      : DEFAULT_START_ANGLE;
  const clockwise = options.clockwise !== false;
  levels.forEach((level) => {
    const radius = level.r || 0;
    level.nodes.forEach((node, index) => {
      const theta = startAngle + (clockwise ? 1 : -1) * (level.dTheta || 0) * index;
      node.x = center[0] + radius * Math.cos(theta);
      node.y = center[1] + radius * Math.sin(theta);
    });
  });

  return toPublicResult(graph);
}

function createLevels(nodes: LayoutNode[], sortValue: (node: LayoutNode) => number, maxLevelDiff: number): ConcentricLevel[] {
  const levels: ConcentricLevel[] = [{ nodes: [], nodeSizes: [], maxNodeSize: 0, dTheta: 0, r: 0 }];
  let current = levels[0];

  nodes.forEach((node) => {
    if (current.nodes.length) {
      const first = current.nodes[0];
      if (Math.abs(sortValue(first) - sortValue(node)) >= maxLevelDiff) {
        current = { nodes: [], nodeSizes: [], maxNodeSize: 0, dTheta: 0, r: 0 };
        levels.push(current);
      }
    }
    current.nodes.push(node);
  });

  return levels;
}

function assignConcentricRadii(levels: ConcentricLevel[], options: LayoutOptions, width: number, height: number) {
  if (options.preventOverlap) {
    let radius = 0;
    levels.forEach((level, index) => {
      if (level.nodes.length > 1) {
        let requiredDistance = 0;
        for (let i = 0; i < level.nodeSizes.length - 1; i++) {
          requiredDistance = Math.max(requiredDistance, (level.nodeSizes[i] + level.nodeSizes[i + 1]) / 2);
        }
        const dcos = Math.cos(level.dTheta || 0) - 1;
        const dsin = Math.sin(level.dTheta || 0);
        const denominator = Math.sqrt(dcos * dcos + dsin * dsin);
        radius = Math.max(radius, denominator > 0 ? requiredDistance / denominator : 0);
      }
      level.r = radius;
      const nextLevel = levels[index + 1];
      if (nextLevel) radius += ((level.maxNodeSize || 0) + (nextLevel.maxNodeSize || 0)) / 2;
    });
  } else {
    let radius = 0;
    levels[0].r = 0;
    for (let index = 1; index < levels.length; index++) {
      const previous = levels[index - 1];
      const current = levels[index];
      radius += Math.max(1, ((previous.maxNodeSize || 0) + (current.maxNodeSize || 0)) / 2);
      current.r = radius;
    }
  }

  if (options.equidistant) {
    const gap = Math.max(...levels.map((level, index) => index === 0 ? level.r || 0 : (level.r || 0) - (levels[index - 1].r || 0)), 0);
    levels.forEach((level, index) => {
      level.r = index * gap;
    });
  }

  const maxHalf = Math.min(width || Infinity, height || Infinity) / 2;
  if (Number.isFinite(maxHalf) && maxHalf > 0) {
    const largest = Math.max(...levels.map((level) => (level.r || 0) + (level.maxNodeSize || 0) / 2), 0);
    if (largest > maxHalf) {
      const scale = maxHalf / largest;
      levels.forEach((level) => {
        level.r = (level.r || 0) * scale;
      });
    }
  }
}
