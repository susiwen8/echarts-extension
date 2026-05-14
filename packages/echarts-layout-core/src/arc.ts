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
type ArcOrient = 'horizontal' | 'vertical';

export interface ArcShape extends Record<string, unknown> {
  cx: number;
  cy: number;
  r: number;
  startAngle: number;
  endAngle: number;
  clockwise: boolean;
}

export function computeArcLayout(input: GraphData, options: LayoutOptions = {}): LayoutResult {
  const graph = buildLayoutGraph(input);
  const { width, height, center } = normalizeViewport(options);
  const nodeSep = finiteNumber(options.nodeSep, 20);
  const nodeSize = finiteNumber(options.nodeSize, 20);
  const orient = resolveArcOrient(options.orient);
  const hasViewport = Array.isArray(options.center) || width > 0 || height > 0;
  if (graph.nodes.length <= 1) {
    return hasViewport
      ? applySingleNodeLayout(graph, center)
      : toPublicResult(graph);
  }

  const nodeSizes = graph.nodes.map((node) => getNodeSize(node, options, { nodeSize }));
  if (orient === 'horizontal') {
    const totalWidth = nodeSizes.reduce((sum, size) => sum + size, 0) + nodeSep * (graph.nodes.length - 1);
    let cursor = hasViewport ? center[0] - totalWidth / 2 : -nodeSizes[0] / 2;
    const y = hasViewport ? center[1] : 0;
    graph.nodes.forEach((node, index) => {
      cursor += nodeSizes[index] / 2;
      node.x = cursor;
      node.y = y;
      cursor += nodeSizes[index] / 2 + nodeSep;
    });
  } else {
    const totalHeight = nodeSizes.reduce((sum, size) => sum + size, 0) + nodeSep * (graph.nodes.length - 1);
    let cursor = hasViewport ? center[1] - totalHeight / 2 : -nodeSizes[0] / 2;
    const x = hasViewport ? center[0] : 0;
    graph.nodes.forEach((node, index) => {
      cursor += nodeSizes[index] / 2;
      node.x = x;
      node.y = cursor;
      cursor += nodeSizes[index] / 2 + nodeSep;
    });
  }

  return toPublicResult(graph);
}

export function createArcPath(sourcePoint: Point, targetPoint: Point): ArcPathSegment[] {
  const [sx, sy] = sourcePoint;
  const [tx, ty] = targetPoint;
  const r = Math.hypot(tx - sx, ty - sy) / 2;
  const sweep = isVerticalArc(sourcePoint, targetPoint)
    ? sy <= ty ? 1 : 0
    : sx <= tx ? 1 : 0;
  return [
    ['M', sx, sy],
    ['A', r, r, 0, 0, sweep, tx, ty]
  ];
}

export function createArcShape(sourcePoint: Point, targetPoint: Point): ArcShape {
  const [sx, sy] = sourcePoint;
  const [tx, ty] = targetPoint;
  const cx = (sx + tx) / 2;
  const cy = (sy + ty) / 2;
  const vertical = isVerticalArc(sourcePoint, targetPoint);
  return {
    cx,
    cy,
    r: Math.hypot(tx - sx, ty - sy) / 2,
    startAngle: Math.atan2(sy - cy, sx - cx),
    endAngle: Math.atan2(ty - cy, tx - cx),
    clockwise: vertical ? sy <= ty : sx <= tx
  };
}

export function createArcBezierShape(sourcePoint: Point, targetPoint: Point) {
  const [sx, sy] = sourcePoint;
  const [tx, ty] = targetPoint;
  if (isVerticalArc(sourcePoint, targetPoint)) {
    const dy = ty - sy;
    const lift = Math.max(Math.abs(dy) / 2, 24);
    return {
      x1: sx,
      y1: sy,
      x2: tx,
      y2: ty,
      cpx1: sx + lift,
      cpy1: sy,
      cpx2: tx + lift,
      cpy2: ty
    };
  }

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

function resolveArcOrient(orient: unknown): ArcOrient {
  return orient === 'horizontal' ? 'horizontal' : 'vertical';
}

function isVerticalArc(sourcePoint: Point, targetPoint: Point): boolean {
  return Math.abs(targetPoint[1] - sourcePoint[1]) > Math.abs(targetPoint[0] - sourcePoint[0]);
}
