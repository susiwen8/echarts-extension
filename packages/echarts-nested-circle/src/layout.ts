const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;
const DEFAULT_PADDING = 20;

export const DEFAULT_RING_COLORS = [
  '#d7e4ff',
  '#c4d3fb',
  '#abbcf5',
  '#94a7ee',
  '#7e92e8',
  '#697ee2',
  '#566ddd',
  '#485fd4'
];

export interface NestedCircleDataItem {
  id?: string | number;
  name?: string;
  label?: string;
  value?: unknown;
  children?: unknown[];
  items?: unknown[];
  itemStyle?: Record<string, unknown>;
  labelStyle?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface NestedCircleLayoutOptions {
  width?: number;
  height?: number;
  padding?: number;
  center?: [number | string, number | string];
  radius?: number | string;
  centerRadiusRatio?: number;
  labelRadiusRatio?: number;
  titleRadiusRatio?: number;
  minRingThickness?: number;
  colors?: string[];
  [key: string]: unknown;
}

export interface NestedCircleLayoutOption extends NestedCircleLayoutOptions {
  data?: unknown[];
  layout?: unknown;
  layoutOptions?: unknown;
}

export interface NestedCircleRing {
  id: string;
  name: string;
  value: unknown;
  dataIndex: number;
  x: number;
  y: number;
  innerRadius: number;
  outerRadius: number;
  titleX: number;
  titleY: number;
  titleMaxWidth: number;
  color: string;
  raw: unknown;
}

export interface NestedCircleLabel {
  id: string;
  name: string;
  value: unknown;
  ringIndex: number;
  dataIndex: number;
  childIndex: number;
  x: number;
  y: number;
  angle: number;
  maxWidth: number;
  raw: unknown;
}

export interface NestedCircleLayoutResult {
  width: number;
  height: number;
  center: {
    x: number;
    y: number;
  };
  radius: number;
  rings: NestedCircleRing[];
  labels: NestedCircleLabel[];
}

interface NormalizedRing {
  id: string;
  name: string;
  value: unknown;
  children: NormalizedChild[];
  dataIndex: number;
  color?: string;
  raw: unknown;
}

interface NormalizedChild {
  id: string;
  name: string;
  value: unknown;
  childIndex: number;
  raw: unknown;
}

export function resolveNestedCircleLayout(option: NestedCircleLayoutOption = {}): NestedCircleLayoutResult {
  const data = Array.isArray(option.data) ? option.data : [];
  const layoutOptions: NestedCircleLayoutOptions = {
    ...(isPlainObject(option.layout) ? option.layout : {}),
    ...(isPlainObject(option.layoutOptions) ? option.layoutOptions : {}),
    width: finiteNumber(option.width, undefined),
    height: finiteNumber(option.height, undefined),
    padding: finiteNumber(option.padding, undefined),
    center: Array.isArray(option.center) ? option.center : undefined,
    radius: option.radius as number | string | undefined,
    centerRadiusRatio: finiteNumber(option.centerRadiusRatio, undefined),
    labelRadiusRatio: finiteNumber(option.labelRadiusRatio, undefined),
    titleRadiusRatio: finiteNumber(option.titleRadiusRatio, undefined),
    minRingThickness: finiteNumber(option.minRingThickness, undefined),
    colors: Array.isArray(option.colors) ? option.colors.filter((color): color is string => typeof color === 'string') : undefined
  };

  return layoutNestedCircle(data, layoutOptions);
}

export function layoutNestedCircle(data: unknown[], options: NestedCircleLayoutOptions = {}): NestedCircleLayoutResult {
  const width = finiteNumber(options.width, DEFAULT_WIDTH);
  const height = finiteNumber(options.height, DEFAULT_HEIGHT);
  const padding = Math.max(0, finiteNumber(options.padding, DEFAULT_PADDING));
  const maxRadius = resolveRadius(options.radius, width, height, padding);
  const center = resolveOuterCenter(options.center, width, height, padding, maxRadius);
  const bottomY = center.y + maxRadius;
  const rings = normalizeRings(data);
  const ringCount = Math.max(rings.length, 1);
  const centerRadiusRatio = clamp(finiteNumber(options.centerRadiusRatio, 0.28), 0.14, 0.74);
  const minRingThickness = Math.max(0, finiteNumber(options.minRingThickness, 0));
  const innerCircleRadius = resolveInnerCircleRadius(maxRadius, ringCount, centerRadiusRatio, minRingThickness);
  const band = ringCount <= 1 ? maxRadius : (maxRadius - innerCircleRadius) / (ringCount - 1);
  const colors = options.colors?.length ? options.colors : DEFAULT_RING_COLORS;

  const layoutRings = (rings.length ? rings : [createEmptyRing()]).map((ring, index): NestedCircleRing => {
    const innerRadius = index === 0 ? 0 : index === 1 ? innerCircleRadius : innerCircleRadius + band * (index - 1);
    const outerRadius = ringCount === 1 ? maxRadius : index === 0 ? innerCircleRadius : innerCircleRadius + band * index;
    const thickness = Math.max(outerRadius - innerRadius, 1);
    const x = center.x;
    const y = bottomY - outerRadius;
    const titleDistance = resolveTitleDistance(index, outerRadius, options.titleRadiusRatio);
    const halfChord = Math.sqrt(Math.max(outerRadius * outerRadius - titleDistance * titleDistance, 0));

    return {
      id: ring.id,
      name: ring.name,
      value: ring.value,
      dataIndex: ring.dataIndex,
      x,
      y,
      innerRadius,
      outerRadius,
      titleX: x,
      titleY: y - titleDistance,
      titleMaxWidth: Math.max(48, Math.min(halfChord * 2 - thickness * 0.2, outerRadius * 1.4)),
      color: ring.color || colors[index % colors.length],
      raw: ring.raw
    };
  });

  return {
    width,
    height,
    center,
    radius: maxRadius,
    rings: layoutRings,
    labels: layoutRings.flatMap((ring, ringIndex) => {
      const sourceRing = rings[ringIndex] || createEmptyRing();
      return layoutLabelsForRing(sourceRing, ring, layoutRings[ringIndex - 1], ringIndex, options);
    })
  };
}

function layoutLabelsForRing(
  sourceRing: NormalizedRing,
  ring: NestedCircleRing,
  previousRing: NestedCircleRing | undefined,
  ringIndex: number,
  options: NestedCircleLayoutOptions
): NestedCircleLabel[] {
  const count = sourceRing.children.length;
  if (!count) return [];
  if (ringIndex === 0) return layoutCenterLabels(sourceRing, ring);

  const thickness = Math.max(ring.outerRadius - ring.innerRadius, 1);
  const labelRadiusRatio = clamp(finiteNumber(options.labelRadiusRatio, 0.68), 0.35, 0.94);
  const maxWidth = Math.max(54, Math.min(Math.max(thickness * 3.15, ring.outerRadius * 0.32), ring.outerRadius * 0.92));
  const angles = distributeAngles(count, ringIndex === 0, ringIndex);

  return sourceRing.children.map((child, childIndex): NestedCircleLabel => {
    const angle = angles[childIndex];
    const baseRadius = ring.outerRadius * labelRadiusRatio;
    const radiusOffset = count < 4 ? 0 : ((childIndex % 3) - 1) * thickness * 0.18;
    const radius = clamp(baseRadius + radiusOffset, ring.outerRadius * 0.34, ring.outerRadius * 0.92);
    const point = placeLabelPoint(ring, previousRing, angle, radius);

    return {
      id: `${sourceRing.id}-${child.id}`,
      name: child.name,
      value: child.value,
      ringIndex,
      dataIndex: sourceRing.dataIndex,
      childIndex,
      x: point.x,
      y: point.y,
      angle,
      maxWidth,
      raw: child.raw
    };
  });
}

function layoutCenterLabels(
  sourceRing: NormalizedRing,
  ring: NestedCircleRing
): NestedCircleLabel[] {
  const count = sourceRing.children.length;
  const columns = count <= 3 ? 1 : 2;
  const rows = Math.ceil(count / columns);
  const xGap = columns === 1 ? 0 : ring.outerRadius * 0.95;
  const yStart = count <= 2 ? 0.2 : 0.15;
  const ySpan = rows <= 1 ? 0 : count <= 4 ? 0.4 : 0.62;
  const maxWidth = Math.max(68, ring.outerRadius * (columns === 1 ? 1.08 : 0.78));

  return sourceRing.children.map((child, childIndex): NestedCircleLabel => {
    const column = childIndex % columns;
    const row = Math.floor(childIndex / columns);
    const x = ring.x + (column - (columns - 1) / 2) * xGap;
    const y = ring.y + ring.outerRadius * (yStart + (rows <= 1 ? 0 : (row / (rows - 1)) * ySpan));

    return {
      id: `${sourceRing.id}-${child.id}`,
      name: child.name,
      value: child.value,
      ringIndex: 0,
      dataIndex: sourceRing.dataIndex,
      childIndex,
      x,
      y,
      angle: (Math.atan2(y - ring.y, x - ring.x) / Math.PI) * 180,
      maxWidth,
      raw: child.raw
    };
  });
}

function distributeAngles(count: number, isCenter: boolean, ringIndex: number): number[] {
  if (count <= 1) return [90];
  if (isCenter) {
    const start = 20;
    const span = 160;
    return Array.from({ length: count }, (_, index) => start + (span * index) / (count - 1));
  }

  const offset = ((ringIndex % 3) - 1) * 3;
  const leftCount = Math.ceil(count / 2);
  const rightCount = count - leftCount;
  const left = spreadAngles(leftCount, -176 + offset, -124 + offset);
  const right = spreadAngles(rightCount, -56 - offset, -8 - offset);
  return [...left, ...right].map(normalizeAngle);
}

function spreadAngles(count: number, start: number, end: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [(start + end) / 2];
  return Array.from({ length: count }, (_, index) => start + ((end - start) * index) / (count - 1));
}

function placeLabelPoint(
  ring: NestedCircleRing,
  previousRing: NestedCircleRing | undefined,
  angle: number,
  radius: number
): { x: number; y: number } {
  const radians = (angle / 180) * Math.PI;
  const margin = previousRing ? Math.min(Math.max(ring.outerRadius - previousRing.outerRadius, 1) * 0.22, 14) : 0;
  let currentRadius = radius;

  for (let attempt = 0; attempt < 9; attempt++) {
    const point = {
      x: ring.x + Math.cos(radians) * currentRadius,
      y: ring.y + Math.sin(radians) * currentRadius
    };
    if (!previousRing || Math.hypot(point.x - previousRing.x, point.y - previousRing.y) >= previousRing.outerRadius + margin) {
      return point;
    }
    currentRadius = Math.min(ring.outerRadius * 0.94, currentRadius + ring.outerRadius * 0.045);
  }

  return {
    x: ring.x + Math.cos(radians) * currentRadius,
    y: ring.y + Math.sin(radians) * currentRadius
  };
}

function normalizeAngle(angle: number): number {
  let normalized = angle % 360;
  if (normalized > 180) normalized -= 360;
  if (normalized < -180) normalized += 360;
  return normalized;
}

function resolveInnerCircleRadius(maxRadius: number, ringCount: number, centerRadiusRatio: number, minRingThickness: number): number {
  if (ringCount <= 1) return maxRadius;
  const preferred = maxRadius * centerRadiusRatio;
  if (!minRingThickness) return preferred;
  const largestCenter = Math.max(maxRadius - minRingThickness * (ringCount - 1), maxRadius * 0.14);
  return Math.min(preferred, largestCenter);
}

function resolveTitleDistance(index: number, outerRadius: number, explicitRatio: unknown): number {
  const ratio = finiteNumber(explicitRatio, index === 0 ? 0.36 : 0.82);
  return outerRadius * clamp(ratio, 0.08, 0.9);
}

function resolveOuterCenter(center: unknown, width: number, height: number, padding: number, radius: number): { x: number; y: number } {
  if (!Array.isArray(center)) {
    return {
      x: width / 2,
      y: height - padding - radius
    };
  }
  return {
    x: parsePercent(center[0], width, width / 2),
    y: parsePercent(center[1], height, height - padding - radius)
  };
}

function resolveRadius(radius: unknown, width: number, height: number, padding: number): number {
  const maxRadius = Math.max(Math.min(width, height) / 2 - padding, 1);
  if (typeof radius === 'number' && Number.isFinite(radius) && radius > 0) return Math.min(radius, maxRadius);
  if (typeof radius === 'string') return clamp(parsePercent(radius, Math.min(width, height) / 2, maxRadius), 1, maxRadius);
  return maxRadius;
}

function normalizeRings(data: unknown[]): NormalizedRing[] {
  return data.map((item, dataIndex) => normalizeRing(item, dataIndex));
}

function normalizeRing(item: unknown, dataIndex: number): NormalizedRing {
  const record = arrayToRing(item) ?? (isPlainObject(item) ? item : {});
  const name = resolveName(record, dataIndex);
  const children = normalizeChildren(record.children ?? record.items);
  const itemStyle = isPlainObject(record.itemStyle) ? record.itemStyle : {};

  return {
    id: String(record.id ?? name),
    name,
    value: Array.isArray(record.value) ? record.value[0] : record.value,
    children,
    dataIndex,
    color: typeof itemStyle.color === 'string' ? itemStyle.color : undefined,
    raw: item
  };
}

function normalizeChildren(children: unknown): NormalizedChild[] {
  if (!Array.isArray(children)) return [];
  return children.map((child, childIndex) => {
    const record = isPlainObject(child) ? child : {};
    const name = isPlainObject(child) ? resolveName(record, childIndex) : String(child);
    return {
      id: String(record.id ?? name),
      name,
      value: isPlainObject(child) ? Array.isArray(record.value) ? record.value[0] : record.value : child,
      childIndex,
      raw: child
    };
  });
}

function arrayToRing(item: unknown): Record<string, unknown> | null {
  if (!Array.isArray(item)) return null;
  return {
    name: item[0],
    children: item[1],
    value: item[2]
  };
}

function resolveName(record: Record<string, unknown>, fallbackIndex: number): string {
  const label = record.label;
  const labelName = typeof label === 'string' || typeof label === 'number' ? label : undefined;
  return String(record.name ?? labelName ?? record.id ?? fallbackIndex);
}

function createEmptyRing(): NormalizedRing {
  return {
    id: 'nested-circle',
    name: 'Nested Circle',
    value: undefined,
    children: [],
    dataIndex: 0,
    raw: null
  };
}

function parsePercent(value: unknown, max: number, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.endsWith('%')) {
      const percent = Number(trimmed.slice(0, -1));
      if (Number.isFinite(percent)) return (percent / 100) * max;
    }
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function finiteNumber(value: unknown, fallback: undefined): number | undefined;
function finiteNumber(value: unknown, fallback: number): number;
function finiteNumber(value: unknown, fallback: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export const __test__ = {
  layoutLabelsForRing,
  layoutCenterLabels,
  distributeAngles,
  spreadAngles,
  placeLabelPoint,
  normalizeAngle,
  resolveInnerCircleRadius,
  resolveTitleDistance,
  resolveOuterCenter,
  resolveRadius,
  normalizeRings,
  normalizeRing,
  normalizeChildren,
  arrayToRing,
  resolveName,
  createEmptyRing,
  parsePercent,
  finiteNumber,
  clamp,
  isPlainObject
};
