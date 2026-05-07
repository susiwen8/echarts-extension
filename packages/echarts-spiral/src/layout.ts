const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 420;
const DEFAULT_PADDING = 24;
const DEFAULT_TURNS = 4;
const DEFAULT_GAP_ANGLE = 3;
const DEFAULT_RADIAL_GAP = 10;
const EPSILON = 1e-9;

export type SpiralField = string | number;
export type SpiralSortOption = boolean | 'none' | 'asc' | 'desc';

export interface SpiralDataItem {
  id?: string | number;
  name?: string;
  value?: unknown;
  itemStyle?: Record<string, unknown>;
  label?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SpiralLayoutOptions {
  width?: number;
  height?: number;
  padding?: number;
  center?: [number | string, number | string];
  innerRadius?: number | string;
  outerRadius?: number | string;
  turns?: number;
  segmentsPerTurn?: number;
  startAngle?: number;
  clockwise?: boolean;
  sort?: SpiralSortOption;
  gapAngle?: number;
  radialGap?: number;
  bandWidth?: number;
  min?: number;
  max?: number;
  nameField?: SpiralField;
  valueField?: SpiralField;
  dimensions?: string[];
}

export interface SpiralLayoutOption extends SpiralLayoutOptions {
  data?: unknown;
  layout?: unknown;
  layoutOptions?: unknown;
}

export interface SpiralDataPoint {
  id: string;
  name: string;
  value: number;
  dataIndex: number;
  raw: unknown;
}

export interface SpiralSegment extends SpiralDataPoint {
  index: number;
  turnIndex: number;
  segmentIndex: number;
  animationOrder: number;
  startAngle: number;
  endAngle: number;
  midAngle: number;
  startAngleDegree: number;
  endAngleDegree: number;
  midAngleDegree: number;
  startProgress: number;
  endProgress: number;
  midProgress: number;
  startInnerRadius: number;
  endInnerRadius: number;
  startOuterRadius: number;
  endOuterRadius: number;
  innerRadius: number;
  outerRadius: number;
  centerRadius: number;
  valueRatio: number;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  labelAlign: 'left' | 'center' | 'right';
  labelVerticalAlign: 'top' | 'middle' | 'bottom';
  path: string;
}

export interface SpiralLayoutResult {
  width: number;
  height: number;
  padding: number;
  centerX: number;
  centerY: number;
  innerRadius: number;
  outerRadius: number;
  turns: number;
  turnCount: number;
  segmentsPerTurn: number;
  startAngle: number;
  clockwise: boolean;
  gapAngle: number;
  radialGap: number;
  bandWidth: number;
  valueExtent: {
    min: number;
    max: number;
  };
  segments: SpiralSegment[];
}

export function resolveSpiralLayout(option: SpiralLayoutOption = {}): SpiralLayoutResult {
  const layout = isPlainObject(option.layout) ? option.layout : {};
  const layoutOptions = isPlainObject(option.layoutOptions) ? option.layoutOptions : {};

  return layoutSpiral(Array.isArray(option.data) ? option.data : [], {
    ...layout,
    ...layoutOptions,
    width: finiteNumber(option.width, finiteNumber(layoutOptions.width, finiteNumber(layout.width, DEFAULT_WIDTH))),
    height: finiteNumber(option.height, finiteNumber(layoutOptions.height, finiteNumber(layout.height, DEFAULT_HEIGHT))),
    padding: finiteNumber(option.padding, finiteNumber(layoutOptions.padding, finiteNumber(layout.padding, DEFAULT_PADDING))),
    center: readCenterOption(option.center ?? layoutOptions.center ?? layout.center),
    innerRadius: readLengthOption(option.innerRadius ?? layoutOptions.innerRadius ?? layout.innerRadius),
    outerRadius: readLengthOption(option.outerRadius ?? layoutOptions.outerRadius ?? layout.outerRadius),
    turns: finiteNumber(option.turns, finiteNumber(layoutOptions.turns, finiteNumber(layout.turns, DEFAULT_TURNS))),
    segmentsPerTurn: firstFiniteNumber(option.segmentsPerTurn, layoutOptions.segmentsPerTurn, layout.segmentsPerTurn),
    startAngle: finiteNumber(option.startAngle, finiteNumber(layoutOptions.startAngle, finiteNumber(layout.startAngle, -90))),
    clockwise: readBoolean(option.clockwise) ?? readBoolean(layoutOptions.clockwise) ?? readBoolean(layout.clockwise),
    sort: readSortOption(option.sort ?? layoutOptions.sort ?? layout.sort),
    gapAngle: finiteNumber(option.gapAngle, finiteNumber(layoutOptions.gapAngle, finiteNumber(layout.gapAngle, DEFAULT_GAP_ANGLE))),
    radialGap: finiteNumber(
      option.radialGap,
      finiteNumber(layoutOptions.radialGap, finiteNumber(layout.radialGap, DEFAULT_RADIAL_GAP))
    ),
    bandWidth: firstFiniteNumber(option.bandWidth, layoutOptions.bandWidth, layout.bandWidth),
    min: firstFiniteNumber(option.min, layoutOptions.min, layout.min),
    max: firstFiniteNumber(option.max, layoutOptions.max, layout.max),
    nameField: readFieldOption(option.nameField ?? layoutOptions.nameField ?? layout.nameField),
    valueField: readFieldOption(option.valueField ?? layoutOptions.valueField ?? layout.valueField),
    dimensions: normalizeDimensions(option.dimensions ?? layoutOptions.dimensions ?? layout.dimensions)
  });
}

export function layoutSpiral(data: unknown[], options: SpiralLayoutOptions = {}): SpiralLayoutResult {
  const width = Math.max(1, finiteNumber(options.width, DEFAULT_WIDTH));
  const height = Math.max(1, finiteNumber(options.height, DEFAULT_HEIGHT));
  const padding = Math.max(0, finiteNumber(options.padding, DEFAULT_PADDING));
  const radiusLimit = Math.max(1, Math.min(width, height) / 2);
  const center = resolveCenter(options.center, width, height);
  const normalized = sortPoints(normalizeSpiralData(data, options), options.sort);
  const requestedTurns = Math.max(1, finiteNumber(options.turns, DEFAULT_TURNS));
  const turnCount = Math.max(1, Math.ceil(requestedTurns));
  const segmentsPerTurn = Math.max(
    1,
    Math.ceil(finiteNumber(options.segmentsPerTurn, normalized.length ? normalized.length / turnCount : 1))
  );
  const requiredTurnCount = normalized.length ? Math.ceil(normalized.length / segmentsPerTurn) : turnCount;
  const finalTurnCount = Math.max(turnCount, requiredTurnCount);
  const outerRadius = clamp(
    readLength(options.outerRadius, radiusLimit, radiusLimit - padding),
    0,
    radiusLimit
  );
  const innerRadius = clamp(readLength(options.innerRadius, radiusLimit, radiusLimit * 0.22), 0, outerRadius);
  const radiusSpan = Math.max(outerRadius - innerRadius, 1);
  const requestedRadialGap = Math.max(0, finiteNumber(options.radialGap, DEFAULT_RADIAL_GAP));
  const maxRadialGap = Math.max(0, (radiusSpan - finalTurnCount - 1) / finalTurnCount);
  const radialGap = Math.min(requestedRadialGap, maxRadialGap);
  const maxBandWidth = Math.max(1, (radiusSpan - finalTurnCount * radialGap) / (finalTurnCount + 1));
  const bandWidth = Math.max(1, Math.min(finiteNumber(options.bandWidth, maxBandWidth), maxBandWidth));
  const radialStep = (bandWidth + radialGap) / 360;
  const startAngle = finiteNumber(options.startAngle, -90);
  const clockwise = options.clockwise !== false;
  const valueExtent = resolveValueExtent(normalized, options);
  const angleStep = 360 / segmentsPerTurn;
  const gapAngle = Math.max(0, Math.min(finiteNumber(options.gapAngle, DEFAULT_GAP_ANGLE), angleStep * 0.88));
  const direction: 1 | -1 = clockwise ? 1 : -1;

  const segments = normalized.map((point, index) => {
    const turnIndex = Math.floor(index / segmentsPerTurn);
    const segmentIndex = index % segmentsPerTurn;
    const rawStart = index * angleStep + gapAngle / 2;
    const rawEnd = (index + 1) * angleStep - gapAngle / 2;
    const midProgress = (rawStart + rawEnd) / 2;
    const startAngleDegree = startAngle + direction * rawStart;
    const endAngleDegree = startAngle + direction * rawEnd;
    const midAngleDegree = (startAngleDegree + endAngleDegree) / 2;
    const startInnerPoint = spiralEdgePoint(center.x, center.y, rawStart, startAngle, direction, innerRadius, bandWidth, radialStep, -bandWidth / 2);
    const endInnerPoint = spiralEdgePoint(center.x, center.y, rawEnd, startAngle, direction, innerRadius, bandWidth, radialStep, -bandWidth / 2);
    const startOuterPoint = spiralEdgePoint(center.x, center.y, rawStart, startAngle, direction, innerRadius, bandWidth, radialStep, bandWidth / 2);
    const endOuterPoint = spiralEdgePoint(center.x, center.y, rawEnd, startAngle, direction, innerRadius, bandWidth, radialStep, bandWidth / 2);
    const midInnerPoint = spiralEdgePoint(center.x, center.y, midProgress, startAngle, direction, innerRadius, bandWidth, radialStep, -bandWidth / 2);
    const midOuterPoint = spiralEdgePoint(center.x, center.y, midProgress, startAngle, direction, innerRadius, bandWidth, radialStep, bandWidth / 2);
    const midCenterPoint = spiralCenterPoint(center.x, center.y, midProgress, startAngle, direction, innerRadius, bandWidth, radialStep);
    const startInnerRadius = distanceFromCenter(center.x, center.y, startInnerPoint);
    const endInnerRadius = distanceFromCenter(center.x, center.y, endInnerPoint);
    const startOuterRadius = distanceFromCenter(center.x, center.y, startOuterPoint);
    const endOuterRadius = distanceFromCenter(center.x, center.y, endOuterPoint);
    const segmentInnerRadius = distanceFromCenter(center.x, center.y, midInnerPoint);
    const segmentOuterRadius = distanceFromCenter(center.x, center.y, midOuterPoint);
    const centerRadius = distanceFromCenter(center.x, center.y, midCenterPoint);
    const midAngle = midAngleDegree * Math.PI / 180;
    const x = midCenterPoint.x;
    const y = midCenterPoint.y;
    const labelOffset = Math.max(8, bandWidth * 0.32);
    const labelX = x + Math.cos(midAngle) * labelOffset;
    const labelY = y + Math.sin(midAngle) * labelOffset;

    return {
      ...point,
      index,
      turnIndex,
      segmentIndex,
      animationOrder: index,
      startAngle: startAngleDegree * Math.PI / 180,
      endAngle: endAngleDegree * Math.PI / 180,
      midAngle,
      startAngleDegree: cleanNumber(startAngleDegree),
      endAngleDegree: cleanNumber(endAngleDegree),
      midAngleDegree: cleanNumber(midAngleDegree),
      startProgress: cleanNumber(rawStart),
      endProgress: cleanNumber(rawEnd),
      midProgress: cleanNumber(midProgress),
      startInnerRadius: cleanNumber(startInnerRadius),
      endInnerRadius: cleanNumber(endInnerRadius),
      startOuterRadius: cleanNumber(startOuterRadius),
      endOuterRadius: cleanNumber(endOuterRadius),
      innerRadius: cleanNumber(segmentInnerRadius),
      outerRadius: cleanNumber(segmentOuterRadius),
      centerRadius: cleanNumber(centerRadius),
      valueRatio: cleanNumber(valueRatio(point.value, valueExtent)),
      x: cleanNumber(x),
      y: cleanNumber(y),
      labelX: cleanNumber(labelX),
      labelY: cleanNumber(labelY),
      labelAlign: labelAlignForAngle(midAngle),
      labelVerticalAlign: labelVerticalAlignForAngle(midAngle),
      path: createSegmentPath(
        center.x,
        center.y,
        rawStart,
        rawEnd,
        startAngle,
        direction,
        innerRadius,
        bandWidth,
        radialStep
      )
    };
  });

  return {
    width,
    height,
    padding,
    centerX: cleanNumber(center.x),
    centerY: cleanNumber(center.y),
    innerRadius: cleanNumber(innerRadius),
    outerRadius: cleanNumber(outerRadius),
    turns: requestedTurns,
    turnCount: finalTurnCount,
    segmentsPerTurn,
    startAngle,
    clockwise,
    gapAngle: cleanNumber(gapAngle),
    radialGap: cleanNumber(radialGap),
    bandWidth: cleanNumber(bandWidth),
    valueExtent,
    segments
  };
}

export function normalizeSpiralData(data: unknown[], options: SpiralLayoutOptions = {}): SpiralDataPoint[] {
  const dimensions = normalizeDimensions(options.dimensions);
  const points: SpiralDataPoint[] = [];

  data.forEach((raw, dataIndex) => {
    const value = readNumber(readField(raw, options.valueField ?? 'value', dimensions, 1, [
      'value',
      'amount',
      'count',
      'score',
      'users',
      'total'
    ]));
    if (value == null) return;

    const nameValue = readField(raw, options.nameField ?? 'name', dimensions, 0, [
      'name',
      'id',
      'category',
      'label'
    ]);
    const record = isPlainObject(raw) ? raw : {};
    const name = stringifyName(nameValue ?? `spiral-${dataIndex}`);

    points.push({
      id: stringifyName(record.id ?? name),
      name,
      value,
      dataIndex,
      raw
    });
  });

  return points;
}

function createSegmentPath(
  centerX: number,
  centerY: number,
  startProgress: number,
  endProgress: number,
  startAngle: number,
  direction: 1 | -1,
  innerRadius: number,
  bandWidth: number,
  radialStep: number
): string {
  const outerPoints = sampleSpiralEdge(
    centerX,
    centerY,
    startProgress,
    endProgress,
    startAngle,
    direction,
    innerRadius,
    bandWidth,
    bandWidth / 2,
    radialStep
  );
  const innerPoints = sampleSpiralEdge(
    centerX,
    centerY,
    endProgress,
    startProgress,
    startAngle,
    direction,
    innerRadius,
    bandWidth,
    -bandWidth / 2,
    radialStep
  );

  return [
    `M ${formatPathNumber(outerPoints[0].x)} ${formatPathNumber(outerPoints[0].y)}`,
    ...outerPoints.slice(1).map((point) => `L ${formatPathNumber(point.x)} ${formatPathNumber(point.y)}`),
    ...innerPoints.map((point) => `L ${formatPathNumber(point.x)} ${formatPathNumber(point.y)}`),
    'Z'
  ].join(' ');
}

function sampleSpiralEdge(
  centerX: number,
  centerY: number,
  startProgress: number,
  endProgress: number,
  startAngle: number,
  direction: 1 | -1,
  innerRadius: number,
  bandWidth: number,
  normalOffset: number,
  radialStep: number
): Array<{ x: number; y: number }> {
  const steps = Math.max(2, Math.ceil(Math.abs(endProgress - startProgress) / 6));
  const points: Array<{ x: number; y: number }> = [];

  for (let index = 0; index <= steps; index += 1) {
    const progress = startProgress + (endProgress - startProgress) * index / steps;
    points.push(spiralEdgePoint(
      centerX,
      centerY,
      progress,
      startAngle,
      direction,
      innerRadius,
      bandWidth,
      radialStep,
      normalOffset
    ));
  }

  return points;
}

function spiralEdgePoint(
  centerX: number,
  centerY: number,
  progress: number,
  startAngle: number,
  direction: 1 | -1,
  innerRadius: number,
  bandWidth: number,
  radialStep: number,
  normalOffset: number
): { x: number; y: number } {
  const centerPoint = spiralCenterPoint(centerX, centerY, progress, startAngle, direction, innerRadius, bandWidth, radialStep);
  return {
    x: centerPoint.x + centerPoint.normalX * normalOffset,
    y: centerPoint.y + centerPoint.normalY * normalOffset
  };
}

function spiralCenterPoint(
  centerX: number,
  centerY: number,
  progress: number,
  startAngle: number,
  direction: 1 | -1,
  innerRadius: number,
  bandWidth: number,
  radialStep: number
): { x: number; y: number; normalX: number; normalY: number } {
  const radius = innerRadius + bandWidth / 2 + radialStep * progress;
  const angle = (startAngle + direction * progress) * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const angleStep = direction * Math.PI / 180;
  const tangentX = radialStep * cos - radius * sin * angleStep;
  const tangentY = radialStep * sin + radius * cos * angleStep;
  const tangentLength = Math.hypot(tangentX, tangentY) || 1;
  let normalX = -tangentY / tangentLength;
  let normalY = tangentX / tangentLength;
  const radialDot = normalX * cos + normalY * sin;
  if (radialDot < 0) {
    normalX = -normalX;
    normalY = -normalY;
  }

  return {
    x: centerX + cos * radius,
    y: centerY + sin * radius,
    normalX,
    normalY
  };
}

function distanceFromCenter(centerX: number, centerY: number, point: { x: number; y: number }): number {
  return Math.hypot(point.x - centerX, point.y - centerY);
}

function sortPoints(points: SpiralDataPoint[], sort: SpiralSortOption | undefined): SpiralDataPoint[] {
  const normalizedSort = readSortOption(sort);
  if (normalizedSort === 'none') return points;

  return points.slice().sort((left, right) => {
    const valueOrder = normalizedSort === 'asc'
      ? left.value - right.value
      : right.value - left.value;
    return valueOrder || left.dataIndex - right.dataIndex;
  });
}

function resolveValueExtent(points: SpiralDataPoint[], options: SpiralLayoutOptions): { min: number; max: number } {
  const values = points.map((point) => point.value).filter(Number.isFinite);
  let min = finiteNumber(options.min, values.length ? Math.min(...values) : 0);
  let max = finiteNumber(options.max, values.length ? Math.max(...values) : 1);

  if (max < min) [min, max] = [max, min];
  if (Math.abs(max - min) < EPSILON) max = min + 1;
  return { min, max };
}

function valueRatio(value: number, extent: { min: number; max: number }): number {
  return clamp((value - extent.min) / Math.max(extent.max - extent.min, EPSILON), 0, 1);
}

function readField(
  item: unknown,
  field: SpiralField,
  dimensions: string[],
  fallbackIndex: number,
  fallbackFields: string[]
): unknown {
  if (Array.isArray(item)) {
    const fieldIndex = typeof field === 'number'
      ? field
      : dimensions.indexOf(field);
    if (fieldIndex >= 0 && fieldIndex < item.length) return item[fieldIndex];
    if (fallbackIndex >= 0 && fallbackIndex < item.length) return item[fallbackIndex];
    return undefined;
  }

  if (!isPlainObject(item)) return undefined;
  const fields = typeof field === 'string' ? [field, ...fallbackFields] : fallbackFields;
  for (const candidate of fields) {
    if (item[candidate] != null) return item[candidate];
  }
  return undefined;
}

function resolveCenter(
  center: [number | string, number | string] | undefined,
  width: number,
  height: number
): { x: number; y: number } {
  if (!center) {
    return {
      x: width / 2,
      y: height / 2
    };
  }

  return {
    x: readCoordinate(center[0], width, width / 2),
    y: readCoordinate(center[1], height, height / 2)
  };
}

function readCoordinate(value: number | string, size: number, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.endsWith('%')) {
      const percent = Number(trimmed.slice(0, -1));
      return Number.isFinite(percent) ? size * percent / 100 : fallback;
    }
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) return numeric;
  }
  return fallback;
}

