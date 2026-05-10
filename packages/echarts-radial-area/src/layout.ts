const DEFAULT_WIDTH = 720;
const DEFAULT_HEIGHT = 720;
const DEFAULT_PADDING = 28;
const DEFAULT_INNER_RADIUS = '42%';
const DEFAULT_OUTER_RADIUS = '88%';
const DEFAULT_TICK_COUNT = 5;

export type RadialAreaAngleType = 'category' | 'time' | 'value';
export type RadialAreaField = string | number;

export interface RadialAreaDataItem {
  id?: string | number;
  name?: string;
  value?: unknown;
  min?: unknown;
  max?: unknown;
  low?: unknown;
  high?: unknown;
  time?: unknown;
  date?: unknown;
  category?: unknown;
  itemStyle?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface RadialAreaLayoutOptions {
  width?: number;
  height?: number;
  padding?: number;
  center?: [number | string, number | string];
  radius?: [number | string, number | string];
  innerRadius?: number | string;
  outerRadius?: number | string;
  startAngle?: number;
  endAngle?: number;
  angleSpan?: number;
  clockwise?: boolean;
  closed?: boolean;
  angleType?: RadialAreaAngleType;
  angleField?: RadialAreaField;
  valueField?: RadialAreaField;
  minField?: RadialAreaField;
  maxField?: RadialAreaField;
  nameField?: RadialAreaField;
  dimensions?: string[];
  categories?: Array<string | number>;
  min?: number;
  max?: number;
  tickCount?: number;
  nice?: boolean;
  [key: string]: unknown;
}

export interface RadialAreaLayoutOption extends RadialAreaLayoutOptions {
  data?: unknown[];
  layout?: unknown;
  layoutOptions?: unknown;
}

export interface RadialAreaPoint {
  id: string;
  name: string;
  angleValue: unknown;
  angle: number;
  angleRatio: number;
  value: number;
  min?: number;
  max?: number;
  radius: number;
  minRadius?: number;
  maxRadius?: number;
  x: number;
  y: number;
  minX?: number;
  minY?: number;
  maxX?: number;
  maxY?: number;
  dataIndex: number;
  raw: unknown;
}

export interface RadialAreaPolarPoint {
  name: string;
  angle: number;
  value: number;
  radius: number;
  x: number;
  y: number;
  dataIndex: number;
}

export interface RadialAreaTick {
  value: number;
  radius: number;
}

export interface RadialAreaAngleLabel {
  name: string;
  value: unknown;
  angle: number;
  x: number;
  y: number;
  align: string;
  verticalAlign: string;
}

export interface RadialAreaLayoutResult {
  width: number;
  height: number;
  padding: number;
  centerX: number;
  centerY: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  angleSpan: number;
  clockwise: boolean;
  closed: boolean;
  angleType: RadialAreaAngleType;
  valueExtent: {
    min: number;
    max: number;
  };
  radialTicks: RadialAreaTick[];
  angleLabels: RadialAreaAngleLabel[];
  points: RadialAreaPoint[];
  valuePolygon: RadialAreaPolarPoint[];
  rangePolygon: RadialAreaPolarPoint[];
}

interface NormalizedItem {
  id: string;
  name: string;
  angleValue: unknown;
  angleNumeric: number;
  value: number;
  min?: number;
  max?: number;
  dataIndex: number;
  raw: unknown;
}

interface AngleDomain {
  type: RadialAreaAngleType;
  categories: string[];
  min: number;
  max: number;
}

export function resolveRadialAreaLayout(option: RadialAreaLayoutOption = {}): RadialAreaLayoutResult {
  const layout = isPlainObject(option.layout) ? option.layout : {};
  const layoutOptions = isPlainObject(option.layoutOptions) ? option.layoutOptions : {};
  const merged: RadialAreaLayoutOptions = {
    ...layout,
    ...layoutOptions,
    width: finiteNumber(option.width, finiteNumber(layoutOptions.width, finiteNumber(layout.width, DEFAULT_WIDTH))),
    height: finiteNumber(option.height, finiteNumber(layoutOptions.height, finiteNumber(layout.height, DEFAULT_HEIGHT))),
    padding: finiteNumber(option.padding, finiteNumber(layoutOptions.padding, finiteNumber(layout.padding, DEFAULT_PADDING))),
    center: readTuple(option.center, readTuple(layoutOptions.center, readTuple(layout.center, undefined))),
    radius: readTuple(option.radius, readTuple(layoutOptions.radius, readTuple(layout.radius, undefined))),
    innerRadius: readRadiusOption(option.innerRadius ?? layoutOptions.innerRadius ?? layout.innerRadius),
    outerRadius: readRadiusOption(option.outerRadius ?? layoutOptions.outerRadius ?? layout.outerRadius),
    startAngle: finiteNumber(option.startAngle, finiteNumber(layoutOptions.startAngle, finiteNumber(layout.startAngle, undefined))),
    endAngle: finiteNumber(option.endAngle, finiteNumber(layoutOptions.endAngle, finiteNumber(layout.endAngle, undefined))),
    angleSpan: finiteNumber(option.angleSpan, finiteNumber(layoutOptions.angleSpan, finiteNumber(layout.angleSpan, undefined))),
    clockwise: firstBoolean(option.clockwise, layoutOptions.clockwise, layout.clockwise),
    closed: firstBoolean(option.closed, layoutOptions.closed, layout.closed),
    angleType: readAngleType(option.angleType ?? layoutOptions.angleType ?? layout.angleType),
    angleField: readFieldOption(option.angleField ?? layoutOptions.angleField ?? layout.angleField),
    valueField: readFieldOption(option.valueField ?? layoutOptions.valueField ?? layout.valueField),
    minField: readFieldOption(option.minField ?? layoutOptions.minField ?? layout.minField),
    maxField: readFieldOption(option.maxField ?? layoutOptions.maxField ?? layout.maxField),
    nameField: readFieldOption(option.nameField ?? layoutOptions.nameField ?? layout.nameField),
    dimensions: normalizeDimensions(option.dimensions ?? layoutOptions.dimensions ?? layout.dimensions),
    categories: normalizeCategories(option.categories ?? layoutOptions.categories ?? layout.categories),
    min: finiteNumber(option.min, finiteNumber(layoutOptions.min, finiteNumber(layout.min, undefined))),
    max: finiteNumber(option.max, finiteNumber(layoutOptions.max, finiteNumber(layout.max, undefined))),
    tickCount: finiteNumber(option.tickCount, finiteNumber(layoutOptions.tickCount, finiteNumber(layout.tickCount, undefined))),
    nice: firstBoolean(option.nice, layoutOptions.nice, layout.nice)
  };

  return layoutRadialArea(Array.isArray(option.data) ? option.data : [], merged);
}

export function layoutRadialArea(data: unknown[], options: RadialAreaLayoutOptions = {}): RadialAreaLayoutResult {
  const width = Math.max(1, finiteNumber(options.width, DEFAULT_WIDTH));
  const height = Math.max(1, finiteNumber(options.height, DEFAULT_HEIGHT));
  const padding = Math.max(0, finiteNumber(options.padding, DEFAULT_PADDING));
  const centerX = parseCenter(options.center?.[0], width, width / 2);
  const centerY = parseCenter(options.center?.[1], height, height / 2);
  const radiusLimit = Math.max(1, Math.min(width, height) / 2 - padding);
  const radiusOption = Array.isArray(options.radius) ? options.radius : undefined;
  const innerRadius = clampRadius(parseRadius(
    radiusOption?.[0] ?? options.innerRadius ?? DEFAULT_INNER_RADIUS,
    radiusLimit,
    parseRadius(DEFAULT_INNER_RADIUS, radiusLimit, radiusLimit * 0.42)
  ), 0, radiusLimit);
  const outerRadius = clampRadius(parseRadius(
    radiusOption?.[1] ?? options.outerRadius ?? DEFAULT_OUTER_RADIUS,
    radiusLimit,
    parseRadius(DEFAULT_OUTER_RADIUS, radiusLimit, radiusLimit * 0.88)
  ), innerRadius + 1, radiusLimit);
  const startAngle = finiteNumber(options.startAngle, 90);
  const clockwise = options.clockwise !== false;
  const closed = options.closed !== false;
  const angleSpan = Math.max(0, finiteNumber(
    options.angleSpan,
    options.endAngle != null ? Math.abs(startAngle - finiteNumber(options.endAngle, startAngle - 360)) : 360
  ));
  const normalized = normalizeItems(data, options);
  const angleDomain = resolveAngleDomain(normalized, options);
  const ordered = orderByAngle(normalized, angleDomain, options);
  const valueExtent = resolveValueExtent(ordered, options);
  const radialTicks = createRadialTicks(valueExtent.min, valueExtent.max, Math.max(2, Math.round(finiteNumber(options.tickCount, DEFAULT_TICK_COUNT))))
    .map((value) => ({
      value,
      radius: projectRadius(value, valueExtent, innerRadius, outerRadius)
    }));
  const points = ordered.map((item) => createPoint(
    item,
    angleDomain,
    valueExtent,
    innerRadius,
    outerRadius,
    centerX,
    centerY,
    startAngle,
    angleSpan,
    clockwise
  ));
  const valuePolygon = points.map((point) => ({
    name: point.name,
    angle: point.angle,
    value: point.value,
    radius: point.radius,
    x: point.x,
    y: point.y,
    dataIndex: point.dataIndex
  }));
  const rangePolygon = createRangePolygon(points, closed);
  const angleLabels = createAngleLabels(angleDomain, points, centerX, centerY, Math.max(innerRadius - 18, 0), startAngle, angleSpan, clockwise);

  return {
    width,
    height,
    padding,
    centerX,
    centerY,
    innerRadius,
    outerRadius,
    startAngle,
    angleSpan,
    clockwise,
    closed,
    angleType: angleDomain.type,
    valueExtent,
    radialTicks,
    angleLabels,
    points,
    valuePolygon,
    rangePolygon
  };
}

function normalizeItems(data: unknown[], options: RadialAreaLayoutOptions): NormalizedItem[] {
  const dimensions = normalizeDimensions(options.dimensions);
  const normalized: NormalizedItem[] = [];

  data.forEach((item, dataIndex) => {
    const angleValue = readField(item, options.angleField ?? 'angle', dimensions, 0, ['time', 'date', 'month', 'category', 'name']);
    const value = finiteNumber(readField(item, options.valueField ?? 'value', dimensions, 1, ['mean', 'avg', 'median']), NaN);
    if (!Number.isFinite(value)) return;
    const minValue = finiteNumber(readField(item, options.minField ?? 'min', dimensions, 2, ['low', 'lower', 'minValue']), NaN);
    const maxValue = finiteNumber(readField(item, options.maxField ?? 'max', dimensions, 3, ['high', 'upper', 'maxValue']), NaN);
    const rangeValues = normalizeRange(minValue, maxValue);
    const nameValue = readField(item, options.nameField ?? 'name', dimensions, -1, []);
    const name = stringifyName(nameValue ?? angleValue ?? `item-${dataIndex}`);
    const record = isPlainObject(item) ? item : {};
    const id = stringifyName(record.id ?? `${name}-${dataIndex}`);

    normalized.push({
      id,
      name,
      angleValue,
      angleNumeric: numericAngleValue(angleValue),
      value,
      min: rangeValues?.min,
      max: rangeValues?.max,
      dataIndex,
      raw: item
    });
  });

  return normalized;
}

function resolveAngleDomain(items: NormalizedItem[], options: RadialAreaLayoutOptions): AngleDomain {
  const explicitType = readAngleType(options.angleType);
  const type = explicitType || inferAngleType(items);
  if (type === 'category') {
    const explicitCategories = normalizeCategories(options.categories);
    const categories = explicitCategories.length
      ? explicitCategories
      : unique(items.map((item) => stringifyName(item.angleValue ?? item.name)));
    return {
      type,
      categories,
      min: 0,
      max: Math.max(categories.length, 1)
    };
  }

  const values = items
    .map((item) => item.angleNumeric)
    .filter((value) => Number.isFinite(value));
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  return {
    type,
    categories: [],
    min,
    max: max === min ? min + 1 : max
  };
}

function orderByAngle(items: NormalizedItem[], domain: AngleDomain, options: RadialAreaLayoutOptions): NormalizedItem[] {
  if (domain.type === 'category') {
    const order = new Map(domain.categories.map((category, index) => [category, index]));
    return [...items].sort((left, right) => {
      const leftOrder = order.get(stringifyName(left.angleValue ?? left.name)) ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = order.get(stringifyName(right.angleValue ?? right.name)) ?? Number.MAX_SAFE_INTEGER;
      return leftOrder - rightOrder || left.dataIndex - right.dataIndex;
    });
  }

  return [...items].sort((left, right) => left.angleNumeric - right.angleNumeric || left.dataIndex - right.dataIndex);
}

function resolveValueExtent(items: NormalizedItem[], options: RadialAreaLayoutOptions): { min: number; max: number } {
  const values: number[] = [];
  items.forEach((item) => {
    values.push(item.value);
    if (item.min != null) values.push(item.min);
    if (item.max != null) values.push(item.max);
  });

  let min = finiteNumber(options.min, values.length ? Math.min(...values) : 0);
  let max = finiteNumber(options.max, values.length ? Math.max(...values) : 1);
  if (min === max) {
    const delta = Math.abs(min) || 1;
    min -= delta * 0.5;
    max += delta * 0.5;
  }
  if (min > max) {
    [min, max] = [max, min];
  }

  const hasExplicitMin = Number.isFinite(options.min);
  const hasExplicitMax = Number.isFinite(options.max);
  if (options.nice !== false && (!hasExplicitMin || !hasExplicitMax)) {
    const tickCount = Math.max(2, Math.round(finiteNumber(options.tickCount, DEFAULT_TICK_COUNT)));
    const nice = niceExtent(min, max, tickCount);
    if (!hasExplicitMin) min = nice.min;
    if (!hasExplicitMax) max = nice.max;
  }

  return { min, max };
}

function createPoint(
  item: NormalizedItem,
  domain: AngleDomain,
  valueExtent: { min: number; max: number },
  innerRadius: number,
  outerRadius: number,
  centerX: number,
  centerY: number,
  startAngle: number,
  angleSpan: number,
  clockwise: boolean
): RadialAreaPoint {
  const ratio = resolveAngleRatio(item, domain);
  const angle = startAngle + (clockwise ? -1 : 1) * ratio * angleSpan;
  const radius = projectRadius(item.value, valueExtent, innerRadius, outerRadius);
  const valuePoint = pointFromPolar(centerX, centerY, radius, angle);
  const minRadius = item.min == null ? undefined : projectRadius(item.min, valueExtent, innerRadius, outerRadius);
  const maxRadius = item.max == null ? undefined : projectRadius(item.max, valueExtent, innerRadius, outerRadius);
  const minPoint = minRadius == null ? undefined : pointFromPolar(centerX, centerY, minRadius, angle);
  const maxPoint = maxRadius == null ? undefined : pointFromPolar(centerX, centerY, maxRadius, angle);

  return {
    id: item.id,
    name: item.name,
    angleValue: item.angleValue,
    angle,
    angleRatio: ratio,
    value: item.value,
    min: item.min,
    max: item.max,
    radius,
    minRadius,
    maxRadius,
    x: valuePoint.x,
    y: valuePoint.y,
    minX: minPoint?.x,
    minY: minPoint?.y,
    maxX: maxPoint?.x,
    maxY: maxPoint?.y,
    dataIndex: item.dataIndex,
    raw: item.raw
  };
}

function resolveAngleRatio(item: NormalizedItem, domain: AngleDomain): number {
  if (domain.type === 'category') {
    const category = stringifyName(item.angleValue ?? item.name);
    const index = Math.max(0, domain.categories.indexOf(category));
    return domain.categories.length > 0 ? index / domain.categories.length : 0;
  }

  const rawRatio = (item.angleNumeric - domain.min) / (domain.max - domain.min || 1);
  return clamp(rawRatio, 0, 1);
}

function createRangePolygon(points: RadialAreaPoint[], closed: boolean): RadialAreaPolarPoint[] {
  const ranged = points.filter((point) => point.minRadius != null && point.maxRadius != null);
  const outer = ranged.map((point) => ({
    name: point.name,
    angle: point.angle,
    value: point.max as number,
    radius: point.maxRadius as number,
    x: point.maxX as number,
    y: point.maxY as number,
    dataIndex: point.dataIndex
  }));
  const inner = [...ranged].reverse().map((point) => ({
    name: point.name,
    angle: point.angle,
    value: point.min as number,
    radius: point.minRadius as number,
    x: point.minX as number,
    y: point.minY as number,
    dataIndex: point.dataIndex
  }));

  if (closed && outer.length > 2 && inner.length > 2) {
    return outer.concat([outer[0], inner[inner.length - 1]], inner);
  }

  return outer.concat(inner);
}

function createAngleLabels(
  domain: AngleDomain,
  points: RadialAreaPoint[],
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  angleSpan: number,
  clockwise: boolean
): RadialAreaAngleLabel[] {
  const labels = domain.type === 'category'
    ? domain.categories.map((category, index) => ({
      name: category,
      value: category,
      ratio: index / domain.categories.length
    }))
    : points.map((point) => ({
      name: point.name,
      value: point.angleValue,
      ratio: point.angleRatio
    }));

  return labels.map((label) => {
    const angle = startAngle + (clockwise ? -1 : 1) * label.ratio * angleSpan;
    const point = pointFromPolar(centerX, centerY, radius, angle);
    const placement = labelPlacement(angle);
    return {
      name: label.name,
      value: label.value,
      angle,
      x: point.x,
      y: point.y,
      align: placement.align,
      verticalAlign: placement.verticalAlign
    };
  });
}

function createRadialTicks(min: number, max: number, tickCount: number): number[] {
  if (tickCount <= 1) return [min, max];
  const step = (max - min) / (tickCount - 1);
  return Array.from({ length: tickCount }, (_, index) => roundNumber(index === tickCount - 1 ? max : min + step * index));
}

function niceExtent(min: number, max: number, tickCount: number): { min: number; max: number } {
  const span = Math.max(Math.abs(max - min), Number.EPSILON);
  const step = niceNumber(span / Math.max(1, tickCount - 1), true);
  return {
    min: Math.floor(min / step) * step,
    max: Math.ceil(max / step) * step
  };
}

function niceNumber(value: number, round: boolean): number {
  const exponent = Math.floor(Math.log10(value));
  const fraction = value / 10 ** exponent;
  let niceFraction: number;

  if (round) {
    niceFraction = fraction < 1.5 ? 1 : fraction < 3 ? 2 : fraction < 7 ? 5 : 10;
  } else {
    niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  }

  return niceFraction * 10 ** exponent;
}

function projectRadius(value: number, extent: { min: number; max: number }, innerRadius: number, outerRadius: number): number {
  const ratio = clamp((value - extent.min) / (extent.max - extent.min || 1), 0, 1);
  return innerRadius + (outerRadius - innerRadius) * ratio;
}

function pointFromPolar(centerX: number, centerY: number, radius: number, angle: number): { x: number; y: number } {
  const radians = angle * Math.PI / 180;
  return {
    x: centerX + Math.cos(radians) * radius,
    y: centerY - Math.sin(radians) * radius
  };
}

function labelPlacement(angle: number): { align: string; verticalAlign: string } {
  const radians = angle * Math.PI / 180;
  const x = Math.cos(radians);
  const y = Math.sin(radians);
  return {
    align: x > 0.18 ? 'left' : x < -0.18 ? 'right' : 'center',
    verticalAlign: y > 0.18 ? 'bottom' : y < -0.18 ? 'top' : 'middle'
  };
}

function readField(
  item: unknown,
  field: RadialAreaField,
  dimensions: string[] | undefined,
  fallbackIndex: number,
  fallbackNames: string[]
): unknown {
  if (Array.isArray(item)) {
    const dimensionIndex = typeof field === 'string' ? dimensions?.indexOf(field) : undefined;
    const index = typeof field === 'number'
      ? field
      : dimensionIndex != null && dimensionIndex >= 0
        ? dimensionIndex
        : fallbackIndex;
    return index >= 0 ? item[index] : undefined;
  }

  if (!isPlainObject(item)) return undefined;
  if (typeof field === 'string' && item[field] != null) return item[field];
  for (const fallbackName of fallbackNames) {
    if (item[fallbackName] != null) return item[fallbackName];
  }
  return undefined;
}

function normalizeRange(minValue: number, maxValue: number): { min: number; max: number } | undefined {
  const hasMin = Number.isFinite(minValue);
  const hasMax = Number.isFinite(maxValue);
  if (!hasMin || !hasMax) return undefined;
  return minValue <= maxValue
    ? { min: minValue, max: maxValue }
    : { min: maxValue, max: minValue };
}

function numericAngleValue(value: unknown): number {
  const numberValue = finiteNumber(value, NaN);
  if (Number.isFinite(numberValue)) return numberValue;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const timestamp = Date.parse(value);
    if (Number.isFinite(timestamp)) return timestamp;
  }
  return NaN;
}

