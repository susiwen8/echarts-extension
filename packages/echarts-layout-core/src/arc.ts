import type { GraphData, LayoutOptions, LayoutResult, Point } from './types.js';
import {
  applySingleNodeLayout,
  buildLayoutGraph,
  finiteNumber,
  getNodeSize,
  normalizeViewport,
  toPublicResult
} from './graph-utils.js';

type ArcPathSegment = Array<string | number>;

export function computeArcLayout(input: GraphData, options: LayoutOptions = {}): LayoutResult {
  const graph = buildLayoutGraph(input);
  const { width, height, center } = normalizeViewport(options);
  const nodeSep = finiteNumber(options.nodeSep, 20);
  const nodeSize = finiteNumber(options.nodeSize, 20);
  const hasViewport = Array.isArray(options.center) || width > 0 || height > 0;
  if (graph.nodes.length <= 1) {
    return hasViewport
      ? applySingleNodeLayout(graph, center)
      : toPublicResult(graph);
  }

  const nodeSizes = graph.nodes.map((node) => getNodeSize(node, options, { nodeSize }));
  const totalWidth = nodeSizes.reduce((sum, size) => sum + size, 0) + nodeSep * (graph.nodes.length - 1);
  let cursor = hasViewport ? center[0] - totalWidth / 2 : -nodeSizes[0] / 2;
  const y = hasViewport ? center[1] : 0;
  graph.nodes.forEach((node, index) => {
    cursor += nodeSizes[index] / 2;
    node.x = cursor;
    node.y = y;
    cursor += nodeSizes[index] / 2 + nodeSep;
  });

  return toPublicResult(graph);
}

export function createArcPath(sourcePoint: Point, targetPoint: Point): ArcPathSegment[] {
  const [sx, sy] = sourcePoint;
  const [tx, ty] = targetPoint;
  const r = Math.abs(tx - sx) / 2;
  return [
    ['M', sx, sy],
    ['A', r, r, 0, 0, sx < tx ? 1 : 0, tx, ty]
  ];
}

export function createArcBezierShape(sourcePoint: Point, targetPoint: Point) {
  const [sx, sy] = sourcePoint;
  const [tx, ty] = targetPoint;
  const dx = tx - sx;
  const lift = Math.max(Math.abs(dx) / 2, 24);
  return {
    x1: sx,
    y1: sy,
    x2: tx,
    y2: ty,
    cpx1: sx,
    cpy1: sy - lift,
    cpx2: tx,
    cpy2: ty - lift
  };
}

export function pathToString(path: ArcPathSegment[]) {
  return path.map((segment) => segment.join(' ')).join(' ');
}