function readLength(value: unknown, relative: number, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.endsWith('%')) {
      const percent = Number(trimmed.slice(0, -1));
      return Number.isFinite(percent) ? relative * percent / 100 : fallback;
    }
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) return numeric;
  }
  return fallback;
}

function readCenterOption(value: unknown): [number | string, number | string] | undefined {
  if (!Array.isArray(value) || value.length < 2) return undefined;
  const [x, y] = value;
  const validX = typeof x === 'number' || typeof x === 'string';
  const validY = typeof y === 'number' || typeof y === 'string';
  return validX && validY ? [x, y] : undefined;
}

function readLengthOption(value: unknown): number | string | undefined {
  return typeof value === 'number' || typeof value === 'string' ? value : undefined;
}

function readSortOption(value: unknown): 'none' | 'asc' | 'desc' {
  if (value === true) return 'desc';
  if (value === 'asc' || value === 'desc') return value;
  return 'none';
}

function readFieldOption(value: unknown): SpiralField | undefined {
  return typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value)) ? value : undefined;
}

function normalizeDimensions(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function labelAlignForAngle(angle: number): 'left' | 'center' | 'right' {
  const cosine = Math.cos(angle);
  if (cosine > 0.25) return 'left';
  if (cosine < -0.25) return 'right';
  return 'center';
}

function labelVerticalAlignForAngle(angle: number): 'top' | 'middle' | 'bottom' {
  const sine = Math.sin(angle);
  if (sine > 0.25) return 'top';
  if (sine < -0.25) return 'bottom';
  return 'middle';
}

function readNumber(value: unknown): number | undefined {
  const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isFinite(numeric) ? numeric : undefined;
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function firstFiniteNumber(...values: unknown[]): number | undefined {
  return values.find((value): value is number => typeof value === 'number' && Number.isFinite(value));
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function cleanNumber(value: number): number {
  return Number(value.toFixed(6));
}

function formatPathNumber(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function stringifyName(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