function inferAngleType(items: NormalizedItem[]): RadialAreaAngleType {
  if (!items.length) return 'category';
  if (items.every((item) => Number.isFinite(item.angleNumeric))) {
    const hasDateLikeValue = items.some((item) => item.angleValue instanceof Date || (typeof item.angleValue === 'string' && Number.isFinite(Date.parse(item.angleValue))));
    return hasDateLikeValue ? 'time' : 'value';
  }
  return 'category';
}

function parseCenter(value: number | string | undefined, size: number, fallback: number): number {
  if (typeof value === 'string' && value.trim().endsWith('%')) {
    return Number.parseFloat(value) / 100 * size;
  }
  return finiteNumber(value, fallback);
}

function parseRadius(value: number | string | undefined, radiusLimit: number, fallback: number): number {
  if (typeof value === 'string' && value.trim().endsWith('%')) {
    return Number.parseFloat(value) / 100 * radiusLimit;
  }
  return finiteNumber(value, fallback);
}

function clampRadius(value: number, min: number, max: number): number {
  return clamp(Number.isFinite(value) ? value : min, min, max);
}

function normalizeDimensions(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : undefined;
}

function normalizeCategories(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string | number => typeof item === 'string' || typeof item === 'number').map((item) => String(item))
    : [];
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function readTuple<T>(value: unknown, fallback: [T, T] | undefined): [T, T] | undefined {
  return Array.isArray(value) && value.length >= 2 ? [value[0] as T, value[1] as T] : fallback;
}

