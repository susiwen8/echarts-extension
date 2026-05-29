import type { WaterdropFusionShape } from './waterdrop-fusion.js';

export interface MetaballCircle {
  x: number;
  y: number;
  r: number;
}

export interface MetaballBridgeOptions {
  maxDistance?: number;
  handleSize?: number;
  viscosity?: number;
}

export interface FusionEnvelopeOptions {
  fusionProgress?: number;
  handleSize?: number;
  bridgeLength?: number;
}

export interface SplitEnvelopeOptions {
  releaseProgress?: number;
  handleSize?: number;
  bridgeLength?: number;
}

interface Point {
  x: number;
  y: number;
}

export type WaterdropSurfaceShape = WaterdropFusionShape;

interface WaterdropShapeOptions {
  bridgeLength?: number;
  handleSize?: number;
  neckSize?: number;
  bridgeOnly?: boolean;
}

export function createMetaballBridgePath(
  source: MetaballCircle,
  target: MetaballCircle,
  options: MetaballBridgeOptions = {}
): string {
  const maxDistance = finiteNumber(options.maxDistance, 120);
  if (!isValidCircle(source) || !isValidCircle(target)) return '';
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance) || distance <= 0 || distance > maxDistance) return '';
  const minRadius = Math.min(source.r, target.r);
  if (distance <= Math.abs(source.r - target.r) + minRadius * 0.18) return '';

  const contact = clamp((source.r + target.r + minRadius * 0.9 - distance) / Math.max(1e-9, minRadius * 1.55), 0, 1);
  if (contact <= 0) return '';

  const viscosity = clamp(finiteNumber(options.viscosity, 0.62), 0, 1);
  const smoothness = clamp(finiteNumber(options.handleSize, 0.58), 0.1, 1.4);
  const contour = sampleMetaballContour(source, target, {
    contact,
    distance,
    viscosity
  });
  /* v8 ignore next -- Valid nearby circles produce the sampled contour; empty contour is a numerical guard. */
  if (contour.length < 12) return '';
  return contourToCubicPath(contour, smoothness);
}

export function computeMetaballBridgeStrength(
  source: MetaballCircle,
  target: MetaballCircle,
  maxDistance = 120
): number {
  const distance = Math.hypot(target.x - source.x, target.y - source.y);
  if (!Number.isFinite(distance) || distance <= 0 || distance > maxDistance) return 0;
  return Math.max(0, Math.min(1, 1 - distance / maxDistance));
}

export function createFusionEnvelopePath(
  source: MetaballCircle,
  target: MetaballCircle,
  options: FusionEnvelopeOptions = {}
): string {
  if (!isValidCircle(source) || !isValidCircle(target)) return '';
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.hypot(dx, dy);
  /* v8 ignore next -- Circle validity above guarantees a finite distance. */
  if (!Number.isFinite(distance)) return '';
  if (distance <= 1e-6) return createCirclePath(target.x, target.y, Math.max(source.r, target.r));

  const progress = clamp(finiteNumber(options.fusionProgress, 0), 0, 1);
  const tailRadius = Math.max(0.1, source.r);
  const neck = Math.min(tailRadius, target.r) * smootherStep((progress - 0.04) / 0.5);
  return createWaterdropFusionPath(source, tailRadius, target, target.r, neck, {
    bridgeLength: finiteNumber(options.bridgeLength, 42),
    curve: finiteNumber(options.handleSize, 0.85)
  });
}

export function createWaterdropSurfacePath(
  source: MetaballCircle,
  target: MetaballCircle,
  options: Omit<FusionEnvelopeOptions, 'fusionProgress'> = {}
): string {
  if (!isValidCircle(source) || !isValidCircle(target)) return '';
  const [left, right] = orderWaterdropPair(source, target);
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.hypot(dx, dy);
  /* v8 ignore next -- Circle validity above guarantees a finite distance. */
  if (!Number.isFinite(distance)) return '';
  if (distance <= 1e-6) return createCirclePath(target.x, target.y, Math.max(source.r, target.r));
  return createWaterdropFusionPath(left, left.r, right, right.r, Math.min(left.r, right.r), {
    bridgeLength: finiteNumber(options.bridgeLength, 38),
    curve: finiteNumber(options.handleSize, 0.85)
  });
}

export function createWaterdropSurfaceShape(
  source: MetaballCircle,
  target: MetaballCircle,
  options: Omit<FusionEnvelopeOptions, 'fusionProgress'> = {}
): WaterdropSurfaceShape | null {
  return createWaterdropFusionShape(source, target, options);
}

export function createWaterdropFusionShape(
  source: MetaballCircle,
  target: MetaballCircle,
  options: WaterdropShapeOptions = {}
): WaterdropSurfaceShape | null {
  if (!isValidCircle(source) || !isValidCircle(target)) return null;
  const [left, right] = orderWaterdropPair(source, target);
  const leftRadius = Math.max(1, left.r);
  const rightRadius = Math.max(1, right.r);
  const minRadius = Math.min(leftRadius, rightRadius);
  const distance = Math.hypot(right.x - left.x, right.y - left.y);
  const gap = Math.max(0, distance - leftRadius - rightRadius);
  const bridgeLength = Math.max(finiteNumber(options.bridgeLength, 38), gap);
  const neck = clamp(finiteNumber(options.neckSize, minRadius), 0, minRadius);
  const shape: WaterdropSurfaceShape = {
    cx: (left.x + right.x) / 2 - (leftRadius - rightRadius) / 2,
    cy: (left.y + right.y) / 2,
    width: right.x - left.x + leftRadius + rightRadius,
    height: Math.max(leftRadius, rightRadius) * 2,
    neck,
    leftRadius,
    rightRadius,
    dy: right.y - left.y,
    curve: finiteNumber(options.handleSize, 0.85),
    bridgeLength
  };
  if (options.bridgeOnly === true) {
    shape.x0 = left.x;
    shape.y0 = left.y;
    shape.r0 = leftRadius;
    shape.x1 = right.x;
    shape.y1 = right.y;
    shape.r1 = rightRadius;
    shape.bridgeOnly = true;
  }
  return shape;
}