function readAngleType(value: unknown): RadialAreaAngleType | undefined {
  return value === 'category' || value === 'time' || value === 'value' ? value : undefined;
}

function readFieldOption(value: unknown): RadialAreaField | undefined {
  return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}

function readRadiusOption(value: unknown): number | string | undefined {
  return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}

function firstBoolean(...values: unknown[]): boolean | undefined {
  for (const value of values) {
    if (typeof value === 'boolean') return value;
  }
  return undefined;
}

function finiteNumber(value: unknown, fallback: number | undefined): number {
  const numberValue = typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim() !== ''
      ? Number(value)
      : NaN;
  return Number.isFinite(numberValue) ? numberValue : fallback as number;
}

function roundNumber(value: number): number {
  return Number(value.toFixed(12));
}

function stringifyName(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return value == null ? '' : String(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export const __test__ = {
  normalizeItems,
  resolveAngleDomain,
  orderByAngle,
  resolveValueExtent,
  createPoint,
  resolveAngleRatio,
  createRangePolygon,
  createAngleLabels,
  createRadialTicks,
  niceExtent,
  niceNumber,
  projectRadius,
  pointFromPolar,
  labelPlacement,
  readField,
  normalizeRange,
  numericAngleValue,
  inferAngleType,
  parseCenter,
  parseRadius,
  clampRadius,
  normalizeDimensions,
  normalizeCategories,
  unique,
  readTuple,
  readAngleType,
  readFieldOption,
  readRadiusOption,
  firstBoolean,
  finiteNumber,
  roundNumber,
  stringifyName,
  clamp,
  isPlainObject
};