export function createSplitEnvelopePath(
  source: MetaballCircle,
  target: MetaballCircle,
  options: SplitEnvelopeOptions = {}
): string {
  if (!isValidCircle(source) || !isValidCircle(target)) return '';
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.hypot(dx, dy);
  /* v8 ignore next -- Circle validity above guarantees a finite distance. */
  if (!Number.isFinite(distance)) return '';
  if (distance <= 1e-6) return createCirclePath(source.x, source.y, Math.max(source.r, target.r));

  const release = clamp(finiteNumber(options.releaseProgress, 0), 0, 1);
  const neck = Math.min(source.r, target.r) * smootherStep(1 - release);
  return createWaterdropFusionPath(source, source.r, target, target.r, neck, {
    bridgeLength: finiteNumber(options.bridgeLength, 42),
    curve: finiteNumber(options.handleSize, 0.85)
  });
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function easeInOutCubic(value: number): number {
  const t = clamp(value, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
}

function smoothStep(edge0: number, edge1: number, value: number): number {
  const t = clamp((value - edge0) / Math.max(1e-9, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function smootherStep(value: number): number {
  const t = clamp(value, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

function isValidCircle(circle: MetaballCircle): boolean {
  return Number.isFinite(circle.x) && Number.isFinite(circle.y) && Number.isFinite(circle.r) && circle.r > 0;
}

function orderWaterdropPair(left: MetaballCircle, right: MetaballCircle): [MetaballCircle, MetaballCircle] {
  if (right.x < left.x || (right.x === left.x && right.y < left.y)) {
    return [right, left];
  }
  return [left, right];
}

function sampleMetaballContour(
  source: MetaballCircle,
  target: MetaballCircle,
  context: { contact: number; distance: number; viscosity: number }
): Point[] {
  const sampleCount = 72;
  const center = {
    x: (source.x * source.r + target.x * target.r) / (source.r + target.r),
    y: (source.y * source.r + target.y * target.r) / (source.r + target.r)
  };
  const easedContact = easeInOutCubic(context.contact);
  const saddle = estimateSaddleField(source, target);
  const isoValue = Math.max(0.72, Math.min(1 + easedContact * (0.1 + context.viscosity * 0.14), saddle * 0.92));
  /* v8 ignore next -- Contact-positive valid circles keep the weighted center inside the field. */
  if (metaballField(center, source, target) <= isoValue) return [];

  const maxRadius = context.distance + Math.max(source.r, target.r) * 3 + Math.min(source.r, target.r) * 4;
  const points: Point[] = [];
  for (let index = 0; index < sampleCount; index += 1) {
    const angle = (index / sampleCount) * Math.PI * 2;
    const point = sampleContourPoint(center, angle, maxRadius, isoValue, source, target);
    /* v8 ignore next -- maxRadius encloses the sampled field for valid nearby circles. */
    if (!point) return [];
    points.push(point);
  }
  return points;
}

function sampleContourPoint(
  center: Point,
  angle: number,
  maxRadius: number,
  isoValue: number,
  source: MetaballCircle,
  target: MetaballCircle
): Point | null {
  const direction = { x: Math.cos(angle), y: Math.sin(angle) };
  let low = 0;
  let high = Math.max(source.r, target.r, 1);
  while (high < maxRadius && metaballField(rayPoint(center, direction, high), source, target) > isoValue) {
    high *= 1.45;
  }
  /* v8 ignore next -- sampleMetaballContour chooses maxRadius to enclose the field. */
  if (metaballField(rayPoint(center, direction, high), source, target) > isoValue) return null;

  for (let iteration = 0; iteration < 24; iteration += 1) {
    const mid = (low + high) / 2;
    if (metaballField(rayPoint(center, direction, mid), source, target) > isoValue) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return rayPoint(center, direction, (low + high) / 2);
}

function rayPoint(center: Point, direction: Point, radius: number): Point {
  return {
    x: center.x + direction.x * radius,
    y: center.y + direction.y * radius
  };
}

function metaballField(point: Point, source: MetaballCircle, target: MetaballCircle): number {
  return circleField(point, source) + circleField(point, target);
}

function circleField(point: Point, circle: MetaballCircle): number {
  const dx = point.x - circle.x;
  const dy = point.y - circle.y;
  return (circle.r * circle.r) / Math.max(1e-6, dx * dx + dy * dy);
}

function estimateSaddleField(source: MetaballCircle, target: MetaballCircle): number {
  const samples = 48;
  let lowest = Number.POSITIVE_INFINITY;
  for (let index = 1; index < samples; index += 1) {
    const amount = index / samples;
    const point = {
      x: source.x + (target.x - source.x) * amount,
      y: source.y + (target.y - source.y) * amount
    };
    lowest = Math.min(lowest, metaballField(point, source, target));
  }
  /* v8 ignore next -- Valid circle inputs always produce finite saddle samples. */
  return Number.isFinite(lowest) ? lowest : 1;
}

function createWaterdropFusionPath(
  left: MetaballCircle,
  leftRadius: number,
  right: MetaballCircle,
  rightRadius: number,
  neckSize: number,
  options: { bridgeLength: number; curve: number }
): string {
  /* v8 ignore next -- Public callers validate positive radii before building waterdrop paths. */
  if (leftRadius <= 0 || rightRadius <= 0) return '';
  const vx = right.x - left.x;
  const vy = right.y - left.y;
  /* v8 ignore next -- Coincident circles are handled by public zero-distance callers before this helper. */
  const dist = Math.hypot(vx, vy) || 1;
  const minRadius = Math.min(leftRadius, rightRadius);
  const maxNeck = clamp(neckSize / minRadius, 0, 1);
  const bridgeLength = Math.max(options.bridgeLength, 0);
  const gap = dist - leftRadius - rightRadius;
  const rawBridgeRate = gap <= 0
    ? 1
    : bridgeLength > 0
      /* v8 ignore next -- Non-overlapping waterdrop paths are requested with a positive bridge length. */
      ? smoothStep(0, 1, 1 - gap / bridgeLength)
      : 0;
  const bridgeRate = smoothStep(0.42, 1, rawBridgeRate);
  const visibleBridge = bridgeRate <= 0 ? 0 : 0.48 + bridgeRate * 0.52;
  const neck = maxNeck * visibleBridge;

  const circlePaths = `${createCirclePath(left.x, left.y, leftRadius)} ${createCirclePath(right.x, right.y, rightRadius)}`;

  if (neck <= 0 || dist <= Math.abs(leftRadius - rightRadius)) {
    return circlePaths;
  }

  const centerAngle = Math.atan2(vy, vx);
  let leftOverlap = 0;
  let rightOverlap = 0;

  if (dist < leftRadius + rightRadius) {
    leftOverlap = Math.acos(clamp(
      (leftRadius * leftRadius + dist * dist - rightRadius * rightRadius) / (2 * leftRadius * dist),
      -1,
      1
    ));
    rightOverlap = Math.acos(clamp(
      (rightRadius * rightRadius + dist * dist - leftRadius * leftRadius) / (2 * rightRadius * dist),
      -1,
      1
    ));
  }

  const tangentSpread = Math.acos(clamp((leftRadius - rightRadius) / dist, -1, 1));
  const spread = 0.2 + neck * 0.46;
  const leftSpread = leftOverlap + (tangentSpread - leftOverlap) * spread;
  const rightSpread = rightOverlap + (Math.PI - rightOverlap - tangentSpread) * spread;
  const leftTopAngle = centerAngle - leftSpread;
  const leftBottomAngle = centerAngle + leftSpread;
  const rightTopAngle = centerAngle + Math.PI + rightSpread;
  const rightBottomAngle = centerAngle + Math.PI - rightSpread;
  const leftTop = pointOnCircle(left, leftRadius, leftTopAngle);
  const leftBottom = pointOnCircle(left, leftRadius, leftBottomAngle);
  const rightTop = pointOnCircle(right, rightRadius, rightTopAngle);
  const rightBottom = pointOnCircle(right, rightRadius, rightBottomAngle);
  const span = Math.min(pointDistance(leftTop, rightTop), pointDistance(leftBottom, rightBottom));
  const handleRate = 0.3 + clamp(options.curve, 0, 1) * 0.35;
  const overlapRate = clamp(dist * 2 / (leftRadius + rightRadius), 0, 1);
  const handle = span * handleRate * overlapRate;

  return [
    circlePaths,
    `M ${pointCommand(leftTop)}`,
    cubic(
      {
        x: leftTop.x - Math.sin(leftTopAngle) * handle,
        y: leftTop.y + Math.cos(leftTopAngle) * handle
      },
      {
        x: rightTop.x + Math.sin(rightTopAngle) * handle,
        y: rightTop.y - Math.cos(rightTopAngle) * handle
      },
      rightTop
    ),
    `L ${pointCommand(rightBottom)}`,
    cubic(
      {
        x: rightBottom.x - Math.sin(rightBottomAngle) * handle,
        y: rightBottom.y + Math.cos(rightBottomAngle) * handle
      },
      {
        x: leftBottom.x + Math.sin(leftBottomAngle) * handle,
        y: leftBottom.y - Math.cos(leftBottomAngle) * handle
      },
      leftBottom
    ),
    'Z'
  ].join(' ');
}

function createCirclePath(cx: number, cy: number, radius: number): string {
  const center = { x: cx, y: cy };
  return [
    `M ${pointCommand({ x: cx + radius, y: cy })}`,
    ...arcToCubicCommands(center, radius, 0, Math.PI * 2),
    'Z'
  ].join(' ');
}

function pointOnCircle(center: Point, radius: number, angle: number): Point {
  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius
  };
}

function pointDistance(left: Point, right: Point): number {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

function arcToCubicCommands(center: Point, radius: number, startAngle: number, endAngle: number): string[] {
  let delta = endAngle - startAngle;
  /* v8 ignore next -- Current callers pass increasing angles for full-circle arcs. */
  while (delta < 0) delta += Math.PI * 2;
  const segments = Math.max(1, Math.ceil(delta / (Math.PI / 2)));
  const step = delta / segments;
  const commands: string[] = [];
  for (let index = 0; index < segments; index += 1) {
    const start = startAngle + step * index;
    const end = start + step;
    const k = (4 / 3) * Math.tan((end - start) / 4);
    const p0 = pointOnCircle(center, radius, start);
    const p1 = pointOnCircle(center, radius, end);
    commands.push(cubic(
      {
        x: p0.x - Math.sin(start) * radius * k,
        y: p0.y + Math.cos(start) * radius * k
      },
      {
        x: p1.x + Math.sin(end) * radius * k,
        y: p1.y - Math.cos(end) * radius * k
      },
      p1
    ));
  }
  return commands;
}

function pointCommand(point: Point): string {
  return `${round(point.x)} ${round(point.y)}`;
}

function cubic(c1: Point, c2: Point, end: Point): string {
  return `C ${pointCommand(c1)} ${pointCommand(c2)} ${pointCommand(end)}`;
}

function contourToCubicPath(points: Point[], smoothness: number): string {
  const commands = [`M ${round(points[0].x)} ${round(points[0].y)}`];
  const tension = smoothness / 6;
  points.forEach((point, index) => {
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const afterNext = points[(index + 2) % points.length];
    const c1 = {
      x: point.x + (next.x - previous.x) * tension,
      y: point.y + (next.y - previous.y) * tension
    };
    const c2 = {
      x: next.x - (afterNext.x - point.x) * tension,
      y: next.y - (afterNext.y - point.y) * tension
    };
    commands.push(
      `C ${round(c1.x)} ${round(c1.y)} ${round(c2.x)} ${round(c2.y)} ${round(next.x)} ${round(next.y)}`
    );
  });
  commands.push('Z');
  return commands.join(' ');
}
